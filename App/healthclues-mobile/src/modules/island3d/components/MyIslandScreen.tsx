import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  DeviceEventEmitter,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Compass,
  ShoppingBag,
  Package,
  Wrench,
  RotateCw,
  Check,
  X,
  Coins,
  Sparkles,
  Info,
  Trash2,
  Home,
  CheckCircle2,
} from 'lucide-react-native';
import { Island3DCanvas } from './Island3DCanvas';
import { FloatingIslandEngine } from '../engine/FloatingIslandEngine';
import { DecorationSystem } from '../systems/decorationSystem';
import { loadPlayerIslandState, savePlayerIslandState } from '../systems/islandStorage';
import {
  getPlayerCoins,
  getOwnedDecorItems,
  buyDecorItem,
  checkLumiGiftStatus,
  setLumiGiftClaimed,
  IslandInventoryItem,
  ECONOMY_CHANGED_EVENT,
} from '../integration/healthcluesIntegration';
import { DECOR_CATALOG, STARTER_HOUSE_CONFIG } from '../constants/islandConfig';
import { IslandPlayerState, PlacedItemInstance, DecorCatalogItem } from '../types/island';

interface MyIslandScreenProps {
  userId?: string;
  onBackToHealthClues?: () => void;
}

export const MyIslandScreen: React.FC<MyIslandScreenProps> = ({
  userId = 'player_hero_01',
  onBackToHealthClues,
}) => {
  const { width, height } = useWindowDimensions();
  const engineRef = useRef<FloatingIslandEngine | null>(null);
  const decorSystemRef = useRef<DecorationSystem | null>(null);

  // Core State
  const [isLoading, setIsLoading] = useState(true);
  const [islandState, setIslandState] = useState<IslandPlayerState | null>(null);
  const [playerCoins, setPlayerCoins] = useState<number>(0);
  const [ownedDecorItems, setOwnedDecorItems] = useState<IslandInventoryItem[]>([]);

  // UI Modes & Modals
  const [isDecorationMode, setIsDecorationMode] = useState(false);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | null>(null);
  const [isPlacementValid, setIsPlacementValid] = useState(true);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showLumiWelcome, setShowLumiWelcome] = useState(false);
  const [selectedPlacedInstance, setSelectedPlacedInstance] = useState<PlacedItemInstance | null>(null);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  // 1. Load Initial State & Economy
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      const [state, coins, owned, hasClaimedLumi] = await Promise.all([
        loadPlayerIslandState(userId),
        getPlayerCoins(),
        getOwnedDecorItems(userId),
        checkLumiGiftStatus(userId),
      ]);

      if (!isMounted) return;
      setIslandState(state);
      setPlayerCoins(coins);
      setOwnedDecorItems(owned);
      decorSystemRef.current = new DecorationSystem(state, (next) => {
        setIslandState(next);
        savePlayerIslandState(next);
      });

      if (!hasClaimedLumi) {
        setShowLumiWelcome(true);
      }
      setIsLoading(false);
    }

    init();

    // Listen to coin changes from other parts of HealthClues
    const sub = DeviceEventEmitter.addListener(ECONOMY_CHANGED_EVENT, (ev) => {
      if (ev && typeof ev.coins === 'number') {
        setPlayerCoins(ev.coins);
      }
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, [userId]);

  // 2. Camera Controls
  const handleResetCamera = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetCamera();
    }
  }, []);

  // 3. Purchase Item from Shop
  const handleBuyItem = async (item: DecorCatalogItem) => {
    setPurchasingItemId(item.id);
    const result = await buyDecorItem(userId, item.id);
    setPurchasingItemId(null);

    if (result.success) {
      setPlayerCoins(result.remainingCoins);
      const updatedOwned = await getOwnedDecorItems(userId);
      setOwnedDecorItems(updatedOwned);
      Alert.alert('Thành Công', result.messageVi);
    } else {
      Alert.alert('Thông Báo', result.messageVi);
    }
  };

  // 4. Start Placing Item from Inventory
  const handleStartPlacement = (itemId: string) => {
    setShowInventoryModal(false);
    setShowShopModal(false);
    setIsDecorationMode(true);
    setSelectedCatalogItemId(itemId);
  };

  // 5. Confirm Placement
  const handleConfirmPlacement = () => {
    if (!selectedCatalogItemId || !engineRef.current || !decorSystemRef.current) return;
    const previewData = engineRef.current.getActivePreviewData();

    if (!previewData.isValid) {
      Alert.alert('Vị Trí Không Hợp Lệ', 'Vui lòng di chuyển vật phẩm đến vùng đất trống bằng phẳng trên đảo!');
      return;
    }

    // Place into decoration system
    const placed = decorSystemRef.current.placeItem(
      selectedCatalogItemId,
      previewData.position,
      previewData.rotationY
    );

    if (placed) {
      setSelectedCatalogItemId(null);
    }
  };

  // 6. Stash (Cất vào kho)
  const handleStashItem = (instanceId: string) => {
    if (!decorSystemRef.current) return;
    decorSystemRef.current.stashItem(instanceId);
    setSelectedPlacedInstance(null);
  };

  // 7. Lumi Gift Acceptance
  const handleAcceptLumiGift = async () => {
    await setLumiGiftClaimed(userId);
    setShowLumiWelcome(false);
  };

  if (isLoading || !islandState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Đang tải Hòn Đảo Của Bạn...</Text>
      </View>
    );
  }

  const activeCatalogDef = DECOR_CATALOG.find((d) => d.id === selectedCatalogItemId);

  return (
    <View style={styles.root}>
      {/* 3D Viewport Canvas */}
      <Island3DCanvas
        isDecorationMode={isDecorationMode}
        selectedCatalogItemId={selectedCatalogItemId}
        placedItems={islandState.placedItems}
        engineRef={engineRef}
        onPlacementChange={(_, isValid) => setIsPlacementValid(isValid)}
      />

      {/* TOP HUD BAR */}
      <SafeAreaView edges={['top']} style={styles.topHudWrapper}>
        <View style={styles.topHudContainer}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.hudIconButton}
            onPress={onBackToHealthClues}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color="#ffffff" />
          </TouchableOpacity>

          {/* Island Title & Level */}
          <View style={styles.titleBadge}>
            <Text style={styles.islandTitleText}>My Island — Hòn Đảo Của Tôi</Text>
            <Text style={styles.islandSubText}>Cấp 1 · Mảnh Đất Khởi Đầu</Text>
          </View>

          {/* Right Controls: Coin Balance & Reset Camera */}
          <View style={styles.topRightControls}>
            <View style={styles.coinBadge}>
              <Coins size={15} color="#fbbf24" />
              <Text style={styles.coinText}>{playerCoins}</Text>
            </View>

            <TouchableOpacity
              style={styles.hudIconButton}
              onPress={handleResetCamera}
              activeOpacity={0.8}
            >
              <Compass size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ACTIVE DECORATION FLOATING ACTION BAR */}
      {isDecorationMode && selectedCatalogItemId && (
        <View style={styles.activePlacementBar}>
          <View style={styles.placementInfo}>
            <Text style={styles.placementItemName}>{activeCatalogDef?.nameVi || 'Vật Phẩm'}</Text>
            <Text style={[styles.placementStatusText, { color: isPlacementValid ? '#34d399' : '#f87171' }]}>
              {isPlacementValid ? '✓ Vị trí hợp lệ' : '✗ Vị trí không hợp lệ'}
            </Text>
          </View>

          <View style={styles.placementActions}>
            <TouchableOpacity
              style={styles.placementButton}
              onPress={() => engineRef.current?.rotatePreviewItem(Math.PI / 4)}
            >
              <RotateCw size={18} color="#ffffff" />
              <Text style={styles.placementButtonText}>Xoay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.placementButton, styles.cancelButton]}
              onPress={() => setSelectedCatalogItemId(null)}
            >
              <X size={18} color="#ffffff" />
              <Text style={styles.placementButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.placementButton, styles.confirmButton, !isPlacementValid && styles.disabledButton]}
              onPress={handleConfirmPlacement}
              disabled={!isPlacementValid}
            >
              <Check size={18} color="#042f2e" />
              <Text style={styles.confirmButtonText}>Đặt Đồ</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* BOTTOM NAVIGATION DOCK (when not in placement mode) */}
      {!selectedCatalogItemId && (
        <SafeAreaView edges={['bottom']} style={styles.bottomDockWrapper}>
          <View style={styles.bottomDockContainer}>
            {/* Shop Button */}
            <TouchableOpacity
              style={styles.dockTabButton}
              onPress={() => setShowShopModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dockIconCircle}>
                <ShoppingBag size={20} color="#fbbf24" />
              </View>
              <Text style={styles.dockTabLabel}>Cửa Hàng</Text>
            </TouchableOpacity>

            {/* Storage / Inventory Button */}
            <TouchableOpacity
              style={styles.dockTabButton}
              onPress={() => setShowInventoryModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dockIconCircle}>
                <Package size={20} color="#38bdf8" />
              </View>
              <Text style={styles.dockTabLabel}>Kho Đồ ({ownedDecorItems.reduce((acc, i) => acc + i.count, 0)})</Text>
            </TouchableOpacity>

            {/* Toggle Decoration Mode Button */}
            <TouchableOpacity
              style={[styles.dockTabButton, isDecorationMode && styles.dockTabActive]}
              onPress={() => setIsDecorationMode(!isDecorationMode)}
              activeOpacity={0.8}
            >
              <View style={[styles.dockIconCircle, isDecorationMode && styles.dockIconActive]}>
                <Wrench size={20} color={isDecorationMode ? '#042f2e' : '#34d399'} />
              </View>
              <Text style={styles.dockTabLabel}>{isDecorationMode ? 'Xong' : 'Trang Trí'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* MODAL 1: SHOP MODAL */}
      <Modal visible={showShopModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: height * 0.8 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <ShoppingBag size={20} color="#fbbf24" />
                <Text style={styles.modalTitle}>Cửa Hàng Vật Phẩm Đảo</Text>
              </View>
              <TouchableOpacity onPress={() => setShowShopModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.shopCoinBanner}>
              <Text style={styles.shopCoinLabel}>Số Dư Xu Hiện Có:</Text>
              <View style={styles.coinBadge}>
                <Coins size={14} color="#fbbf24" />
                <Text style={styles.coinText}>{playerCoins}</Text>
              </View>
            </View>

            <ScrollView style={styles.modalScroll}>
              {DECOR_CATALOG.map((item) => {
                const canAfford = playerCoins >= item.priceCoins;
                const isBuying = purchasingItemId === item.id;

                return (
                  <View key={item.id} style={styles.shopItemCard}>
                    <View style={styles.shopItemIconBox}>
                      <Text style={styles.itemEmoji}>{item.icon}</Text>
                    </View>
                    <View style={styles.shopItemDetails}>
                      <Text style={styles.shopItemName}>{item.nameVi}</Text>
                      <Text style={styles.shopItemDesc}>{item.descriptionVi}</Text>
                      <View style={styles.priceRow}>
                        <Coins size={13} color="#fbbf24" />
                        <Text style={styles.priceText}>{item.priceCoins} Xu</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.buyButton,
                        !canAfford && styles.buyButtonDisabled,
                      ]}
                      onPress={() => handleBuyItem(item)}
                      disabled={!canAfford || isBuying}
                    >
                      {isBuying ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.buyButtonText}>{canAfford ? 'Mua' : 'Thiếu Xu'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: INVENTORY / STORAGE MODAL */}
      <Modal visible={showInventoryModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: height * 0.8 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Package size={20} color="#38bdf8" />
                <Text style={styles.modalTitle}>Kho Đồ Trang Trí Của Bạn</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInventoryModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {ownedDecorItems.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Kho đồ đang trống. Hãy ghé Cửa Hàng để sắm thêm đồ nhé!</Text>
                </View>
              ) : (
                ownedDecorItems.map((inv) => {
                  const itemDef = DECOR_CATALOG.find((d) => d.id === inv.itemId);
                  if (!itemDef) return null;
                  const placedCount = islandState.placedItems.filter((p) => p.itemId === inv.itemId).length;
                  const availableToPlace = inv.count - placedCount;

                  return (
                    <View key={inv.itemId} style={styles.invItemCard}>
                      <View style={styles.shopItemIconBox}>
                        <Text style={styles.itemEmoji}>{itemDef.icon}</Text>
                      </View>
                      <View style={styles.shopItemDetails}>
                        <Text style={styles.shopItemName}>{itemDef.nameVi}</Text>
                        <Text style={styles.invItemStats}>
                          Sở hữu: {inv.count} | Đã đặt: {placedCount} | Còn lại: {Math.max(0, availableToPlace)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.placeButton,
                          availableToPlace <= 0 && styles.placeButtonDisabled,
                        ]}
                        onPress={() => handleStartPlacement(inv.itemId)}
                        disabled={availableToPlace <= 0}
                      >
                        <Text style={styles.placeButtonText}>
                          {availableToPlace > 0 ? 'Đặt Đảo' : 'Đã Đặt Hết'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              {/* Danh sách vật phẩm đang đặt trên đảo */}
              {islandState.placedItems.length > 0 && (
                <View style={styles.placedSection}>
                  <Text style={styles.placedSectionTitle}>Đang Đặt Trên Đảo ({islandState.placedItems.length})</Text>
                  {islandState.placedItems.map((placed) => (
                    <View key={placed.instanceId} style={styles.placedRow}>
                      <Text style={styles.placedName}>{placed.nameVi}</Text>
                      <TouchableOpacity
                        style={styles.stashButton}
                        onPress={() => handleStashItem(placed.instanceId)}
                      >
                        <Trash2 size={13} color="#f87171" />
                        <Text style={styles.stashButtonText}>Cất Vào Kho</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: LUMI WELCOME CELEBRATION */}
      <Modal visible={showLumiWelcome} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.lumiCard}>
            <View style={styles.lumiIconHeader}>
              <Sparkles size={28} color="#fbbf24" />
            </View>

            <Text style={styles.lumiTitle}>QUÀ TẶNG TỪ LUMI</Text>
            <Text style={styles.lumiSubtitle}>Mảnh Đất & Căn Nhà Khởi Đầu Trên Đảo Nổi</Text>

            <View style={styles.lumiLoreBox}>
              <Text style={styles.lumiSpeech}>
                "Bạn đã đi được một chặng đường thú vị rồi đấy!{'\n\n'}
                Mình có một món quà nhỏ dành cho bạn.{'\n\n'}
                Từ hôm nay, Xứ Sở Sức Khỏe cũng sẽ có một góc dành riêng cho bạn.{'\n\n'}
                Đây là hòn đảo nhỏ của bạn. Hãy biến nó thành nơi thật đặc biệt bằng những phần thưởng mà bạn nhận được trên hành trình nhé!"
              </Text>
            </View>

            <View style={styles.giftList}>
              <View style={styles.giftRow}>
                <Home size={16} color="#34d399" />
                <Text style={styles.giftText}>1x Căn Nhà Gỗ Khởi Đầu</Text>
              </View>
              <View style={styles.giftRow}>
                <Sparkles size={16} color="#38bdf8" />
                <Text style={styles.giftText}>1x Đảo Nổi Biển Mây Cozy Fantasy</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.lumiAcceptButton} onPress={handleAcceptLumiGift}>
              <Text style={styles.lumiAcceptButtonText}>Bắt Đầu Khám Phá Hòn Đảo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#022c22',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#022c22',
  },
  loadingText: {
    color: '#34d399',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  topHudWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topHudContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hudIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(6, 28, 22, 0.85)',
    borderWidth: 1,
    borderColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(6, 28, 22, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#059669',
  },
  islandTitleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  islandSubText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '500',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 28, 22, 0.85)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  coinText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomDockWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  bottomDockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 28, 22, 0.95)',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  dockTabButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dockTabActive: {
    transform: [{ scale: 1.05 }],
  },
  dockIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dockIconActive: {
    backgroundColor: '#34d399',
  },
  dockTabLabel: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  activePlacementBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(6, 28, 22, 0.95)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 12,
    zIndex: 25,
  },
  placementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  placementItemName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  placementStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  placementActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  placementButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  confirmButton: {
    backgroundColor: '#34d399',
  },
  disabledButton: {
    opacity: 0.45,
  },
  placementButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmButtonText: {
    color: '#042f2e',
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#06201a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: '#059669',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3d32',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  shopCoinBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3d32',
  },
  shopCoinLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  modalScroll: {
    marginTop: 8,
  },
  shopItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 61, 50, 0.5)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0f3d32',
  },
  shopItemIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#042f2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemEmoji: {
    fontSize: 22,
  },
  shopItemDetails: {
    flex: 1,
  },
  shopItemName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  shopItemDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  priceText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
  },
  buyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#334155',
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  invItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 61, 50, 0.5)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0f3d32',
  },
  invItemStats: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  placeButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  placeButtonDisabled: {
    backgroundColor: '#334155',
  },
  placeButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  placedSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3d32',
  },
  placedSectionTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  placedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#042f2e',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  placedName: {
    color: '#ffffff',
    fontSize: 12,
  },
  stashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  stashButtonText: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '700',
  },
  lumiCard: {
    backgroundColor: '#06201a',
    margin: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    padding: 20,
    alignItems: 'center',
  },
  lumiIconHeader: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lumiTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lumiSubtitle: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  lumiLoreBox: {
    backgroundColor: 'rgba(4, 47, 46, 0.6)',
    padding: 14,
    borderRadius: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#0f3d32',
  },
  lumiSpeech: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  giftList: {
    width: '100%',
    backgroundColor: 'rgba(15, 61, 50, 0.5)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 6,
  },
  giftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  giftText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  lumiAcceptButton: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  lumiAcceptButtonText: {
    color: '#042f2e',
    fontSize: 13,
    fontWeight: '900',
  },
});
