import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, Sparkles, ShieldCheck } from "lucide-react-native";
import { colors, typography, spacing, radius } from "@/theme";
import { t } from "@/localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailPassword, sendMagicLink } from "@/services/auth";

export default function LoginScreen() {
  const router = useRouter();
  const strings = t();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailPassword(email, password);
      const onboardingCompleted = await AsyncStorage.getItem("healthclues-onboarding-completed");
      if (onboardingCompleted !== "true") {
        router.replace("/(onboarding)/quiz");
      } else {
        router.replace("/(game)/world");
      }
    } catch (err: any) {
      setError(err.message || strings.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail("player@botly.vn");
    setPassword("123456");
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailPassword("player@botly.vn", "123456");
      const onboardingCompleted = await AsyncStorage.getItem("healthclues-onboarding-completed");
      if (onboardingCompleted !== "true") {
        router.replace("/(onboarding)/quiz");
      } else {
        router.replace("/(game)/world");
      }
    } catch (err: any) {
      setError(err.message || strings.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError("Vui lòng nhập email để nhận liên kết đăng nhập.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || "Không thể gửi Magic Link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{strings.auth.title}</Text>
            <View style={styles.subtitleBadge}>
              <Sparkles size={14} color={colors.gold} />
              <Text style={styles.subtitle}>{strings.auth.subtitle}</Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {magicLinkSent && (
              <View style={styles.successBox}>
                <ShieldCheck size={18} color={colors.emeraldLight} />
                <Text style={styles.successText}>
                  Đã gửi liên kết đăng nhập tới {email}. Vui lòng kiểm tra hộp thư!
                </Text>
              </View>
            )}

            {/* Quick Demo Credentials Box */}
            <View style={styles.demoCard}>
              <View style={styles.demoCardHeader}>
                <Sparkles size={14} color={colors.goldLight} />
                <Text style={styles.demoCardTitle}>Tài Khoản Thử Nghiệm (Demo)</Text>
              </View>
              <Text style={styles.demoCardText}>
                • Email: <Text style={styles.demoCardBold}>player@botly.vn</Text>
              </Text>
              <Text style={styles.demoCardText}>
                • Mật khẩu: <Text style={styles.demoCardBold}>123456</Text> (hoặc bất kỳ)
              </Text>
              <TouchableOpacity
                style={styles.demoQuickBtn}
                onPress={handleQuickDemoLogin}
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <Text style={styles.demoQuickBtnText}>⚡ 1 Chạm Đăng Nhập Demo Ngay</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={strings.auth.emailPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={strings.auth.passwordPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Login Action Button */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnPrimaryText}>{strings.auth.loginBtn}</Text>
              )}
            </TouchableOpacity>

            {/* Magic Link Option */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleMagicLink}
              disabled={loading}
            >
              <Text style={styles.btnSecondaryText}>{strings.auth.magicLinkBtn}</Text>
            </TouchableOpacity>

            {/* Quick Quiz Onboarding Discovery Button */}
            <TouchableOpacity
              style={styles.quizDiscoveryBtn}
              onPress={() => router.push("/(onboarding)/quiz")}
              activeOpacity={0.8}
            >
              <Sparkles size={15} color={colors.goldLight} />
              <Text style={styles.quizDiscoveryBtnText}>
                Khám Phá Qua Câu Đố Sức Khỏe (Quiz)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Switch to Register */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.footerLink}>{strings.auth.registerBtn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textGold,
    textAlign: "center",
  },
  subtitleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textEmerald,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  errorBox: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: colors.rose,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: colors.rose,
  },
  demoCard: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  demoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  demoCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.emeraldLight,
  },
  demoCardText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  demoCardBold: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  demoQuickBtn: {
    backgroundColor: colors.emerald,
    borderRadius: radius.md,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  demoQuickBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#042f2e",
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: colors.emerald,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: {
    ...typography.caption,
    color: colors.emeraldLight,
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 15,
  },
  btnPrimary: {
    backgroundColor: colors.emerald,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: {
    ...typography.bodyBold,
    color: "#ffffff",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnSecondary: {
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  btnSecondaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
  quizDiscoveryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    paddingVertical: 10,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  quizDiscoveryBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.goldLight,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.caption,
    color: colors.emeraldLight,
    fontWeight: "700",
  },
});
