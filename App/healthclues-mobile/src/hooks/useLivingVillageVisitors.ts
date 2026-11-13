import { useState, useEffect, useRef, useCallback } from "react";

export interface SimulatedVisitor {
  id: string;
  name: string;
  roleTag: string;
  avatarKey: "chibi-anna" | "chibi-leo" | "chibi-mia" | "chibi-ben" | "chibi-lily";
  x: number;
  y: number;
  facing: "left" | "right";
  isWalking: boolean;
  speech: string | null;
  targetWpIndex: number;
  waypoints: Array<{ x: number; y: number }>;
  quotes: string[];
  restRemainingMs: number;
  speed: number;
}

const INITIAL_VISITORS: SimulatedVisitor[] = [
  {
    id: "visitor-anna",
    name: "Anna",
    roleTag: "Anna 🌿",
    avatarKey: "chibi-anna",
    x: 788,
    y: 414,
    facing: "right",
    isWalking: false,
    speech: null,
    targetWpIndex: 1,
    waypoints: [
      { x: 788, y: 414 },
      { x: 840, y: 480 },
      { x: 885, y: 490 },
      { x: 840, y: 480 },
      { x: 788, y: 414 },
    ],
    quotes: [
      "Chào bạn! Suối nguồn hôm nay trong mát quá ⛲",
      "Uống nước từng ngụm nhỏ giúp thanh lọc cơ thể nhé!",
      "Cùng nhau sống khỏe mỗi ngày nhé! ✨",
    ],
    restRemainingMs: 2500,
    speed: 46,
  },
  {
    id: "visitor-leo",
    name: "Leo",
    roleTag: "Leo 📚",
    avatarKey: "chibi-leo",
    x: 438,
    y: 430,
    facing: "left",
    isWalking: false,
    speech: null,
    targetWpIndex: 1,
    waypoints: [
      { x: 438, y: 430 },
      { x: 385, y: 365 },
      { x: 320, y: 290 },
      { x: 385, y: 365 },
      { x: 438, y: 430 },
    ],
    quotes: [
      "Mình vừa đọc được bài nghiên cứu về nhịp sinh học 📚",
      "Ngủ trước 11h đêm giúp phục hồi cơ thể tuyệt vời!",
      "Chào nhà thám hiểm, chúc bạn ngày an lành!",
    ],
    restRemainingMs: 5000,
    speed: 42,
  },
  {
    id: "visitor-mia",
    name: "Mia",
    roleTag: "Mia 🌸",
    avatarKey: "chibi-mia",
    x: 656,
    y: 617,
    facing: "right",
    isWalking: false,
    speech: null,
    targetWpIndex: 1,
    waypoints: [
      { x: 656, y: 617 },
      { x: 620, y: 470 },
      { x: 560, y: 490 },
      { x: 620, y: 470 },
      { x: 656, y: 617 },
    ],
    quotes: [
      "Quảng trường hôm nay lộng gió và hoa thơm ngát 🌸",
      "Đi dạo 15 phút mỗi ngày làm tinh thần nhẹ nhõm hẳn!",
      "Chúc bạn hoàn thành trọn vẹn mục tiêu hôm nay nhé!",
    ],
    restRemainingMs: 8000,
    speed: 44,
  },
  {
    id: "visitor-ben",
    name: "Ben",
    roleTag: "Ben 🔬",
    avatarKey: "chibi-ben",
    x: 1060,
    y: 430,
    facing: "left",
    isWalking: false,
    speech: null,
    targetWpIndex: 1,
    waypoints: [
      { x: 1060, y: 430 },
      { x: 990, y: 420 },
      { x: 935, y: 415 },
      { x: 990, y: 420 },
      { x: 1060, y: 430 },
    ],
    quotes: [
      "Vườn thảo dược hôm nay tỏa hương bạc hà rất dễ chịu 🌿",
      "Trà thảo mộc buổi tối giúp dễ ngủ và ấm bụng.",
      "Kiên trì từng bước nhỏ vì sức khỏe dẻo dai!",
    ],
    restRemainingMs: 4000,
    speed: 45,
  },
  {
    id: "visitor-lily",
    name: "Lily",
    roleTag: "Lily 💖",
    avatarKey: "chibi-lily",
    x: 1195,
    y: 648,
    facing: "left",
    isWalking: false,
    speech: null,
    targetWpIndex: 1,
    waypoints: [
      { x: 1195, y: 648 },
      { x: 1120, y: 648 },
      { x: 1040, y: 650 },
      { x: 1120, y: 648 },
      { x: 1195, y: 648 },
    ],
    quotes: [
      "Hít thở sâu 4-7-8 giúp xoa dịu thần kinh lắm đấy 💖",
      "Thả lỏng cơ vai và hít sâu một hơi nào!",
      "Chúc bạn một ngày ngập tràn bình an và sức sống!",
    ],
    restRemainingMs: 6500,
    speed: 48,
  },
  {
    id: "visitor-lucas",
    name: "Lucas",
    roleTag: "Lucas 🧭",
    avatarKey: "chibi-ben",
    x: 490,
    y: 442,
    facing: "right",
    isWalking: false,
    speech: null,
    targetWpIndex: 1,
    waypoints: [
      { x: 490, y: 442 },
      { x: 420, y: 490 },
      { x: 360, y: 470 },
      { x: 420, y: 490 },
      { x: 490, y: 442 },
    ],
    quotes: [
      "Chào bạn! Hành trình hôm nay thế nào rồi? 🧭",
      "Mỗi thói quen nhỏ đều mang lại sự tiến bộ lớn!",
      "Làng HealthClues hôm nay nhộn nhịp ghê!",
    ],
    restRemainingMs: 9000,
    speed: 40,
  },
];

