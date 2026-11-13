"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { REGION_NAVIGATION, type NavPoint } from "./region-navigation-data";
import { type PetRegion } from "./HealthCluesPet";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";

export const ENABLE_LIVING_VILLAGE_V1 = true;

export interface ChibiVisitorConfig {
  id: "anna" | "leo" | "mia" | "ben" | "lily";
  name: string;
  cloak: string;
  spriteUrl: string;
  waveSpriteUrl?: string;
  speed: number; // px per second
  initialPos: NavPoint;
  initialRest: number; // ms before first move
  greetings: {
    npcBotanist: string[];
    npcWellness: string[];
    npcLibrary: string[];
    plaza: string[];
    meetPeer: string[];
    playerClick: string[];
  };
}

type VisitorState = "idle" | "moving" | "interacting_npc" | "interacting_peer" | "resting";

interface VisitorRuntime {
  id: ChibiVisitorConfig["id"];
  name: string;
  x: number;
  y: number;
  facing: "left" | "right";
  state: VisitorState;
  stateTimer: number; // ms remaining
  speed: number;
  path: NavPoint[];
  pathIndex: number;
  targetKey: string;
  targetNpc?: "botanist" | "wellness" | "library" | null;
  speechText: string | null;
  speechDuration: number;
  partnerId: string | null;
  isWave?: boolean;
}

