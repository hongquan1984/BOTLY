"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Home,
  Sun,
  Moon,
  Sparkles,
  Gift,
  Check,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Bed,
  Sofa,
  Clock,
  Layers,
  X,
} from "lucide-react";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { getSquareToQuadTransform } from "@/components/healthclues/wellnessHomeHomography";
import {
  MASK_CANVAS_WIDTH,
  MASK_CANVAS_HEIGHT,
  drawDefaultFloorPreset,
  isPointWalkable,
  pickRandomWalkableTarget,
} from "./wellnessHomeWalkable";
import type { WellnessHomeItem, WellnessHomePlayerState } from "@/app/api/healthclues/wellness-home/route";
import { useHomeParallax } from "./useHomeParallax";
import { HomeParallaxDevControl } from "./HomeParallaxDevControl";
import "./wellness-home.css";

// Projective Homography from Rectangle [0,w]x[0,h] to 4 Points
function computeHomography(
  w: number,
  h: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number[] | null {
  return getSquareToQuadTransform(w, h, p0, p1, p2, p3);
}

const CHALET_STORAGE_KEY_PREFIX = "healthclues_chalet_state_v1";
const GLOBAL_CHALET_WELCOME_KEY = "healthclues_chalet_welcome_claimed";
const GLOBAL_CHALET_UNLOCKED_KEY = "healthclues_chalet_unlocked_items";

function getChaletStorageKey(playerId?: string, worldId?: string): string {
  if (playerId && playerId.trim() && playerId !== "guest_player_default") {
    return `${CHALET_STORAGE_KEY_PREFIX}_${playerId.trim()}`;
  }
  if (worldId && worldId.trim()) {
    return `${CHALET_STORAGE_KEY_PREFIX}_${worldId.trim()}`;
  }
  return `${CHALET_STORAGE_KEY_PREFIX}_guest`;
}

function getLocalChaletState(key: string): Partial<WellnessHomePlayerState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    const globalRaw = localStorage.getItem("healthclues_chalet_state_global");
    if (globalRaw) return JSON.parse(globalRaw);
  } catch {}
  return null;
}

