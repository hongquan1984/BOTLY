import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RemoteAdventurer {
  id: string;
  nickname: string;
  avatarKey: string;
  x: number;
  y: number;
  facing: "left" | "right";
  walking: boolean;
  action?: string | null;
  speech?: string | null;
  updatedAt: string;
}

interface UseWorldPresenceOptions {
  region: string;
  myPos: { x: number; y: number };
  walking: boolean;
  facing: "left" | "right";
  nickname?: string;
  avatarKey?: string;
  isScreenFocused?: boolean;
}

const PRESENCE_SESSION_KEY = "healthclues-mobile-presence-session-id";

export function useWorldPresence({
  region = "healthclues-realm",
  myPos,
  walking,
  facing,
  nickname = "Bạn",
  avatarKey = "chibi-anna",
  isScreenFocused = true,
}: UseWorldPresenceOptions) {
  const [remotePlayers, setRemotePlayers] = useState<RemoteAdventurer[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [mySpeech, setMySpeech] = useState<string | null>(null);

  const sessionIdRef = useRef<string>("");
  const lastBroadcastTimeRef = useRef<number>(0);
  const myStateRef = useRef({
    region,
    myPos,
    walking,
    facing,
    nickname,
    avatarKey,
    speech: mySpeech,
  });

  // Keep latest reference synced for intervals
  useEffect(() => {
    myStateRef.current = {
      region,
      myPos,
      walking,
      facing,
      nickname,
      avatarKey,
      speech: mySpeech,
    };
  }, [region, myPos, walking, facing, nickname, avatarKey, mySpeech]);

  // Initialize or retrieve persistent session ID
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let sid = await AsyncStorage.getItem(PRESENCE_SESSION_KEY);
        if (!sid) {
          sid = `adv-m-${Math.random().toString(36).slice(2, 10)}`;
          await AsyncStorage.setItem(PRESENCE_SESSION_KEY, sid);
        }
        if (isMounted) {
          sessionIdRef.current = sid;
        }
      } catch {
        if (isMounted) {
          sessionIdRef.current = `adv-m-${Math.random().toString(36).slice(2, 10)}`;
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Post heartbeat to presence API
  const sendPresenceHeartbeat = useCallback(
    async (
      overridePos?: { x: number; y: number },
      overrideWalking?: boolean,
      overrideFacing?: "left" | "right",
      overrideSpeech?: string | null
    ) => {
      const sid = sessionIdRef.current;
      if (!sid) return;

      const s = myStateRef.current;
      const x = overridePos ? overridePos.x : s.myPos.x;
      const y = overridePos ? overridePos.y : s.myPos.y;
      const isWalk = overrideWalking !== undefined ? overrideWalking : s.walking;
      const face = overrideFacing !== undefined ? overrideFacing : s.facing;
      const speechText = overrideSpeech !== undefined ? overrideSpeech : s.speech;

      try {
        const res = await fetch("/api/healthclues/world/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: sid,
            region: s.region,
            nickname: s.nickname,
            avatarKey: s.avatarKey,
            x: Math.round(x * 10) / 10,
            y: Math.round(y * 10) / 10,
            facing: face,
            walking: isWalk,
            speech: speechText,
          }),
        });

        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.players)) {
          const others = data.players.filter((p: any) => p.id !== sid);
          // Only update remote players state if there is a material change (avoids React re-render churn during walking)
          setRemotePlayers((prev) => {
            if (isWalk && prev.length === others.length) {
              // During active walk strides, preserve current peer positions to avoid micro-stutters
              return prev;
            }
            if (prev.length !== others.length) return others;
            let changed = false;
            for (let i = 0; i < others.length; i++) {
              const op = prev[i];
              const np = others[i];
              if (!op || op.id !== np.id || Math.abs(op.x - np.x) > 3 || Math.abs(op.y - np.y) > 3 || op.speech !== np.speech || op.facing !== np.facing) {
                changed = true;
                break;
              }
            }
            return changed ? others : prev;
          });
          setOnlineCount((prev) => {
            const nextCount = data.onlineCount || others.length + 1;
            return prev === nextCount ? prev : nextCount;
          });
        }
      } catch {
        // Ignore network / offline errors gracefully
      }
    },
    []
  );

  // Broadcast position changes (throttled to max 1 request per 250ms during walk, immediate on stop)
  const broadcastPosition = useCallback(
    (x: number, y: number, isWalking: boolean, faceDir: "left" | "right") => {
      const now = Date.now();
      if (!isWalking) {
        lastBroadcastTimeRef.current = now;
        sendPresenceHeartbeat({ x, y }, false, faceDir);
        return;
      }
      if (now - lastBroadcastTimeRef.current >= 280) {
        lastBroadcastTimeRef.current = now;
        sendPresenceHeartbeat({ x, y }, true, faceDir);
      }
    },
    [sendPresenceHeartbeat]
  );

  // Regular heartbeat sync every 3s when screen is active
  useEffect(() => {
    if (!isScreenFocused) return;

    // Initial heartbeat once session ID is ready
    const timer = setTimeout(() => {
      sendPresenceHeartbeat();
    }, 400);

    const interval = setInterval(() => {
      sendPresenceHeartbeat();
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isScreenFocused, sendPresenceHeartbeat]);

  // Clear my speech bubble after 4.5s
  useEffect(() => {
    if (!mySpeech) return;
    const timer = setTimeout(() => {
      setMySpeech(null);
      sendPresenceHeartbeat(undefined, undefined, undefined, null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [mySpeech, sendPresenceHeartbeat]);

  const sendGreeting = useCallback(
    (message: string) => {
      setMySpeech(message);
      sendPresenceHeartbeat(undefined, undefined, undefined, message);
    },
    [sendPresenceHeartbeat]
  );

  return {
    remotePlayers,
    onlineCount,
    mySpeech,
    broadcastPosition,
    sendGreeting,
  };
}
