import { TextStyle } from "react-native";
import { colors } from "./colors";

export const fonts = {
  ui: "BeVietnamPro-Regular",
  uiMedium: "BeVietnamPro-Medium",
  uiSemiBold: "BeVietnamPro-SemiBold",
  uiBold: "BeVietnamPro-Bold",
  uiExtraBold: "BeVietnamPro-ExtraBold",
  displaySemiBold: "Spectral-SemiBold",
  displayBold: "Spectral-Bold",
} as const;

export const typography = {
  h1: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.ui,
    fontSize: 15,
    fontWeight: "400" as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tag: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  },
} satisfies Record<string, TextStyle>;
