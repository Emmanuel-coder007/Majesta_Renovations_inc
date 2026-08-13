import { randomUUID } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { NextResponse } from 'next/server';

import { serverContactSchema } from '@/lib/contact-schema';

/**
 * Server-side lead fallback.
 *
 * EmailJS delivers from the browser, which means a bad key, an ad-blocker, a
 * quota limit or an offline moment all silently lose a lead. This route is the
 * safety net: the form posts here regardless of whether EmailJS succeeded, and
 * the submission is persisted to disk. A renovation lead is worth far more than
 * the few milliseconds this costs.
 *
 * Everything is re-validated here. Client-side Zod is a UX affordance, not a
 * security boundary — this endpoint is reachable directly.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                               */
/* -------------------------------------------------------------------------- */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const MAX_TRACKED_IPS = 5_000;

/**
 * In-memory sliding window, keyed by IP.
 *
 * Caveat worth knowing before you rely on it: this is per-instance state. On
 * Vercel or any serverless host it resets on cold start and is not shared
 * between concurrent lambdas, so it throttles casual abuse but is not a real
 * defence against a determined flood. For that, put a proper rate limiter
 * (Upstash, Vercel Firewall, Cloudflare) in front of the route.
 */
const hits = new Map<string, number[]>();

function rateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((ts) => now - ts < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    const oldest = Math.min(...recent);
    return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) };
  }

  recent.push(now);
  hits.set(ip, recent);

  // Crude bound so a long-running instance cannot grow the map without limit.
  if (hits.size > MAX_TRACKED_IPS) {
    for (const [key, stamps] of hits) {
      if (stamps.every((ts) => now - ts >= WINDOW_MS)) hits.delete(key);
      if (hits.size <= MAX_TRACKED_IPS) break;
    }
  }

  return { ok: true, retryAfter: 0 };
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                 */
/* -------------------------------------------------------------------------- */

function leadsDir(): string {
  // On Vercel the filesystem is read-only apart from /tmp — set LEADS_DIR=/tmp/leads
  // there, and forward the leads onward. See README → Deploying to Vercel.
  return resolve(process.cwd(), process.env.LEADS_DIR || './data');
}

async function persistLead(lead: Record<string, unknown>): Promise<boolean> {
  try {
    const dir = leadsDir();
    await mkdir(dir, { recursive: true });
    const stamp = new Date();
    const file = join(
      dir,
      `leads-${stamp.getUTCFullYear()}-${String(stamp.getUTCMonth() + 1).padStart(2, '0')}.jsonl`,
    );
    // JSON Lines: append-only, survives partial writes, trivially greppable.
    await appendFile(file, `${JSON.stringify(lead)}\n`, 'utf8');
    return true;
  } catch (error) {
    // Never fail the request because persistence failed — the visitor has done
    // nothing wrong and EmailJS may well have delivered the lead already.
    console.error('[contact] failed to persist lead:', error);
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                     */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  const ip = clientIp(request);

  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retryAfter: limit.retryAfter },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400 },
    );
  }

  const body = payload as Record<string, unknown>;
  const parsed = serverContactSchema.safeParse(body);

  if (!parsed.success) {
    // A tripped honeypot is a bot, not a user. Return 200 so the bot cannot
    // tell it was caught, but persist nothing.
    if (typeof body?.company === 'string' && body.company.length > 0) {
      return NextResponse.json({ ok: true, stored: false });
    }
    return NextResponse.json(
      {
        ok: false,
        error: 'validation_failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          code: i.code,
        })),
      },
      { status: 422 },
    );
  }

  const { company: _honeypot, ...lead } = parsed.data;

  const stored = await persistLead({
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    ...lead,
    meta: {
      ip,
      userAgent: request.headers.get('user-agent') ?? null,
      // Whether the browser already managed to send this through EmailJS.
      // Useful when reconciling the file against the inbox.
      emailjsDelivered: body.emailjsDelivered === true,
      locale: typeof body.locale === 'string' ? body.locale : null,
    },
  });

  return NextResponse.json({ ok: true, stored });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
}
