'use client';

import emailjs from '@emailjs/browser';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldHint,
  Input,
  Label,
  Select,
  Textarea,
} from '@/components/ui/field';
import type { Locale } from '@/i18n/routing';
import {
  createContactSchema,
  MESSAGE_MAX,
  type ContactFormValues,
} from '@/lib/contact-schema';
import { site, t as pick } from '@/lib/site';

/* -------------------------------------------------------------------------- */
/* Client-side rate limiting                                                   */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_KEY = 'majesta:last-quote-submit';
const RATE_LIMIT_MS = 60_000;

/**
 * Stops the same visitor double-firing the form. Deliberately trivial — the
 * real enforcement is server-side in /api/contact. localStorage can be cleared
 * by anyone who wants to; this is here to prevent accidents, not attacks.
 */
function checkClientRateLimit(): { ok: boolean; waitSeconds: number } {
  try {
    const last = Number(window.localStorage.getItem(RATE_LIMIT_KEY) ?? 0);
    const elapsed = Date.now() - last;
    if (last && elapsed < RATE_LIMIT_MS) {
      return { ok: false, waitSeconds: Math.ceil((RATE_LIMIT_MS - elapsed) / 1000) };
    }
  } catch {
    // Private browsing / storage disabled — fall through and let the server decide.
  }
  return { ok: true, waitSeconds: 0 };
}

function markSubmitted() {
  try {
    window.localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
  } catch {
    /* no-op */
  }
}

/* -------------------------------------------------------------------------- */
/* EmailJS                                                                     */
/* -------------------------------------------------------------------------- */

const EMAILJS = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
};

function emailjsConfigured(): boolean {
  return Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);
}

/* -------------------------------------------------------------------------- */
/* Form                                                                        */
/* -------------------------------------------------------------------------- */