function saveLocalChaletState(key: string, state: Partial<WellnessHomePlayerState>): void {
  if (typeof window === "undefined") return;
  try {
    const prev = getLocalChaletState(key) || {};
    const updated = { ...prev, ...state, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem("healthclues_chalet_state_global", JSON.stringify(updated));
    if (updated.hasClaimedWelcome) {
      localStorage.setItem(GLOBAL_CHALET_WELCOME_KEY, "true");
    }
    if (Array.isArray(updated.unlockedItems)) {
      localStorage.setItem(GLOBAL_CHALET_UNLOCKED_KEY, JSON.stringify(updated.unlockedItems));
    }
  } catch (e) {
    console.warn("Could not save chalet state to localStorage", e);
  }
}

const CHIBI_CONFIGS: Record<
  string,
  {
    id: string;
    name: string;
    tag: string;
    normalSprite: string;
    waveSprite: string;
    speed: number;
    quotes: {
      flowers: string[];
      fireplace: string[];
      scenery: string[];
      general: string[];
      greeting: string;
    };
  }
> = {
  mia: {
    id: "mia",
    name: "Mia",
    tag: "Áo kem dịu dàng",
    normalSprite: "/healthclues/assets/characters/chibi-mia.png",
    waveSprite: "/healthclues/assets/characters/chibi-mia.png",
    speed: 3.2,
    quotes: {
      flowers: [
        "Mấy chậu hoa này xinh quá! Hương thơm làm tâm trí mình dịu hẳn lại. 🌸",
        "Cây cối vùng núi tuyết có sức sống thật kỳ diệu! 🌿",
      ],
      fireplace: [
        "Lò sưởi ấm quá đi! Tiếng củi thông tí tách nghe bình yên thật. 🔥",
        "Ngồi gần lò sưởi nhâm nhi trà nóng thì không còn gì bằng! ☕",
      ],
      scenery: [
        "Khung cảnh dãy Alps tuyết trắng hùng vĩ nhìn từ đây thật ngoạn mục! 🏔️",
        "Mặt hồ phẳng lặng và bầu trời trong vắt, ngắm hoài không thấy chán. ✨",
      ],
      general: [
        "Căn nhà Thụy Sĩ này thoáng đãng và dễ chịu quá!",
        "Hôm nay bạn đã uống đủ nước và vận động nhẹ chưa nè?",
        "Không gian nghỉ ngơi yên tĩnh giúp cơ thể phục hồi năng lượng rất nhanh đó!",
      ],
      greeting: "Chào bạn! Mình là Mia, rất vui được đồng hành cùng bạn trong ngôi nhà này! ✨",
    },
  },
  anna: {
    id: "anna",
    name: "Anna",
    tag: "Áo xanh vui tươi",
    normalSprite: "/healthclues/assets/characters/chibi-anna.png",
    waveSprite: "/healthclues/assets/characters/chibi-anna-wave.png",
    speed: 4.0,
    quotes: {
      flowers: [
        "Hoa nở rực rỡ quá! Mỗi ngày nhìn hoa là thấy tràn đầy năng lượng! 🌼",
        "Góc xanh này tươi mát thật, hít một hơi thật sâu nào! 🌱",
      ],
      fireplace: [
        "Lò sưởi ấm sực luôn, mùa đông Thụy Sĩ mà có lò sưởi này là tuyệt nhất! 🪵",
        "Lửa bập bùng nhìn mê ghê, cảm giác như đang cắm trại trong nhà vậy! ⛺",
      ],
      scenery: [
        "Woa, tuyết trên đỉnh Matterhorn lấp lánh như kim cương vậy! ❄️",
        "Mở toang cửa kính ra đón gió núi Alps nào, sảng khoái cực kỳ! 🌄",
      ],
      general: [
        "Căn biệt thự này xịn ghê! Đi dạo một vòng thấy yêu đời hẳn!",
        "Mục tiêu sức khỏe hôm nay của bạn hoàn thành đến đâu rồi?",
        "Tập thể dục một chút rồi ngắm cảnh tuyết rơi thôi nào!",
      ],
      greeting: "Hế lô! Anna đây! Cùng mình khám phá căn biệt thự nghỉ dưỡng này nhé! 🌟",
    },
  },
  leo: {
    id: "leo",
    name: "Leo",
    tag: "Áo xanh thám hiểm",
    normalSprite: "/healthclues/assets/characters/chibi-leo.png",
    waveSprite: "/healthclues/assets/characters/chibi-leo.png",
    speed: 3.8,
    quotes: {
      flowers: [
        "Thực vật bản địa dãy Alps có khả năng chịu lạnh cực kỳ bền bỉ! 🌲",
        "Những chậu cây này giúp thanh lọc không khí trong phòng rất tốt. 🍃",
      ],
      fireplace: [
        "Gỗ sồi cháy rất đượm, nhiệt lượng lan tỏa khắp sàn nhà gỗ. 🪵",
        "Một góc lò sưởi lý tưởng để đọc sách và suy ngẫm về hành trình sức khỏe. 📖",
      ],
      scenery: [
        "Độ cao này không khí trong lành với lượng ion âm rất có lợi cho phổi. 🏔️",
        "Tầm nhìn Panorama 180 độ bao quát trọn vẹn cả thung lũng tuyết! 🔭",
      ],
      general: [
        "Thiết kế phong cách Alpine tối giản mà cực kỳ khoa học.",
        "Mỗi ngày giữ vững một thói quen nhỏ sẽ tạo nên thay đổi lớn!",
        "Nghỉ ngơi chất lượng cũng là một phần quan trọng của hành trình.",
      ],
      greeting: "Chào bạn, mình là Leo! Hãy biến nơi này thành trạm tiếp sức cho hành trình nhé! 🧭",
    },
  },
  ben: {
    id: "ben",
    name: "Ben",
    tag: "Áo navy ấm áp",
    normalSprite: "/healthclues/assets/characters/chibi-ben.png",
    waveSprite: "/healthclues/assets/characters/chibi-ben-chao.png",
    speed: 3.0,
    quotes: {
      flowers: [
        "Mùi hương cỏ hoa thoang thoảng giúp giải tỏa căng thẳng rất tốt. 🌷",
        "Mỗi mầm xanh đều nhắc nhở chúng ta chăm sóc bản thân mỗi ngày. 🪴",
      ],
      fireplace: [
        "Ấm áp quá... ngồi bên lò sưởi thế này dễ chợp mắt một giấc thật ngon. 😴",
        "Nhiệt độ này rất thích hợp để thư giãn cơ bắp sau một ngày dài. 🕯️",
      ],
      scenery: [
        "Mặt hồ tuyết phẳng lặng như gương, nhìn vào thấy lòng tĩnh lặng lạ kỳ. 🏞️",
        "Thiên nhiên bao la luôn giúp chúng ta tìm lại sự cân bằng. 🌲",
      ],
      general: [
        "Đừng quên thả lỏng vai và thở đều nhé bạn tôi ơi.",
        "Sức khỏe tốt bắt đầu từ một tâm trí bình an và giấc ngủ sâu.",
        "Ngôi nhà này ấm cúng như một vòng tay vỗ về vậy.",
      ],
      greeting: "Chào bạn! Mình là Ben. Cứ thư thả nghỉ ngơi, đừng vội vã nhé! 🌿",
    },
  },
  lily: {
    id: "lily",
    name: "Lily",
    tag: "Áo tím thả tim",
    normalSprite: "/healthclues/assets/characters/chibi-lily.png",
    waveSprite: "/healthclues/assets/characters/chibi-lily-heart.png",
    speed: 3.5,
    quotes: {
      flowers: [
        "Mấy bông hoa dễ thương xỉu! Gửi ngàn trái tim cho góc xanh này! 💜",
        "Hoa nở tươi thắm như nụ cười của bạn khi đạt mục tiêu sức khỏe vậy! 🌸",
      ],
      fireplace: [
        "Ánh lửa bập bùng lãng mạn quá, cảm giác ấm áp ngập tràn con tim! 💖",
        "Ngồi ở đây chill chill nghe nhạc tuyết rơi thì tuyệt đỉnh! 🎶",
      ],
      scenery: [
        "Cảnh đẹp như bước ra từ tranh cổ tích Thụy Sĩ luôn á! Thả tim nè! 💌",
        "Mây trắng vờn quanh đỉnh núi tuyết bồng bềnh như kẹo bông gòn! ☁️",
      ],
      general: [
        "Yêu thương bản thân là bước đầu tiên để sống khỏe mỗi ngày!",
        "Bạn đã làm rất tốt hôm nay rồi, nhớ tự khen mình nhé! ✨",
        "Một không gian nghỉ ngơi xinh đẹp sẽ mang lại nguồn năng lượng tích cực!",
      ],
      greeting: "Hé lô bạn iu! Lily gửi tặng bạn một trái tim thật to nè! Chúc bạn ngày vui nhé! 💖",
    },
  },
};

type Props = {
  worldId?: string;
  accessToken?: string;
  onClose?: () => void;
  nickname?: string;
  initialRoom?: "scene_interior_wide" | "scene_bedroom";
  playerId?: string;
  highlightItemId?: string | null;
};

export function HealthCluesWellnessHome({
  worldId,
  accessToken,
  onClose,
  nickname,
  initialRoom = "scene_interior_wide",
  playerId,
  highlightItemId,
}: Props) {
  const { locale } = useHealthCluesLocale();
  const isVi = locale === "vi";

  const stageRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 1280, height: 720 });

  // 2.5D Parallax Interactive System (Experimental, Feature-Flagged, Reversible)
  const parallax = useHomeParallax(false);

  const storageKey = useMemo(() => getChaletStorageKey(playerId, worldId), [playerId, worldId]);

  const [activeRoom, setActiveRoom] = useState<"scene_interior_wide" | "scene_bedroom">(() => {
    const local = getLocalChaletState(getChaletStorageKey(playerId, worldId));
    if (local?.activeRoom === "scene_bedroom") return "scene_bedroom";
    return initialRoom;
  });

  const [dayNightMode, setDayNightMode] = useState<"auto" | "day" | "night">(() => {
    const local = getLocalChaletState(getChaletStorageKey(playerId, worldId));
    if (local?.dayNightOverride === "day" || local?.dayNightOverride === "night") return local.dayNightOverride;
    return "auto";
  });

  const [catalog, setCatalog] = useState<WellnessHomeItem[]>([]);

  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const local = getLocalChaletState(getChaletStorageKey(playerId, worldId));
    const items = new Set<string>();
    if (Array.isArray(local?.unlockedItems)) {
      local.unlockedItems.forEach(id => items.add(id));
    }
    try {
      const globalRaw = localStorage.getItem(GLOBAL_CHALET_UNLOCKED_KEY);
      if (globalRaw) {
        (JSON.parse(globalRaw) as string[]).forEach((id: string) => items.add(id));
      }
    } catch {}
    const claimedGlobally = localStorage.getItem(GLOBAL_CHALET_WELCOME_KEY) === "true";
    if (claimedGlobally || local?.hasClaimedWelcome || items.has("sofa_luxury")) {
      items.add("sofa_luxury");
    }
    return Array.from(items);
  });

  const [hasClaimedWelcome, setHasClaimedWelcome] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(GLOBAL_CHALET_WELCOME_KEY) === "true") return true;
    const local = getLocalChaletState(getChaletStorageKey(playerId, worldId));
    if (local?.hasClaimedWelcome) return true;
    if (Array.isArray(local?.unlockedItems) && local.unlockedItems.includes("sofa_luxury")) return true;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("healthclues_chalet_")) {
          const raw = localStorage.getItem(k);
          if (raw && (raw.includes('"hasClaimedWelcome":true') || raw.includes("sofa_luxury"))) {
            return true;
          }
        }
      }
    } catch {}
    return false;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(highlightItemId || null);

  // Modals
  const [welcomeModalOpen, setWelcomeModalOpen] = useState<boolean>(false);
  const [dailyRewardModalOpen, setDailyRewardModalOpen] = useState<boolean>(false);
  const [dailyRewardChoices, setDailyRewardChoices] = useState<WellnessHomeItem[]>([]);
  const [selectedRewardChoice, setSelectedRewardChoice] = useState<WellnessHomeItem | null>(null);

  // Chibi Companion State
  const [activeCompanionId, setActiveCompanionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hc_wellness_active_companion") || "mia";
    }
    return "mia";
  });
  const [companionPos, setCompanionPos] = useState({ x: 42, y: 78 });
  const [companionTarget, setCompanionTarget] = useState({ x: 42, y: 78 });
  const [isCompanionWalking, setIsCompanionWalking] = useState<boolean>(false);
  const [isCompanionWaving, setIsCompanionWaving] = useState<boolean>(false);
  const [companionFacingLeft, setCompanionFacingLeft] = useState<boolean>(false);
  const [companionSpeech, setCompanionSpeech] = useState<string | null>(null);

  // Walkable Collision NavMesh state
  const [walkableMasks, setWalkableMasks] = useState<Record<string, string>>({});
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync offscreen walkable mask canvas on activeRoom or mask update
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement("canvas");
      maskCanvasRef.current.width = MASK_CANVAS_WIDTH;
      maskCanvasRef.current.height = MASK_CANVAS_HEIGHT;
    }
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const dataUrl =
      walkableMasks[activeRoom] ||
      (typeof window !== "undefined"
        ? localStorage.getItem("healthclues_walkable_mask_" + activeRoom)
        : null);

    if (dataUrl && dataUrl.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);
        ctx.drawImage(img, 0, 0, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);
      };
      img.onerror = () => {
        drawDefaultFloorPreset(ctx, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT, activeRoom);
      };
      img.src = dataUrl;
    } else {
      drawDefaultFloorPreset(ctx, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT, activeRoom);
    }
  }, [activeRoom, walkableMasks]);

  const currentCompanion = useMemo(() => {
    return CHIBI_CONFIGS[activeCompanionId] || CHIBI_CONFIGS.mia;
  }, [activeCompanionId]);

  const handleChangeCompanion = (newId: string) => {
    setActiveCompanionId(newId);
    if (typeof window !== "undefined") {
      localStorage.setItem("hc_wellness_active_companion", newId);
    }
    const cfg = CHIBI_CONFIGS[newId] || CHIBI_CONFIGS.mia;
    setCompanionSpeech(cfg.quotes.greeting);
    setIsCompanionWaving(true);
    setTimeout(() => {
      setIsCompanionWaving(false);
    }, 3000);
    setTimeout(() => {
      setCompanionSpeech(null);
    }, 5500);
  };

  const handleCompanionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompanionWalking(false);
    setIsCompanionWaving(true);
    setCompanionSpeech(currentCompanion.quotes.greeting);
    setTimeout(() => {
      setIsCompanionWaving(false);
    }, 3000);
    setTimeout(() => {
      setCompanionSpeech(null);
    }, 5500);
  };

  // Tap-to-walk on the floor within walkable bounds
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current || isAnyModalOpen) return;
    const rect = stageRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const ctx = maskCanvasRef.current?.getContext("2d", { willReadFrequently: true }) || null;
    if (ctx && isPointWalkable(ctx, clickX, clickY, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT)) {
      setCompanionTarget({ x: Number(clickX.toFixed(1)), y: Number(clickY.toFixed(1)) });
      setCompanionFacingLeft(clickX < companionPos.x);
      setIsCompanionWalking(true);
      setCompanionSpeech(currentCompanion.quotes.general[0] || currentCompanion.quotes.greeting);
      setTimeout(() => setCompanionSpeech(null), 3000);
    }
  };

  // Autonomous Companion Movement & Contextual Speech Loop
  useEffect(() => {
    let animId: number;
    let wanderTimer: NodeJS.Timeout;
    let isMounted = true;

    // Pick a new target strictly within the painted walkable mask
    const pickNewTarget = () => {
      if (!isMounted) return;
      const ctx = maskCanvasRef.current?.getContext("2d", { willReadFrequently: true }) || null;
      const target = pickRandomWalkableTarget(ctx, activeRoom, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);

      setCompanionTarget(target);
      setCompanionFacingLeft(target.x < companionPos.x);
      setIsCompanionWalking(true);
    };

    // Movement step
    const step = () => {
      if (!isMounted) return;
      setCompanionPos((prev) => {
        const dx = companionTarget.x - prev.x;
        const dy = companionTarget.y - prev.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.6) {
          if (isCompanionWalking) {
            setIsCompanionWalking(false);
            // On arrival: contextual trigger check
            const quotes = currentCompanion.quotes;
            let chosenQuote: string | null = null;
            if (activeRoom === "scene_interior_wide") {
              if (prev.x < 32) {
                chosenQuote =
                  Math.random() > 0.5
                    ? quotes.fireplace[Math.floor(Math.random() * quotes.fireplace.length)]
                    : quotes.flowers[Math.floor(Math.random() * quotes.flowers.length)];
              } else if (prev.y < 75 && prev.x > 38 && prev.x < 65) {
                chosenQuote = quotes.scenery[Math.floor(Math.random() * quotes.scenery.length)];
              }
            } else {
              if (prev.x > 70) {
                chosenQuote = quotes.scenery[Math.floor(Math.random() * quotes.scenery.length)];
              } else if (prev.x < 30) {
                chosenQuote = quotes.general[Math.floor(Math.random() * quotes.general.length)];
              }
            }

            if (!chosenQuote && Math.random() < 0.35) {
              chosenQuote = quotes.general[Math.floor(Math.random() * quotes.general.length)];
            }

            if (chosenQuote) {
              setCompanionSpeech(chosenQuote);
              setTimeout(() => {
                if (isMounted) setCompanionSpeech(null);
              }, 5500);
            }
          }
          return prev;
        }

        const stepSize = 0.12; // percentage units per frame
        const nextX = prev.x + (dx / dist) * stepSize;
        const nextY = prev.y + (dy / dist) * stepSize;
        return { x: nextX, y: nextY };
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    const scheduleNextWander = () => {
      const delay = 6000 + Math.random() * 8000;
      wanderTimer = setTimeout(() => {
        if (!isCompanionWaving) {
          pickNewTarget();
        }
        scheduleNextWander();
      }, delay);
    };
    scheduleNextWander();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      clearTimeout(wanderTimer);
    };
  }, [activeRoom, companionTarget, isCompanionWalking, isCompanionWaving, currentCompanion]);

  // Observe stage resizing for responsive coordinate matrix computation
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const updateDimensions = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Compute real-time Day / Night lighting
  const isNight = useMemo(() => {
    if (dayNightMode === "day") return false;
    if (dayNightMode === "night") return true;
    const currentHour = new Date().getHours();
    return currentHour < 6 || currentHour >= 18;
  }, [dayNightMode]);

  // Load home data from API
  const loadHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (playerId) queryParams.set("playerId", playerId);
      if (worldId) queryParams.set("worldId", worldId);

      const res = await fetch(`/api/healthclues/wellness-home?${queryParams.toString()}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load home data");
      const data = await res.json();

      if (Array.isArray(data.catalog)) {
        setCatalog(data.catalog);
      }
      if (data.walkableMasks && typeof data.walkableMasks === "object") {
        setWalkableMasks(data.walkableMasks);
      }
      if (data.playerState) {
        const serverState: WellnessHomePlayerState = data.playerState;
        const local = getLocalChaletState(storageKey);

        const isLocallyClaimed = typeof window !== "undefined" && (
          localStorage.getItem(GLOBAL_CHALET_WELCOME_KEY) === "true" ||
          Boolean(local?.hasClaimedWelcome) ||
          (local?.unlockedItems || []).includes("sofa_luxury")
        );
        const effectiveClaimed = Boolean(isLocallyClaimed || serverState.hasClaimedWelcome);
        const mergedUnlocked = Array.from(
          new Set([
            ...(local?.unlockedItems || []),
            ...(serverState.unlockedItems || []),
            ...(effectiveClaimed ? ["sofa_luxury"] : [])
          ])
        );

        setUnlockedItems(mergedUnlocked);
        setHasClaimedWelcome(effectiveClaimed);

        if (typeof window !== "undefined" && effectiveClaimed) {
          try {
            localStorage.setItem(GLOBAL_CHALET_WELCOME_KEY, "true");
            localStorage.setItem(GLOBAL_CHALET_UNLOCKED_KEY, JSON.stringify(mergedUnlocked));
          } catch {}
        }

        if (serverState.activeRoom === "scene_interior_wide" || serverState.activeRoom === "scene_bedroom") {
          setActiveRoom(serverState.activeRoom);
        } else if (local?.activeRoom) {
          setActiveRoom(local.activeRoom as "scene_interior_wide" | "scene_bedroom");
        }

        if (serverState.dayNightOverride) {
          setDayNightMode(serverState.dayNightOverride);
        } else if (local?.dayNightOverride) {
          setDayNightMode(local.dayNightOverride);
        }

        // Save merged state back to local storage
        saveLocalChaletState(storageKey, {
          userId: playerId || serverState.userId,
          unlockedItems: mergedUnlocked,
          hasClaimedWelcome: effectiveClaimed,
          activeRoom: serverState.activeRoom || local?.activeRoom || "scene_interior_wide",
          dayNightOverride: serverState.dayNightOverride || local?.dayNightOverride || null,
        });

        // ONLY open welcome modal if NEVER claimed in either local storage OR server
        if (!effectiveClaimed) {
          setWelcomeModalOpen(true);
        } else {
          setWelcomeModalOpen(false);
          // If claimed locally but server forgot, sync to server in background
          if (!serverState.hasClaimedWelcome) {
            void fetch(`/api/healthclues/wellness-home`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
              },
              body: JSON.stringify({ action: "claim_welcome", playerId }),
            });
          }
        }
      }
    } catch (err) {
      console.warn("Using offline / fallback wellness home catalog", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, playerId, worldId, storageKey]);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  // Focus and highlight newly unlocked gift when entering the house
  useEffect(() => {
    if (highlightItemId && catalog.length > 0) {
      const target = catalog.find((i) => i.id === highlightItemId);
      if (target) {
        setHighlightedItemId(target.id);
        setActiveRoom(target.room);
        showToast(
          isVi
            ? `✨ Món quà mới "${target.name_vi}" đã xuất hiện trong ${target.room === "scene_interior_wide" ? "Phòng Khách" : "Phòng Ngủ"}!`
            : `✨ New reward "${target.name_en}" placed in ${target.room === "scene_interior_wide" ? "Living Room" : "Bedroom"}!`
        );
      }
    }
  }, [highlightItemId, catalog, isVi]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  // Claim Starter Gift (Day 1 Luxury Sofa)
  const handleClaimWelcome = async () => {
    setBusy(true);
    try {
      const updated = unlockedItems.includes("sofa_luxury") ? unlockedItems : [...unlockedItems, "sofa_luxury"];
      setUnlockedItems(updated);
      setHasClaimedWelcome(true);
      setWelcomeModalOpen(false);
      setActiveRoom("scene_interior_wide");
      setHighlightedItemId("sofa_luxury");

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(GLOBAL_CHALET_WELCOME_KEY, "true");
          localStorage.setItem(GLOBAL_CHALET_UNLOCKED_KEY, JSON.stringify(updated));
        } catch {}
      }

      saveLocalChaletState(storageKey, {
        userId: playerId || "guest_player_default",
        unlockedItems: updated,
        hasClaimedWelcome: true,
        activeRoom: "scene_interior_wide",
      });

      const res = await fetch(`/api/healthclues/wellness-home`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ action: "claim_welcome", playerId }),
      });
      if (!res.ok) console.warn("Backend sync failed for claim_welcome, local state retained");
      showToast(isVi ? "✨ Tân gia thành công! Bộ Sofa đã được đặt tại phòng khách." : "✨ Welcome home! Luxury sofa placed in your living room.");
    } catch (err) {
      showToast(isVi ? "Lỗi nhận quà tân gia." : "Failed to claim welcome gift.");
    } finally {
      setBusy(false);
    }
  };

  // Priority ordering for daily rewards
  const LIVING_PRIORITY = ["piano_grand", "painting_fireplace", "plant_pot_alps", "table_coffee"];
  const BEDROOM_PRIORITY = ["luxury_chalet_bed", "bedside_armchair", "painting_bedroom", "bedside_lamp", "bedroom_rug"];

  // Open Daily Reward Modal with Pick 1 of 2 Choice
  const handleOpenDailyRewardModal = () => {
    // Pick 1 unearned from Living Room and 1 unearned from Bedroom (prioritizing premier pieces)
    const unearnedLiving = catalog
      .filter((it) => it.room === "scene_interior_wide" && !unlockedItems.includes(it.id))
      .sort((a, b) => {
        const ia = LIVING_PRIORITY.indexOf(a.id);
        const ib = LIVING_PRIORITY.indexOf(b.id);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

    const unearnedBed = catalog
      .filter((it) => it.room === "scene_bedroom" && !unlockedItems.includes(it.id))
      .sort((a, b) => {
        const ia = BEDROOM_PRIORITY.indexOf(a.id);
        const ib = BEDROOM_PRIORITY.indexOf(b.id);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

    if (unearnedLiving.length === 0 && unearnedBed.length === 0) {
      showToast(isVi ? "🎉 Căn nhà của bạn đã sưu tập đủ 100% nội thất!" : "🎉 You have collected all 10 chalet furniture items!");
      return;
    }

    const choice1 = unearnedLiving.length > 0 ? unearnedLiving[0] : unearnedBed[0];
    const choice2 = unearnedBed.length > 0 ? unearnedBed[0] : unearnedLiving[1] || unearnedLiving[0];

    const choices = [choice1, choice2].filter(Boolean);
    setDailyRewardChoices(choices);
    setSelectedRewardChoice(choices[0] || null);
    setDailyRewardModalOpen(true);
  };

  // Confirm Daily Reward Selection
  const handleConfirmReward = async () => {
    if (!selectedRewardChoice) return;
    setBusy(true);
    try {
      const updated = unlockedItems.includes(selectedRewardChoice.id)
        ? unlockedItems
        : [...unlockedItems, selectedRewardChoice.id];
      setUnlockedItems(updated);
      setDailyRewardModalOpen(false);
      // Automatically switch to the room and spotlight the new item
      setActiveRoom(selectedRewardChoice.room);
      setHighlightedItemId(selectedRewardChoice.id);

      saveLocalChaletState(storageKey, {
        userId: playerId || "guest_player_default",
        unlockedItems: updated,
        hasClaimedWelcome: true,
        activeRoom: selectedRewardChoice.room,
        lastRewardClaimedAt: new Date().toISOString(),
      });

      const res = await fetch(`/api/healthclues/wellness-home`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: "claim_daily_reward",
          itemId: selectedRewardChoice.id,
          playerId,
        }),
      });
      if (!res.ok) console.warn("Backend sync failed for claim_daily_reward, local state retained");
      showToast(
        isVi
          ? `🎁 Đã nhận: ${selectedRewardChoice.name_vi}! Đã bày trí vào ${selectedRewardChoice.tag_vi}.`
          : `🎁 Unlocked: ${selectedRewardChoice.name_en}! Placed in ${selectedRewardChoice.tag_en}.`
      );
    } catch (err) {
      showToast(isVi ? "Lỗi nhận thưởng hằng ngày." : "Failed to claim reward.");
    } finally {
      setBusy(false);
    }
  };

  // Reset Player (for automated testing & fresh starts)
  const handleResetPlayer = async () => {
    if (!confirm(isVi ? "Bạn có chắc muốn đặt lại căn nhà về trống không?" : "Reset chalet to completely empty canvas?")) return;
    setBusy(true);
    try {
      if (typeof window !== "undefined") {
        try { localStorage.removeItem(storageKey); } catch {}
      }
      await fetch(`/api/healthclues/wellness-home`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ action: "reset_player", playerId }),
      });
      setUnlockedItems([]);
      setHasClaimedWelcome(false);
      setWelcomeModalOpen(true);
      showToast(isVi ? "Đã đặt lại căn phòng trống hoàn toàn." : "Chalet reset to empty room.");
    } catch (err) {
      showToast(isVi ? "Lỗi đặt lại phòng." : "Failed to reset room.");
    } finally {
      setBusy(false);
    }
  };

  // Toggle Day/Night Mode
  const cycleDayNight = () => {
    const next = dayNightMode === "auto" ? "day" : dayNightMode === "day" ? "night" : "auto";
    setDayNightMode(next);
    saveLocalChaletState(storageKey, { dayNightOverride: next === "auto" ? null : next });
    void fetch(`/api/healthclues/wellness-home`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        action: "set_day_night",
        override: next === "auto" ? null : next,
        playerId,
      }),
    });
  };

  // Switch Room
  const handleSwitchRoom = (room: "scene_interior_wide" | "scene_bedroom") => {
    setActiveRoom(room);
    parallax.resetView();
    saveLocalChaletState(storageKey, { activeRoom: room });
    void fetch(`/api/healthclues/wellness-home`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ action: "set_active_room", room, playerId }),
    });
  };

  // Background Image Path
  const sceneBg = useMemo(() => {
    if (activeRoom === "scene_interior_wide") {
      return isNight
        ? "/healthclues/assets/home/scenes/scene_interior_wide_night.webp"
        : "/healthclues/assets/home/scenes/scene_interior_wide.webp";
    }
    return isNight
      ? "/healthclues/assets/home/scenes/scene_bedroom_night.webp"
      : "/healthclues/assets/home/scenes/scene_bedroom.webp";
  }, [activeRoom, isNight]);

  // Items visible in the active room (STRICT MULTI-PLAYER STATE ISOLATION)
  const visibleItems = useMemo(() => {
    return catalog.filter((it) => it.room === activeRoom && unlockedItems.includes(it.id));
  }, [catalog, activeRoom, unlockedItems]);

  const isAnyModalOpen = welcomeModalOpen || dailyRewardModalOpen;

  return (
    <div className="hc-wellness-home-container" data-testid="wellness-home-root">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="hc-home-toast" role="status" data-testid="wellness-home-toast">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <header className="hc-wellness-home-header">
        <div className="hc-wellness-home-brand">
          {onClose && (
            <button
              type="button"
              className="hc-wellness-home-btn"
              onClick={onClose}
              data-testid="home-back-button"
              title={isVi ? "Trở về Bản đồ thế giới" : "Return to World Map"}
            >
              <ArrowLeft size={16} />
              <span>{isVi ? "Bản đồ" : "Back"}</span>
            </button>
          )}

          <h2 className="hc-wellness-home-title">
            <Home size={18} className="text-emerald-400 shrink-0" />
            <span className="hc-title-full">{isVi ? "Nhà Nghỉ Dưỡng Thụy Sĩ" : "Swiss Alpine Chalet"}</span>
            <span className="hc-title-short">{isVi ? "Căn Nhà Thụy Sĩ" : "Chalet"}</span>
          </h2>
        </div>

        {/* Action Controls */}
        <div className="hc-wellness-home-controls">
          {/* Day / Night Cycle Button */}
          <button
            type="button"
            className="hc-wellness-home-btn"
            onClick={cycleDayNight}
            data-testid="day-night-toggle"
            title={
              dayNightMode === "auto"
                ? isVi ? "Đang chạy theo giờ thật (Tự động)" : "Syncing to real device clock"
                : isVi ? `Đang khóa chế độ ${dayNightMode === "day" ? "Ban ngày" : "Ban đêm"}` : `Locked to ${dayNightMode}`
            }
          >
            {dayNightMode === "auto" ? (
              <Clock size={15} className="text-emerald-400" />
            ) : isNight ? (
              <Moon size={15} className="text-indigo-400" />
            ) : (
              <Sun size={15} className="text-amber-400" />
            )}
            <span className="hc-btn-label-full">
              {dayNightMode === "auto"
                ? isVi ? "Tự động (Giờ thật)" : "Auto Clock"
                : dayNightMode === "day"
                ? isVi ? "Ban ngày ☀️" : "Daytime ☀️"
                : isVi ? "Ban đêm 🌙" : "Nighttime 🌙"}
            </span>
            <span className="hc-btn-label-short">
              {dayNightMode === "auto"
                ? isVi ? "Tự động" : "Auto"
                : dayNightMode === "day"
                ? "☀️"
                : "🌙"}
            </span>
          </button>

          {/* Daily Quest Reward Trigger */}
          <button
            type="button"
            className="hc-wellness-home-btn is-reward"
            onClick={handleOpenDailyRewardModal}
            data-testid="claim-reward-button"
            title={isVi ? "Nhận 1 trong 2 món nội thất quà tặng hằng ngày" : "Pick 1 of 2 Daily Home Rewards"}
          >
            <Gift size={15} />
            <span className="hc-btn-label-full">
              {isVi ? "Nhận Thưởng (1 trong 2) 🎁" : "Daily Reward (Pick 1 of 2)"}
            </span>
            <span className="hc-btn-label-short">
              {isVi ? "Nhận Quà" : "Gift"}
            </span>
          </button>

          {/* Chibi Companion Selector Dropdown */}
          <div className="hc-companion-selector-wrap" title={isVi ? "Chọn bạn đồng hành Chibi" : "Choose Chibi Companion"}>
            <span aria-hidden="true">🐾</span>
            <select
              value={activeCompanionId}
              onChange={(e) => handleChangeCompanion(e.target.value)}
              className="hc-companion-select"
              aria-label={isVi ? "Bạn đồng hành" : "Companion"}
            >
              <option value="mia">Mia ({isVi ? "Áo kem dịu dàng" : "Gentle Cream"})</option>
              <option value="anna">Anna ({isVi ? "Áo xanh vui tươi" : "Cheerful Teal"})</option>
              <option value="leo">Leo ({isVi ? "Áo xanh thám hiểm" : "Adventurer Blue"})</option>
              <option value="ben">Ben ({isVi ? "Áo navy ấm áp" : "Warm Navy"})</option>
              <option value="lily">Lily ({isVi ? "Áo tím thả tim" : "Sweet Purple"})</option>
            </select>
          </div>

          {/* Reset Room Button */}
          <button
            type="button"
            className="hc-wellness-home-btn is-mobile-hidden"
            onClick={handleResetPlayer}
            data-testid="reset-player-button"
            title={isVi ? "Đặt lại phòng về trống không để test" : "Reset chalet to 100% empty canvas"}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* Floating Room Switcher Tabs */}
      <div
        className={`hc-wellness-home-tabs ${isAnyModalOpen ? "hidden pointer-events-none opacity-0" : ""}`}
        role="tablist"
        aria-label="Room Switcher"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeRoom === "scene_interior_wide"}
          className={`hc-wellness-home-tab-btn ${activeRoom === "scene_interior_wide" ? "is-active" : ""}`}
          onClick={() => handleSwitchRoom("scene_interior_wide")}
          data-testid="tab-living-room"
        >
          <Sofa size={15} />
          <span>{isVi ? "Phòng Khách" : "Living Room"}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeRoom === "scene_bedroom"}
          className={`hc-wellness-home-tab-btn ${activeRoom === "scene_bedroom" ? "is-active" : ""}`}
          onClick={() => handleSwitchRoom("scene_bedroom")}
          data-testid="tab-bedroom"
        >
          <Bed size={15} />
          <span>{isVi ? "Phòng Ngủ" : "Bedroom"}</span>
        </button>
      </div>

      {/* Main Viewport Stage */}
      <div className="hc-wellness-home-viewport">
        <div
          ref={stageRef}
          className={`hc-wellness-home-stage ${isAnyModalOpen ? "is-modal-active" : ""} ${parallax.isEffectActive ? "is-parallax-active" : ""} ${parallax.isDragging ? "is-parallax-dragging" : ""}`}
          onPointerDown={parallax.handlePointerDown}
          onPointerMove={parallax.handlePointerMove}
          onPointerUp={parallax.handlePointerUp}
          onClick={(e) => {
            if (!parallax.hasMoved) {
              handleStageClick(e);
            }
          }}
          data-testid="wellness-home-stage"
        >
          {/* Parallax Background Layer (overscan buffer to prevent exposed edges) */}
          <div
            className="hc-stage-bg-layer"
            style={{
              backgroundImage: `url(${sceneBg})`,
              transform: parallax.isEffectActive
                ? `translate3d(${parallax.getBgOffset().x}px, ${parallax.getBgOffset().y}px, 0)`
                : undefined,
            }}
            aria-hidden="true"
          />

          {/* Night Ambient Filter */}
          {isNight && (
            <div
              className="hc-stage-night-tint"
              style={{
                transform: parallax.isEffectActive
                  ? `translate3d(${parallax.getBgOffset().x}px, ${parallax.getBgOffset().y}px, 0)`
                  : undefined,
              }}
              aria-hidden="true"
            />
          )}

          {/* Render Unlocked Furniture via 4-Corner Homography Projective Warping + 2.5D Parallax Offset */}
          {!isAnyModalOpen &&
            visibleItems.map((item) => {
              const w = item.natural_width;
              const h = item.natural_height;
              const p0 = { x: (item.corners.tl[0] / 100) * stageDimensions.width, y: (item.corners.tl[1] / 100) * stageDimensions.height };
              const p1 = { x: (item.corners.tr[0] / 100) * stageDimensions.width, y: (item.corners.tr[1] / 100) * stageDimensions.height };
              const p2 = { x: (item.corners.br[0] / 100) * stageDimensions.width, y: (item.corners.br[1] / 100) * stageDimensions.height };
              const p3 = { x: (item.corners.bl[0] / 100) * stageDimensions.width, y: (item.corners.bl[1] / 100) * stageDimensions.height };

              const m = computeHomography(w, h, p0, p1, p2, p3);
              const isHighlighted = item.id === highlightedItemId;
              const itemOffset = parallax.getItemOffset(item);

              return (
                <div
                  key={item.id}
                  className={`hc-stage-item-wrapper ${isHighlighted ? "hc-home-item-highlight" : ""}`}
                  data-testid={`stage-item-${item.id}`}
                  style={{
                    zIndex: isHighlighted ? 900 : item.z_index,
                    transform: parallax.isEffectActive
                      ? `translate3d(${itemOffset.x}px, ${itemOffset.y}px, 0)`
                      : undefined,
                  }}
                  onClick={() => {
                    if (isHighlighted) setHighlightedItemId(null);
                  }}
                >
                  {isHighlighted && (
                    <div className="hc-home-new-gift-beacon" data-testid="new-gift-beacon">
                      <Sparkles size={12} className="text-stone-900" />
                      <span>{isVi ? "Món Quà Mới Nhận! ✨" : "New Reward! ✨"}</span>
                    </div>
                  )}
                  <img
                    src={item.img_src}
                    alt={isVi ? item.name_vi : item.name_en}
                    title={`${isVi ? item.name_vi : item.name_en} - ${isVi ? item.desc_vi : item.desc_en}`}
                    className="hc-stage-item-img"
                    style={{
                      width: `${w}px`,
                      height: `${h}px`,
                      transform: m ? `matrix3d(${m.join(",")})` : undefined,
                    }}
                  />
                </div>
              );
            })}

          {/* Render Autonomous Chibi Companion */}
          {!isAnyModalOpen && (
            <div
              className="hc-chibi-companion-wrap"
              style={{
                left: `${companionPos.x}%`,
                top: `${companionPos.y}%`,
                zIndex: Math.round(companionPos.y * 10),
                transform: parallax.isEffectActive
                  ? `translate3d(calc(-50% + ${parallax.getCompanionOffset(companionPos.y).x}px), calc(-90% + ${parallax.getCompanionOffset(companionPos.y).y}px), 0)`
                  : `translate(-50%, -90%)`,
              }}
              onClick={handleCompanionClick}
              title={isVi ? `Bấm để trò chuyện cùng ${currentCompanion.name}` : `Click to talk with ${currentCompanion.name}`}
            >
              <div className="hc-chibi-shadow" />
              <div
                className={`hc-chibi-sprite ${isCompanionWalking ? "is-walking" : "is-idle"} ${companionFacingLeft ? "facing-left" : ""}`}
                style={{
                  backgroundImage: `url(${isCompanionWaving ? currentCompanion.waveSprite : currentCompanion.normalSprite})`,
                }}
              />
              {companionSpeech && (
                <div className="hc-chibi-speech-bubble" role="status">
                  {companionSpeech}
                </div>
              )}
            </div>
          )}

          {/* Empty Room Hint when player has no items in active room */}
          {visibleItems.length === 0 && (
            <div className="hc-empty-room-hint" data-testid="empty-room-hint">
              <Sparkles size={20} className="text-amber-400" />
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {isVi ? "Căn phòng đang trống hoàn toàn" : "Room is currently empty"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isVi
                    ? "Hoàn thành thói quen sống khỏe mỗi ngày để mở khóa nội thất cao cấp!"
                    : "Complete daily wellness habits to unlock authentic Swiss chalet furniture!"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STARTER WELCOME GIFT MODAL (Day 1 - Luxury Alps Sofa)                  */}
      {/* ========================================================================= */}
      {welcomeModalOpen && (
        <div className="hc-home-modal-backdrop" role="dialog" aria-modal="true" data-testid="welcome-gift-modal">
          <div className="hc-home-modal-card">
            <span className="hc-home-modal-badge">
              <Gift size={13} />
              <span>{isVi ? "Quà Tân Gia Ngày Đầu Tiên" : "Day 1 Welcome Gift"}</span>
            </span>

            <h3 className="hc-home-modal-title">
              {isVi ? "Chào Mừng Đến Căn Nhà Dãy Alps 🏡" : "Welcome To Your Alps Chalet 🏡"}
            </h3>

            <p className="hc-home-modal-desc">
              {isVi
                ? "Ngôi nhà gỗ thông Thụy Sĩ sang trọng nhìn ra đỉnh núi tuyết Matterhorn đang chờ bạn trang hoàng. Nhận ngay món quà tân gia đầu tiên để bắt đầu hành trình sống khỏe!"
                : "Your authentic Swiss pine chalet overlooking snowy Matterhorn peaks is ready to be styled. Claim your starter gift to begin your wellness journey!"}
            </p>

            <div className="mx-auto mb-6 max-w-sm rounded-2xl border border-emerald-500/30 bg-[#162e27] p-5 shadow-inner">
              <div className="relative mx-auto flex h-40 items-center justify-center">
                <img
                  src="/healthclues/assets/home/items/sofa_luxury.png"
                  alt="Bộ Sofa Thụy Sĩ Sang Trọng"
                  className="max-h-36 max-w-full object-contain filter drop-shadow(0 15px 25px rgba(0,0,0,0.5))"
                />
              </div>
              <h4 className="mt-3 font-extrabold text-white">
                {isVi ? "Bộ Sofa Thụy Sĩ Sang Trọng" : "Luxury Swiss Chalet Sofa"}
              </h4>
              <p className="mt-1 text-xs text-slate-300">
                {isVi
                  ? "Sofa da êm ái ngắm toàn cảnh tuyết trắng dãy Alps. Sẽ được bày trí ngay vị trí trung tâm phòng khách."
                  : "Soft Italian leather sofa overlooking alpine snow. Lands directly in your living room center."}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                className="hc-home-action-btn"
                onClick={handleClaimWelcome}
                disabled={busy}
                data-testid="claim-welcome-btn"
              >
                <Sparkles size={18} />
                <span>{isVi ? "Mở Hộp Quà Tân Gia" : "Unbox Welcome Gift"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DAILY QUEST REWARD MODAL (Pick 1 of 2 Choice)                          */}
      {/* ========================================================================= */}
      {dailyRewardModalOpen && (
        <div className="hc-home-modal-backdrop" role="dialog" aria-modal="true" data-testid="daily-reward-modal">
          <div className="hc-home-modal-card">
            <span className="hc-home-modal-badge">
              <Sparkles size={13} />
              <span>{isVi ? "Phần Thưởng Nhiệm Vụ Hằng Ngày" : "Daily Quest Reward"}</span>
            </span>

            <h3 className="hc-home-modal-title">
              {isVi ? "Chọn 1 Trong 2 Món Nội Thất 🎁" : "Pick 1 of 2 Chalet Gifts 🎁"}
            </h3>

            <p className="hc-home-modal-desc">
              {isVi
                ? "Bạn đã hoàn thành mục tiêu sống khỏe hôm nay! Hãy chọn món nội thất bạn yêu thích nhất để làm đẹp thêm cho căn phòng của mình."
                : "You completed today's wellness goal! Choose your favorite piece of furniture to enrich your chalet."}
            </p>

            <div className="hc-home-pick-grid">
              {dailyRewardChoices.map((choice) => {
                const isSelected = selectedRewardChoice?.id === choice.id;
                return (
                  <div
                    key={choice.id}
                    className={`hc-home-pick-card ${isSelected ? "is-selected" : ""}`}
                    onClick={() => setSelectedRewardChoice(choice)}
                    data-testid={`reward-card-${choice.id}`}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="hc-home-pick-room-tag">
                      {isVi ? choice.tag_vi : choice.tag_en}
                    </span>
                    <div className="hc-home-pick-img-box">
                      <img
                        src={choice.img_src}
                        alt={isVi ? choice.name_vi : choice.name_en}
                        className="hc-home-pick-img"
                      />
                    </div>
                    <strong className="hc-home-pick-name">
                      {isVi ? choice.name_vi : choice.name_en}
                    </strong>
                    <p className="hc-home-pick-desc">
                      {isVi ? choice.desc_vi : choice.desc_en}
                    </p>
                    {isSelected && (
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                        <Check size={13} />
                        <span>{isVi ? "Đã chọn" : "Selected"}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="hc-home-action-btn"
                onClick={handleConfirmReward}
                disabled={busy || !selectedRewardChoice}
                data-testid="confirm-reward-btn"
              >
                <Gift size={18} />
                <span>{isVi ? "Xác Nhận Nhận Thưởng" : "Confirm Reward Selection"}</span>
              </button>
              <button
                type="button"
                className="hc-home-secondary-btn"
                onClick={() => setDailyRewardModalOpen(false)}
                data-testid="close-reward-modal-btn"
              >
                <span>{isVi ? "Để sau" : "Later"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2.5D Parallax Dev & QA Experimental Control Panel (Feature-flagged, Dev-only, OFF by default) */}
      <HomeParallaxDevControl parallax={parallax} isVi={isVi} />
    </div>
  );
}
