"use client";

import Link from "next/link";
import { Award, BookOpen, Compass, Map, UsersRound, Wrench } from "lucide-react";
import { HealthCluesGameIcon } from "./HealthCluesGameIcon";
import styles from "./HealthCluesGameShell.module.css";
import { HealthCluesLocaleControl, localeHealthCluesPath, useHealthCluesLocale } from "./HealthCluesLocaleProvider";

type GameSection = "welcome" | "quest" | "world" | "toolkit" | "knowledge" | "community" | "profile" | "loading";

const gameNav = [
  { id: "world", label: "WORLD", mobile: "WORLD", href: "/en/wellness/healthclues/world", Icon: Map, gameIcon: "nav:map" },
  { id: "quest", label: "QUESTS", mobile: "QUEST", href: "/en/wellness/healthclues/world#hc-plan", Icon: Compass, gameIcon: "quest:scroll" },
  { id: "toolkit", label: "TOOLKIT", mobile: "GEAR", href: "/en/wellness/healthclues/world#hc-toolkit", Icon: Wrench, gameIcon: "inv:backpack" },
  { id: "knowledge", label: "KNOWLEDGE", mobile: "LORE", href: "/en/wellness/healthclues/world#hc-knowledge", Icon: BookOpen, gameIcon: "inv:book" },
  { id: "community", label: "COMMUNITY", mobile: "COMM", href: "/en/wellness/healthclues/world#hc-community", Icon: UsersRound, gameIcon: "nav:camp" },
  { id: "profile", label: "PROFILE", mobile: "PROFILE", href: "/en/wellness/healthclues/dashboard", Icon: Award, gameIcon: "achieve:trophy" },
] as const;

export function HealthCluesGameShell({
  children,
  current,
  xp,
  welcome = false,
  guidedOnboarding = false,
  spotlightNavigation,
  onQuestNavigate,
  worldId,
  accessToken,
  customTopbar = false,
}: {
  children: React.ReactNode;
  current?: GameSection;
  xp?: number;
  welcome?: boolean;
  guidedOnboarding?: boolean;
  spotlightNavigation?: "quest";
  onQuestNavigate?: () => void;
  worldId?: string;
  accessToken?: string;
  customTopbar?: boolean;
}) {
  const { locale, text } = useHealthCluesLocale();
  return (
    <div className={`${styles.shell} ${welcome ? styles.welcomeShell : ""}`} data-spotlight-navigation={spotlightNavigation}>
      <div className={styles.backdrop} aria-hidden="true" />
      {!customTopbar && <header className={styles.topbar}>
        <Link href="/play" className={styles.brand} aria-label="HealthClues game home">
          <span className={styles.brandMark}><HealthCluesGameIcon icon="nav:compass" size={20} tone="amber" /></span>
          <span className={styles.brandWords}><strong>HEALTHCLUES</strong><span>WELLNESS ADVENTURE</span></span>
        </Link>
        {!welcome && current !== "loading" && !guidedOnboarding && <>
          <nav className={styles.nav} aria-label={text("Game navigation")}>
            {gameNav.map(({ id, label, mobile, href, gameIcon }) => {
              const localizedHref = localeHealthCluesPath(href, locale);
              return <Link key={id} href={localizedHref} onClick={id === "quest" && onQuestNavigate ? event => { event.preventDefault(); onQuestNavigate(); } : undefined} aria-current={current === id ? "page" : undefined} data-game-nav={id} className={`${styles.navLink} ${current === id ? styles.navLinkActive : ""}`}>
                <HealthCluesGameIcon icon={gameIcon} size={18} tone="inherit" className={styles.navIcon} />
                <span className="hidden min-[681px]:inline">{text(label)}</span>
                <span className="min-[681px]:hidden">{text(mobile)}</span>
              </Link>;
            })}
          </nav>
          <HealthCluesLocaleControl compact worldId={worldId} accessToken={accessToken} />
        </>}
        {typeof xp === "number" && Number.isFinite(xp) && (
          <span className={styles.xp} aria-label={`${xp} ${text("experience points")}`}><HealthCluesGameIcon icon="quest:star" size={14} tone="amber" />{xp} XP</span>
        )}
      </header>}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export const healthCluesGameShellStyles = styles;
