import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { MobileStickyCta } from "@/components/layout/MobileStickyCta";
import { BackToTop } from "@/components/layout/BackToTop";
import { CookieNotice } from "@/components/layout/CookieNotice";
import { DemoPopup } from "@/components/layout/DemoPopup";
import { Hero } from "@/components/sections/Hero";
import { SocialProof } from "@/components/sections/SocialProof";
import { PainPoints } from "@/components/sections/PainPoints";
import { Solution } from "@/components/sections/Solution";
import { Services } from "@/components/sections/Services";

const AiLivestream = dynamic(() =>
  import("@/components/sections/AiLivestream").then((m) => m.AiLivestream)
);
const AutomationShowcase = dynamic(() =>
  import("@/components/sections/AutomationShowcase").then(
    (m) => m.AutomationShowcase
  )
);
const Benefits = dynamic(() =>
  import("@/components/sections/Benefits").then((m) => m.Benefits)
);
const RoiCalculator = dynamic(() =>
  import("@/components/sections/RoiCalculator").then((m) => m.RoiCalculator)
);
const UseCases = dynamic(() =>
  import("@/components/sections/UseCases").then((m) => m.UseCases)
);
const CaseStudies = dynamic(() =>
  import("@/components/sections/CaseStudies").then((m) => m.CaseStudies)
);
const DashboardPreview = dynamic(() =>
  import("@/components/sections/DashboardPreview").then(
    (m) => m.DashboardPreview
  )
);
const WhyChooseUs = dynamic(() =>
  import("@/components/sections/WhyChooseUs").then((m) => m.WhyChooseUs)
);
const Process = dynamic(() =>
  import("@/components/sections/Process").then((m) => m.Process)
);
const Pricing = dynamic(() =>
  import("@/components/sections/Pricing").then((m) => m.Pricing)
);
const Testimonials = dynamic(() =>
  import("@/components/sections/Testimonials").then((m) => m.Testimonials)
);
const Faq = dynamic(() =>
  import("@/components/sections/Faq").then((m) => m.Faq)
);
const FinalCta = dynamic(() =>
  import("@/components/sections/FinalCta").then((m) => m.FinalCta)
);

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <PainPoints />
        <Solution />
        <Services />
        <AiLivestream />
        <AutomationShowcase />
        <Benefits />
        <RoiCalculator />
        <UseCases />
        <CaseStudies />
        <DashboardPreview />
        <WhyChooseUs />
        <Process />
        <Pricing />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <FloatingActions />
      <MobileStickyCta />
      <BackToTop />
      <CookieNotice />
      <DemoPopup />
    </>
  );
}
