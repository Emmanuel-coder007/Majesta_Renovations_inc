# EmailJS setup

The contact form sends directly from the browser via
[EmailJS](https://www.emailjs.com), with a server-side fallback at
`/api/contact` that persists every submission to disk regardless of whether
EmailJS succeeds (see [README.md](README.md) → "Contact form & leads").

## 1. Create an EmailJS account and email service

1. Sign up at [emailjs.com](https://www.emailjs.com) (free tier: 200 emails/month).
2. **Email Services** → **Add New Service** → connect the inbox that should
   receive leads (Gmail, Outlook, or any SMTP account).
3. Note the **Service ID** (e.g. `service_abc1234`).

## 2. Create an email template

1. **Email Templates** → **Create New Template**.
2. Set the **To email** to the address that should receive leads.
3. Set **Reply To** to `{{reply_to}}` so replying goes straight to the
   customer.
4. Build the template body using **exactly** these variable names — the code
   in [`src/components/sections/contact-form.tsx`](src/components/sections/contact-form.tsx)
   sends this exact set and nothing else:

   | Variable | Contains |
   | --- | --- |
   | `{{from_name}}` | Customer's full name |
   | `{{from_email}}` | Customer's email |
   | `{{reply_to}}` | Same as `from_email`, for the Reply-To header |
   | `{{from_phone}}` | Customer's phone number |
   | `{{postal_code}}` | Project postal code, or `—` if left blank |
   | `{{service}}` | Localised service name the customer selected |
   | `{{budget}}` | Localised budget range |
   | `{{contact_method}}` | Localised preferred contact method |
   | `{{preferred_language}}` | "French" / "English" (or FR equivalents) |
   | `{{message}}` | Project description |
   | `{{submitted_at}}` | ISO 8601 timestamp |
   | `{{page_locale}}` | `fr` or `en` — which site locale the form was on |

   A minimal template body:

   ```
   New quote request from {{from_name}}

   Service: {{service}}
   Budget: {{budget}}
   Preferred contact: {{contact_method}} ({{preferred_language}})
   Phone: {{from_phone}}
   Email: {{from_email}}
   Postal code: {{postal_code}}

   Message:
   {{message}}

   Submitted {{submitted_at}} from the {{page_locale}} site.
   ```

5. Save and note the **Template ID** (e.g. `template_xyz9876`).

## 3. Get the public key

**Account** → **General** → copy the **Public Key**.

## 4. Wire it into the project

Copy `.env.example` to `.env.local` and fill in the three values:

```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc1234
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz9876
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

Restart the dev server after editing `.env.local` — Next.js only reads
`NEXT_PUBLIC_*` variables at build/start time.

**Never commit `.env.local`.** Only `.env.example` (with empty values) is
tracked in git.

## 5. Test it

1. `npm run dev`, open the site, fill in the contact form, submit.
2. Confirm the email arrives at the connected inbox.
3. Check EmailJS's **Email History** tab to confirm delivery and see the
   rendered template.

## What happens if EmailJS is not configured or fails

The form still works. `src/components/sections/contact-form.tsx` checks
whether all three environment variables are present before attempting
`emailjs.send()`. Either way — missing config, a bad key, a network failure,
or a blocked third-party script — the form **always** also submits to
`/api/contact`, which validates the payload server-side and appends it to a
local JSON Lines file (see [README.md](README.md) → "Contact form & leads").
The visitor sees a slightly different success message in that case ("your
request has been saved") rather than a silent failure, and is given the phone
number as a fallback.

## Production considerations

- **Rate limiting**: EmailJS enforces its own per-account send limits. The
  app additionally rate-limits both client-side (localStorage, 60s) and
  server-side (`/api/contact`, per-IP, 3 requests/minute) — see the comments
  in [`src/app/api/contact/route.ts`](src/app/api/contact/route.ts) for the
  in-memory limiter's caveats on serverless hosts.
- **Domain allowlist**: in EmailJS, under **Account** → **Security**, restrict
  the public key to your production domain(s) once deployed, so the key
  cannot be used to send from an arbitrary site if it's ever scraped from your
  bundle (client-side keys are, by nature, visible in the browser).
- **Spam**: the form has a honeypot field (`company`) that a human never sees
  or reaches by tab order; anything that fills it is silently dropped by the
  server route without being stored or emailed.
