import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  Phone,
  Printer,
  Receipt,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import {
  fetchReport,
  ReportUnavailableError,
  type JobReport,
  type ReportLine,
} from '@/lib/reports/client';
import { siteConfig } from '@/data/site-config';
import { SHOP_TIMEZONE } from '@/lib/admin/range';

export const dynamic = 'force-dynamic';

/**
 * The report of a visit, as the customer reads it.
 *
 * ## Why the fetch happens here and not in the browser
 *
 * This is an async server component and the JobPocket call is made on this
 * machine, never from the page. Two things follow from that, and both of them
 * are the reason:
 *
 * 1. **The token never becomes a cross-origin request.** A `fetch` from the
 *    browser would put the credential into a request to another domain, into
 *    that domain's access log, and into the browser's own network panel and
 *    history in a second place. Here it goes from our server to theirs and
 *    stops.
 * 2. **JobPocket never learns who is reading.** If the page pulled its own
 *    data, JobPocket would collect the IP address of every customer, every
 *    forward, every screenshot-taker — a log of who opened whose invoice, kept
 *    by a third system for no reason anybody asked for. One request arrives
 *    from a datacentre instead.
 *
 * ## What is deliberately not drawn
 *
 * `business.logo` and `business.color` come down in the payload and are not
 * used. The logo is a URL on JobPocket's bucket, and putting it in an `<img>`
 * would hand every visitor's IP address to JobPocket through the back door,
 * undoing point 2 above for the sake of a picture we already have locally. The
 * colour is a brand accent for JobPocket's own rendering of this page; here the
 * document is set in CoastPro's type, on CoastPro's paper, because that is the
 * point of hosting it on CoastPro's site. Neither omission is an oversight.
 *
 * JobPocket's own HTML rendering of the same payload is never iframed or
 * injected. `lib/jobReport.ts` decides what may be published; this file decides
 * what it looks like. Mixing the two would mean a change to their stylesheet
 * silently changing this page.
 */

interface Props {
  params: { token: string };
}

