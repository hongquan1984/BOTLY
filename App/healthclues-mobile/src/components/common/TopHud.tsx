import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  DeviceEventEmitter,
} from "react-native";
import { Sparkles, Key, Gem, Volume2, VolumeX } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/theme";
import {
  AUDIO_STATE_EVENT,
  DEFAULT_AUDIO_SETTINGS,
  GameAudioSettings,
  loadAudioSettings,
  playSfx,
  unlockAndStartBgm,
  updateAudioSettings,
} from "@/services/gameAudio";

interface TopHudProps {
  level?: number;
  expTotal?: number;
  keys?: number;
  fragments?: number;
  onlineCount?: number;
  regionTitle?: string;
}

export function TopHud({
  level = 1,
  expTotal = 0,
  keys = 0,
  fragments = 0,
  onlineCount = 1,
}: TopHudProps) {
  const { height } = useWindowDimensions();
  const isShort = height < 520;
  const [audio, setAudio] = useState<GameAudioSettings>(DEFAULT_AUDIO_SETTINGS);

  useEffect(() => {
    let active = true;
    loadAudioSettings().then((s) => {
      if (active) setAudio(s);
    });
    const sub = DeviceEventEmitter.addListener(AUDIO_STATE_EVENT, (next: GameAudioSettings) => {
      if (active && next) setAudio(next);
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const isSoundOff = audio.muted || (audio.bgmTrack === "off" && !audio.sfxEnabled);

  const handleToggleAudio = async () => {
    const nextMuted = !isSoundOff;
    const updated = await updateAudioSettings({
      muted: nextMuted,
      ...(nextMuted === false && audio.bgmTrack === "off" && !audio.sfxEnabled
        ? { bgmTrack: "forest", sfxEnabled: true }
        : {}),
    });
    setAudio(updated);
    if (!nextMuted) {
      await unlockAndStartBgm();
      await playSfx("tap");
    }
  };

  return (
    <View style={[styles.container, isShort && styles.containerShort]}>
      {/* Level & EXP Capsule */}
      <View style={styles.expCapsule}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.{level}</Text>
        </View>
        <View style={styles.expBody}>
          <Sparkles size={13} color={colors.gold} />
          <Text style={styles.expText}>{expTotal} EXP</Text>
        </View>
      </View>

      {/* Currencies, Sound Toggle & Online Status */}
      <View style={styles.rightGroup}>
        {keys > 0 && (
          <View style={styles.currencyBadge}>
            <Key size={13} color={colors.goldLight} />
            <Text style={styles.currencyText}>{keys}</Text>
          </View>
        )}

        {fragments > 0 && (
          <View style={styles.currencyBadge}>
            <Gem size={13} color={colors.amethystLight} />
            <Text style={styles.currencyText}>{fragments}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.soundBadge, !isSoundOff && styles.soundBadgeActive]}
          accessibilityRole="button"
          accessibilityLabel="hud-audio-toggle-btn"
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          onPress={handleToggleAudio}
          activeOpacity={0.75}
        >
          {isSoundOff ? (
            <VolumeX size={14} color={colors.textSecondary} />
          ) : (
            <Volume2 size={14} color={colors.goldLight} />
          )}
        </TouchableOpacity>

        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{onlineCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(8, 19, 17, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  containerShort: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  expCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingRight: spacing.md,
    overflow: "hidden",
  },
  levelBadge: {
    backgroundColor: colors.goldDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  expBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: spacing.sm,
  },
  expText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.textGold,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  soundBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  soundBadgeActive: {
    borderColor: colors.borderGold,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderEmerald,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.emerald,
  },
  onlineText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.textEmerald,
  },
});
