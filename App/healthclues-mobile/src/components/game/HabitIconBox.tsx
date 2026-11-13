import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Droplets,
  Flower2,
  Footprints,
  Moon,
  HeartPulse,
  Sparkles,
  Leaf,
  Target,
} from "lucide-react-native";
import { colors, radius } from "@/theme";

interface HabitIconBoxProps {
  category?: string;
  title?: string;
  size?: number;
}

export function HabitIconBox({ category = "nutrition", title = "", size = 42 }: HabitIconBoxProps) {
  const lowerTitle = title.toLowerCase();
  const lowerCat = category.toLowerCase();

  let IconComp = Leaf;
  let bgGradient = "rgba(16, 185, 129, 0.15)";
  let borderColor = "rgba(16, 185, 129, 0.4)";
  let iconColor = "#34d399";

  if (lowerTitle.includes("nước") || lowerTitle.includes("water") || lowerTitle.includes("uống")) {
    IconComp = Droplets;
    bgGradient = "rgba(14, 165, 233, 0.18)";
    borderColor = "rgba(56, 189, 248, 0.5)";
    iconColor = "#38bdf8";
  } else if (lowerTitle.includes("cherry") || lowerTitle.includes("thảo mộc") || lowerTitle.includes("dược thảo") || lowerCat.includes("dược")) {
    IconComp = Flower2;
    bgGradient = "rgba(244, 63, 94, 0.18)";
    borderColor = "rgba(251, 113, 133, 0.5)";
    iconColor = "#fb7185";
  } else if (lowerTitle.includes("đi bộ") || lowerTitle.includes("vận động") || lowerTitle.includes("bước") || lowerCat.includes("vận động")) {
    IconComp = Footprints;
    bgGradient = "rgba(245, 158, 11, 0.18)";
    borderColor = "rgba(251, 191, 36, 0.5)";
    iconColor = "#fbbf24";
  } else if (lowerTitle.includes("ngủ") || lowerTitle.includes("sleep") || lowerCat.includes("giấc ngủ")) {
    IconComp = Moon;
    bgGradient = "rgba(139, 92, 246, 0.18)";
    borderColor = "rgba(167, 139, 250, 0.5)";
    iconColor = "#c084fc";
  } else if (lowerTitle.includes("thở") || lowerTitle.includes("tâm") || lowerTitle.includes("relax")) {
    IconComp = HeartPulse;
    bgGradient = "rgba(20, 184, 166, 0.18)";
    borderColor = "rgba(45, 212, 191, 0.5)";
    iconColor = "#2dd4bf";
  } else if (lowerCat.includes("dinh dưỡng")) {
    IconComp = Leaf;
    bgGradient = "rgba(16, 185, 129, 0.18)";
    borderColor = "rgba(52, 211, 153, 0.5)";
    iconColor = "#34d399";
  }

  const iconSize = Math.round(size * 0.5);

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          backgroundColor: bgGradient,
          borderColor,
        },
      ]}
    >
      <IconComp size={iconSize} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
