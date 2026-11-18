import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ShoppingBag,
  Coins,
  Check,
  Lock,
  X,
  Sparkles,
  Sofa,
  Bed,
  Flame,
  Music,
  Image as ImageIcon,
  Trees,
  Lamp,
} from "lucide-react-native";
import { FurnitureShopItem, FURNITURE_CATALOG } from "./home3dConfig";
import { useEconomy } from "../economy/useEconomy";
import { useLocale } from "@/localization";
import { playDolphinChirp, playDolphinWhistle } from "../audio/dolphinAudio";

const HOME_STATE_KEY = "healthclues-home-state-v1";

interface HomeFurnitureShopModalProps {
  visible: boolean;
  onClose: () => void;
  onItemPurchased?: (itemId: string) => void;
}

export function HomeFurnitureShopModal({
  visible,
  onClose,
  onItemPurchased,
}: HomeFurnitureShopModalProps) {
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 24, 460);
  const { coins, spendCoins } = useEconomy();

  const [unlockedItemIds, setUnlockedItemIds] = useState<string[]>(["sofa_luxury"]);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<"all" | "living" | "bedroom" | "kitchen">("all");
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPurchaseMsg(null);
      AsyncStorage.getItem(HOME_STATE_KEY).then((raw) => {
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (Array.isArray(data.unlockedItems)) {
              setUnlockedItemIds(data.unlockedItems);
            }
          } catch {}
        }
      });
    }
  }, [visible]);

  const handleBuy = async (item: FurnitureShopItem) => {
    if (unlockedItemIds.includes(item.id)) return;
    if (coins < item.priceCoins) {
      setPurchaseMsg(`Bạn còn thiếu ${item.priceCoins - coins} Xu để mua món này!`);
      return;
    }

    const success = await spendCoins(item.priceCoins);
    if (!success) {
      setPurchaseMsg("Không đủ số dư Xu!");
      return;
    }

    playDolphinWhistle(0.45);
    const nextUnlocked = [...unlockedItemIds, item.id];
    setUnlockedItemIds(nextUnlocked);

    // Lưu vào AsyncStorage của Home
    try {
      const raw = await AsyncStorage.getItem(HOME_STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.unlockedItems = nextUnlocked;
      await AsyncStorage.setItem(HOME_STATE_KEY, JSON.stringify(parsed));
    } catch {}

    setPurchaseMsg(`Đã mua thành công: ${item.nameVi}!`);
    onItemPurchased?.(item.id);
  };

  const getItemIcon = (id: string) => {
    switch (id) {
      case "sofa_luxury":
        return <Sofa size={18} color="#f59e0b" />;
      case "bed_master":
        return <Bed size={18} color="#a78bfa" />;
      case "fireplace_stone":
        return <Flame size={18} color="#f97316" />;
      case "piano_grand":
        return <Music size={18} color="#38bdf8" />;
      case "painting_fireplace":
        return <ImageIcon size={18} color="#ec4899" />;
      case "plant_pot_alps":
        return <Trees size={18} color="#34d399" />;
      case "lantern_hanging":
        return <Lamp size={18} color="#fbbf24" />;
      default:
        return <Sparkles size={18} color="#fbbf24" />;
    }
  };

  const filteredItems = FURNITURE_CATALOG.filter(
    (item) => selectedRoomFilter === "all" || item.room === selectedRoomFilter
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.mainCard, { width: cardWidth }]}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.shopIconBox}>
                <ShoppingBag size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {locale === "en" ? "3D Furniture Shop" : "Cửa Hàng Nội Thất 3D"}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {locale === "en" ? "Decorate your home with Gold Coins" : "Trang hoàng tổ ấm bằng Xu Vàng"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng cửa hàng nội thất"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Wallet Balance Strip */}
          <View style={styles.walletStrip}>
            <View style={styles.walletLeft}>
              <Text style={styles.walletLabel}>
                {locale === "en" ? "Your balance:" : "Số dư của bạn:"}
              </Text>
              <View style={styles.coinsBadge}>
                <Coins size={15} color="#fbbf24" />
                <Text style={styles.coinsValue}>
                  {coins} {locale === "en" ? "Coins" : "Xu"}
                </Text>
              </View>
            </View>
            <Text style={styles.walletHint}>
              {locale === "en" ? "Complete quests & solve clues to earn more Coins!" : "Làm nhiệm vụ & Giải mã để kiếm thêm Xu!"}
            </Text>
          </View>

          {/* Feedback Message */}
          {purchaseMsg && (
            <View style={styles.msgBanner}>
              <Sparkles size={13} color="#f59e0b" />
              <Text style={styles.msgText}>{purchaseMsg}</Text>
            </View>
          )}

          {/* Category Tabs */}
          <View style={styles.tabsRow}>
            {(
              [
                { id: "all", label: locale === "en" ? "All" : "Tất cả" },
                { id: "living", label: locale === "en" ? "Living Room" : "Phòng Khách" },
                { id: "bedroom", label: locale === "en" ? "Bedroom" : "Phòng Ngủ" },
                { id: "kitchen", label: locale === "en" ? "Kitchen" : "Bếp Ăn" },
              ] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabBtn,
                  selectedRoomFilter === tab.id && styles.tabBtnActive,
                ]}
                onPress={() => setSelectedRoomFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    selectedRoomFilter === tab.id && styles.tabBtnTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Item List */}
          <ScrollView style={styles.itemList} contentContainerStyle={styles.itemListInner}>
            {filteredItems.map((item) => {
              const isUnlocked = unlockedItemIds.includes(item.id);
              const canAfford = coins >= item.priceCoins;

              return (
                <View
                  key={item.id}
                  style={[styles.itemCard, isUnlocked && styles.itemCardUnlocked]}
                >
                  <View style={styles.itemIconContainer}>{getItemIcon(item.id)}</View>

                  <View style={styles.itemInfo}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{item.nameVi}</Text>
                      <View style={styles.roomTag}>
                        <Text style={styles.roomTagText}>{item.roomLabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemDesc}>{item.descVi}</Text>
                  </View>

                  <View style={styles.itemAction}>
                    {isUnlocked ? (
                      <View style={styles.unlockedBadge}>
                        <Check size={13} color="#34d399" />
                        <Text style={styles.unlockedText}>Đã có</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.buyBtn,
                          !canAfford && styles.buyBtnDisabled,
                        ]}
                        disabled={!canAfford}
                        activeOpacity={0.8}
                        onPress={() => handleBuy(item)}
                      >
                        <Coins size={12} color={canAfford ? "#042f2e" : "#64748b"} />
                        <Text
                          style={[
                            styles.buyBtnText,
                            !canAfford && styles.buyBtnTextDisabled,
                          ]}
                        >
                          {item.priceCoins === 0 ? "Miễn Phí" : `${item.priceCoins} Xu`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
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
    padding: 12,
  },
  mainCard: {
    backgroundColor: "#071c17",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.35)",
    maxHeight: "92%",
    flex: 1,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(10, 30, 25, 0.95)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shopIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 14.5,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#94a3b8",
    fontSize: 11,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  walletStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245, 158, 11, 0.2)",
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  walletLabel: {
    color: "#cbd5e1",
    fontSize: 11.5,
  },
  coinsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  coinsValue: {
    color: "#fbbf24",
    fontSize: 12.5,
    fontWeight: "900",
  },
  walletHint: {
    color: "#94a3b8",
    fontSize: 10.5,
    fontStyle: "italic",
  },
  msgBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  msgText: {
    color: "#6ee7b7",
    fontSize: 11.5,
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  tabBtnActive: {
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
  },
  tabBtnText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  tabBtnTextActive: {
    color: "#fbbf24",
    fontWeight: "900",
  },
  itemList: {
    flex: 1,
  },
  itemListInner: {
    padding: 12,
    gap: 8,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 30, 25, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  itemCardUnlocked: {
    borderColor: "rgba(52, 211, 153, 0.3)",
    backgroundColor: "rgba(6, 26, 21, 0.8)",
  },
  itemIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemName: {
    color: "#f8fafc",
    fontSize: 12.5,
    fontWeight: "800",
  },
  roomTag: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roomTagText: {
    color: "#94a3b8",
    fontSize: 9.5,
  },
  itemDesc: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 15,
  },
  itemAction: {
    justifyContent: "center",
  },
  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  unlockedText: {
    color: "#34d399",
    fontSize: 10.5,
    fontWeight: "900",
  },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  buyBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowOpacity: 0,
    elevation: 0,
  },
  buyBtnText: {
    color: "#042f2e",
    fontSize: 11,
    fontWeight: "900",
  },
  buyBtnTextDisabled: {
    color: "#64748b",
  },
});
