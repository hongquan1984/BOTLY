export interface InteractiveLocation {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  badge: string;
  description: string;
  actionText: string;
  secondaryActionText?: string;
  features: string[];
  // Target position where the character walks to
  targetPos: [number, number, number];
  // Position of the 3D landmark / building
  buildingPos: [number, number, number];
  // Camera focus offset [offsetX, offsetY, offsetZ]
  cameraOffset: [number, number, number];
}

export const CASTLE_VILLAGE_LOCATIONS: InteractiveLocation[] = [
  {
    id: 'lumis-house',
    name: "Lumi's Cozy Cottage",
    shortName: "Lumi's House",
    emoji: "🏡",
    badge: "Starting Home",
    description: "A warm timber cottage nested at the southern entrance of the medieval village. Lanterns glow softly by the doorway as mountain breezes sweep past.",
    actionText: "Explore Interior",
    secondaryActionText: "Rest by Hearth",
    features: ["Warm Hearth 🔥", "Timber Beams 🪵", "Herbal Tea ☕", "Mountain View 🌄"],
    targetPos: [-8.5, 1.8, -8.5],
    buildingPos: [-11.0, 1.8, -10.5],
    cameraOffset: [11, 8, 11],
  },
  {
    id: 'knowledge-library',
    name: "Grand Castle Library",
    shortName: "Library",
    emoji: "🏰",
    badge: "Ancient Citadel",
    description: "The commanding stone fortress guarding the northern village heights. Houses the kingdom's royal library, ancient star charts, and historical archives.",
    actionText: "Read Royal Tomes",
    secondaryActionText: "Climb Castle Ramparts",
    features: ["Castle Citadel 🏰", "Stone Battlements 🛡️", "Royal Grimoires 📜", "Sky Overlook ☁️"],
    targetPos: [0.0, 1.8, 5.0],
    buildingPos: [0.0, 1.8, 9.5],
    cameraOffset: [-13, 12, 13],
  },
  {
    id: 'herbal-garden',
    name: "Eastern Herbal Grove",
    shortName: "Herbal Garden",
    emoji: "🌿",
    badge: "Botanical Sanctuary",
    description: "A terraced hillside grove adorned with mountain pines, rare herbs, and medicinal flora tended by the village apothecary.",
    actionText: "Gather Herbs",
    secondaryActionText: "Inspect Pine Grove",
    features: ["Pine Trees 🌲", "Medicinal Blooms 🌼", "Herbal Drying Racks 🌿", "Terraced Garden 🪴"],
    targetPos: [8.5, 1.8, -7.0],
    buildingPos: [10.5, 1.8, -9.5],
    cameraOffset: [-11, 9, -11],
  },
  {
    id: 'peaceful-lake',
    name: "Western Cliff Overlook",
    shortName: "Peaceful Overlook",
    emoji: "🌊",
    badge: "Scenic Vista",
    description: "A breathtaking cliffside terrace overlooking turquoise mountain waters and endless rolling cloud seas below the floating diorama.",
    actionText: "Meditate at Overlook",
    secondaryActionText: "Watch the Clouds",
    features: ["Turquoise Lagoon 💎", "Cliff Edge ☁️", "Mountain Breeze 🍃", "Panoramic Vista 🔭"],
    targetPos: [-11.0, 1.8, -3.5],
    buildingPos: [-13.5, 1.8, -4.5],
    cameraOffset: [11, 8, -9],
  },
  {
    id: 'village-square',
    name: "Central Village Crossroads",
    shortName: "Village Square",
    emoji: "⛲",
    badge: "Community Heart",
    description: "The lively cobblestone crossroads connecting the entrance road, eastern cottages, and grand castle gates. The gathering hub for villagers and travelers.",
    actionText: "Talk to Villagers",
    secondaryActionText: "View Village Notice",
    features: ["Cobblestone Roads 🪨", "Market Crossroads 🍎", "Warm Lanterns 🏮", "Castle Gateway ⛩️"],
    targetPos: [-1.5, 1.8, -2.5],
    buildingPos: [-1.5, 1.8, -2.5],
    cameraOffset: [10, 8, 10],
  },
];

