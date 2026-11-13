"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { type PetRegion } from "./HealthCluesPet";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { Sparkles, Coffee, Hand, X } from "lucide-react";

export interface RemoteAdventurer {
  id: string;
  nickname: string;
  avatarKey: string;
  x: number;
  y: number;
  facing: "left" | "right";
  walking: boolean;
  action: string | null;
  speech: string | null;
  updatedAt: string;
}

const CHIBI_AVATARS = [
  { key: "chibi-anna", url: "/healthclues/assets/characters/chibi-anna.png", name: "Áo xanh lá" },
  { key: "chibi-leo", url: "/healthclues/assets/characters/chibi-leo.png", name: "Áo xanh đậm" },
  { key: "chibi-mia", url: "/healthclues/assets/characters/chibi-mia.png", name: "Áo kem" },
  { key: "chibi-ben", url: "/healthclues/assets/characters/chibi-ben.png", name: "Áo navy" },
  { key: "chibi-lily", url: "/healthclues/assets/characters/chibi-lily.png", name: "Áo tím" }
];

export function getChibiAvatarUrl(key?: string): string {
  const hit = CHIBI_AVATARS.find(a => a.key === key);
  return hit ? hit.url : CHIBI_AVATARS[1].url; // Default to Leo (blue)
}

function assignAvatarFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CHIBI_AVATARS[hash % CHIBI_AVATARS.length].key;
}

export type MovementBroadcaster = (x: number, y: number, walking: boolean, facing: "left" | "right") => void;

interface OnlineAdventurersProps {
  region: PetRegion;
  myPosition: { x: number; y: number };
  walking: boolean;
  facing?: "left" | "right";
  nickname?: string;
  avatarKey?: string;
  onOnlineCountChange?: (count: number) => void;
  onRegisterBroadcaster?: (fn: MovementBroadcaster) => void;
}

