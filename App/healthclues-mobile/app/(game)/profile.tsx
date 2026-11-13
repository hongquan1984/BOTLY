import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Globe,
  Clock,
  Bell,
  Volume2,
  VolumeX,
  Music,
  LogOut,
  Trash2,
  Sparkles,
  ShieldAlert,
  Trees,
  Mountain,
  Moon,
} from "lucide-react-native";
import { colors, fonts, typography, spacing, radius } from "@/theme";
import { t, getLocale, setLocale, Locale } from "@/localization";
import { TopHud } from "@/components/common/TopHud";
import { useAuth } from "@/hooks/useAuth";
import { useWorld } from "@/hooks/useWorld";
import {
  DEFAULT_REMINDER_PREFERENCE,
  ReminderFrequency,
  ReminderPreference,
  loadReminderPreferences,
  parseTimeHHMM,
  saveReminderPreferences,
  sendTestReminderNotification,
} from "@/services/reminders";
import {
  AUDIO_STATE_EVENT,
  BGM_TRACK_OPTIONS,
  BgmTrackId,
  DEFAULT_AUDIO_SETTINGS,
  GameAudioSettings,
  loadAudioSettings,
  playSfx,
  unlockAndStartBgm,
  updateAudioSettings,
} from "@/services/gameAudio";

