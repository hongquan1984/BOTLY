import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };

export type WellnessHomeItem = {
  id: string;
  room: "scene_interior_wide" | "scene_bedroom";
  name_vi: string;
  name_en: string;
  tag_vi: string;
  tag_en: string;
  desc_vi: string;
  desc_en: string;
  img_src: string;
  is_starter: boolean;
  natural_width: number;
  natural_height: number;
  user_scale: number;
  z_index: number;
  corners: {
    tl: [number, number];
    tr: [number, number];
    br: [number, number];
    bl: [number, number];
  };
};

export type WellnessHomePlayerState = {
  userId: string;
  unlockedItems: string[];
  activeRoom: string;
  hasClaimedWelcome: boolean;
  lastRewardClaimedAt: string | null;
  dayNightOverride: "day" | "night" | null;
  updatedAt: string;
};

// Canonical Master Blueprint Fallback (matches migration seed)
let dynamicCatalogStore: WellnessHomeItem[] = [
  {
    id: "sofa_luxury",
    room: "scene_interior_wide",
    name_vi: "Bộ Sofa Thụy Sĩ Sang Trọng",
    name_en: "Luxury Swiss Chalet Sofa",
    tag_vi: "Phòng Khách",
    tag_en: "Living Room",
    desc_vi: "Món quà tân gia sang trọng, êm ái ngắm toàn cảnh tuyết trắng dãy Alps.",
    desc_en: "A luxurious welcoming gift, soft Italian leather overlooking snowy Alps peaks.",
    img_src: "/healthclues/assets/home/items/sofa_luxury.png",
    is_starter: true,
    natural_width: 340,
    natural_height: 184,
    user_scale: 1.10,
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
    img_src: "/healthclues/assets/home/items/piano_grand.png",
    is_starter: false,
    natural_width: 340,
    natural_height: 365,
    user_scale: 0.40,
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
    name_vi: "Tranh Dãy Alps Uốn Góc Lò Sưởi",
    name_en: "Matterhorn Chimney Wall Art",
    tag_vi: "Phòng Khách",
    tag_en: "Living Room",
    desc_vi: "Bức tranh danh họa dãy Alps gắn hoàn hảo trên trụ lò sưởi đá nguyên khối.",
    desc_en: "Masterpiece Alps oil painting aligned on stone fireplace mantle.",
    img_src: "/healthclues/assets/home/items/painting_fireplace.png",
    is_starter: false,
    natural_width: 307,
    natural_height: 420,
    user_scale: 0.40,
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
    img_src: "/healthclues/assets/home/items/table_coffee.png",
    is_starter: false,
    natural_width: 422,
    natural_height: 193,
    user_scale: 0.80,
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
    desc_vi: "Chậu cây thanh lọc không khí tươi mát từ sườn núi Matterhorn.",
    desc_en: "Air-purifying evergreen foliage straight from Matterhorn pine trails.",
    img_src: "/healthclues/assets/home/items/plant_pot_alps.png",
    is_starter: false,
    natural_width: 340,
    natural_height: 357,
    user_scale: 0.22,
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
    desc_vi: "Giường ngủ cao cấp đệm êm ái, mang lại giấc ngủ sâu phục hồi năng lượng.",
    desc_en: "Premium ergonomic natural wooden bed for deep restorative sleep.",
    img_src: "/healthclues/assets/home/items/luxury_chalet_bed.png",
    is_starter: false,
    natural_width: 700,
    natural_height: 450,
    user_scale: 0.95,
    z_index: 600,
    corners: {
      tl: [32.0, 48.0],
      tr: [72.0, 48.0],
      br: [72.0, 86.0],
      bl: [32.0, 86.0],
    },
  },
  {
    id: "bedside_lamp",
    room: "scene_bedroom",
    name_vi: "Đèn Ngủ Tinh Dầu Ấm Cúng",
    name_en: "Aroma Warm Glow Lamp",
    tag_vi: "Phòng Ngủ",
    tag_en: "Bedroom",
    desc_vi: "Ánh sáng vàng ấm 2700K dịu mắt kích hoạt hormone ngủ tự nhiên Melatonin.",
    desc_en: "Warm 2700K circadian glow supporting natural melatonin sleep onset.",
    img_src: "/healthclues/assets/home/items/bedside_lamp.png",
    is_starter: false,
    natural_width: 120,
    natural_height: 220,
    user_scale: 0.45,
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
    desc_vi: "Thảm lông mềm mại giữ ấm đôi chân mỗi buổi sáng bước xuống giường.",
    desc_en: "Plush insulating fleece rug keeping feet warm in cool mountain mornings.",
    img_src: "/healthclues/assets/home/items/bedroom_rug.png",
    is_starter: false,
    natural_width: 650,
    natural_height: 370,
    user_scale: 1.05,
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
    desc_vi: "Tranh phong cảnh thiên nhiên thanh bình, tạo cảm giác thư thái trước khi ngủ.",
    desc_en: "Tranquil sunrise perspective canvas fostering evening calmness.",
    img_src: "/healthclues/assets/home/items/painting_bedroom.png",
    is_starter: false,
    natural_width: 600,
    natural_height: 420,
    user_scale: 1.00,
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
    img_src: "/healthclues/assets/home/items/bedside_armchair.png",
    is_starter: false,
    natural_width: 240,
    natural_height: 260,
    user_scale: 0.65,
    z_index: 550,
    corners: {
      tl: [12.0, 55.0],
      tr: [26.0, 55.0],
      br: [26.0, 80.0],
      bl: [12.0, 80.0],
    },
  },
];

