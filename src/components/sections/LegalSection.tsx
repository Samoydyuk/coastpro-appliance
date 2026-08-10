interface LegalSectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

/** One numbered clause in a legal document, in the site's section rhythm. */
export function LegalSection({ number, title, children }: LegalSectionProps) {
  return (
    <section className="py-10 border-b border-primary-500/20 last:border-b-0">
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-12">
        <div className="lg:col-span-4">
          <div className="eyebrow mb-3">{number}</div>
          <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-ink">
            {title}
          </h2>
        </div>
        <div className="lg:col-span-8 space-y-4 text-gray-600 leading-relaxed max-w-prose">
          {children}
        </div>
      </div>
    </section>
  );
}
