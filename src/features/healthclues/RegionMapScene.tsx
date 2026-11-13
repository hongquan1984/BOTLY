"use client";

import { Backpack, BookOpen, Compass, Flame, Flower2, Footprints, Home, Landmark, MapPin, MessageCircle, Minus, Plus, RotateCcw, Sparkles, Star, TentTree, Utensils, X } from "lucide-react";
import { HealthCluesGameIcon, type HealthCluesGameIconName } from "@/components/healthclues/HealthCluesGameIcon";
import { useCallback, useEffect, useRef, useState } from "react";
import { HealthCluesPet, type PetRegion } from "./HealthCluesPet";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { REGION_ANCHORS, REGION_APPROACHES, REGION_NPCS, REGION_NAVIGATION, REGION_WORLD, type NavPoint } from "./region-navigation-data";
import { AmbientVillageVisitors } from "./AmbientVillageVisitors";
import { OnlineAdventurers, type MovementBroadcaster } from "./OnlineAdventurers";

export type RegionLandmark = "camp" | "knowledge" | "boss" | "rewards" | "nutrition" | "practices" | "movement";
export type GuideStep = "welcome" | "discovery_herbal" | "discovery_movement" | "discovery_practices" | "backpack" | "toolkit_summary" | "reminder_setup" | "knowledge" | null;

type Point = NavPoint;
type LandmarkData = { id: RegionLandmark; name: string; label: string; subtitle: string; x: number; y: number; approach: Point; Icon: typeof Home; gameIcon: string; npc?: "botanist" | "explorer" | "wellness" };
type Walk = { points: Point[]; index: number; landmark: RegionLandmark | null };

const WORLD = REGION_WORLD;
// One 16:9 world blueprint is shared by both painted scenes.
const CAMERA_OVERSCAN = 1;
const PLAYER_CLEARANCE = 12;
const WALK_CORRIDOR_HALF_WIDTH = 43;
const NAV_CELL = 16;
const NAV_SAMPLE = 4;
function responsiveSceneScale(width: number, height: number) {
  const widthScale = width / WORLD.width;
  const heightScale = height / WORLD.height;
  // Always cover the full viewport edge-to-edge (no letterbox black bars) in both portrait and landscape
  return Math.max(widthScale, heightScale);
}
const scenePoint = (key: keyof typeof REGION_ANCHORS): Point => ({ x: WORLD.width * REGION_ANCHORS[key].x / 100, y: WORLD.height * REGION_ANCHORS[key].y / 100 });
const sceneApproach = (key: keyof typeof REGION_APPROACHES): Point => ({ x: WORLD.width * REGION_APPROACHES[key].x / 100, y: WORLD.height * REGION_APPROACHES[key].y / 100 });
const sceneNpc = (key: keyof typeof REGION_NPCS): Point => ({ x: WORLD.width * REGION_NPCS[key].x / 100, y: WORLD.height * REGION_NPCS[key].y / 100 });

function createLandmarks(sleep: boolean): LandmarkData[] {
  const building = (
    id: RegionLandmark,
    key: keyof typeof REGION_ANCHORS,
    name: string,
    subtitle: string,
    Icon: typeof Home,
    gameIcon: string,
    approach: Point = sceneApproach(key)
  ): LandmarkData => ({
    id,
    name,
    label: ({
      camp: "Camp",
      nutrition: "Food Garden",
      movement: "Activity Trail",
      practices: "Wellness Sanctuary",
      knowledge: "Knowledge Library",
      boss: "Boss Challenge",
      rewards: "Rewards",
    })[id],
    subtitle,
    x: scenePoint(key).x,
    y: scenePoint(key).y,
    approach,
    Icon,
    gameIcon,
  });

  const npc = (
    id: RegionLandmark,
    key: keyof typeof REGION_ANCHORS,
    name: string,
    subtitle: string,
    Icon: typeof Home,
    gameIcon: string,
    character: "botanist" | "explorer" | "wellness"
  ): LandmarkData => ({
    ...building(id, key, name, subtitle, Icon, gameIcon, sceneApproach(key)),
    x: sceneNpc(character).x,
    y: sceneNpc(character).y,
    npc: character,
  });

  return [
    building("camp", "camp", sleep ? "Adventure Camp" : "Explorer Camp", "Backpack, Journal and Care Records", TentTree, "nav:camp", sceneApproach("camp")),
    npc("nutrition", "garden", "Food & Botanical Garden", "Food and botanical learning", Utensils, "inv:herbs", "botanist"),
    npc("movement", "activity", "Activity Trail", "Gentle activity discovery", Footprints, "inv:movement", "explorer"),
    npc("practices", "sanctuary", "Wellness Sanctuary", "Supportive practices", Flower2, "inv:lotus", "wellness"),
    building("knowledge", "library", sleep ? "Moonlight Library" : "Research Library", "Journey learning", BookOpen, "inv:book", sceneApproach("library")),
    building("boss", "boss", sleep ? "Night Owl Challenge" : "Knowledge Guardian", "Optional knowledge challenge", sleep ? Star : Flame, "boss:swords", sceneApproach("boss")),
    building("rewards", "rewards", sleep ? "Dream Observatory" : "Garden Conservatory", "Saved rewards and keepsakes", Landmark, "achieve:trophy", sceneApproach("rewards")),
  ];
}
const scenes: Record<PetRegion, { image: string; paths: Point[][]; bridges: Point[][]; start: Point; landmarks: LandmarkData[] }> = {
  "sleep-better": {
    image: "/healthclues/assets/regions/sleep-valley-scene-blueprint.webp",
    start: sceneApproach("hub"), paths: REGION_NAVIGATION["sleep-better"].walkablePaths,
    bridges: REGION_NAVIGATION["sleep-better"].bridgeDecks, landmarks: createLandmarks(true),
  },
  "health-concern": {
    image: "/healthclues/assets/regions/healthclues-realm-scene-blueprint.webp",
    start: sceneApproach("hub"), paths: REGION_NAVIGATION["health-concern"].walkablePaths,
    bridges: REGION_NAVIGATION["health-concern"].bridgeDecks, landmarks: createLandmarks(false),
  },
};


