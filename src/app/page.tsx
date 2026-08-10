import {
  Hero,
  StatsBand,
  ServicesGrid,
  TrustSignals,
  ProcessSteps,
  ServiceAreas,
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
      <CTABanner />
    </>
  );
}
