"use client";

import { Moon, Sparkles } from "lucide-react";

export type PetRegion = "sleep-better" | "health-concern";

/** One small, reusable Pet renderer; dialogue stays deterministic and non-clinical. */
export function HealthCluesPet({ region, topic, pose = "welcome", className = "" }: { region: PetRegion; topic: string; pose?: "welcome" | "guide" | "celebrate"; className?: string }) {
  const luna = region === "sleep-better";
  const name = luna ? "Luna" : "Lumi";
  return <div className={`hc-pet hc-pet-${luna ? "luna" : "lumi"} hc-pet-${pose} ${className}`.trim()} aria-label={`${name}, your ${luna ? "moon owl" : "firefly guide"}`} role="img">
    <svg viewBox="0 0 120 120" aria-hidden="true" className="hc-pet-art">
      {luna ? <>
        <path d="M28 49 20 15l27 20M92 49l8-34-27 20" fill="#8d81bd" stroke="#e8dcff" strokeWidth="5" strokeLinejoin="round"/>
        <ellipse cx="60" cy="66" rx="39" ry="42" fill="#51466f" stroke="#d8c6fa" strokeWidth="4"/>
        <ellipse cx="44" cy="58" rx="15" ry="18" fill="#fff0c7"/><ellipse cx="76" cy="58" rx="15" ry="18" fill="#fff0c7"/>
        <circle cx="47" cy="59" r="5" fill="#293052"/><circle cx="73" cy="59" r="5" fill="#293052"/>
        <path d="m56 72 4 7 5-7" fill="#edbc6c"/><path d="M35 92q25-18 50 0-7 17-25 17T35 92" fill="#e9d8ff"/>
        <path d="M28 79 8 92l30 3m54-16 20 13-30 3" fill="#8878ae" stroke="#d8c6fa" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M49 105v8m22-8v8" stroke="#edbc6c" strokeWidth="5" strokeLinecap="round"/>
      </> : <>
        <path d="M34 42q-18-25-24-6 3 20 22 23m54-17q18-25 24-6-3 20-22 23" fill="#98e8cb" stroke="#e1fff2" strokeWidth="4"/>
        <ellipse cx="60" cy="65" rx="27" ry="34" fill="#65d7b0" stroke="#dcfff1" strokeWidth="4"/>
        <ellipse cx="50" cy="61" rx="5" ry="7" fill="#163d3d"/><ellipse cx="70" cy="61" rx="5" ry="7" fill="#163d3d"/>
        <path d="M54 77q6 7 12 0" fill="none" stroke="#174a40" strokeWidth="3" strokeLinecap="round"/>
        <path d="M45 87q15 13 30 0l8 22H37z" fill="#eafad8" stroke="#c1f1c9" strokeWidth="3"/>
        <path d="m40 37-11-13m51 13 11-13" stroke="#e5fff2" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="60" cy="102" r="12" fill="#ffe28a" opacity=".85"/>
      </>}
      <circle cx="17" cy="34" r="3" fill="#ffe9a9"/><circle cx="103" cy="28" r="2.5" fill="#ffe9a9"/>
    </svg>
    <span className="hc-pet-name"><Sparkles size={13}/>{name}</span>
    <span className="sr-only">{luna ? "A friendly moon owl companion" : "A friendly glowing firefly companion"}. Current journey: {topic || "general wellness discovery"}.</span>
  </div>;
}

export function RegionSkyIcon({ region }: { region: PetRegion }) {
  return region === "sleep-better" ? <Moon aria-hidden="true"/> : <Sparkles aria-hidden="true"/>;
}
