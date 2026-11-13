import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "@/services/api";

export type RoomId = "scene_interior_wide" | "scene_bedroom";
export type DayNightMode = "auto" | "day" | "night";

export interface WellnessHomeItem {
  id: string;
  room: RoomId;
  name_vi: string;
  name_en: string;
  tag_vi: string;
  tag_en: string;
  desc_vi: string;
  desc_en: string;
  asset: any;
  is_starter: boolean;
  z_index: number;
  corners: {
    tl: [number, number];
    tr: [number, number];
    br: [number, number];
    bl: [number, number];
  };
}

export interface ChibiCompanionConfig {
  id: string;
  name: string;
  tag: string;
  tagEn: string;
  normalSprite: any;
  waveSprite: any;
  speed: number;
  quotes: {
    flowers: string[];
    fireplace: string[];
    scenery: string[];
    general: string[];
    greeting: string;
  };
}

export interface WellnessHomeState {
  unlockedItems: string[];
  activeRoom: RoomId;
  hasClaimedWelcome: boolean;
  lastRewardClaimedAt: string | null;
  dayNightOverride: "day" | "night" | null;
  activeCompanionId: string;
}

const HOME_STORAGE_KEY = "healthclues-home-state-v1";

export const ROOM_BACKGROUNDS: Record<RoomId, { day: any; night: any; nameVi: string; nameEn: string }> = {
  scene_interior_wide: {
    day: require("../../assets/game/home/scenes/scene_interior_wide.webp"),
    night: require("../../assets/game/home/scenes/scene_interior_wide_night.webp"),
    nameVi: "Phòng Khách Dãy Alps",
    nameEn: "Alps Living Room",
  },
  scene_bedroom: {
    day: require("../../assets/game/home/scenes/scene_bedroom.webp"),
    night: require("../../assets/game/home/scenes/scene_bedroom_night.webp"),
    nameVi: "Phòng Ngủ Tĩnh Dưỡng",
    nameEn: "Restorative Bedroom",
  },
};

