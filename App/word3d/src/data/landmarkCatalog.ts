export interface LandmarkDefinition {
  landmarkId: string;
  actionId: string;
  displayName: {
    vi: string;
    en: string;
  };
  iconId: string;
  descriptionVi: string;
  defaultInteractionAnchor: [number, number, number];
  defaultLabelAnchor: [number, number, number];
  interactionRadius: number;
}

export const LANDMARK_CATALOG: Record<string, LandmarkDefinition> = {
  herbal_garden: {
    landmarkId: 'herbal_garden',
    actionId: 'OPEN_HERBAL_GARDEN',
    displayName: {
      vi: 'Nhà Thảo Mộc',
      en: 'Herbal House',
    },
    iconId: '🌿',
    descriptionVi: 'Khám phá thảo dược tự nhiên & trà trị liệu cùng Tiên Nữ Flora',
    defaultInteractionAnchor: [0, 0, 2.8],
    defaultLabelAnchor: [0, 4.2, 0],
    interactionRadius: 2.5,
  },
  sound_garden: {
    landmarkId: 'sound_garden',
    actionId: 'OPEN_SOUND_GARDEN',
    displayName: {
      vi: 'Nhà Âm Thanh',
      en: 'Sound House',
    },
    iconId: '🎵',
    descriptionVi: 'Thư viện thanh âm thiên nhiên, suối thác & tần số sóng não 432Hz cùng Tiên Nữ Lyra',
    defaultInteractionAnchor: [0, 0, 2.8],
    defaultLabelAnchor: [0, 4.2, 0],
    interactionRadius: 2.5,
  },
  zen_breath: {
    landmarkId: 'zen_breath',
    actionId: 'OPEN_ZEN_BREATH',
    displayName: {
      vi: 'Thiền Đường - Hơi Thở',
      en: 'Zen Breath Sanctuary',
    },
    iconId: '🌬️',
    descriptionVi: 'Kỹ thuật thở 4-7-8, thở hộp & thôi miên ru ngủ cùng Tiên Nữ Aura',
    defaultInteractionAnchor: [0, 0, 2.8],
    defaultLabelAnchor: [0, 4.2, 0],
    interactionRadius: 2.5,
  },
  knowledge_library: {
    landmarkId: 'knowledge_library',
    actionId: 'OPEN_KNOWLEDGE_LIBRARY',
    displayName: {
      vi: 'Thư Viện Tri Thức',
      en: 'Knowledge Library',
    },
    iconId: '📖',
    descriptionVi: 'Giải mã bí ẩn sức khỏe & trả lời câu hỏi trinh thám',
    defaultInteractionAnchor: [0, 0, 2.5],
    defaultLabelAnchor: [0, 3.8, 0],
    interactionRadius: 2.5,
  },
  task_square: {
    landmarkId: 'task_square',
    actionId: 'OPEN_TASK_SQUARE',
    displayName: {
      vi: 'Quảng Trường & Giếng Ước',
      en: 'Task Square',
    },
    iconId: '⛲',
    descriptionVi: 'Nhận nhiệm vụ hàng ngày & điểm danh sức khỏe',
    defaultInteractionAnchor: [0, 0, 2.0],
    defaultLabelAnchor: [0, 2.6, 0],
    interactionRadius: 2.0,
  },
};

export const AVAILABLE_ICONS = ['🌿', '🎵', '🌬️', '📖', '⛲', '🏡', '🌸', '🌲', '✨', '🎯'];

/**
 * Helper to get default landmark metadata for known building names
 */
export function getInitialLandmarkForBuilding(name: string, type: string) {
  const n = (name || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (n.includes('potion') || n.includes('lumi') || n.includes('thảo mộc') || n.includes('flora')) {
    return {
      buildingInstanceId: 'bld_potion_shop',
      ...LANDMARK_CATALOG.herbal_garden,
      hasFunction: true,
      enabled: true,
    };
  }
  if (n.includes('bookshop') || n.includes('arcane') || n.includes('sound') || n.includes('âm thanh') || n.includes('lyra')) {
    return {
      buildingInstanceId: 'bld_bookshop',
      ...LANDMARK_CATALOG.sound_garden,
      hasFunction: true,
      enabled: true,
    };
  }
  if (n.includes('great hall') || n.includes('sinh hoạt') || n.includes('hành trình') || n.includes('thiền') || n.includes('hơi thở') || n.includes('aura')) {
    return {
      buildingInstanceId: 'bld_great_hall',
      ...LANDMARK_CATALOG.zen_breath,
      hasFunction: true,
      enabled: true,
    };
  }
  if (n.includes('well') || n.includes('giếng') || n.includes('quảng trường')) {
    return {
      buildingInstanceId: 'bld_plaza_well',
      ...LANDMARK_CATALOG.task_square,
      hasFunction: true,
      enabled: true,
    };
  }
  if (n.includes('fantasy_house')) {
    return {
      buildingInstanceId: 'bld_fantasy_cottage',
      landmarkId: undefined,
      actionId: undefined,
      displayName: { vi: 'Nhà Nghỉ Chân', en: 'Rest Cottage' },
      iconId: '🏡',
      descriptionVi: 'Ngôi nhà nhỏ ven đồi nghỉ ngơi ngắm cảnh làng',
      defaultInteractionAnchor: [0, 0, 2.5] as [number, number, number],
      defaultLabelAnchor: [0, 3.5, 0] as [number, number, number],
      interactionRadius: 2.0,
      hasFunction: false,
      enabled: false,
    };
  }
  if (n.includes('stone_house')) {
    return {
      buildingInstanceId: 'bld_stone_cottage',
      landmarkId: undefined,
      actionId: undefined,
      displayName: { vi: 'Nhà Đá Cổ', en: 'Ancient Stone Cottage' },
      iconId: '🏡',
      descriptionVi: 'Ngôi nhà đá cổ kính trầm mặc trên sườn đồi',
      defaultInteractionAnchor: [0, 0, 2.5] as [number, number, number],
      defaultLabelAnchor: [0, 3.5, 0] as [number, number, number],
      interactionRadius: 2.0,
      hasFunction: false,
      enabled: false,
    };
  }

  // Not a predefined building landmark
  return null;
}