export const COZY_VILLAGE_LOCATIONS: InteractiveLocation[] = [
  {
    id: 'potion-shop',
    name: "Lumi's Alchemy & Potion Shop",
    shortName: "Potion Shop",
    emoji: "🧪",
    badge: "Artisan Apothecary",
    description: "A charming roadside timber shop overflowing with glowing crystal elixir flasks, hanging mountain herbs, and flower barrels. Fragrant herbal scents drift into the plaza.",
    actionText: "Brew Healing Elixir",
    secondaryActionText: "Inspect Herbal Jars",
    features: ["Glowing Flasks 🧪", "Striped Awning 🎪", "Dried Herbs 🌿", "Timber Counter 🪵"],
    targetPos: [-4.8, 1.8, 3.2],
    buildingPos: [-8.5, 1.8, 5.0],
    cameraOffset: [9, 7, 9],
  },
  {
    id: 'watermill',
    name: "The Whispering Watermill",
    shortName: "Watermill",
    emoji: "🌊",
    badge: "Mountain Cascade",
    description: "A rustic watermill perched beside an upper mountain waterfall. The massive wooden wheel turns steadily, powered by crystal clear mountain streams flowing into the river.",
    actionText: "Check Water Wheel",
    secondaryActionText: "Listen to Cascade",
    features: ["Turning Wheel ⚙️", "Mountain Waterfall 💧", "River Stream 🐟", "Highland Ledge 🏔️"],
    targetPos: [-5.2, 2.4, -6.0],
    buildingPos: [-8.5, 2.8, -7.5],
    cameraOffset: [10, 8, -10],
  },
  {
    id: 'guild-hall',
    name: "Sunspire Guild Hall",
    shortName: "Guild Hall",
    emoji: "🏰",
    badge: "Elder's Haven",
    description: "The commanding two-story manor overlooking the village plaza. Adorned with royal blue heraldic banners, warm dormer windows, and village chronicles.",
    actionText: "Read Village Bulletin",
    secondaryActionText: "Enter Council Chamber",
    features: ["Royal Banners 🛡️", "Stone Steps 🏛️", "Warm Windows 🕯️", "Village Archives 📜"],
    targetPos: [0.0, 2.0, -6.8],
    buildingPos: [0.0, 2.2, -9.5],
    cameraOffset: [-11, 10, 11],
  },
  {
    id: 'arcane-library',
    name: "Arcane Archive & Bookshop",
    shortName: "Bookshop",
    emoji: "📖",
    badge: "Scholarly Haven",
    description: "A cozy scholars' haven featuring an open book sign above the door. Outdoor study desks, scroll cases, and lanterns invite travelers to read ancient kingdom lore.",
    actionText: "Read Ancient Lore",
    secondaryActionText: "Study Star Maps",
    features: ["Open Book Sign 📖", "Antique Tomes 📚", "Study Tables 🪵", "Lantern Glow 🏮"],
    targetPos: [6.5, 1.8, -4.2],
    buildingPos: [8.5, 1.8, -5.5],
    cameraOffset: [-10, 8, -10],
  },
  {
    id: 'central-fountain',
    name: "Starfall Plaza & Fountain",
    shortName: "Plaza Well",
    emoji: "⛲",
    badge: "Village Center",
    description: "The vibrant heart of the floating village. A historic carved stone well and fountain surrounded by lamp posts, wooden market carts, and colorful flowerbeds.",
    actionText: "Make a Wish",
    secondaryActionText: "Rest at Well",
    features: ["Stone Carved Well ⛲", "Hand Cart 🛒", "Market Stalls 🎪", "Daisy Flowerbeds 🌼"],
    targetPos: [1.8, 1.8, 0.6],
    buildingPos: [2.2, 1.8, -0.8],
    cameraOffset: [9, 7, 9],
  },
];

// Default to Cozy Village for the new task
export const INTERACTIVE_LOCATIONS = COZY_VILLAGE_LOCATIONS;
