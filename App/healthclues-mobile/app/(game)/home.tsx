import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
  useWindowDimensions,
  GestureResponderEvent,
  LayoutChangeEvent,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Sun,
  Moon,
  Clock,
  Gift,
  Sparkles,
  Check,
  Sofa,
  Bed,
  RotateCcw,
  Maximize2,
  Minimize2,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  Users,
  PackageCheck,
  LayoutGrid,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/theme";
import { TopHud } from "@/components/common/TopHud";
import { useAuth } from "@/hooks/useAuth";
import { useWorld } from "@/hooks/useWorld";
import {
  useWellnessHome,
  CHIBI_COMPANIONS,
  ROOM_BACKGROUNDS,
  WellnessHomeItem,
  RoomId,
  clampHomePointToFloor,
  pickRandomHomeFloorPoint,
  buildHomeWalkWaypoints,
  getCompanionDepthScale,
} from "@/hooks/useWellnessHome";
import { useMobileHomeParallax } from "@/hooks/useMobileHomeParallax";

type DockTab = "claimed" | "all" | "chibi";

function getItemCenterPct(item: WellnessHomeItem): number {
  const minX = Math.min(item.corners.tl[0], item.corners.bl[0]);
  const maxX = Math.max(item.corners.tr[0], item.corners.br[0]);
  return (minX + maxX) / 2;
}