export const CHIBI_COMPANIONS: Record<string, ChibiCompanionConfig> = {
  mia: {
    id: "mia",
    name: "Mia",
    tag: "Áo kem dịu dàng",
    tagEn: "Gentle Cream",
    normalSprite: require("../../assets/game/characters/chibi-mia.png"),
    waveSprite: require("../../assets/game/characters/chibi-mia.png"),
    speed: 3.2,
    quotes: {
      flowers: [
        "Mấy chậu hoa này xinh quá! Hương thơm làm tâm trí mình dịu hẳn lại.",
        "Cây cối vùng núi tuyết có sức sống thật kỳ diệu!",
      ],
      fireplace: [
        "Lò sưởi ấm quá đi! Tiếng củi thông tí tách nghe bình yên thật.",
        "Ngồi gần lò sưởi nhâm nhi trà ấm thì không còn gì bằng!",
      ],
      scenery: [
        "Khung cảnh dãy Alps tuyết trắng hùng vĩ nhìn từ đây thật ngoạn mục!",
        "Mặt hồ phẳng lặng và bầu trời trong vắt, ngắm hoài không chán.",
      ],
      general: [
        "Căn nhà Thụy Sĩ này thoáng đãng và dễ chịu quá!",
        "Hôm nay bạn đã uống đủ nước và vận động nhẹ chưa nè?",
        "Không gian nghỉ ngơi yên tĩnh giúp cơ thể phục hồi năng lượng rất nhanh!",
      ],
      greeting: "Chào bạn! Mình là Mia, rất vui được đồng hành cùng bạn trong ngôi nhà này!",
    },
  },
  anna: {
    id: "anna",
    name: "Anna",
    tag: "Áo xanh vui tươi",
    tagEn: "Cheerful Teal",
    normalSprite: require("../../assets/game/characters/chibi-anna.png"),
    waveSprite: require("../../assets/game/characters/chibi-anna.png"),
    speed: 4.0,
    quotes: {
      flowers: [
        "Hoa nở rực rỡ quá! Mỗi ngày nhìn hoa là thấy tràn đầy năng lượng!",
        "Góc xanh này tươi mát thật, hít một hơi thật sâu nào!",
      ],
      fireplace: [
        "Lò sưởi ấm sực luôn, mùa đông Thụy Sĩ mà có lò sưởi này là tuyệt nhất!",
        "Lửa bập bùng nhìn mê ghê, cảm giác như đang cắm trại trong nhà vậy!",
      ],
      scenery: [
        "Woa, tuyết trên đỉnh Matterhorn lấp lánh như kim cương vậy!",
        "Đón gió núi Alps sảng khoái cực kỳ!",
      ],
      general: [
        "Căn biệt thự này xịn ghê! Đi dạo một vòng thấy yêu đời hẳn!",
        "Mục tiêu sức khỏe hôm nay của bạn hoàn thành đến đâu rồi?",
        "Tập thể dục một chút rồi ngắm cảnh tuyết rơi thôi nào!",
      ],
      greeting: "Hế lô! Anna đây! Cùng mình khám phá căn biệt thự nghỉ dưỡng này nhé!",
    },
  },
  leo: {
    id: "leo",
    name: "Leo",
    tag: "Áo xanh thám hiểm",
    tagEn: "Adventurer Blue",
    normalSprite: require("../../assets/game/characters/chibi-leo.png"),
    waveSprite: require("../../assets/game/characters/chibi-leo.png"),
    speed: 3.8,
    quotes: {
      flowers: [
        "Thực vật bản địa dãy Alps có khả năng chịu lạnh cực kỳ bền bỉ!",
        "Những chậu cây này giúp không gian phòng thêm trong lành thư thái.",
      ],
      fireplace: [
        "Gỗ sồi cháy rất đượm, nhiệt lượng lan tỏa khắp sàn nhà gỗ.",
        "Một góc lò sưởi lý tưởng để đọc sách và thư giãn buổi tối.",
      ],
      scenery: [
        "Không khí núi cao trong lành giúp nhịp thở thật khoan khoái.",
        "Tầm nhìn Panorama bao quát trọn vẹn cả thung lũng tuyết!",
      ],
      general: [
        "Thiết kế phong cách Alpine tối giản mà cực kỳ khoa học.",
        "Mỗi ngày giữ vững một thói quen nhỏ sẽ tạo nên thay đổi lớn!",
        "Nghỉ ngơi chất lượng cũng là một phần quan trọng của hành trình.",
      ],
      greeting: "Chào bạn, mình là Leo! Hãy biến nơi này thành trạm tiếp sức cho hành trình nhé!",
    },
  },
  ben: {
    id: "ben",
    name: "Ben",
    tag: "Áo navy ấm áp",
    tagEn: "Warm Navy",
    normalSprite: require("../../assets/game/characters/chibi-ben.png"),
    waveSprite: require("../../assets/game/characters/chibi-ben.png"),
    speed: 3.0,
    quotes: {
      flowers: [
        "Mùi hương cỏ hoa thoang thoảng giúp giải tỏa căng thẳng rất tốt.",
        "Mỗi mầm xanh đều nhắc nhở chúng ta chăm sóc bản thân mỗi ngày.",
      ],
      fireplace: [
        "Ấm áp quá... ngồi bên lò sưởi thế này dễ chợp mắt một giấc thật ngon.",
        "Nhiệt độ ấm áp rất thích hợp để thư giãn cơ bắp sau một ngày dài.",
      ],
      scenery: [
        "Mặt hồ tuyết phẳng lặng như gương, nhìn vào thấy lòng tĩnh lặng lạ kỳ.",
        "Thiên nhiên bao la luôn giúp chúng ta tìm lại sự cân bằng.",
      ],
      general: [
        "Đừng quên thả lỏng vai và thở đều nhé bạn tôi ơi.",
        "Sức khỏe tốt bắt đầu từ một tâm trí bình an và giấc ngủ sâu.",
        "Ngôi nhà này ấm cúng như một nơi trú ẩn bình yên vậy.",
      ],
      greeting: "Chào bạn! Mình là Ben. Cứ thư thả nghỉ ngơi, đừng vội vã nhé!",
    },
  },
  lily: {
    id: "lily",
    name: "Lily",
    tag: "Áo tím dịu ngọt",
    tagEn: "Sweet Purple",
    normalSprite: require("../../assets/game/characters/chibi-lily.png"),
    waveSprite: require("../../assets/game/characters/chibi-lily.png"),
    speed: 3.5,
    quotes: {
      flowers: [
        "Mấy bông hoa dễ thương xỉu! Gửi ngàn trái tim cho góc xanh này!",
        "Hoa nở tươi thắm như nụ cười của bạn khi đạt mục tiêu sống khỏe vậy!",
      ],
      fireplace: [
        "Ánh lửa bập bùng ấm áp quá, cảm giác thư thái ngập tràn!",
        "Ngồi ở đây nghe nhạc tuyết rơi thì tuyệt đỉnh!",
      ],
      scenery: [
        "Cảnh đẹp như bước ra từ tranh cổ tích Thụy Sĩ luôn á!",
        "Mây trắng vờn quanh đỉnh núi tuyết bồng bềnh dịu mắt!",
      ],
      general: [
        "Yêu thương bản thân là bước đầu tiên để sống khỏe mỗi ngày!",
        "Bạn đã làm rất tốt hôm nay rồi, nhớ tự thưởng cho mình nhé!",
        "Một không gian nghỉ ngơi xinh đẹp sẽ mang lại nguồn năng lượng tích cực!",
      ],
      greeting: "Hé lô bạn iu! Lily gửi tặng bạn thật nhiều năng lượng ấm áp nhé!",
    },
  },
};

