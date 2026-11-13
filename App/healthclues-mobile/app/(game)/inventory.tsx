import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Backpack,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  BookmarkCheck,
  Info,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react-native";
import { colors, fonts, typography, spacing, radius } from "@/theme";
import { t } from "@/localization";
import { TopHud } from "@/components/common/TopHud";
import { GameIcon, IconTone } from "@/components/common/GameIcon";
import { useAuth } from "@/hooks/useAuth";
import { useWorld } from "@/hooks/useWorld";

export type ItemType = "equipment" | "knowledge";

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  category: "artifact" | "tool" | "herbs" | "nutrition" | "sleep_lore";
  categoryLabel: string;
  icon: string;
  tone: IconTone;
  rarity: "Phổ biến" | "Hiếm" | "Huyền thoại";
  rarityColor: string;
  description: string;
  pubmedId?: string;
  equippedSlot?: number | null;
}

const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  // 1. EQUIPPABLE GAMEPLAY ITEMS & ARTIFACTS
  {
    id: "item-ancient-sleep-key",
    name: "Chìa Khóa Cổ Sleep Valley",
    type: "equipment",
    category: "artifact",
    categoryLabel: "Cổ Vật Mở Khóa",
    icon: "boss:key",
    tone: "gold",
    rarity: "Huyền thoại",
    rarityColor: "#f59e0b",
    description: "Bảo vật nhận được từ Thần Thụ Thung Lũng Giấc Ngủ. Mở khóa rương tri thức y khoa và giải thưởng tuần.",
    equippedSlot: 1,
  },
  {
    id: "item-spring-water-flask",
    name: "Bình Nước Suối Khoáng Ban Mai",
    type: "equipment",
    category: "tool",
    categoryLabel: "Dụng Cụ Đồng Hành",
    icon: "inv:water",
    tone: "sky",
    rarity: "Phổ biến",
    rarityColor: "#38bdf8",
    description: "Dụng cụ thám hiểm nhắc nhở uống nước ấm từng ngụm nhỏ ngay khi thức dậy, hỗ trợ thận và tiêu hóa bài tiết tự nhiên.",
    equippedSlot: 2,
  },
  {
    id: "item-lifestyle-compass",
    name: "La Bàn Thám Hiểm Lối Sống",
    type: "equipment",
    category: "tool",
    categoryLabel: "Trang Bị Định Vị",
    icon: "compass:nav",
    tone: "emerald",
    rarity: "Hiếm",
    rarityColor: "#10b981",
    description: "Trang bị định vị chỉ đường đến các trạm chuyên gia y học lối sống trong các vùng đất HealthClues.",
    equippedSlot: 3,
  },

  // 2. KNOWLEDGE COLLECTION LOREBOOK (EXPLORATION & LEARNING ONLY)
  {
    id: "item-tra-hoa-cuc",
    name: "Trà Hoa Cúc Thảo Mộc",
    type: "knowledge",
    category: "herbs",
    categoryLabel: "Dược Thảo",
    icon: "inv:herbs",
    tone: "emerald",
    rarity: "Phổ biến",
    rarityColor: "#10b981",
    description: "Hoa cúc sấy tự nhiên chứa apigenin, gắn vào thụ thể GABA tại não bộ giúp dễ dàng đi vào giấc ngủ sâu tự nhiên.",
    pubmedId: "PubMed PMID: 29168202",
    equippedSlot: null,
  },
  {
    id: "item-bo-bac-ha",
    name: "Bó Thảo Mộc Bạc Hà Rừng",
    type: "knowledge",
    category: "herbs",
    categoryLabel: "Dược Thảo",
    icon: "inv:herbs",
    tone: "emerald",
    rarity: "Phổ biến",
    rarityColor: "#10b981",
    description: "Menthol chiết xuất tự nhiên hỗ trợ làm dịu đường hô hấp trên và giảm căng thẳng sau một ngày dài làm việc.",
    pubmedId: "PubMed PMID: 31221987",
    equippedSlot: null,
  },
  {
    id: "item-tart-cherry-lore",
    name: "Tri Thức Dinh Dưỡng Quả Anh Đào",
    type: "knowledge",
    category: "nutrition",
    categoryLabel: "Dinh Dưỡng",
    icon: "inv:nutrition",
    tone: "amber",
    rarity: "Hiếm",
    rarityColor: "#f59e0b",
    description: "Nghiên cứu lối sống ghi nhận nhóm quả mọng giàu anthocyanin tự nhiên hỗ trợ quá trình chuyển hóa acid uric lành mạnh.",
    pubmedId: "PubMed PMID: 23023818",
    equippedSlot: null,
  },
  {
    id: "item-breath-478-lore",
    name: "Phương Pháp Thở Thư Giãn 4-7-8",
    type: "knowledge",
    category: "sleep_lore",
    categoryLabel: "Giấc Ngủ & Thần Kinh",
    icon: "trail:sleep",
    tone: "lavender",
    rarity: "Hiếm",
    rarityColor: "#a855f7",
    description: "Kỹ thuật hít thở điều hòa nhịp tim, giảm kích hoạt hệ thần kinh giao cảm trước giờ ngủ.",
    pubmedId: "Sleep Med Rev 2021",
    equippedSlot: null,
  },
];

