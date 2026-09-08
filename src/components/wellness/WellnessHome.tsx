import type { WellnessLocale } from "@/data/wellness";
import { WellnessShell } from "./WellnessShell";
import { CalorieTool, FoodCombinationTool, MeditationTool, RemedyChecker, StressTool } from "./WellnessTools";
import { PortalLanding } from "./PortalLanding";

export function WellnessHome({ locale }: { locale: WellnessLocale }) {
  return <PortalLanding locale={locale} />;
}

export function ToolsPage({ locale }: { locale: WellnessLocale }) {
  const vi = locale === "vi";
  return <WellnessShell locale={locale}><main className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><p className="section-kicker">BOTLY TOOLS</p><h1 className="section-title !text-5xl">{vi ? "Những công cụ nhỏ cho đời sống thật." : "Small tools for real life."}</h1><p className="section-subtitle">{vi ? "Dùng miễn phí, không cần đăng nhập. Các kết quả chỉ mang tính tham khảo wellness." : "Free to use, with no sign-in. Results are general wellness estimates."}</p><div className="mt-14 space-y-10"><section id="calorie-needs"><CalorieTool locale={locale} /></section><section id="food-combinations"><FoodCombinationTool locale={locale} /></section><section id="stress-check"><StressTool locale={locale} /></section><section id="meditation-timer"><MeditationTool locale={locale} /></section><section id="remedy-checker"><RemedyChecker locale={locale} /></section></div></main></WellnessShell>;
}