// 5 Chibi Characters configuration based on ref-charactor.png
const CHIBI_VISITORS: ChibiVisitorConfig[] = [
  {
    id: "anna",
    name: "Anna",
    cloak: "áo choàng xanh lá",
    spriteUrl: "/healthclues/assets/characters/chibi-anna.png",
    waveSpriteUrl: "/healthclues/assets/characters/chibi-anna-wave.png",
    speed: 54,
    initialPos: { x: 788, y: 414 }, // Near Fountain
    initialRest: 2500,
    greetings: {
      npcBotanist: [
        "Chào bác Botanist! Vườn hôm nay thơm quá 🌿",
        "Cháu ghé tìm hiểu thảo dược tươi mát ạ!",
        "Hoa cúc trong vườn nở rực rỡ quá bác ơi!"
      ],
      npcWellness: [
        "Chào chị! Em vừa đi bộ 15 phút xong đấy ✨",
        "Ghé thăm góc thiền để hít thở sâu một chút."
      ],
      npcLibrary: [
        "Thư viện hôm nay yên tĩnh và ấm áp thật!",
        "Tìm được bài đọc về giấc ngủ rất hay 📖"
      ],
      plaza: [
        "Quảng trường làng nhộn nhịp vui ghê!",
        "Dừng chân nghỉ ngơi cạnh đài phun nước một lát ⛲"
      ],
      meetPeer: [
        "Chào bạn nhé! Hôm nay bạn thế nào? 👋",
        "Gặp nhau ở quảng trường vui quá!",
        "Cùng nhau xây dựng thói quen tốt nhé!"
      ],
      playerClick: [
        "Chào bạn đồng hành! Chúc bạn ngày an lành ✨",
        "Làng HealthClues hôm nay đẹp lắm đúng không?"
      ]
    }
  },
  {
    id: "leo",
    name: "Leo",
    cloak: "áo choàng xanh đậm",
    spriteUrl: "/healthclues/assets/characters/chibi-leo.png",
    speed: 48,
    initialPos: { x: 438, y: 430 }, // Near Library
    initialRest: 6000,
    greetings: {
      npcBotanist: [
        "Bác Botanist có loại trà nào dễ ngủ không ạ?",
        "Cháu đến ngắm vườn dược liệu thanh bình này."
      ],
      npcWellness: [
        "Chào chị Wellness Guide! Hôm nay em uống đủ nước rồi 💧",
        "Không khí ở khu này dễ chịu và thoáng đãng quá."
      ],
      npcLibrary: [
        "Đang tìm tài liệu về nhịp sinh học tự nhiên 📚",
        "Góc đọc sách yêu thích của mình đây rồi!"
      ],
      plaza: [
        "Đi dạo một vòng quanh quảng trường thôi nào.",
        "Tiếng nước róc rách nghe thư giãn ghê."
      ],
      meetPeer: [
        "Chào bạn! Cậu vừa đi dạo về à? 🚶‍♂️",
        "Rất vui được gặp bạn ở đây nhé!",
        "Chúc bạn một ngày tràn đầy năng lượng!"
      ],
      playerClick: [
        "Chào cậu! Cậu đang trên đường làm nhiệm vụ à?",
        "Cứ thong thả khám phá, không cần vội đâu nhé!"
      ]
    }
  },
  {
    id: "mia",
    name: "Mia",
    cloak: "áo choàng kem",
    spriteUrl: "/healthclues/assets/characters/chibi-mia.png",
    speed: 52,
    initialPos: { x: 656, y: 617 }, // Central Plaza West
    initialRest: 9000,
    greetings: {
      npcBotanist: [
        "Mùi hương bạc hà thơm ngát luôn bác ơi 🍃",
        "Chào bác! Hôm nay cháu tưới cây giúp bác nhé?"
      ],
      npcWellness: [
        "Em vừa tập bài kéo giãn nhẹ nhàng rồi chị ơi!",
        "Cảm giác cơ thể nhẹ nhõm hơn hẳn."
      ],
      npcLibrary: [
        "Hôm nay mình đọc được mẹo ăn uống rất bổ ích 🥗",
        "Không gian đọc sách thật yên tĩnh."
      ],
      plaza: [
        "Thời tiết ở thung lũng hôm nay thật dễ chịu ☀️",
        "Ngồi nghỉ một lát ngắm bầu trời trong xanh."
      ],
      meetPeer: [
        "Chào bạn! Hôm nay vui quá được gặp nhau 💖",
        "Cậu đã ghé thăm đài phun nước chưa?",
        "Chúc bạn hoàn thành trọn vẹn mục tiêu hôm nay nhé!"
      ],
      playerClick: [
        "Chào bạn nhé! Nhớ uống đủ nước và nghỉ ngơi nghen 🌸",
        "Một ngày mới thật nhiều năng lượng tích cực nhé!"
      ]
    }
  },
  {
    id: "ben",
    name: "Ben",
    cloak: "áo choàng xanh navy",
    spriteUrl: "/healthclues/assets/characters/chibi-ben.png",
    speed: 50,
    initialPos: { x: 1060, y: 430 }, // Near Botanist
    initialRest: 4000,
    greetings: {
      npcBotanist: [
        "Cháu đang nghiên cứu về các loại thảo mộc tự nhiên 🔬",
        "Cảm ơn bác Botanist đã hướng dẫn cháu ạ!"
      ],
      npcWellness: [
        "Chào chị! 15 phút vận động mỗi ngày hiệu quả thật đấy.",
        "Em đang duy trì thói quen ngủ trước 11 giờ."
      ],
      npcLibrary: [
        "Kho tri thức HealthClues phong phú thật 📖",
        "Mỗi ngày một mẩu kiến thức nhỏ rất dễ nhớ."
      ],
      plaza: [
        "Dạo quanh quảng trường giúp đầu óc minh mẫn hơn.",
        "Đài phun nước trung tâm lúc nào cũng tràn đầy sức sống."
      ],
      meetPeer: [
        "Chào cậu nhé! Có phát hiện gì mới chưa? 💬",
        "Cùng cố gắng vì sức khỏe tốt hơn mỗi ngày!",
        "Rất vui được đồng hành cùng bạn!"
      ],
      playerClick: [
        "Chào nhà thám hiểm! Hành trình hôm nay thế nào rồi?",
        "Hãy kiên trì từng bước nhỏ nhé, bạn làm rất tốt!"
      ]
    }
  },
  {
    id: "lily",
    name: "Lily",
    cloak: "áo choàng tím",
    spriteUrl: "/healthclues/assets/characters/chibi-lily.png",
    speed: 56,
    initialPos: { x: 1195, y: 648 }, // Near Wellness Sanctuary
    initialRest: 7500,
    greetings: {
      npcBotanist: [
        "Em thích góc hoa cúc trắng của bác Botanist ghê 🌼",
        "Màu xanh thảo mộc nhìn dịu mắt thật đấy!"
      ],
      npcWellness: [
        "Chào chị! Em vừa làm bài thở sâu 3 phút xong 🫁",
        "Cảm thấy tâm trí thanh thản hơn rất nhiều."
      ],
      npcLibrary: [
        "Em ghé tìm cuốn cẩm nang về giấc ngủ ngon 🌙",
        "Thư viện có nhiều góc đọc xinh xắn quá."
      ],
      plaza: [
        "Quảng trường hôm nay có nhiều hoa nở rộ quá!",
        "Thong thả đi dạo hít thở không khí trong lành."
      ],
      meetPeer: [
        "Chào bạn! Chúc bạn ngày mới ngập tràn niềm vui 💖",
        "Gặp bạn ở đây làm mình vui ghê!",
        "Hôm nay bạn nhớ chăm sóc bản thân thật tốt nhé!"
      ],
      playerClick: [
        "Chào bạn! Chúc bạn luôn giữ nụ cười và sức khỏe nhé 🌷",
        "Mỗi ngày một bước nhỏ, bạn sẽ đạt được mục tiêu!"
      ]
    }
  }
];

