import {
  Hero,
  StatsBand,
  ServicesGrid,
  TrustSignals,
  ProcessSteps,
  ServiceAreas,
  BrandsServiced,
  ServiceCallExplained,
  CTABanner,
} from '@/components/sections';

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Tonal break: cream hero -> espresso band -> cream content */}
      <StatsBand />
      <ServicesGrid eyebrow="01 — Services" />
      <TrustSignals />
      <ProcessSteps />
      <ServiceAreas />
      {/* Brands, then what the visit costs. Both were only reachable from
          detail pages, which left the home page thin on the two things people
          check before they call: whether we open their machine, and what the
          number on the door is. */}
      <BrandsServiced />
      <ServiceCallExplained />
      <CTABanner />
    </>
  );
}
