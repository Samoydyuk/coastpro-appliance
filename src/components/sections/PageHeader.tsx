import { MapPin } from 'lucide-react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  titleMuted?: string;
  subtitle?: string;
  location?: string;
}

/**
 * Standard page masthead in the CoastPro brand style: cream field, letterspaced
 * eyebrow, heavy two-tone headline, hairline rule.
 */
export function PageHeader({ eyebrow, title, titleMuted, subtitle, location }: PageHeaderProps) {
  return (
    <section className="bg-cream border-b border-primary-500/20">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-3xl">
          {eyebrow && <div className="eyebrow mb-4">{eyebrow}</div>}

          <h1 className="headline text-[1.9rem] sm:text-4xl md:text-5xl lg:text-6xl">
            {title}
            {titleMuted && (
              <>
                <br />
                <span className="headline-muted">{titleMuted}</span>
              </>
            )}
          </h1>

          <div className="rule-short my-8" />

          {subtitle && <p className="text-lg md:text-xl text-gray-600 max-w-prose">{subtitle}</p>}

          {location && (
            <div className="flex items-center gap-2 mt-8 text-primary-600">
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              <span className="font-heading text-[11px] font-semibold uppercase tracking-label">
                {location}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
