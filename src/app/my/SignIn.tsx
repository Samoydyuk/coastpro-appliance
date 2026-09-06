'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { siteConfig } from '@/data/site-config';

/**
 * Two steps, one number, no password.
 *
 * Contractors' customers are not going to keep an account for the two times a
 * decade their dryer breaks, and a password nobody remembers is a support call,
 * not security. The number they gave when they booked is the thing they still
 * have, so it is the thing we check.
 *
 * The code step never says whether the number is known — the server answers
 * "sent" either way — so this component cannot be used to find out who somebody
 * else's repair company is.
 */
export function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/my/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setStep('code');
    } catch {
      setError('We could not reach the site. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function checkCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/my/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? 'That code is not right. Try again.');
        return;
      }
      // A server component reads the cookie, so the list has to be re-fetched
      // rather than re-rendered from state.
      router.refresh();
    } catch {
      setError('We could not reach the site. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-[60rem] px-4">
        <div className="max-w-md">
          <div className="eyebrow mb-3">Your repairs</div>
          <h1 className="headline text-3xl sm:text-4xl">
            Look up your visit
            <br />
            <span className="headline-muted">and your warranty.</span>
          </h1>
          <div className="rule-short my-7" />

          {step === 'phone' ? (
            <>
              <p className="mb-8 text-base leading-relaxed text-gray-600">
                Enter the phone number you booked with. We will text you a code — no password, and
                nothing to remember for next time.
              </p>

              <form onSubmit={sendCode} className="space-y-4">
                <Input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(949) 555-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  aria-label="Phone number"
                />
                {error && <p className="text-sm text-red-800">{error}</p>}
                <Button
                  type="submit"
                  isLoading={busy}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Text me a code
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="mb-8 text-base leading-relaxed text-gray-600">
                If that number is on one of our jobs, a code is on its way to it now. Enter it
                below.
              </p>

              <form onSubmit={checkCode} className="space-y-4">
                <Input
                  type="text"
                  name="code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  aria-label="Code"
                />
                {error && <p className="text-sm text-red-800">{error}</p>}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" isLoading={busy}>
                    Sign in
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep('phone');
                      setCode('');
                      setError(null);
                    }}
                  >
                    Use a different number
                  </Button>
                </div>
              </form>
            </>
          )}

          <div className="mt-12 border-t border-primary-500/20 pt-6">
            <p className="text-sm text-gray-600">
              Never booked with us, or the number has changed? Call{' '}
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="inline-flex items-center gap-1.5 text-ink underline underline-offset-4 hover:text-primary-600"
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                {siteConfig.contact.phone}
              </a>{' '}
              and we will find you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
