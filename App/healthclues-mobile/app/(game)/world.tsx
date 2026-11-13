import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Modal,
  Animated,
  ScrollView,
  GestureResponderEvent,
  LayoutChangeEvent,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Sparkles,
  MapPin,
  MessageCircle,
  X,
  Compass,
  ArrowRight,
  BookOpen,
  Footprints,
  Flower2,
  TentTree,
  Swords,
  Trophy,
  CheckCircle2,
  Info,
  ExternalLink,
  Target,
  Maximize2,
  Minimize2,
  Lock,
  Crosshair,
  Sun,
  Moon,
  Clock,
  Hand,
  Coffee,
  Home,
  Heart,
  Users,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { colors, fonts, typography, spacing, radius } from "@/theme";
import { t } from "@/localization";
import { TopHud } from "@/components/common/TopHud";
import { ExpGain } from "@/components/game/ExpGain";
import { RewardReveal } from "@/components/game/RewardReveal";
import { useAuth } from "@/hooks/useAuth";
import { useWorld } from "@/hooks/useWorld";
import { useWorldPresence, RemoteAdventurer } from "@/hooks/useWorldPresence";
import { useLivingVillageVisitors, SimulatedVisitor } from "@/hooks/useLivingVillageVisitors";
import {
  AUTHORED_PATHS,
  snapToWalkableRoad,
  buildRoadWaypoints,
  Point,
} from "@/utils/navigation";
import {
  FOUNTAIN_CRYSTAL_POS,
  WORLD_AMBIENT_PARTICLES,
  WORLD_GLOW_ANCHORS,
  WorldAtmosphereMode,
  getActorZIndex,
  getAtmosphereVisuals,
  getWorldDepthScale,
  resolveWorldAtmosphere,
} from "@/utils/worldDiorama25D";

type RegionMode = "exploration" | "overworld";
type ActiveRegion = "sleep-valley" | "healthclues-realm";

interface LandmarkStation {
  id: string;
  titleVi: string;
  titleEn: string;
  roleVi?: string;
  roleEn?: string;
  isNpc?: boolean;
  npcName?: string;
  npcRole?: string;
  npcAvatar?: any;
  IconComponent: any;
  x: number;
  y: number;
  approachX: number;
  approachY: number;
  greetingVi: string;
  greetingEn: string;
  detailsVi?: string;
  detailsEn?: string;
  actionTextVi?: string;
  actionTextEn?: string;
  badge?: string;
}

const AVATAR_SPRITES: Record<string, any> = {
  "chibi-anna": require("../../assets/game/characters/chibi-anna.png"),
  "chibi-leo": require("../../assets/game/characters/chibi-leo.png"),
  "chibi-mia": require("../../assets/game/characters/chibi-mia.png"),
  "chibi-ben": require("../../assets/game/characters/chibi-ben.png"),
  "chibi-lily": require("../../assets/game/characters/chibi-lily.png"),
};

const REGION_LANDMARKS: Record<ActiveRegion, LandmarkStation[]> = {
  "sleep-valley": [
    {
      id: "camp",
      titleVi: "Trại Thám Hiểm Trung Tâm",
      titleEn: "Central Exploration Camp",
      roleVi: "Điểm Danh & Nhật Ký",
      roleEn: "Check-in & Care Records",
      IconComponent: TentTree,
      x: 288,
      y: 423,
      approachX: 380,
      approachY: 670,
      greetingVi: "Chào mừng bạn đến khu cắm trại! Hãy ghi lại nhịp sống hôm nay để nhận 10 EXP.",
      greetingEn: "Welcome to camp! Log today's care routine to earn 10 EXP.",
      detailsVi: "Ghi nhận 3 thói quen buổi sáng, chất lượng giấc ngủ và bài tập hít thở trước khi ngủ.",
      detailsEn: "Record 3 morning habits, sleep quality, and breathing exercises.",
      actionTextVi: "Điểm danh hôm nay (+10 EXP)",
      actionTextEn: "Daily Check-in (+10 EXP)",
      badge: "Cốt lõi",
    },
    {
      id: "botanical",
      titleVi: "Vườn Thảo Mộc Thư Giãn",
      titleEn: "Botanical Relaxation Garden",
      roleVi: "Dược Thảo Tự Nhiên",
      roleEn: "Herbal Medicine",
      isNpc: true,
      npcName: "Nhà Thực Vật Học",
      npcRole: "Chuyên Gia Thảo Mộc Y Khoa",
      npcAvatar: require("../../assets/game/regions/npc-botanist-distinct.webp"),
      IconComponent: Flower2,
      x: 1088,
      y: 414,
      approachX: 1040,
      approachY: 480,
      greetingVi: "Hoa cúc La Mã (Chamomile) và Lạc tiên chứa apigenin tự nhiên giúp thư giãn tinh thần trước khi ngủ.",
      greetingEn: "Chamomile contains apigenin binding GABA receptors for natural calm.",
      detailsVi: "Tài liệu y học: Các hợp chất thảo mộc hỗ trợ cơ chế thư giãn thần kinh tự nhiên mà không gây phụ thuộc.",
      detailsEn: "Herbal compounds promote relaxation without dependency risks.",
      actionTextVi: "Đọc Sổ Tay Thảo Dược",
      actionTextEn: "Read Herbal Lore",
      badge: "Tri thức",
    },
    {
      id: "sanctuary",
      titleVi: "Thánh Địa Tĩnh Lặng",
      titleEn: "Serenity Sanctuary",
      roleVi: "Thực Hành Thở 4-7-8",
      roleEn: "Breathwork Therapy",
      isNpc: true,
      npcName: "Người Hướng Dẫn Sống Khỏe",
      npcRole: "Chuyên Gia Thư Giãn",
      npcAvatar: require("../../assets/game/regions/npc-wellness-guide-distinct.webp"),
      IconComponent: Flower2,
      x: 1216,
      y: 648,
      approachX: 1180,
      approachY: 650,
      greetingVi: "Hãy thả lỏng vai và hàm. Kỹ thuật thở 4-7-8 kích hoạt hệ thần kinh đối giao cảm giúp nhịp tim chậm lại.",
      greetingEn: "Drop your shoulders and unclench your jaw. 4-7-8 breathing activates parasympathetic tone.",
      detailsVi: "Thực hành: Hít vào 4 giây qua mũi, giữ hơi 7 giây, thở ra 8 giây qua miệng. Lặp lại 4 chu kỳ.",
      detailsEn: "Practice: Inhale 4s, hold 7s, exhale 8s. Repeat for 4 cycles.",
      actionTextVi: "Bắt đầu bài tập thở 4-7-8",
      actionTextEn: "Start 4-7-8 Breathing",
      badge: "Thư giãn",
    },
    {
      id: "movement",
      titleVi: "Đường Mòn Vận Động Rừng Đêm",
      titleEn: "Twilight Movement Trail",
      roleVi: "Vận Động Nhẹ Nhàng",
      roleEn: "Gentle Exercise",
      isNpc: true,
      npcName: "Nhà Thám Hiểm Trail",
      npcRole: "Hướng Dẫn Viên Vận Động",
      npcAvatar: require("../../assets/game/regions/npc-trail-explorer-distinct.webp"),
      IconComponent: Footprints,
      x: 384,
      y: 648,
      approachX: 430,
      approachY: 660,
      greetingVi: "Đi bộ nhẹ 15-20 phút sau bữa tối giúp hạ đường huyết và hỗ trợ tiết melatonin tự nhiên trước giờ ngủ.",
      greetingEn: "A gentle 15-20 min post-dinner walk improves glycemic regulation and natural melatonin.",
      detailsVi: "Khuyến nghị: Không tập luyện cường độ cao trong vòng 2 tiếng trước khi đi ngủ.",
      detailsEn: "Guideline: Avoid vigorous workouts within 2 hours before bedtime.",
      actionTextVi: "Ghi nhận đi bộ 15 phút",
      actionTextEn: "Log 15-min Walk",
      badge: "Vận động",
    },
    {
      id: "library",
      titleVi: "Thư Viện Ánh Trăng",
      titleEn: "Moonlight Library",
      roleVi: "Kho Tri Thức Giấc Ngủ",
      roleEn: "Sleep Hygiene Library",
      IconComponent: BookOpen,
      x: 384,
      y: 256,
      approachX: 432,
      approachY: 340,
      greetingVi: "Ánh sáng xanh từ điện thoại ức chế tuyến tùng tiết melatonin. Quy tắc vàng: Tắt màn hình 45p trước khi ngủ.",
      greetingEn: "Blue light suppresses pineal melatonin. Gold standard: Screen-free 45 mins before sleep.",
      detailsVi: "Quy chuẩn vệ sinh giấc ngủ y khoa: Phòng ngủ thoáng mát (18-22°C), tối hoàn toàn và yên tĩnh.",
      detailsEn: "Sleep hygiene guidelines: cool bedroom, total darkness, and quiet environment.",
      actionTextVi: "Mở kho sách giấc ngủ",
      actionTextEn: "Read Sleep Guides",
      badge: "Tri thức",
    },
    {
      id: "boss",
      titleVi: "Cổng Làng An Cư (Home)",
      titleEn: "Home Haven Gate",
      roleVi: "Khu Phố & Ngôi Nhà Ấm Áp",
      roleEn: "Neighborhood & Cozy Chalet",
      IconComponent: Home,
      x: 784,
      y: 252,
      approachX: 784,
      approachY: 414,
      greetingVi: "Cánh cổng đá vòm rợp hoa lá dẫn vào Làng An Cư — nơi tọa lạc ngôi nhà ấm áp của bạn và khu phố những người bạn cùng rèn luyện lối sống khỏe.",
      greetingEn: "The stone ivy archway leading to Home Haven — your cozy chalet and neighborhood of friends.",
      detailsVi: "Bước qua cánh cổng để về ngôi nhà ấm cúng của riêng bạn hoặc khám phá bản đồ khu phố minh họa của các cư dân trong làng.",
      detailsEn: "Pass through to enter your personal home or explore the illustrated player neighborhood.",
      actionTextVi: "Về Nhà Của Bạn (Home) 🏡",
      actionTextEn: "Enter Your Home 🏡",
      badge: "Về Nhà",
    },
    {
      id: "observatory",
      titleVi: "Đài Thiên Văn Giấc Mơ",
      titleEn: "Dream Observatory",
      roleVi: "Cột Mốc & Phần Thưởng",
      roleEn: "Milestones & Trophies",
      IconComponent: Trophy,
      x: 1344,
      y: 702,
      approachX: 1260,
      approachY: 720,
      greetingVi: "Khu vực lưu giữ các phần thưởng và cột mốc hành trình sức khỏe của bạn.",
      greetingEn: "Archive of your wellness keepsakes and habit milestones.",
      detailsVi: "Cột mốc: Ngày 7, Ngày 14, Ngày 30. Mỗi cột mốc nhận thưởng cổ vật và danh hiệu vinh danh.",
      detailsEn: "Milestones: Day 7, Day 14, Day 30. Unlock artifacts and honors.",
      actionTextVi: "Xem bảo tàng thành tựu",
      actionTextEn: "Open Keepsakes",
      badge: "Phần thưởng",
    },
  ],
  "healthclues-realm": [
    {
      id: "camp",
      titleVi: "Trại Thám Hiểm Trung Tâm",
      titleEn: "Realm Central Camp",
      roleVi: "Nhật Ký Thể Chất",
      roleEn: "Physical Care Journal",
      IconComponent: TentTree,
      x: 280,
      y: 465,
      approachX: 380,
      approachY: 670,
      greetingVi: "Chào mừng đến Vương Quốc HealthClues! Điểm danh hôm nay để kích hoạt bảo vệ thể chất.",
      greetingEn: "Welcome to HealthClues Realm! Check in today to fortify your vitality.",
      detailsVi: "Theo dõi lượng nước theo nhu cầu cơ thể, mức độ thoải mái khớp và chế độ dinh dưỡng bảo vệ.",
      detailsEn: "Track hydration, joint comfort, and protective lifestyle nutrition.",
      actionTextVi: "Điểm danh vương quốc (+10 EXP)",
      actionTextEn: "Realm Check-in (+10 EXP)",
      badge: "Thiết yếu",
    },
    {
      id: "botanical",
      titleVi: "Vườn Thảo Mộc Kháng Viêm",
      titleEn: "Botanical Nutrition Garden",
      roleVi: "Dinh Dưỡng Thực Vật",
      roleEn: "Botanical Nutrition",
      isNpc: true,
      npcName: "Nhà Thực Vật Học",
      npcRole: "Dược Tính Tự Nhiên",
      npcAvatar: require("../../assets/game/regions/npc-botanist-distinct.webp"),
      IconComponent: Flower2,
      x: 1088,
      y: 414,
      approachX: 1040,
      approachY: 480,
      greetingVi: "Khu vườn bảo tồn các loại thảo dược tự nhiên. Tìm hiểu các nhóm thực phẩm giàu flavonoid và anthocyanin.",
      greetingEn: "Botanical garden preserving healing flora. Discover polyphenol-rich foods.",
      detailsVi: "Tri thức dinh dưỡng: Quả mọng và cần tây giàu chất chống oxy hóa tự nhiên, hỗ trợ chuyển hóa lành mạnh.",
      detailsEn: "Nutritional lore: Berries and herbs provide antioxidants supporting metabolic wellness.",
      actionTextVi: "Đọc Sổ Tay Tri Thức",
      actionTextEn: "Read Lorebook",
      badge: "Tri thức thực vật",
    },
    {
      id: "sanctuary",
      titleVi: "Đền Thờ Thanh Lọc Thể Chất",
      titleEn: "Purification Sanctuary",
      roleVi: "Liệu Pháp Nước & Nghỉ Ngơi",
      roleEn: "Hydration & Rest",
      isNpc: true,
      npcName: "Người Hướng Dẫn Sống Khỏe",
      npcRole: "Chuyên Gia Phục Hồi Khớp",
      npcAvatar: require("../../assets/game/regions/npc-wellness-guide-distinct.webp"),
      IconComponent: Flower2,
      x: 1216,
      y: 648,
      approachX: 1180,
      approachY: 650,
      greetingVi: "Nước là dung môi bài tiết tự nhiên tốt nhất. Bài tập thở thư giãn giúp giảm co thắt mạch máu ngoại biên.",
      greetingEn: "Water is nature's best solvent. Relaxed breathing improves peripheral circulation.",
      detailsVi: "Thực hành bài tập thở 4-7-8 giúp xoa dịu thần kinh và tăng lưu thông máu đến khớp bị mỏi.",
      detailsEn: "4-7-8 breathing calms nociceptive signaling and enhances microcirculation.",
      actionTextVi: "Bắt đầu bài tập thở 4-7-8",
      actionTextEn: "Start Breathing",
      badge: "Phục hồi",
    },
    {
      id: "movement",
      titleVi: "Đường Mòn Vận Động Khớp",
      titleEn: "Joint-Friendly Trail",
      roleVi: "Vận Động Không Áp Lực",
      roleEn: "Low-Impact Activity",
      isNpc: true,
      npcName: "Nhà Thám Hiểm Trail",
      npcRole: "Vận Động Trị Liệu",
      npcAvatar: require("../../assets/game/regions/npc-trail-explorer-distinct.webp"),
      IconComponent: Footprints,
      x: 384,
      y: 648,
      approachX: 430,
      approachY: 660,
      greetingVi: "Vận động nhẹ 15 phút kích thích tiết dịch khớp mà không gây tổn thương sụn.",
      greetingEn: "Low-impact exercise stimulates synovial fluid without cartilage impact.",
      detailsVi: "Quy tắc an toàn: Dừng lại ngay khi khớp có dấu hiệu sưng đau cấp tính. Không tập nặng.",
      detailsEn: "Safety rule: Cease physical loading during acute inflammation.",
      actionTextVi: "Ghi nhận 15 phút vận động",
      actionTextEn: "Log Movement",
      badge: "Vận động",
    },
    {
      id: "library",
      titleVi: "Viện Nghiên Cứu Chuyển Hóa",
      titleEn: "Metabolic Research Institute",
      roleVi: "Tri Thức Chuyển Hóa",
      roleEn: "Metabolic Hygiene",
      IconComponent: BookOpen,
      x: 384,
      y: 256,
      approachX: 432,
      approachY: 340,
      greetingVi: "Purine từ nội tạng động vật và hải sản là nguồn gốc chính tạo ra acid uric trong cơ thể.",
      greetingEn: "Dietary purines from organ meats metabolize into uric acid.",
      detailsVi: "Nguyên tắc chế độ ăn: Ưu tiên đạm từ sữa ít béo, trứng và các loại đậu. Uống nước rải đều trong ngày.",
      detailsEn: "Dietary guidelines: Prioritize low-fat dairy and plant proteins.",
      actionTextVi: "Đọc cẩm nang dinh dưỡng",
      actionTextEn: "Read Nutrition Guide",
      badge: "Y học",
    },
    {
      id: "boss",
      titleVi: "Cổng Làng An Cư (Home)",
      titleEn: "Home Haven Gate",
      roleVi: "Khu Phố & Ngôi Nhà Ấm Áp",
      roleEn: "Neighborhood & Cozy Chalet",
      IconComponent: Home,
      x: 784,
      y: 252,
      approachX: 784,
      approachY: 414,
      greetingVi: "Cánh cổng đá vòm rợp hoa lá dẫn vào Làng An Cư — nơi tọa lạc ngôi nhà ấm áp của bạn và khu phố những người bạn cùng rèn luyện lối sống khỏe.",
      greetingEn: "The stone ivy archway leading to Home Haven — your cozy chalet and neighborhood of friends.",
      detailsVi: "Bước qua cánh cổng để về ngôi nhà ấm cúng của riêng bạn hoặc khám phá bản đồ khu phố minh họa của các cư dân trong làng.",
      detailsEn: "Pass through to enter your personal home or explore the illustrated player neighborhood.",
      actionTextVi: "Về Nhà Của Bạn (Home) 🏡",
      actionTextEn: "Enter Your Home 🏡",
      badge: "Về Nhà",
    },
    {
      id: "observatory",
      titleVi: "Nhà Kính Hoàng Gia",
      titleEn: "Royal Conservatory",
      roleVi: "Thành Tựu Sức Khỏe",
      roleEn: "Wellness Hall of Fame",
      IconComponent: Trophy,
      x: 1344,
      y: 702,
      approachX: 1260,
      approachY: 720,
      greetingVi: "Nơi tôn vinh những người chơi duy trì lối sống lành mạnh liên tục 14 và 30 ngày.",
      greetingEn: "Honoring players achieving consistent 14 and 30-day care streaks.",
      detailsVi: "Phần thưởng hiện vật và danh hiệu vinh danh độc quyền từ Hội đồng Cố vấn Sức khỏe.",
      detailsEn: "Exclusive cosmetic keepsakes and advisor commendations.",
      actionTextVi: "Xem danh hiệu",
      actionTextEn: "View Honors",
      badge: "Vinh danh",
    },
  ],
};

