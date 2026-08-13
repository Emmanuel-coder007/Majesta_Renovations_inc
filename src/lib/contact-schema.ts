import { z } from 'zod';

import { site } from './site';

export const MESSAGE_MAX = 1500;
export const MESSAGE_MIN = 20;
export const NAME_MAX = 80;

/**
 * Canadian phone numbers.
 *
 * Accepts the formats people actually type: `(514) 555-0123`, `514-555-0123`,
 * `5145550123`, `+1 514 555 0123`. The `[2-9]` on the area code and exchange
 * reflects the real NANP rule — neither may start with 0 or 1 — which quietly
 * catches a lot of typos and junk submissions.
 */
export const CANADIAN_PHONE =
  /^(\+?1[\s.-]?)?\(?([2-9]\d{2})\)?[\s.-]?([2-9]\d{2})[\s.-]?(\d{4})$/;

/**
 * Quebec postal codes. The province's forward sortation areas all begin with
 * G, H or J — H being the island of Montreal. Letters D, F, I, O, Q and U are
 * never used in Canadian postal codes because they are too easily confused with
 * digits or with each other.
 */
export const QUEBEC_POSTAL_CODE =
  /^[GHJghj]\d[ABCEGHJ-NPRSTV-Zabceghj-nprstv-z][ -]?\d[ABCEGHJ-NPRSTV-Zabceghj-nprstv-z]\d$/;

export const SERVICE_SLUGS = site.serviceCatalog.map((s) => s.slug);
export const BUDGET_VALUES = site.budgetRanges.map((b) => b.value);
export const CONTACT_METHOD_VALUES = site.contactMethods.map((c) => c.value);

/** Translator shape — `useTranslations('contact.validation')` satisfies this. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

export function createContactSchema(t: Translate) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: t('nameMin') })
      .max(NAME_MAX, { message: t('nameMax') }),

    email: z
      .string()
      .trim()
      .min(1, { message: t('emailInvalid') })
      .email({ message: t('emailInvalid') }),

    phone: z
      .string()
      .trim()
      .regex(CANADIAN_PHONE, { message: t('phoneInvalid') }),

    // Optional, but validated when supplied — it tells us straight away whether
    // the project falls inside the five service regions.
    postalCode: z
      .string()
      .trim()
      .regex(QUEBEC_POSTAL_CODE, { message: t('postalCodeInvalid') })
      .or(z.literal(''))
      .optional(),

    service: z
      .string()
      .refine((v) => SERVICE_SLUGS.includes(v), {
        message: t('serviceRequired'),
      }),

    budget: z
      .string()
      .refine((v) => BUDGET_VALUES.includes(v), { message: t('budgetRequired') }),

    contactMethod: z
      .string()
      .refine((v) => CONTACT_METHOD_VALUES.includes(v), {
        message: t('contactMethodRequired'),
      }),

    language: z.enum(['fr', 'en'], { message: t('languageRequired') }),

    message: z
      .string()
      .trim()
      .min(MESSAGE_MIN, { message: t('messageMin') })
      .max(MESSAGE_MAX, { message: t('messageMax', { max: MESSAGE_MAX }) }),

    /*
     * Honeypot. Hidden from sighted users and from screen readers, and skipped
     * in the tab order — a human never fills it in, so anything non-empty is a
     * bot. Kept as a normal string field so the bot sees a plausible target.
     */
    company: z
      .string()
      .max(0, { message: t('botDetected') })
      .optional()
      .or(z.literal('')),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactSchema>>;

/** Server-side schema: keys pass straight through as messages. */
export const serverContactSchema = createContactSchema((key) => key);
