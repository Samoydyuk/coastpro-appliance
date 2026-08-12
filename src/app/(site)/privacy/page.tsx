import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader, LegalSection } from '@/components/sections';
import { siteConfig } from '@/data/site-config';

const LAST_UPDATED = 'August 9, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${siteConfig.name} collects, uses and protects the information you provide through this website.`,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy"
        titleMuted="policy."
        subtitle={`How we handle the information you give us. Last updated ${LAST_UPDATED}.`}
      />

      <div className="bg-cream py-12">
        <div className="container mx-auto px-4">
          <LegalSection number="01" title="Who We Are">
            <p>
              {siteConfig.name} is an appliance repair business serving Orange County, California.
              This policy covers {siteConfig.seo.siteUrl} and the service requests you send through
              it. Questions go to{' '}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-ink underline underline-offset-4 hover:text-primary-600"
              >
                {siteConfig.contact.email}
              </a>{' '}
              or {siteConfig.contact.phone}.
            </p>
          </LegalSection>

          <LegalSection number="02" title="What We Collect">
            <p>
              <strong className="text-ink">When you use the contact form:</strong> your name, email
              address, phone number, the service you selected and the message you write.
            </p>
            <p>
              <strong className="text-ink">When you book an appointment:</strong> your name, email
              address, phone number, service address, city and ZIP code, the appliance type and your
              description of the problem. Scheduling is handled by Calendly, so the details you
              enter on the booking step are submitted to Calendly along with your chosen time.
            </p>
            <p>
              <strong className="text-ink">Automatically:</strong> standard analytics data through
              Google Analytics 4 and Google Ads — pages visited, approximate location, device and
              browser, how you reached the site, and whether you clicked a phone number or submitted
              a form. Our contact page embeds a Google Map, which Google loads directly in your
              browser.
            </p>
            <p>
              We do not ask for payment card details through this website. Payment is taken at the
              time of service.
            </p>
          </LegalSection>

          <LegalSection number="03" title="How We Use It">
            <p>
              To respond to your enquiry, schedule and carry out the repair, reach you about the
              appointment, and keep a record of the work. Analytics and advertising data is used to
              understand which pages and ads bring in service requests.
            </p>
            <p>We do not sell your personal information.</p>
          </LegalSection>

          <LegalSection number="04" title="Who We Share It With">
            <p>
              Only the service providers that make the site work: Resend delivers contact form
              submissions to our inbox, Calendly handles appointment scheduling, Vercel hosts the
              site, and Google provides analytics, advertising and the embedded map. Each processes
              the data under its own privacy terms.
            </p>
            <p>
              We may also disclose information where the law requires it, or where it is needed to
              establish or defend a legal claim.
            </p>
          </LegalSection>

          <LegalSection number="05" title="Cookies And Tracking">
            <p>
              Google Analytics and Google Ads set cookies to measure visits and conversions,
              including calls started from a phone number on this site. You can block or delete
              cookies in your browser settings; the site still works without them, though some
              measurement will be lost.
            </p>
          </LegalSection>

          <LegalSection number="06" title="Your California Rights">
            <p>
              California residents may request access to the personal information we hold, ask us to
              correct or delete it, and opt out of any sharing of that information for
              cross-context behavioural advertising. We will not treat you differently for
              exercising these rights.
            </p>
            <p>
              To make a request, email{' '}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-ink underline underline-offset-4 hover:text-primary-600"
              >
                {siteConfig.contact.email}
              </a>{' '}
              or call {siteConfig.contact.phone}. We may need to verify who you are before acting on
              the request.
            </p>
          </LegalSection>

          <LegalSection number="07" title="Keeping And Protecting It">
            <p>
              We keep service records for as long as needed to support warranty claims and to meet
              our tax and legal obligations, then delete them. Submissions travel over an encrypted
              connection, but no method of transmission or storage is completely secure.
            </p>
          </LegalSection>

          <LegalSection number="08" title="Children">
            <p>
              This site is meant for adults arranging appliance service. We do not knowingly collect
              information from children under 13.
            </p>
          </LegalSection>

          <LegalSection number="09" title="Changes">
            <p>
              If this policy changes we will update the date at the top of the page. Material
              changes will be noted here.
            </p>
            <p>
              See also our{' '}
              <Link
                href="/terms"
                className="text-ink underline underline-offset-4 hover:text-primary-600"
              >
                Terms of Service
              </Link>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </>
  );
}