export default function HomeScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const { xpTotal, currencies } = useWorld(isAuthenticated);
  const {
    catalog,
    homeState,
    loading,
    busy,
    dayNightMode,
    isNight,
    visibleItems,
    currentCompanion,
    claimWelcome,
    getDailyRewardChoices,
    claimDailyReward,
    switchRoom,
    cycleDayNight,
    selectCompanion,
    resetHome,
  } = useWellnessHome(isAuthenticated);
  const parallax = useMobileHomeParallax("normal");

  // Measure actual available full-screen game viewport between TopHud & bottom 6-tab bar
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: screenWidth,
    height: Math.max(480, screenHeight - 110),
  });
  const [overviewMode, setOverviewMode] = useState(false);

  const handleViewportLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 100 && height > 200) {
      setViewportSize((prev) =>
        Math.abs(prev.width - width) > 2 || Math.abs(prev.height - height) > 2
          ? { width, height }
          : prev
      );
    }
  }, []);

  // Full-bleed 16:9 panoramic sizing (fills 100% screen height & width on every device)
  const fitFullscreenHeight = Math.max(viewportSize.height, Math.round(viewportSize.width * (9 / 16)));
  const fitFullscreenWidth = Math.round(fitFullscreenHeight * (16 / 9));

  const overviewWidth = viewportSize.width;
  const overviewHeight = Math.round(overviewWidth * (9 / 16));

  const stageWidth = overviewMode ? overviewWidth : fitFullscreenWidth;
  const stageHeight = overviewMode ? overviewHeight : fitFullscreenHeight;
  const verticalOffset = Math.round((viewportSize.height - stageHeight) / 2);

  // Companion sizing scaled cleanly to room proportion + 2.5D perspective depth
  const baseChibiSize = overviewMode
    ? Math.min(44, Math.max(26, Math.round(stageHeight * 0.16)))
    : Math.min(72, Math.max(34, Math.round(stageHeight * 0.095)));

  // Bottom compact dock state (Claimed furniture | Full catalog | Chibi companions)
  const [dockTab, setDockTab] = useState<DockTab>("claimed");
  const [dockCollapsed, setDockCollapsed] = useState(screenHeight < 480);

  // Auto-tuck item tray on very short landscape viewports so house fills the frame
  useEffect(() => {
    setDockCollapsed(screenHeight < 480);
  }, [screenHeight < 480]);

  // Companion position, doorway waypoint queue & animations
  const [companionPos, setCompanionPos] = useState<{ x: number; y: number }>({ x: 60, y: 77 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 60, y: 77 });
  const [walkQueue, setWalkQueue] = useState<{ x: number; y: number }[]>([]);
  const [isWalking, setIsWalking] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(true);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  const depthScale = getCompanionDepthScale(companionPos.y, homeState.activeRoom);
  const chibiRenderW = Math.round(baseChibiSize * depthScale);
  const chibiRenderH = Math.round(chibiRenderW * 1.15);
  const chibiZIndex =
    homeState.activeRoom === "scene_interior_wide"
      ? companionPos.y < 63
        ? 500
        : companionPos.y < 76
        ? 680
        : 1050
      : companionPos.y < 72
      ? 500
      : 1050;

  // Modals & highlights
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [dailyRewardModalOpen, setDailyRewardModalOpen] = useState(false);
  const [rewardChoices, setRewardChoices] = useState<WellnessHomeItem[]>([]);
  const [selectedReward, setSelectedReward] = useState<WellnessHomeItem | null>(null);
  const [inspectedItem, setInspectedItem] = useState<WellnessHomeItem | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const hScrollRef = useRef<ScrollView>(null);
  const stageRef = useRef<View>(null);
  const viewportRef = useRef<View>(null);
  const walkBob = useRef(new Animated.Value(0)).current;
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag-to-look 2.5D parallax on stage canvas (zero swaying when idle; activates on horizontal/drag pan)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const node = stageRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== "function") return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const vp = viewportRef.current as unknown as HTMLElement | null;
      const rect = (vp || node).getBoundingClientRect();
      parallax.beginWebDrag(e.clientX, e.clientY, rect.width, rect.height);
    };

    node.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
    };
  }, [parallax.beginWebDrag]);

  // Pan horizontal camera smoothly to keep focused spot centered in portrait phones
  const scrollToPct = useCallback(
    (pct: number, animated = true) => {
      if (overviewMode || stageWidth <= viewportSize.width || !hScrollRef.current) return;
      const targetX = (pct / 100) * stageWidth - viewportSize.width / 2;
      const maxScroll = Math.max(0, stageWidth - viewportSize.width);
      const clampedX = Math.max(0, Math.min(maxScroll, Math.round(targetX)));
      hScrollRef.current.scrollTo({ x: clampedX, animated });
    },
    [overviewMode, stageWidth, viewportSize.width]
  );

  // Auto-center Living Room (51%) / Bedroom (50%) when entering full-screen stage
  useEffect(() => {
    if (overviewMode) return;
    const defaultPct = homeState.activeRoom === "scene_bedroom" ? 50 : 51;
    const t = setTimeout(() => {
      scrollToPct(defaultPct, false);
    }, 60);
    return () => clearTimeout(t);
  }, [homeState.activeRoom, overviewMode, stageWidth, viewportSize.width, scrollToPct]);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3400);
  }, []);

  const showSpeech = useCallback((quote: string, duration = 4500) => {
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    setSpeechBubble(quote);
    speechTimerRef.current = setTimeout(() => {
      setSpeechBubble(null);
    }, duration);
  }, []);

  // Automatically open Starter Welcome Gift when home has not claimed Day 1 Sofa
  useEffect(() => {
    if (!loading && !homeState.hasClaimedWelcome) {
      setWelcomeModalOpen(true);
    } else if (!loading && homeState.hasClaimedWelcome) {
      setWelcomeModalOpen(false);
    }
  }, [loading, homeState.hasClaimedWelcome]);

  // Companion walk movement loop (smooth stroll + doorway waypoint queue)
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => {
      setCompanionPos((curr) => {
        const dx = targetPos.x - curr.x;
        const dy = targetPos.y - curr.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.65) {
          if (walkQueue.length > 0) {
            const [nextPt, ...rest] = walkQueue;
            setWalkQueue(rest);
            setFacingLeft(nextPt.x < curr.x);
            setTargetPos(nextPt);
            return curr;
          }

          setIsWalking(false);
          const quotes = currentCompanion.quotes;
          let contextual: string | null = null;
          if (homeState.activeRoom === "scene_interior_wide") {
            if (curr.y <= 62.5) {
              contextual = quotes.scenery[Math.floor(Math.random() * quotes.scenery.length)];
            } else if (curr.x < 32) {
              contextual = quotes.fireplace[Math.floor(Math.random() * quotes.fireplace.length)];
            }
          } else if (curr.y <= 64 || curr.x >= 72) {
            contextual = quotes.scenery[Math.floor(Math.random() * quotes.scenery.length)];
          }
          if (!contextual && Math.random() < 0.5) {
            contextual = quotes.general[Math.floor(Math.random() * quotes.general.length)];
          }
          if (contextual) showSpeech(contextual);
          return curr;
        }

        const step = 0.42;
        return {
          x: curr.x + (dx / dist) * step,
          y: curr.y + (dy / dist) * step,
        };
      });
    }, 32);

    return () => clearInterval(interval);
  }, [targetPos, walkQueue, isWalking, homeState.activeRoom, currentCompanion, showSpeech]);

  // Autonomous wander on indoor floor & out onto the sunny lake balcony
  useEffect(() => {
    if (isWalking || welcomeModalOpen || dailyRewardModalOpen || inspectedItem || resetConfirmOpen || isWaving) {
      return;
    }
    const timer = setTimeout(() => {
      const pt = pickRandomHomeFloorPoint(homeState.activeRoom);
      const waypoints = buildHomeWalkWaypoints(companionPos, pt, homeState.activeRoom);
      const [first, ...rest] = waypoints;
      setFacingLeft(first.x < companionPos.x);
      setTargetPos(first);
      setWalkQueue(rest);
      setIsWalking(true);
    }, 5200);
    return () => clearTimeout(timer);
  }, [isWalking, homeState.activeRoom, welcomeModalOpen, dailyRewardModalOpen, inspectedItem, resetConfirmOpen, isWaving, companionPos]);

  // Walk bob animation
  useEffect(() => {
    if (isWalking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(walkBob, { toValue: -5, duration: 150, useNativeDriver: true }),
          Animated.timing(walkBob, { toValue: 0, duration: 150, useNativeDriver: true }),
        ])
      ).start();
    } else {
      walkBob.setValue(0);
    }
  }, [isWalking, walkBob]);

  // Tap floor to walk Chibi within floor boundaries (ignored when dragging 2.5D view)
  const handleStagePress = (e: GestureResponderEvent) => {
    if (parallax.hasMoved()) return;
    if (welcomeModalOpen || dailyRewardModalOpen || inspectedItem || resetConfirmOpen) return;
    const ev = e.nativeEvent as any;
    let tapX: number | undefined = typeof ev.locationX === "number" ? ev.locationX : undefined;
    let tapY: number | undefined = typeof ev.locationY === "number" ? ev.locationY : undefined;

    if ((tapX === undefined || tapY === undefined) && Platform.OS === "web") {
      const el = stageRef.current as unknown as HTMLElement | null;
      if (el && typeof el.getBoundingClientRect === "function" && typeof ev.clientX === "number") {
        const rect = el.getBoundingClientRect();
        tapX = ev.clientX - rect.left;
        tapY = ev.clientY - rect.top;
      } else if (typeof ev.offsetX === "number" && typeof ev.offsetY === "number") {
        tapX = ev.offsetX;
        tapY = ev.offsetY;
      }
    }

    if (typeof tapX !== "number" || typeof tapY !== "number" || Number.isNaN(tapX) || Number.isNaN(tapY)) {
      return;
    }

    const xPct = (tapX / stageWidth) * 100;
    const yPct = (tapY / stageHeight) * 100;
    const safePt = clampHomePointToFloor(xPct, yPct, homeState.activeRoom);
    const waypoints = buildHomeWalkWaypoints(companionPos, safePt, homeState.activeRoom);
    const [first, ...rest] = waypoints;

    setFacingLeft(first.x < companionPos.x);
    setTargetPos(first);
    setWalkQueue(rest);
    setIsWalking(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleCompanionPress = () => {
    setIsWalking(false);
    setIsWaving(true);
    showSpeech(currentCompanion.quotes.greeting, 4800);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setTimeout(() => setIsWaving(false), 2600);
  };

  const handlePickCompanion = async (id: string) => {
    await selectCompanion(id);
    const cfg = CHIBI_COMPANIONS[id];
    setIsWaving(true);
    if (cfg) {
      showSpeech(cfg.quotes.greeting, 4800);
      triggerToast(`Đã chọn bạn đồng hành ${cfg.name} (${cfg.tag})`);
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setTimeout(() => setIsWaving(false), 2600);
  };

  const handleClaimWelcome = async () => {
    await claimWelcome();
    setWelcomeModalOpen(false);
    setHighlightedItemId("sofa_luxury");
    setDockTab("claimed");
    setTimeout(() => scrollToPct(51, true), 90);
    triggerToast("Tân gia thành công! Bộ Sofa đã được bày trí trong Phòng Khách.");
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleOpenRewardModal = () => {
    const choices = getDailyRewardChoices();
    if (choices.length === 0) {
      triggerToast("Bạn đã sưu tập đủ 10/10 món nội thất Thụy Sĩ!");
      return;
    }
    setRewardChoices(choices);
    setSelectedReward(choices[0]);
    setDailyRewardModalOpen(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleConfirmDailyReward = async () => {
    if (!selectedReward) return;
    await claimDailyReward(selectedReward);
    setDailyRewardModalOpen(false);
    setHighlightedItemId(selectedReward.id);
    setDockTab("claimed");
    setTimeout(() => scrollToPct(getItemCenterPct(selectedReward), true), 110);
    triggerToast(`Đã nhận ${selectedReward.name_vi}! Đặt trong ${selectedReward.tag_vi}.`);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleConfirmReset = async () => {
    setResetConfirmOpen(false);
    await resetHome();
    setHighlightedItemId(null);
    setWelcomeModalOpen(true);
    triggerToast("Đã đặt lại căn nhà về trạng thái ban đầu.");
  };

  const handleFocusClaimedItem = async (item: WellnessHomeItem) => {
    const needsRoomSwitch = item.room !== homeState.activeRoom;
    if (needsRoomSwitch) {
      await switchRoom(item.room);
    }
    // Second tap on already-highlighted item opens details; first tap pans & highlights
    if (highlightedItemId === item.id && !needsRoomSwitch) {
      setInspectedItem(item);
      return;
    }
    setHighlightedItemId(item.id);
    setTimeout(() => scrollToPct(getItemCenterPct(item), true), needsRoomSwitch ? 120 : 20);
    triggerToast(`Đang xem ${item.name_vi} (${item.tag_vi}) — chạm lần nữa để xem chi tiết`);
  };

  const handleRoomSwitch = async (nextRoom: RoomId) => {
    setWalkQueue([]);
    setIsWalking(false);
    parallax.resetView();
    const spawnPt = nextRoom === "scene_bedroom" ? { x: 60, y: 76 } : { x: 60, y: 77 };
    setCompanionPos(spawnPt);
    setTargetPos(spawnPt);
    await switchRoom(nextRoom);
    setTimeout(() => scrollToPct(nextRoom === "scene_bedroom" ? 50 : 51, false), 70);
  };

  const claimedItemsList = useMemo(() => {
    return catalog
      .filter((it) => homeState.unlockedItems.includes(it.id))
      .sort((a, b) => {
        if (a.room === homeState.activeRoom && b.room !== homeState.activeRoom) return -1;
        if (b.room === homeState.activeRoom && a.room !== homeState.activeRoom) return 1;
        return 0;
      });
  }, [catalog, homeState.unlockedItems, homeState.activeRoom]);

  const roomMeta = ROOM_BACKGROUNDS[homeState.activeRoom];
  const roomBgSource = isNight ? roomMeta.night : roomMeta.day;
  const unlockedCount = homeState.unlockedItems.length;
  const bgOffset = parallax.getBgOffset();
  const chibiOffset = parallax.getCompanionOffset(companionPos.y);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopHud
        level={Math.max(1, Math.floor(xpTotal / 100) + 1)}
        expTotal={xpTotal}
        keys={currencies.keys}
        fragments={currencies.fragments}
      />

      {/* ===================================================================== */}
      {/* FULL-SCREEN CHALET VIEWPORT (Fills 100% height & width above tab bar)  */}
      {/* ===================================================================== */}
      <View
        ref={viewportRef}
        style={styles.stageViewport}
        onLayout={handleViewportLayout}
        accessibilityLabel="wellness-home-viewport"
      >
        {/* Pannable Full-Screen 16:9 Stage Layer */}
        <View
          style={[
            styles.stageClipBox,
            {
              top: verticalOffset,
              height: stageHeight,
            },
          ]}
        >
          <ScrollView
            ref={hScrollRef}
            horizontal
            scrollEnabled={!overviewMode && stageWidth > viewportSize.width + 2}
            scrollEventThrottle={16}
            onScroll={(e) =>
              parallax.handleScroll(e.nativeEvent.contentOffset.x, stageWidth, viewportSize.width)
            }
            showsHorizontalScrollIndicator={false}
            bounces={false}
            style={
              Platform.OS === "web"
                ? ({
                    overflowX: !overviewMode && stageWidth > viewportSize.width + 2 ? "auto" : "hidden",
                    overflowY: "hidden",
                  } as any)
                : undefined
            }
            contentContainerStyle={{
              width: stageWidth,
              height: stageHeight,
              flexGrow: 1,
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              ref={stageRef as any}
              activeOpacity={1}
              onPress={handleStagePress}
              style={[styles.roomStage, { width: stageWidth, height: stageHeight }]}
              accessibilityLabel="wellness-home-stage"
            >
              {/* Overscanned 2.5D Background Layer */}
              <View
                pointerEvents="none"
                accessibilityLabel="wellness-home-bg-layer"
                style={[
                  styles.bgOverscanLayer,
                  {
                    transform: [{ translateX: bgOffset.x }, { translateY: bgOffset.y }],
                  },
                ]}
              >
                <Image
                  source={roomBgSource}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
                {isNight && <View style={styles.nightAmbientOverlay} />}
              </View>

              {/* Unlocked Furniture Rendered on Blueprint Coordinates + Depth Parallax */}
              {visibleItems.map((item) => {
                const leftPct = Math.min(item.corners.tl[0], item.corners.bl[0]);
                const topPct = Math.min(item.corners.tl[1], item.corners.tr[1]);
                const rightPct = Math.max(item.corners.tr[0], item.corners.br[0]);
                const bottomPct = Math.max(item.corners.bl[1], item.corners.br[1]);
                const widthPct = Math.max(8, rightPct - leftPct);
                const heightPct = Math.max(8, bottomPct - topPct);
                const isHighlighted = highlightedItemId === item.id;
                const itemOffset = parallax.getItemOffset(item);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.placedItemBox,
                      {
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                        zIndex: item.z_index,
                        transform: [{ translateX: itemOffset.x }, { translateY: itemOffset.y }],
                      },
                    ]}
                    accessibilityLabel={`stage-item-${item.id}`}
                    onPress={() => {
                      if (parallax.hasMoved()) return;
                      if (isHighlighted) setHighlightedItemId(null);
                      setInspectedItem(item);
                    }}
                    activeOpacity={0.9}
                  >
                    <Image source={item.asset} style={styles.placedItemImg} contentFit="contain" />
                    {isHighlighted && (
                      <View style={styles.newGiftBadge}>
                        <Sparkles size={9} color="#061814" />
                        <Text style={styles.newGiftBadgeText}>Mới!</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Autonomous & Interactive 2.5D Perspective Chibi Companion */}
              <Animated.View
                style={[
                  styles.chibiWrap,
                  {
                    left: `${companionPos.x}%`,
                    top: `${companionPos.y}%`,
                    marginLeft: -chibiRenderW / 2,
                    marginTop: -chibiRenderH * 0.94,
                    zIndex: chibiZIndex,
                    transform: [{ translateY: walkBob }],
                  },
                ]}
              >
                <View style={{ alignItems: "center", transform: [{ translateX: chibiOffset.x }, { translateY: chibiOffset.y }] }}>
                  {speechBubble && (
                    <View
                      style={[
                        styles.speechBubbleBox,
                        companionPos.x >= 52 ? { right: -10 } : { left: -10 },
                      ]}
                    >
                      <Text style={styles.speechBubbleText} numberOfLines={3}>
                        {speechBubble}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={handleCompanionPress}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Chibi ${currentCompanion.name}`}
                    style={{ alignItems: "center" }}
                  >
                    <Image
                      source={currentCompanion.normalSprite}
                      style={{
                        width: chibiRenderW,
                        height: chibiRenderH,
                        transform: [{ scaleX: facingLeft ? -1 : 1 }, { scale: isWaving ? 1.07 : 1 }],
                      }}
                      contentFit="contain"
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ================================================================= */}
        {/* FLOATING TOP OVERLAY PILLS (Transparent, Zero Clutter on Ceiling)  */}
        {/* ================================================================= */}
        <View style={styles.floatingTopBar} pointerEvents="box-none">
          <View style={styles.floatingTopLeft}>
            <TouchableOpacity
              style={styles.hudGlassPill}
              accessibilityRole="button"
              accessibilityLabel="day-night-toggle"
              onPress={async () => {
                const mode = await cycleDayNight();
                triggerToast(
                  mode === "auto"
                    ? "Ánh sáng: Tự động theo giờ thực"
                    : mode === "day"
                    ? "Ánh sáng: Ban ngày"
                    : "Ánh sáng: Ban đêm"
                );
              }}
            >
              {dayNightMode === "auto" ? (
                <Clock size={12} color={colors.emeraldLight} />
              ) : isNight ? (
                <Moon size={12} color="#818cf8" />
              ) : (
                <Sun size={12} color="#fbbf24" />
              )}
              <Text style={styles.hudGlassPillText}>
                {dayNightMode === "auto"
                  ? screenWidth < 385
                    ? "Auto"
                    : "Tự động"
                  : dayNightMode === "day"
                  ? screenWidth < 385
                    ? "Ngày"
                    : "Ban ngày"
                  : screenWidth < 385
                  ? "Đêm"
                  : "Ban đêm"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hudIconCircle}
              accessibilityRole="button"
              accessibilityLabel="reset-home-btn"
              onPress={() => setResetConfirmOpen(true)}
            >
              <RotateCcw size={11} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.hudGlassPill, parallax.isActive && styles.hudParallaxActivePill]}
              accessibilityRole="button"
              accessibilityLabel="parallax-toggle"
              onPress={() => {
                const next = parallax.cycleStrength();
                const mapLabel =
                  next === "normal"
                    ? "Chiều sâu 2.5D: Chuẩn"
                    : next === "strong"
                    ? "Chiều sâu 2.5D: Mạnh mẽ"
                    : next === "subtle"
                    ? "Chiều sâu 2.5D: Dịu nhẹ"
                    : "Chiều sâu 2.5D: Đã tắt";
                triggerToast(mapLabel);
              }}
            >
              <Sparkles size={10} color={parallax.isActive ? colors.emeraldLight : colors.textSecondary} />
              <Text style={[styles.hudGlassPillText, parallax.isActive && { color: colors.emeraldLight }]}>
                2.5D
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.floatingTopRight}>
            <TouchableOpacity
              style={styles.hudGlassPill}
              accessibilityRole="button"
              accessibilityLabel="zoom-room-toggle"
              onPress={() => setOverviewMode((o) => !o)}
            >
              {overviewMode ? (
                <Maximize2 size={12} color={colors.emeraldLight} />
              ) : (
                <Minimize2 size={12} color={colors.textPrimary} />
              )}
              <Text style={styles.hudGlassPillText}>
                {overviewMode ? "Full màn" : "Toàn cảnh"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hudRewardPill}
              accessibilityRole="button"
              accessibilityLabel="claim-reward-button"
              onPress={handleOpenRewardModal}
            >
              <Gift size={12} color="#061814" />
              <Text style={styles.hudRewardPillText}>
                {screenWidth < 385 ? "Nhận Quà" : "Nhận Quà (1/2)"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating Toast Notification */}
        {toastMsg && (
          <View style={styles.floatingToastWrap} pointerEvents="none">
            <View style={styles.toastBanner} accessibilityRole="alert">
              <Sparkles size={13} color={colors.goldLight} />
              <Text style={styles.toastText} numberOfLines={2}>
                {toastMsg}
              </Text>
            </View>
          </View>
        )}

        {/* Empty Room Subtle Callout (Positioned above bottom dock) */}
        {visibleItems.length === 0 && (
          <View
            style={[
              styles.emptyRoomOverlay,
              { bottom: dockCollapsed ? (viewportSize.width < 600 ? 72 : 44) : viewportSize.width < 600 ? 116 : 94 },
            ]}
            pointerEvents="none"
          >
            <Sparkles size={13} color={colors.goldLight} />
            <Text style={styles.emptyRoomOverlayText} numberOfLines={2}>
              {roomMeta.nameVi} chưa có đồ — Bấm Nhận Quà (1/2) để trang trí!
            </Text>
          </View>
        )}

        {/* ================================================================= */}
        {/* COMPACT FLOATING BOTTOM DOCK (Rooms + Claimed Items + Chibi)      */}
        {/* Positioned cleanly right above bottom 6-tab navigation bar        */}
        {/* ================================================================= */}
        <View style={styles.bottomDockOuter} pointerEvents="box-none">
          <View style={styles.bottomDockCard} accessibilityLabel="wellness-home-bottom-dock">
            {/* Row 1 (+ optional compact second bar on narrow phones <600px so 0 text clips) */}
            <View
              style={[
                styles.dockHeaderRow,
                viewportSize.width < 600 && styles.dockHeaderRowCompact,
              ]}
            >
              <View style={styles.dockTopLineCompact}>
                <View style={styles.roomSegmented}>
                  <TouchableOpacity
                    style={[
                      styles.roomSegBtn,
                      homeState.activeRoom === "scene_interior_wide" && styles.roomSegBtnActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="tab-living-room"
                    onPress={() => handleRoomSwitch("scene_interior_wide")}
                  >
                    <Sofa
                      size={12}
                      color={homeState.activeRoom === "scene_interior_wide" ? "#061814" : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roomSegText,
                        homeState.activeRoom === "scene_interior_wide" && styles.roomSegTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      Phòng Khách
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roomSegBtn,
                      homeState.activeRoom === "scene_bedroom" && styles.roomSegBtnActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="tab-bedroom"
                    onPress={() => handleRoomSwitch("scene_bedroom")}
                  >
                    <Bed
                      size={12}
                      color={homeState.activeRoom === "scene_bedroom" ? "#061814" : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roomSegText,
                        homeState.activeRoom === "scene_bedroom" && styles.roomSegTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      Phòng Ngủ
                    </Text>
                  </TouchableOpacity>
                </View>

                {viewportSize.width < 600 && (
                  <TouchableOpacity
                    style={styles.dockCollapseBtn}
                    accessibilityRole="button"
                    accessibilityLabel="dock-collapse-toggle"
                    onPress={() => setDockCollapsed((c) => !c)}
                  >
                    {dockCollapsed ? (
                      <ChevronUp size={13} color={colors.textSecondary} />
                    ) : (
                      <ChevronDown size={13} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={[
                  styles.dockTabsRow,
                  viewportSize.width < 600 && styles.dockTabsRowCompact,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.dockModeChip,
                    viewportSize.width < 600 && styles.dockModeChipCompact,
                    dockTab === "claimed" && !dockCollapsed && styles.dockModeChipActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="dock-tab-claimed"
                  onPress={() => {
                    setDockTab("claimed");
                    setDockCollapsed(false);
                  }}
                >
                  <PackageCheck
                    size={11}
                    color={dockTab === "claimed" && !dockCollapsed ? "#061814" : colors.emeraldLight}
                  />
                  <Text
                    style={[
                      styles.dockModeChipText,
                      dockTab === "claimed" && !dockCollapsed && styles.dockModeChipTextActive,
                    ]}
                  >
                    Đã nhận ({unlockedCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dockModeChip,
                    viewportSize.width < 600 && styles.dockModeChipCompact,
                    dockTab === "all" && !dockCollapsed && styles.dockModeChipActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="dock-tab-all"
                  onPress={() => {
                    setDockTab("all");
                    setDockCollapsed(false);
                  }}
                >
                  <LayoutGrid
                    size={11}
                    color={dockTab === "all" && !dockCollapsed ? "#061814" : colors.goldLight}
                  />
                  <Text
                    style={[
                      styles.dockModeChipText,
                      dockTab === "all" && !dockCollapsed && styles.dockModeChipTextActive,
                    ]}
                  >
                    Kho ({catalog.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dockModeChip,
                    viewportSize.width < 600 && styles.dockModeChipCompact,
                    dockTab === "chibi" && !dockCollapsed && styles.dockModeChipActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="dock-tab-chibi"
                  onPress={() => {
                    setDockTab("chibi");
                    setDockCollapsed(false);
                  }}
                >
                  <Users
                    size={11}
                    color={dockTab === "chibi" && !dockCollapsed ? "#061814" : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.dockModeChipText,
                      dockTab === "chibi" && !dockCollapsed && styles.dockModeChipTextActive,
                    ]}
                  >
                    Chibi
                  </Text>
                </TouchableOpacity>

                {viewportSize.width >= 600 && (
                  <TouchableOpacity
                    style={styles.dockCollapseBtn}
                    accessibilityRole="button"
                    accessibilityLabel="dock-collapse-toggle"
                    onPress={() => setDockCollapsed((c) => !c)}
                  >
                    {dockCollapsed ? (
                      <ChevronUp size={13} color={colors.textSecondary} />
                    ) : (
                      <ChevronDown size={13} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Row 2: Compact Horizontal Tray (Default: Đồ đã nhận) */}
            {!dockCollapsed && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dockTrayContent}
                style={styles.dockTrayScroll}
              >
                {dockTab === "claimed" && (
                  <>
                    {claimedItemsList.length === 0 ? (
                      <TouchableOpacity
                        style={styles.dockEmptyGiftChip}
                        onPress={() => setWelcomeModalOpen(true)}
                      >
                        <Gift size={14} color={colors.goldLight} />
                        <Text style={styles.dockEmptyGiftText}>
                          Mở Quà Tân Gia đầu tiên để nhận Sofa →
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      claimedItemsList.map((item) => {
                        const isFocused = highlightedItemId === item.id;
                        const inCurrent = item.room === homeState.activeRoom;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.dockItemCard,
                              inCurrent && styles.dockItemCardInRoom,
                              isFocused && styles.dockItemCardFocused,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`claimed-item-${item.id}`}
                            onPress={() => handleFocusClaimedItem(item)}
                            activeOpacity={0.8}
                          >
                            <Image source={item.asset} style={styles.dockItemThumb} contentFit="contain" />
                            <View style={styles.dockItemMeta}>
                              <Text style={styles.dockItemTitle} numberOfLines={1}>
                                {item.name_vi}
                              </Text>
                              <Text style={styles.dockItemSub} numberOfLines={1}>
                                {item.tag_vi}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}

                    <TouchableOpacity
                      style={styles.dockMoreAllBtn}
                      onPress={() => setDockTab("all")}
                      accessibilityRole="button"
                    >
                      <LayoutGrid size={13} color={colors.goldLight} />
                      <Text style={styles.dockMoreAllText}>Đủ {catalog.length} món</Text>
                    </TouchableOpacity>
                  </>
                )}

                {dockTab === "all" &&
                  catalog.map((item) => {
                    const isUnlocked = homeState.unlockedItems.includes(item.id);
                    const inCurrent = item.room === homeState.activeRoom;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.dockItemCard,
                          isUnlocked && inCurrent && styles.dockItemCardInRoom,
                          !isUnlocked && styles.dockItemCardLocked,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`catalog-item-${item.id}`}
                        onPress={() => setInspectedItem(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.dockThumbWrap}>
                          <Image
                            source={item.asset}
                            style={[styles.dockItemThumb, !isUnlocked && { opacity: 0.35 }]}
                            contentFit="contain"
                          />
                          {!isUnlocked && (
                            <View style={styles.dockMiniLock}>
                              <Lock size={9} color="#fcd34d" />
                            </View>
                          )}
                        </View>
                        <View style={styles.dockItemMeta}>
                          <Text style={styles.dockItemTitle} numberOfLines={1}>
                            {item.name_vi}
                          </Text>
                          <Text
                            style={[
                              styles.dockItemSub,
                              isUnlocked ? { color: colors.emeraldLight } : { color: "#94a3b8" },
                            ]}
                            numberOfLines={1}
                          >
                            {isUnlocked ? item.tag_vi : "Chưa mở"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                {dockTab === "chibi" &&
                  Object.values(CHIBI_COMPANIONS).map((chibi) => {
                    const active = chibi.id === currentCompanion.id;
                    return (
                      <TouchableOpacity
                        key={chibi.id}
                        style={[styles.dockChibiCard, active && styles.dockChibiCardActive]}
                        accessibilityRole="button"
                        accessibilityLabel={`companion-${chibi.id}`}
                        onPress={() => handlePickCompanion(chibi.id)}
                        activeOpacity={0.8}
                      >
                        <Image source={chibi.normalSprite} style={styles.dockChibiThumb} contentFit="contain" />
                        <View>
                          <Text style={[styles.dockItemTitle, active && { color: colors.emeraldLight }]}>
                            {chibi.name}
                          </Text>
                          <Text style={styles.dockItemSub} numberOfLines={1}>
                            {chibi.tag}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      {/* ===================================================================== */}
      {/* MODAL 1: WELCOME GIFT (DAY 1 LUXURY SOFA)                             */}
      {/* ===================================================================== */}
      <Modal
        visible={welcomeModalOpen}
        transparent
        animationType={Platform.OS === "web" ? "none" : "fade"}
        onRequestClose={() => setWelcomeModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityLabel="welcome-gift-modal">
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
              contentContainerStyle={styles.modalScrollInner}
            >
              <View style={styles.modalBadgePill}>
                <Gift size={12} color={colors.goldLight} />
                <Text style={styles.modalBadgeText}>Quà Tân Gia Ngày Đầu Tiên</Text>
              </View>

              <Text style={styles.modalTitle}>Chào Mừng Đến Căn Nhà Dãy Alps</Text>
              <Text style={styles.modalDesc}>
                Ngôi nhà gỗ thông Thụy Sĩ nhìn ra dãy núi tuyết đang chờ bạn trang hoàng. Mở ngay món quà đầu tiên để đặt vào Phòng Khách!
              </Text>

              <View style={styles.welcomeItemPreview}>
                <Image
                  source={require("../../assets/game/home/items/sofa_luxury.png")}
                  style={styles.welcomeItemImg}
                  contentFit="contain"
                />
                <Text style={styles.welcomeItemTitle}>Bộ Sofa Thụy Sĩ Sang Trọng</Text>
                <Text style={styles.welcomeItemSub}>
                  Sofa êm ái đặt tại trung tâm Phòng Khách ngắm cảnh tuyết trắng.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryModalBtn}
                disabled={busy}
                onPress={handleClaimWelcome}
                accessibilityRole="button"
                accessibilityLabel="claim-welcome-btn"
                activeOpacity={0.85}
              >
                <Sparkles size={16} color="#061814" />
                <Text style={styles.primaryModalBtnText}>Mở Hộp Quà Tân Gia</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: DAILY REWARD PICK 1 OF 2 FURNITURE                          */}
      {/* ===================================================================== */}
      <Modal
        visible={dailyRewardModalOpen}
        transparent
        animationType={Platform.OS === "web" ? "none" : "fade"}
        onRequestClose={() => setDailyRewardModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityLabel="daily-reward-modal">
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
              contentContainerStyle={styles.modalScrollInner}
            >
              <View style={styles.modalBadgePill}>
                <Sparkles size={12} color={colors.goldLight} />
                <Text style={styles.modalBadgeText}>Phần Thưởng Nhiệm Vụ Sống Khỏe</Text>
              </View>

              <Text style={styles.modalTitle}>Chọn 1 Trong 2 Món Nội Thất</Text>
              <Text style={styles.modalDesc}>
                Chọn món đồ bạn yêu thích nhất để bày trí vào căn nhà nghỉ dưỡng của mình.
              </Text>

              <View style={styles.pickCardsRow}>
                {rewardChoices.map((choice) => {
                  const isSelected = selectedReward?.id === choice.id;
                  return (
                    <TouchableOpacity
                      key={choice.id}
                      style={[styles.pickCard, isSelected && styles.pickCardSelected]}
                      onPress={() => setSelectedReward(choice)}
                      accessibilityRole="button"
                      accessibilityLabel={`reward-card-${choice.id}`}
                      activeOpacity={0.85}
                    >
                      <View style={styles.pickRoomBadge}>
                        <Text style={styles.pickRoomBadgeText}>{choice.tag_vi}</Text>
                      </View>
                      <Image source={choice.asset} style={styles.pickCardImg} contentFit="contain" />
                      <Text style={styles.pickCardName} numberOfLines={2}>
                        {choice.name_vi}
                      </Text>
                      {isSelected && (
                        <View style={styles.pickSelectedTag}>
                          <Check size={11} color="#061814" />
                          <Text style={styles.pickSelectedTagText}>Đã chọn</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.primaryModalBtn, !selectedReward && { opacity: 0.5 }]}
                disabled={busy || !selectedReward}
                onPress={handleConfirmDailyReward}
                accessibilityRole="button"
                accessibilityLabel="confirm-reward-btn"
                activeOpacity={0.85}
              >
                <Gift size={16} color="#061814" />
                <Text style={styles.primaryModalBtnText}>Xác Nhận Nhận Thưởng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryModalBtn}
                onPress={() => setDailyRewardModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="close-reward-modal-btn"
              >
                <Text style={styles.secondaryModalBtnText}>Để sau</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: FURNITURE LORE DETAIL SHEET                                  */}
      {/* ===================================================================== */}
      <Modal
        visible={!!inspectedItem}
        transparent
        animationType={Platform.OS === "web" ? "none" : "fade"}
        onRequestClose={() => setInspectedItem(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setInspectedItem(null)}
        >
          {inspectedItem && (
            <TouchableOpacity
              style={styles.modalCard}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation?.()}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ width: "100%" }}
                contentContainerStyle={styles.modalScrollInner}
              >
                <View style={styles.detailTopRow}>
                  <View style={styles.modalBadgePill}>
                    <Text style={styles.modalBadgeText}>{inspectedItem.tag_vi}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setInspectedItem(null)}
                    style={styles.closeXBtn}
                    accessibilityRole="button"
                    accessibilityLabel="close-home-item-detail"
                  >
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Image source={inspectedItem.asset} style={styles.detailItemImg} contentFit="contain" />
                <Text style={styles.modalTitle}>{inspectedItem.name_vi}</Text>
                <Text style={styles.modalDesc}>{inspectedItem.desc_vi}</Text>

                {homeState.unlockedItems.includes(inspectedItem.id) ? (
                  <TouchableOpacity
                    style={styles.primaryModalBtn}
                    onPress={async () => {
                      const target = inspectedItem;
                      setInspectedItem(null);
                      if (target.room !== homeState.activeRoom) {
                        await switchRoom(target.room);
                      }
                      setHighlightedItemId(target.id);
                      setTimeout(() => scrollToPct(getItemCenterPct(target), true), 100);
                    }}
                  >
                    <Text style={styles.primaryModalBtnText}>Xem Trong {inspectedItem.tag_vi}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.secondaryModalBtn}
                    onPress={() => {
                      setInspectedItem(null);
                      handleOpenRewardModal();
                    }}
                  >
                    <Text style={styles.secondaryModalBtnText}>Mở khóa qua Nhận Quà (1/2) →</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: RESET CONFIRMATION (CROSS-PLATFORM WEB + NATIVE)             */}
      {/* ===================================================================== */}
      <Modal
        visible={resetConfirmOpen}
        transparent
        animationType={Platform.OS === "web" ? "none" : "fade"}
        onRequestClose={() => setResetConfirmOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Đặt Lại Căn Nhà?</Text>
            <Text style={styles.modalDesc}>
              Thao tác này đưa toàn bộ nội thất về trạng thái trống ban đầu để nhận lại quà tân gia từ đầu.
            </Text>
            <TouchableOpacity
              style={[styles.primaryModalBtn, { backgroundColor: "#f87171" }]}
              onPress={handleConfirmReset}
              accessibilityRole="button"
              accessibilityLabel="confirm-reset-home-btn"
            >
              <Text style={styles.primaryModalBtnText}>Xác Nhận Đặt Lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryModalBtn}
              onPress={() => setResetConfirmOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="cancel-reset-home-btn"
            >
              <Text style={styles.secondaryModalBtnText}>Hủy</Text>
            </TouchableOpacity>
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
  stageViewport: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#040f0c",
  },
  stageClipBox: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  roomStage: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#04120e",
  },
  bgOverscanLayer: {
    position: "absolute",
    top: "-5%",
    left: "-5%",
    width: "110%",
    height: "110%",
    zIndex: 1,
  },
  nightAmbientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
    zIndex: 10,
  },
  placedItemBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  placedItemImg: {
    width: "100%",
    height: "100%",
  },
  newGiftBadge: {
    position: "absolute",
    top: -6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#fef08a",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  newGiftBadgeText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10,
    fontWeight: "900",
    color: "#061814",
  },
  chibiWrap: {
    position: "absolute",
    alignItems: "center",
  },
  speechBubbleBox: {
    position: "absolute",
    bottom: "103%",
    backgroundColor: "rgba(6, 24, 19, 0.94)",
    borderWidth: 1,
    borderColor: colors.emeraldLight,
    borderRadius: radius.md,
    paddingHorizontal: 9,
    paddingVertical: 6,
    minWidth: 145,
    maxWidth: 195,
    marginBottom: 4,
    zIndex: 1200,
  },
  speechBubbleText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    fontWeight: "600",
    color: "#f8fafc",
    textAlign: "center",
    lineHeight: 15,
  },
  // Floating Top HUD Pills
  floatingTopBar: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    zIndex: 1300,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  floatingTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  floatingTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hudGlassPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: "rgba(6, 22, 18, 0.84)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 7.5,
    paddingVertical: 5.5,
    borderRadius: radius.full,
  },
  hudParallaxActivePill: {
    borderColor: "rgba(52, 211, 153, 0.55)",
    backgroundColor: "rgba(6, 36, 26, 0.88)",
  },
  hudGlassPillText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  hudIconCircle: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: "rgba(6, 22, 18, 0.84)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  hudRewardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: "#fef08a",
    paddingHorizontal: 8.5,
    paddingVertical: 5.5,
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  hudRewardPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#061814",
  },
  floatingToastWrap: {
    position: "absolute",
    top: 46,
    left: 12,
    right: 12,
    zIndex: 1350,
    alignItems: "center",
  },
  toastBanner: {
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(6, 36, 27, 0.94)",
    borderWidth: 1,
    borderColor: colors.emeraldLight,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  toastText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  emptyRoomOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    alignSelf: "center",
    maxWidth: 460,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(6, 20, 16, 0.88)",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
    zIndex: 1250,
  },
  emptyRoomOverlayText: {
    fontSize: 10.5,
    color: "#fef08a",
    fontWeight: "600",
    flex: 1,
  },
  // Compact Floating Bottom Dock (above slimmer 6-tab bottom bar)
  bottomDockOuter: {
    position: "absolute",
    bottom: 5,
    left: 6,
    right: 6,
    zIndex: 1300,
    alignItems: "center",
  },
  bottomDockCard: {
    width: "100%",
    maxWidth: 650,
    backgroundColor: "rgba(6, 20, 16, 0.78)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    paddingHorizontal: 6,
    paddingVertical: 4.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  dockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  dockHeaderRowCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 4,
  },
  dockTopLineCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  roomSegmented: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: radius.full,
    padding: 2,
    gap: 2,
    flexShrink: 0,
  },
  roomSegBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: radius.full,
  },
  roomSegBtnActive: {
    backgroundColor: colors.emeraldLight,
  },
  roomSegText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  roomSegTextActive: {
    color: "#061814",
    fontWeight: "800",
  },
  dockTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  dockTabsRowCompact: {
    width: "100%",
    justifyContent: "space-between",
    gap: 4,
  },
  dockModeChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3.5,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 6.5,
    paddingVertical: 3.5,
    borderRadius: radius.full,
  },
  dockModeChipCompact: {
    flex: 1,
  },
  dockModeChipActive: {
    backgroundColor: "#fef08a",
    borderColor: "#fef08a",
  },
  dockModeChipText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dockModeChipTextActive: {
    color: "#061814",
    fontWeight: "800",
  },
  dockCollapseBtn: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  dockTrayScroll: {
    marginTop: 4,
  },
  dockTrayContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingRight: 4,
  },
  dockItemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 38, 31, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
    height: 36,
    maxWidth: 148,
  },
  dockItemCardInRoom: {
    borderColor: "rgba(52, 211, 153, 0.45)",
  },
  dockItemCardFocused: {
    borderColor: colors.goldLight,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
  },
  dockItemCardLocked: {
    opacity: 0.72,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  dockThumbWrap: {
    position: "relative",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dockItemThumb: {
    width: 24,
    height: 24,
  },
  dockMiniLock: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    padding: 1.5,
    borderRadius: radius.full,
  },
  dockItemMeta: {
    flexShrink: 1,
    minWidth: 60,
    maxWidth: 102,
  },
  dockItemTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dockItemSub: {
    fontFamily: fonts.uiMedium,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 0,
  },
  dockMoreAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  dockMoreAllText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.goldLight,
  },
  dockEmptyGiftChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  dockEmptyGiftText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#fef08a",
  },
  dockChibiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: "rgba(15, 38, 31, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  dockChibiCardActive: {
    borderColor: colors.emeraldLight,
    backgroundColor: "rgba(16, 185, 129, 0.18)",
  },
  dockChibiThumb: {
    width: 22,
    height: 26,
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "92%",
    backgroundColor: "#0a221c",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.45)",
    alignItems: "center",
  },
  modalScrollInner: {
    width: "100%",
    alignItems: "center",
  },
  modalBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: 10,
  },
  modalBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.goldLight,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#fef08a",
    textAlign: "center",
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 14,
  },
  welcomeItemPreview: {
    width: "100%",
    backgroundColor: "#123228",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    padding: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  welcomeItemImg: {
    width: 180,
    height: 100,
    marginBottom: 8,
  },
  welcomeItemTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#ffffff",
  },
  welcomeItemSub: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 3,
  },
  primaryModalBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.emeraldLight,
    borderRadius: radius.lg,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#fef08a",
  },
  primaryModalBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#061814",
  },
  secondaryModalBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  secondaryModalBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  pickCardsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 14,
  },
  pickCard: {
    flex: 1,
    backgroundColor: "#102a22",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.14)",
    padding: 10,
    alignItems: "center",
  },
  pickCardSelected: {
    borderColor: colors.emeraldLight,
    backgroundColor: "rgba(16, 185, 129, 0.16)",
  },
  pickRoomBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: 6,
  },
  pickRoomBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  pickCardImg: {
    width: 90,
    height: 76,
    marginBottom: 6,
  },
  pickCardName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 15,
    minHeight: 30,
  },
  pickSelectedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.emeraldLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  pickSelectedTagText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#061814",
  },
  detailTopRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeXBtn: {
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: radius.full,
  },
  detailItemImg: {
    width: 150,
    height: 110,
    marginBottom: 10,
  },
});