export function ContactForm({ locale }: { locale: Locale }) {
  const t = useTranslations('contact.form');
  const tv = useTranslations('contact.validation');
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () => createContactSchema((key, values) => tv(key, values)),
    [tv],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      postalCode: '',
      service: '',
      budget: '',
      contactMethod: 'phone',
      language: locale,
      message: '',
      company: '',
    },
  });

  const messageLength = watch('message')?.length ?? 0;

  async function onSubmit(values: ContactFormValues) {
    const limit = checkClientRateLimit();
    if (!limit.ok) {
      toast.warning(t('rateLimitTitle'), {
        description: t('rateLimitBody', {
          seconds: limit.waitSeconds,
          phone: site.phone,
        }),
      });
      return;
    }

    setSubmitting(true);

    const serviceName =
      site.serviceCatalog.find((s) => s.slug === values.service)?.name;
    const budgetLabel = site.budgetRanges.find((b) => b.value === values.budget)
      ?.label;
    const methodLabel = site.contactMethods.find(
      (c) => c.value === values.contactMethod,
    )?.label;

    /*
     * These key names are the contract with the EmailJS template. If you rename
     * one here you must rename it in the template too — EmailJS silently renders
     * an empty string for an unknown variable rather than erroring, so a typo
     * shows up as a blank line in the email, not as a failure.
     * Full list in EMAILJS_SETUP.md.
     */
    const templateParams = {
      from_name: values.name,
      from_email: values.email,
      reply_to: values.email,
      from_phone: values.phone,
      postal_code: values.postalCode || '—',
      service: serviceName ? pick(serviceName, locale) : values.service,
      budget: budgetLabel ? pick(budgetLabel, locale) : values.budget,
      contact_method: methodLabel
        ? pick(methodLabel, locale)
        : values.contactMethod,
      preferred_language:
        values.language === 'fr' ? t('languageFr') : t('languageEn'),
      message: values.message,
      submitted_at: new Date().toISOString(),
      page_locale: locale,
    };

    let delivered = false;
    if (emailjsConfigured()) {
      try {
        await emailjs.send(
          EMAILJS.serviceId!,
          EMAILJS.templateId!,
          templateParams,
          { publicKey: EMAILJS.publicKey! },
        );
        delivered = true;
      } catch (error) {
        console.error('[contact] EmailJS send failed:', error);
      }
    }

    // Always hit the server fallback, delivered or not. Duplicate records are
    // cheap; a lost renovation lead is not.
    let stored = false;
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          locale,
          emailjsDelivered: delivered,
        }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 429) {
        setSubmitting(false);
        toast.warning(t('rateLimitTitle'), {
          description: t('rateLimitBody', {
            seconds: data?.retryAfter ?? 60,
            phone: site.phone,
          }),
        });
        return;
      }

      stored = Boolean(data?.ok);
    } catch (error) {
      console.error('[contact] fallback POST failed:', error);
    }

    setSubmitting(false);

    if (delivered) {
      markSubmitted();
      toast.success(t('successTitle'), { description: t('successBody') });
      reset();
      return;
    }

    if (stored) {
      // The lead is safe on the server, but nobody has been emailed about it.
      markSubmitted();
      toast.success(t('savedTitle'), {
        description: t('savedBody', { phone: site.phone }),
      });
      reset();
      return;
    }

    toast.error(t('errorTitle'), {
      description: t('errorBody', { phone: site.phone }),
    });
  }

  const requiredLabel = useTranslations('common')('required');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="border border-bone/10 bg-ink-900 p-6 sm:p-8"
    >
      <fieldset disabled={submitting} className="min-w-0">
        <legend className="sr-only">{t('legend')}</legend>

        <p className="mb-6 text-xs text-muted-dark">
          {t('requiredLegend', { marker: '*' })}
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="name" required requiredLabel={requiredLabel}>
              {t('nameLabel')}
            </Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder={t('namePlaceholder')}
              invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
            <FieldError id="name-error">{errors.name?.message}</FieldError>
          </Field>

          <Field>
            <Label htmlFor="email" required requiredLabel={requiredLabel}>
              {t('emailLabel')}
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            <FieldError id="email-error">{errors.email?.message}</FieldError>
          </Field>

          <Field>
            <Label htmlFor="phone" required requiredLabel={requiredLabel}>
              {t('phoneLabel')}
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t('phonePlaceholder')}
              invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              {...register('phone')}
            />
            <FieldError id="phone-error">{errors.phone?.message}</FieldError>
          </Field>

          <Field>
            <Label htmlFor="postalCode">{t('postalCodeLabel')}</Label>
            <Input
              id="postalCode"
              autoComplete="postal-code"
              placeholder={t('postalCodePlaceholder')}
              invalid={Boolean(errors.postalCode)}
              aria-describedby={
                errors.postalCode ? 'postalCode-error' : 'postalCode-hint'
              }
              {...register('postalCode')}
            />
            <FieldError id="postalCode-error">
              {errors.postalCode?.message}
            </FieldError>
            {!errors.postalCode ? (
              <FieldHint id="postalCode-hint">{t('postalCodeHint')}</FieldHint>
            ) : null}
          </Field>

          <Field>
            <Label htmlFor="service" required requiredLabel={requiredLabel}>
              {t('serviceLabel')}
            </Label>
            <Select
              id="service"
              invalid={Boolean(errors.service)}
              aria-describedby={errors.service ? 'service-error' : undefined}
              {...register('service')}
            >
              <option value="">{t('servicePlaceholder')}</option>
              {site.serviceCatalog.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {pick(service.name, locale)}
                </option>
              ))}
            </Select>
            <FieldError id="service-error">{errors.service?.message}</FieldError>
          </Field>

          <Field>
            <Label htmlFor="budget" required requiredLabel={requiredLabel}>
              {t('budgetLabel')}
            </Label>
            <Select
              id="budget"
              invalid={Boolean(errors.budget)}
              aria-describedby={errors.budget ? 'budget-error' : undefined}
              {...register('budget')}
            >
              <option value="">{t('budgetPlaceholder')}</option>
              {site.budgetRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {pick(range.label, locale)}
                </option>
              ))}
            </Select>
            <FieldError id="budget-error">{errors.budget?.message}</FieldError>
          </Field>

          <Field>
            <Label htmlFor="contactMethod" required requiredLabel={requiredLabel}>
              {t('contactMethodLabel')}
            </Label>
            <Select
              id="contactMethod"
              invalid={Boolean(errors.contactMethod)}
              aria-describedby={
                errors.contactMethod ? 'contactMethod-error' : undefined
              }
              {...register('contactMethod')}
            >
              {site.contactMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {pick(method.label, locale)}
                </option>
              ))}
            </Select>
            <FieldError id="contactMethod-error">
              {errors.contactMethod?.message}
            </FieldError>
          </Field>

          <Field>
            <Label htmlFor="language" required requiredLabel={requiredLabel}>
              {t('languageLabel')}
            </Label>
            <Select
              id="language"
              invalid={Boolean(errors.language)}
              aria-describedby={errors.language ? 'language-error' : undefined}
              {...register('language')}
            >
              <option value="fr">{t('languageFr')}</option>
              <option value="en">{t('languageEn')}</option>
            </Select>
            <FieldError id="language-error">{errors.language?.message}</FieldError>
          </Field>

          <Field className="sm:col-span-2">
            <Label htmlFor="message" required requiredLabel={requiredLabel}>
              {t('messageLabel')}
            </Label>
            <Textarea
              id="message"
              rows={6}
              maxLength={MESSAGE_MAX}
              placeholder={t('messagePlaceholder')}
              invalid={Boolean(errors.message)}
              aria-describedby={
                errors.message ? 'message-error message-hint' : 'message-hint'
              }
              {...register('message')}
            />
            <div className="flex items-start justify-between gap-4">
              <FieldError id="message-error">{errors.message?.message}</FieldError>
              <FieldHint id="message-hint" className="ml-auto shrink-0 tabular-nums">
                {t('messageHint', { count: messageLength, max: MESSAGE_MAX })}
              </FieldHint>
            </div>
          </Field>
        </div>

        {/*
          Honeypot. `hidden` keeps it out of the accessibility tree entirely and
          tabIndex={-1} keeps it out of the tab order, so no real user can reach
          it — while a form-filling bot, which reads the DOM, will.
        */}
        <div hidden aria-hidden="true">
          <label htmlFor="company">{t('honeypotLabel')}</label>
          <input
            id="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('company')}
          />
        </div>

        <p className="mt-7 text-xs leading-relaxed text-muted-dark">
          {t('consentNote')}
        </p>

        <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">
          {submitting ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin" />
              {t('submitting')}
            </>
          ) : (
            <>
              <Send aria-hidden="true" />
              {t('submit')}
            </>
          )}
        </Button>

        {/* Announces the busy state to assistive tech without a visual change. */}
        <span aria-live="polite" className="sr-only">
          {submitting ? t('submitting') : ''}
        </span>
      </fieldset>
    </form>
  );
}