// English translations for Chibi Visitors greetings
const CHIBI_GREETINGS_EN: Record<ChibiVisitorConfig["id"], ChibiVisitorConfig["greetings"]> = {
  anna: {
    npcBotanist: [
      "Hello Botanist! The garden smells wonderful today 🌿",
      "I'm here to learn about fresh herbal remedies!",
      "The chamomile flowers are blooming beautifully!"
    ],
    npcWellness: [
      "Hello! I just finished my 15-minute gentle walk ✨",
      "Stopping by the meditation corner for deep breaths."
    ],
    npcLibrary: [
      "The library is so peaceful and warm today!",
      "Found a great article on sleep hygiene 📖"
    ],
    plaza: [
      "The village square is so lively today!",
      "Resting a bit by the fountain ⛲"
    ],
    meetPeer: [
      "Hello friend! How is your day going? 👋",
      "Great to run into you at the square!",
      "Let's build healthy habits together!"
    ],
    playerClick: [
      "Hello fellow adventurer! Wishing you a peaceful day ✨",
      "HealthClues Village is gorgeous today, isn't it?"
    ]
  },
  leo: {
    npcBotanist: [
      "Botanist, do you recommend any soothing tea for sleep?",
      "I came to admire this peaceful herbal garden."
    ],
    npcWellness: [
      "Hello Wellness Guide! I drank enough water today 💧",
      "The fresh air here is so refreshing."
    ],
    npcLibrary: [
      "Looking for research on natural circadian rhythms 📚",
      "Here is my favorite reading nook!"
    ],
    plaza: [
      "Time for a relaxing stroll around the square.",
      "The sound of trickling water is so calming."
    ],
    meetPeer: [
      "Hello! Just back from a walk? 🚶‍♂️",
      "Nice to see you here!",
      "Wishing you an energetic day!"
    ],
    playerClick: [
      "Hello! Are you on a wellness quest?",
      "Take your time exploring, no rush at all!"
    ]
  },
  mia: {
    npcBotanist: [
      "The fresh mint fragrance is amazing 🍃",
      "Hello! Shall I help water the plants today?"
    ],
    npcWellness: [
      "I just completed a gentle stretching session!",
      "My body feels so light and relaxed."
    ],
    npcLibrary: [
      "I read a great mindful nutrition tip today 🥗",
      "Such a quiet and cozy reading corner."
    ],
    plaza: [
      "The weather in the valley is delightful today ☀️",
      "Sitting a moment to enjoy the clear sky."
    ],
    meetPeer: [
      "Hi there! So happy to see you today 💖",
      "Have you checked out the fountain yet?",
      "Hope you achieve all your goals today!"
    ],
    playerClick: [
      "Hello friend! Remember to stay hydrated and rest 🌸",
      "Have a wonderful day filled with positive energy!"
    ]
  },
  ben: {
    npcBotanist: [
      "Studying natural botanicals in the garden 🔬",
      "Thank you for the guidance, Botanist!"
    ],
    npcWellness: [
      "15 minutes of daily movement makes a big difference.",
      "Keeping up my habit of winding down before 11 PM."
    ],
    npcLibrary: [
      "The HealthClues library is so rich with insights 📖",
      "One small piece of knowledge a day is easy to remember."
    ],
    plaza: [
      "Walking around the plaza clears the mind.",
      "The central fountain is always vibrant."
    ],
    meetPeer: [
      "Hello! Discovered anything new today? 💬",
      "Let's keep striving for better well-being!",
      "Great to adventure alongside you!"
    ],
    playerClick: [
      "Greetings adventurer! How is your journey going?",
      "Take small consistent steps, you're doing great!"
    ]
  },
  lily: {
    npcBotanist: [
      "I love the white chamomile corner 🌼",
      "The lush greenery is so soothing to the eyes!"
    ],
    npcWellness: [
      "I just completed a 3-minute deep breathing exercise 🫁",
      "Feeling much calmer and more focused."
    ],
    npcLibrary: [
      "Browsing for a guide to restorative sleep 🌙",
      "The library has so many lovely reading spots."
    ],
    plaza: [
      "So many flowers are blooming in the square!",
      "Taking a peaceful stroll in the fresh air."
    ],
    meetPeer: [
      "Hello! Wishing you a joyful day 💖",
      "Seeing you here brightens my day!",
      "Take good care of yourself today!"
    ],
    playerClick: [
      "Hello! Keep smiling and stay healthy 🌷",
      "One step every day and you will reach your goals!"
    ]
  }
};