export default async function ReportPage({ params }: Props) {
  let report: JobReport;
  try {
    report = await fetchReport(params.token);
  } catch (error) {
    if (error instanceof ReportUnavailableError && error.code === 'gone') {
      return <Gone />;
    }
    // Anything else is ours, not theirs. Logged for us, and shown to the
    // customer as a sentence with a phone number in it — the one thing that
    // still works when JobPocket does not.
    console.error('[Report] Could not load report:', error);
    return <Unavailable />;
  }

  const money = report.money;
  const parts = report.lines.filter((line) => isPart(line));
  const labour = report.lines.filter((line) => !isPart(line));

  return (
    <article className="mx-auto max-w-[60rem] px-4 py-10 lg:py-14">
      {/* Print sits above the document rather than at the end of it. The page is
          drawn live from a job that can still be edited next year, so the copy
          the customer saves today is the only version that cannot move under
          them — that makes this button part of the document, not an extra. */}
      <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
        <div className="eyebrow">Service report</div>
        <button
          type="button"
          id="print-report"
          className="inline-flex items-center gap-2 rounded-card border border-primary-500/40 px-4 py-2 font-heading text-[11px] font-semibold uppercase tracking-label text-ink transition-colors hover:bg-primary-100"
        >
          <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
          Print / Save as PDF
        </button>
      </div>
      {/* Three lines of script rather than a `'use client'` component: the page
          is a document with no JavaScript of its own, and shipping a React
          bundle so that one button can call window.print() would be the only
          reason this page needed hydrating at all. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.getElementById('print-report')?.addEventListener('click',function(){window.print()});",
        }}
      />

      {/* ------------------------------------------------------------------
          Letterhead. Whose name the work was done under is decided on
          JobPocket's side by the job's brand, so it is printed as it arrives —
          not replaced with CoastPro's, which would put our name on a job done
          for somebody else.
         ------------------------------------------------------------------ */}
      <header className="flex flex-col gap-8 border-b border-primary-500/20 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="headline text-2xl sm:text-3xl">{report.business.name}</h1>
          <div className="rule-short my-4" />
          <div className="space-y-0.5 text-[13px] text-gray-600">
            {report.business.address && <div>{report.business.address}</div>}
            {report.business.phone && <div>{report.business.phone}</div>}
            {report.business.email && <div>{report.business.email}</div>}
            {report.business.license && <div>License {report.business.license}</div>}
          </div>
        </div>

        <dl className="shrink-0 space-y-2 text-[13px] sm:min-w-[15rem] sm:text-right">
          {report.job.number && (
            <Meta label="Job">
              <span className="font-mono">{report.job.number}</span>
            </Meta>
          )}
          {report.customerName && <Meta label="Prepared for">{report.customerName}</Meta>}
          {report.job.address && <Meta label="Service address">{report.job.address}</Meta>}
          {report.issuedAt && <Meta label="Issued">{day(report.issuedAt)}</Meta>}
        </dl>
      </header>

      {/* ------------------------------------------------------------------
          The visit itself.
         ------------------------------------------------------------------ */}
      <Section icon={<ClipboardList className="h-4 w-4" strokeWidth={1.5} />} title="The visit">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {report.job.type && <Field label="Service">{report.job.type}</Field>}
          <Field label="Status">{statusLabel(report.job.status)}</Field>
          {report.job.scheduledAt && (
            <Field label="Scheduled">{dateTime(report.job.scheduledAt)}</Field>
          )}
          {report.job.completedAt && (
            <Field label="Completed">{dateTime(report.job.completedAt)}</Field>
          )}
          {/* Only when it was actually measured. A visit that shows "0 min"
              because nobody started the timer reads as a technician who never
              turned up. */}
          {report.job.durationMinutes ? (
            <Field label="On site">{minutes(report.job.durationMinutes)}</Field>
          ) : null}
          {report.technicianName && <Field label="Technician">{report.technicianName}</Field>}
        </dl>
      </Section>

      {report.appliance && (
        <Section icon={<Wrench className="h-4 w-4" strokeWidth={1.5} />} title="Appliance">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {report.appliance.name && <Field label="Unit">{report.appliance.name}</Field>}
            {/* Model and serial in a monospace face on purpose: these are the two
                strings a customer will one day read down a telephone to a parts
                desk, and a proportional 0 and O are the same shape. */}
            {report.appliance.model && (
              <Field label="Model">
                <span className="font-mono text-[13px]">{report.appliance.model}</span>
              </Field>
            )}
            {report.appliance.serial && (
              <Field label="Serial">
                <span className="font-mono text-[13px]">{report.appliance.serial}</span>
              </Field>
            )}
          </dl>
        </Section>
      )}

      {report.diagnosis && (
        <Section icon={<Search className="h-4 w-4" strokeWidth={1.5} />} title="What we found">
          <Prose text={report.diagnosis} />
        </Section>
      )}

      {report.resolution && (
        <Section icon={<CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />} title="What we did">
          <Prose text={report.resolution} />
        </Section>
      )}

      {/* A manufacturer recall is the one thing on this page that is worth money
          to the customer rather than to us — it is the difference between paying
          for a repair and the maker paying for it — so it gets its own frame
          rather than a line in the notes. */}
      {report.recallAnalysis && (
        <Section
          icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.5} />}
          title="Recall check"
        >
          <div className="rounded-card border border-brand/30 bg-brand-50 px-4 py-3">
            <Prose text={report.recallAnalysis} />
          </div>
        </Section>
      )}

      {report.notes && (
        <Section icon={<FileText className="h-4 w-4" strokeWidth={1.5} />} title="Notes">
          <Prose text={report.notes} />
        </Section>
      )}

      {/* ------------------------------------------------------------------
          Parts and labour. Split rather than one undifferentiated list: the
          question a customer actually has in front of an invoice is how much of
          it was the part and how much was the person, and a table that makes
          them work that out themselves is the reason invoices get queried.
         ------------------------------------------------------------------ */}
      {report.lines.length > 0 && (
        <Section icon={<Receipt className="h-4 w-4" strokeWidth={1.5} />} title="Parts and labour">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-[14px]">
              <thead>
                <tr className="border-b border-primary-500/20 text-left font-heading text-[10px] uppercase tracking-label text-gray-500">
                  <th className="py-2 pr-4 font-semibold">Description</th>
                  <th className="w-16 py-2 pr-4 text-right font-semibold">Qty</th>
                  <th className="w-24 py-2 pr-4 text-right font-semibold">Each</th>
                  <th className="w-28 py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[...parts, ...labour].map((line, index) => (
                  <tr
                    key={`${line.description}-${index}`}
                    className="break-inside-avoid border-b border-primary-500/10 align-top"
                  >
                    <td className="py-3 pr-4">
                      <div className="text-gray-800">{line.description}</div>
                      {line.category && (
                        <div className="mt-0.5 font-heading text-[10px] uppercase tracking-label text-gray-500">
                          {statusLabel(line.category)}
                        </div>
                      )}
                      {/* Only the lines the owner marked public carry a supplier
                          link at all — JobPocket strips the rest before this
                          payload is built. `noreferrer` on top of the page's own
                          no-referrer rule, because the token is in this page's
                          address and a supplier's access log is the last place
                          it should turn up. */}
                      {line.partUrl && (
                        <a
                          href={line.partUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          referrerPolicy="no-referrer"
                          className="mt-1 inline-flex items-center gap-1.5 font-heading text-[10px] font-semibold uppercase tracking-label text-primary-600 hover:text-ink"
                        >
                          <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                          Part details
                        </a>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-600">
                      {line.quantity}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-600">
                      {dollars(line.unitPrice)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-ink">
                      {dollars(line.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Every figure comes over as whole cents worked out by JobPocket. The
              console has the same rule and the same reason: the moment a second
              screen adds a total up for itself, the business has two definitions
              of what a job cost and no way to tell which one is lying. */}
          <dl className="mt-6 ml-auto max-w-xs space-y-2 text-[14px]">
            <Total label="Subtotal" value={money.subtotalCents} />
            {money.taxCents > 0 && (
              <Total
                label={`Tax${money.taxRate ? ` (${taxRate(money.taxRate)})` : ''}`}
                value={money.taxCents}
              />
            )}
            <Total label="Total" value={money.totalCents} emphasis />
            {money.paidCents > 0 && <Total label="Paid" value={money.paidCents} />}
            {money.balanceCents > 0 && (
              <Total label="Balance due" value={money.balanceCents} emphasis />
            )}
          </dl>
        </Section>
      )}

      {/* ------------------------------------------------------------------
          Payment. Its own strip rather than a row in the table, because "is
          this settled?" is the question people open the link to answer.
         ------------------------------------------------------------------ */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-card border border-primary-500/20 bg-cream-light px-5 py-4 break-inside-avoid">
        <div>
          <div className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
            Payment
          </div>
          <div className="mt-1 font-heading text-base font-bold uppercase tracking-label text-ink">
            {paymentLabel(report.job.paymentStatus)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
            {money.balanceCents > 0 ? 'Balance due' : 'Total'}
          </div>
          <div className="mt-1 font-heading text-2xl font-extrabold tabular-nums text-ink">
            {cents(money.balanceCents > 0 ? money.balanceCents : money.totalCents)}
          </div>
        </div>
      </div>

      {report.warranty && (
        <Section icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.5} />} title="Warranty">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {report.warranty.partsDays != null && (
              <Field label="Parts">{days(report.warranty.partsDays)}</Field>
            )}
            {report.warranty.laborDays != null && (
              <Field label="Labor">{days(report.warranty.laborDays)}</Field>
            )}
          </dl>
          {/* Said out loud because a warranty a customer cannot find is not a
              warranty. This page is the proof of purchase. */}
          <p className="mt-3 text-[13px] text-gray-600">
            Keep this report — it is the record of the work and the date the
            warranty runs from.
          </p>
        </Section>
      )}

      {report.photos.length > 0 && (
        <Section icon={<Camera className="h-4 w-4" strokeWidth={1.5} />} title="Photos">
          <div className="grid gap-4 sm:grid-cols-3">
            {report.photos.map((photo) => (
              <figure key={photo.id} className="break-inside-avoid">
                {/* A plain <img>, deliberately not next/image. The optimizer
                    would copy the bytes into Vercel's shared image cache and
                    serve them from an address with no token in it — a private
                    photograph of somebody's kitchen, cached publicly, still
                    reachable after the report link is revoked. The proxy route
                    exists to prevent exactly that. */}
                <img
                  src={`/api/report/${encodeURIComponent(params.token)}/photo/${encodeURIComponent(photo.id)}`}
                  alt={photo.caption || `${statusLabel(photo.category)} photo`}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-card border border-primary-500/20 object-cover"
                />
                <figcaption className="mt-2 text-[12px] text-gray-500">
                  <span className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
                    {statusLabel(photo.category)}
                  </span>
                  {photo.caption ? ` · ${photo.caption}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* ------------------------------------------------------------------
          The ask. This is why the report is hosted here rather than left on
          JobPocket: somebody reading a finished repair is the warmest audience
          this business has, and on our own site the next appointment is one tap
          away. Hidden in print — a page of black ink is not what anybody wants
          out of their printer, and the footer carries the number on paper.
         ------------------------------------------------------------------ */}
      <div className="mt-12 rounded-card bg-ink px-6 py-8 text-center print:hidden">
        <h2 className="font-heading text-lg font-bold uppercase tracking-label text-cream sm:text-xl">
          Need us again?
        </h2>
        <p className="mt-2 text-[15px] text-cream/70">
          We already know your appliance — booking a return visit takes a minute.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/book-appointment"
            className="flex flex-1 items-center justify-center gap-2 rounded-card bg-cream px-5 py-3 font-heading text-[11px] font-semibold uppercase tracking-label text-ink transition-colors hover:bg-white"
          >
            <Calendar className="h-4 w-4" strokeWidth={1.5} />
            Book another visit
          </Link>
          <a
            href={`tel:${siteConfig.contact.phoneClean}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-card border border-cream/30 px-5 py-3 font-heading text-[11px] font-semibold uppercase tracking-label text-cream transition-colors hover:bg-cream/10"
          >
            <Phone className="h-4 w-4" strokeWidth={1.5} />
            {siteConfig.contact.phone}
          </a>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-[12px] text-cream/60">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
          Same-day service available · Upfront, honest pricing
        </p>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// The two pages that are not a report
// ---------------------------------------------------------------------------

/**
 * A link that has been withdrawn, was never real, or belongs to a job that no
 * longer exists.
 *
 * One wording for all three, because JobPocket answers all three the same way
 * on purpose and telling them apart here would rebuild the oracle it refuses to
 * be. No `notFound()`: that boundary renders the site's own 404 inside the root
 * layout, with the full header and footer — forty links, on a page whose
 * address still contains the token, under metadata that never set
 * `no-referrer`.
 */
function Gone() {
  return (
    <Notice
      eyebrow="Link expired"
      title="This report is no longer available."
      body="The link may have been replaced with a newer one, or withdrawn. Give us a
        call and we will send the current copy."
    />
  );
}

/** JobPocket is down or misconfigured. Ours, not theirs — so say so plainly. */
function Unavailable() {
  return (
    <Notice
      eyebrow="Temporarily unavailable"
      title="We can't load this report right now."
      body="Something on our side is not answering. The link itself is fine — try
        again in a few minutes, or call us and we will read it to you."
    />
  );
}

function Notice({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-[60rem] px-4 py-20">
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="headline mt-3 text-3xl sm:text-4xl">{title}</h1>
      <div className="rule-short my-6" />
      <p className="max-w-prose text-[15px] leading-relaxed text-gray-600">{body}</p>
      <a
        href={`tel:${siteConfig.contact.phoneClean}`}
        className="mt-8 inline-flex items-center gap-2 rounded-card bg-ink px-5 py-3 font-heading text-[11px] font-semibold uppercase tracking-label text-cream transition-colors hover:bg-gray-800"
      >
        <Phone className="h-4 w-4" strokeWidth={1.5} />
        {siteConfig.contact.phone}
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces of the document
// ---------------------------------------------------------------------------

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 break-inside-avoid">
      <div className="flex items-center gap-3">
        <span className="icon-disc h-8 w-8 border-ink bg-ink text-cream">{icon}</span>
        <h2 className="font-heading text-[13px] font-bold uppercase tracking-label text-ink">
          {title}
        </h2>
      </div>
      <div className="mt-4 border-t border-primary-500/15 pt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
        {label}
      </dt>
      <dd className="text-[14px] text-gray-800">{children}</dd>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-heading text-[10px] font-semibold uppercase tracking-label text-gray-500">
        {label}
      </dt>
      <dd className="text-gray-800">{children}</dd>
    </div>
  );
}

function Total({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? 'flex items-baseline justify-between gap-4 border-t border-primary-500/25 pt-2 font-heading font-bold uppercase tracking-label text-ink'
          : 'flex items-baseline justify-between gap-4 text-gray-600'
      }
    >
      <dt className={emphasis ? 'text-[11px]' : 'text-[13px]'}>{label}</dt>
      <dd className="tabular-nums">{cents(value)}</dd>
    </div>
  );
}

/**
 * A technician's paragraph, printed as typed.
 *
 * Line breaks are kept because that is how the notes are written — a list of
 * checks on separate lines becomes one run-on sentence otherwise. Rendered as
 * text, never as markup: this is free text somebody typed on a phone in a
 * kitchen, and the one thing it must never be is HTML.
 */
function Prose({ text }: { text: string }) {
  return (
    <p className="max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
      {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Money, always to the cent.
 *
 * The console's `money()` drops the cents above a thousand dollars, which is
 * right for a dashboard and wrong here: this is a receipt, and a receipt that
 * says $1,240 when the card was charged $1,239.87 is a receipt somebody rings
 * up about.
 */
function cents(value: number): string {
  return (value / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Line items arrive as dollars rather than cents — the one place they do. */
function dollars(value: number): string {
  return cents(Math.round(value * 100));
}

/**
 * Dates in the shop's own time zone, not the server's.
 *
 * The same rule the console keeps, for the same reason: a visit finished at
 * five in the afternoon in California is 00:00 the next day in UTC, and a
 * report that dates the work to a day the technician was not there is wrong in
 * the one document the customer keeps.
 */
function dateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: SHOP_TIMEZONE,
  });
}

function day(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: SHOP_TIMEZONE,
  });
}

function minutes(value: number): string {
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

function days(value: number): string {
  return value === 1 ? '1 day' : `${value} days`;
}

/**
 * The rate as it appears on paper.
 *
 * Already a percentage, not a fraction: `Job.taxRate` is `Decimal(5,2)`
 * defaulting to 8.6, and the API passes it through unscaled. Multiplying by a
 * hundred here printed "Tax (860%)" on the customer's copy. JobPocket's own
 * renderer and the portal both read it the same way.
 */
function taxRate(rate: number): string {
  return `${rate.toLocaleString('en-US', { maximumFractionDigits: 3 })}%`;
}

/**
 * An enum, in English.
 *
 * A fallback rather than a table, so a status JobPocket adds next year reads as
 * "Awaiting parts" instead of vanishing from the page or showing as a raw
 * `AWAITING_PARTS`.
 */
function statusLabel(value: string): string {
  const words = value.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Payment status in the customer's words rather than the database's.
 *
 * "UNPAID" is accurate and reads like an accusation; the customer is being told
 * what they still owe, which is a different sentence.
 */
function paymentLabel(value: string): string {
  const labels: Record<string, string> = {
    PAID: 'Paid in full — thank you',
    UNPAID: 'Balance outstanding',
    PARTIAL: 'Part paid',
    REFUNDED: 'Refunded',
    WRITTEN_OFF: 'Closed — no balance due',
  };
  return labels[value] ?? statusLabel(value);
}

/**
 * Parts first, labour after, which is the order the work happened in and the
 * order an invoice is read in. Anything JobPocket does not categorise falls in
 * with the labour rather than being lost.
 */
function isPart(line: ReportLine): boolean {
  return (line.category ?? '').toUpperCase() === 'PART';
}