const TIME_PRESETS = ["07:30", "12:30", "20:30", "21:30"] as const;
const FREQUENCY_OPTIONS: { key: ReminderFrequency; label: string }[] = [
  { key: "daily", label: "Hằng ngày" },
  { key: "weekdays", label: "Thứ 2–6" },
  { key: "weekly", label: "Hằng tuần" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const strings = t();
  const { user, logout } = useAuth();
  const { world, xpTotal, currencies } = useWorld(true);
  const [currentLang, setCurrentLang] = useState<Locale>(getLocale());
  const [confirmModal, setConfirmModal] = useState<"logout" | "delete" | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [reminderPref, setReminderPref] = useState<ReminderPreference>(DEFAULT_REMINDER_PREFERENCE);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [draftTime, setDraftTime] = useState("07:30");
  const [draftFreq, setDraftFreq] = useState<ReminderFrequency>("daily");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderPreviewFeedback, setReminderPreviewFeedback] = useState<string | null>(null);

  const [audioSettings, setAudioSettings] = useState<GameAudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    loadReminderPreferences(world?.timezone).then((loaded) => {
      if (!active) return;
      setReminderPref(loaded);
      setDraftEnabled(loaded.enabled);
      setDraftTime(loaded.localSendTime);
      setDraftFreq(loaded.frequency);
    });
    loadAudioSettings().then((audioLoaded) => {
      if (active) setAudioSettings(audioLoaded);
    });
    const audioSub = DeviceEventEmitter.addListener(AUDIO_STATE_EVENT, (next: GameAudioSettings) => {
      if (active && next) setAudioSettings(next);
    });
    return () => {
      active = false;
      audioSub.remove();
    };
  }, [world?.timezone]);

  const handleSelectBgmTrack = async (trackId: BgmTrackId) => {
    const nextMuted = trackId === "off" && !audioSettings.sfxEnabled;
    const updated = await updateAudioSettings({ bgmTrack: trackId, muted: nextMuted });
    setAudioSettings(updated);
    if (trackId !== "off") {
      await unlockAndStartBgm();
    }
    if (updated.sfxEnabled && !updated.muted) {
      void playSfx("seal");
    }
  };

  const handleToggleSfx = async () => {
    const nextSfx = !audioSettings.sfxEnabled;
    const updated = await updateAudioSettings({
      sfxEnabled: nextSfx,
      muted: !nextSfx && audioSettings.bgmTrack === "off",
    });
    setAudioSettings(updated);
    if (nextSfx) {
      void playSfx("seal");
    }
  };

  const handleTestGameSfx = async () => {
    await unlockAndStartBgm();
    await playSfx("seal");
    setTimeout(() => {
      void playSfx("success");
    }, 180);
  };

  const showTempNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleToggleLang = (lang: Locale) => {
    setLocale(lang);
    setCurrentLang(lang);
    showTempNotice(
      lang === "en" ? "Switched UI navigation to English." : "Đã chuyển ngôn ngữ giao diện sang Tiếng Việt."
    );
  };

  const openReminderModal = () => {
    setDraftEnabled(reminderPref.enabled);
    setDraftTime(reminderPref.localSendTime);
    setDraftFreq(reminderPref.frequency);
    setReminderPreviewFeedback(null);
    setReminderModalOpen(true);
  };

  const shiftDraftMinutes = (deltaMinutes: number) => {
    const { hour, minute } = parseTimeHHMM(draftTime);
    const total = (((hour * 60 + minute + deltaMinutes) % 1440) + 1440) % 1440;
    const nextH = String(Math.floor(total / 60)).padStart(2, "0");
    const nextM = String(total % 60).padStart(2, "0");
    setDraftTime(`${nextH}:${nextM}`);
  };

  const handleSendTestReminder = async () => {
    const res = await sendTestReminderNotification(draftTime);
    setReminderPreviewFeedback(res.message);
  };

  const handleSaveReminder = async () => {
    setReminderSaving(true);
    try {
      const { preference, syncedBackend } = await saveReminderPreferences({
        enabled: draftEnabled,
        paused: false,
        localSendTime: draftTime,
        frequency: draftFreq,
        timezone: world?.timezone || reminderPref.timezone || "Asia/Ho_Chi_Minh",
        consentConfirmed: draftEnabled,
      });
      setReminderPref(preference);
      setReminderModalOpen(false);
      if (!preference.enabled) {
        showTempNotice("Đã tắt lịch nhắc nhở hằng ngày.");
      } else if (preference.permissionStatus === "denied") {
        showTempNotice(`Đã lưu khung giờ ${preference.localSendTime}, vui lòng cấp quyền thông báo trong cài đặt thiết bị.`);
      } else {
        showTempNotice(
          `Đã lưu nhắc nhở sống khỏe lúc ${preference.localSendTime}${syncedBackend ? " (đã đồng bộ)" : ""}.`
        );
      }
    } finally {
      setReminderSaving(false);
    }
  };

  const handleLogout = () => {
    setConfirmModal("logout");
  };

  const handleDeleteAccount = () => {
    setConfirmModal("delete");
  };

  const handleConfirmAccountAction = async () => {
    const mode = confirmModal;
    setConfirmModal(null);
    if (!mode) return;
    await logout();
    router.replace("/(auth)/login");
    if (mode === "delete") {
      setStatusNotice("Yêu cầu xóa tài khoản đang được xử lý theo quy định bảo mật.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopHud
        level={Math.max(1, Math.floor(xpTotal / 100) + 1)}
        expTotal={xpTotal}
        keys={currencies.keys}
        fragments={currencies.fragments}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={require("../../assets/game/characters/chibi-anna.png")}
            style={styles.avatar}
            resizeMode="contain"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>
              {user?.email?.split("@")[0] || "Nhà Thám Hiểm"}
            </Text>
            <Text style={styles.emailText}>{user?.email || "Chưa có email"}</Text>
            <View style={styles.levelPill}>
              <Sparkles size={12} color={colors.gold} />
              <Text style={styles.levelPillText}>
                Cấp {Math.max(1, Math.floor(xpTotal / 100) + 1)} · {xpTotal} EXP
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Group */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Cài Đặt Hệ Thống</Text>

          {/* Language Switcher */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Globe size={18} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>{strings.profile.language}</Text>
            </View>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  currentLang === "vi" && styles.langBtnActive,
                ]}
                onPress={() => handleToggleLang("vi")}
              >
                <Text
                  style={[
                    styles.langText,
                    currentLang === "vi" && styles.langTextActive,
                  ]}
                >
                  VI
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  currentLang === "en" && styles.langBtnActive,
                ]}
                onPress={() => handleToggleLang("en")}
              >
                <Text
                  style={[
                    styles.langText,
                    currentLang === "en" && styles.langTextActive,
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Timezone Display */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Clock size={18} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>{strings.profile.timezone}</Text>
            </View>
            <Text style={styles.settingValue}>
              {world?.timezone || "Asia/Ho_Chi_Minh"}
            </Text>
          </View>

          {/* Daily Habit Reminders */}
          <TouchableOpacity
            style={styles.settingItem}
            accessibilityRole="button"
            accessibilityLabel="reminder-settings-row"
            onPress={openReminderModal}
            activeOpacity={0.75}
          >
            <View style={[styles.settingLeft, { flex: 1, marginRight: spacing.sm }]}>
              <Bell
                size={18}
                color={reminderPref.enabled ? colors.emeraldLight : colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Nhắc nhở hằng ngày</Text>
                <Text style={styles.settingHint}>
                  {reminderPref.enabled
                    ? `${
                        reminderPref.frequency === "daily"
                          ? "Mỗi ngày"
                          : reminderPref.frequency === "weekdays"
                            ? "Thứ 2 – Thứ 6"
                            : "Mỗi tuần (Thứ 2)"
                      }`
                    : "Chưa bật · Chạm để cài đặt"}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.reminderBadge,
                reminderPref.enabled && styles.reminderBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.reminderBadgeText,
                  reminderPref.enabled && styles.reminderBadgeTextActive,
                ]}
              >
                {reminderPref.enabled ? `Bật · ${reminderPref.localSendTime}` : "Tắt"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Game Audio & Background Music */}
          <TouchableOpacity
            style={styles.settingItem}
            accessibilityRole="button"
            accessibilityLabel="audio-settings-row"
            onPress={() => setAudioModalOpen(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.settingLeft, { flex: 1, marginRight: spacing.sm }]}>
              <Music
                size={18}
                color={!audioSettings.muted ? colors.goldLight : colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Âm thanh & Nhạc nền game</Text>
                <Text style={styles.settingHint}>
                  {audioSettings.muted
                    ? "Đang tắt tiếng · Chạm để chọn nhạc"
                    : `${BGM_TRACK_OPTIONS.find((t) => t.id === audioSettings.bgmTrack)?.label || "Rừng Ngọc Lục Bảo"} · Nút bấm: ${audioSettings.sfxEnabled ? "Bật" : "Tắt"}`}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.reminderBadge,
                !audioSettings.muted && styles.reminderBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.reminderBadgeText,
                  !audioSettings.muted && styles.reminderBadgeTextActive,
                ]}
              >
                {audioSettings.muted ? "Tắt" : "Bật"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Tài Khoản</Text>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={18} color={colors.textSecondary} />
            <Text style={styles.actionLabel}>{strings.auth.logout}</Text>
          </TouchableOpacity>

          {/* Delete Account (Apple Guideline Requirement) */}
          <TouchableOpacity
            style={[styles.actionItem, styles.dangerAction]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color={colors.rose} />
            <Text style={styles.dangerLabel}>{strings.auth.deleteAccount}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legalNotice}>
          <ShieldAlert size={14} color={colors.textMuted} />
          <Text style={styles.legalText}>
            HealthClues là ứng dụng hỗ trợ lối sống lành mạnh, không đưa ra chẩn
            đoán y khoa. Mọi tiến trình được bảo vệ an toàn và riêng tư.
          </Text>
        </View>

        {statusNotice && (
          <View style={styles.statusNoticeBox}>
            <Text style={styles.statusNoticeText}>{statusNotice}</Text>
          </View>
        )}
      </ScrollView>

      {/* Cross-platform Logout / Delete Confirmation Modal (works reliably on Web + iOS + Android) */}
      <Modal
        visible={!!confirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityLabel="profile-confirm-modal">
            <Text style={styles.modalTitle}>
              {confirmModal === "delete" ? strings.auth.deleteAccount : "Đăng xuất tài khoản"}
            </Text>
            <Text style={styles.modalDesc}>
              {confirmModal === "delete"
                ? strings.auth.deleteAccountConfirm
                : "Bạn có chắc chắn muốn đăng xuất khỏi phiên hiện tại?"}
            </Text>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, confirmModal === "delete" && { backgroundColor: colors.rose }]}
              accessibilityRole="button"
              accessibilityLabel="profile-confirm-action-btn"
              onPress={handleConfirmAccountAction}
            >
              <Text style={styles.modalConfirmBtnText}>
                {confirmModal === "delete" ? strings.common.confirm : strings.auth.logout}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              accessibilityRole="button"
              accessibilityLabel="profile-cancel-action-btn"
              onPress={() => setConfirmModal(null)}
            >
              <Text style={styles.modalCancelBtnText}>{strings.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Daily Habit Reminder Settings Modal */}
      <Modal
        visible={reminderModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReminderModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={styles.modalCard}
            accessibilityLabel="reminder-settings-modal"
          >
            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={styles.reminderScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.reminderHeaderRow}>
                <Bell size={20} color={colors.gold} />
                <Text style={styles.modalTitle}>Cài Đặt Nhắc Nhở</Text>
              </View>
              <Text style={styles.modalDesc}>
                Lumi chỉ nhắc nhẹ giờ điểm danh lối sống, hoàn toàn không thay thế tư vấn y khoa.
              </Text>

              {/* Opt-in Toggle */}
              <TouchableOpacity
                style={[
                  styles.reminderToggleRow,
                  draftEnabled && styles.reminderToggleRowActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="toggle-reminder-enabled"
                onPress={() => setDraftEnabled((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderToggleTitle}>
                    {draftEnabled ? "Đang bật nhắc nhở" : "Đang tắt nhắc nhở"}
                  </Text>
                  <Text style={styles.reminderToggleSub}>
                    Chạm để {draftEnabled ? "tạm tắt" : "bật nhắc nhở mỗi ngày"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.reminderSwitchPill,
                    draftEnabled && styles.reminderSwitchPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.reminderSwitchText,
                      draftEnabled && styles.reminderSwitchTextActive,
                    ]}
                  >
                    {draftEnabled ? "BẬT" : "TẮT"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Explicit non-clinical opt-in disclosure */}
              {draftEnabled && (
                <View style={styles.consentBanner}>
                  <Text style={styles.consentBannerText}>
                    Xác nhận đồng ý nhận thông báo nhắc thói quen lối sống (có thể tắt bất cứ lúc nào).
                  </Text>
                </View>
              )}

              {/* Time selector */}
              <Text style={styles.reminderSectionLabel}>Khung Giờ Nhắc Nhở</Text>
              <View style={styles.chipRow}>
                {TIME_PRESETS.map((preset) => {
                  const active = draftTime === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.chipBtn, active && styles.chipBtnActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`reminder-preset-${preset}`}
                      onPress={() => setDraftTime(preset)}
                    >
                      <Text
                        style={[
                          styles.chipBtnText,
                          active && styles.chipBtnTextActive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.timeStepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  accessibilityRole="button"
                  accessibilityLabel="reminder-time-minus"
                  onPress={() => shiftDraftMinutes(-30)}
                >
                  <Text style={styles.stepBtnText}>-30p</Text>
                </TouchableOpacity>
                <View style={styles.timeDisplayBox}>
                  <Text
                    style={styles.timeDisplayText}
                    accessibilityLabel="reminder-time-display"
                  >
                    {draftTime}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.stepBtn}
                  accessibilityRole="button"
                  accessibilityLabel="reminder-time-plus"
                  onPress={() => shiftDraftMinutes(30)}
                >
                  <Text style={styles.stepBtnText}>+30p</Text>
                </TouchableOpacity>
              </View>

              {/* Frequency selector */}
              <Text style={styles.reminderSectionLabel}>Tần Suất</Text>
              <View style={styles.chipRow}>
                {FREQUENCY_OPTIONS.map((opt) => {
                  const active = draftFreq === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.chipBtn, active && styles.chipBtnActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`reminder-freq-${opt.key}`}
                      onPress={() => setDraftFreq(opt.key)}
                    >
                      <Text
                        style={[
                          styles.chipBtnText,
                          active && styles.chipBtnTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Test notification preview button */}
              <TouchableOpacity
                style={styles.testReminderBtn}
                accessibilityRole="button"
                accessibilityLabel="test-reminder-btn"
                onPress={handleSendTestReminder}
                activeOpacity={0.8}
              >
                <Bell size={15} color={colors.gold} />
                <Text style={styles.testReminderBtnText}>Gửi thông báo thử</Text>
              </TouchableOpacity>

              {reminderPreviewFeedback && (
                <View
                  style={styles.previewFeedbackBox}
                  accessibilityLabel="reminder-preview-feedback"
                >
                  <Text style={styles.previewFeedbackText}>
                    {reminderPreviewFeedback}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.modalConfirmBtn, reminderSaving && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel="save-reminder-btn"
                disabled={reminderSaving}
                onPress={handleSaveReminder}
              >
                <Text style={styles.modalConfirmBtnText}>
                  {reminderSaving ? "Đang lưu..." : "Lưu Lịch Nhắc Nhở"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                accessibilityRole="button"
                accessibilityLabel="close-reminder-modal-btn"
                onPress={() => setReminderModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Đóng</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Game BGM & SFX Settings Modal */}
      <Modal
        visible={audioModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAudioModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={styles.modalCard}
            accessibilityLabel="audio-settings-modal"
          >
            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={styles.reminderScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.reminderHeaderRow}>
                <Volume2 size={20} color={colors.gold} />
                <Text style={styles.modalTitle}>Âm Thanh & Nhạc Nền RPG</Text>
              </View>
              <Text style={styles.modalDesc}>
                Tùy chỉnh nhạc nền thư giãn và hiệu ứng âm thanh cho từng thao tác chạm nút trong game.
              </Text>

              <TouchableOpacity
                style={[
                  styles.reminderToggleRow,
                  audioSettings.sfxEnabled && !audioSettings.muted && styles.reminderToggleRowActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="toggle-sfx-enabled"
                onPress={handleToggleSfx}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderToggleTitle}>Hiệu ứng nút bấm & Nhiệm vụ (SFX)</Text>
                  <Text style={styles.reminderToggleSub}>
                    Phát tiếng lách tách mộc & chuông nhận EXP
                  </Text>
                </View>
                <View
                  style={[
                    styles.reminderSwitchPill,
                    audioSettings.sfxEnabled && !audioSettings.muted && styles.reminderSwitchPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.reminderSwitchText,
                      audioSettings.sfxEnabled && !audioSettings.muted && styles.reminderSwitchTextActive,
                    ]}
                  >
                    {audioSettings.sfxEnabled && !audioSettings.muted ? "BẬT" : "TẮT"}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.reminderSectionLabel}>Chọn Nhạc Nền Không Gian</Text>
              {BGM_TRACK_OPTIONS.map((track) => {
                const selected = !audioSettings.muted
                  ? audioSettings.bgmTrack === track.id
                  : track.id === "off";
                return (
                  <TouchableOpacity
                    key={track.id}
                    style={[styles.audioTrackCard, selected && styles.audioTrackCardActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`bgm-track-${track.id}`}
                    onPress={() => handleSelectBgmTrack(track.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.audioTrackIconCircle}>
                      {track.id === "forest" ? (
                        <Trees size={16} color={selected ? colors.emeraldLight : colors.textGold} />
                      ) : track.id === "alpine" ? (
                        <Mountain size={16} color={selected ? colors.emeraldLight : colors.goldLight} />
                      ) : track.id === "night" ? (
                        <Moon size={16} color={selected ? colors.emeraldLight : colors.amethystLight} />
                      ) : (
                        <VolumeX size={16} color={colors.textSecondary} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.audioTrackTitle,
                          selected && { color: colors.emeraldLight },
                        ]}
                      >
                        {track.label}
                      </Text>
                      <Text style={styles.audioTrackDesc}>{track.desc}</Text>
                    </View>
                    <View
                      style={[
                        styles.reminderSwitchPill,
                        selected && styles.reminderSwitchPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.reminderSwitchText,
                          selected && styles.reminderSwitchTextActive,
                        ]}
                      >
                        {selected ? "ĐANG CHỌN" : "CHỌN"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.testReminderBtn}
                accessibilityRole="button"
                accessibilityLabel="test-sfx-btn"
                onPress={handleTestGameSfx}
                activeOpacity={0.8}
              >
                <Volume2 size={15} color={colors.gold} />
                <Text style={styles.testReminderBtnText}>Nghe thử hiệu ứng nút & EXP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                accessibilityRole="button"
                accessibilityLabel="close-audio-modal-btn"
                onPress={() => setAudioModalOpen(false)}
              >
                <Text style={styles.modalConfirmBtnText}>Xong</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    ...typography.h3,
    color: colors.textGold,
  },
  emailText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textEmerald,
  },
  settingsGroup: {
    marginBottom: spacing.xl,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  langToggle: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  langBtnActive: {
    backgroundColor: colors.emerald,
  },
  langText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  langTextActive: {
    color: "#ffffff",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dangerAction: {
    borderColor: "rgba(244, 63, 94, 0.3)",
    backgroundColor: "rgba(244, 63, 94, 0.05)",
  },
  dangerLabel: {
    ...typography.body,
    color: colors.rose,
  },
  legalNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  legalText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
  statusNoticeBox: {
    marginTop: spacing.md,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    borderColor: "rgba(16, 185, 129, 0.35)",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusNoticeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.emeraldLight,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "90%",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: "center",
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textGold,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
  modalConfirmBtn: {
    width: "100%",
    backgroundColor: colors.emeraldLight,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#061814",
  },
  modalCancelBtn: {
    width: "100%",
    paddingVertical: 9,
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  settingHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reminderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderBadgeActive: {
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    borderColor: colors.emerald,
  },
  reminderBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  reminderBadgeTextActive: {
    color: colors.emeraldLight,
  },
  reminderScrollContent: {
    gap: spacing.sm,
    alignItems: "stretch",
  },
  reminderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  reminderToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  reminderToggleRowActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: colors.emerald,
  },
  reminderToggleTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  reminderToggleSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reminderSwitchPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderSwitchPillActive: {
    backgroundColor: colors.emeraldLight,
    borderColor: colors.emeraldLight,
  },
  reminderSwitchText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  reminderSwitchTextActive: {
    color: "#061814",
  },
  consentBanner: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderColor: colors.borderGold,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  consentBannerText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textGold,
    textAlign: "center",
  },
  reminderSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chipBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    borderColor: colors.emeraldLight,
  },
  chipBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  chipBtnTextActive: {
    color: colors.emeraldLight,
  },
  timeStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginVertical: 2,
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  timeDisplayBox: {
    minWidth: 74,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: "#0a1c17",
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: "center",
  },
  timeDisplayText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textGold,
  },
  testReminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginTop: 2,
  },
  testReminderBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textGold,
  },
  previewFeedbackBox: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.35)",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  previewFeedbackText: {
    fontSize: 11.5,
    color: colors.emeraldLight,
    textAlign: "center",
    lineHeight: 16,
  },
  audioTrackCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
  },
  audioTrackCardActive: {
    borderColor: colors.emeraldLight,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
  },
  audioTrackIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  audioTrackTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  audioTrackDesc: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
