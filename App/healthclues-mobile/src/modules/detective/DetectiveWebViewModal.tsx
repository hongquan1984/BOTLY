import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Coins, RefreshCw, AlertCircle } from "lucide-react-native";
import { useEconomy } from "../economy/useEconomy";
import { playDolphinChirp, playDolphinWhistle } from "../audio/dolphinAudio";
import { getCurrentTourStep } from "../tour/villageTourService";
import { useLocale } from "@/localization";

interface DetectiveWebViewModalProps {
  visible: boolean;
  onClose: () => void;
  caseId?: string;
}

export function DetectiveWebViewModal({
  visible,
  onClose,
  caseId,
}: DetectiveWebViewModalProps) {
  const { coins, addCoins } = useEconomy();
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<any>(null);

  const detectiveUrl = useMemo(() => {
    let host = "localhost";
    if (typeof window !== "undefined" && window.location?.hostname) {
      host = window.location.hostname;
    }
    const params = new URLSearchParams({ lang: locale });
    if (caseId) params.set("caseId", caseId);
    const query = `?${params.toString()}`;
    return `http://${host}:3329/detective${query}`;
  }, [caseId, iframeKey, locale]);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setLoadError(false);

    if (Platform.OS !== "web") return;

    const handleMessage = (e: MessageEvent) => {
      let data: any = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data) return;

      if (data.type === "CLOSE_DETECTIVE" || data.type === "RETURN_TO_WORLD") {
        handleClose();
      } else if (data.type === "CASE_SOLVED" || data.type === "CLAIM_REWARD") {
        const bonus = Number(data.coinsAwarded) || 50;
        addCoins(bonus);
        playDolphinWhistle(0.5);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [visible]);

  const handleClose = () => {
    playDolphinChirp(0.3);
    const tourStep = getCurrentTourStep();
    if (tourStep === "detective_modal" || tourStep === "world_detective_lore" || tourStep === "detective") {
      playDolphinWhistle(0.4);
      addCoins(50);
    }
    onClose();
  };

  const handleRetry = () => {
    setLoadError(false);
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Sleek Game HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Quay lại Làng Sống Khỏe"
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <ArrowLeft size={16} color="#a7f3d0" />
            <Text style={styles.backButtonText}>Về Làng</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Thám Tử Cơ Thể · Luna
            </Text>
            <Text style={styles.headerSubtitle}>Văn Phòng Điều Tra Bệnh Án</Text>
          </View>

          <View style={styles.walletBadge}>
            <Coins size={14} color="#fbbf24" />
            <Text style={styles.walletText}>{coins}</Text>
          </View>
        </View>

        {/* Web Viewport / Iframe */}
        <View style={styles.viewportContainer}>
          {loading && !loadError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#34d399" />
              <Text style={styles.loadingText}>Đang mở Hồ Sơ Bệnh Án...</Text>
            </View>
          )}

          {loadError && (
            <View style={styles.errorOverlay}>
              <AlertCircle size={36} color="#f87171" />
              <Text style={styles.errorTitle}>Không thể kết nối Văn Phòng Thám Tử</Text>
              <Text style={styles.errorDesc}>
                Vui lòng kiểm tra cổng 3329 hoặc thử tải lại.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                activeOpacity={0.8}
                onPress={handleRetry}
              >
                <RefreshCw size={14} color="#042f2e" />
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {Platform.OS === "web" ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={detectiveUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                backgroundColor: "#070d17",
                display: loadError ? "none" : "block",
              }}
              title="HealthClues Mystery Detective"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setLoadError(true);
              }}
            />
          ) : (
            <View style={styles.nativeFallback}>
              <Text style={styles.nativeText}>
                Văn Phòng Thám Tử đang mở trên cổng {detectiveUrl}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06131c",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "rgba(10, 24, 38, 0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(56, 189, 248, 0.25)",
    zIndex: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  backButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#a7f3d0",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f0f9ff",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "500",
    color: "#38bdf8",
  },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  walletText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fbbf24",
  },
  viewportContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#070d17",
  },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#070d17",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#34d399",
  },
  errorOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#070d17",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 6,
    gap: 10,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fca5a5",
    textAlign: "center",
  },
  errorDesc: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#34d399",
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#042f2e",
  },
  nativeFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  nativeText: {
    fontSize: 14,
    color: "#cbd5e1",
    textAlign: "center",
  },
});
