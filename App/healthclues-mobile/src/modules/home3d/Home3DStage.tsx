import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import {
  Home,
  Sofa,
  UtensilsCrossed,
  Bed,
  Bath,
  Maximize2,
  ShoppingBag,
  Layers,
  DoorOpen,
  Flame,
  User,
  RotateCcw,
} from "lucide-react-native";
import { HomeFurnitureShopModal } from "./HomeFurnitureShopModal";
import { useEconomy } from "../economy/useEconomy";
import { playDolphinChirp } from "../audio/dolphinAudio";
import { useLocale } from "@/localization";

export type ChaletRoomView =
  | "overview"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "view34"
  | "character";

interface Home3DStageProps {
  onToggleClassic25D?: () => void;
  isClassic25D?: boolean;
}

export function Home3DStage({
  onToggleClassic25D,
  isClassic25D = false,
}: Home3DStageProps) {
  const { locale } = useLocale();
  const { width, height } = useWindowDimensions();
  const iframeRef = useRef<any>(null);
  const [activeRoomView, setActiveRoomView] = useState<ChaletRoomView>("overview");
  const [showShop, setShowShop] = useState(false);
  const [doorOpen, setDoorOpen] = useState(true);
  const [lightsOn, setLightsOn] = useState(true);
  const { coins } = useEconomy();

  const handleSelectRoom = (room: string) => {
    playDolphinChirp(0.3);
    if (room === "reset") {
      setActiveRoomView("overview");
      if (Platform.OS === "web") {
        try {
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: "CHALET_RESET_VIEW" }, "*");
          }
        } catch {}
      }
      return;
    }
    setActiveRoomView(room as ChaletRoomView);
    if (Platform.OS === "web") {
      try {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: "CHALET_SET_VIEW", view: room }, "*");
        }
      } catch {}
    }
  };

  const handleToggleDoor = () => {
    playDolphinChirp(0.25);
    setDoorOpen((prev) => !prev);
    if (Platform.OS === "web") {
      try {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: "CHALET_TOGGLE_DOOR" }, "*");
        }
      } catch {}
    }
  };

  const handleToggleLights = () => {
    playDolphinChirp(0.25);
    setLightsOn((prev) => !prev);
    if (Platform.OS === "web") {
      try {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: "CHALET_TOGGLE_LIGHTS" }, "*");
        }
      } catch {}
    }
  };

  const iframeSrc = useMemo(() => {
    let host = "localhost";
    if (typeof window !== "undefined" && window.location?.hostname) {
      host = window.location.hostname;
    }
    return process.env.EXPO_PUBLIC_DAO3D_URL?.trim() || `http://${host}:3355/`;
  }, []);

  return (
    <View style={styles.container}>
      {/* 3D WebGL Canvas / Iframe */}
      {Platform.OS === "web" && iframeSrc ? (
        <View style={styles.canvasContainer}>
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              backgroundColor: "#030c0a",
            }}
            title="Swiss Alpine Chalet 3D Stage"
          />
        </View>
      ) : (
        <View style={styles.nativeFallback}>
          <Home size={38} color="#f59e0b" />
          <Text style={styles.fallbackTitle}>Biệt Thự Chalet 3D</Text>
          <Text style={styles.fallbackDesc}>
            Chạm vào các phòng bên dưới để tham quan không gian nghỉ dưỡng
          </Text>
        </View>
      )}

      {/* Floating Top Controls (Horizontal scrollable to prevent any button clipping) */}
      <View style={styles.floatingTopBar} pointerEvents="box-none">
        <View style={styles.brandCapsule}>
          <View style={styles.brandDot} />
          <Text style={styles.brandTitle}>Chalet 3D</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.topRightScrollView}
          contentContainerStyle={styles.topRightScrollContent}
        >
          {/* Nút đóng / mở cửa kính trượt */}
          <TouchableOpacity
            style={[styles.quickControlBtn, doorOpen && styles.quickControlBtnActive]}
            activeOpacity={0.8}
            onPress={handleToggleDoor}
            accessibilityRole="button"
            accessibilityLabel={locale === "en" ? "Toggle sliding glass door" : "Đóng mở cửa kính trượt"}
          >
            <DoorOpen size={11} color={doorOpen ? "#34d399" : "#94a3b8"} />
            <Text style={[styles.quickControlText, doorOpen && styles.quickControlTextActive]}>
              {doorOpen
                ? (locale === "en" ? "Door: Open" : "Cửa: Mở")
                : (locale === "en" ? "Door: Closed" : "Cửa: Đóng")}
            </Text>
          </TouchableOpacity>

          {/* Nút bật / tắt đèn & lò sưởi */}
          <TouchableOpacity
            style={[styles.quickControlBtn, lightsOn && styles.quickControlBtnActive]}
            activeOpacity={0.8}
            onPress={handleToggleLights}
            accessibilityRole="button"
            accessibilityLabel={locale === "en" ? "Toggle lights and fireplace" : "Bật tắt đèn và lò sưởi"}
          >
            <Flame size={11} color={lightsOn ? "#f59e0b" : "#94a3b8"} />
            <Text style={[styles.quickControlText, lightsOn && styles.quickControlTextActive]}>
              {lightsOn
                ? (locale === "en" ? "Lights: On" : "Đèn: Bật")
                : (locale === "en" ? "Lights: Off" : "Đèn: Tắt")}
            </Text>
          </TouchableOpacity>

          {/* Nút mở Cửa hàng nội thất bằng Xu */}
          <TouchableOpacity
            style={styles.shopBtn}
            activeOpacity={0.85}
            onPress={() => setShowShop(true)}
            accessibilityRole="button"
            accessibilityLabel={locale === "en" ? "Open furniture shop" : "Mở cửa hàng nội thất bằng Xu"}
          >
            <ShoppingBag size={11} color="#042f2e" />
            <Text style={styles.shopBtnText}>
              {locale === "en" ? `Shop (${coins} 🪙)` : `Sắm Đồ (${coins} 🪙)`}
            </Text>
          </TouchableOpacity>

          {/* Nút đổi sang chế độ 2.5D Cổ điển nếu cần */}
          {onToggleClassic25D && (
            <TouchableOpacity
              style={styles.toggleModeBtn}
              activeOpacity={0.8}
              onPress={onToggleClassic25D}
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Switch to 2.5D mode" : "Chuyển chế độ 2.5D"}
            >
              <Layers size={11} color="#cbd5e1" />
              <Text style={styles.toggleModeText}>2.5D</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Bottom Floating Room Selector Pills — Positioned at bottom: 12 inside Home3DStage (sits cleanly 12px above bottom tabs) */}
      <View style={styles.floatingBottomBar} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.roomPillsScroll}
          contentContainerStyle={styles.roomPillsRow}
        >
          {[
            { id: "overview", label: locale === "en" ? "Living Room" : "Phòng Khách", icon: Sofa },
            { id: "kitchen", label: locale === "en" ? "Kitchen" : "Bếp Ăn", icon: UtensilsCrossed },
            { id: "bedroom", label: locale === "en" ? "Bedroom" : "Phòng Ngủ", icon: Bed },
            { id: "bathroom", label: locale === "en" ? "Spa & Bath" : "Spa & Tắm", icon: Bath },
            { id: "view34", label: locale === "en" ? "3/4 View" : "Góc 3/4", icon: Maximize2 },
            { id: "character", label: locale === "en" ? "Character" : "Nhân Vật", icon: User },
            { id: "reset", label: locale === "en" ? "Panorama" : "Toàn Cảnh", icon: RotateCcw },
          ].map((room) => {
            const Icon = room.icon;
            const isActive = activeRoomView === room.id;
            return (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomPill, isActive && styles.roomPillActive]}
                activeOpacity={0.8}
                onPress={() => handleSelectRoom(room.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Icon size={12} color={isActive ? "#042f2e" : "#cbd5e1"} />
                <Text
                  style={[styles.roomPillText, isActive && styles.roomPillTextActive]}
                  numberOfLines={1}
                >
                  {room.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Shop Modal */}
      <HomeFurnitureShopModal
        visible={showShop}
        onClose={() => setShowShop(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030c0a",
    position: "relative",
    overflow: "hidden",
  },
  canvasContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  nativeFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  fallbackTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  fallbackDesc: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
  },
  floatingTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  brandCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(4, 20, 16, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  brandTitle: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  topRightScrollView: {
    flexGrow: 0,
    maxWidth: "74%",
  },
  topRightScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingRight: 4,
  },
  quickControlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6, 26, 21, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 16,
  },
  quickControlBtnActive: {
    borderColor: "rgba(52, 211, 153, 0.45)",
    backgroundColor: "rgba(6, 34, 26, 0.95)",
  },
  quickControlText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
  },
  quickControlTextActive: {
    color: "#ecfdf5",
    fontWeight: "800",
  },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 18,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  shopBtnText: {
    color: "#042f2e",
    fontSize: 10.5,
    fontWeight: "900",
  },
  toggleModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(6, 26, 21, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 16,
  },
  toggleModeText: {
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: "700",
  },
  floatingBottomBar: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 14 : 24,
    left: 8,
    right: 8,
    alignItems: "center",
    zIndex: 99,
  },
  roomPillsScroll: {
    maxWidth: "100%",
    flexGrow: 0,
  },
  roomPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6, 24, 20, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: 24,
    padding: 3.5,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  roomPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 18,
  },
  roomPillActive: {
    backgroundColor: "#34d399",
  },
  roomPillText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
  },
  roomPillTextActive: {
    color: "#042f2e",
    fontWeight: "900",
  },
});