const npcArt = {
  botanist: { src: "/healthclues/assets/regions/npc-botanist-distinct.webp", name: "Botanist", greeting: "Welcome to my garden. We can explore educational topics connected to your journey." },
  explorer: { src: "/healthclues/assets/regions/npc-trail-explorer-distinct.webp", name: "Trail Explorer", greeting: "Welcome to the trail. Explore movement ideas at your own pace." },
  wellness: { src: "/healthclues/assets/regions/npc-wellness-guide-distinct.webp", name: "Wellness Guide", greeting: "Welcome. This sanctuary is a place to explore supportive practices." },
} as const;

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x; const dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length)) : 0;
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function insideWorld(point: Point) {
  return point.x >= PLAYER_CLEARANCE && point.y >= PLAYER_CLEARANCE && point.x <= WORLD.width - PLAYER_CLEARANCE && point.y <= WORLD.height - PLAYER_CLEARANCE;
}

function walkable(point: Point, paths: Point[][]) {
  if (!insideWorld(point)) return false;
  const maxDistance = WALK_CORRIDOR_HALF_WIDTH - PLAYER_CLEARANCE;
  return paths.some(path => path.slice(1).some((end, index) => distanceToSegment(point, path[index], end) <= maxDistance));
}

function segmentIsWalkable(start: Point, end: Point, paths: Point[][]) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const samples = Math.max(1, Math.ceil(distance / NAV_SAMPLE));
  for (let index = 0; index <= samples; index++) {
    const progress = index / samples;
    if (!walkable({ x: start.x + (end.x - start.x) * progress, y: start.y + (end.y - start.y) * progress }, paths)) return false;
  }
  return true;
}

function closestCell(point: Point, paths: Point[][]): Point | null {
  const cols = Math.ceil(WORLD.width / NAV_CELL); const rows = Math.ceil(WORLD.height / NAV_CELL);
  const cellX = Math.floor(point.x / NAV_CELL); const cellY = Math.floor(point.y / NAV_CELL);
  let best: Point | null = null; let bestDistance = Number.POSITIVE_INFINITY;
  for (let y = Math.max(0, cellY - 2); y <= Math.min(rows - 1, cellY + 2); y++) for (let x = Math.max(0, cellX - 2); x <= Math.min(cols - 1, cellX + 2); x++) {
    const center = { x: x * NAV_CELL + NAV_CELL / 2, y: y * NAV_CELL + NAV_CELL / 2 };
    if (!walkable(center, paths)) continue;
    const distance = Math.hypot(center.x - point.x, center.y - point.y);
    if (distance < bestDistance) { best = center; bestDistance = distance; }
  }
  return best && bestDistance <= NAV_CELL ? best : null;
}

function findPath(from: Point, destination: Point, paths: Point[][]): Point[] {
  // Neither endpoints nor any point between route nodes may be snapped through an obstacle.
  if (!walkable(from, paths) || !walkable(destination, paths)) return [];
  const start = closestCell(from, paths); const finish = closestCell(destination, paths);
  if (!start || !finish || !segmentIsWalkable(from, start, paths) || !segmentIsWalkable(finish, destination, paths)) return [];
  const cols = Math.ceil(WORLD.width / NAV_CELL); const rows = Math.ceil(WORLD.height / NAV_CELL);
  const key = (p: Point) => `${Math.floor(p.x / NAV_CELL)},${Math.floor(p.y / NAV_CELL)}`;
  const parse = (value: string): Point => { const [x, y] = value.split(",").map(Number); return { x: x * NAV_CELL + NAV_CELL / 2, y: y * NAV_CELL + NAV_CELL / 2 }; };
  const startKey = key(start); const goalKey = key(finish);
  if (startKey === goalKey) return segmentIsWalkable(from, destination, paths) ? [from, destination] : [];
  const open = new Set([startKey]); const cameFrom = new Map<string, string>(); const g = new Map([[startKey, 0]]);
  const h = (p: Point) => Math.hypot(p.x - finish.x, p.y - finish.y) / NAV_CELL;
  const f = new Map([[startKey, h(start)]]); const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let safety = cols * rows * 2;
  while (open.size && safety-- > 0) {
    let current = ""; let lowest = Number.POSITIVE_INFINITY;
    for (const node of open) { const score = f.get(node) ?? Infinity; if (score < lowest) { lowest = score; current = node; } }
    if (current === goalKey) {
      const route: Point[] = [destination, finish]; let cursor = current;
      while (cameFrom.has(cursor)) { cursor = cameFrom.get(cursor)!; route.push(cursor === startKey ? start : parse(cursor)); }
      route.push(from);
      const result = route.reverse();
      return result.every((point, index) => index === 0 || segmentIsWalkable(result[index - 1], point, paths)) ? result : [];
    }
    open.delete(current); const at = parse(current);
    for (const [dx, dy] of dirs) {
      const next = { x: at.x + dx * NAV_CELL, y: at.y + dy * NAV_CELL };
      if (!walkable(next, paths) || !segmentIsWalkable(at, next, paths)) continue;
      if (dx && dy) {
        const horizontal = { x: at.x + dx * NAV_CELL, y: at.y };
        const vertical = { x: at.x, y: at.y + dy * NAV_CELL };
        if (!walkable(horizontal, paths) || !walkable(vertical, paths)) continue;
      }
      const nextKey = key(next); const candidate = (g.get(current) ?? Infinity) + (dx && dy ? 1.414 : 1);
      if (candidate >= (g.get(nextKey) ?? Infinity)) continue;
      cameFrom.set(nextKey, current); g.set(nextKey, candidate); f.set(nextKey, candidate + h(next)); open.add(nextKey);
    }
  }
  // Never fall back to a straight line: an unreachable destination must stay unreachable.
  return [];
}

