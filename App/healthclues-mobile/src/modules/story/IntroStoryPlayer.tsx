import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import {
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
} from "lucide-react-native";
import { t, Locale } from "@/localization";
import { playSfx } from "@/services/gameAudio";
import { playDolphinChirp, playDolphinGiggle } from "@/modules/audio/dolphinAudio";
import { saveStoryProgress, markStoryCompleted, markStorySkipped } from "./storyState";

// High-fidelity Ghibli-inspired storyboard posters for the 3 scenes
const FALLBACK_POSTERS = [
  require("../../../assets/story/story_poster_1_portal.jpg"),
  require("../../../assets/story/story_poster_2_lumi.jpg"),
  require("../../../assets/story/story_poster_3_realm.jpg"),
];

// Video URIs (loaded from assets/videos/)
const STORY_VIDEOS = [
  "/assets/videos/1.mp4",
  "/assets/videos/2.mp4",
  "/assets/videos/3.mp4",
];

export interface IntroStoryPlayerProps {
  locale?: Locale;
  onFinish: () => void;
  onSkip?: () => void;
  initialIndex?: number;
}

export function IntroStoryPlayer({
  locale = "vi",
  onFinish,
  onSkip,
  initialIndex = 0,
}: IntroStoryPlayerProps) {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Floating animation for dialogue box & ambient glow
  const floatAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 1300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [floatAnim, pulseAnim]);

  // Read current scene translations
  const strings = t().story;
  const currentSceneData = [
    {
      title: strings.video1.title,
      speaker: strings.video1.speaker,
      text: strings.video1.text,
      caption: strings.video1.caption,
      isLumi: false,
    },
    {
      title: strings.video2.title,
      speaker: strings.video2.speaker,
      text: strings.video2.text,
      caption: strings.video2.caption,
      isLumi: true,
    },
    {
      title: strings.video3.title,
      speaker: strings.video3.speaker,
      text: strings.video3.text,
      caption: strings.video3.caption,
      isLumi: true,
    },
  ][currentIndex] || {
    title: "",
    speaker: "",
    text: "",
    caption: "",
    isLumi: false,
  };

  const handleNext = async () => {
    void playSfx("tap");
    if (currentIndex < 2) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setVideoError(false);
      setIsPlaying(true);
      await saveStoryProgress(nextIdx, false, false);
      if (nextIdx === 1) playDolphinGiggle(0.4);
      else playDolphinChirp(0.35);
    } else {
      // Completed all 3 videos
      await markStoryCompleted();
      void playSfx("seal");
      onFinish();
    }
  };

  const handleSkip = async () => {
    void playSfx("tap");
    await markStorySkipped();
    if (onSkip) {
      onSkip();
    } else {
      onFinish();
    }
  };

  const handleTogglePlay = () => {
    void playSfx("tap");
    setIsPlaying((prev) => {
      const next = !prev;
      if (Platform.OS === "web" && videoRef.current) {
        if (next) videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
      return next;
    });
  };

  const animatedBoxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const isLandscape = width > height;

  return (
    <View style={[styles.container, isLandscape ? styles.containerLandscape : styles.containerPortrait]}>
      {/* 1. Top Header Controls */}
      <View style={[styles.topControlsRow, isLandscape ? styles.topControlsRowLandscape : styles.topControlsRowPortrait]}>
        {/* Progress Segments (1/3, 2/3, 3/3) */}
        <View style={styles.progressSegmentsWrap}>
          {[0, 1, 2].map((idx) => {
            const isFilled = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.segmentTrack,
                  isFilled && styles.segmentTrackFilled,
                  isCurrent && styles.segmentTrackCurrent,
                ]}
              />
            );
          })}
        </View>

        {/* Action Buttons: Play/Pause, Mute & Skip */}
        <View style={styles.topActionsGroup}>
          <View style={styles.leftActionButtonsRow}>
            <TouchableOpacity
              style={styles.glassCircleBtn}
              onPress={handleTogglePlay}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? strings.controls.pause : strings.controls.play}
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause size={14} color="#fef08a" />
              ) : (
                <Play size={14} color="#fef08a" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.glassCircleBtn}
              onPress={() => setIsMuted((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
              activeOpacity={0.8}
            >
              {isMuted ? (
                <VolumeX size={14} color="#fef08a" />
              ) : (
                <Volume2 size={14} color="#fef08a" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.skipPillBtn}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={strings.controls.skip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipPillText}>{strings.controls.skip}</Text>
            <ArrowRight size={13} color="#fef08a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Video / Poster Media Viewport (Fixed width, natural height, zero overlap in portrait) */}
      <View style={[styles.mediaContainer, isLandscape ? styles.mediaContainerLandscape : styles.mediaContainerPortrait]}>
        {Platform.OS === "web" && !videoError ? (
          <video
            ref={videoRef}
            key={currentIndex}
            src={STORY_VIDEOS[currentIndex]}
            poster=""
            playsInline
            autoPlay
            loop
            muted={isMuted}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={() => {
              console.warn("Video playback error, falling back to poster");
              setVideoError(true);
            }}
          />
        ) : (
          <View style={styles.posterWrapper}>
            <Image
              source={FALLBACK_POSTERS[currentIndex]}
              style={styles.posterImage}
              contentFit="cover"
              transition={300}
            />
          </View>
        )}

        {/* Ambient Floating Particle Glow (Landscape only) */}
        {isLandscape && (
          <Animated.View style={[styles.ambientGlow, animatedGlowStyle]} pointerEvents="none" />
        )}
      </View>

      {/* 3. Bottom Narrative Dialogue Card (Separate block below video in portrait) */}
      <View style={[styles.bottomCardWrapper, isLandscape ? styles.bottomCardWrapperLandscape : styles.bottomCardWrapperPortrait]}>
        <View style={[styles.dialogueCard, !isLandscape && styles.dialogueCardPortrait]}>
          {/* Speaker Badge & Step */}
          <View style={styles.speakerRow}>
            <View
              style={[
                styles.speakerBadge,
                currentSceneData.isLumi && styles.speakerBadgeLumi,
              ]}
            >
              <Sparkles size={13} color={currentSceneData.isLumi ? "#34d399" : "#fbbf24"} />
              <Text
                style={[
                  styles.speakerNameText,
                  currentSceneData.isLumi && styles.speakerNameTextLumi,
                ]}
              >
                {currentSceneData.speaker}
              </Text>
            </View>

            <View style={styles.sceneStepBadge}>
              <Text style={styles.sceneStepText}>
                {strings.controls.step
                  .replace("{current}", (currentIndex + 1).toString())
                  .replace("{total}", "3")}
              </Text>
            </View>
          </View>

          {/* Dialogue Text (Scrollable on small screens, zero clipping) */}
          <ScrollView
            style={styles.dialogueTextScrollView}
            contentContainerStyle={styles.dialogueTextScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.dialogueBodyText}>{currentSceneData.text}</Text>
          </ScrollView>

          {/* Action Footer: Caption & "Tiếp tục" CTA */}
          <View style={styles.dialogueFooterRow}>
            <View style={styles.captionWrap}>
              <Compass size={12} color="rgba(255, 255, 255, 0.45)" />
              <Text style={styles.captionText} numberOfLines={1}>
                {currentSceneData.caption}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.continueCtaBtn}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={strings.controls.continue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueCtaText}>{strings.controls.continue}</Text>
              <ArrowRight size={16} color="#052e2b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#030e0b",
  },
  containerPortrait: {
    flex: 1,
    flexDirection: "column",
  },
  containerLandscape: {
    flex: 1,
    position: "relative",
  },
  topControlsRow: {
    gap: 10,
  },
  topControlsRowPortrait: {
    paddingTop: Platform.OS === "android" ? 14 : 20,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#030e0b",
  },
  topControlsRowLandscape: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  progressSegmentsWrap: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
  },
  segmentTrack: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  segmentTrackFilled: {
    backgroundColor: "rgba(52, 211, 153, 0.65)",
  },
  segmentTrackCurrent: {
    backgroundColor: "#34d399",
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  topActionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftActionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  glassCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(5, 22, 17, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(254, 240, 138, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  skipPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(5, 22, 17, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(254, 240, 138, 0.35)",
  },
  skipPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fef08a",
    letterSpacing: 0.3,
  },
  mediaContainer: {
    overflow: "hidden",
  },
  mediaContainerPortrait: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderBottomWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  mediaContainerLandscape: {
    ...StyleSheet.absoluteFillObject,
  },
  posterWrapper: {
    width: "100%",
    height: "100%",
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  ambientGlow: {
    position: "absolute",
    top: "25%",
    left: "20%",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(52, 211, 153, 0.08)",
  },
  bottomCardWrapper: {},
  bottomCardWrapperPortrait: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Platform.OS === "android" ? 14 : 20,
    backgroundColor: "#030e0b",
  },
  bottomCardWrapperLandscape: {
    position: "absolute",
    bottom: 14,
    left: 20,
    right: 20,
    maxWidth: 680,
    alignSelf: "center",
    zIndex: 25,
  },
  dialogueCard: {
    backgroundColor: "rgba(4, 20, 16, 0.95)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.4)",
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  dialogueCardPortrait: {
    flex: 1,
    justifyContent: "space-between",
  },
  speakerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  speakerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(251, 191, 36, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.35)",
  },
  speakerBadgeLumi: {
    backgroundColor: "rgba(52, 211, 153, 0.16)",
    borderColor: "rgba(52, 211, 153, 0.45)",
  },
  speakerNameText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fbbf24",
    letterSpacing: 0.4,
  },
  speakerNameTextLumi: {
    color: "#34d399",
  },
  sceneStepBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  sceneStepText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  dialogueTextScrollView: {
    flex: 1,
    marginVertical: 4,
  },
  dialogueTextScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  dialogueBodyText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    color: "#ffffff",
    fontFamily: Platform.OS === "ios" ? "Spectral-Bold" : "serif",
  },
  dialogueFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    gap: 10,
  },
  captionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  captionText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
    flexShrink: 1,
  },
  continueCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#34d399",
  },
  continueCtaText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052e2b",
    letterSpacing: 0.2,
  },
});
