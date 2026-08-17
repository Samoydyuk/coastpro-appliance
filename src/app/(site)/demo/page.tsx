import { Metadata } from 'next';
import {
  HeroCompact,
  RecentRepairs,
  Technician,
  ServicesGrid,
  ServiceCallExplained,
  StickyCallBar,
} from '@/components/sections';

/**
 * The home page as it could be, beside the one that is live.
 *
 * Nothing here is a new visual language — the same palette, the same type, the
 * same components. What changes is what the page spends its length on:
 *
 *   - the first screen fits on a screen, and carries the two facts that earn a
 *     call rather than three badges in boxes;
 *   - the list of what we repair comes first, because that is the question
 *     everybody arrives with;
 *   - real repairs, with photographs, then stand where reviews would stand if
 *     there were any — and they are the stronger evidence anyway;
 *   - the person who turns up is named, because that is what is actually being
 *     bought;
 *   - six sections rather than nine, and they are not all built the same way,
 *     which is what stops a page reading as a template;
 *   - one quiet bar keeps the phone number within reach of a thumb.
 *
 * Kept out of the index and out of the menu: this is for looking at, not for
 * being found.
 */
export const metadata: Metadata = {
  title: 'CoastPro — home page draft',
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

export default function DemoHomePage() {
  return (
    <>
      <HeroCompact />

      {/* First the question everybody actually arrives with — do you fix mine —
          and only then the evidence that we do. Proof before the answer is
          proof of something nobody has asked about yet. */}
      <ServicesGrid
        eyebrow="What we repair"
        title="Every major appliance in the house."
        subtitle="Refrigerators, washers, dryers, dishwashers, ovens and the rest — diagnosed the same day where the schedule allows."
      />

      <RecentRepairs />

      <Technician />

      {/* The number on the door, said plainly. It was reachable only from a
          detail page, and it is one of the two things people check first. */}
      <ServiceCallExplained />

      <StickyCallBar />
    </>
  );
}