export type ActiveTalkPrompt = {
  landmarkId: RegionLandmark;
  name: string;
  subtitle: string;
  npcName?: string;
  greeting?: string;
  npcSrc?: string;
  gameIcon?: HealthCluesGameIconName | string;
  onAction: () => void;
  onClose: () => void;
};

export function RegionMapScene({ region, journeyTopic, nickname = "", journeyGoal = "", onLandmark, onBack, onMyJourney, highlightMyJourney = false, onGuideReminderSetup, unlockedRewards = 0, guideStep = null, guidedLandmark = null, tourFocusLandmark = null, onGuideNext, onGuideSkip, onGuideHelp, onGuideClose, paused = false, suppressLegacyHud = false, onOnlineCountChange, onActiveTalkChange }: { region: PetRegion; journeyTopic: string; nickname?: string; journeyGoal?: string; onLandmark: (landmark: RegionLandmark) => void; onBack: () => void; onMyJourney: () => void; highlightMyJourney?: boolean; onGuideReminderSetup?: () => void; unlockedRewards?: number; guideStep?: GuideStep; guidedLandmark?: RegionLandmark | null; tourFocusLandmark?: RegionLandmark | null; onGuideNext?: (step: Exclude<GuideStep, null> | "completed") => void; onGuideSkip?: () => void; onGuideHelp?: () => void; onGuideClose?: () => void; paused?: boolean; suppressLegacyHud?: boolean; onOnlineCountChange?: (count: number) => void; onActiveTalkChange?: (talk: ActiveTalkPrompt | null) => void }) {
  const { locale, text } = useHealthCluesLocale();
  const isVi = locale === "vi";
  const config = scenes[region]; const sleep = region === "sleep-better"; const petName = sleep ? "Luna" : "Lumi"; const place = sleep ? "Sleep Valley" : "HealthClues Realm";
  const viewportRef = useRef<HTMLElement>(null); const worldRef = useRef<HTMLDivElement>(null); const playerRef = useRef<HTMLDivElement>(null); const petRef = useRef<HTMLDivElement>(null);
  const currentPosition = useRef<Point>(config.start); const petPosition = useRef<Point>({ x: config.start.x - 70, y: config.start.y });
  const walkRef = useRef<Walk | null>(null); const petWalkRef = useRef<Point[] | null>(null); const petWalkIndex = useRef(1); const petNextRouteAt = useRef(0); const cameraRef = useRef({ x: 0, y: 0, scale: 1, manualUntil: 0 }); const cameraReady = useRef(false); const lastFrame = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number; dragged: boolean }>()); const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const [walking, setWalking] = useState(false); const [nearby, setNearby] = useState<RegionLandmark | null>(null); const [arrived, setArrived] = useState(""); const [travelTarget, setTravelTarget] = useState<RegionLandmark | null>(null);
  const [contextLandmark, setContextLandmark] = useState<RegionLandmark | null>(null);
  const [navDebug, setNavDebug] = useState(false); const [debugRoute, setDebugRoute] = useState<Point[]>([]); const [debugPlayer, setDebugPlayer] = useState<Point>(config.start);
  const [navOutcome, setNavOutcome] = useState<"idle" | "routed" | "blocked">("idle");
  const reducedMotion = useRef(false);
  const movementBroadcasterRef = useRef<MovementBroadcaster | null>(null);
  const lastBroadcastTime = useRef(0);

  const cameraFor = useCallback((pos: Point, scale: number): { x: number; y: number; scale: number } => {
    const rect = viewportRef.current?.getBoundingClientRect(); if (!rect) return { x: 0, y: 0, scale: 1 };
    const totalScale = responsiveSceneScale(rect.width, rect.height) * scale * CAMERA_OVERSCAN;
    let x = rect.width / 2 - pos.x * totalScale; let y = rect.height / 2 - pos.y * totalScale;
    const width = WORLD.width * totalScale; const height = WORLD.height * totalScale;
    x = width <= rect.width ? (rect.width - width) / 2 : Math.max(rect.width - width, Math.min(0, x));
    y = height <= rect.height ? (rect.height - height) / 2 : Math.max(rect.height - height, Math.min(0, y));
    return { x, y, scale: totalScale };
  }, []);

  const beginWalk = useCallback((destination: Point, landmark: RegionLandmark | null = null) => {
    const route = findPath(currentPosition.current, destination, config.paths);
    if (viewportRef.current) delete viewportRef.current.dataset.movementStop;
    setDebugRoute(route);
    setNavOutcome(route.length ? "routed" : "blocked");
    if (!route.length) {
      walkRef.current = null;
      setNearby(null);
      setWalking(false);
      setTravelTarget(null);
      setArrived("There is no safe path to that destination. Choose another place.");
      return;
    }
    walkRef.current = { points: route, index: 1, landmark };
    setNearby(null); setArrived(""); setTravelTarget(landmark); setWalking(route.length > 1);
    if (route.length <= 1 && landmark) setNearby(landmark);
    const faceDir = destination.x < currentPosition.current.x ? "left" : "right";
    movementBroadcasterRef.current?.(currentPosition.current.x, currentPosition.current.y, route.length > 1, faceDir);
  }, [config.paths]);

  const beginLandmarkTravel = useCallback((id: RegionLandmark) => {
    const place = config.landmarks.find(item => item.id === id); if (!place) return;
    beginWalk(place.approach, id);
  }, [beginWalk, config.landmarks]);

  useEffect(() => {
    const localHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const frame = window.requestAnimationFrame(() => setNavDebug(localHost && new URLSearchParams(window.location.search).get("navDebug") === "1"));
    const toggleDebug = (event: KeyboardEvent) => {
      if (!localHost || (event.target instanceof HTMLElement && event.target.closest("input,textarea,select,[contenteditable=true]"))) return;
      if (event.key.toLowerCase() === "n") setNavDebug(value => !value);
    };
    window.addEventListener("keydown", toggleDebug);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("keydown", toggleDebug); };
  }, []);

  useEffect(() => {
    if (!navDebug) return;
    const timer = window.setInterval(() => setDebugPlayer({ ...currentPosition.current }), 100);
    return () => window.clearInterval(timer);
  }, [navDebug]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)"); reducedMotion.current = media.matches;
    const change = () => { reducedMotion.current = media.matches; }; media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    let frame = 0;
    const render = (now: number) => {
      const dt = Math.min(.05, Math.max(0, (now - (lastFrame.current || now)) / 1000)); lastFrame.current = now;
      const currentWalk = walkRef.current;
      if (!paused && currentWalk && currentWalk.index < currentWalk.points.length) {
        let remaining = 150 * dt;
        while (remaining > 0 && currentWalk.index < currentWalk.points.length) {
          const next = currentWalk.points[currentWalk.index]; const here = currentPosition.current; const dist = Math.hypot(next.x - here.x, next.y - here.y);
          if (dist <= remaining + .5) { currentPosition.current = next; remaining -= dist; currentWalk.index++; }
          else {
            const t = remaining / dist; const candidate = { x: here.x + (next.x - here.x) * t, y: here.y + (next.y - here.y) * t };
            if (!segmentIsWalkable(here, candidate, config.paths)) { if (viewportRef.current) viewportRef.current.dataset.movementStop = `${here.x.toFixed(1)},${here.y.toFixed(1)}>${candidate.x.toFixed(1)},${candidate.y.toFixed(1)}|route:${currentWalk.index}/${currentWalk.points.length}`; walkRef.current = null; setWalking(false); setTravelTarget(null); setArrived("Travel stopped at an unsafe map boundary."); setDebugRoute([]); }
            else currentPosition.current = candidate;
            remaining = 0;
          }
        }
        if (currentWalk.index >= currentWalk.points.length) {
          walkRef.current = null; setWalking(false);
          if (currentWalk.landmark) { setNearby(currentWalk.landmark); const landmark = config.landmarks.find(item => item.id === currentWalk.landmark); setArrived(landmark?.name || "You have arrived."); }
          const face = playerRef.current?.dataset.facing === "left" ? "left" : "right";
          movementBroadcasterRef.current?.(currentPosition.current.x, currentPosition.current.y, false, face);
        } else if (now - lastBroadcastTime.current > 160) {
          lastBroadcastTime.current = now;
          const face = playerRef.current?.dataset.facing === "left" ? "left" : "right";
          movementBroadcasterRef.current?.(currentPosition.current.x, currentPosition.current.y, true, face);
        }
      }
      const player = currentPosition.current;
      if (!paused) {
        const deltaX = player.x - petPosition.current.x; const deltaY = player.y - petPosition.current.y;
        const delta = Math.hypot(deltaX, deltaY);
        const followTarget = delta > 1 ? { x: player.x - deltaX / delta * 86, y: player.y - deltaY / delta * 86 } : player;
        if (delta > 125 && !petWalkRef.current && now >= petNextRouteAt.current) {
          const route = findPath(petPosition.current, followTarget, config.paths);
          petNextRouteAt.current = now + (route.length ? 220 : 900);
          if (route.length > 1) { petWalkRef.current = route; petWalkIndex.current = 1; }
        }
        const petRoute = petWalkRef.current;
        if (petRoute && petWalkIndex.current < petRoute.length) {
          let petRemaining = (reducedMotion.current ? 260 : 185) * dt;
          while (petRemaining > 0 && petWalkIndex.current < petRoute.length) {
            const next = petRoute[petWalkIndex.current]; const here = petPosition.current; const distance = Math.hypot(next.x - here.x, next.y - here.y);
            if (distance <= petRemaining + .5) { petPosition.current = next; petRemaining -= distance; petWalkIndex.current++; }
            else {
              const ratio = petRemaining / distance; const candidate = { x: here.x + (next.x - here.x) * ratio, y: here.y + (next.y - here.y) * ratio };
              if (segmentIsWalkable(here, candidate, config.paths)) petPosition.current = candidate;
              else petWalkRef.current = null;
              petRemaining = 0;
            }
          }
          if (petWalkIndex.current >= petRoute.length) petWalkRef.current = null;
        }
        const following = Math.hypot(player.x - petPosition.current.x, player.y - petPosition.current.y);
        if (following > 10 && petRef.current) petRef.current.classList.add("is-following"); else petRef.current?.classList.remove("is-following");
      }
      const tourLandmark = tourFocusLandmark ? config.landmarks.find(item => item.id === tourFocusLandmark) : null;
      const desired = cameraFor(tourLandmark?.approach ?? player, cameraRef.current.scale);
      if (!cameraReady.current) { cameraRef.current.x = desired.x; cameraRef.current.y = desired.y; cameraReady.current = true; }
      if (now > cameraRef.current.manualUntil) {
        const factor = reducedMotion.current ? 1 : .13;
        cameraRef.current.x += (desired.x - cameraRef.current.x) * factor; cameraRef.current.y += (desired.y - cameraRef.current.y) * factor;
      }
      const totalScale = desired.scale;
      if (worldRef.current) worldRef.current.style.transform = `translate3d(${cameraRef.current.x}px,${cameraRef.current.y}px,0) scale(${totalScale})`;
      if (playerRef.current) {
        playerRef.current.style.transform = `translate3d(${player.x}px,${player.y}px,0) translateX(-50%)`; playerRef.current.style.zIndex = String(Math.round(player.y));
        playerRef.current.dataset.worldX = player.x.toFixed(1); playerRef.current.dataset.worldY = player.y.toFixed(1);
        const nextPoint = walkRef.current?.points[walkRef.current.index];
        if (nextPoint && Math.abs(nextPoint.x - player.x) > .1) playerRef.current.dataset.facing = nextPoint.x < player.x ? "left" : "right";
        if (Math.hypot((walkRef.current?.points[walkRef.current.index]?.x ?? player.x) - player.x, (walkRef.current?.points[walkRef.current.index]?.y ?? player.y) - player.y) > .5) playerRef.current.dataset.walking = "true";
        else playerRef.current.dataset.walking = "false";
      }
      if (petRef.current) { petRef.current.style.transform = `translate3d(${petPosition.current.x}px,${petPosition.current.y}px,0) translateX(-50%)`; petRef.current.style.zIndex = String(Math.round(petPosition.current.y)); petRef.current.dataset.worldX = petPosition.current.x.toFixed(1); petRef.current.dataset.worldY = petPosition.current.y.toFixed(1); }
      if (viewportRef.current) { viewportRef.current.dataset.playerX = player.x.toFixed(1); viewportRef.current.dataset.playerY = player.y.toFixed(1); viewportRef.current.dataset.cameraX = cameraRef.current.x.toFixed(1); viewportRef.current.dataset.cameraY = cameraRef.current.y.toFixed(1); viewportRef.current.dataset.cameraScale = totalScale.toFixed(3); }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [cameraFor, config.landmarks, config.paths, paused, tourFocusLandmark]);

  const setZoom = (factor: number) => { cameraRef.current.scale = Math.max(.8, Math.min(1.55, cameraRef.current.scale * factor)); };
  const pointFromClient = (clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect(); if (!rect) return config.start;
    const fitScale = responsiveSceneScale(rect.width, rect.height) * cameraRef.current.scale * CAMERA_OVERSCAN;
    return { x: (clientX - rect.left - cameraRef.current.x) / fitScale, y: (clientY - rect.top - cameraRef.current.y) / fitScale };
  };
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button,[data-game-ui]")) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, dragged: false });
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer may already have ended. */ }
    if (pointers.current.size === 2) { const pair = [...pointers.current.values()]; for (const point of pointers.current.values()) point.dragged = true; pinch.current = { distance: Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y), zoom: cameraRef.current.scale }; }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const item = pointers.current.get(event.pointerId); if (!item) return;
    item.x = event.clientX; item.y = event.clientY;
    if (pointers.current.size >= 2 && pinch.current) {
      const pair = [...pointers.current.values()]; const distance = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
      cameraRef.current.scale = Math.max(.8, Math.min(1.55, pinch.current.zoom * distance / Math.max(1, pinch.current.distance))); event.preventDefault();
    } else if (Math.hypot(item.x - item.startX, item.y - item.startY) > 10) {
      item.dragged = true; cameraRef.current.x += event.movementX; cameraRef.current.y += event.movementY; cameraRef.current.manualUntil = performance.now() + 1300;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const scale = responsiveSceneScale(rect.width, rect.height) * cameraRef.current.scale * CAMERA_OVERSCAN;
        const scaledWidth = WORLD.width * scale; const scaledHeight = WORLD.height * scale;
        cameraRef.current.x = scaledWidth <= rect.width ? (rect.width - scaledWidth) / 2 : Math.min(0, Math.max(rect.width - scaledWidth, cameraRef.current.x));
        cameraRef.current.y = scaledHeight <= rect.height ? (rect.height - scaledHeight) / 2 : Math.min(0, Math.max(rect.height - scaledHeight, cameraRef.current.y));
      }
    }
  };
  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const item = pointers.current.get(event.pointerId); if (item && !item.dragged && pointers.current.size === 1 && !paused) beginWalk(pointFromClient(event.clientX, event.clientY));
    pointers.current.delete(event.pointerId); if (pointers.current.size < 2) pinch.current = null;
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button,input,textarea,select")) return;
    if (paused || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) return;
    event.preventDefault(); const delta = 150; const key = event.key.toLowerCase();
    beginWalk({ x: currentPosition.current.x + (key === "a" || key === "arrowleft" ? -delta : key === "d" || key === "arrowright" ? delta : 0), y: currentPosition.current.y + (key === "w" || key === "arrowup" ? -delta : key === "s" || key === "arrowdown" ? delta : 0) });
  };

  const sleepGoal = journeyTopic.startsWith("Sleep & rest · ") ? journeyTopic.slice("Sleep & rest · ".length) : "your sleep goals";
  const guideTravel = guideStep === "discovery_herbal" ? "nutrition" : guideStep === "discovery_movement" ? "movement" : guideStep === "discovery_practices" ? "practices" : guideStep === "knowledge" ? "knowledge" : guideStep === "backpack" ? "camp" : null;
  const activeLandmark = nearby ? config.landmarks.find(item => item.id === nearby) : null;
  const activeNpc = activeLandmark?.npc ? npcArt[activeLandmark.npc] : null;

  useEffect(() => {
    if (activeLandmark) {
      document.body.classList.add("hc-has-active-talk");
      if (suppressLegacyHud) {
        onActiveTalkChange?.({
          landmarkId: activeLandmark.id,
          name: activeLandmark.name,
          subtitle: activeLandmark.subtitle,
          npcName: activeNpc?.name,
          greeting: activeNpc?.greeting,
          npcSrc: activeNpc?.src,
          gameIcon: activeLandmark.gameIcon,
          onAction: () => {
            const id = activeLandmark.id;
            setNearby(null);
            setArrived("");
            setTravelTarget(null);
            onLandmark(id);
          },
          onClose: () => {
            setNearby(null);
            setArrived("");
            setTravelTarget(null);
          },
        });
      }
    } else {
      document.body.classList.remove("hc-has-active-talk");
      if (suppressLegacyHud) {
        onActiveTalkChange?.(null);
      }
    }
    return () => {
      document.body.classList.remove("hc-has-active-talk");
      if (suppressLegacyHud) {
        onActiveTalkChange?.(null);
      }
    };
  }, [activeLandmark, activeNpc, suppressLegacyHud, onActiveTalkChange, onLandmark, locale]);

  const toPoints = (points: Point[]) => points.map(point => `${point.x},${point.y}`).join(" ");
  return <section ref={viewportRef} className={`hc-region-scene hc-rpg-exploration ${sleep ? "hc-region-sleep" : "hc-region-health"}`} aria-label={`${place} explorable game world`} data-region-map={region} data-nav-debug={navDebug} data-nav-result={navOutcome} tabIndex={0} onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={event => { if ((event.target as HTMLElement).closest("[data-game-ui]")) return; event.preventDefault(); setZoom(event.deltaY < 0 ? 1.08 : .92); }}>
    <div ref={worldRef} className="hc-rpg-world" data-rpg-world style={{ width: WORLD.width, height: WORLD.height }}>
      <img className="hc-rpg-background" src={config.image} alt="" draggable={false} onError={event => { event.currentTarget.dataset.assetError = "true"; }}/>
      <div className="hc-rpg-world-vignette" aria-hidden="true"/>
      {navDebug && <svg className="hc-rpg-nav-debug" viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} aria-hidden="true" data-nav-overlay>
        <rect width={WORLD.width} height={WORLD.height} fill="#fa2633" opacity=".12"/>
        <text x="18" y="30" fill="#fff" stroke="#06201b" strokeWidth="5" paintOrder="stroke" fontSize="18" fontWeight="900">WALKABLE CENTERLINE + CLEARANCE · OUTSIDE NETWORK BLOCKED</text>
        {config.paths.map((path, index) => <g key={`path-${index}`}><polyline points={toPoints(path)} fill="none" stroke="#14d77b" strokeOpacity=".55" strokeWidth={(WALK_CORRIDOR_HALF_WIDTH - PLAYER_CLEARANCE) * 2} strokeLinecap="round" strokeLinejoin="round"/><polyline points={toPoints(path)} fill="none" stroke="#d9ffe9" strokeOpacity=".95" strokeWidth="2" strokeDasharray="7 6"/></g>)}
        {config.bridges.map((bridge, index) => <g key={`bridge-${index}`}><polyline data-bridge-deck={toPoints(bridge)} points={toPoints(bridge)} fill="none" stroke="#19d9ff" strokeOpacity=".9" strokeWidth="21" strokeLinecap="round" strokeLinejoin="round"/><polyline points={toPoints(bridge)} fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="6 5"/><text x={bridge[0].x} y={bridge[0].y - 18} fill="#fff" stroke="#06151a" strokeWidth="4" paintOrder="stroke" fontSize="13" fontWeight="900">AUTHORED BRIDGE DECK</text></g>)}
        {config.paths.flatMap((path, pathIndex) => path.slice(1).map((point, index) => <circle key={`node-${pathIndex}-${index}`} cx={point.x} cy={point.y} r="5" fill="#52e5ff" stroke="#06221c" strokeWidth="2"/>))}
        {config.landmarks.map(item => <g key={`approach-${item.id}`}><circle cx={item.approach.x} cy={item.approach.y} r={PLAYER_CLEARANCE} fill="#ffbd3888" stroke="#fff2b9" strokeWidth="3"/><text x={item.approach.x + 14} y={item.approach.y - 14} fill="white" stroke="#17100a" strokeWidth="4" paintOrder="stroke" fontSize="13" fontWeight="900">{item.id} approach</text></g>)}
        {debugRoute.length > 1 && <polyline data-route-points={toPoints(debugRoute)} points={toPoints(debugRoute)} fill="none" stroke="#ff38df" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>}
        <circle cx={debugPlayer.x} cy={debugPlayer.y} r={PLAYER_CLEARANCE} fill="#fff" stroke="#101820" strokeWidth="4"/><text x={debugPlayer.x + 14} y={debugPlayer.y + 28} fill="white" stroke="#101820" strokeWidth="4" paintOrder="stroke" fontSize="14" fontWeight="900">PLAYER FEET</text>
        {travelTarget && <circle cx={config.landmarks.find(item => item.id === travelTarget)?.approach.x} cy={config.landmarks.find(item => item.id === travelTarget)?.approach.y} r="20" fill="none" stroke="#ff38df" strokeWidth="5"/>}
      </svg>}
      {config.landmarks.map(({ id, name, label: compactName, subtitle, x, y, approach, Icon, gameIcon, npc }) => <div className={`hc-rpg-location ${npc ? "hc-rpg-location-npc" : ""}`} key={id} style={{ left: x, top: y, zIndex: Math.round(y) }} data-landmark-id={id} data-guide-target={guidedLandmark === id ? "true" : undefined} data-context-visible={(guidedLandmark ?? guideTravel ?? contextLandmark ?? travelTarget ?? nearby) === id} data-approach-x={approach.x} data-approach-y={approach.y} data-approach-valid={walkable(approach, config.paths)} onPointerEnter={() => setContextLandmark(id)} onPointerLeave={() => setContextLandmark(value => value === id ? null : value)} onFocus={() => setContextLandmark(id)} onBlur={() => setContextLandmark(null)}>
        {npc ? <>
          <button type="button" className="hc-rpg-npc" data-npc={npc} data-character-id={`npc-${npc}`} aria-label={text(`Approach ${npcArt[npc].name} at ${name}`)} onClick={() => beginLandmarkTravel(id)}>
            <img src={npcArt[npc].src} alt="" draggable={false}/>
          </button>
        </> : <button type="button" className="hc-rpg-building" data-landmark={id} aria-label={`Walk to ${name}. ${subtitle}`} onClick={() => beginLandmarkTravel(id)}><span className="hc-rpg-building-seal"><HealthCluesGameIcon icon={gameIcon} size={22} tone="amber"/></span></button>}
        <button type="button" className="hc-rpg-location-name hc-rpg-location-pill" onClick={() => beginLandmarkTravel(id)} aria-label={text(`Walk to ${name}`)}>
          <span className="hc-rpg-location-pill-icon"><HealthCluesGameIcon icon={id === "nutrition" ? "inv:herbs" : id === "knowledge" ? "inv:book" : id === "practices" ? "inv:lotus" : gameIcon} size={16} tone="amber"/></span>
          <span className="hc-rpg-location-pill-text">
            <strong>
              {id === "nutrition" ? (isVi ? "Nhà Thực Vật Học" : "Botanist")
                : id === "knowledge" ? (isVi ? "Kho Tri Thức" : "Knowledge Library")
                : id === "practices" ? (isVi ? "Người Hướng Dẫn" : "Wellness Guide")
                : text(compactName)}
            </strong>
            <small>
              {id === "nutrition" ? (isVi ? "Vườn Dược Thảo" : "Botanical Garden")
                : id === "knowledge" ? (isVi ? "Thư Viện Nghiên Cứu" : "Research Library")
                : id === "practices" ? (isVi ? "Khu Tĩnh Tâm" : "Sanctuary")
                : text(subtitle)}
            </small>
          </span>
        </button>
      </div>)}
      <div ref={petRef} className="hc-rpg-pet-actor" data-pet-follow={sleep ? "luna" : "lumi"}><HealthCluesPet region={region} topic={journeyTopic} pose="guide"/><span className="hc-rpg-pet-world-name">{petName}</span></div>
      {/* 5 Autonomous Living Village Visitors */}
      <AmbientVillageVisitors region={region} />
      {/* Realtime Synchronous Online Adventurers */}
      <OnlineAdventurers
        region={region}
        myPosition={currentPosition.current}
        walking={walking}
        facing={playerRef.current?.dataset.facing === "left" ? "left" : "right"}
        nickname={nickname}
        onOnlineCountChange={onOnlineCountChange}
        onRegisterBroadcaster={(fn) => { movementBroadcasterRef.current = fn; }}
      />
      <div ref={playerRef} className="hc-rpg-player is-chibi-adventurer" data-player-actor data-character-id="player-blue-adventurer" data-world-x={config.start.x} data-world-y={config.start.y} data-walking="false" role="img" aria-label={`Your adventurer in ${place}`}><span className="hc-rpg-player-shadow" aria-hidden="true"/><span className="hc-rpg-player-sprite" aria-hidden="true"/><span className="hc-rpg-player-name">{nickname || "You"}</span></div>
    </div>

    {!suppressLegacyHud && <div className="hc-region-hud" data-game-ui><div className="hc-region-left-nav"><button type="button" onClick={onBack} className="hc-region-back"><HealthCluesGameIcon icon="nav:compass" size={16} tone="amber"/> {text("World Map")}</button><button type="button" onClick={onMyJourney} className={`hc-region-my-journey ${highlightMyJourney ? "is-spotlight" : ""}`} data-my-journey-button aria-label={text("My Journey")} title={text("Open My Journey")}><HealthCluesGameIcon icon="backpack" tone="gold"/><span className="hc-my-journey-full-label">{text("My Journey")}</span><span className="hc-my-journey-mobile-label">{text("Journey")}</span></button></div><div className="hc-region-title"><span>{place}</span><strong>{journeyTopic}</strong></div><span className="hc-region-hud-pill"><HealthCluesGameIcon icon="quest:star" size={14} tone="amber"/>{unlockedRewards} {text("rewards")}</span></div>}
    {!suppressLegacyHud && <div className="hc-rpg-help" data-game-ui><MapPin size={14}/><span>{text("Tap or click a path to walk · drag to look around · pinch or use + / − to zoom")}</span></div>}
    {navDebug && <div className="hc-rpg-debug-badge" data-game-ui>Navigation debug ON · press N to hide</div>}
    {arrived.startsWith("There is no safe path") && <p className="hc-rpg-nav-toast" data-game-ui role="status">That spot is blocked or disconnected from a safe path.</p>}

    {!suppressLegacyHud && activeLandmark && activeNpc && (
      <div className="hc-rpg-talk" data-game-ui data-interact-landmark={activeLandmark.id} role="status">
        <div className="hc-rpg-talk-avatar" aria-hidden="true">
          <img src={activeNpc.src} alt="" className="hc-rpg-talk-avatar-img" />
        </div>
        <div className="hc-rpg-talk-copy">
          <span>{text(activeNpc.name)} · {text(activeLandmark.name)}</span>
          <strong>{text(activeNpc.greeting)}</strong>
        </div>
        <button
          type="button"
          className="hc-rpg-talk-action-btn"
          onClick={() => {
            const id = activeLandmark.id;
            setNearby(null);
            setArrived("");
            setTravelTarget(null);
            onLandmark(id);
          }}
        >
          <MessageCircle size={14} />
          <span>{text("Talk")}</span>
        </button>
      </div>
    )}
    {!suppressLegacyHud && activeLandmark && !activeNpc && (
      <div className="hc-rpg-talk" data-game-ui data-interact-landmark={activeLandmark.id} role="status">
        <div className="hc-rpg-talk-avatar is-landmark" aria-hidden="true">
          <HealthCluesGameIcon icon={activeLandmark.gameIcon} size={18} tone="amber" />
        </div>
        <div className="hc-rpg-talk-copy">
          <span>{text("You arrived")}</span>
          <strong>{text(activeLandmark.name)}</strong>
        </div>
        <button
          type="button"
          className="hc-rpg-talk-action-btn"
          onClick={() => {
            const id = activeLandmark.id;
            setNearby(null);
            setArrived("");
            onLandmark(id);
          }}
        >
          <Compass size={14} />
          <span>{text("Interact")}</span>
        </button>
      </div>
    )}
    {travelTarget && !nearby && <p className="hc-rpg-travel-status" aria-live="polite" data-travel-target={travelTarget}>{walking ? `${text("Walking to")} ${text(config.landmarks.find(item => item.id === travelTarget)?.name || "your destination")}…` : text("Destination reached")}</p>}

    {!suppressLegacyHud && <aside className={`hc-region-companion ${activeLandmark ? "hc-rpg-companion-arrival" : ""} ${paused ? "hc-region-companion-suppressed" : ""}`} data-game-ui data-guide-step={guideStep ?? "closed"}><HealthCluesPet region={region} topic={journeyTopic} pose="guide"/><div className="hc-companion-dialogue" aria-live="polite">
      {guideStep === "welcome" ? <><p>{petName} is your companion</p><strong>{`Welcome${nickname ? `, ${nickname}` : ""}! I’m ${petName}.`}</strong><small>{sleep ? "We can explore sleep learning, activity and wellness at your pace." : `You said you want to explore ${journeyTopic}${journeyGoal ? ` and ${journeyGoal}` : ""}. This is your self-reported interest, not a diagnosis. We can explore food, activity and wellness.`}</small><div className="hc-guide-actions"><button type="button" className="hc-guide-primary" onClick={() => onGuideNext?.("discovery_herbal")}>Follow Lumi</button><button type="button" onClick={onGuideSkip}>Explore freely</button><button type="button" onClick={onGuideSkip}>Skip tour</button></div></>
        : guideStep === "discovery_herbal" ? <><p>{petName} suggests</p><strong>Visit the Food & Botanical Garden.</strong><small>Walk there to meet the Botanist and browse education related to your saved journey.</small><button type="button" className="hc-guide-primary" onClick={() => guideTravel && beginLandmarkTravel(guideTravel)}><HealthCluesGameIcon icon="inv:herbs" size={15} tone="botanical"/> Walk to the garden</button><button type="button" className="hc-guide-inline" onClick={onGuideSkip}>Skip this stop</button></>
        : guideStep === "discovery_movement" ? <><p>{petName} suggests</p><strong>Next, explore the Activity Trail.</strong><small>Walk there to meet the Explorer. This stop is optional.</small><button type="button" className="hc-guide-primary" onClick={() => guideTravel && beginLandmarkTravel(guideTravel)}><HealthCluesGameIcon icon="inv:movement" size={15} tone="amber"/> Walk to the trail</button><button type="button" className="hc-guide-inline" onClick={onGuideSkip}>Skip this stop</button></>
        : guideStep === "discovery_practices" ? <><p>{petName} suggests</p><strong>Would you like to visit the Wellness Sanctuary?</strong><small>Walk there to meet the Wellness Guide.</small><button type="button" className="hc-guide-primary" onClick={() => guideTravel && beginLandmarkTravel(guideTravel)}><HealthCluesGameIcon icon="inv:lotus" size={15} tone="lavender"/> Walk to the sanctuary</button><button type="button" className="hc-guide-inline" onClick={onGuideSkip}>Skip this stop</button></>
        : guideStep === "backpack" ? <><p>{petName} has a suggestion</p><strong>Let’s prepare a little Backpack for your adventure.</strong><small>Walk to Adventure Camp, then choose Talk to review your actual selections.</small><button type="button" className="hc-guide-primary" onClick={() => guideTravel && beginLandmarkTravel(guideTravel)}><HealthCluesGameIcon icon="inv:backpack" size={15} tone="gold"/> Walk to camp</button><button type="button" className="hc-guide-inline" onClick={onGuideSkip}>Skip Backpack</button></>
        : guideStep === "toolkit_summary" ? <><p>{petName} is ready</p><strong>Let’s review what you actually chose for your journey.</strong><small>Your Backpack, Collection and private Care Plan stay separate. You can continue with empty slots.</small><button type="button" className="hc-guide-primary" onClick={() => onGuideReminderSetup?.()}>Review my Journey</button></>
        : guideStep === "reminder_setup" ? <><p>{petName} asks</p><strong>Would you like a gentle reminder?</strong><small>Email reminders are optional and generic. You can set a time or skip them.</small><button type="button" className="hc-guide-primary" onClick={() => onGuideReminderSetup?.()}>Reminder settings</button><button type="button" className="hc-guide-inline" onClick={onGuideSkip}>No reminders</button></>
        : guideStep === "knowledge" ? <><p>{petName} is ready</p><strong>Your Journey is ready. Explore Knowledge whenever you like.</strong><small>Learning, check-ins and movement remain optional. Nothing is earned for consuming a tool or improving a symptom.</small><button type="button" className="hc-guide-primary" onClick={() => onGuideNext?.("completed")}>Begin my Journey</button><button type="button" className="hc-guide-inline" onClick={onGuideSkip}>Skip</button></>
        : <><p>{text(`${petName} welcomes you`)}</p><strong>{sleep ? text("Welcome to Sleep Valley. Let’s explore gentle ideas connected to") + ` ${sleepGoal}.` : `${text("Lumi will guide your")} ${journeyTopic} ${text("learning.")}`}</strong><small>{text("Select any location to explore. Your topic is self-reported, not a diagnosis.")}</small><button type="button" className="hc-guide-inline" onClick={onGuideHelp}>{text("Replay guide")}</button></>}
    </div><button type="button" className="hc-dialogue-close" onClick={guideStep ? onGuideClose : onGuideHelp} aria-label={guideStep ? "Minimize guide" : "Open Pet guide"}><X size={14}/></button></aside>}
    <span className="hc-rpg-sr-status sr-only" aria-live="polite">{arrived || (walking ? `Walking to ${travelTarget ? config.landmarks.find(item => item.id === travelTarget)?.name : "your destination"}` : `${petName} is following your adventurer`)}</span>
  </section>;
}
