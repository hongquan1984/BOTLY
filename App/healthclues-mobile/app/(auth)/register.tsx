import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react-native";
import { colors, typography, spacing, radius } from "@/theme";
import { t } from "@/localization";
import { signUpWithEmailPassword } from "@/services/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const strings = t();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ các thông tin.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await signUpWithEmailPassword(email, password);
      if (res.needsEmailConfirmation) {
        setSuccess(true);
      } else {
        router.replace("/(game)/world");
      }
    } catch (err: any) {
      setError(err.message || "Đăng ký không thành công.");
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.textSecondary} />
            <Text style={styles.backText}>{strings.common.back}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Tạo Tài Khoản Mới</Text>
            <Text style={styles.subtitle}>
              Bắt đầu hành trình khám phá sức khỏe cùng HealthClues
            </Text>
          </View>

          <View style={styles.card}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {success ? (
              <View style={styles.successBox}>
                <ShieldCheck size={28} color={colors.emeraldLight} />
                <Text style={styles.successTitle}>Đăng ký thành công!</Text>
                <Text style={styles.successDesc}>
                  Email xác nhận đã được gửi tới {email}. Vui lòng bấm vào liên kết
                  trong email để kích hoạt tài khoản, sau đó quay lại đăng nhập.
                </Text>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => router.replace("/(auth)/login")}
                >
                  <Text style={styles.btnPrimaryText}>Đến màn hình Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
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

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập lại mật khẩu"
                      placeholderTextColor={colors.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{strings.auth.registerBtn}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  backText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textGold,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
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
  successBox: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  successTitle: {
    ...typography.h3,
    color: colors.emeraldLight,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  successDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
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
    width: "100%",
  },
  btnPrimaryText: {
    ...typography.bodyBold,
    color: "#ffffff",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