const OVERWORLD_8_BIOMES = [
  { id: "health-concern", nameVi: "Vương Quốc HealthClues", nameEn: "HealthClues Realm", color: "#10b981", x: 50, y: 70, playable: true },
  { id: "sleep-valley", nameVi: "Thung Lũng Giấc Ngủ", nameEn: "Sleep Valley", color: "#a855f7", x: 14, y: 32, playable: false },
  { id: "calm-forest", nameVi: "Rừng Tĩnh Lặng", nameEn: "Calm Forest", color: "#06b6d4", x: 32, y: 22, playable: false },
  { id: "energy-hills", nameVi: "Đồi Năng Lượng", nameEn: "Energy Hills", color: "#f59e0b", x: 78, y: 24, playable: false },
  { id: "nutrition-garden", nameVi: "Vườn Dinh Dưỡng", nameEn: "Nutrition Garden", color: "#84cc16", x: 20, y: 65, playable: false },
  { id: "movement-peaks", nameVi: "Đỉnh Vận Động", nameEn: "Movement Peaks", color: "#3b82f6", x: 52, y: 15, playable: false },
  { id: "balance-meadow", nameVi: "Đồng Cân Bằng", nameEn: "Balance Meadow", color: "#14b8a6", x: 48, y: 45, playable: false },
  { id: "natural-living", nameVi: "Rừng Thuận Nhiên", nameEn: "Natural Living Forest", color: "#8b5cf6", x: 82, y: 68, playable: false },
];

const WorldHalosOverlay = React.memo(function WorldHalosOverlay({
  glowMultiplier,
}: {
  glowMultiplier: number;
}) {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {WORLD_GLOW_ANCHORS.map((glow) => {
        const centerOpacity = Number((glow.intensity * glowMultiplier * 0.44).toFixed(2));
        return (
          <View
            key={glow.id}
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: glow.x - glow.radius / 2,
                top: glow.y - glow.radius / 2,
                width: glow.radius,
                height: glow.radius,
                borderRadius: glow.radius / 2,
                zIndex: 180,
              },
              Platform.OS === "web"
                ? ({
                    backgroundImage: `radial-gradient(circle, ${glow.color} 0%, transparent 70%)`,
                    opacity: centerOpacity,
                  } as any)
                : {
                    backgroundColor: glow.color,
                    opacity: Number((centerOpacity * 0.35).toFixed(2)),
                  },
            ]}
          />
        );
      })}
      <View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: FOUNTAIN_CRYSTAL_POS.x - 42,
            top: FOUNTAIN_CRYSTAL_POS.y - 42,
            width: 84,
            height: 84,
            borderRadius: 42,
            zIndex: 181,
          },
          Platform.OS === "web"
            ? ({
                backgroundImage: "radial-gradient(circle, rgba(125,211,252,0.45) 0%, transparent 72%)",
              } as any)
            : {
                backgroundColor: "#38bdf8",
                opacity: 0.14,
              },
        ]}
      />
    </View>
  );
});

// ─── Perf-isolated visitor & remote-player layers ───────────────────────────
// These are separated into React.memo components so that the 120→200ms visitor
// tick (setVisitors) only re-renders this small subtree, NOT the 3000-line
// WorldScreen parent.

