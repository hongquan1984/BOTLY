import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import {
  Sparkles,
  MapPin,
  Compass,
  BookOpen,
  Footprints,
  Flower2,
  TentTree,
  Swords,
  Trophy,
  CheckCircle2,
  Backpack,
  Key,
  Shield,
  Utensils,
  Droplet,
  Scroll,
  Sun,
  Moon,
  Heart,
  Flame,
  Star,
} from "lucide-react-native";

export type IconTone =
  | "gold"
  | "botanical"
  | "lavender"
  | "amber"
  | "emerald"
  | "crimson"
  | "sky"
  | "silver";

export const TONE_COLORS: Record<IconTone, string> = {
  gold: "#f59e0b",
  botanical: "#10b981",
  lavender: "#a855f7",
  amber: "#f59e0b",
  emerald: "#10b981",
  crimson: "#ef4444",
  sky: "#38bdf8",
  silver: "#94a3b8",
};

export interface GameIconProps {
  name: string;
  size?: number;
  tone?: IconTone;
  color?: string;
}

// Fallback registry for vector Lucide icons with rich game styling
const VECTOR_FALLBACKS: Record<string, any> = {
  // Navigation
  "nav:compass": Compass,
  "nav:camp": TentTree,
  "nav:map": MapPin,
  "trail:sleep": Moon,
  "trail:movement": Footprints,
  "trail:calm": WindIcon,
  "trail:nutrition": Flower2,
  "trail:energy": Sun,

  // Quests & EXP
  "quest:scroll": Scroll,
  "quest:star": Star,
  "quest:check": CheckCircle2,
  "quest:checklist": CheckCircle2,
  "quest:bookmark": Scroll,

  // Inventory & Herbs
  "inv:backpack": Backpack,
  "inv:herbs": Flower2,
  "inv:water": Droplet,
  "inv:food": Utensils,
  "inv:apple": Flower2,
  "inv:movement": Footprints,
  "inv:lotus": Flower2,
  "inv:book": BookOpen,
  "inv:chest": Key,

  // Boss & Achievements
  "boss:swords": Swords,
  "boss:key": Key,
  "boss:shield": Shield,
  "achieve:trophy": Trophy,
  "achieve:sparkles": Sparkles,

  // Wellness Activities
  "herbs:chamomile": Flower2,
  "herbs:mint": Flower2,
  "herbs:bundle": Flower2,
  "meditation:breathing": Flower2,
  "meditation:mindfulness": Heart,
  "physical:walking": Footprints,
  "physical:running": Footprints,
  "food:hot-meal": Utensils,
  "food:vegetables": Flower2,
};

function WindIcon({ size, color }: { size: number; color: string }) {
  return <Sparkles size={size} color={color} />;
}

export function GameIcon({
  name,
  size = 20,
  tone = "gold",
  color: customColor,
}: GameIconProps) {
  const iconColor = customColor || TONE_COLORS[tone] || TONE_COLORS.gold;

  // Use vector fallback matching the HealthClues GameIcon Registry
  const FallbackComponent = VECTOR_FALLBACKS[name] || Sparkles;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <FallbackComponent size={size} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