function getVisitorQuotes(cfg: ChibiVisitorConfig, category: keyof ChibiVisitorConfig["greetings"], loc: string): string[] {
  if (loc === "vi") return cfg.greetings[category];
  return CHIBI_GREETINGS_EN[cfg.id]?.[category] || cfg.greetings[category];
}

// Key Destinations in 1600x900 World Coordinates
const DESTINATIONS: Record<string, { pos: NavPoint; label: string; npc?: "botanist" | "wellness" | "library" | null }> = {
  botanist: { pos: { x: 1060, y: 430 }, label: "Nhà Thảo Mộc", npc: "botanist" },
  wellness: { pos: { x: 1195, y: 648 }, label: "Cẩm Nang Sống Khỏe", npc: "wellness" },
  library: { pos: { x: 438, y: 430 }, label: "Kho Tri Thức", npc: "library" },
  fountain_south: { pos: { x: 788, y: 414 }, label: "Đài Phun Nước Nam" },
  fountain_north: { pos: { x: 788, y: 375 }, label: "Đài Phun Nước Bắc" },
  plaza_center: { pos: { x: 766, y: 691 }, label: "Quảng Trường Trung Tâm" },
  plaza_east: { pos: { x: 875, y: 617 }, label: "Quảng Trường Đông" },
  plaza_west: { pos: { x: 656, y: 617 }, label: "Quảng Trường Tây" },
  dock_pier: { pos: { x: 1383, y: 766 }, label: "Cầu Gỗ Ven Hồ" },
  camp_approach: { pos: { x: 288, y: 648 }, label: "Khu Trại Thám Hiểm" },
  activity_trail: { pos: { x: 410, y: 660 }, label: "Đường Vận Động" },
};

// Graph Node for Pathfinding
interface PathNode {
  id: number;
  x: number;
  y: number;
  adj: number[];
}

// Build waypoint graph once from authored walkable paths
function buildWaypointGraph(): { nodes: PathNode[]; findNearestNode: (pt: NavPoint) => number } {
  const paths = REGION_NAVIGATION["health-concern"].walkablePaths;
  const nodes: PathNode[] = [];
  const nodeKey = (pt: NavPoint) => `${Math.round(pt.x / 14)},${Math.round(pt.y / 14)}`;
  const keyToId = new Map<string, number>();

  function getOrCreate(pt: NavPoint): number {
    const k = nodeKey(pt);
    if (keyToId.has(k)) return keyToId.get(k)!;
    // Also check distance to existing
    for (const n of nodes) {
      if (Math.hypot(n.x - pt.x, n.y - pt.y) < 16) {
        keyToId.set(k, n.id);
        return n.id;
      }
    }
    const id = nodes.length;
    nodes.push({ id, x: pt.x, y: pt.y, adj: [] });
    keyToId.set(k, id);
    return id;
  }

  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const u = getOrCreate(path[i]);
      const v = getOrCreate(path[i + 1]);
      if (u !== v) {
        if (!nodes[u].adj.includes(v)) nodes[u].adj.push(v);
        if (!nodes[v].adj.includes(u)) nodes[v].adj.push(u);
      }
    }
  }

  function findNearestNode(pt: NavPoint): number {
    let bestDist = Infinity;
    let bestId = 0;
    for (const n of nodes) {
      const d = Math.hypot(n.x - pt.x, n.y - pt.y);
      if (d < bestDist) {
        bestDist = d;
        bestId = n.id;
      }
    }
    return bestId;
  }

  return { nodes, findNearestNode };
}