const SCENE_CONFIGS = {
  scene_interior_wide: {
    id: "scene_interior_wide",
    name_vi: "Phòng Khách Dãy Alps",
    name_en: "Alps Living Room",
    day_img: "/healthclues/assets/home/scenes/scene_interior_wide.webp",
    night_img: "/healthclues/assets/home/scenes/scene_interior_wide_night.webp",
  },
  scene_bedroom: {
    id: "scene_bedroom",
    name_vi: "Phòng Ngủ Tĩnh Dưỡng",
    name_en: "Restorative Bedroom",
    day_img: "/healthclues/assets/home/scenes/scene_bedroom.webp",
    night_img: "/healthclues/assets/home/scenes/scene_bedroom_night.webp",
  },
};

// In-memory state store for tests or when DB is initializing
const ephemeralStateStore = new Map<string, WellnessHomePlayerState>();
const dynamicWalkableMaskStore: Record<string, string> = {
  scene_interior_wide: "",
  scene_bedroom: "",
};

function resolveEffectiveUserId(request: Request, authenticatedId?: string): string {
  if (authenticatedId) return authenticatedId;
  const headerId = request.headers.get("x-player-id");
  if (headerId && headerId.trim()) return headerId.trim();
  const urlParam = new URL(request.url).searchParams.get("playerId");
  if (urlParam && urlParam.trim()) return urlParam.trim();
  return "guest_player_default";
}

function getOrInitPlayerState(userId: string): WellnessHomePlayerState {
  let state = ephemeralStateStore.get(userId);
  if (!state) {
    state = {
      userId,
      unlockedItems: [],
      activeRoom: "scene_interior_wide",
      hasClaimedWelcome: false,
      lastRewardClaimedAt: null,
      dayNightOverride: null,
      updatedAt: new Date().toISOString(),
    };
    ephemeralStateStore.set(userId, state);
  }
  return state;
}

export async function GET(request: Request) {
  let authUser: { id: string } | null = null;
  try {
    const auth = await requireUser(request);
    if (!isApiError(auth)) {
      authUser = auth;
    }
  } catch {
    // Guest or demo fallback permitted
  }

  const userId = resolveEffectiveUserId(request, authUser?.id);

  // 1. Load Catalog (try DB first, then fallback)
  let catalog: WellnessHomeItem[] = dynamicCatalogStore;
  try {
    const rows = await serviceRest<WellnessHomeItem[]>(
      `healthclues_wellness_home_catalog?select=*&order=room.asc,z_index.asc`
    );
    if (Array.isArray(rows) && rows.length > 0) {
      catalog = rows;
      dynamicCatalogStore = rows;
    }
  } catch {
    // Use dynamicCatalogStore fallback
  }

  // 2. Load Player State (try DB first, fallback to memory)
  let playerState = getOrInitPlayerState(userId);
  try {
    const rows = await serviceRest<Array<{
      user_id: string;
      unlocked_items: string[];
      active_room: string;
      has_claimed_welcome: boolean;
      last_reward_claimed_at: string | null;
      day_night_override: "day" | "night" | null;
      updated_at: string;
    }>>(`healthclues_wellness_home_player_state?user_id=eq.${userId}&select=*&limit=1`);

    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0];
      playerState = {
        userId: row.user_id,
        unlockedItems: Array.isArray(row.unlocked_items) ? row.unlocked_items : [],
        activeRoom: row.active_room || "scene_interior_wide",
        hasClaimedWelcome: Boolean(row.has_claimed_welcome),
        lastRewardClaimedAt: row.last_reward_claimed_at,
        dayNightOverride: row.day_night_override,
        updatedAt: row.updated_at || new Date().toISOString(),
      };
      ephemeralStateStore.set(userId, playerState);
    }
  } catch {
    // Continue with ephemeral
  }

  return NextResponse.json({
    scenes: SCENE_CONFIGS,
    catalog,
    playerState,
    walkableMasks: dynamicWalkableMaskStore,
  }, { headers });
}

