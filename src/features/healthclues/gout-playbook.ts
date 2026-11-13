import type { PersonalProfile } from "./personalized-recommendations";

export type GoutContext = "acute_symptoms" | "long_term_interest" | "general_education";

/** A concern is self-reported. This playbook selects education boundaries, never diagnosis. */
export function resolveJourneyPlaybook(profile: PersonalProfile) {
  const topic = profile.topic || "";
  if (!/gout|uric acid/i.test(topic)) return { id: "general-wellness-v1", context: "general_education" as const, greeting: "Explore general wellness information at your own pace.", dailyPrompt: "Would you like to note anything about your journey today?" };
  const safety = profile.safetyContext || {};
  const context: GoutContext = safety.acutePainfulJoint === "yes" ? "acute_symptoms" : /long.?term|manage|recurrence|habit/i.test(`${profile.twoWeekGoal || ""} ${(profile.specificInterests || []).join(" ")}`) ? "long_term_interest" : "general_education";
  const copy = {
    acute_symptoms: { greeting: "You mentioned an acutely painful or inflamed joint. I can help you find general gout information; this game cannot assess symptoms. Avoid exerting a painful joint and seek appropriate professional advice, especially for new, severe or worsening symptoms.", dailyPrompt: "Would you like to note a symptom or practical limitation, or skip today?" },
    long_term_interest: { greeting: "You said you want to explore longer-term habits related to Gout and Uric Acid. We can review educational information; lifestyle ideas do not replace clinician-directed care.", dailyPrompt: "Would you like to note a habit or topic you chose to explore today?" },
    general_education: { greeting: "You chose to learn about Gout and Uric Acid. That interest is self-reported and does not confirm a diagnosis. We can start with general education.", dailyPrompt: "Would you like to note a question about Gout or Uric Acid, or skip today?" },
  }[context];
  return { id: "gout-uric-acid-v1", context, ...copy };
}

