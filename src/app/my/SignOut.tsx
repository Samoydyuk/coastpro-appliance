'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

/**
 * A way out, because a phone gets handed around.
 *
 * The session lasts a month on purpose — see CUSTOMER_MAX_AGE — which is right
 * for the person who owns the phone and wrong for the moment they lend it. One
 * button settles that.
 */
export function SignOut() {
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={async () => {
        await fetch('/api/my/logout', { method: 'POST' });
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