export async function POST(request: Request) {
  let authUser: { id: string } | null = null;
  try {
    const auth = await requireUser(request);
    if (!isApiError(auth)) {
      authUser = auth;
    }
  } catch {
    // Guest fallback permitted
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers });
  }

  const userId = resolveEffectiveUserId(request, (body.playerId as string) || authUser?.id);
  const action = typeof body.action === "string" ? body.action : "";
  const state = getOrInitPlayerState(userId);

  if (action === "admin_save_item") {
    const rawItem = body.item as Record<string, unknown> | undefined;
    if (!rawItem || typeof rawItem.id !== "string" || !rawItem.id.trim()) {
      return NextResponse.json({ error: "Dữ liệu vật phẩm không hợp lệ (thiếu id)." }, { status: 400, headers });
    }
    const item: WellnessHomeItem = {
      id: rawItem.id.trim(),
      room: (rawItem.room === "scene_bedroom" ? "scene_bedroom" : "scene_interior_wide"),
      name_vi: String(rawItem.name_vi || rawItem.id),
      name_en: String(rawItem.name_en || rawItem.id),
      tag_vi: String(rawItem.tag_vi || "Nội Thất"),
      tag_en: String(rawItem.tag_en || "Furniture"),
      desc_vi: String(rawItem.desc_vi || ""),
      desc_en: String(rawItem.desc_en || ""),
      img_src: String(rawItem.img_src || "/healthclues/assets/home/items/sofa_luxury.png"),
      is_starter: Boolean(rawItem.is_starter),
      natural_width: Number(rawItem.natural_width) || 300,
      natural_height: Number(rawItem.natural_height) || 300,
      user_scale: Number(rawItem.user_scale) || 1.0,
      z_index: Number(rawItem.z_index) || 500,
      corners: (rawItem.corners && typeof rawItem.corners === "object" ? rawItem.corners : {
        tl: [20, 50],
        tr: [60, 50],
        br: [60, 90],
        bl: [20, 90],
      }) as WellnessHomeItem["corners"],
    };

    // Upsert into memory store
    const existingIndex = dynamicCatalogStore.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      dynamicCatalogStore[existingIndex] = item;
    } else {
      dynamicCatalogStore.push(item);
    }

    // Persist to Supabase DB if available
    try {
      await serviceRest("healthclues_wellness_home_catalog", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(item),
      });
    } catch (e) {
      console.warn("Could not sync item to DB, keeping in memory:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Đã lưu vật phẩm "${item.name_vi}" thành công.`,
      item,
      catalog: dynamicCatalogStore,
    }, { headers });
  } else if (action === "admin_batch_save") {
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json({ error: "Không có vật phẩm nào để lưu." }, { status: 400, headers });
    }
    const savedItems: WellnessHomeItem[] = [];
    for (const raw of rawItems) {
      if (!raw || typeof raw.id !== "string" || !raw.id.trim()) continue;
      const item: WellnessHomeItem = {
        id: raw.id.trim(),
        room: raw.room === "scene_bedroom" ? "scene_bedroom" : "scene_interior_wide",
        name_vi: String(raw.name_vi || raw.id),
        name_en: String(raw.name_en || raw.id),
        tag_vi: String(raw.tag_vi || "Nội Thất"),
        tag_en: String(raw.tag_en || "Furniture"),
        desc_vi: String(raw.desc_vi || ""),
        desc_en: String(raw.desc_en || ""),
        img_src: String(raw.img_src || "/healthclues/assets/home/items/table_coffee.png"),
        is_starter: Boolean(raw.is_starter),
        natural_width: Number(raw.natural_width) || 300,
        natural_height: Number(raw.natural_height) || 300,
        user_scale: Number(raw.user_scale) || 1.0,
        z_index: Number(raw.z_index) || 500,
        corners: raw.corners && typeof raw.corners === "object" ? raw.corners : {
          tl: [20, 50],
          tr: [60, 50],
          br: [60, 90],
          bl: [20, 90],
        },
      };
      const idx = dynamicCatalogStore.findIndex(i => i.id === item.id);
      if (idx >= 0) dynamicCatalogStore[idx] = item;
      else dynamicCatalogStore.push(item);
      savedItems.push(item);
      try {
        await serviceRest("healthclues_wellness_home_catalog", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify(item),
        });
      } catch (e) {
        console.warn("Could not sync item to DB in batch:", e);
      }
    }
    return NextResponse.json({
      success: true,
      message: `Đã lưu thành công ${savedItems.length} vật phẩm vào hệ thống.`,
      savedCount: savedItems.length,
      catalog: dynamicCatalogStore,
    }, { headers });
  } else if (action === "admin_delete_item") {
    const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
    if (!itemId) {
      return NextResponse.json({ error: "Thiếu itemId để xóa." }, { status: 400, headers });
    }
    dynamicCatalogStore = dynamicCatalogStore.filter(i => i.id !== itemId);
    try {
      await serviceRest(`healthclues_wellness_home_catalog?id=eq.${itemId}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Could not delete item from DB:", e);
    }
    return NextResponse.json({
      success: true,
      message: `Đã xóa vật phẩm ${itemId}.`,
      itemId,
      catalog: dynamicCatalogStore,
    }, { headers });
  } else if (action === "admin_save_walkable_mask") {
    const rawRoom = typeof body.roomId === "string" ? body.roomId : "scene_interior_wide";
    const roomId = rawRoom === "scene_bedroom" ? "scene_bedroom" : "scene_interior_wide";
    const maskDataUrl = typeof body.maskDataUrl === "string" ? body.maskDataUrl : "";
    dynamicWalkableMaskStore[roomId] = maskDataUrl;
    return NextResponse.json({
      success: true,
      message: `Đã lưu bản đồ vùng đi lại cho ${roomId === "scene_bedroom" ? "Phòng Ngủ" : "Phòng Khách"} thành công.`,
      roomId,
      walkableMasks: dynamicWalkableMaskStore,
    }, { headers });
  } else if (action === "claim_welcome") {
    if (!state.unlockedItems.includes("sofa_luxury")) {
      state.unlockedItems.push("sofa_luxury");
    }
    state.hasClaimedWelcome = true;
    state.updatedAt = new Date().toISOString();
  } else if (action === "claim_daily_reward") {
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    const item = dynamicCatalogStore.find((it) => it.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found in catalog" }, { status: 404, headers });
    }
    if (!state.unlockedItems.includes(itemId)) {
      state.unlockedItems.push(itemId);
    }
    state.lastRewardClaimedAt = new Date().toISOString();
    state.updatedAt = new Date().toISOString();
  } else if (action === "set_active_room") {
    const room = typeof body.room === "string" ? body.room : "scene_interior_wide";
    if (room === "scene_interior_wide" || room === "scene_bedroom") {
      state.activeRoom = room;
      state.updatedAt = new Date().toISOString();
    }
  } else if (action === "set_day_night") {
    const override = body.override;
    if (override === "day" || override === "night" || override === null) {
      state.dayNightOverride = override as "day" | "night" | null;
      state.updatedAt = new Date().toISOString();
    }
  } else if (action === "reset_player") {
    state.unlockedItems = [];
    state.hasClaimedWelcome = false;
    state.lastRewardClaimedAt = null;
    state.dayNightOverride = null;
    state.activeRoom = "scene_interior_wide";
    state.updatedAt = new Date().toISOString();
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400, headers });
  }

  // Sync to database if available
  try {
    await serviceRest(`healthclues_wellness_home_player_state`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: state.userId,
        unlocked_items: state.unlockedItems,
        active_room: state.activeRoom,
        has_claimed_welcome: state.hasClaimedWelcome,
        last_reward_claimed_at: state.lastRewardClaimedAt,
        day_night_override: state.dayNightOverride,
        updated_at: state.updatedAt,
      }),
    });
  } catch {
    // In-memory fallback is active
  }

  return NextResponse.json({
    success: true,
    playerState: state,
  }, { headers });
}
