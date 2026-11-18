import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Sparkles,
  Compass,
  Scroll,
  CheckCircle2,
  Home,
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  Coins,
  HeartPulse,
} from "lucide-react-native";
import { MascotSprout } from "./MascotSprout";
import { HouseGiftCelebration } from "./HouseGiftCelebration";
import { playDolphinChirp, playDolphinGiggle, playDolphinWhistle } from "../audio/dolphinAudio";
import { addCoins } from "../economy/economyStorage";

export const VILLAGE_TUTORIAL_COMPLETED_KEY = "healthclues-village-tutorial-v2-completed";

interface VillageTutorialModalProps {
  visible: boolean;
  onFinish: () => void;
  onNavigateTab?: (tabName: string) => void;
  onOpenDetective?: () => void;
}

export function VillageTutorialModal({
  visible,
  onFinish,
  onNavigateTab,
  onOpenDetective,
}: VillageTutorialModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showHouseGift, setShowHouseGift] = useState(false);
  const [userConcernText, setUserConcernText] = useState<string>("Sức khỏe tổng quát & giấc ngủ");
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 28, 440);

  // Đọc mối quan tâm người dùng đã chọn từ Onboarding Quiz
  useEffect(() => {
    AsyncStorage.getItem("healthclues-starter-profile").then((raw) => {
      if (raw) {
        try {
          const data = JSON.parse(raw);
          const p = data.profile;
          if (p?.concernNote && p.concernNote.trim().length > 0) {
            setUserConcernText(p.concernNote.trim());
          } else if (p?.primaryConcernId) {
            const map: Record<string, string> = {
              sleep: "Mất ngủ & Khó ngủ",
              weight: "Cân nặng & Vóc dáng",
              stress: "Tinh thần & Căng thẳng",
              gout: "Gút & Axit Uric",
              blood_pressure: "Huyết áp & Tim mạch",
              digestion: "Tiêu hóa & Dạ dày",
              migraine: "Đau đầu & Đau nửa đầu",
              general: "Chăm sóc sức khỏe toàn diện",
            };
            setUserConcernText(map[p.primaryConcernId] || "Chăm sóc sức khỏe");
          }
        } catch {}
      }
    });
  }, [visible]);

  const handleNext = () => {
    playDolphinChirp(0.35);
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      setStep(4);
      // Tự động mở popup quà tặng nhà khi tới bước 4
      setTimeout(() => setShowHouseGift(true), 150);
    } else if (step === 4) setStep(5);
    else if (step === 5) {
      handleCompleteTutorial();
    }
  };

  const handlePrev = () => {
    playDolphinChirp(0.3);
    if (step > 1) setStep((step - 1) as any);
  };

  const handleCompleteTutorial = async () => {
    playDolphinWhistle(0.4);
    await AsyncStorage.setItem(VILLAGE_TUTORIAL_COMPLETED_KEY, "true");
    // Thưởng 50 Xu tân thủ khi xem xong hướng dẫn
    await addCoins(50);
    onFinish();
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.dialogCard, { width: cardWidth }]}>
            {/* Header thanh tiến trình 5 bước */}
            <View style={styles.stepIndicatorRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.stepBar,
                    i === step && styles.stepBarActive,
                    i < step && styles.stepBarDone,
                  ]}
                />
              ))}
            </View>

            {/* Linh vật Mầm Nhỏ với nhịp thở phập phồng & tương tác */}
            <View style={styles.mascotArea}>
              <MascotSprout
                mood={step === 4 ? "laugh" : step === 5 ? "wave" : "talk"}
                size={84}
                showBubbleHint={false}
              />
            </View>

            {/* Khung nội dung theo từng bước */}
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
              {step === 1 && (
                <View style={styles.stepContent}>
                  <View style={styles.badgeRow}>
                    <HeartPulse size={14} color="#34d399" />
                    <Text style={styles.badgeText}>CHÀO MỪNG ĐẾN LÀNG SỐNG KHỎE</Text>
                  </View>
                  <Text style={styles.title}>Xin chào bạn thám hiểm!</Text>
                  <Text style={styles.bodyText}>
                    Mình đã nhận được thông tin về vấn đề bạn đang quan tâm:{" "}
                    <Text style={styles.highlightText}>"{userConcernText}"</Text>.
                  </Text>
                  <Text style={styles.bodyText}>
                    Mình đã chuẩn bị sẵn những thói quen sống khỏe phù hợp nhất để bạn bắt đầu
                    rèn luyện ngay hôm nay! Giờ hãy để mình hướng dẫn bạn cách khám phá ngôi làng
                    này nhé!
                  </Text>
                </View>
              )}

              {step === 2 && (
                <View style={styles.stepContent}>
                  <View style={styles.badgeRow}>
                    <Scroll size={14} color="#fbbf24" />
                    <Text style={styles.badgeText}>TAB HÀNH TRÌNH</Text>
                  </View>
                  <Text style={styles.title}>Đồng hành & Lập mục tiêu</Text>
                  <Text style={styles.bodyText}>
                    Tại <Text style={styles.highlightText}>Hành Trình</Text>: Mình sẽ luôn đồng
                    hành cùng bạn trên con đường 7 ngày rèn luyện.
                  </Text>
                  <View style={styles.featureBox}>
                    <Text style={styles.featureText}>
                      • Bạn có thể tự lập và theo dõi các mục tiêu sống khỏe cho riêng mình.
                    </Text>
                    <Text style={styles.featureText}>
                      • Hãy bấm dấu <Text style={styles.boldPlus}>➕ Thêm Thói Quen</Text> bất cứ
                      lúc nào để bổ sung bài tập hoặc mẹo dinh dưỡng từ ngân hàng y học!
                    </Text>
                  </View>
                </View>
              )}

              {step === 3 && (
                <View style={styles.stepContent}>
                  <View style={styles.badgeRow}>
                    <CheckCircle2 size={14} color="#34d399" />
                    <Text style={styles.badgeText}>TAB NHIỆM VỤ HÀNG NGÀY</Text>
                  </View>
                  <Text style={styles.title}>Check-in nhận Xu & EXP</Text>
                  <Text style={styles.bodyText}>
                    Tại <Text style={styles.highlightText}>Nhiệm Vụ</Text>: Bảng nhiệm vụ gỗ Alpine
                    được cập nhật mỗi sáng.
                  </Text>
                  <View style={styles.featureBox}>
                    <Text style={styles.featureText}>
                      • Mỗi ngày sau khi thực hiện thói quen, bạn chỉ cần 1 chạm đóng{" "}
                      <Text style={styles.highlightText}>Dấu Triện Mộc</Text> để check-in.
                    </Text>
                    <Text style={styles.featureText}>
                      • Bạn sẽ nhận ngay <Text style={styles.highlightCoins}>+35 đến +50 EXP</Text>{" "}
                      để nâng cấp và <Text style={styles.highlightCoins}>Xu vàng (Coins 🪙)</Text>{" "}
                      vào túi đồ!
                    </Text>
                  </View>
                </View>
              )}

              {step === 4 && (
                <View style={styles.stepContent}>
                  <View style={styles.badgeRow}>
                    <Home size={14} color="#f59e0b" />
                    <Text style={styles.badgeText}>TAB NGÔI NHÀ 3D</Text>
                  </View>
                  <Text style={styles.title}>Tặng Căn Nhà Mới Của Bạn!</Text>
                  <Text style={styles.bodyText}>
                    Bạn biết không?{" "}
                    <Text style={styles.highlightText}>
                      Hoàn thành nhiệm vụ đầu tiên, bạn sẽ được tặng ngay 1 căn nhà!
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.openHouseBtn}
                    activeOpacity={0.8}
                    onPress={() => setShowHouseGift(true)}
                  >
                    <Home size={16} color="#042f2e" />
                    <Text style={styles.openHouseBtnText}>Xem Căn Nhà Được Tặng 🏡</Text>
                  </TouchableOpacity>
                  <Text style={styles.bodyNote}>
                    Căn nhà quá đẹp đúng không nào! Nhưng bên trong vẫn còn trống trải. Chúng ta cần
                    làm nhiệm vụ và giải mã hồ sơ để có tiền sắm thêm nội thất sang trọng, ấm cúng nhé!
                  </Text>
                </View>
              )}

              {step === 5 && (
                <View style={styles.stepContent}>
                  <View style={styles.badgeRow}>
                    <Search size={14} color="#38bdf8" />
                    <Text style={styles.badgeText}>GAME TRINH THÁM CƠ THỂ</Text>
                  </View>
                  <Text style={styles.title}>Bí Mật Của Ngôi Làng!</Text>
                  <Text style={styles.bodyText}>
                    Bạn biết không, ở ngôi làng này{" "}
                    <Text style={styles.highlightRed}>không hề có bác sĩ!</Text>
                  </Text>
                  <Text style={styles.bodyText}>
                    Gần đây dân làng hay bị mất ngủ, những cơn đau nhức bí ẩn... Họ rất sẵn sàng{" "}
                    <Text style={styles.highlightCoins}>trả tiền (Xu)</Text> cho bạn nếu bạn giúp họ
                    vượt qua và khám phá ra các nguyên nhân bí ẩn đó!
                  </Text>
                  <View style={styles.detectiveRewardBox}>
                    <Coins size={16} color="#fbbf24" />
                    <Text style={styles.detectiveRewardText}>
                      Mỗi vụ án phá thành công: Nhận 50 - 150 Xu & Rương quà nội thất!
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Nút điều hướng các bước */}
            <View style={styles.footerRow}>
              {step > 1 ? (
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={handlePrev}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={15} color="#94a3b8" />
                  <Text style={styles.btnSecondaryText}>Quay lại</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 80 }} />
              )}

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.btnPrimaryText}>
                  {step === 5 ? "KHÁM PHÁ NGAY (+50 XU)" : "Tiếp theo"}
                </Text>
                <ArrowRight size={15} color="#042f2e" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hiệu ứng trao chìa khóa & tặng căn nhà mới */}
      <HouseGiftCelebration
        visible={showHouseGift}
        onClose={() => setShowHouseGift(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 8, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
  },
  dialogCard: {
    backgroundColor: "#071c17",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.4)",
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    maxHeight: "92%",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  stepIndicatorRow: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
    marginBottom: 8,
  },
  stepBar: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  stepBarActive: {
    backgroundColor: "#10b981",
  },
  stepBarDone: {
    backgroundColor: "#059669",
  },
  mascotArea: {
    alignItems: "center",
    marginVertical: 4,
  },
  scrollContent: {
    maxHeight: 280,
  },
  scrollInner: {
    paddingVertical: 4,
  },
  stepContent: {
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    marginBottom: 8,
  },
  badgeText: {
    color: "#6ee7b7",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  bodyText: {
    color: "#cbd5e1",
    fontSize: 12.5,
    lineHeight: 18.5,
    textAlign: "center",
    marginBottom: 8,
  },
  highlightText: {
    color: "#34d399",
    fontWeight: "800",
  },
  highlightCoins: {
    color: "#fbbf24",
    fontWeight: "800",
  },
  highlightRed: {
    color: "#f87171",
    fontWeight: "800",
  },
  boldPlus: {
    color: "#fbbf24",
    fontWeight: "900",
  },
  featureBox: {
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 10,
    width: "100%",
    gap: 6,
    marginTop: 4,
  },
  featureText: {
    color: "#e2e8f0",
    fontSize: 12,
    lineHeight: 17,
  },
  openHouseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f59e0b",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 10,
    width: "100%",
  },
  openHouseBtnText: {
    color: "#042f2e",
    fontSize: 13,
    fontWeight: "900",
  },
  bodyNote: {
    color: "#94a3b8",
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  detectiveRewardBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    width: "100%",
  },
  detectiveRewardText: {
    color: "#fef3c7",
    fontSize: 11.5,
    fontWeight: "700",
    flex: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnSecondaryText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#34d399",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: "#34d399",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: {
    color: "#042f2e",
    fontSize: 12.5,
    fontWeight: "900",
  },
});
