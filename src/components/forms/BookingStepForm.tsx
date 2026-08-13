'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, MapPin, Phone } from 'lucide-react';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { siteConfig } from '@/data/site-config';
import { trackFormSubmit } from '@/lib/gtag';
import type { ArrivalWindow, BookingService } from '@/lib/jobpocket';

interface BookingFormProps {
  /** Straight from JobPocket, so the two lists cannot drift apart. */
  services: BookingService[];
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  serviceId: string;
  brand: string;
  problem: string;
}

const EMPTY: FormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  serviceId: '',
  brand: '',
  problem: '',
};

/** The next `count` days, as YYYY-MM-DD in the visitor's own timezone. */
function nextDays(count: number): Array<{ value: string; weekday: string; day: string }> {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      value,
      weekday: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });
}

export function BookingStepForm({ services }: BookingFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'form', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const days = useRef(nextDays(14)).current;
  const [date, setDate] = useState(days[0].value);
  const [windows, setWindows] = useState<ArrivalWindow[]>([]);
  const [loadingWindows, setLoadingWindows] = useState(false);
  const [picked, setPicked] = useState<ArrivalWindow | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const addressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** One id per filled-in form, so a double submit is not a second request. */
  const externalId = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())
  );

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Availability depends on how long the chosen job takes, so reload on both.
  useEffect(() => {
    let cancelled = false;
    setLoadingWindows(true);
    setPicked(null);

    const params = new URLSearchParams({ date });
    if (form.serviceId) params.set('serviceId', form.serviceId);

    fetch(`/api/booking/windows?${params}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setWindows(d.windows ?? []); })
      .catch(() => { if (!cancelled) setWindows([]); })
      .finally(() => { if (!cancelled) setLoadingWindows(false); });

    return () => { cancelled = true; };
  }, [date, form.serviceId]);

  const lookupAddress = useCallback((value: string) => {
    if (value.trim().length < 4) { setSuggestions([]); return; }
    fetch(`/api/booking/address?q=${encodeURIComponent(value)}`)
      .then((r) => r.json())
      .then((d) => setSuggestions((d.suggestions ?? []).slice(0, 5)))
      .catch(() => setSuggestions([]));
  }, []);

  const handleAddress = (value: string) => {
    set('address', value);
    if (addressTimer.current) clearTimeout(addressTimer.current);
    addressTimer.current = setTimeout(() => lookupAddress(value), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Please tell us your name';
    if (!form.phone.trim()) next.phone = 'We need a phone number to confirm';
    if (!form.serviceId) next.serviceId = 'Please pick what needs fixing';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'That email address looks wrong';
    }
    if (Object.keys(next).length) { setErrors(next); return; }

    setIsSubmitting(true);
    setErrors({});

    try {
      const service = services.find((s) => s.id === form.serviceId);
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          serviceName: service?.name,
          windowStartISO: picked?.startISO,
          windowEndISO: picked?.endISO,
          externalId: externalId.current,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error);
      }

      trackFormSubmit('booking_form');
      setIsSubmitted(true);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error && error.message
            ? error.message
            : `We couldn't submit your request. Please call us at ${siteConfig.contact.phone}.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-10">
        <div className="icon-disc w-16 h-16 mx-auto mb-6 border-ink text-ink">
          <CheckCircle className="h-7 w-7" strokeWidth={1.25} />
        </div>
        <h3 className="headline text-2xl mb-3">Request received.</h3>
        <p className="text-gray-600 max-w-prose mx-auto mb-2">
          {picked
            ? `We'll confirm ${picked.label} and call no later than ${siteConfig.appointment.noticeMinutes} minutes before arriving.`
            : "We'll call shortly to agree a time that suits you."}
        </p>
        <p className="text-gray-600">
          Need us sooner?{' '}
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="font-heading font-semibold text-ink hover:text-primary-600"
          >
            {siteConfig.contact.phone}
          </a>
        </p>
      </div>
    );
  }

  const serviceOptions = [
    { value: '', label: 'Select what needs fixing' },
    ...services.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 min-w-0">
      {errors.form && (
        <div className="p-4 border border-red-800/40 rounded-card text-red-800">{errors.form}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          placeholder="John Smith"
        />
        <Input
          label="Phone Number"
          type="tel"
          required
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          error={errors.phone}
          placeholder={siteConfig.contact.phone}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Select
          label="What needs fixing"
          required
          options={serviceOptions}
          value={form.serviceId}
          onChange={(e) => set('serviceId', e.target.value)}
          error={errors.serviceId}
        />
        <Input
          label="Brand"
          helperText="Optional — helps us bring the right parts"
          value={form.brand}
          onChange={(e) => set('brand', e.target.value)}
          placeholder="Samsung, LG, Sub-Zero…"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* One line with suggestions, rather than four boxes to tab through. */}
        <div className="relative">
          <Input
            label="Service Address"
            helperText="Optional — we can take it on the confirmation call"
            value={form.address}
            onChange={(e) => handleAddress(e.target.value)}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Start typing your address…"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-20 inset-x-0 top-full mt-1 bg-cream-light border border-primary-500/25 max-h-56 overflow-auto">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { set('address', s); setSuggestions([]); }}
                    className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm text-gray-600 hover:bg-cream-dark/60 hover:text-ink transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5 mt-1 shrink-0 text-primary-500" strokeWidth={2} />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Input
          label="Email"
          type="email"
          helperText="Optional — for the confirmation"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          placeholder="john@example.com"
        />
      </div>

      <Textarea
        label="Describe the problem"
        helperText="Optional"
        rows={3}
        value={form.problem}
        onChange={(e) => set('problem', e.target.value)}
        placeholder="Not draining, makes a grinding noise, error code F22…"
      />

      {/* Arrival windows, straight off the technician's calendar */}
      <div>
        <div className="eyebrow mb-4">Preferred arrival window</div>

        {/* -mx-1/px-1 so the focus ring of the first chip is not clipped */}
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2 mb-5">
          {days.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDate(d.value)}
              className={`shrink-0 px-3 sm:px-4 py-3 border text-center transition-colors ${
                date === d.value
                  ? 'border-ink bg-ink text-cream'
                  : 'border-primary-500/25 text-gray-600 hover:border-ink hover:text-ink'
              }`}
            >
              <span className="block font-heading text-[10px] font-semibold uppercase tracking-label">
                {d.weekday}
              </span>
              <span className="block text-sm mt-1">{d.day}</span>
            </button>
          ))}
        </div>

        {loadingWindows ? (
          <p className="text-sm text-gray-600">Checking the calendar…</p>
        ) : windows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {windows.map((w) => (
              <button
                key={w.startISO}
                type="button"
                onClick={() => setPicked(picked?.startISO === w.startISO ? null : w)}
                className={`px-3 py-3 border font-heading text-[11px] font-semibold uppercase tracking-label text-center transition-colors ${
                  picked?.startISO === w.startISO
                    ? 'border-ink bg-ink text-cream'
                    : 'border-primary-500/25 text-ink hover:border-ink'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Nothing free that day. Try another, or send the form without a time and we&apos;ll call
            to arrange one.
          </p>
        )}
      </div>

      <div className="border-t border-primary-500/20 pt-8">
        <Button type="submit" size="lg" className="w-full sm:w-auto" isLoading={isSubmitting}>
          {picked ? 'Request this time' : 'Request a callback'}
        </Button>
        <p className="text-sm text-gray-600 mt-5">
          No charge to ask. ${siteConfig.serviceCall.minimum} minimum service call —{' '}
          {siteConfig.serviceCall.note.toLowerCase()}. Prefer to talk?{' '}
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="inline-flex items-center gap-1.5 font-heading font-semibold text-ink hover:text-primary-600"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2} />
            {siteConfig.contact.phone}
          </a>
        </p>
      </div>
    </form>
  );
}
