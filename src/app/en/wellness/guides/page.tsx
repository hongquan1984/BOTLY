import type { Metadata } from 'next';
import { listPublishedArticles } from '@/lib/published-articles';
import { WellnessShell } from '@/components/wellness/WellnessShell';
import { AllGuidesDirectory } from '@/components/wellness/AllGuidesDirectory';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Complete Evidence-Based Scientific Wellness Library | Botly',
  description: 'Explore the full collection of biochemical analyses, natural remedy mechanism evaluations, 3D anatomical simulations, and safety quizzes.',
  alternates: {
    canonical: '/en/wellness/guides'
  }
};

export default async function EnglishGuidesDirectoryPage() {
  const articles = await listPublishedArticles('en', undefined, 50);

  return (
    <WellnessShell locale="en">
      <main className="bg-[#f7f9f6] min-h-screen">
        {/* Hero Header */}
        <section className="border-b border-[#d8e4d8] bg-gradient-to-b from-[#eaf2e8] to-[#f7f9f6] py-14 sm:py-18">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 border border-emerald-300/40 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>BOTLY EVIDENCE-BASED WELLNESS LIBRARY</span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#18302b] sm:text-5xl leading-tight">
                All Scientific Guides & Phytochemical Dissections
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[#4e665d] sm:text-lg">
                Evaluating viral home remedies through modern clinical biochemistry: cellular pharmacology, 3D biomedical cutaways, Trust Meter ratings, and personalized safety screening quizzes.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-xs font-medium text-[#526d62]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>100% Peer-Reviewed Hepatology & Cardiology Science</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>Includes Trust Meter & 2-Minute Pocket Recipe Cards</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Content */}
        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <AllGuidesDirectory initialArticles={articles} locale="en" />
        </section>
      </main>
    </WellnessShell>
  );
}