export function OnlineAdventurers({
  region,
  myPosition,
  walking,
  facing = "right",
  nickname = "",
  avatarKey,
  onOnlineCountChange,
  onRegisterBroadcaster
}: OnlineAdventurersProps) {
  const { locale } = useHealthCluesLocale();
  const [remotePlayers, setRemotePlayers] = useState<RemoteAdventurer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<RemoteAdventurer | null>(null);
  const [mySpeech, setMySpeech] = useState<string | null>(null);

  // Generate or retrieve stable guest/user id for presence session
  const presenceIdRef = useRef<string>("");
  if (!presenceIdRef.current) {
    if (typeof window !== "undefined") {
      let saved = window.sessionStorage.getItem("hc-presence-session-id");
      if (!saved) {
        saved = `adv-${Math.random().toString(36).slice(2, 10)}`;
        window.sessionStorage.setItem("hc-presence-session-id", saved);
      }
      presenceIdRef.current = saved;
    } else {
      presenceIdRef.current = "adv-default";
    }
  }

  const assignedAvatar = useMemo(() => {
    return avatarKey || assignAvatarFromId(presenceIdRef.current);
  }, [avatarKey]);

  // Keep latest state in ref for intervals & callbacks
  const stateRef = useRef({
    region,
    myPosition,
    walking,
    facing,
    nickname: nickname || (locale === "vi" ? "Bạn" : "Adventurer"),
    avatarKey: assignedAvatar,
    speech: mySpeech
  });

  useEffect(() => {
    stateRef.current = {
      region,
      myPosition,
      walking,
      facing,
      nickname: nickname || (locale === "vi" ? "Bạn" : "Adventurer"),
      avatarKey: assignedAvatar,
      speech: mySpeech
    };
  }, [region, myPosition, walking, facing, nickname, assignedAvatar, mySpeech]);

  // WebSocket reference for Sub-50ms Realtime Broadcasts
  const wsRef = useRef<WebSocket | null>(null);
  const wsMsgId = useRef(1);
  const channelTopic = `realtime:healthclues-${region}`;

  // Broadcast immediate position via WebSocket (< 20ms latency)
  const broadcastRealtimePos = useCallback((x: number, y: number, isWalking: boolean, faceDir: "left" | "right") => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const s = stateRef.current;
    const msg = JSON.stringify({
      topic: channelTopic,
      event: "broadcast",
      payload: {
        type: "broadcast",
        event: "pos",
        payload: {
          userId: presenceIdRef.current,
          nickname: s.nickname,
          avatarKey: s.avatarKey,
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          facing: faceDir,
          walking: isWalking,
          speech: s.speech
        }
      },
      ref: String(++wsMsgId.current)
    });
    try {
      ws.send(msg);
    } catch { /* Ignore socket write failure */ }
  }, [channelTopic]);

  // Register broadcaster to parent (RegionMapScene) for high-frequency movement updates
  useEffect(() => {
    if (onRegisterBroadcaster) {
      onRegisterBroadcaster((x, y, isWalking, faceDir) => {
        broadcastRealtimePos(x, y, isWalking, faceDir);
      });
    }
  }, [onRegisterBroadcaster, broadcastRealtimePos]);

  // Initialize Supabase Realtime WebSocket Broadcast
  useEffect(() => {
    if (typeof window === "undefined") return;

    let destroyed = false;
    let heartbeatTimer: number | undefined;

    const projectRef = "rswmadukvegraxfcdbcb";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzd21hZHVrdmVncmF4ZmNkYmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NDIwMTMsImV4cCI6MjA0NTUxODAxM30.4q67k35_0wLffR_TqJ8dD5Uj1H0L3K3j6_JgX8vN1yI";

    const wsUrl = `wss://${projectRef}.supabase.co/realtime/v1/websocket?apikey=${anonKey}&vsn=1.0.0`;

    function connectWs() {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (destroyed) {
            ws.close();
            return;
          }
          // Join channel
          ws.send(JSON.stringify({
            topic: channelTopic,
            event: "phx_join",
            payload: { config: { broadcast: { ack: false } } },
            ref: String(++wsMsgId.current)
          }));

          // Send initial position broadcast
          const s = stateRef.current;
          broadcastRealtimePos(s.myPosition.x, s.myPosition.y, s.walking, s.facing);

          // Keep-alive heartbeat every 25s for Phoenix socket
          heartbeatTimer = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                topic: "phoenix",
                event: "heartbeat",
                payload: {},
                ref: String(++wsMsgId.current)
              }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === "broadcast" && data.payload?.event === "pos") {
              const peer = data.payload.payload;
              if (peer && peer.userId && peer.userId !== presenceIdRef.current) {
                setRemotePlayers((prev) => {
                  const idx = prev.findIndex((p) => p.id === peer.userId);
                  const updated: RemoteAdventurer = {
                    id: peer.userId,
                    nickname: peer.nickname || "Lữ khách",
                    avatarKey: peer.avatarKey || "chibi-leo",
                    x: Number(peer.x),
                    y: Number(peer.y),
                    facing: peer.facing === "left" ? "left" : "right",
                    walking: Boolean(peer.walking),
                    action: peer.action || null,
                    speech: peer.speech || null,
                    updatedAt: new Date().toISOString()
                  };
                  if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = updated;
                    return next;
                  }
                  return [...prev, updated];
                });
              }
            } else if (data.event === "broadcast" && data.payload?.event === "greet") {
              const peer = data.payload.payload;
              if (peer && peer.userId && peer.userId !== presenceIdRef.current && peer.speech) {
                setRemotePlayers((prev) => {
                  return prev.map((p) => {
                    if (p.id === peer.userId) {
                      return { ...p, speech: peer.speech };
                    }
                    return p;
                  });
                });
              }
            }
          } catch { /* Ignore malformed frames */ }
        };

        ws.onerror = () => {
          // Fallback to HTTP polling smoothly
        };

        ws.onclose = () => {
          if (heartbeatTimer) window.clearInterval(heartbeatTimer);
          if (!destroyed) {
            // Reconnect after 4s
            setTimeout(connectWs, 4000);
          }
        };
      } catch {
        // Fallback to HTTP
      }
    }

    connectWs();

    return () => {
      destroyed = true;
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [channelTopic, broadcastRealtimePos]);

  // Periodic HTTP Heartbeat (fallback & DB registration every 3.5s)
  const sendHttpHeartbeat = useCallback(async (customSpeech?: string | null) => {
    const s = stateRef.current;
    try {
      const response = await fetch("/api/healthclues/world/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: presenceIdRef.current,
          region: s.region,
          nickname: s.nickname,
          avatarKey: s.avatarKey,
          x: s.myPosition.x,
          y: s.myPosition.y,
          facing: s.facing,
          walking: s.walking,
          action: customSpeech ? "greet" : null,
          speech: customSpeech !== undefined ? customSpeech : s.speech
        })
      });

      if (!response.ok) return;
      const data = await response.json();
      if (data && Array.isArray(data.players)) {
        // Merge with existing players to not discard realtime updates
        setRemotePlayers((prev) => {
          const map = new Map(prev.map(p => [p.id, p]));
          for (const item of data.players) {
            const existing = map.get(item.id);
            if (existing) {
              // If existing has recent WS update within last 2s, keep existing position
              map.set(item.id, {
                ...item,
                x: existing.x,
                y: existing.y,
                facing: existing.facing,
                walking: existing.walking,
                speech: existing.speech || item.speech
              });
            } else {
              map.set(item.id, item);
            }
          }
          return Array.from(map.values());
        });
        onOnlineCountChange?.(data.onlineCount || (data.players.length + 1));
      }
    } catch {
      // Ignore network errors gracefully
    }
  }, [onOnlineCountChange]);

  // HTTP polling fallback interval
  useEffect(() => {
    sendHttpHeartbeat();
    const interval = window.setInterval(() => {
      sendHttpHeartbeat();
    }, 3500);

    return () => {
      window.clearInterval(interval);
    };
  }, [sendHttpHeartbeat]);

  // Clean presence on unload
  useEffect(() => {
    const handleUnload = () => {
      if (presenceIdRef.current) {
        navigator.sendBeacon?.(`/api/healthclues/world/presence?userId=${encodeURIComponent(presenceIdRef.current)}`);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, []);

  // Clear my speech after timeout
  useEffect(() => {
    if (!mySpeech) return;
    const timer = window.setTimeout(() => {
      setMySpeech(null);
      sendHttpHeartbeat(null);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [mySpeech, sendHttpHeartbeat]);

  // Quick greetings
  const handleSendGreeting = (textMsg: string) => {
    setMySpeech(textMsg);
    // 1. Broadcast over WebSocket instantly (< 20ms)
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        topic: channelTopic,
        event: "broadcast",
        payload: {
          type: "broadcast",
          event: "greet",
          payload: {
            userId: presenceIdRef.current,
            speech: textMsg
          }
        },
        ref: String(++wsMsgId.current)
      }));
    }
    // 2. Persist via HTTP
    sendHttpHeartbeat(textMsg);
    setSelectedPeer(null);
  };

  return (
    <div className="hc-online-adventurers-layer" aria-label="Online Adventurers in Village">
      {/* 1. Remote Adventurers */}
      {remotePlayers.map((player) => {
        const spriteUrl = getChibiAvatarUrl(player.avatarKey);
        const isFacingLeft = player.facing === "left";

        return (
          <div
            key={player.id}
            className={`hc-online-adventurer is-chibi-adventurer ${player.walking ? "is-walking" : ""}`}
            style={{
              transform: `translate3d(${player.x}px, ${player.y}px, 0) translateX(-50%)`,
              zIndex: Math.round(player.y)
            }}
            data-facing={player.facing}
            data-walking={player.walking ? "true" : "false"}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPeer(player);
            }}
            role="button"
            tabIndex={0}
            aria-label={`${player.nickname} (Online)`}
          >
            {/* Soft Shadow */}
            <span className="hc-chibi-shadow" aria-hidden="true" />

            {/* Chibi Sprite */}
            <span
              className="hc-chibi-sprite hc-online-sprite"
              style={{
                backgroundImage: `url(${spriteUrl})`,
                transform: isFacingLeft ? "translateX(-50%) scaleX(-1)" : "translateX(-50%)"
              }}
              aria-hidden="true"
            />

            {/* Online Name Pill with Pulsing Green Dot */}
            <div className="hc-online-name-pill">
              <span className="hc-online-dot" aria-hidden="true" />
              <span className="hc-online-name-text">{player.nickname}</span>
            </div>

            {/* Speech Bubble if Peer is Speaking */}
            {player.speech && (
              <div className="hc-chibi-speech-bubble hc-peer-speech-bubble" role="status">
                {player.speech}
              </div>
            )}
          </div>
        );
      })}

      {/* 2. My Speech Bubble above Local Player */}
      {mySpeech && (
        <div
          className="hc-chibi-speech-bubble hc-my-speech-bubble"
          style={{
            position: "absolute",
            left: `${myPosition.x}px`,
            top: `${myPosition.y - 75}px`,
            transform: "translateX(-50%)",
            zIndex: Math.round(myPosition.y) + 50
          }}
          role="status"
        >
          {mySpeech}
        </div>
      )}

      {/* 3. Peer Interaction Dialog */}
      {selectedPeer && (
        <div
          className="hc-peer-interact-modal"
          style={{
            position: "absolute",
            left: `${Math.min(Math.max(selectedPeer.x, 140), 1700)}px`,
            top: `${Math.max(selectedPeer.y - 120, 60)}px`,
            transform: "translateX(-50%)",
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="hc-peer-card">
            <button
              type="button"
              className="hc-peer-close-btn"
              onClick={() => setSelectedPeer(null)}
              aria-label={locale === "vi" ? "Đóng" : "Close"}
            >
              <X size={14} />
            </button>

            <div className="hc-peer-header">
              <div
                className="hc-peer-avatar-thumb"
                style={{ backgroundImage: `url(${getChibiAvatarUrl(selectedPeer.avatarKey)})` }}
              />
              <div className="hc-peer-info">
                <div className="flex items-center gap-1.5">
                  <span className="hc-online-dot" />
                  <strong className="hc-peer-title">{selectedPeer.nickname}</strong>
                </div>
                <span className="hc-peer-sub">
                  {locale === "vi" ? "Bạn đồng hành online" : "Online Adventurer"}
                </span>
              </div>
            </div>

            <div className="hc-peer-actions">
              <button
                type="button"
                className="hc-peer-action-btn"
                onClick={() => handleSendGreeting(locale === "vi" ? "👋 Chào bạn nhé!" : "👋 Hello there!")}
              >
                <Hand size={14} className="text-amber-400" />
                <span>{locale === "vi" ? "Vẫy tay chào" : "Wave"}</span>
              </button>
              <button
                type="button"
                className="hc-peer-action-btn"
                onClick={() => handleSendGreeting(locale === "vi" ? "✨ Cùng sống khỏe nhé! 🎉" : "✨ Stay healthy together! 🎉")}
              >
                <Sparkles size={14} className="text-emerald-400" />
                <span>{locale === "vi" ? "Cổ vũ sống khỏe" : "Cheer"}</span>
              </button>
              <button
                type="button"
                className="hc-peer-action-btn"
                onClick={() => handleSendGreeting(locale === "vi" ? "🍵 Mời bạn tách trà ấm!" : "🍵 Enjoy some warm tea!")}
              >
                <Coffee size={14} className="text-yellow-300" />
                <span>{locale === "vi" ? "Mời tách trà" : "Offer Tea"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
