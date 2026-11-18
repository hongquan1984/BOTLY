import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Sparkles, Key, Home, Coins, ArrowRight } from "lucide-react-native";
import { playDolphinChirp, playDolphinWhistle } from "../audio/dolphinAudio";
import { useLocale } from "@/localization";

interface HouseGiftCelebrationProps {
  visible: boolean;
  onClose: () => void;
  onExploreHouse?: () => void;
}

export function HouseGiftCelebration({
  visible,
  onClose,
  onExploreHouse,
}: HouseGiftCelebrationProps) {
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const modalWidth = Math.min(width - 32, 420);

  const handleContinue = () => {
    playDolphinChirp(0.4);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialogCard, { width: modalWidth }]}>
          {/* Header Icon với hiệu ứng Chìa khóa vàng & Hào quang */}
          <View style={styles.goldKeyAura}>
            <View style={styles.goldKeyInner}>
              <Key size={30} color="#f59e0b" />
            </View>
          </View>

          {/* Tiêu đề Chúc mừng */}
          <View style={styles.sparkleRow}>
            <Sparkles size={16} color="#fbbf24" />
            <Text style={styles.congratsBadge}>{locale === "en" ? "SPECIAL REWARD" : "PHẦN THƯỞNG ĐẶC BIỆT"}</Text>
            <Sparkles size={16} color="#fbbf24" />
          </View>

          <Text style={styles.title}>{locale === "en" ? "GIFTED A NEW HOME!" : "TẶNG BẠN CĂN NHÀ MỚI!"}</Text>
          <Text style={styles.subtitle}>
            {locale === "en"
              ? "3D Alpine Wooden Chalet overlooking Lake & Peaks"
              : "Biệt Thự Gỗ Chalet 3D View Hồ & Dãy Núi Tuyết"}
          </Text>

          {/* Khung tranh căn nhà mẫu */}
          <View style={styles.housePreviewBox}>
            <Image
              source={require("../../../assets/game/home/scenes/scene_interior_wide.webp")}
              style={styles.houseImage}
              contentFit="cover"
            />
            <View style={styles.houseBadgeOverlay}>
              <Home size={13} color="#6ee7b7" />
              <Text style={styles.houseBadgeText}>{locale === "en" ? "3D Wellness Haven" : "Tổ Ấm Dưỡng Sinh 3D"}</Text>
            </View>
          </View>

          {/* Nội dung Mầm Nhỏ dặn dò */}
          <View style={styles.loreBox}>
            <Text style={styles.loreTitle}>
              {locale === "en"
                ? "🏡 Gorgeous home... but currently empty inside!"
                : "🏡 Căn nhà quá đẹp... nhưng bên trong còn trống trải!"}
            </Text>
            <Text style={styles.loreBody}>
              {locale === "en" ? (
                <>
                  The chalet is currently empty. Complete daily quests and solve detective health
                  cases to earn <Text style={styles.highlightCoins}>Gold Coins</Text> and furnish a
                  luxurious, cozy alpine home!
                </>
              ) : (
                <>
                  Hiện tại căn nhà chưa có đồ đạc gì cả. Chúng ta cần hoàn thành các
                  nhiệm vụ hàng ngày và giải mã các vụ án trinh thám để kiếm thêm
                  nhiều <Text style={styles.highlightCoins}>Xu Vàng (Coins)</Text>, sắm
                  sửa nội thất sang trọng và ấm cúng nhé!
                </>
              )}
            </Text>
          </View>

          {/* Quà tặng khởi nghiệp */}
          <View style={styles.rewardStrip}>
            <View style={styles.rewardItem}>
              <Home size={15} color="#34d399" />
              <Text style={styles.rewardText}>{locale === "en" ? "1x 3D Chalet Haven" : "1x Biệt thự Chalet 3D"}</Text>
            </View>
            <View style={styles.rewardItem}>
              <Coins size={15} color="#fbbf24" />
              <Text style={styles.rewardText}>{locale === "en" ? "+50 Starter Coins" : "+50 Xu Tân Thủ"}</Text>
            </View>
          </View>

          {/* Nút hành động */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnPrimary}
              activeOpacity={0.85}
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Awesome, let's begin" : "Đã hiểu và tiếp tục"}
            >
              <Text style={styles.btnPrimaryText}>{locale === "en" ? "AWESOME, LET'S BEGIN!" : "TUYỆT VỜI, BẮT ĐẦU NÀO!"}</Text>
              <ArrowRight size={16} color="#042f2e" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 8, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialogCard: {
    backgroundColor: "#081c17",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.45)",
    padding: 20,
    alignItems: "center",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  goldKeyAura: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.4)",
    marginTop: -8,
    marginBottom: 10,
  },
  goldKeyInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  congratsBadge: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#fef3c7",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 14,
  },
  housePreviewBox: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    marginBottom: 12,
    position: "relative",
  },
  houseImage: {
    width: "100%",
    height: "100%",
  },
  houseBadgeOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(6, 26, 21, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  houseBadgeText: {
    color: "#6ee7b7",
    fontSize: 10.5,
    fontWeight: "700",
  },
  loreBox: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.22)",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    marginBottom: 12,
  },
  loreTitle: {
    color: "#a7f3d0",
    fontSize: 12.5,
    fontWeight: "800",
    marginBottom: 4,
  },
  loreBody: {
    color: "#d1fae5",
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  highlightCoins: {
    color: "#f59e0b",
    fontWeight: "900",
  },
  rewardStrip: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rewardText: {
    color: "#e2e8f0",
    fontSize: 11.5,
    fontWeight: "700",
  },
  actionRow: {
    width: "100%",
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f59e0b",
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: {
    color: "#042f2e",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
