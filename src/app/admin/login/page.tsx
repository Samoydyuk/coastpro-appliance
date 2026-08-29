'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button, Input } from '@/components/ui';
import { useT } from '@/components/admin/LanguageProvider';

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        // The server's own wording when it has one — it knows which of the two
        // fields was wrong, and this screen does not.
        setError(body?.error ?? t('settings.login.failed'));
        return;
      }
      router.replace(params.get('next') || '/admin');
      router.refresh();
    } catch {
      setError(t('settings.unreachable'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-label text-ink">
          CoastPro
        </h1>
        <p className="mt-1 text-sm text-gray-600">{t('settings.login.console')}</p>
      </div>

      <Input
        name="password"
        type="password"
        label={t('settings.login.password')}
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      {/* inputMode numeric so phones open the number pad; one-time-code lets
          both iOS and password managers fill it without being asked. */}
      <Input
        name="code"
        label={t('settings.login.code')}
        helperText={t('settings.login.codeHint')}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
        error={error ?? undefined}
      />

      <Button type="submit" className="w-full" isLoading={busy}>
        {t('settings.login.submit')}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
