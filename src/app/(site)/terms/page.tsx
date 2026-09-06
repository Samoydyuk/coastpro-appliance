import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader, LegalSection } from '@/components/sections';
import { siteConfig } from '@/data/site-config';
import { getServiceBySlug } from '@/data/services';

const LAST_UPDATED = 'August 9, 2026';
const ventCleaning = getServiceBySlug('dryer-vent-cleaning');

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms that apply when you book appliance repair with ${siteConfig.name} in Orange County.`,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of"
        titleMuted="service."
        subtitle={`The terms that apply when you book work with us. Last updated ${LAST_UPDATED}.`}
      />

      <div className="bg-cream py-12">
        <div className="container mx-auto px-4">
          <LegalSection number="01" title="These Terms">
            <p>
              These terms apply to this website and to appliance repair and maintenance work carried
              out by {siteConfig.name} in Orange County, California. Booking an appointment means
              you accept them.
            </p>
          </LegalSection>

          <LegalSection number="02" title="Service Call And Pricing">
            <p>
              Our minimum service call is ${siteConfig.serviceCall.minimum}. It covers the visit, a
              full diagnosis, and {siteConfig.serviceCall.includes} — that work is not billed on top
              of the call.
            </p>
            <p>
              Anything beyond that is quoted before it is carried out. No parts are ordered and no
              repair is started until you approve the quote.
            </p>
            <p>
              Where you approve a repair, the service call is credited against it as labor rather
              than charged separately. You pay the quoted price for the repair, not the repair plus
              a visit. It is charged on its own only where no repair is approved — the diagnosis
              was still done and the visit still made.
            </p>
            <p>
              Price ranges shown on our service pages are typical figures, not a cap. High-end
              brands and faults that are difficult to access can run higher, which is why the quote
              rather than the range is what binds.
            </p>
          </LegalSection>

          {ventCleaning?.pricing && (
            <LegalSection number="03" title="Dryer Vent Cleaning">
              <p>
                Dryer vent cleaning carries a ${ventCleaning.pricing.minimum} minimum order, which
                covers the first {ventCleaning.pricing.includedFeet} feet of duct. Each additional
                foot is {ventCleaning.pricing.lines[1].value}.
              </p>
              <p>
                We do not perform work at height. Where the vent terminates in a roof cap that
                cannot be cleaned without going onto the roof, we clean what can be reached safely
                and the ${ventCleaning.pricing.minimum} minimum order applies.
              </p>
            </LegalSection>
          )}

          <LegalSection number="04" title="Appointments">
            <p>
              We book a {siteConfig.appointment.arrivalWindow} arrival window and call no later than{' '}
              {siteConfig.appointment.noticeMinutes} minutes before arriving. Same-day service is
              offered for appointments booked before noon, subject to availability.
            </p>
            <p>
              Please let us know as early as you can if you need to reschedule. Someone aged 18 or
              over needs to be present at the property for the appointment, and the appliance needs
              to be accessible.
            </p>
          </LegalSection>

          <LegalSection number="05" title="Warranty">
            <p>
              Repairs carry a {siteConfig.trustSignals.warrantyDays}-day workmanship warranty. If
              the same fault returns within {siteConfig.trustSignals.warrantyDays} days of our
              repair, we return and put it right at no further charge.
            </p>
            <p>
              The warranty covers our work and the parts we supplied. It does not cover a new and
              unrelated fault, damage from misuse, accident, power surge, pests or water, work
              carried out by someone else afterwards, or an appliance that was already at the end of
              its serviceable life and was accepted for repair on that basis.
            </p>
            <p>
              Where you supply the part yourself, we warrant our labour in fitting it and nothing
              more: a part we did not choose and did not buy is not one we can stand behind. We will
              say so at the time and it is noted on your paperwork.
            </p>
            <p>Maintenance work such as dryer vent cleaning is not a repair and carries no repair warranty.</p>
            <p>
              Some jobs carry a longer or shorter period than the standard{' '}
              {siteConfig.trustSignals.warrantyDays} days, agreed before the work starts. Where they
              do, the period written on your estimate or invoice is the one that applies. You can
              check it, and the date it runs to, at any time under{' '}
              <Link href="/my" className="underline underline-offset-4 hover:text-ink">
                your repairs
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection number="06" title="Payment">
            <p>
              Payment is due on completion of the work. We accept major credit and debit cards, cash
              and checks.
            </p>
          </LegalSection>

          <LegalSection number="07" title="Parts">
            <p>
              We fit OEM parts where we can, and high-quality equivalents where an OEM part is
              unavailable or where it saves you money without affecting the result. Parts carried on
              our vehicles cover most common repairs; anything else is normally ordered within one
              to two business days and fitted on a return visit.
            </p>
          </LegalSection>

          <LegalSection number="08" title="What We Do Not Do">
            <p>
              We do not carry out work at height or on roofs, gas line alterations, electrical work
              beyond the appliance connection, or repairs to an appliance that is unsafe to operate.
              Where a fault is outside what we do, we will say so and, where we can, point you to
              someone who handles it.
            </p>
          </LegalSection>

          <LegalSection number="09" title="Liability">
            <p>
              We carry out work with reasonable skill and care. Except where the law does not allow
              it to be limited, our liability for any claim connected with the work is limited to
              the amount you paid us for that work.
            </p>
            <p>
              We are not responsible for loss that was not reasonably foreseeable, including spoiled
              food, lost income or the cost of alternative arrangements while an appliance is out of
              use.
            </p>
          </LegalSection>

          <LegalSection number="10" title="This Website">
            <p>
              The content here is provided for general information. Prices, availability and service
              areas can change. The troubleshooting information on our service pages is general
              guidance and is not a substitute for a technician diagnosing your appliance.
            </p>
          </LegalSection>

          <LegalSection number="11" title="Governing Law">
            <p>
              These terms are governed by the laws of the State of California, and any dispute will
              be handled in the courts of Orange County, California.
            </p>
            <p>
              Questions about these terms: {siteConfig.contact.phone} or{' '}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-ink underline underline-offset-4 hover:text-primary-600"
              >
                {siteConfig.contact.email}
              </a>
              . See also our{' '}
              <Link
                href="/privacy"
                className="text-ink underline underline-offset-4 hover:text-primary-600"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </>
  );
}
