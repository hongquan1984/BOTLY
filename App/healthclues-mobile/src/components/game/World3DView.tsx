import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from "react-native";
import { colors, fonts, radius } from "@/theme";
import { RefreshCw, AlertCircle } from "lucide-react-native";

export interface World3DInteractionEvent {
  type: "INTERACT_NPC" | "INTERACT_LANDMARK" | "INTERACT_BUILDING";
  buildingInstanceId?: string;
  landmarkId?: string;
  actionId?: string;
  npcId?: string;
  name?: string;
  role?: string;
  greeting?: string;
  description?: string;
}

export interface HighlightLandmarkTarget {
  landmarkId?: string | null;
  buildingInstanceId?: string | null;
  actionId?: string | null;
  focusCamera?: boolean;
}

interface World3DViewProps {
  onInteract: (event: World3DInteractionEvent) => void;
  language?: "vi" | "en";
  nickname?: string;
  cameraView?: "overview" | "close";
  highlightLandmark?: HighlightLandmarkTarget | null;
}

export const World3DView: React.FC<World3DViewProps> = ({
  onInteract,
  language = "vi",
  nickname = "Bạn",
  cameraView = "close",
  highlightLandmark = null,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const webViewRef = useRef<any>(null);

  // Sync camera view to Three.js scene
  useEffect(() => {
    if (!cameraView) return;
    const msg = JSON.stringify({ type: "SET_CAMERA_VIEW", view: cameraView });
    if (Platform.OS === "web") {
      try {
        iframeRef.current?.contentWindow?.postMessage(msg, "*");
      } catch {}
    } else if (webViewRef.current) {
      try {
        webViewRef.current.postMessage(msg);
      } catch {}
    }
  }, [cameraView, isLoading]);

  // Keep the embedded village labels in sync with the native locale.
  useEffect(() => {
    const msg = JSON.stringify({ type: "SET_LANGUAGE", language });
    if (Platform.OS === "web") {
      try { iframeRef.current?.contentWindow?.postMessage(msg, "*"); } catch {}
    } else if (webViewRef.current) {
      try { webViewRef.current.postMessage(msg); } catch {}
    }
  }, [language, isLoading]);

  // Sync highlight landmark / building to Three.js scene
  useEffect(() => {
    const msg = JSON.stringify({
      type: "HIGHLIGHT_LANDMARK",
      landmarkId: highlightLandmark?.landmarkId ?? null,
      buildingInstanceId: highlightLandmark?.buildingInstanceId ?? null,
      actionId: highlightLandmark?.actionId ?? null,
      focusCamera: highlightLandmark?.focusCamera ?? false,
    });
    if (Platform.OS === "web") {
      try {
        iframeRef.current?.contentWindow?.postMessage(msg, "*");
      } catch {}
    } else if (webViewRef.current) {
      try {
        webViewRef.current.postMessage(msg);
      } catch {}
    }
  }, [highlightLandmark, isLoading]);

  // World must use the standalone floating-village runtime from word3d (port 5173).
  // Port 5179 belongs to the separate Chalet/Home experience.
  const playerModeUrl = process.env.EXPO_PUBLIC_WORLD_3D_URL?.trim() ||
    (Platform.OS === "web" ? "http://localhost:5173/?mode=player" : null);

  // PostMessage listener on Web
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleWindowMessage = (event: MessageEvent) => {
      let data: any = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || !data.type) return;

      if (data.type === "WORLD_READY") {
        setIsLoading(false);
        setHasError(false);
      } else if (
        data.type === "INTERACT_NPC" ||
        data.type === "INTERACT_LANDMARK" ||
        data.type === "INTERACT_BUILDING"
      ) {
        onInteract(data);
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => {
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [onInteract]);

  // Handle messages on Native (react-native-webview)
  const handleNativeMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "WORLD_READY") {
        setIsLoading(false);
        setHasError(false);
      } else if (
        data.type === "INTERACT_NPC" ||
        data.type === "INTERACT_LANDMARK" ||
        data.type === "INTERACT_BUILDING"
      ) {
        onInteract(data);
      }
    } catch (e) {
      console.warn("Failed to parse 3D WebView message:", e);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (Platform.OS === "web" && iframeRef.current && playerModeUrl) {
      iframeRef.current.src = playerModeUrl;
    } else if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" && playerModeUrl ? (
        <iframe
          ref={iframeRef}
          src={playerModeUrl}
          style={
            {
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            } as any
          }
          title="Cozy Fantasy Village 3D"
          onLoad={() => {
            // Dismiss spinner quickly once iframe loads; Three.js streams in smoothly
            setTimeout(() => setIsLoading(false), 500);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : (
        <View style={styles.nativeFallback}>
          <AlertCircle size={38} color="#f59e0b" />
          <Text style={styles.fallbackTitle}>Làng 3D chưa được cấu hình</Text>
          <Text style={styles.fallbackSubtitle}>Bạn vẫn có thể tiếp tục dùng các chức năng của Xứ Sở Sức Khỏe.</Text>
        </View>
      )}

      {/* Native fallback for a configured URL is kept below; mobile apps should
          use the platform-specific WebView only when a real configured URL exists. */}
      {Platform.OS !== "web" && playerModeUrl ? (
        (() => {
          // Dynamic require for react-native-webview on native platforms
          const { WebView } = require("react-native-webview");
          return (
            <WebView
              ref={webViewRef}
              source={{ uri: playerModeUrl }}
              style={styles.webView}
              onMessage={handleNativeMessage}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
            />
          );
        })()
      ) : null}

      {/* Loading Overlay */}
      {isLoading && !hasError && !!playerModeUrl && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.emeraldLight} />
          <Text style={styles.loadingTitle}>
            {language === "en" ? "Loading Floating Village 3D..." : "Đang tải Làng Nổi 3D..."}
          </Text>
          <Text style={styles.loadingSubtitle}>
            {language === "en"
              ? "Explore the spring and drifting cloud island"
              : "Hòa mình cùng suối nguồn và đảo mây bồng bềnh"}
          </Text>
        </View>
      )}

      {/* Error / Offline Retry Overlay */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={42} color="#f59e0b" />
          <Text style={styles.errorTitle}>
            {language === "en" ? "Unable to connect to the 3D scene" : "Không thể kết nối cảnh 3D"}
          </Text>
          <Text style={styles.errorSubtitle}>
            {language === "en"
              ? "Check the 3D server connection or switch to 2D Overview mode"
              : "Vui lòng kiểm tra kết nối máy chủ 3D hoặc chuyển về chế độ 2D Toàn Cảnh"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <RefreshCw size={16} color="#051f18" />
            <Text style={styles.retryButtonText}>{language === "en" ? "Retry" : "Thử lại"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
    backgroundColor: "#020b08",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  nativeFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  fallbackTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    fontWeight: "800",
    color: "#f59e0b",
    textAlign: "center",
  },
  fallbackSubtitle: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    textAlign: "center",
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 11, 8, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    gap: 10,
  },
  loadingTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    fontWeight: "700",
    color: colors.emeraldLight,
    marginTop: 8,
  },
  loadingSubtitle: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.65)",
    textAlign: "center",
    maxWidth: 260,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 16, 12, 0.96)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    paddingHorizontal: 28,
    gap: 12,
  },
  errorTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    fontWeight: "800",
    color: "#f59e0b",
  },
  errorSubtitle: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.emeraldLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
    marginTop: 8,
  },
  retryButtonText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    fontWeight: "800",
    color: "#051f18",
  },
});