// Exact canonical 10-item blueprint catalog mirrored from Web (/api/healthclues/wellness-home)
export const CANONICAL_HOME_CATALOG: WellnessHomeItem[] = [
  {
    id: "sofa_luxury",
    room: "scene_interior_wide",
    name_vi: "Bộ Sofa Thụy Sĩ Sang Trọng",
    name_en: "Luxury Swiss Chalet Sofa",
    tag_vi: "Phòng Khách",
    tag_en: "Living Room",
    desc_vi: "Món quà tân gia sang trọng, êm ái ngắm toàn cảnh tuyết trắng dãy Alps.",
    desc_en: "A luxurious welcoming gift, soft Italian leather overlooking snowy Alps peaks.",
    asset: require("../../assets/game/home/items/sofa_luxury.png"),
    is_starter: true,
    z_index: 734,
    corners: {
      tl: [24.31, 63.8],
      tr: [62.04, 63.8],
      br: [62.31, 94.18],
      bl: [24.31, 93.26],
    },
  },
  {
    id: "piano_grand",
    room: "scene_interior_wide",
    name_vi: "Đàn Grand Piano Cổ Điển",
    name_en: "Classic Grand Piano",
    tag_vi: "Phòng Khách",
    tag_en: "Living Room",
    desc_vi: "Đàn dương cầm gỗ bóng bẩy, tấu lên những bản nhạc tuyết rơi êm dịu.",
    desc_en: "Polished concert grand piano playing peaceful winter melodies.",
    asset: require("../../assets/game/home/items/piano_grand.png"),
    is_starter: false,
    z_index: 908,
    corners: {
      tl: [61.13, 49.79],
      tr: [76.85, 49.79],
      br: [76.85, 74.45],
      bl: [61.13, 74.45],
    },
  },
  {
    id: "painting_fireplace",
    room: "scene_interior_wide",
    name_vi: "Tranh Dãy Alps Lò Sưởi",
    name_en: "Matterhorn Chimney Wall Art",
    tag_vi: "Phòng Khách",
    tag_en: "Living Room",
    desc_vi: "Bức tranh dãy Alps gắn trang nhã trên trụ lò sưởi đá nguyên khối.",
    desc_en: "Masterpiece Alps oil painting aligned on stone fireplace mantle.",
    asset: require("../../assets/game/home/items/painting_fireplace.png"),
    is_starter: false,
    z_index: 906,
    corners: {
      tl: [13.56, 8.63],
      tr: [25.94, 8.63],
      br: [26.03, 36.72],
      bl: [13.56, 33.09],
    },
  },
  {
    id: "table_coffee",
    room: "scene_interior_wide",
    name_vi: "Bàn Trà Gỗ Sồi Thụy Sĩ",
    name_en: "Alpine Oak Coffee Table",
    tag_vi: "Phòng Khách",
    tag_en: "Living Room",
    desc_vi: "Bàn trà mộc mạc phong cách Alpine để thưởng thức trà thảo mộc ấm.",
    desc_en: "Rustic oak coffee table perfect for enjoying warm herbal teas.",
    asset: require("../../assets/game/home/items/table_coffee.png"),
    is_starter: false,
    z_index: 850,
    corners: {
      tl: [36.0, 72.0],
      tr: [52.0, 72.0],
      br: [52.0, 88.0],
      bl: [36.0, 88.0],
    },
  },
  {
    id: "plant_pot_alps",
    room: "scene_interior_wide",
    name_vi: "Chậu Cây Xanh Alpine",
    name_en: "Alpine Evergreen Planter",
    tag_vi: "Phòng Khách",
    tag_en: "Living Room",
    desc_vi: "Chậu cây tạo mảng xanh dịu mắt và không gian sống tươi mới.",
    desc_en: "Evergreen foliage straight from Matterhorn pine trails.",
    asset: require("../../assets/game/home/items/plant_pot_alps.png"),
    is_starter: false,
    z_index: 1001,
    corners: {
      tl: [22.0, 68.0],
      tr: [30.0, 68.0],
      br: [30.0, 84.0],
      bl: [22.0, 84.0],
    },
  },
  {
    id: "luxury_chalet_bed",
    room: "scene_bedroom",
    name_vi: "Giường Ngủ Minimalist Gỗ Sồi",
    name_en: "Minimalist Oak Chalet Bed",
    tag_vi: "Phòng Ngủ",
    tag_en: "Bedroom",
    desc_vi: "Giường ngủ gỗ sồi êm ái tạo không gian nghỉ ngơi sâu và thư thái.",
    desc_en: "Ergonomic natural wooden bed for restorative sleep comfort.",
    asset: require("../../assets/game/home/items/luxury_chalet_bed.png"),
    is_starter: false,
    z_index: 600,
    corners: {
      tl: [25.0, 50.0],
      tr: [75.0, 50.0],
      br: [75.0, 90.0],
      bl: [25.0, 90.0],
    },
  },
  {
    id: "bedside_lamp",
    room: "scene_bedroom",
    name_vi: "Đèn Ngủ Ánh Vàng Ấm Cúng",
    name_en: "Aroma Warm Glow Lamp",
    tag_vi: "Phòng Ngủ",
    tag_en: "Bedroom",
    desc_vi: "Ánh sáng vàng dịu mắt 2700K lý tưởng cho thói quen thư giãn buổi tối.",
    desc_en: "Warm 2700K evening lamp fostering a calm bedtime wind-down routine.",
    asset: require("../../assets/game/home/items/bedside_lamp.png"),
    is_starter: false,
    z_index: 700,
    corners: {
      tl: [22.0, 52.0],
      tr: [30.0, 52.0],
      br: [30.0, 72.0],
      bl: [22.0, 72.0],
    },
  },
  {
    id: "bedroom_rug",
    room: "scene_bedroom",
    name_vi: "Thảm Lông Cừu Thụy Sĩ",
    name_en: "Swiss Fleece Bedroom Rug",
    tag_vi: "Phòng Ngủ",
    tag_en: "Bedroom",
    desc_vi: "Thảm lông mềm mại giữ ấm đôi chân mỗi buổi sáng thức dậy.",
    desc_en: "Plush insulating fleece rug keeping feet warm in mountain mornings.",
    asset: require("../../assets/game/home/items/bedroom_rug.png"),
    is_starter: false,
    z_index: 200,
    corners: {
      tl: [24.0, 68.0],
      tr: [80.0, 68.0],
      br: [80.0, 93.0],
      bl: [24.0, 93.0],
    },
  },
  {
    id: "painting_bedroom",
    room: "scene_bedroom",
    name_vi: "Tranh Núi Alps Ban Mai",
    name_en: "Alpine Sunrise Perspective Canvas",
    tag_vi: "Phòng Ngủ",
    tag_en: "Bedroom",
    desc_vi: "Tranh phong cảnh thiên nhiên thanh bình, tạo cảm giác thư thái.",
    desc_en: "Tranquil sunrise perspective canvas fostering evening calmness.",
    asset: require("../../assets/game/home/items/painting_bedroom.png"),
    is_starter: false,
    z_index: 210,
    corners: {
      tl: [78.98, 27.83],
      tr: [93.28, 21.84],
      br: [94.12, 69.0],
      bl: [78.14, 60.09],
    },
  },
  {
    id: "bedside_armchair",
    room: "scene_bedroom",
    name_vi: "Ghế Bành Thư Giãn Đọc Sách",
    name_en: "Chalet Reading Armchair",
    tag_vi: "Phòng Ngủ",
    tag_en: "Bedroom",
    desc_vi: "Góc đọc sách tĩnh lặng ngắm sao trời bên khung cửa sổ phòng ngủ.",
    desc_en: "Quiet reading nook beside the bedroom window under starlit skies.",
    asset: require("../../assets/game/home/items/bedside_armchair.png"),
    is_starter: false,
    z_index: 550,
    corners: {
      tl: [12.0, 55.0],
      tr: [26.0, 55.0],
      br: [26.0, 80.0],
      bl: [12.0, 80.0],
    },
  },
];