// Find path from A to B along the graph using BFS
function findShortestPath(
  start: NavPoint,
  goal: NavPoint,
  nodes: PathNode[],
  findNearestNode: (pt: NavPoint) => number
): NavPoint[] {
  const startId = findNearestNode(start);
  const goalId = findNearestNode(goal);

  if (startId === goalId) {
    return [start, goal];
  }

  // BFS
  const prev = new Map<number, number>();
  const visited = new Set<number>([startId]);
  const queue = [startId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === goalId) break;

    for (const nxt of nodes[curr].adj) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        prev.set(nxt, curr);
        queue.push(nxt);
      }
    }
  }

  if (!visited.has(goalId)) {
    // Fallback direct path
    return [start, goal];
  }

  // Reconstruct path
  const pathNodes: NavPoint[] = [goal];
  let curr = goalId;
  while (curr !== startId) {
    const p = prev.get(curr)!;
    pathNodes.unshift({ x: nodes[p].x, y: nodes[p].y });
    curr = p;
  }
  pathNodes.unshift(start);
  return pathNodes;
}

export function AmbientVillageVisitors({ region }: { region?: PetRegion }) {
  if (!ENABLE_LIVING_VILLAGE_V1) {
    return null;
  }

  return <AmbientVillageVisitorsInner />;
}