interface UseLivingVillageVisitorsOptions {
  isScreenFocused?: boolean;
  zoomMode?: "close" | "overview";
  mode?: "exploration" | "overworld";
}

export function useLivingVillageVisitors({
  isScreenFocused = true,
  zoomMode = "close",
  mode = "exploration",
}: UseLivingVillageVisitorsOptions) {
  const [visitors, setVisitors] = useState<SimulatedVisitor[]>(INITIAL_VISITORS);
  const visitorsRef = useRef<SimulatedVisitor[]>(INITIAL_VISITORS);
  const speechTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    visitorsRef.current = visitors;
  }, [visitors]);

  // Main tick loop for ambient movement (runs at ~5 Hz, minimal CPU footprint)
  useEffect(() => {
    if (!isScreenFocused || zoomMode !== "close" || mode !== "exploration") {
      return;
    }

    const intervalMs = 200;
    const intervalSec = intervalMs / 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      let changed = false;

      const nextVisitors = visitorsRef.current.map((v) => {
        // If currently resting
        if (v.restRemainingMs > 0) {
          const nextRest = Math.max(0, v.restRemainingMs - intervalMs);
          const speechExpired = speechTimersRef.current[v.id] && now > speechTimersRef.current[v.id];
          const nextSpeech = speechExpired ? null : v.speech;

          if (nextRest !== v.restRemainingMs || nextSpeech !== v.speech) {
            changed = true;
            return {
              ...v,
              restRemainingMs: nextRest,
              isWalking: false,
              speech: nextSpeech,
            };
          }
          return v;
        }

        // Active movement towards current waypoint
        const targetWp = v.waypoints[v.targetWpIndex];
        if (!targetWp) return v;

        const dx = targetWp.x - v.x;
        const dy = targetWp.y - v.y;
        const dist = Math.hypot(dx, dy);

        // Check if arrived at waypoint
        if (dist <= 6) {
          changed = true;
          const nextIndex = (v.targetWpIndex + 1) % v.waypoints.length;
          const randomQuote = v.quotes[Math.floor(Math.random() * v.quotes.length)];
          // Set speech to show for 3.5s
          speechTimersRef.current[v.id] = now + 3500;

          return {
            ...v,
            x: targetWp.x,
            y: targetWp.y,
            targetWpIndex: nextIndex,
            isWalking: false,
            speech: randomQuote,
            restRemainingMs: 5000 + Math.floor(Math.random() * 4000),
          };
        }

        // Step forward
        changed = true;
        const step = Math.min(dist, v.speed * intervalSec);
        const nextX = v.x + (dx / dist) * step;
        const nextY = v.y + (dy / dist) * step;
        const nextFacing: "left" | "right" = dx > 1 ? "right" : dx < -1 ? "left" : v.facing;

        const speechExpired = speechTimersRef.current[v.id] && now > speechTimersRef.current[v.id];

        return {
          ...v,
          x: Math.round(nextX * 10) / 10,
          y: Math.round(nextY * 10) / 10,
          facing: nextFacing,
          isWalking: true,
          speech: speechExpired ? null : v.speech,
        };
      });

      if (changed) {
        visitorsRef.current = nextVisitors;
        setVisitors(nextVisitors);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isScreenFocused, zoomMode, mode]);

  // Handle direct tap on a simulated visitor
  const handleTapVisitor = useCallback((visitorId: string) => {
    const now = Date.now();
    setVisitors((prev) =>
      prev.map((v) => {
        if (v.id === visitorId) {
          const quote = v.quotes[Math.floor(Math.random() * v.quotes.length)];
          speechTimersRef.current[v.id] = now + 4000;
          return {
            ...v,
            isWalking: false,
            speech: quote,
            restRemainingMs: 4000,
          };
        }
        return v;
      })
    );
  }, []);

  return {
    visitors,
    handleTapVisitor,
  };
}