const LIVING_PRIORITY = ["piano_grand", "painting_fireplace", "plant_pot_alps", "table_coffee"];
const BEDROOM_PRIORITY = ["luxury_chalet_bed", "bedside_armchair", "painting_bedroom", "bedside_lamp", "bedroom_rug"];

// Floor + open lakeside balcony walkable polygons (percentage coordinates)
const ROOM_FLOOR_POLYGONS: Record<RoomId, [number, number][]> = {
  scene_interior_wide: [
    [14, 63],
    [41.5, 62.5],
    [42, 56.5],
    [58, 56.5],
    [58.5, 62.5],
    [86, 63],
    [88, 82],
    [12, 82],
  ],
  scene_bedroom: [
    [16, 61.5],
    [74, 61.5],
    [76, 59.5],
    [83, 60.5],
    [84, 80],
    [16, 80],
  ],
};

export function isHomePointWalkable(xPct: number, yPct: number, room: RoomId): boolean {
  const poly = ROOM_FLOOR_POLYGONS[room];
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = yi > yPct !== yj > yPct && xPct < ((xj - xi) * (yPct - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getCompanionDepthScale(yPct: number, room: RoomId): number {
  const yFar = room === "scene_interior_wide" ? 56.5 : 59.5;
  const yNear = room === "scene_interior_wide" ? 82 : 80;
  const t = Math.max(0, Math.min(1, (yPct - yFar) / (yNear - yFar)));
  // Shrinks smoothly into background (~0.48x out on lakeside balcony -> ~1.02x in foreground)
  return Number((0.48 + t * 0.54).toFixed(3));
}

export function clampHomePointToFloor(xPct: number, yPct: number, room: RoomId): { x: number; y: number } {
  if (room === "scene_interior_wide") {
    // Allow stepping through the center open sliding doors onto the lakeside wooden balcony (y: 56.8..62.4)
    if (yPct < 62.5) {
      return {
        x: Number(Math.max(42.5, Math.min(57.5, xPct)).toFixed(1)),
        y: Number(Math.max(56.8, Math.min(62.4, yPct)).toFixed(1)),
      };
    }
    return {
      x: Number(Math.max(16, Math.min(84, xPct)).toFixed(1)),
      y: Number(Math.max(62.5, Math.min(81.5, yPct)).toFixed(1)),
    };
  }

  // Bedroom: panoramic back glass + right glass balcony doorway nook
  if (yPct < 61.5 && xPct >= 68) {
    return {
      x: Number(Math.max(74, Math.min(82, xPct)).toFixed(1)),
      y: Number(Math.max(59.8, Math.min(62.5, yPct)).toFixed(1)),
    };
  }
  return {
    x: Number(Math.max(17, Math.min(83, xPct)).toFixed(1)),
    y: Number(Math.max(61.5, Math.min(80, yPct)).toFixed(1)),
  };
}

export function buildHomeWalkWaypoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
  room: RoomId
): { x: number; y: number }[] {
  if (room === "scene_interior_wide") {
    const doorwayMin = 43.5;
    const doorwayMax = 56.5;
    // Crossing threshold between indoor room (y >= 63) and lakeside balcony (y < 62.5)
    if (from.y >= 63.0 && to.y < 62.5 && (from.x < doorwayMin || from.x > doorwayMax)) {
      const gateX = Number(Math.max(doorwayMin, Math.min(doorwayMax, to.x)).toFixed(1));
      return [{ x: gateX, y: 63.2 }, to];
    }
    if (from.y < 62.5 && to.y >= 63.0 && (to.x < doorwayMin || to.x > doorwayMax)) {
      const gateX = Number(Math.max(doorwayMin, Math.min(doorwayMax, from.x)).toFixed(1));
      return [{ x: gateX, y: 63.2 }, to];
    }
  }
  return [to];
}

export function pickRandomHomeFloorPoint(room: RoomId): { x: number; y: number } {
  const roll = Math.random();
  if (room === "scene_interior_wide") {
    if (roll < 0.36) {
      // Stroll out onto the sunny Alpine lakeside balcony
      return {
        x: Number((43 + Math.random() * 14).toFixed(1)),
        y: Number((57.2 + Math.random() * 3.6).toFixed(1)),
      };
    }
    if (roll < 0.70) {
      // Explore mid-room (near fireplace left or sunroom piano right)
      const leftSide = Math.random() < 0.5;
      return {
        x: Number((leftSide ? 18 + Math.random() * 18 : 62 + Math.random() * 18).toFixed(1)),
        y: Number((65 + Math.random() * 11).toFixed(1)),
      };
    }
    // Stroll in open foreground living area
    return {
      x: Number((22 + Math.random() * 52).toFixed(1)),
      y: Number((76 + Math.random() * 5).toFixed(1)),
    };
  }

  // Bedroom wander (including panoramic glass & right balcony nook)
  if (roll < 0.30) {
    return {
      x: Number((74 + Math.random() * 7).toFixed(1)),
      y: Number((60.2 + Math.random() * 3.8).toFixed(1)),
    };
  }
  return {
    x: Number((18 + Math.random() * 64).toFixed(1)),
    y: Number((62.5 + Math.random() * 16.5).toFixed(1)),
  };
}

const DEFAULT_HOME_STATE: WellnessHomeState = {
  unlockedItems: [],
  activeRoom: "scene_interior_wide",
  hasClaimedWelcome: false,
  lastRewardClaimedAt: null,
  dayNightOverride: null,
  activeCompanionId: "mia",
};

export function useWellnessHome(isAuthenticated: boolean = false) {
  const [homeState, setHomeState] = useState<WellnessHomeState>(DEFAULT_HOME_STATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);

  const persistLocal = useCallback(async (nextState: WellnessHomeState) => {
    try {
      await AsyncStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(nextState));
    } catch {}
  }, []);

  const syncRemote = useCallback(async (body: Record<string, unknown>) => {
    if (!isAuthenticated) return;
    try {
      await apiFetch("/api/healthclues/wellness-home", {
        method: "POST",
        timeoutMs: 3000,
        body: JSON.stringify(body),
      });
    } catch {
      // Offline resilient fallback; AsyncStorage retains truth cleanly
    }
  }, [isAuthenticated]);

  const loadState = useCallback(async () => {
    setLoading(true);
    let resolvedState: WellnessHomeState = { ...DEFAULT_HOME_STATE };

    try {
      const raw = await AsyncStorage.getItem(HOME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WellnessHomeState>;
        resolvedState = {
          unlockedItems: Array.isArray(parsed.unlockedItems) ? parsed.unlockedItems : [],
          activeRoom: parsed.activeRoom === "scene_bedroom" ? "scene_bedroom" : "scene_interior_wide",
          hasClaimedWelcome: Boolean(parsed.hasClaimedWelcome),
          lastRewardClaimedAt: parsed.lastRewardClaimedAt ?? null,
          dayNightOverride:
            parsed.dayNightOverride === "day" || parsed.dayNightOverride === "night"
              ? parsed.dayNightOverride
              : null,
          activeCompanionId:
            parsed.activeCompanionId && CHIBI_COMPANIONS[parsed.activeCompanionId]
              ? parsed.activeCompanionId
              : "mia",
        };
      }
    } catch {}

    // Unblock UI immediately using instant local storage truth (0ms latency)
    setHomeState(resolvedState);
    setLoading(false);

    if (!isAuthenticated) return;

    // Best-effort background merge with Web API for authenticated players
    try {
      const remote = await apiFetch<{
        playerState?: {
          unlockedItems?: string[];
          activeRoom?: string;
          hasClaimedWelcome?: boolean;
          lastRewardClaimedAt?: string | null;
          dayNightOverride?: "day" | "night" | null;
        };
      }>("/api/healthclues/wellness-home", { timeoutMs: 2500 });

      if (remote?.playerState && (remote.playerState.unlockedItems?.length || remote.playerState.hasClaimedWelcome)) {
        setHomeState((curr) => {
          const mergedUnlocked = Array.from(
            new Set([
              ...curr.unlockedItems,
              ...(remote.playerState?.unlockedItems || []),
            ])
          );
          const mergedState: WellnessHomeState = {
            ...curr,
            unlockedItems: mergedUnlocked,
            hasClaimedWelcome: Boolean(curr.hasClaimedWelcome || remote.playerState?.hasClaimedWelcome),
            activeRoom:
              curr.activeRoom === "scene_bedroom" || remote.playerState?.activeRoom === "scene_bedroom"
                ? (curr.activeRoom || (remote.playerState?.activeRoom as RoomId))
                : "scene_interior_wide",
          };
          void persistLocal(mergedState);
          return mergedState;
        });
      }
    } catch {
      // Offline / sandboxed mode - use local state seamlessly
    }
  }, [isAuthenticated, persistLocal]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const dayNightMode: DayNightMode = homeState.dayNightOverride ?? "auto";

  const isNight = useMemo(() => {
    if (dayNightMode === "day") return false;
    if (dayNightMode === "night") return true;
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
  }, [dayNightMode]);

  const visibleItems = useMemo(() => {
    return CANONICAL_HOME_CATALOG.filter(
      (item) => item.room === homeState.activeRoom && homeState.unlockedItems.includes(item.id)
    ).sort((a, b) => a.z_index - b.z_index);
  }, [homeState.activeRoom, homeState.unlockedItems]);

  const claimWelcome = useCallback(async () => {
    setBusy(true);
    const updatedUnlocked = homeState.unlockedItems.includes("sofa_luxury")
      ? homeState.unlockedItems
      : [...homeState.unlockedItems, "sofa_luxury"];

    const next: WellnessHomeState = {
      ...homeState,
      unlockedItems: updatedUnlocked,
      hasClaimedWelcome: true,
      activeRoom: "scene_interior_wide",
    };
    setHomeState(next);
    await persistLocal(next);
    void syncRemote({ action: "claim_welcome" });
    setBusy(false);
  }, [homeState, persistLocal, syncRemote]);

  const getDailyRewardChoices = useCallback((): WellnessHomeItem[] => {
    const unearnedLiving = CANONICAL_HOME_CATALOG.filter(
      (it) => it.room === "scene_interior_wide" && !homeState.unlockedItems.includes(it.id)
    ).sort((a, b) => {
      const ia = LIVING_PRIORITY.indexOf(a.id);
      const ib = LIVING_PRIORITY.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const unearnedBed = CANONICAL_HOME_CATALOG.filter(
      (it) => it.room === "scene_bedroom" && !homeState.unlockedItems.includes(it.id)
    ).sort((a, b) => {
      const ia = BEDROOM_PRIORITY.indexOf(a.id);
      const ib = BEDROOM_PRIORITY.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    if (unearnedLiving.length === 0 && unearnedBed.length === 0) {
      return [];
    }

    const choice1 = unearnedLiving[0] || unearnedBed[0];
    const choice2 = unearnedBed[0] || unearnedLiving[1] || unearnedLiving[0];
    return choice1 && choice2 && choice1.id !== choice2.id
      ? [choice1, choice2]
      : [choice1].filter(Boolean);
  }, [homeState.unlockedItems]);

  const claimDailyReward = useCallback(
    async (item: WellnessHomeItem) => {
      setBusy(true);
      const updatedUnlocked = homeState.unlockedItems.includes(item.id)
        ? homeState.unlockedItems
        : [...homeState.unlockedItems, item.id];

      const next: WellnessHomeState = {
        ...homeState,
        unlockedItems: updatedUnlocked,
        hasClaimedWelcome: true,
        activeRoom: item.room,
        lastRewardClaimedAt: new Date().toISOString(),
      };
      setHomeState(next);
      await persistLocal(next);
      void syncRemote({ action: "claim_daily_reward", itemId: item.id });
      setBusy(false);
    },
    [homeState, persistLocal, syncRemote]
  );

  const switchRoom = useCallback(
    async (room: RoomId) => {
      const next: WellnessHomeState = { ...homeState, activeRoom: room };
      setHomeState(next);
      await persistLocal(next);
      void syncRemote({ action: "set_active_room", room });
    },
    [homeState, persistLocal, syncRemote]
  );

  const cycleDayNight = useCallback(async () => {
    const nextMode: DayNightMode =
      dayNightMode === "auto" ? "day" : dayNightMode === "day" ? "night" : "auto";
    const override = nextMode === "auto" ? null : nextMode;
    const next: WellnessHomeState = { ...homeState, dayNightOverride: override };
    setHomeState(next);
    await persistLocal(next);
    void syncRemote({ action: "set_day_night", override });
    return nextMode;
  }, [dayNightMode, homeState, persistLocal, syncRemote]);

  const selectCompanion = useCallback(
    async (companionId: string) => {
      if (!CHIBI_COMPANIONS[companionId]) return;
      const next: WellnessHomeState = { ...homeState, activeCompanionId: companionId };
      setHomeState(next);
      await persistLocal(next);
    },
    [homeState, persistLocal]
  );

  const resetHome = useCallback(async () => {
    setBusy(true);
    const next: WellnessHomeState = {
      ...DEFAULT_HOME_STATE,
      activeCompanionId: homeState.activeCompanionId,
    };
    setHomeState(next);
    await persistLocal(next);
    void syncRemote({ action: "reset_player" });
    setBusy(false);
  }, [homeState.activeCompanionId, persistLocal, syncRemote]);

  return {
    catalog: CANONICAL_HOME_CATALOG,
    homeState,
    loading,
    busy,
    dayNightMode,
    isNight,
    visibleItems,
    currentCompanion: CHIBI_COMPANIONS[homeState.activeCompanionId] || CHIBI_COMPANIONS.mia,
    claimWelcome,
    getDailyRewardChoices,
    claimDailyReward,
    switchRoom,
    cycleDayNight,
    selectCompanion,
    resetHome,
    refreshHome: loadState,
  };
}