function AmbientVillageVisitorsInner() {
  const { locale } = useHealthCluesLocale();
  const graph = useMemo(() => buildWaypointGraph(), []);

  // Runtime state for the 5 visitors
  const [visitors, setVisitors] = useState<VisitorRuntime[]>(() =>
    CHIBI_VISITORS.map(cfg => ({
      id: cfg.id,
      name: cfg.name,
      x: cfg.initialPos.x,
      y: cfg.initialPos.y,
      facing: "right",
      state: "resting",
      stateTimer: cfg.initialRest,
      speed: cfg.speed,
      path: [],
      pathIndex: 0,
      targetKey: "plaza_center",
      targetNpc: null,
      speechText: null,
      speechDuration: 0,
      partnerId: null,
    }))
  );

  // NPC Response speech bubble state
  const [npcSpeech, setNpcSpeech] = useState<{
    npc: "botanist" | "wellness";
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Ref to hold runtime objects for 60fps RAF loop without React lag
  const runtimeRef = useRef<VisitorRuntime[]>(visitors);
  useEffect(() => {
    runtimeRef.current = visitors;
  }, [visitors]);

  // Track rendezvous between pairs
  const rendezvousRef = useRef<{
    pair: [string, string];
    spot: NavPoint;
    phase: "walking" | "talking" | "done";
    timer: number;
  } | null>(null);

  const nextRendezvousTime = useRef(0);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    if (nextRendezvousTime.current === 0) {
      nextRendezvousTime.current = performance.now() + 25000;
    }

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1); // max 100ms dt
      lastTime = now;

      const currentList = [...runtimeRef.current];
      let hasChanges = false;

      // 1. Check Rendezvous Scheduler (occasionally 2 characters meet up)
      if (now > nextRendezvousTime.current && !rendezvousRef.current) {
        // Find 2 available resting or moving visitors
        const available = currentList.filter(v => v.state === "resting" || v.state === "idle");
        if (available.length >= 2) {
          const v1 = available[0];
          const v2 = available[1];
          const meetupSpots = [DESTINATIONS.plaza_center.pos, DESTINATIONS.fountain_south.pos, DESTINATIONS.plaza_east.pos];
          const spot = meetupSpots[Math.floor(Math.random() * meetupSpots.length)];

          // Plan paths to meetup spot
          const path1 = findShortestPath({ x: v1.x, y: v1.y }, { x: spot.x - 22, y: spot.y }, graph.nodes, graph.findNearestNode);
          const path2 = findShortestPath({ x: v2.x, y: v2.y }, { x: spot.x + 22, y: spot.y }, graph.nodes, graph.findNearestNode);

          v1.path = path1;
          v1.pathIndex = 0;
          v1.state = "moving";
          v1.targetKey = "rendezvous";
          v1.partnerId = v2.id;

          v2.path = path2;
          v2.pathIndex = 0;
          v2.state = "moving";
          v2.targetKey = "rendezvous";
          v2.partnerId = v1.id;

          rendezvousRef.current = {
            pair: [v1.id, v2.id],
            spot,
            phase: "walking",
            timer: 0,
          };
          nextRendezvousTime.current = now + 40000 + Math.random() * 20000; // Next in 40-60s
          hasChanges = true;
        }
      }

      // 2. Update each visitor
      for (let i = 0; i < currentList.length; i++) {
        const v = currentList[i];
        const cfg = CHIBI_VISITORS.find(c => c.id === v.id)!;

        // Decrement speech timer
        if (v.speechDuration > 0) {
          v.speechDuration -= dt * 1000;
          if (v.speechDuration <= 0) {
            v.speechText = null;
            hasChanges = true;
          }
        }

        // State Machine
        if (v.state === "resting" || v.state === "idle") {
          v.stateTimer -= dt * 1000;
          if (v.stateTimer <= 0) {
            // Pick next destination
            const keys = Object.keys(DESTINATIONS).filter(k => k !== v.targetKey);
            const nextKey = keys[Math.floor(Math.random() * keys.length)];
            const dest = DESTINATIONS[nextKey];

            v.targetKey = nextKey;
            v.targetNpc = dest.npc || null;
            v.path = findShortestPath({ x: v.x, y: v.y }, dest.pos, graph.nodes, graph.findNearestNode);
            v.pathIndex = 0;
            v.state = "moving";
            v.partnerId = null;
            hasChanges = true;
          }
        } else if (v.state === "moving") {
          if (v.path.length > 0 && v.pathIndex < v.path.length) {
            const targetPt = v.path[v.pathIndex];
            const dx = targetPt.x - v.x;
            const dy = targetPt.y - v.y;
            const dist = Math.hypot(dx, dy);

            // Facing direction
            if (Math.abs(dx) > 1) {
              v.facing = dx >= 0 ? "right" : "left";
            }

            const stepDist = v.speed * dt;
            if (dist <= Math.max(stepDist, 3.5)) {
              // Arrived at current waypoint
              v.x = targetPt.x;
              v.y = targetPt.y;
              v.pathIndex++;

              if (v.pathIndex >= v.path.length) {
                // Arrived at final destination!
                if (v.partnerId && rendezvousRef.current) {
                  // Reached rendezvous spot
                  v.state = "interacting_peer";
                  v.stateTimer = 4000; // 4s peer interaction

                  const partner = currentList.find(p => p.id === v.partnerId);
                  if (partner) {
                    // Face each other
                    v.facing = partner.x >= v.x ? "right" : "left";
                    partner.facing = partner.x >= v.x ? "left" : "right";

                    // Visitor 1 waves and greets
                    const pool1 = getVisitorQuotes(cfg, "meetPeer", locale);
                    v.speechText = pool1[Math.floor(Math.random() * pool1.length)];
                    v.speechDuration = 3200;
                    v.isWave = true;

                    // Visitor 2 replies after brief delay
                    const partnerCfg = CHIBI_VISITORS.find(c => c.id === partner.id)!;
                    const pool2 = getVisitorQuotes(partnerCfg, "meetPeer", locale);
                    setTimeout(() => {
                      if (runtimeRef.current) {
                        const pNow = runtimeRef.current.find(item => item.id === partner.id);
                        if (pNow) {
                          pNow.speechText = pool2[Math.floor(Math.random() * pool2.length)];
                          pNow.speechDuration = 3000;
                          setVisitors([...runtimeRef.current]);
                        }
                      }
                    }, 1200);
                  }
                } else if (v.targetNpc) {
                  // Arrived at an NPC!
                  v.state = "interacting_npc";
                  v.stateTimer = 5000; // 5s interaction with NPC

                  // Select greeting according to NPC
                  let pool = getVisitorQuotes(cfg, "npcBotanist", locale);
                  if (v.targetNpc === "wellness") pool = getVisitorQuotes(cfg, "npcWellness", locale);
                  if (v.targetNpc === "library") pool = getVisitorQuotes(cfg, "npcLibrary", locale);

                  v.speechText = pool[Math.floor(Math.random() * pool.length)];
                  v.speechDuration = 3500;

                  // Trigger NPC friendly response
                  if (v.targetNpc === "botanist") {
                    v.facing = "right"; // Botanist is to the right
                    setTimeout(() => {
                      setNpcSpeech({
                        npc: "botanist",
                        text: locale === "vi" ? "Chào cháu! Thảo mộc luôn đón chào người chăm sóc sức khỏe 🍃" : "Welcome, traveler! Plants always welcome mindful care.",
                        x: 1088,
                        y: 380,
                      });
                      setTimeout(() => setNpcSpeech(null), 3200);
                    }, 1000);
                  } else if (v.targetNpc === "wellness") {
                    v.facing = "right";
                    setTimeout(() => {
                      setNpcSpeech({
                        npc: "wellness",
                        text: locale === "vi" ? "Từng bước nhỏ mỗi ngày sẽ tạo nên thói quen vững bền nhé! ✨" : "Small daily steps build lasting wellness!",
                        x: 1216,
                        y: 615,
                      });
                      setTimeout(() => setNpcSpeech(null), 3200);
                    }, 1000);
                  }
                } else {
                  // Arrived at a safe plaza or fountain spot
                  v.state = "resting";
                  v.stateTimer = 5000 + Math.random() * 4000; // Rest 5-9s

                  const pool = getVisitorQuotes(cfg, "plaza", locale);
                  if (Math.random() > 0.4) {
                    v.speechText = pool[Math.floor(Math.random() * pool.length)];
                    v.speechDuration = 2800;
                  }
                }
              }
            } else {
              // Smooth gliding step
              v.x += (dx / dist) * stepDist;
              v.y += (dy / dist) * stepDist;
            }
            hasChanges = true;
          }
        } else if (v.state === "interacting_npc" || v.state === "interacting_peer") {
          v.stateTimer -= dt * 1000;
          if (v.stateTimer <= 0) {
            v.state = "resting";
            v.stateTimer = 3000 + Math.random() * 3000;
            v.partnerId = null;
            v.isWave = false;
            hasChanges = true;
            if (rendezvousRef.current) rendezvousRef.current = null;
          }
        }
      }

      if (hasChanges) {
        setVisitors([...currentList]);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [graph, locale]);

  // Click on visitor handler: turns to face player and pops a friendly quote
  const handleVisitorClick = (id: string) => {
    setVisitors(prev =>
      prev.map(v => {
        if (v.id === id) {
          const cfg = CHIBI_VISITORS.find(c => c.id === id)!;
          const quotes = getVisitorQuotes(cfg, "playerClick", locale);
          return {
            ...v,
            speechText: quotes[Math.floor(Math.random() * quotes.length)],
            speechDuration: 3500,
          };
        }
        return v;
      })
    );
  };

  return (
    <div className="hc-living-village-layer" aria-label="Living Village Visitors" data-living-village="v1">
      {/* 1. The 5 Autonomous Chibi Visitors */}
      {visitors.map(v => {
        const isMoving = v.state === "moving";
        const cfg = CHIBI_VISITORS.find(c => c.id === v.id);
        const sprite = (v.isWave && cfg?.waveSpriteUrl) ? cfg.waveSpriteUrl : (cfg?.spriteUrl || "");
        return (
          <div
            key={v.id}
            className="hc-chibi-visitor"
            data-visitor-id={v.id}
            data-facing={v.facing}
            data-moving={isMoving ? "true" : "false"}
            data-state={v.state}
            style={{
              transform: `translate3d(${Math.round(v.x - 29)}px, ${Math.round(v.y - 65)}px, 0)`,
              zIndex: Math.round(v.y),
            }}
            onClick={() => handleVisitorClick(v.id)}
            role="button"
            tabIndex={0}
            title={`${v.name} (${v.id}) · Nhấp để trò chuyện`}
            aria-label={`${v.name} đang đi dạo trong làng`}
          >
            {/* Soft Shadow */}
            <span className="hc-chibi-shadow" aria-hidden="true" />

            {/* Chibi Sprite */}
            <span
              className="hc-chibi-sprite"
              style={{
                backgroundImage: `url(${sprite})`,
              }}
              aria-hidden="true"
            />

            {/* Name Pill above head */}
            <span className="hc-chibi-name-pill">{v.name}</span>

            {/* Speech / Emote Bubble */}
            {v.speechText && (
              <div className="hc-chibi-speech-bubble" role="status" aria-live="polite">
                {v.speechText}
              </div>
            )}
          </div>
        );
      })}

      {/* 2. NPC Dynamic Response Speech Bubble (e.g. Botanist or Wellness Guide replying) */}
      {npcSpeech && (
        <div
          className="hc-npc-reply-bubble"
          style={{
            transform: `translate3d(${npcSpeech.x - 70}px, ${npcSpeech.y - 45}px, 0)`,
            zIndex: Math.round(npcSpeech.y) + 50,
          }}
          role="status"
          aria-live="polite"
        >
          {npcSpeech.text}
        </div>
      )}
    </div>
  );
}