export default function InventoryScreen() {
  const strings = t();
  const { isAuthenticated } = useAuth();
  const {
    xpTotal,
    currencies,
    loading,
    refreshing,
    refreshWorld,
  } = useWorld(isAuthenticated);

  const [activeTab, setActiveTab] = useState<ItemType>("equipment");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>(DEFAULT_INVENTORY_ITEMS);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const triggerSuccessHaptic = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  // 3 Equipment Slots
  const equipmentSlots = [1, 2, 3].map((pos) => {
    const item = items.find((i) => i.equippedSlot === pos);
    return { pos, item };
  });

  const handleEquipSlot = (item: InventoryItem, targetSlot: number) => {
    if (item.type !== "equipment") return;
    triggerSuccessHaptic();

    setItems((prev) =>
      prev.map((i) => {
        // If this item is already in this slot -> unequip
        if (i.id === item.id) {
          if (i.equippedSlot === targetSlot) return { ...i, equippedSlot: null };
          return { ...i, equippedSlot: targetSlot };
        }
        // If another item was in this target slot -> unequip it
        if (i.equippedSlot === targetSlot) {
          return { ...i, equippedSlot: null };
        }
        return i;
      })
    );
    setSelectedItem(null);
  };

  const handleUnequip = (item: InventoryItem) => {
    triggerSuccessHaptic();
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, equippedSlot: null } : i))
    );
    setSelectedItem(null);
  };

  const filteredItems = items.filter((item) => item.type === activeTab);
  const equippedCount = items.filter((i) => i.equippedSlot !== null).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopHud
        level={Math.max(1, Math.floor(xpTotal / 100) + 1)}
        expTotal={xpTotal}
        keys={currencies.keys}
        fragments={currencies.fragments}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshWorld}
            tintColor={colors.emerald}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.headerIconBox}>
              <Backpack size={20} color={colors.gold} />
            </View>
            <View>
              <Text style={styles.title}>Túi Đồ & Sổ Tay Tri Thức</Text>
              <Text style={styles.subtitle}>
                Quản lý trang bị nhiệm vụ và tra cứu tri thức y khoa lối sống
              </Text>
            </View>
          </View>
        </View>

        {/* 3 Active Equipment Slots HUD */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>3 Ô Trang Bị Nhiệm Vụ</Text>
            <View style={styles.slotUsageBadge}>
              <Text style={styles.slotUsageText}>
                {equippedCount}/3 Đang Dùng
              </Text>
            </View>
          </View>

          <View style={styles.slotsRow}>
            {equipmentSlots.map(({ pos, item }) => (
              <TouchableOpacity
                key={pos}
                style={[
                  styles.slotCard,
                  item && styles.slotCardActive,
                ]}
                onPress={() => {
                  triggerHaptic();
                  if (item) setSelectedItem(item);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.slotHeader}>
                  <Text style={styles.slotIndex}>Ô {pos}</Text>
                  {item ? (
                    <View style={styles.equippedTinyBadge}>
                      <Sparkles size={8} color={colors.gold} />
                      <Text style={styles.equippedTinyText}>Trang bị</Text>
                    </View>
                  ) : (
                    <Text style={styles.emptySlotHint}>Trống</Text>
                  )}
                </View>

                {item ? (
                  <View style={styles.slotBody}>
                    <View
                      style={[
                        styles.slotIconCircle,
                        { borderColor: item.rarityColor },
                      ]}
                    >
                      <GameIcon name={item.icon} size={22} tone={item.tone} />
                    </View>
                    <Text style={styles.slotItemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.slotCategoryText}>
                      {item.categoryLabel}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.slotEmptyBody}>
                    <Text style={styles.slotEmptyPlus}>+</Text>
                    <Text style={styles.slotEmptyGuide}>Chọn bảo vật</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informational Bridge Banner */}
        <View style={styles.bridgeBanner}>
          <Info size={14} color={colors.emeraldLight} />
          <Text style={styles.bridgeBannerText}>
            Thói quen sức khỏe hàng ngày được theo dõi tại tab "Nhiệm Vụ" & "Hành Trình". Túi đồ lưu trữ trang bị và tri thức y khoa.
          </Text>
        </View>

        {/* Main Tabs: [Trang Bị & Bảo Vật] vs [Sổ Tay Tri Thức] */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[
              styles.switchTabBtn,
              activeTab === "equipment" && styles.switchTabBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="tab-equipment"
            onPress={() => {
              triggerHaptic();
              setActiveTab("equipment");
            }}
          >
            <Backpack
              size={14}
              color={activeTab === "equipment" ? "#061814" : colors.textSecondary}
            />
            <Text
              style={[
                styles.switchTabText,
                activeTab === "equipment" && styles.switchTabTextActive,
              ]}
            >
              Vật Phẩm & Trang Bị ({items.filter((i) => i.type === "equipment").length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchTabBtn,
              activeTab === "knowledge" && styles.switchTabBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="tab-knowledge"
            onPress={() => {
              triggerHaptic();
              setActiveTab("knowledge");
            }}
          >
            <BookOpen
              size={14}
              color={activeTab === "knowledge" ? "#061814" : colors.textSecondary}
            />
            <Text
              style={[
                styles.switchTabText,
                activeTab === "knowledge" && styles.switchTabTextActive,
              ]}
            >
              Sổ Tay Tri Thức ({items.filter((i) => i.type === "knowledge").length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          {filteredItems.map((item) => {
            const isEquipped = item.equippedSlot !== null && item.equippedSlot !== undefined;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  isEquipped && styles.itemCardEquipped,
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedItem(item);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.itemIconBox,
                    { borderColor: item.rarityColor },
                  ]}
                >
                  <GameIcon name={item.icon} size={24} tone={item.tone} />
                </View>

                <View style={styles.itemInfoCol}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemTitleText} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {isEquipped && (
                      <View style={styles.equippedBadgePill}>
                        <Sparkles size={9} color={colors.gold} />
                        <Text style={styles.equippedBadgeText}>
                          Ô {item.equippedSlot}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.itemDescSnippet} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.itemFooterRow}>
                    <View
                      style={[
                        styles.categoryPill,
                        { backgroundColor: `${item.rarityColor}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          { color: item.rarityColor },
                        ]}
                      >
                        {item.categoryLabel}
                      </Text>
                    </View>

                    {item.pubmedId ? (
                      <Text style={styles.pubmedTag}>
                        {item.pubmedId}
                      </Text>
                    ) : (
                      <Text style={styles.rarityTag}>
                        {item.rarity}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Item Details RPG Modal Sheet */}
      {selectedItem && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedItem(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedItem(null)}
          >
            <TouchableOpacity
              style={styles.modalCard}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation?.()}
            >
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              {/* Modal Top Bar */}
              <View style={styles.modalTopBar}>
                <View
                  style={[
                    styles.modalRarityBadge,
                    { backgroundColor: `${selectedItem.rarityColor}22` },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalRarityBadgeText,
                      { color: selectedItem.rarityColor },
                    ]}
                  >
                    {selectedItem.rarity.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedItem(null)}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="close-modal-btn"
                >
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Large Icon & Title */}
              <View style={styles.modalCenterHeader}>
                <View
                  style={[
                    styles.modalIconBox,
                    { borderColor: selectedItem.rarityColor },
                  ]}
                >
                  <GameIcon
                    name={selectedItem.icon}
                    size={38}
                    tone={selectedItem.tone}
                  />
                </View>
                <Text style={styles.modalTitleText}>{selectedItem.name}</Text>
                <Text
                  style={[
                    styles.modalCategorySub,
                    { color: selectedItem.rarityColor },
                  ]}
                >
                  {selectedItem.categoryLabel}
                </Text>
              </View>

              {/* Description & PubMed */}
              <View style={styles.modalDescBox}>
                <Text style={styles.modalDescText}>
                  {selectedItem.description}
                </Text>
                {selectedItem.pubmedId && (
                  <View style={styles.pubmedBadgeRow}>
                    <BookmarkCheck size={14} color={colors.emeraldLight} />
                    <Text style={styles.pubmedBadgeText}>
                      Chứng cứ y khoa: {selectedItem.pubmedId}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons: Equippable vs Knowledge Lore */}
              {selectedItem.type === "equipment" ? (
                <View style={styles.modalActionsBox}>
                  {selectedItem.equippedSlot ? (
                    <View style={styles.equippedActionsCol}>
                      <View style={styles.currentEquippedHintRow}>
                        <Sparkles size={13} color={colors.gold} />
                        <Text style={styles.currentEquippedHintText}>
                          Đang trang bị tại Ô {selectedItem.equippedSlot}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.unequipBtn}
                        onPress={() => handleUnequip(selectedItem)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.unequipBtnText}>
                          Tháo Khỏi Ô {selectedItem.equippedSlot}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.chooseSlotCol}>
                      <Text style={styles.chooseSlotLabel}>
                        Chọn ô để trang bị vào bộ hành trình:
                      </Text>
                      <View style={styles.slotButtonsRow}>
                        {[1, 2, 3].map((slotNumber) => (
                          <TouchableOpacity
                            key={slotNumber}
                            style={styles.slotChoiceBtn}
                            onPress={() => handleEquipSlot(selectedItem, slotNumber)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.slotChoiceText}>
                              Trang bị Ô {slotNumber}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.knowledgeLoreFooter}>
                  <View style={styles.loreVerifiedBadge}>
                    <ShieldCheck size={14} color={colors.emeraldLight} />
                    <Text style={styles.loreVerifiedText}>
                      Tri thức y khoa lối sống đã lưu vào Sổ Tay
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.loreCloseBtn}
                    onPress={() => setSelectedItem(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loreCloseBtnText}>Đóng Tri Thức</Text>
                  </TouchableOpacity>
                </View>
              )}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textGold,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  slotUsageBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  slotUsageText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.emeraldLight,
  },
  slotsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  slotCard: {
    flex: 1,
    backgroundColor: "rgba(10, 31, 26, 0.75)",
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    minHeight: 110,
    justifyContent: "space-between",
  },
  slotCardActive: {
    borderColor: "rgba(245, 158, 11, 0.4)",
    backgroundColor: "rgba(14, 38, 32, 0.9)",
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotIndex: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "800",
    color: colors.goldLight,
  },
  equippedTinyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  equippedTinyText: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    fontWeight: "700",
    color: colors.goldLight,
  },
  emptySlotHint: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  slotBody: {
    alignItems: "center",
    marginTop: 4,
  },
  slotIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  slotItemName: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 14.5,
  },
  slotCategoryText: {
    fontFamily: fonts.uiMedium,
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  slotEmptyBody: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  slotEmptyPlus: {
    fontSize: 22,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.3)",
  },
  slotEmptyGuide: {
    fontFamily: fonts.uiMedium,
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bridgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    marginBottom: spacing.md,
  },
  bridgeBannerText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
    gap: 4,
  },
  switchTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  switchTabBtnActive: {
    backgroundColor: colors.emeraldLight,
  },
  switchTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  switchTabTextActive: {
    color: "#061814",
    fontWeight: "800",
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 31, 26, 0.8)",
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: spacing.sm,
    alignItems: "center",
  },
  itemCardEquipped: {
    borderColor: "rgba(245, 158, 11, 0.35)",
    backgroundColor: "rgba(13, 36, 30, 0.9)",
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfoCol: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  itemTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  equippedBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  equippedBadgeText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.goldLight,
  },
  itemDescSnippet: {
    fontFamily: fonts.ui,
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  itemFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  categoryPillText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "700",
  },
  pubmedTag: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 10.5,
    color: colors.emeraldLight,
    fontWeight: "600",
  },
  rarityTag: {
    fontFamily: fonts.uiMedium,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "90%",
    backgroundColor: "rgba(8, 28, 23, 0.98)",
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modalTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalRarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.full,
  },
  modalRarityBadgeText: {
    fontFamily: fonts.uiBold,
    fontSize: 10.5,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
  modalCenterHeader: {
    alignItems: "center",
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  modalCategorySub: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  modalDescBox: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 8,
  },
  modalDescText: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 18,
  },
  pubmedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  pubmedBadgeText: {
    fontSize: 11,
    color: colors.emeraldLight,
    fontWeight: "700",
  },
  modalActionsBox: {
    gap: 8,
  },
  equippedActionsCol: {
    gap: 8,
    alignItems: "center",
  },
  currentEquippedHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currentEquippedHintText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.goldLight,
  },
  unequipBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 10,
    width: "100%",
    borderRadius: radius.md,
    alignItems: "center",
  },
  unequipBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fca5a5",
  },
  chooseSlotCol: {
    gap: 6,
  },
  chooseSlotLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  slotButtonsRow: {
    flexDirection: "row",
    gap: 6,
  },
  slotChoiceBtn: {
    flex: 1,
    backgroundColor: colors.emeraldLight,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  slotChoiceText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#061814",
  },
  knowledgeLoreFooter: {
    gap: 8,
    alignItems: "center",
  },
  loreVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loreVerifiedText: {
    fontSize: 11,
    color: colors.emeraldLight,
    fontWeight: "600",
  },
  loreCloseBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 10,
    width: "100%",
    borderRadius: radius.md,
    alignItems: "center",
  },
  loreCloseBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
