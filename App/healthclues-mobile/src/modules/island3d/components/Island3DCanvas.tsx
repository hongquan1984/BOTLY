import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { FloatingIslandEngine } from '../engine/FloatingIslandEngine';
import { PlacedItemInstance } from '../types/island';

interface Island3DCanvasProps {
  isDecorationMode: boolean;
  selectedCatalogItemId: string | null;
  placedItems: PlacedItemInstance[];
  onSelectPlacedItem?: (instance: PlacedItemInstance | null) => void;
  onPlacementChange?: (pos: { x: number; z: number }, isValid: boolean) => void;
  engineRef?: React.MutableRefObject<FloatingIslandEngine | null>;
}

export const Island3DCanvas: React.FC<Island3DCanvasProps> = ({
  isDecorationMode,
  selectedCatalogItemId,
  placedItems,
  onSelectPlacedItem,
  onPlacementChange,
  engineRef: externalEngineRef,
}) => {
  const { width, height } = useWindowDimensions();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const internalEngineRef = useRef<FloatingIslandEngine | null>(null);

  // Gesture tracking state
  const touchState = useRef({
    isInteracting: false,
    lastX: 0,
    lastY: 0,
    initialPinchDist: 0,
  });

  // 1. Initialize Engine on Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new FloatingIslandEngine({
      canvas: canvasRef.current,
      width,
      height,
      onSelectPlacedItem,
      onPlacementChange,
    });

    internalEngineRef.current = engine;
    if (externalEngineRef) {
      externalEngineRef.current = engine;
    }

    // Initial sync of placed items
    engine.syncPlacedItems(placedItems);

    return () => {
      engine.dispose();
      internalEngineRef.current = null;
      if (externalEngineRef) {
        externalEngineRef.current = null;
      }
    };
  }, []);

  // 2. Handle Resizing
  useEffect(() => {
    if (internalEngineRef.current) {
      internalEngineRef.current.resize(width, height);
    }
  }, [width, height]);

  // 3. Sync Placed Items
  useEffect(() => {
    if (internalEngineRef.current) {
      internalEngineRef.current.syncPlacedItems(placedItems);
    }
  }, [placedItems]);

  // 4. Update Decoration Mode & Ghost Item
  useEffect(() => {
    if (internalEngineRef.current) {
      internalEngineRef.current.isDecorationMode = isDecorationMode;
      internalEngineRef.current.setDecorationPreviewItem(selectedCatalogItemId);
    }
  }, [isDecorationMode, selectedCatalogItemId]);

  // 5. Touch & Gesture Handlers
  const handleTouchStart = useCallback(
    (e: any) => {
      const touches = e.touches || (e.nativeEvent && e.nativeEvent.touches);
      if (!touches) return;

      if (touches.length === 1) {
        touchState.current.isInteracting = true;
        touchState.current.lastX = touches[0].clientX;
        touchState.current.lastY = touches[0].clientY;

        // If in decoration mode, immediately update preview position
        if (isDecorationMode && selectedCatalogItemId && internalEngineRef.current && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const normX = ((touches[0].clientX - rect.left) / rect.width) * 2 - 1;
          const normY = -(((touches[0].clientY - rect.top) / rect.height) * 2 - 1);
          internalEngineRef.current.updatePreviewPositionFromNormalizedTouch(normX, normY);
        }
      } else if (touches.length === 2) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        touchState.current.initialPinchDist = Math.hypot(dx, dy);
      }
    },
    [isDecorationMode, selectedCatalogItemId]
  );

  const handleTouchMove = useCallback(
    (e: any) => {
      const touches = e.touches || (e.nativeEvent && e.nativeEvent.touches);
      if (!touches || !internalEngineRef.current) return;

      if (touches.length === 1 && touchState.current.isInteracting) {
        const currentX = touches[0].clientX;
        const currentY = touches[0].clientY;
        const deltaX = currentX - touchState.current.lastX;
        const deltaY = currentY - touchState.current.lastY;

        touchState.current.lastX = currentX;
        touchState.current.lastY = currentY;

        if (isDecorationMode && selectedCatalogItemId && canvasRef.current) {
          // Drag item on island
          const rect = canvasRef.current.getBoundingClientRect();
          const normX = ((currentX - rect.left) / rect.width) * 2 - 1;
          const normY = -(((currentY - rect.top) / rect.height) * 2 - 1);
          internalEngineRef.current.updatePreviewPositionFromNormalizedTouch(normX, normY);
        } else {
          // Orbit camera
          internalEngineRef.current.orbitCamera(deltaX, deltaY);
        }
      } else if (touches.length === 2) {
        // Pinch zoom
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (touchState.current.initialPinchDist > 0) {
          const scaleDelta = touchState.current.initialPinchDist / dist;
          internalEngineRef.current.zoomCamera(scaleDelta);
          touchState.current.initialPinchDist = dist;
        }
      }
    },
    [isDecorationMode, selectedCatalogItemId]
  );

  const handleTouchEnd = useCallback(() => {
    touchState.current.isInteracting = false;
    touchState.current.initialPinchDist = 0;
  }, []);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <canvas
          ref={canvasRef as any}
          style={
            {
              width: '100%',
              height: '100%',
              display: 'block',
              touchAction: 'none',
              outline: 'none',
            } as any
          }
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e: any) => {
            touchState.current.isInteracting = true;
            touchState.current.lastX = e.clientX;
            touchState.current.lastY = e.clientY;
          }}
          onMouseMove={(e: any) => {
            if (!touchState.current.isInteracting || !internalEngineRef.current) return;
            const deltaX = e.clientX - touchState.current.lastX;
            const deltaY = e.clientY - touchState.current.lastY;
            touchState.current.lastX = e.clientX;
            touchState.current.lastY = e.clientY;

            if (isDecorationMode && selectedCatalogItemId && canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
              internalEngineRef.current.updatePreviewPositionFromNormalizedTouch(normX, normY);
            } else {
              internalEngineRef.current.orbitCamera(deltaX, deltaY);
            }
          }}
          onMouseUp={() => {
            touchState.current.isInteracting = false;
          }}
          onWheel={(e: any) => {
            if (!internalEngineRef.current) return;
            const delta = e.deltaY > 0 ? 1.05 : 0.95;
            internalEngineRef.current.zoomCamera(delta);
          }}
        />
      ) : (
        <View style={styles.nativeFallback}>
          {/* Native Expo GL View or fallback canvas */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22', // Deep nature green backdrop
  },
  nativeFallback: {
    flex: 1,
  },
});