const VisitorLayer = React.memo(function VisitorLayer({
  diorama25D,
  isScreenFocused,
  zoomMode,
  mode,
}: {
  diorama25D: boolean;
  isScreenFocused: boolean;
  zoomMode: "close" | "overview";
  mode: RegionMode;
}) {
  const { visitors, handleTapVisitor } = useLivingVillageVisitors({
    isScreenFocused,
    zoomMode,
    mode,
  });

  return (
    <>
      {visitors.map((v) => {
        const scale = getWorldDepthScale(v.y, diorama25D);
        const zIndex = getActorZIndex(v.y, 2);
        const spriteSource = AVATAR_SPRITES[v.avatarKey] || AVATAR_SPRITES["chibi-anna"];
        return (
          <View
            key={v.id}
            style={[
              styles.remotePlayerActor,
              {
                left: v.x - 22,
                top: v.y - 44,
                zIndex,
                transform: [{ scale }],
                // @ts-ignore - Smooth GPU compositor interpolation for living village visitors
                transition: "left 120ms linear, top 120ms linear",
                willChange: "left, top",
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.remotePlayerShadow} />
            <TouchableOpacity
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Simulated villager ${v.name}`}
              onPress={() => {
                handleTapVisitor(v.id);
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
              }}
              style={{
                transform: [{ scaleX: v.facing === "left" ? -1 : 1 }],
              }}
            >
              <Image source={spriteSource} style={styles.remotePlayerSprite} contentFit="contain" />
            </TouchableOpacity>
            <View style={styles.visitorTagPill}>
              <Text style={styles.visitorTagText}>{v.roleTag}</Text>
            </View>
            {v.speech && (
              <View style={styles.visitorSpeechBubble} pointerEvents="none">
                <Text style={styles.visitorSpeechText}>{v.speech}</Text>
                <View style={styles.speechBubbleTail} />
              </View>
            )}
          </View>
        );
      })}
    </>
  );
});

const RemotePlayersLayer = React.memo(function RemotePlayersLayer({
  remotePlayers,
  diorama25D,
  onSelectPeer,
}: {
  remotePlayers: RemoteAdventurer[];
  diorama25D: boolean;
  onSelectPeer: (peer: RemoteAdventurer) => void;
}) {
  return (
    <>
      {remotePlayers.map((peer) => {
        const scale = getWorldDepthScale(peer.y, diorama25D);
        const zIndex = getActorZIndex(peer.y, 3);
        const spriteSource = AVATAR_SPRITES[peer.avatarKey] || AVATAR_SPRITES["chibi-leo"];
        return (
          <View
            key={peer.id}
            style={[
              styles.remotePlayerActor,
              {
                left: peer.x - 22,
                top: peer.y - 44,
                zIndex,
                transform: [{ scale }],
                // @ts-ignore - Smooth GPU compositor interpolation for remote multiplayer peers
                transition: "left 200ms linear, top 200ms linear",
                willChange: "left, top",
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.remotePlayerShadow} />
            <TouchableOpacity
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Online adventurer ${peer.nickname}`}
              onPress={() => {
                onSelectPeer(peer);
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
              }}
              style={{
                transform: [{ scaleX: peer.facing === "left" ? -1 : 1 }],
              }}
            >
              <Image source={spriteSource} style={styles.remotePlayerSprite} contentFit="contain" />
            </TouchableOpacity>
            <View style={styles.remotePlayerNameTag}>
              <View style={styles.onlinePulsingDot} />
              <Text style={styles.remotePlayerNameText}>{peer.nickname}</Text>
            </View>
            {peer.speech && (
              <View style={styles.visitorSpeechBubble} pointerEvents="none">
                <Text style={styles.visitorSpeechText}>{peer.speech}</Text>
                <View style={styles.speechBubbleTail} />
              </View>
            )}
          </View>
        );
      })}
    </>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const WorldLandmarksLayer = React.memo(function WorldLandmarksLayer({
  landmarks,
  diorama25D,
  onSelectLandmark,
}: {
  landmarks: LandmarkStation[];
  diorama25D: boolean;
  onSelectLandmark: (lm: LandmarkStation) => void;
}) {
  return (
    <>
      {landmarks.map((lm) => {
        const lmDepthScale = getWorldDepthScale(lm.y, diorama25D);
        const lmZ = getActorZIndex(lm.y);
        return (
          <TouchableOpacity
            key={lm.id}
            style={[
              styles.landmarkAnchor,
              {
                left: lm.x - 60,
                top: lm.y - 32,
                zIndex: lmZ,
                transform: [
                  { scale: lmDepthScale },
                  ...(diorama25D ? ([{ rotateX: "-18deg" }] as any) : []),
                ],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={lm.isNpc && lm.npcName ? `${lm.npcName} - ${lm.titleVi}` : lm.titleVi}
            onPress={() => onSelectLandmark(lm)}
            activeOpacity={0.8}
          >
            {lm.isNpc && lm.npcAvatar ? (
              <View style={styles.npcActorWrapper}>
                <View style={styles.groundShadowOuter} />
                <View style={styles.groundShadow} />
                <Image
                  source={lm.npcAvatar}
                  style={styles.npcSprite}
                  contentFit="contain"
                />
                <View style={styles.npcNameTag}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.npcNameText}>{lm.npcName}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.buildingSealWrapper}>
                <View style={styles.buildingSealRing}>
                  <lm.IconComponent size={18} color="#fef08a" />
                </View>
                <View style={styles.buildingNamePill}>
                  <Text style={styles.buildingNameText}>{lm.titleVi}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </>
  );
});

interface NeighborHouse {
  id: string;
  ownerName: string;
  role: string;
  avatarKey: "chibi-anna" | "chibi-leo" | "chibi-mia" | "chibi-ben" | "chibi-lily";
  houseName: string;
  houseStyle: string;
  streakDays: number;
  habits: string[];
  welcomeQuote: string;
  isSelf?: boolean;
}

const NEIGHBORHOOD_HOUSES: NeighborHouse[] = [
  {
    id: "house-player",
    ownerName: "Bạn (Lãng Khách)",
    role: "Chủ Nhân Tổ Ấm",
    avatarKey: "chibi-leo",
    houseName: "Chalet Gỗ Ấm Áp Của Bạn",
    houseStyle: "Chalet Phong Cách Bắc Âu · Cấp 2",
    streakDays: 7,
    habits: ["Uống đủ 2L nước", "Bài tập thở 4-7-8", "Ngủ trước 23h"],
    welcomeQuote: "Tổ ấm bình yên của riêng bạn. Sẵn sàng nghỉ ngơi và nhận quà tặng ngày!",
    isSelf: true,
  },
  {
    id: "house-maianh",
    ownerName: "Mai Anh",
    role: "Thảo Dược Viên",
    avatarKey: "chibi-anna",
    houseName: "Biệt Thự Vườn Hoa Hồng Leo",
    houseStyle: "Nhà Vườn Hoa & Trà Thảo Mộc",
    streakDays: 14,
    habits: ["Trà cúc La Mã ấm", "Dạo bộ 20 phút sau tối"],
    welcomeQuote: "Chào bạn! Mình vừa pha một bình trà cúc ấm nóng và cắm hoa tươi đón bạn ghé thăm ✨",
  },
  {
    id: "house-minhtuan",
    ownerName: "Minh Tuấn",
    role: "Kiện Tướng Vận Động",
    avatarKey: "chibi-ben",
    houseName: "Chalet Gỗ Ven Suối Nguồn",
    houseStyle: "Kiến Trúc Sinh Thái Ven Hồ",
    streakDays: 21,
    habits: ["10,000 bước đi bộ", "Kéo giãn cơ buổi sáng"],
    welcomeQuote: "Chào người anh em! Suối nguồn buổi sáng rất sảng khoái, cùng nhau giữ vững kỷ luật nhé! 🏃",
  },
  {
    id: "house-bacsi",
    ownerName: "Bác Sĩ Hoàng",
    role: "Cố Vấn Sức Khỏe Làng",
    avatarKey: "chibi-ben",
    houseName: "Nhà Gỗ Vườn Dược Liệu",
    houseStyle: "Trạm Sức Khỏe & Vườn Thảo Mộc",
    streakDays: 30,
    habits: ["Dinh dưỡng ít purine", "Theo dõi giấc ngủ sâu"],
    welcomeQuote: "Chào lãng khách! Hãy giữ tinh thần thư thái và thói quen sinh hoạt điều độ mỗi ngày 🩺",
  },
  {
    id: "house-leolucas",
    ownerName: "Leo & Lucas",
    role: "Nhà Nghiên Cứu",
    avatarKey: "chibi-leo",
    houseName: "Gác Lửng Kính Thiên Văn",
    houseStyle: "Thư Viện Tri Thức & Kính Thiên Văn",
    streakDays: 12,
    habits: ["Đọc sách 30 phút", "Không màn hình trước ngủ"],
    welcomeQuote: "Chào bạn! Tầng gác mái của tụi mình có kính viễn vọng ngắm bầu trời sao rất đẹp 🔭",
  },
  {
    id: "house-annalily",
    ownerName: "Anna & Lily",
    role: "Hướng Dẫn Viên Thiền",
    avatarKey: "chibi-lily",
    houseName: "Bungalow Vườn Thiền Yên Bình",
    houseStyle: "Bungalow Tre & Chuông Gió",
    streakDays: 18,
    habits: ["Thở 4-7-8 trước ngủ", "Yoga nhẹ nhàng"],
    welcomeQuote: "Thả lỏng đôi vai, nhắm mắt và hít thở thật sâu cùng chúng mình nào 🌸",
  },
];

export default function WorldScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const strings = t();
  const { isAuthenticated, session } = useAuth();
  const {
    world,
    xpTotal,
    currencies,
    checkin,
    refreshWorld,
    loading: worldLoading,
  } = useWorld(isAuthenticated);

  const [visitedHouses, setVisitedHouses] = useState<Record<string, boolean>>({});

  const handleSendNeighborHeart = useCallback((house: NeighborHouse) => {
    if (visitedHouses[house.id]) {
      setActionSuccessMsg(`Bạn đã gửi lời chúc hôm nay tới ${house.ownerName} rồi!`);
      return;
    }
    setVisitedHouses((prev) => ({ ...prev, [house.id]: true }));
    setExpGain({ visible: true, amount: 5 });
    setActionSuccessMsg(`Đã ghé thăm và gửi tim ấm áp tới ${house.ownerName} (+5 EXP)!`);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, [visitedHouses]);

  const [mode, setMode] = useState<RegionMode>("exploration");
  const [activeRegion, setActiveRegion] = useState<ActiveRegion>("healthclues-realm");
  const [zoomMode, setZoomMode] = useState<"close" | "overview">("close");
  const [cameraFollow, setCameraFollow] = useState<boolean>(true);
  const [diorama25D, setDiorama25D] = useState<boolean>(true);
  const diorama25DRef = useRef<boolean>(true);
  diorama25DRef.current = diorama25D;
  const cameraFollowRef = useRef<boolean>(true);
  cameraFollowRef.current = cameraFollow;
  const [atmosphereMode, setAtmosphereMode] = useState<WorldAtmosphereMode>("day");
  const [vpSize, setVpSize] = useState<{ width: number; height: number }>({
    width: screenWidth,
    height: Math.max(220, screenHeight - 108),
  });

  const viewportWidth = vpSize.width;
  const viewportHeight = vpSize.height;
  const mapScale = zoomMode === "overview" ? Math.min(1, viewportWidth / 1600) : 1;
  const coverScale =
    zoomMode === "close"
      ? Math.max(1, viewportWidth / 1600, viewportHeight / 900)
      : 1;

  const handleViewportLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 100 && height > 120) {
      setVpSize((prev) =>
        Math.abs(prev.width - width) > 2 || Math.abs(prev.height - height) > 2
          ? { width, height }
          : prev
      );
    }
  }, []);

  // Player Real-time Coordinates on 1600x900 map (GPU Animated values drive 60fps movement with zero React re-renders)
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 430, y: 660 });
  const playerPosRef = useRef<{ x: number; y: number }>({ x: 430, y: 660 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [waypointQueue, setWaypointQueue] = useState<Point[]>([]);
  const activeRouteRef = useRef<Point[]>([]);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const playerAnimX = useRef(new Animated.Value(430)).current;
  const playerAnimY = useRef(new Animated.Value(660)).current;
  const playerScaleAnim = useRef(new Animated.Value(getWorldDepthScale(660, true))).current;
  const facingScaleAnim = useRef(new Animated.Value(1)).current;
  const petOffsetXAnim = useRef(new Animated.Value(-24)).current;
  const petShadowOffsetXAnim = useRef(new Animated.Value(-24)).current;

  // Interactive sheet / talk HUD state
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkStation | null>(null);
  const [activeTalkLandmark, setActiveTalkLandmark] = useState<LandmarkStation | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [bossQuizPick, setBossQuizPick] = useState<"correct" | "wrong" | null>(null);
  const pendingLandmarkRef = useRef<LandmarkStation | null>(null);

  // 4-7-8 Breathing mini modal state
  const [breathingOpen, setBreathingOpen] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingSeconds, setBreathingSeconds] = useState<number>(4);

  // Rewards & EXP feedback state
  const [expGain, setExpGain] = useState<{ visible: boolean; amount: number }>({
    visible: false,
    amount: 10,
  });
  const [rewardReveal, setRewardReveal] = useState<{
    visible: boolean;
    item: { name: string; icon: string; tone: string; rarity: string; description: string };
  }>({
    visible: false,
    item: {
      name: "Chìa Khóa Cổ Sleep Valley",
      icon: "boss:key",
      tone: "gold",
      rarity: "Huyền thoại",
      description: "Mở khóa kho tàng tri thức y khoa và giải thưởng tuần của Thung Lũng.",
    },
  });

  // Animations
  const walkBobAnim = useRef(new Animated.Value(0)).current;
  const petFloatAnim = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const [isScreenFocused, setIsScreenFocused] = useState<boolean>(true);

  // ScrollView references for expansive pan & camera tracking
  const hScrollRef = useRef<ScrollView>(null);
  const vScrollRef = useRef<ScrollView>(null);
  const mapSurfaceRef = useRef<View>(null);
  const lastScrollRef = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const [cameraScroll, setCameraScroll] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentLandmarks = REGION_LANDMARKS[activeRegion];
  const resolvedAtmosphere = resolveWorldAtmosphere(atmosphereMode);
  const atmosphereVisuals = getAtmosphereVisuals(resolvedAtmosphere);

  // Multiplayer Presence & Simulated Village Adventurers (5-6 visitors)
  const [selectedPeer, setSelectedPeer] = useState<RemoteAdventurer | null>(null);
  const facingDirRef = useRef<"left" | "right">("right");

  const {
    remotePlayers,
    onlineCount,
    mySpeech,
    broadcastPosition,
    sendGreeting,
  } = useWorldPresence({
    region: activeRegion,
    myPos: playerPos,
    walking: isMoving,
    facing: facingDirRef.current,
    nickname: session?.user?.email ? session.user.email.split("@")[0] : "Bạn",
    avatarKey: "chibi-anna",
    isScreenFocused,
  });

  const broadcastPositionRef = useRef(broadcastPosition);
  broadcastPositionRef.current = broadcastPosition;

  const centerCameraOn = useCallback(
    (targetX: number, targetY: number, animated = false) => {
      if (zoomMode !== "close") return;
      const worldW = 1600 * coverScale;
      const worldH = 900 * coverScale;
      const maxX = Math.max(0, worldW - viewportWidth);
      const maxY = Math.max(0, worldH - viewportHeight);
      // Visual center of player sprite (~18px above foot anchor so head + badge sit centered)
      const visualCenterX = targetX * coverScale;
      const visualCenterY = (targetY - 18) * coverScale;
      // Only raise slightly (0.45) when bottom Talk capsule shows on short landscape screens
      const ratioY = activeTalkLandmark && viewportHeight < 420 ? 0.45 : 0.5;
      const scrollX = Math.round(Math.max(0, Math.min(maxX, visualCenterX - viewportWidth * 0.5)));
      const scrollY = Math.round(Math.max(0, Math.min(maxY, visualCenterY - viewportHeight * ratioY)));
      if (Math.abs(scrollX - lastScrollRef.current.x) >= 1) {
        lastScrollRef.current.x = scrollX;
        hScrollRef.current?.scrollTo({ x: scrollX, animated });
        setCameraScroll((prev) => (prev.x !== scrollX ? { ...prev, x: scrollX } : prev));
      }
      if (Math.abs(scrollY - lastScrollRef.current.y) >= 1) {
        lastScrollRef.current.y = scrollY;
        vScrollRef.current?.scrollTo({ y: scrollY, animated });
        setCameraScroll((prev) => (prev.y !== scrollY ? { ...prev, y: scrollY } : prev));
      }
    },
    [viewportWidth, viewportHeight, zoomMode, coverScale, activeTalkLandmark]
  );
  const centerCameraOnRef = useRef(centerCameraOn);
  centerCameraOnRef.current = centerCameraOn;

  const handleSelectLandmark = useCallback((lm: LandmarkStation) => {
    pendingLandmarkRef.current = lm;
    const targetPt = { x: lm.approachX, y: lm.approachY };
    const waypoints = buildRoadWaypoints(playerPosRef.current, targetPt);
    setTargetPos(targetPt);
    setWaypointQueue(waypoints);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }, []);

  // Check arrival within interaction radius of landmarks
  const checkArrivalNearLandmark = useCallback(
    (x: number, y: number, reachedFinal = false) => {
      const nearby = currentLandmarks.find((lm) => {
        const d = Math.hypot(lm.approachX - x, lm.approachY - y);
        return d <= 105;
      });
      const arrivedTarget =
        nearby || (reachedFinal ? pendingLandmarkRef.current : null);
      if (reachedFinal) pendingLandmarkRef.current = null;

      if (arrivedTarget) {
        setActiveTalkLandmark(arrivedTarget);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      } else {
        setActiveTalkLandmark(null);
      }
    },
    [currentLandmarks]
  );

  // Auto-dismiss transient floating toast messages when modal sheet is closed
  useEffect(() => {
    if (!actionSuccessMsg || selectedLandmark) return;
    const timer = setTimeout(() => setActionSuccessMsg(null), 3500);
    return () => clearTimeout(timer);
  }, [actionSuccessMsg, selectedLandmark]);

  // Handle map tap to move player (cross-platform: Web rect scaling + Native locationX/Y)
  const handleMapPress = (e: GestureResponderEvent) => {
    if (mode !== "exploration" || zoomMode === "overview") return;

    const ev = e.nativeEvent as any;
    let tapX: number | undefined;
    let tapY: number | undefined;

    if (Platform.OS === "web") {
      const surfaceEl = mapSurfaceRef.current as unknown as HTMLElement | null;
      if (surfaceEl && typeof surfaceEl.getBoundingClientRect === "function" && typeof ev.clientX === "number") {
        const rect = surfaceEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          tapX = ((ev.clientX - rect.left) / rect.width) * 1600;
          tapY = ((ev.clientY - rect.top) / rect.height) * 900;
        }
      } else if (typeof ev.offsetX === "number" && typeof ev.offsetY === "number") {
        tapX = ev.offsetX;
        tapY = ev.offsetY;
      }
    }

    if (tapX === undefined && typeof ev.locationX === "number") tapX = ev.locationX;
    if (tapY === undefined && typeof ev.locationY === "number") tapY = ev.locationY;

    if (typeof tapX !== "number" || typeof tapY !== "number" || Number.isNaN(tapX) || Number.isNaN(tapY)) {
      return;
    }

    const clampedX = Math.max(0, Math.min(1600, tapX));
    const clampedY = Math.max(0, Math.min(900, tapY));
    const snappedRoadPoint = snapToWalkableRoad({ x: clampedX, y: clampedY });

    if (snappedRoadPoint) {
      pendingLandmarkRef.current = null;
      const waypoints = buildRoadWaypoints(playerPosRef.current, snappedRoadPoint);
      setTargetPos(snappedRoadPoint);
      setWaypointQueue(waypoints);

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  // Sync depth scale smoothly when user toggles 2.5D mode
  useEffect(() => {
    playerScaleAnim.setValue(getWorldDepthScale(playerPosRef.current.y, diorama25D));
  }, [diorama25D, playerScaleAnim]);

  // 60FPS requestAnimationFrame waypoint movement loop (updates GPU Animated.Values with 0 React re-renders mid-walk)
  useEffect(() => {
    if (waypointQueue.length === 0) {
      activeRouteRef.current = [];
      setIsMoving(false);
      return;
    }

    activeRouteRef.current = [...waypointQueue];
    setIsMoving(true);
    const speed = 290; // pixels per second
    let lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    let rafId = 0;
    let cancelled = false;

    const tick = (nowArg?: number) => {
      if (cancelled) return;
      const now = typeof nowArg === "number" ? nowArg : (typeof performance !== "undefined" ? performance.now() : Date.now());
      const dt = Math.min(0.04, Math.max(0.005, (now - lastTime) / 1000));
      lastTime = now;

      const route = activeRouteRef.current;
      if (!route || route.length === 0) {
        setIsMoving(false);
        setTargetPos(null);
        setWaypointQueue([]);
        return;
      }

      const curr = playerPosRef.current;
      let currX = Number.isNaN(curr.x) ? 430 : curr.x;
      let currY = Number.isNaN(curr.y) ? 660 : curr.y;
      let remainingStep = speed * dt;

      // Continuous multi-waypoint steering: consumes remaining step distance smoothly through waypoints without pauses
      while (remainingStep > 0 && route.length > 0) {
        const targetWp = route[0];
        const segDx = targetWp.x - currX;
        const segDy = targetWp.y - currY;
        const segDist = Math.hypot(segDx, segDy);

        if (segDx > 1.5) {
          facingDirRef.current = "right";
          facingScaleAnim.setValue(1);
          petOffsetXAnim.setValue(-24);
          petShadowOffsetXAnim.setValue(-24);
        } else if (segDx < -1.5) {
          facingDirRef.current = "left";
          facingScaleAnim.setValue(-1);
          petOffsetXAnim.setValue(42);
          petShadowOffsetXAnim.setValue(42);
        }

        if (segDist <= remainingStep) {
          // Reached this waypoint in current frame: snap to it, consume distance, advance to next waypoint!
          currX = targetWp.x;
          currY = targetWp.y;
          remainingStep -= segDist;
          route.shift();
        } else {
          // Move smoothly along current segment
          currX += (segDx / segDist) * remainingStep;
          currY += (segDy / segDist) * remainingStep;
          remainingStep = 0;
        }
      }

      playerPosRef.current = { x: currX, y: currY };
      playerAnimX.setValue(currX);
      playerAnimY.setValue(currY);
      playerScaleAnim.setValue(getWorldDepthScale(currY, diorama25DRef.current));

      if (cameraFollowRef.current) {
        centerCameraOnRef.current(currX, currY, false);
      }

      if (route.length === 0) {
        setPlayerPos({ x: currX, y: currY });
        setIsMoving(false);
        setTargetPos(null);
        setWaypointQueue([]);
        checkArrivalNearLandmark(currX, currY, true);
        broadcastPositionRef.current(currX, currY, false, facingDirRef.current);
        return;
      }

      broadcastPositionRef.current(currX, currY, true, facingDirRef.current);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafId && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    waypointQueue,
    checkArrivalNearLandmark,
    playerAnimX,
    playerAnimY,
    playerScaleAnim,
    facingScaleAnim,
    petOffsetXAnim,
    petShadowOffsetXAnim,
  ]);

  // Subtle natural walking step bob (smooth 3.5px gait without violent shaking)
  useEffect(() => {
    if (isMoving) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(walkBobAnim, {
            toValue: -3.5,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(walkBobAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      walkBobAnim.setValue(0);
    }
  }, [isMoving, walkBobAnim]);

  // Initial proximity talk check
  useEffect(() => {
    checkArrivalNearLandmark(playerPosRef.current.x, playerPosRef.current.y);
  }, [checkArrivalNearLandmark]);

  // Keep camera centered on player whenever viewport, zoom, or active Talk HUD changes (no React re-render loop during walking)
  useEffect(() => {
    if (mode === "exploration" && zoomMode === "close" && cameraFollow) {
      centerCameraOn(playerPosRef.current.x, playerPosRef.current.y, false);
    }
  }, [vpSize.width, vpSize.height, zoomMode, mode, cameraFollow, centerCameraOn]);

  // Restore Web scroll offsets when returning to Thế Giới tab & pause background loops offscreen
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      lastScrollRef.current = { x: -999, y: -999 };
      const timer = setTimeout(() => {
        if (mode === "exploration" && zoomMode === "close") {
          centerCameraOn(playerPosRef.current.x, playerPosRef.current.y, false);
        }
      }, 60);
      return () => {
        clearTimeout(timer);
        setIsScreenFocused(false);
      };
    }, [mode, zoomMode, centerCameraOn])
  );

  // Lightweight pet hover animation — runs ONLY when World tab is focused in active exploration
  useEffect(() => {
    if (!isScreenFocused || mode !== "exploration" || zoomMode !== "close") {
      petFloatAnim.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(petFloatAnim, {
          toValue: -6,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(petFloatAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isScreenFocused, mode, zoomMode, petFloatAnim]);

  // 4-7-8 Breathing Loop
  useEffect(() => {
    if (!breathingOpen) return;
    let timer: any;
    if (breathingPhase === "inhale") {
      Animated.timing(breathAnim, {
        toValue: 1.6,
        duration: 4000,
        useNativeDriver: true,
      }).start();
      timer = setTimeout(() => {
        setBreathingPhase("hold");
        setBreathingSeconds(7);
      }, 4000);
    } else if (breathingPhase === "hold") {
      timer = setTimeout(() => {
        setBreathingPhase("exhale");
        setBreathingSeconds(8);
      }, 7000);
    } else if (breathingPhase === "exhale") {
      Animated.timing(breathAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      }).start();
      timer = setTimeout(() => {
        setBreathingPhase("inhale");
        setBreathingSeconds(4);
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [breathingOpen, breathingPhase, breathAnim]);

  const handleActionClick = async (landmark: LandmarkStation) => {
    if (landmark.id === "camp") {
      try {
        await checkin([], "Điểm danh nhanh từ Bản Đồ RPG");
        setActionSuccessMsg("Điểm danh thành công! +10 EXP đã được ghi nhận.");
        setExpGain({ visible: true, amount: 10 });
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      } catch (err: any) {
        setActionSuccessMsg("Hôm nay bạn đã hoàn thành điểm danh rồi!");
      }
    } else if (landmark.id === "sanctuary") {
      setSelectedLandmark(null);
      setActiveTalkLandmark(null);
      setBreathingOpen(true);
    } else if (landmark.id === "botanical") {
      setActionSuccessMsg("Đã lưu tri thức thực vật giàu flavonoid vào Sổ Tay Tri Thức!");
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } else if (landmark.id === "library") {
      setActionSuccessMsg("Mẹo chuyển hóa: Uống nước rải đều cả ngày, ưu tiên rau xanh & đạm ít purine.");
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } else if (landmark.id === "movement") {
      setActionSuccessMsg("Đã ghi nhận mục tiêu vận động nhẹ 15 phút bảo vệ sụn khớp!");
      setExpGain({ visible: true, amount: 10 });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } else if (landmark.id === "observatory") {
      const lvl = Math.max(1, Math.floor(xpTotal / 100) + 1);
      setActionSuccessMsg(`Hồ sơ vinh danh hiện tại: Cấp ${lvl} · ${xpTotal} EXP tích lũy.`);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    } else if (landmark.id === "boss") {
      setSelectedLandmark(null);
      setActiveTalkLandmark(null);
      router.push("/(game)/home");
      return;
    } else {
      setActionSuccessMsg(`Đã hoàn thành tương tác tại ${landmark.titleVi}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* 1. TOP HUD */}
      <TopHud
        level={Math.max(1, Math.floor(xpTotal / 100) + 1)}
        expTotal={xpTotal}
        keys={currencies.keys}
        fragments={currencies.fragments}
        onlineCount={Math.max(1, onlineCount)}
      />

      {/* Solid Overworld Header Bar ONLY shown when browsing 8-biome scroll page */}
      {mode === "overworld" && (
        <View style={styles.topToolbar}>
          <View style={styles.topToolbarRow}>
            <TouchableOpacity
              style={styles.regionPillBtn}
              accessibilityRole="button"
              accessibilityLabel="Vương Quốc HealthClues"
              onPress={() => {
                setMode("exploration");
                setActiveRegion("healthclues-realm");
                setActiveTalkLandmark(null);
                setSelectedLandmark(null);
              }}
            >
              <MapPin size={10} color={colors.textSecondary} />
              <Text style={styles.regionPillBtnText}>Vương Quốc</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.regionPillBtn, { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Thung Lũng Giấc Ngủ Tạm Khóa"
              onPress={() => {
                setActionSuccessMsg("Thung Lũng Giấc Ngủ đang tạm khóa để nâng cấp. Vui lòng khám phá Vương Quốc HealthClues!");
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                } catch {}
              }}
            >
              <Lock size={10} color="#f59e0b" />
              <Text style={[styles.regionPillBtnText, { color: "#fcd34d" }]}>Thung Lũng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.overworldToggleBtn, styles.overworldToggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Vào RPG"
              onPress={() => {
                setMode("exploration");
                setActiveTalkLandmark(null);
                setSelectedLandmark(null);
              }}
            >
              <Compass size={11} color="#ffffff" />
              <Text style={[styles.overworldToggleText, styles.overworldToggleTextActive]}>Vào RPG</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 4. MODE 1: EXPANSIVE 1600x900 RPG GAME WORLD (Floating translucent top controls) */}
      {mode === "exploration" && (
        <View
          style={styles.gameViewport}
          onLayout={handleViewportLayout}
          accessibilityLabel="world-game-viewport"
        >
          {/* Floating Region & View Pills tucked neatly over top map edge (eliminates double opaque top bar) */}
          <View style={styles.floatingToolbarOverlay} pointerEvents="box-none">
            <View style={styles.topToolbarRow}>
              <TouchableOpacity
                style={[
                  styles.regionPillBtn,
                  activeRegion === "healthclues-realm" && styles.regionPillBtnActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Vương Quốc HealthClues"
                onPress={() => {
                  setMode("exploration");
                  setActiveRegion("healthclues-realm");
                  setActiveTalkLandmark(null);
                  setSelectedLandmark(null);
                }}
              >
                <MapPin size={10} color={activeRegion === "healthclues-realm" ? colors.emeraldLight : colors.textSecondary} />
                <Text
                  style={[
                    styles.regionPillBtnText,
                    activeRegion === "healthclues-realm" && styles.regionPillBtnTextActive,
                  ]}
                >
                  Vương Quốc
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.regionPillBtn, { opacity: 0.78 }]}
                accessibilityRole="button"
                accessibilityLabel="Thung Lũng Giấc Ngủ Tạm Khóa"
                onPress={() => {
                  setActionSuccessMsg("Thung Lũng Giấc Ngủ đang tạm khóa để nâng cấp. Vui lòng khám phá Vương Quốc HealthClues!");
                  try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  } catch {}
                }}
              >
                <Lock size={10} color="#f59e0b" />
                <Text style={[styles.regionPillBtnText, { color: "#fcd34d" }]}>Thung Lũng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toolIconBtn,
                  zoomMode === "overview" && styles.toolIconBtnActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={zoomMode === "close" ? "Toàn Cảnh" : "Cận Cảnh"}
                onPress={() => {
                  lastScrollRef.current = { x: -999, y: -999 };
                  setPlayerPos({ ...playerPosRef.current });
                  setZoomMode((z) => (z === "close" ? "overview" : "close"));
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                }}
              >
                {zoomMode === "close" ? (
                  <Minimize2 size={11} color={colors.textPrimary} />
                ) : (
                  <Maximize2 size={11} color="#061814" />
                )}
                <Text
                  style={[
                    styles.toolBtnText,
                    zoomMode === "overview" && { color: "#061814" },
                  ]}
                >
                  {zoomMode === "close" ? "Toàn Cảnh" : "Cận Cảnh"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.overworldToggleBtn}
                accessibilityRole="button"
                accessibilityLabel="8 Vùng"
                onPress={() => {
                  setMode("overworld");
                  setActiveTalkLandmark(null);
                  setSelectedLandmark(null);
                }}
              >
                <Compass size={11} color={colors.goldLight} />
                <Text style={styles.overworldToggleText}>8 Vùng</Text>
              </TouchableOpacity>
            </View>

            {zoomMode === "close" && (
              <View style={styles.floatingSceneControlsRight} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.dioramaHudBtn}
                  accessibilityRole="button"
                  accessibilityLabel="world-atmosphere-toggle"
                  onPress={() => {
                    const order: WorldAtmosphereMode[] = ["day", "sunset", "night", "auto"];
                    const next = order[(order.indexOf(atmosphereMode) + 1) % order.length];
                    setAtmosphereMode(next);
                    const nextVisual = getAtmosphereVisuals(resolveWorldAtmosphere(next));
                    setActionSuccessMsg(
                      next === "auto"
                        ? `Ánh sáng tự động (${nextVisual.labelVi})`
                        : `Ánh sáng: ${nextVisual.labelVi}`
                    );
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                  }}
                >
                  {resolvedAtmosphere === "night" ? (
                    <Moon size={11} color="#93c5fd" />
                  ) : atmosphereMode === "auto" ? (
                    <Clock size={11} color={colors.emeraldLight} />
                  ) : (
                    <Sun size={11} color={resolvedAtmosphere === "sunset" ? "#fb923c" : "#fde047"} />
                  )}
                  <Text style={styles.dioramaHudText}>{atmosphereVisuals.labelVi}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dioramaHudBtn, diorama25D && styles.dioramaHudBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel="world-25d-toggle"
                  onPress={() => {
                    setDiorama25D((prev) => {
                      const next = !prev;
                      setActionSuccessMsg(next ? "Đã bật chiều sâu 2.5D Diorama & Parallax Núi Hồ" : "Đã chuyển về mặt phẳng 2D chuẩn");
                      return next;
                    });
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                  }}
                >
                  <Sparkles size={11} color={diorama25D ? "#042f2e" : colors.textSecondary} />
                  <Text style={[styles.dioramaHudText, diorama25D && styles.dioramaHudTextActive]}>
                    {diorama25D ? "✨ 2.5D" : "🗺️ 2D"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {zoomMode === "overview" ? (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.overviewScrollContent}>
              <TouchableOpacity
                ref={mapSurfaceRef as any}
                activeOpacity={1}
                onPress={() => setZoomMode("close")}
                style={{
                  width: 1600 * mapScale,
                  height: 900 * mapScale,
                  alignSelf: "center",
                  borderRadius: radius.md,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(245, 158, 11, 0.35)",
                }}
              >
                <ImageBackground
                  source={
                    activeRegion === "sleep-valley"
                      ? require("../../assets/game/regions/sleep-valley-scene-blueprint.webp")
                      : require("../../assets/game/regions/healthclues-realm-scene-blueprint.webp")
                  }
                  style={styles.blueprintCanvas}
                  resizeMode="cover"
                >
                  {currentLandmarks.map((lm) => (
                    <TouchableOpacity
                      key={lm.id}
                      style={[
                        styles.overviewPinDot,
                        {
                          left: lm.x * mapScale - 11,
                          top: lm.y * mapScale - 11,
                        },
                      ]}
                      onPress={() => {
                        setZoomMode("close");
                        const targetPt = { x: lm.approachX, y: lm.approachY };
                        setTargetPos(targetPt);
                        setWaypointQueue(buildRoadWaypoints(playerPos, targetPt));
                      }}
                    >
                      <lm.IconComponent size={11} color="#fef08a" />
                    </TouchableOpacity>
                  ))}
                  <View
                    style={[
                      styles.overviewPlayerDot,
                      {
                        left: playerPos.x * mapScale - 9,
                        top: playerPos.y * mapScale - 9,
                      },
                    ]}
                  />
                </ImageBackground>
              </TouchableOpacity>

              {/* Station Quick Navigator below Overview Map */}
              <View style={styles.overviewStationsSection}>
                <Text style={styles.overviewStationsHeading}>
                  Điểm Tương Tác Trong Vùng Đất ({currentLandmarks.length})
                </Text>
                <View style={styles.overviewStationsGrid}>
                  {currentLandmarks.map((lm) => (
                    <TouchableOpacity
                      key={lm.id}
                      style={styles.overviewStationCard}
                      onPress={() => {
                        setZoomMode("close");
                        const targetPt = { x: lm.approachX, y: lm.approachY };
                        setTargetPos(targetPt);
                        setWaypointQueue(buildRoadWaypoints(playerPos, targetPt));
                      }}
                    >
                      <View style={styles.overviewStationIcon}>
                        <lm.IconComponent size={15} color="#fef08a" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.overviewStationTitle} numberOfLines={1}>
                          {lm.npcName || lm.titleVi}
                        </Text>
                        <Text style={styles.overviewStationRole} numberOfLines={1}>
                          {lm.roleVi}
                        </Text>
                      </View>
                      <ArrowRight size={13} color={colors.emeraldLight} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.dioramaStageWrapper}>
              {/* TRUE 2.5D PARALLAX HORIZON LAYER: Separated Alpine Mountains & Lake */}
              {diorama25D && (
                <View style={styles.parallaxBackgroundContainer} pointerEvents="none">
                  <Image
                    source={require("../../assets/game/regions/world-bg-mountains-lake.webp")}
                    style={[
                      styles.parallaxBackgroundImage,
                      {
                        transform: [
                          { translateX: -cameraScroll.x * 0.32 },
                          { translateY: -cameraScroll.y * 0.12 },
                          { scale: 1.08 },
                        ],
                      },
                    ]}
                    contentFit="cover"
                  />
                  <View style={styles.horizonMistOverlay} />
                </View>
              )}

              <ScrollView
                ref={vScrollRef}
                style={styles.vScroll}
                contentContainerStyle={styles.vScrollContent}
                scrollEnabled={true}
                bounces={false}
                overScrollMode="never"
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const y = Math.round(e.nativeEvent.contentOffset.y);
                  if (Math.abs(y - lastScrollRef.current.y) >= 2) {
                    setCameraScroll((prev) => ({ ...prev, y }));
                  }
                }}
              >
                <ScrollView
                  ref={hScrollRef}
                  horizontal
                  style={styles.hScroll}
                  contentContainerStyle={styles.hScrollContent}
                  scrollEnabled={true}
                  bounces={false}
                  overScrollMode="never"
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={(e) => {
                    const x = Math.round(e.nativeEvent.contentOffset.x);
                    if (Math.abs(x - lastScrollRef.current.x) >= 2) {
                      setCameraScroll((prev) => ({ ...prev, x }));
                    }
                  }}
                >
                  <View
                    style={{
                      width: 1600 * coverScale,
                      height: 900 * coverScale,
                      overflow: "hidden",
                    }}
                  >
                    <TouchableOpacity
                      ref={mapSurfaceRef as any}
                      activeOpacity={1}
                      onPress={handleMapPress}
                      style={[
                        styles.mapTouchSurface,
                        coverScale !== 1
                          ? {
                              transform: [
                                { translateX: (1600 * (coverScale - 1)) / 2 },
                                { translateY: (900 * (coverScale - 1)) / 2 },
                                { scale: coverScale },
                                ...(diorama25D
                                  ? ([{ perspective: 1200 }, { rotateX: "13deg" }] as any)
                                  : ([{ perspective: 1200 }, { rotateX: "0deg" }] as any)),
                              ],
                            }
                          : diorama25D
                          ? (styles.dioramaGroundTilt as any)
                          : (styles.flatGround2D as any),
                      ]}
                    >
                    <ImageBackground
                      accessibilityLabel="world-blueprint-canvas"
                      source={
                        activeRegion === "sleep-valley"
                          ? require("../../assets/game/regions/sleep-valley-scene-blueprint.webp")
                          : require("../../assets/game/regions/healthclues-realm-scene-blueprint.webp")
                      }
                      style={styles.blueprintCanvas}
                      resizeMode="cover"
                    >
                    {/* Zero overdraw in default Daytime; only apply tint & soft radial halos in Sunset/Night */}
                    {resolvedAtmosphere !== "day" && (
                      <View
                        style={[
                          styles.gameVignette,
                          { backgroundColor: atmosphereVisuals.tintColor },
                        ]}
                        pointerEvents="none"
                      />
                    )}
                    {diorama25D && resolvedAtmosphere !== "day" && (
                      <WorldHalosOverlay glowMultiplier={atmosphereVisuals.glowMultiplier} />
                    )}

                    {/* TARGET DESTINATION MARKER (Foreshortened isometric stone ring) */}
                    {targetPos && (
                      <View
                        style={[
                          styles.targetMarkerPin,
                          {
                            left: targetPos.x - 16,
                            top: targetPos.y - 16,
                            zIndex: getActorZIndex(targetPos.y, -2),
                            transform: [
                              { scale: getWorldDepthScale(targetPos.y, diorama25D) },
                              { scaleY: diorama25D ? 0.56 : 1 },
                            ],
                          },
                        ]}
                        pointerEvents="none"
                      >
                        <View style={styles.targetPulseRing} />
                        <Crosshair size={18} color={colors.emeraldLight} />
                      </View>
                    )}

                    {/* MEMOIZED NPCS & LANDMARKS LAYER (zero re-renders during walk/scroll) */}
                    <WorldLandmarksLayer
                      landmarks={currentLandmarks}
                      diorama25D={diorama25D}
                      onSelectLandmark={handleSelectLandmark}
                    />

                    {/* 6 SIMULATED LIVING VILLAGE ADVENTURERS — self-contained isolated layer */}
                    <VisitorLayer
                      diorama25D={diorama25D}
                      isScreenFocused={isScreenFocused}
                      zoomMode={zoomMode}
                      mode={mode}
                    />

                    {/* REAL ONLINE ADVENTURERS LAYER — memo-isolated layer */}
                    <RemotePlayersLayer
                      remotePlayers={remotePlayers}
                      diorama25D={diorama25D}
                      onSelectPeer={setSelectedPeer}
                    />

                    {/* GROUND CONTACT SHADOWS (GPU-driven 60fps decoupled shadows) */}
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.playerShadowOuter,
                        {
                          left: -19,
                          top: -6,
                          zIndex: getActorZIndex(playerPos.y, 1),
                          opacity: walkBobAnim.interpolate({
                            inputRange: [-8, 0],
                            outputRange: [0.3, 0.55],
                          }),
                          transform: [
                            { translateX: playerAnimX },
                            { translateY: playerAnimY },
                            { scale: playerScaleAnim },
                            {
                              scaleX: walkBobAnim.interpolate({
                                inputRange: [-8, 0],
                                outputRange: [0.78, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <View style={styles.playerShadow} />
                    </Animated.View>

                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.petGroundShadow,
                        {
                          left: -10,
                          top: -6,
                          zIndex: getActorZIndex(playerPos.y, 1),
                          opacity: petFloatAnim.interpolate({
                            inputRange: [-7, 2],
                            outputRange: [0.22, 0.44],
                          }),
                          transform: [
                            { translateX: Animated.add(playerAnimX, petShadowOffsetXAnim) },
                            { translateY: playerAnimY },
                            { scale: playerScaleAnim },
                            {
                              scaleX: petFloatAnim.interpolate({
                                inputRange: [-7, 2],
                                outputRange: [0.78, 1.05],
                              }),
                            },
                          ],
                        },
                      ]}
                    />

                    {/* PLAYER CHARACTER DRIVEN 100% BY GPU ANIMATED VALUES */}
                    <Animated.View
                      accessibilityLabel="player-avatar-actor"
                      style={[
                        styles.playerActor,
                        {
                          left: -24,
                          top: -48,
                          zIndex: getActorZIndex(playerPos.y, 3),
                          transform: [
                            { translateX: playerAnimX },
                            { translateY: playerAnimY },
                            { scale: playerScaleAnim },
                            { translateY: walkBobAnim },
                            ...(diorama25D ? ([{ rotateX: "-18deg" }] as any) : []),
                          ],
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <Animated.View style={{ transform: [{ scaleX: facingScaleAnim }] }}>
                        <Image
                          source={require("../../assets/game/characters/chibi-anna.png")}
                          style={styles.playerSprite}
                          contentFit="contain"
                        />
                      </Animated.View>
                      <View style={styles.playerNameTag}>
                        <Text style={styles.playerNameText}>Bạn</Text>
                      </View>
                      {mySpeech && (
                        <View style={styles.mySpeechBubble} pointerEvents="none">
                          <Text style={styles.mySpeechText}>{mySpeech}</Text>
                          <View style={styles.mySpeechBubbleTail} />
                        </View>
                      )}
                    </Animated.View>

                    {/* PET COMPANION LUMI/LUNA DRIVEN BY GPU ANIMATED VALUES */}
                    <Animated.View
                      style={[
                        styles.petActor,
                        {
                          left: -14,
                          top: -44,
                          zIndex: getActorZIndex(playerPos.y, 2),
                          transform: [
                            { translateX: Animated.add(playerAnimX, petOffsetXAnim) },
                            { translateY: playerAnimY },
                            { scale: Animated.multiply(playerScaleAnim, 0.96) },
                            { translateY: petFloatAnim },
                            ...(diorama25D ? ([{ rotateX: "-18deg" }] as any) : []),
                          ],
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <Image
                        source={require("../../assets/game/ui/lumi_fox_clean.png")}
                        style={styles.petSprite}
                        contentFit="contain"
                      />
                      <View style={styles.petNameTag}>
                        <Text style={styles.petNameText}>
                          {activeRegion === "sleep-valley" ? "Luna" : "Lumi"}
                        </Text>
                      </View>
                    </Animated.View>

                    {/* STATIC ZERO-CPU AMBIENT CRYSTAL & FIREFLY MOTES ONLY IN SUNSET/NIGHT */}
                    {diorama25D &&
                      resolvedAtmosphere !== "day" &&
                      WORLD_AMBIENT_PARTICLES.map((particle) => (
                        <View
                          key={particle.id}
                          pointerEvents="none"
                          style={{
                            position: "absolute",
                            left: particle.x,
                            top: particle.y,
                            width: particle.size,
                            height: particle.size,
                            borderRadius: particle.size / 2,
                            backgroundColor: particle.color,
                            opacity: particle.opacity,
                            zIndex: particle.depth > 1 ? 920 : particle.depth > 0.5 ? 520 : 210,
                          }}
                        />
                      ))}
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        )}

          {/* ACTIVE TALK HUD (SLIM SINGLE-ROW PROMPT NEVER OBSCURING AVATAR) */}
          {activeTalkLandmark && (
            <View style={styles.activeTalkWrap} pointerEvents="box-none">
              <View style={styles.activeTalkFloatingHud} accessibilityLabel="active-talk-hud">
                {activeTalkLandmark.npcAvatar ? (
                  <Image
                    source={activeTalkLandmark.npcAvatar}
                    style={styles.talkAvatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.talkBuildingIconBox}>
                    <activeTalkLandmark.IconComponent size={15} color={colors.goldLight} />
                  </View>
                )}

                <View style={styles.talkContentCol}>
                  <Text style={styles.talkNpcNameText} numberOfLines={1}>
                    {activeTalkLandmark.npcName || activeTalkLandmark.titleVi}
                  </Text>
                  <Text style={styles.talkRoleSnippet} numberOfLines={1}>
                    {activeTalkLandmark.roleVi}
                  </Text>
                </View>

                {activeTalkLandmark.id === "boss" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.talkActionBtn, { backgroundColor: "#10b981", paddingHorizontal: 10 }]}
                      accessibilityRole="button"
                      accessibilityLabel="go-home-direct"
                      onPress={() => {
                        setActiveTalkLandmark(null);
                        router.push("/(game)/home");
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.talkActionBtnText, { color: "#ffffff", fontWeight: "700" }]}>Về Nhà 🏡</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.talkActionBtn}
                      accessibilityRole="button"
                      accessibilityLabel="open-neighborhood-sheet"
                      onPress={() => {
                        setActionSuccessMsg(null);
                        setSelectedLandmark(activeTalkLandmark);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.talkActionBtnText}>Khu Phố</Text>
                      <ArrowRight size={12} color="#061814" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.talkActionBtn}
                    accessibilityRole="button"
                    accessibilityLabel="open-station-sheet"
                    onPress={() => {
                      setActionSuccessMsg(null);
                      setBossQuizPick(null);
                      setSelectedLandmark(activeTalkLandmark);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.talkActionBtnText}>Khám Phá</Text>
                    <ArrowRight size={12} color="#061814" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.talkDismissBtn}
                  accessibilityRole="button"
                  accessibilityLabel="dismiss-talk-hud"
                  onPress={() => setActiveTalkLandmark(null)}
                >
                  <X size={13} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 5. MODE 2: OVERWORLD 8 BIOMES MAP SELECTION */}
      {mode === "overworld" && (
        <ScrollView style={styles.overworldScroll} contentContainerStyle={styles.overworldScrollContent}>
          <View style={styles.overworldHeaderBox}>
            <Text style={styles.overworldHeaderTitle}>8 Vùng Đất Sinh Cảnh HealthClues</Text>
            <Text style={styles.overworldHeaderSub}>
              Khám phá hệ sinh thái sống khỏe. Vùng đất hiện đang mở: Vương Quốc HealthClues.
            </Text>
          </View>

          <View style={styles.overworldMapCard}>
            <ImageBackground
              source={require("../../assets/game/regions/healthclues-world-overworld.webp")}
              style={styles.overworldMapArt}
              resizeMode="cover"
            >
              {OVERWORLD_8_BIOMES.map((biome) => (
                <TouchableOpacity
                  key={biome.id}
                  style={[
                    styles.overworldPin,
                    { left: `${biome.x}%`, top: `${biome.y}%` },
                    !biome.playable && styles.overworldPinLocked,
                  ]}
                  onPress={() => {
                    if (biome.playable) {
                      setActiveRegion(biome.id === "sleep-valley" ? "sleep-valley" : "healthclues-realm");
                      setMode("exploration");
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      } catch {}
                    } else {
                      setActionSuccessMsg(`${biome.nameVi} đang được phát triển, hãy khám phá Vương Quốc trước!`);
                      try {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      } catch {}
                    }
                  }}
                >
                  <View
                    style={[
                      styles.overworldPinDot,
                      { borderColor: biome.color },
                      biome.playable && styles.overworldPinDotGlow,
                    ]}
                  />
                  <View style={styles.overworldPinPlaque}>
                    <Text style={styles.overworldPinText}>{biome.nameVi}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ImageBackground>
          </View>

          <View style={styles.biomesList}>
            {OVERWORLD_8_BIOMES.map((biome) => (
              <TouchableOpacity
                key={biome.id}
                style={[
                  styles.biomeCard,
                  biome.playable ? styles.biomeCardPlayable : styles.biomeCardLocked,
                ]}
                onPress={() => {
                  if (biome.playable) {
                    setActiveRegion(biome.id === "sleep-valley" ? "sleep-valley" : "healthclues-realm");
                    setMode("exploration");
                  }
                }}
              >
                <View style={[styles.biomeStatusIndicator, { backgroundColor: biome.color }]} />
                <View style={styles.biomeCardInfo}>
                  <Text style={styles.biomeCardName}>{biome.nameVi}</Text>
                  <Text style={styles.biomeCardDesc}>
                    {biome.playable ? "Đang mở khám phá · Trại thám hiểm" : "Tạm khóa nâng cấp"}
                  </Text>
                </View>
                {biome.playable ? (
                  <View style={styles.enterBadge}>
                    <Text style={styles.enterBadgeText}>Vào Vùng Đất</Text>
                    <ArrowRight size={12} color="#061814" />
                  </View>
                ) : (
                  <Lock size={14} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Floating Toast Feedback when modal sheet is not open (e.g. locked biome click or action confirmation) */}
      {actionSuccessMsg && !selectedLandmark && (
        <View style={styles.floatingWorldToastWrap} pointerEvents="none">
          <View style={styles.floatingWorldToast} accessibilityLabel="world-toast-banner">
            <Info size={14} color={colors.goldLight} />
            <Text style={styles.floatingWorldToastText} numberOfLines={2}>
              {actionSuccessMsg}
            </Text>
          </View>
        </View>
      )}

      {/* 6. LANDMARK INTERACTION MODAL SHEET */}
      <Modal
        visible={!!selectedLandmark}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedLandmark(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetContainer}>
            {selectedLandmark && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetTitleGroup}>
                    <View style={styles.sheetIconCircle}>
                      <selectedLandmark.IconComponent size={20} color={colors.goldLight} />
                    </View>
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.sheetTitle}>{selectedLandmark.titleVi}</Text>
                      <Text style={styles.sheetRole}>{selectedLandmark.roleVi}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Đóng chi tiết"
                    onPress={() => setSelectedLandmark(null)}
                  >
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* NPC Dialogue Box (if NPC exists) */}
                {selectedLandmark.npcAvatar && (
                  <View style={styles.npcSpeechBox}>
                    <Image
                      source={selectedLandmark.npcAvatar}
                      style={styles.npcPortrait}
                      contentFit="contain"
                    />
                    <View style={styles.speechBubble}>
                      <Text style={styles.speechNpcName}>
                        {selectedLandmark.npcName}
                      </Text>
                      <Text style={styles.speechQuote}>
                        "{selectedLandmark.greetingVi}"
                      </Text>
                    </View>
                  </View>
                )}

                {/* Neighborhood Map & Home Entrance for boss station */}
                {selectedLandmark.id === "boss" && (
                  <View style={styles.neighborhoodBox}>
                    {/* Primary Home Entrance Card */}
                    <View style={styles.myHomeHeroCard}>
                      <View style={styles.myHomeHeroTop}>
                        <View style={styles.myHomeIconRing}>
                          <Home size={26} color="#34d399" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.myHomeBadgeRow}>
                            <Text style={styles.myHomeBadgeText}>⭐ TỔ ẤM CỦA BẠN</Text>
                            <Text style={styles.myHomeOnlineText}>🟢 Đang mở cửa</Text>
                          </View>
                          <Text style={styles.myHomeTitle}>Chalet Gỗ Ấm Áp</Text>
                          <Text style={styles.myHomeSubtitle}>Phong cách Bắc Âu · Cấp 2 · Đầy đủ nội thất</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.enterMyHomeBtn}
                        accessibilityRole="button"
                        accessibilityLabel="enter-my-home-now"
                        onPress={() => {
                          setSelectedLandmark(null);
                          setActiveTalkLandmark(null);
                          router.push("/(game)/home");
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.enterMyHomeBtnText}>Bước Vào Nhà Của Bạn (Home) 🏡</Text>
                        <ArrowRight size={16} color="#042f2e" />
                      </TouchableOpacity>
                    </View>

                    {/* Section Header: Neighborhood Map */}
                    <View style={styles.neighborhoodHeaderRow}>
                      <Users size={16} color="#34d399" />
                      <Text style={styles.neighborhoodHeading}>BẢN ĐỒ KHU PHỐ CÁC CƯ DÂN (MINH HỌA)</Text>
                    </View>
                    <Text style={styles.neighborhoodSubtext}>
                      Khám phá ngôi nhà của những người bạn cùng rèn luyện lối sống lành mạnh trong làng:
                    </Text>

                    {/* Neighborhood Cottages List */}
                    <View style={styles.neighborhoodGrid}>
                      {NEIGHBORHOOD_HOUSES.map((house) => {
                        const isSelf = house.isSelf;
                        const spriteSource = AVATAR_SPRITES[house.avatarKey] || AVATAR_SPRITES["chibi-anna"];
                        const isVisited = visitedHouses[house.id];
                        return (
                          <View
                            key={house.id}
                            style={[
                              styles.neighborCard,
                              isSelf && styles.neighborCardSelf,
                            ]}
                          >
                            <View style={styles.neighborCardHeader}>
                              <Image source={spriteSource} style={styles.neighborAvatar} contentFit="contain" />
                              <View style={{ flex: 1 }}>
                                <View style={styles.neighborNameRow}>
                                  <Text style={styles.neighborOwnerName}>{house.ownerName}</Text>
                                  {isSelf ? (
                                    <View style={styles.selfBadge}><Text style={styles.selfBadgeText}>Nhà của bạn</Text></View>
                                  ) : (
                                    <View style={styles.streakBadge}><Text style={styles.streakBadgeText}>🔥 {house.streakDays} ngày</Text></View>
                                  )}
                                </View>
                                <Text style={styles.neighborHouseName}>{house.houseName}</Text>
                                <Text style={styles.neighborHouseStyle}>{house.houseStyle}</Text>
                              </View>
                            </View>

                            <View style={styles.neighborQuoteBox}>
                              <Text style={styles.neighborQuoteText}>"{house.welcomeQuote}"</Text>
                            </View>

                            <View style={styles.neighborHabitsRow}>
                              {house.habits.map((h, i) => (
                                <View key={i} style={styles.habitTagPill}>
                                  <Text style={styles.habitTagText}>✓ {h}</Text>
                                </View>
                              ))}
                            </View>

                            <View style={styles.neighborCardActions}>
                              {isSelf ? (
                                <TouchableOpacity
                                  style={styles.neighborEnterBtn}
                                  accessibilityRole="button"
                                  accessibilityLabel="enter-home-btn"
                                  onPress={() => {
                                    setSelectedLandmark(null);
                                    setActiveTalkLandmark(null);
                                    router.push("/(game)/home");
                                  }}
                                  activeOpacity={0.85}
                                >
                                  <Text style={styles.neighborEnterBtnText}>Vào Nhà Ngay 🏡</Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={[
                                    styles.neighborVisitBtn,
                                    isVisited && styles.neighborVisitBtnSent,
                                  ]}
                                  accessibilityRole="button"
                                  accessibilityLabel={`visit-neighbor-${house.id}`}
                                  onPress={() => handleSendNeighborHeart(house)}
                                  activeOpacity={0.85}
                                >
                                  <Heart
                                    size={14}
                                    color={isVisited ? "#f43f5e" : "#fda4af"}
                                    fill={isVisited ? "#f43f5e" : "transparent"}
                                  />
                                  <Text style={styles.neighborVisitBtnText}>
                                    {isVisited ? "Đã Gửi Lời Chúc ❤️" : "Ghé Thăm & Gửi Tim (+5 EXP)"}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Educational Evidence Details */}
                <View style={styles.sheetBodyBox}>
                  <View style={styles.evidenceTitleRow}>
                    <Info size={14} color={colors.emeraldLight} />
                    <Text style={styles.evidenceHeading}>Bằng chứng & Hướng dẫn:</Text>
                  </View>
                  <Text style={styles.sheetDetailsText}>
                    {selectedLandmark.detailsVi}
                  </Text>
                </View>

                {/* Feedback Toast */}
                {actionSuccessMsg && (
                  <View style={styles.feedbackBanner}>
                    <CheckCircle2 size={16} color={colors.emeraldLight} />
                    <Text style={styles.feedbackText}>{actionSuccessMsg}</Text>
                  </View>
                )}

                {/* Action CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.sheetActionBtn,
                    selectedLandmark.id === "boss" && { backgroundColor: "#10b981" },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={selectedLandmark.actionTextVi}
                  onPress={() => {
                    if (selectedLandmark.id === "boss") {
                      setSelectedLandmark(null);
                      setActiveTalkLandmark(null);
                      router.push("/(game)/home");
                    } else {
                      handleActionClick(selectedLandmark);
                    }
                  }}
                  activeOpacity={0.85}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[
                    styles.sheetActionBtnText,
                    selectedLandmark.id === "boss" && { color: "#ffffff", fontWeight: "700" }
                  ]}>
                    {selectedLandmark.actionTextVi}
                  </Text>
                  <ArrowRight size={16} color={selectedLandmark.id === "boss" ? "#ffffff" : "#042f2e"} />
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 4-7-8 RELAXED BREATHING MEDITATION MODAL */}
      <Modal
        visible={breathingOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBreathingOpen(false)}
      >
        <View style={styles.modalBackdropDark}>
          <View style={styles.breathingCard}>
            <View style={styles.breathingHeader}>
              <Text style={styles.breathingTitle}>Thực Hành Thở 4-7-8</Text>
              <TouchableOpacity
                onPress={() => setBreathingOpen(false)}
                style={styles.breathingCloseBtn}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.breathingVisualContainer}>
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    transform: [{ scale: breathAnim }],
                  },
                ]}
              />
              <View style={styles.breathingCenterInfo}>
                <Text style={styles.breathingPhaseText}>
                  {breathingPhase === "inhale"
                    ? "Hít vào chậm (4s)"
                    : breathingPhase === "hold"
                    ? "Giữ hơi (7s)"
                    : "Thở ra êm (8s)"}
                </Text>
                <Text style={styles.breathingSecondsNum}>{breathingSeconds}s</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.breathingFinishBtn}
              accessibilityRole="button"
              onPress={() => {
                setBreathingOpen(false);
                setExpGain({ visible: true, amount: 10 });
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch {}
              }}
            >
              <Text style={styles.breathingFinishText}>Hoàn Thành Bài Tập (+10 EXP)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ONLINE PEER INTERACTION MODAL */}
      <Modal
        visible={!!selectedPeer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPeer(null)}
      >
        <TouchableOpacity
          style={styles.peerModalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedPeer(null)}
        >
          <View style={styles.peerCard} onStartShouldSetResponder={() => true}>
            <View style={styles.peerHeaderRow}>
              <View style={styles.peerHeaderInfo}>
                <Image
                  source={
                    selectedPeer
                      ? AVATAR_SPRITES[selectedPeer.avatarKey] || AVATAR_SPRITES["chibi-leo"]
                      : AVATAR_SPRITES["chibi-leo"]
                  }
                  style={styles.peerAvatarThumb}
                  contentFit="contain"
                />
                <View>
                  <Text style={styles.peerTitle}>{selectedPeer?.nickname}</Text>
                  <Text style={styles.peerSub}>🟢 Bạn đồng hành online</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPeer(null)}
                style={styles.breathingCloseBtn}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.peerActionBtn}
              onPress={() => {
                if (selectedPeer) {
                  sendGreeting(`👋 Chào ${selectedPeer.nickname} nhé!`);
                  setActionSuccessMsg(`Đã gửi lời chào tới ${selectedPeer.nickname}!`);
                }
                setSelectedPeer(null);
              }}
            >
              <Hand size={15} color="#f59e0b" />
              <Text style={styles.peerActionText}>Vẫy tay chào bạn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.peerActionBtn}
              onPress={() => {
                if (selectedPeer) {
                  sendGreeting(`✨ Cổ vũ ${selectedPeer.nickname} sống khỏe nhé! 🎉`);
                  setActionSuccessMsg(`Đã gửi lời cổ vũ tới ${selectedPeer.nickname}!`);
                }
                setSelectedPeer(null);
              }}
            >
              <Sparkles size={15} color="#34d399" />
              <Text style={styles.peerActionText}>Cổ vũ cùng sống khỏe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.peerActionBtn}
              onPress={() => {
                if (selectedPeer) {
                  sendGreeting(`🍵 Mời ${selectedPeer.nickname} tách trà ấm!`);
                  setActionSuccessMsg(`Đã mời ${selectedPeer.nickname} một tách trà!`);
                }
                setSelectedPeer(null);
              }}
            >
              <Coffee size={15} color="#fcd34d" />
              <Text style={styles.peerActionText}>Mời một tách trà thảo mộc</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* EXP GAIN ANIMATION FLOATING BADGE */}
      <ExpGain
        amount={expGain.amount}
        visible={expGain.visible}
        onComplete={() => setExpGain({ visible: false, amount: 0 })}
      />

      {/* REWARD REVEAL GLOWING MODAL */}
      <RewardReveal
        visible={rewardReveal.visible}
        title={rewardReveal.item.name || "Chìa Khóa Cổ Vật Cổ Xưa"}
        subtitle="Chiến Thắng Vệ Binh Thói Quen"
        description={rewardReveal.item.description || "Chúc mừng bạn đã trả lời chính xác câu đố y khoa! Nhận Chìa Khóa Cổ Vật để mở rộng lưu trữ thành tựu."}
        iconName={rewardReveal.item.icon || "boss:key"}
        rarity="Rare"
        onClaim={() => setRewardReveal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  floatingToolbarOverlay: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    zIndex: 38,
  },
  floatingSceneControlsRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  dioramaHudBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6, 22, 18, 0.84)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 8.5,
    paddingVertical: 4.5,
    borderRadius: radius.full,
  },
  dioramaHudBtnActive: {
    backgroundColor: colors.emeraldLight,
    borderColor: "#a7f3d0",
  },
  dioramaHudText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dioramaHudTextActive: {
    color: "#042f2e",
    fontWeight: "800",
  },
  topToolbar: {
    backgroundColor: "rgba(10, 24, 21, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
  },
  topToolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  regionPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(6, 22, 18, 0.84)",
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  regionPillBtnActive: {
    backgroundColor: "rgba(6, 36, 26, 0.92)",
    borderColor: colors.emeraldLight,
  },
  regionPillBtnText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 10.5,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  regionPillBtnTextActive: {
    color: colors.emeraldLight,
    fontWeight: "700",
  },
  toolIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(6, 22, 18, 0.84)",
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  toolIconBtnActive: {
    backgroundColor: colors.emeraldLight,
    borderColor: colors.emeraldLight,
  },
  toolBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  overworldToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(6, 22, 18, 0.86)",
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
  },
  overworldToggleBtnActive: {
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    borderColor: colors.goldLight,
  },
  overworldToggleText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.goldLight,
  },
  overworldToggleTextActive: {
    color: "#ffffff",
  },
  overviewScrollContent: {
    padding: spacing.sm,
    paddingTop: 42,
    paddingBottom: 32,
  },
  overviewPinDot: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: "rgba(6, 26, 21, 0.94)",
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
  },
  overviewPlayerDot: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.emeraldLight,
    borderWidth: 2,
    borderColor: "#ffffff",
    zIndex: 20,
  },
  overviewStationsSection: {
    marginTop: spacing.md,
  },
  overviewStationsHeading: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  overviewStationsGrid: {
    gap: 6,
  },
  overviewStationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(11, 28, 23, 0.9)",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  overviewStationIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewStationTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  overviewStationRole: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  gameViewport: {
    flex: 1,
    backgroundColor: "#05110e",
    position: "relative",
  },
  vScroll: {
    flex: 1,
  },
  vScrollContent: {
    flexGrow: 1,
    ...(Platform.OS === "web" ? { width: "100%" as any } : {}),
    backgroundColor: "transparent",
  },
  hScroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  hScrollContent: {
    flexGrow: 1,
    backgroundColor: "transparent",
  },
  mapTouchSurface: {
    width: 1600,
    height: 900,
    position: "relative",
  },
  dioramaStageWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#030a07",
  },
  parallaxBackgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: "hidden",
    zIndex: 0,
  },
  parallaxBackgroundImage: {
    width: 2200,
    height: 480,
    position: "absolute",
    top: -20,
    left: -150,
  },
  horizonMistOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "rgba(3, 10, 7, 0.45)",
  },
  dioramaGroundTilt: {
    transform: [
      { perspective: 950 as any },
      { rotateX: "18deg" },
      { scale: 1.05 },
    ],
  },
  flatGround2D: {
    transform: [
      { perspective: 950 as any },
      { rotateX: "0deg" },
      { scale: 1.0 },
    ],
  },
  blueprintCanvas: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  gameVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  horizonDepthHaze: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 210,
    zIndex: 140,
  },
  diagonalSunbeam: {
    position: "absolute",
    top: -120,
    right: 120,
    width: 340,
    height: 820,
    backgroundColor: "rgba(254, 243, 199, 0.45)",
    transform: [{ rotate: "24deg" }],
    zIndex: 150,
  },
  fountainFxAnchor: {
    position: "absolute",
    width: 172,
    height: 172,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 195,
  },
  fountainRippleRing: {
    position: "absolute",
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 2,
    borderColor: "rgba(125, 211, 252, 0.78)",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  fountainCrystalCoreGlow: {
    position: "absolute",
    top: 26,
    width: 44,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(125, 211, 252, 0.25)",
  },
  targetMarkerPin: {
    position: "absolute",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
  },
  targetPulseRing: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.emeraldLight,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  landmarkAnchor: {
    position: "absolute",
    width: 120,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  npcActorWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  groundShadowOuter: {
    position: "absolute",
    bottom: 14,
    width: 42,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.24)",
  },
  groundShadow: {
    position: "absolute",
    bottom: -2,
    width: 28,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  npcSprite: {
    width: 44,
    height: 52,
  },
  npcNameTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(6, 20, 16, 0.95)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.5)",
    marginTop: 2,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.emeraldLight,
  },
  npcNameText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    fontWeight: "800",
    color: colors.textPrimary,
    ...(Platform.OS === "web" ? { whiteSpace: "nowrap" as any } : {}),
  },
  buildingSealWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  buildingSealRing: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "rgba(6, 26, 21, 0.95)",
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  buildingNamePill: {
    backgroundColor: "rgba(6, 24, 19, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.55)",
    marginTop: 3,
    minWidth: 70,
    maxWidth: 160,
    alignItems: "center",
  },
  buildingNameText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: "#fef08a",
    textAlign: "center",
    ...(Platform.OS === "web" ? { whiteSpace: "nowrap" as any } : {}),
  },
  playerActor: {
    position: "absolute",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  playerShadowOuter: {
    position: "absolute",
    width: 38,
    height: 11,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerShadow: {
    width: 24,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  playerSprite: {
    width: 44,
    height: 44,
  },
  playerNameTag: {
    backgroundColor: colors.emeraldLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginTop: -2,
  },
  playerNameText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 10,
    fontWeight: "900",
    color: "#051f18",
  },
  petActor: {
    position: "absolute",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 21,
  },
  petGroundShadow: {
    position: "absolute",
    width: 20,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
  },
  petSprite: {
    width: 24,
    height: 24,
  },
  petNameTag: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
    marginTop: -1,
  },
  petNameText: {
    fontFamily: fonts.uiBold,
    fontSize: 9.5,
    fontWeight: "800",
    color: "#fef08a",
  },
  activeTalkWrap: {
    position: "absolute",
    bottom: 6,
    left: 8,
    right: 8,
    alignItems: "center",
    zIndex: 40,
  },
  activeTalkFloatingHud: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "rgba(6, 24, 19, 0.9)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.55)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  talkAvatarImg: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.emeraldLight,
  },
  talkBuildingIconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  talkContentCol: {
    flex: 1,
    minWidth: 0,
  },
  talkNpcNameText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  talkRoleSnippet: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 10.5,
    fontWeight: "600",
    color: colors.emeraldLight,
    marginTop: 1,
  },
  talkActionBtn: {
    backgroundColor: colors.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  talkActionBtnText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    fontWeight: "800",
    color: "#061814",
  },
  talkDismissBtn: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  overworldScroll: {
    flex: 1,
  },
  overworldScrollContent: {
    padding: spacing.md,
  },
  overworldHeaderBox: {
    marginBottom: spacing.md,
  },
  overworldHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textGold,
  },
  overworldHeaderSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overworldMapCard: {
    height: 220,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: spacing.md,
  },
  overworldMapArt: {
    width: "100%",
    height: "100%",
  },
  overworldPin: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  overworldPinLocked: {
    opacity: 0.55,
  },
  overworldPinDot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 2,
  },
  overworldPinDotGlow: {
    backgroundColor: colors.emeraldLight,
  },
  overworldPinPlaque: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginTop: 2,
  },
  overworldPinText: {
    fontFamily: fonts.uiBold,
    fontSize: 9.5,
    fontWeight: "700",
    color: "#ffffff",
  },
  biomesList: {
    gap: spacing.xs,
  },
  biomeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 31, 26, 0.75)",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: spacing.sm,
  },
  biomeCardPlayable: {
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  biomeCardLocked: {
    opacity: 0.6,
  },
  biomeStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  biomeCardInfo: {
    flex: 1,
  },
  biomeCardName: {
    fontFamily: fonts.uiBold,
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  biomeCardDesc: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  enterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.emeraldLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.xs,
    gap: 3,
  },
  enterBadgeText: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 11,
    fontWeight: "800",
    color: "#061814",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalBackdropDark: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  sheetContainer: {
    backgroundColor: "rgba(8, 28, 23, 0.98)",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    maxHeight: "90%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sheetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  sheetRole: {
    fontSize: 11,
    color: colors.emeraldLight,
    marginTop: 1,
  },
  sheetCloseBtn: {
    padding: 6,
  },
  npcSpeechBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.emeraldLight,
  },
  npcPortrait: {
    width: 44,
    height: 52,
  },
  speechBubble: {
    flex: 1,
    justifyContent: "center",
  },
  speechNpcName: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.emeraldLight,
    marginBottom: 2,
  },
  speechQuote: {
    fontSize: 11,
    color: colors.textPrimary,
    fontStyle: "italic",
    lineHeight: 16,
  },
  sheetBodyBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  evidenceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  evidenceHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.emeraldLight,
  },
  sheetDetailsText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.emeraldLight,
    flex: 1,
    lineHeight: 15,
  },
  sheetActionBtn: {
    backgroundColor: colors.emeraldLight,
    paddingVertical: 11,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  sheetActionBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#061814",
  },
  breathingCard: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "92%",
    backgroundColor: "rgba(8, 28, 23, 0.98)",
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    gap: spacing.md,
  },
  floatingWorldToastWrap: {
    position: "absolute",
    top: 132,
    left: 14,
    right: 14,
    alignItems: "center",
    zIndex: 60,
  },
  floatingWorldToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 460,
    backgroundColor: "rgba(6, 26, 20, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.5)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingWorldToastText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.goldLight,
    flexShrink: 1,
  },
  quizChallengeBox: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.32)",
    gap: 6,
  },
  neighborhoodBox: {
    gap: spacing.sm,
    marginTop: 4,
  },
  myHomeHeroCard: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.45)",
    gap: spacing.sm,
  },
  myHomeHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  myHomeIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  myHomeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  myHomeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.goldLight,
    letterSpacing: 0.5,
  },
  myHomeOnlineText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6ee7b7",
  },
  myHomeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  myHomeSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  enterMyHomeBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10b981",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  enterMyHomeBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#022c22",
  },
  neighborhoodHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  neighborhoodHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#34d399",
    letterSpacing: 0.5,
  },
  neighborhoodSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  neighborhoodGrid: {
    gap: spacing.sm,
    marginTop: 4,
  },
  neighborCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    gap: 6,
  },
  neighborCardSelf: {
    backgroundColor: "rgba(16, 185, 129, 0.07)",
    borderColor: "rgba(52, 211, 153, 0.35)",
  },
  neighborCardHeader: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  neighborAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  neighborNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  neighborOwnerName: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  selfBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  selfBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.goldLight,
  },
  streakBadge: {
    backgroundColor: "rgba(234, 88, 12, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  streakBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#fdba74",
  },
  neighborHouseName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6ee7b7",
    marginTop: 1,
  },
  neighborHouseStyle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  neighborQuoteBox: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  neighborQuoteText: {
    fontSize: 10.5,
    fontStyle: "italic",
    color: "#e2e8f0",
    lineHeight: 14,
  },
  neighborHabitsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  habitTagPill: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  habitTagText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#a7f3d0",
  },
  neighborCardActions: {
    marginTop: 2,
  },
  neighborEnterBtn: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderWidth: 1,
    borderColor: "#34d399",
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  neighborEnterBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#34d399",
  },
  neighborVisitBtn: {
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.25)",
    paddingVertical: 6,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  neighborVisitBtnSent: {
    backgroundColor: "rgba(244, 63, 94, 0.18)",
    borderColor: "rgba(244, 63, 94, 0.45)",
  },
  neighborVisitBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fda4af",
  },
  quizQuestionText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.textGold,
    lineHeight: 16,
  },
  quizOptionBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quizOptionBtnCorrect: {
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    borderColor: colors.emeraldLight,
  },
  quizOptionBtnWrong: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderColor: colors.rose,
  },
  quizOptionText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 15,
  },
  breathingHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breathingTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textGold,
  },
  breathingCloseBtn: {
    padding: 4,
  },
  breathingVisualContainer: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 2,
    borderColor: colors.emeraldLight,
  },
  breathingCenterInfo: {
    position: "absolute",
    alignItems: "center",
  },
  breathingPhaseText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  breathingSecondsNum: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.emeraldLight,
    marginTop: 2,
  },
  breathingFinishBtn: {
    backgroundColor: colors.emeraldLight,
    width: "100%",
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: "center",
  },
  breathingFinishText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#061814",
  },
  remotePlayerActor: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  remotePlayerShadow: {
    position: "absolute",
    bottom: -3,
    width: 24,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  remotePlayerSprite: {
    width: 38,
    height: 38,
  },
  remotePlayerNameTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 24, 19, 0.92)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.55)",
    marginTop: -2,
    gap: 4,
  },
  onlinePulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  remotePlayerNameText: {
    fontFamily: fonts.uiBold,
    fontSize: 9.5,
    fontWeight: "700",
    color: "#ffffff",
    ...(Platform.OS === "web" ? { whiteSpace: "nowrap" as any } : {}),
  },
  visitorTagPill: {
    backgroundColor: "rgba(10, 31, 26, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.48)",
    marginTop: -2,
  },
  visitorTagText: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    fontWeight: "700",
    color: "#fef08a",
    ...(Platform.OS === "web" ? { whiteSpace: "nowrap" as any } : {}),
  },
  visitorSpeechBubble: {
    position: "absolute",
    bottom: 50, // Anchored 50px above foot/bottom anchor -> floats cleanly above head!
    alignSelf: "center",
    backgroundColor: "rgba(6, 24, 19, 0.96)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.emeraldLight,
    maxWidth: 180,
    minWidth: 85,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 150,
  },
  speechBubbleTail: {
    position: "absolute",
    bottom: -5,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.emeraldLight,
  },
  visitorSpeechText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 9.5,
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 13,
  },
  mySpeechBubble: {
    position: "absolute",
    bottom: 56, // Anchored 56px above foot/bottom anchor -> floats cleanly above player head!
    alignSelf: "center",
    backgroundColor: "rgba(6, 24, 19, 0.96)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.goldLight,
    maxWidth: 195,
    minWidth: 90,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 9,
    zIndex: 160,
  },
  mySpeechBubbleTail: {
    position: "absolute",
    bottom: -5,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.goldLight,
  },
  mySpeechText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: "#fef08a",
    textAlign: "center",
  },
  peerModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  peerCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(8, 28, 22, 0.98)",
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.emeraldLight,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  peerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  peerHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  peerAvatarThumb: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.emeraldLight,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  peerTitle: {
    fontFamily: fonts.uiExtraBold,
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  peerSub: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    color: colors.emeraldLight,
  },
  peerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
  },
  peerActionText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: "#ffffff",
  },
});
