import styles from "./HealthCluesAdventurer.module.css";

export type AdventurerPose = "idle" | "curious" | "thinking" | "welcoming" | "challenge" | "victory";

const posePosition: Record<AdventurerPose, string> = {
  idle: "0% 0%",
  curious: "50% 0%",
  thinking: "100% 0%",
  welcoming: "0% 100%",
  challenge: "50% 100%",
  victory: "100% 100%",
};

export function HealthCluesAdventurer({
  pose = "idle",
  width = 160,
  className = "",
  alt,
}: {
  pose?: AdventurerPose;
  width?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={`${styles.character} ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      style={{ width, height: width * 1.5, backgroundPosition: posePosition[pose] }}
    />
  );
}
