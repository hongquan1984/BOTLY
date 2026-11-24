import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import {
  X,
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clock,
  Compass,
  Plus,
  CheckCircle2,
  Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  soundscape,
  SOUND_TRACKS,
  SoundTrack,
} from "@/services/soundscapeEngine";
import { toolkitStorage } from "@/services/toolkitStorage";
import { colors, spacing, radius, fonts } from "@/theme";
import { useLocale } from "@/localization";

interface SoundGardenModalProps {
  visible: boolean;
  onClose: () => void;
  onAwardExp?: (amount: number, reason: string) => void;
}

export const SoundGardenModal: React.FC<SoundGardenModalProps> = ({
  visible,
  onClose,
  onAwardExp,
}) => {
  const { locale } = useLocale();
  const [activeSoundIds, setActiveSoundIds] = useState<string[]>([]);
  const [soundVolumes, setSoundVolumes] = useState<Record<string, number>>({});
  const [soundCategory, setSoundCategory] = useState<string>("all");
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [savedSoundIds, setSavedSoundIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toolkitLoading, setToolkitLoading] = useState(false);
  const [toolkitError, setToolkitError] = useState<string | null>(null);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const triggerSuccessHaptic = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  useEffect(() => {
    if (visible) {
      let isMounted = true;
      setActiveSoundIds(soundscape.getActiveTrackIds());
      setSleepTimer(soundscape.getSleepTimerMinutes());
      setToolkitLoading(true);
      setToolkitError(null);
      toolkitStorage.getSavedSoundIds()
        .then((ids) => { if (isMounted) setSavedSoundIds(ids); })
        .catch(() => setToolkitError(locale === "en" ? "Your Bag could not be loaded. Check your connection and try again." : "Không thể tải Túi Đồ. Hãy kiểm tra kết nối rồi thử lại."))
        .finally(() => { if (isMounted) setToolkitLoading(false); });
      return () => { isMounted = false; };
    }
  }, [visible, locale]);

  const handleToggleSound = (trackId: string) => {
    triggerHaptic();
    const isPlaying = activeSoundIds.includes(trackId);
    if (isPlaying) {
      soundscape.stopTrack(trackId);
      setActiveSoundIds((prev) => prev.filter((id) => id !== trackId));
    } else {
      const vol = soundVolumes[trackId] ?? 70;
      soundscape.setTrackVolume(trackId, vol);
      soundscape.playTrack(trackId);
      setActiveSoundIds((prev) => [...prev, trackId]);
      if (onAwardExp && activeSoundIds.length === 0) {
        onAwardExp(10, "Thư giãn cùng Nhà Âm Thanh");
      }
    }
  };

  const handleToggleSaveToBag = async (track: SoundTrack) => {
    triggerSuccessHaptic();
    setToolkitError(null);
    let result: { saved: boolean; ids: string[] };
    try {
      result = await toolkitStorage.toggleSound(track.id);
    } catch {
      setToolkitError(locale === "en" ? "Could not update your Bag. Try again." : "Không thể cập nhật Túi Đồ. Hãy thử lại.");
      return;
    }
    const { saved, ids } = result;
    setSavedSoundIds(ids);
    const trackName = locale === "en" ? (track.nameEn || track.name) : track.name;
    if (saved) {
      setToastMsg(
        locale === "en"
          ? `Saved "${trackName}" to Bag (+10 EXP)!`
          : `Đã cất "${trackName}" vào Túi Đồ (+10 EXP)!`
      );
      if (onAwardExp) {
        onAwardExp(
          10,
          locale === "en" ? `Saved ${trackName} to Bag` : `Lưu ${trackName} vào Túi Đồ`
        );
      }
    } else {
      setToastMsg(
        locale === "en"
          ? `Removed "${trackName}" from Bag.`
          : `Đã bỏ "${trackName}" khỏi Túi Đồ.`
      );
    }
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleVolumeChange = (trackId: string, delta: number) => {
    triggerHaptic();
    const currentVol =
      soundVolumes[trackId] ??
      SOUND_TRACKS.find((t) => t.id === trackId)?.defaultVolume ??
      70;
    const newVol = Math.max(10, Math.min(100, currentVol + delta));
    setSoundVolumes((prev) => ({ ...prev, [trackId]: newVol }));
    soundscape.setTrackVolume(trackId, newVol);
  };

  const handleCycleSleepTimer = () => {
    triggerHaptic();
    const options: (number | null)[] = [null, 15, 30, 60];
    const currentIndex = options.indexOf(sleepTimer);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextTimer = options[nextIndex];
    setSleepTimer(nextTimer);
    soundscape.setSleepTimer(nextTimer);
  };

  const handleMuteAllSounds = () => {
    triggerHaptic();
    soundscape.stopAllTracks();
    setActiveSoundIds([]);
  };

  const filteredSounds = SOUND_TRACKS.filter((track) => {
    if (soundCategory === "all") return true;
    return track.category === soundCategory;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={styles.headerIconRing}>
                <Music size={18} color="#38bdf8" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {locale === "en" ? "Sound Garden" : "Nhà Âm Thanh"}
                </Text>
                <Text style={styles.modalSub}>
                  {locale === "en"
                    ? "Soundscapes & 432Hz Brainwaves · Fairy Lyra"
                    : "Thư Viện Thanh Âm & Sóng Não 432Hz · Tiên Nữ Lyra"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Close Sound Garden" : "Đóng Nhà Âm Thanh"}
            >
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Toast Notification */}
          {toastMsg && (
            <View style={styles.toastBox}>
              <Sparkles size={14} color="#fef08a" />
              <Text style={styles.toastText}>{toastMsg}</Text>
            </View>
          )}
          {toolkitLoading && <Text style={styles.toolkitStatusText}>{locale === "en" ? "Loading your Bag…" : "Đang tải Túi Đồ…"}</Text>}
          {toolkitError && <Text style={styles.toolkitErrorText}>{toolkitError}</Text>}

          {/* Lyra Guardian Sticky Top Section (Always visible above scroll) */}
          <View style={styles.guardianTopSection}>
            <View style={styles.guardianCard}>
              <View style={styles.guardianAvatarCol}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>🎶</Text>
                </View>
                <Text style={styles.guardianRole}>
                  {locale === "en" ? "Sound Fairy" : "Tiên Thanh Âm"}
                </Text>
              </View>
              <View style={styles.guardianSpeechCol}>
                <View style={styles.guardianTitleRow}>
                  <Sparkles size={13} color="#38bdf8" />
                  <Text style={styles.guardianName}>
                    {locale === "en" ? "Sound Fairy · Lyra" : "Tiên Nữ Thanh Âm · Lyra"}
                  </Text>
                </View>
                <Text style={styles.guardianSpeechText} numberOfLines={2}>
                  {locale === "en"
                    ? "\"Greetings, traveler! I watch over the Sound Garden by the tranquil stream. Listen and tap '+ Save to Bag' to take these soothing melodies with you!\""
                    : "\"Chào lữ khách! Ta canh giữ Nhà Âm Thanh bên dòng suối mát. Bạn có thể nghe thử và bấm '+ Lưu Vào Túi Đồ' để mang theo nhé!\""}
                </Text>

                {/* Quick Tools Row: Timer + Mute All */}
                <View style={styles.quickToolsRow}>
                  <TouchableOpacity
                    style={styles.quickToolPill}
                    onPress={handleCycleSleepTimer}
                  >
                    <Clock size={12} color="#38bdf8" />
                    <Text style={styles.quickToolPillText}>
                      {sleepTimer
                        ? (locale === "en" ? `Timer: ${sleepTimer}m` : `Hẹn giờ: ${sleepTimer}p`)
                        : (locale === "en" ? "Timer: Infinite" : "Hẹn giờ: Vô tận")}
                    </Text>
                  </TouchableOpacity>

                  {activeSoundIds.length > 0 && (
                    <TouchableOpacity
                      style={[styles.quickToolPill, { borderColor: "#f87171" }]}
                      onPress={handleMuteAllSounds}
                    >
                      <VolumeX size={12} color="#f87171" />
                      <Text style={[styles.quickToolPillText, { color: "#f87171" }]}>
                        {locale === "en" ? "Stop All" : "Tắt tất cả"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Sound Category Filter Pills */}
            <View style={styles.filterPillsRow}>
              {[
                { id: "all", label: locale === "en" ? `All (${SOUND_TRACKS.length})` : `Tất Cả (${SOUND_TRACKS.length})` },
                { id: "nature", label: locale === "en" ? "Nature" : "Thiên Nhiên" },
                { id: "frequency", label: locale === "en" ? "Brainwaves 432Hz" : "Sóng Não 432Hz" },
                { id: "hypnosis", label: locale === "en" ? "Hypnosis" : "Thôi Miên" },
              ].map((pill) => (
                <TouchableOpacity
                  key={pill.id}
                  style={[
                    styles.pillBtn,
                    soundCategory === pill.id && styles.pillBtnActive,
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setSoundCategory(pill.id);
                  }}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      soundCategory === pill.id && styles.pillBtnTextActive,
                    ]}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Sound Tracks List */}
            {filteredSounds.map((track) => {
              const isPlaying = activeSoundIds.includes(track.id);
              const isSaved = savedSoundIds.includes(track.id);
              const volume = soundVolumes[track.id] ?? track.defaultVolume;
              const trackName = locale === "en" ? (track.nameEn || track.name) : track.name;
              const trackCategory = locale === "en" ? (track.categoryLabelEn || track.categoryLabel) : track.categoryLabel;
              const trackDesc = locale === "en" ? (track.descriptionEn || track.description) : track.description;

              return (
                <View
                  key={track.id}
                  style={[
                    styles.itemCard,
                    isPlaying && styles.itemCardSoundPlaying,
                  ]}
                >
                  <View style={styles.itemHeaderRow}>
                    <View style={styles.soundEmojiBox}>
                      <Text style={styles.soundEmoji}>{track.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={styles.itemCategoryRow}>
                        <Text style={styles.itemCategoryBadge}>
                          {trackCategory}
                        </Text>
                      </View>
                      <Text style={styles.itemTitle}>{trackName}</Text>
                      <Text style={styles.itemSubtitle}>{trackDesc}</Text>
                    </View>

                    {/* Toggle Button */}
                    <TouchableOpacity
                      style={[
                        styles.soundToggleBtn,
                        isPlaying && styles.soundToggleBtnActive,
                      ]}
                      onPress={() => handleToggleSound(track.id)}
                      activeOpacity={0.8}
                    >
                      {isPlaying ? (
                        <>
                          <Volume2 size={15} color="#061a15" />
                          <Text style={styles.soundToggleBtnTextActive}>
                            {locale === "en" ? "ON ılılı" : "BẬT ılılı"}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Play size={13} color="#38bdf8" />
                          <Text style={styles.soundToggleBtnText}>
                            {locale === "en" ? "PLAY" : "BẬT"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Volume Slider & Controls */}
                  {isPlaying && (
                    <View style={styles.volumeBarRow}>
                      <Volume2 size={14} color="#38bdf8" />
                      <Text style={styles.volumeLabel}>
                        {locale === "en" ? `Volume: ${volume}%` : `Âm lượng: ${volume}%`}
                      </Text>

                      <View style={styles.volumeStepBtns}>
                        <TouchableOpacity
                          style={styles.volStepBtn}
                          onPress={() => handleVolumeChange(track.id, -10)}
                        >
                          <Text style={styles.volStepBtnText}>-</Text>
                        </TouchableOpacity>
                        <View style={styles.volTrackLine}>
                          <View
                            style={[
                              styles.volTrackFill,
                              { width: `${volume}%` },
                            ]}
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.volStepBtn}
                          onPress={() => handleVolumeChange(track.id, 10)}
                        >
                          <Text style={styles.volStepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Clinical Context / Lore */}
                  {track.pubmedOrLore && (
                    <View style={styles.studyNoteBox}>
                      <Text style={styles.studyNoteText}>
                        🔬 {track.pubmedOrLore}
                      </Text>
                    </View>
                  )}

                  {/* Action Row: Lưu vào Túi Đồ */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.saveToBagBtn,
                        isSaved && styles.saveToBagBtnSaved,
                      ]}
                      onPress={() => handleToggleSaveToBag(track)}
                      activeOpacity={0.8}
                      accessibilityLabel={
                        isSaved
                          ? (locale === "en" ? "Saved in Bag" : "Đã có trong túi đồ")
                          : (locale === "en" ? "Save to Bag" : "Lưu vào túi đồ")
                      }
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 size={13} color="#34d399" />
                          <Text style={styles.saveToBagBtnTextSaved}>
                            {locale === "en" ? "Saved in Bag ✓" : "Đã Có Trong Túi Đồ ✓"}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Plus size={13} color="#38bdf8" />
                          <Text style={styles.saveToBagBtnText}>
                            {locale === "en" ? "Save to Bag (+10 EXP)" : "Lưu Vào Túi Đồ (+10 EXP)"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Master Playback Bar at Bottom */}
          {activeSoundIds.length > 0 && (
            <View style={styles.masterPlaybackBar}>
              <View style={styles.masterPlaybackLeft}>
                <View style={styles.liveAudioWavePulse}>
                  <Text style={{ fontSize: 13 }}>🌊</Text>
                </View>
                <Text style={styles.masterPlaybackText}>
                  Đang phát {activeSoundIds.length} âm thanh song song 🎵
                </Text>
              </View>
              <TouchableOpacity
                style={styles.masterPauseBtn}
                onPress={handleMuteAllSounds}
              >
                <Pause size={14} color="#061a15" />
                <Text style={styles.masterPauseBtnText}>Tắt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 10, 8, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    backgroundColor: "#071a15",
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.45)",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(6, 26, 21, 0.8)",
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "#38bdf8",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
  },
  modalSub: {
    fontSize: 11,
    color: "#38bdf8",
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  toolkitStatusText: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  toolkitErrorText: {
    color: "#fca5a5",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  guardianTopSection: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(5, 22, 18, 0.95)",
  },
  guardianCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 38, 30, 0.75)",
    borderRadius: radius.lg,
    borderWidth: 1.2,
    borderColor: "rgba(56, 189, 248, 0.45)",
    padding: 10,
    marginBottom: 8,
    gap: spacing.sm,
  },
  guardianAvatarCol: {
    alignItems: "center",
    width: 58,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1.5,
    borderColor: "#38bdf8",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  guardianRole: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#38bdf8",
    marginTop: 4,
    textAlign: "center",
  },
  guardianSpeechCol: {
    flex: 1,
  },
  guardianTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  guardianName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#38bdf8",
  },
  guardianSpeechText: {
    fontSize: 11.5,
    color: "#cbd5e1",
    lineHeight: 16,
    fontStyle: "italic",
  },
  quickToolsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  quickToolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
  },
  quickToolPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#38bdf8",
  },
  filterPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.md,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pillBtnActive: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: "#38bdf8",
  },
  pillBtnText: {
    fontSize: 11.5,
    color: "#94a3b8",
    fontWeight: "600",
  },
  pillBtnTextActive: {
    color: "#38bdf8",
    fontWeight: "800",
  },
  itemCard: {
    backgroundColor: "rgba(8, 30, 24, 0.7)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemCardSoundPlaying: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(10, 42, 36, 0.85)",
  },
  itemHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  soundEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  soundEmoji: {
    fontSize: 22,
  },
  itemCategoryRow: {
    marginBottom: 2,
  },
  itemCategoryBadge: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#38bdf8",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f8fafc",
  },
  itemSubtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
    lineHeight: 15,
  },
  soundToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
  },
  soundToggleBtnActive: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8",
  },
  soundToggleBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38bdf8",
  },
  soundToggleBtnTextActive: {
    fontSize: 11,
    fontWeight: "800",
    color: "#061a15",
  },
  volumeBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  volumeLabel: {
    fontSize: 11,
    color: "#38bdf8",
    fontWeight: "700",
    width: 90,
  },
  volumeStepBtns: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  volStepBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#38bdf8",
  },
  volTrackLine: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  volTrackFill: {
    height: "100%",
    backgroundColor: "#38bdf8",
  },
  studyNoteBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  studyNoteText: {
    fontSize: 10,
    color: "#64748b",
    fontStyle: "italic",
  },
  masterPlaybackBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(6, 26, 21, 0.95)",
    borderTopWidth: 1.5,
    borderTopColor: "#38bdf8",
  },
  masterPlaybackLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveAudioWavePulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  masterPlaybackText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38bdf8",
  },
  masterPauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#38bdf8",
  },
  masterPauseBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#061a15",
  },
  toastBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  toastText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38bdf8",
  },
  cardActionsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  saveToBagBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  saveToBagBtnSaved: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  saveToBagBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#38bdf8",
  },
  saveToBagBtnTextSaved: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#34d399",
  },
});
