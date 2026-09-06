import { cookies } from 'next/headers';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui';
import { CUSTOMER_COOKIE } from '@/lib/cookies';
import { readCustomerToken } from '@/lib/customer-session';
import { fetchVisits, VisitsUnavailableError, type CustomerVisits } from '@/lib/customer/client';
import { siteConfig } from '@/data/site-config';
import { SignIn } from './SignIn';
import { VisitCard } from './VisitCard';
import { SignOut } from './SignOut';

/**
 * Everything CoastPro has done for one household.
 *
 * Rendered on the server on every request, never cached: a balance settled this
 * afternoon has to read as settled, and a copy of somebody's repair history in
 * a shared edge cache is the outcome this whole feature is designed against.
 *
 * The Esquire question is not answered here. Jobs that came from the dispatcher
 * are filtered out upstream, in `/v1/customer/visits`, next to the data and by
 * the `localId` prefix rather than by `brandId` — which is the column the
 * dispatcher sync does not set. Doing it here instead would put one forgotten
 * `.filter()` between an Esquire job and a CoastPro letterhead.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MyRepairsPage() {
  const store = await cookies();
  const claims = await readCustomerToken(store.get(CUSTOMER_COOKIE)?.value);

  if (!claims) return <SignIn />;

  let data: CustomerVisits | null = null;
  let failed = false;
  try {
    data = await fetchVisits(claims.phone);
  } catch (error) {
    // A JobPocket outage is our problem, not the customer's, and it must not
    // look like "we have no record of you".
    failed = error instanceof VisitsUnavailableError;
    if (!failed) throw error;
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-[60rem] px-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="eyebrow mb-3">Your repairs</div>
            <h1 className="headline text-2xl sm:text-3xl">
              {data?.client?.name ? `Hello, ${data.client.name.split(' ')[0]}` : 'Your visits'}
            </h1>
          </div>
          <SignOut />
        </div>
        <div className="rule-short my-7" />

        {failed && (
          <div className="border border-primary-500/25 p-6">
            <p className="text-base text-gray-600">
              We cannot reach our system just now, so we cannot show your visits. Nothing is lost —
              try again in a minute, or call{' '}
              <a
                href={`tel:${siteConfig.contact.phoneClean}`}
                className="text-ink underline underline-offset-4"
              >
                {siteConfig.contact.phone}
              </a>
              .
            </p>
          </div>
        )}

        {!failed && data && data.visits.length === 0 && (
          <div className="max-w-prose border border-primary-500/25 p-8">
            <h2 className="headline mb-4 text-xl">Nothing on this number yet</h2>
            <p className="mb-6 text-base leading-relaxed text-gray-600">
              We have no CoastPro visits filed against this phone number. If we have worked for you
              under a different number, give us a ring and we will put them together.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${siteConfig.contact.phoneClean}`}>
                <Button leftIcon={<Phone className="h-4 w-4" />}>{siteConfig.contact.phone}</Button>
              </a>
              <Link href="/book-appointment">
                <Button variant="outline" className="border-ink text-ink hover:bg-ink hover:text-cream">
                  Book a visit
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!failed && data && data.visits.length > 0 && (
          <>
            <p className="mb-8 max-w-prose text-base leading-relaxed text-gray-600">
              {data.visits.length} visit{data.visits.length === 1 ? '' : 's'} on record. Each one
              shows what we found, what we did, and whether the warranty on it is still running.
            </p>
            <div className="space-y-5">
              {data.visits.map((visit) => (
                <VisitCard key={visit.id} visit={visit} timeZone={data.timeZone} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
