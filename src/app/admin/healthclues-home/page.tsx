"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Home,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Move,
  Maximize2,
  Layers,
  ArrowLeft,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Paintbrush,
  Footprints,
  Eraser,
  RefreshCw,
  X,
} from "lucide-react";
import { getSquareToQuadTransform } from "@/components/healthclues/wellnessHomeHomography";
import {
  MASK_CANVAS_WIDTH,
  MASK_CANVAS_HEIGHT,
  drawDefaultFloorPreset,
  isPointWalkable,
  pickRandomWalkableTarget,
} from "@/components/healthclues/wellnessHomeWalkable";
import type { WellnessHomeItem } from "@/app/api/healthclues/wellness-home/route";
import "@/components/healthclues/wellness-home.css";

const ROOM_OPTIONS = [
  { id: "scene_interior_wide", name: "Phòng Khách Chalet (Chính)", bg: "/healthclues/assets/home/scenes/scene_interior_wide.webp" },
  { id: "scene_bedroom", name: "Phòng Ngủ Tuyết Trắng", bg: "/healthclues/assets/home/scenes/scene_bedroom.webp" },
];

export default function AdminHealthCluesHomePage() {
  const [activeRoom, setActiveRoom] = useState<string>("scene_interior_wide");
  const [catalog, setCatalog] = useState<WellnessHomeItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dirtyItemIds, setDirtyItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [dayNightPreview, setDayNightPreview] = useState<"day" | "night">("day");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Walkable Mask Painter state
  const [isPainterMode, setIsPainterMode] = useState<boolean>(false);
  const [painterTool, setPainterTool] = useState<"brush" | "eraser">("brush");
  const [brushSize, setBrushSize] = useState<number>(45);
  const [walkableMasks, setWalkableMasks] = useState<Record<string, string>>({});
  const [isTestingMovement, setIsTestingMovement] = useState<boolean>(false);
  const [testChibiPos, setTestChibiPos] = useState<{ x: number; y: number }>({ x: 26, y: 78 });
  const [testChibiTarget, setTestChibiTarget] = useState<{ x: number; y: number }>({ x: 74, y: 78 });
  const [testChibiFacingLeft, setTestChibiFacingLeft] = useState<boolean>(false);
  const [testChibiWalking, setTestChibiWalking] = useState<boolean>(false);
  const isPaintingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const painterCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 26, y: 78 });
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 74, y: 78 });
  const isWalkingRef = useRef<boolean>(false);
  const restUntilRef = useRef<number>(0);

  // Canvas Stage state
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 1280, height: 720 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addNewFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOverStage, setIsDraggingOverStage] = useState<boolean>(false);
  const [isDraggingOverUploadCard, setIsDraggingOverUploadCard] = useState<boolean>(false);

  // Dragging state for center translation and 4-corner perspective adjustment
  const [dragState, setDragState] = useState<{
    type: "center" | "corner";
    cornerKey?: "tl" | "tr" | "br" | "bl";
    startX: number;
    startY: number;
    initialCorners: {
      tl: [number, number];
      tr: [number, number];
      br: [number, number];
      bl: [number, number];
    };
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch initial catalog
  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/healthclues/wellness-home?includeCatalog=true");
      if (!res.ok) throw new Error("Không thể tải danh mục vật phẩm");
      const data = await res.json();
      if (Array.isArray(data.catalog)) {
        setCatalog(data.catalog);
        const livingItems = data.catalog.filter((i: WellnessHomeItem) => i.room === "scene_interior_wide");
        if (livingItems.length > 0) {
          setSelectedItemId(livingItems[0].id);
        }
      }
      if (data.walkableMasks && typeof data.walkableMasks === "object") {
        setWalkableMasks(data.walkableMasks);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi tải danh mục", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  // Load and render walkable mask for current active room
  const loadRoomMaskToCanvas = useCallback(
    (roomId: string, overrideDataUrl?: string) => {
      const canvas = painterCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = MASK_CANVAS_WIDTH;
      canvas.height = MASK_CANVAS_HEIGHT;

      const dataUrl =
        overrideDataUrl ||
        walkableMasks[roomId] ||
        (typeof window !== "undefined"
          ? localStorage.getItem("healthclues_walkable_mask_" + roomId)
          : null);

      if (dataUrl && dataUrl.startsWith("data:image")) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);
          ctx.drawImage(img, 0, 0, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);
        };
        img.onerror = () => {
          drawDefaultFloorPreset(ctx, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT, roomId);
        };
        img.src = dataUrl;
      } else {
        drawDefaultFloorPreset(ctx, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT, roomId);
      }
    },
    [walkableMasks]
  );

  // Sync canvas whenever activeRoom or painterMode changes
  useEffect(() => {
    loadRoomMaskToCanvas(activeRoom);
  }, [activeRoom, isPainterMode, loadRoomMaskToCanvas]);

  // Painter coordinate resolver
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = painterCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = MASK_CANVAS_WIDTH / rect.width;
    const scaleY = MASK_CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawStroke = (x1: number, y1: number, x2: number, y2: number) => {
    const canvas = painterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (painterTool === "brush") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.50)";
      ctx.fillStyle = "rgba(16, 185, 129, 0.50)";
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0, 0, 0, 1.0)";
      ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x2, y2, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If in live movement test mode: click anywhere on the floor to direct Anna to walk there!
    if (isTestingMovement) {
      e.preventDefault();
      const canvas = painterCanvasRef.current;
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      const rect = canvas?.getBoundingClientRect();
      if (!rect || !ctx) return;
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      if (isPointWalkable(ctx, clickX, clickY, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT)) {
        targetPosRef.current = { x: Number(clickX.toFixed(2)), y: Number(clickY.toFixed(2)) };
        isWalkingRef.current = true;
        setTestChibiWalking(true);
        setTestChibiFacingLeft(clickX < currentPosRef.current.x);
        showToast("Anna đang đi tới điểm bạn bấm!", "info");
      } else {
        showToast("⛔ Điểm này nằm ngoài vùng sàn được bôi xanh (hoặc vướng đồ vật)!", "error");
      }
      return;
    }

    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;
    isPaintingRef.current = true;
    lastPointRef.current = coords;
    drawStroke(coords.x, coords.y, coords.x, coords.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isTestingMovement || !isPaintingRef.current) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords || !lastPointRef.current) return;
    drawStroke(lastPointRef.current.x, lastPointRef.current.y, coords.x, coords.y);
    lastPointRef.current = coords;
  };

  const handlePointerUp = () => {
    isPaintingRef.current = false;
    lastPointRef.current = null;
  };

  const handleSaveWalkableMask = async () => {
    const canvas = painterCanvasRef.current;
    if (!canvas) return;
    try {
      setSaving(true);
      const maskDataUrl = canvas.toDataURL("image/png");

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("healthclues_walkable_mask_" + activeRoom, maskDataUrl);
        } catch {}
      }

      setWalkableMasks((prev) => ({ ...prev, [activeRoom]: maskDataUrl }));

      const res = await fetch("/api/healthclues/wellness-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin_save_walkable_mask",
          roomId: activeRoom,
          maskDataUrl,
        }),
      });

      if (!res.ok) throw new Error("Lỗi khi lưu trên máy chủ");
      showToast(`Đã lưu bản đồ đi lại cho ${activeRoom === "scene_bedroom" ? "Phòng Ngủ" : "Phòng Khách"}!`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi lưu mặt sàn", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = () => {
    const canvas = painterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    drawDefaultFloorPreset(ctx, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT, activeRoom);
    showToast("Đã áp dụng mẫu sàn chuẩn! Dùng cọ tẩy để tẩy quanh chân đồ đạc.", "info");
  };

  const handleClearMask = () => {
    const canvas = painterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);
    showToast("Đã xóa toàn bộ mặt sàn! Dùng cọ vẽ để bôi vùng cho phép đi.", "info");
  };

  // Test Chibi Movement Loop across painted floor (Smooth continuous waypoint navigation)
  useEffect(() => {
    if (!isTestingMovement) {
      isWalkingRef.current = false;
      setTestChibiWalking(false);
      return;
    }

    let animId: number;
    let isMounted = true;

    const canvas = painterCanvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true }) || null;

    // Helper: Pick a new valid target that is far enough from current position
    const pickNewDestination = () => {
      if (!isMounted) return;
      const cur = currentPosRef.current;
      let bestTarget = pickRandomWalkableTarget(ctx, activeRoom, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);

      // Try multiple attempts to get a point with at least 15% distance so character actually walks across the floor
      for (let i = 0; i < 20; i++) {
        const dist = Math.hypot(bestTarget.x - cur.x, bestTarget.y - cur.y);
        if (dist >= 15) break;
        bestTarget = pickRandomWalkableTarget(ctx, activeRoom, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);
      }

      targetPosRef.current = bestTarget;
      isWalkingRef.current = true;
      setTestChibiWalking(true);
      setTestChibiFacingLeft(bestTarget.x < cur.x);
    };

    // If starting position is outside painted area, reposition to a valid point
    if (ctx && !isPointWalkable(ctx, currentPosRef.current.x, currentPosRef.current.y, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT)) {
      const startPt = pickRandomWalkableTarget(ctx, activeRoom, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT);
      currentPosRef.current = startPt;
      setTestChibiPos(startPt);
    }

    pickNewDestination();

    let lastTime = performance.now();

    const loop = (time: number) => {
      if (!isMounted) return;

      const deltaMs = Math.min(time - lastTime, 40); // Cap delta to prevent teleports
      lastTime = time;

      const now = performance.now();
      const cur = currentPosRef.current;
      const target = targetPosRef.current;

      if (isWalkingRef.current) {
        const dx = target.x - cur.x;
        const dy = target.y - cur.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 0.8) {
          // Arrived at destination!
          isWalkingRef.current = false;
          setTestChibiWalking(false);
          restUntilRef.current = now + 1600 + Math.random() * 1200; // Rest for 1.6s - 2.8s
        } else {
          // Smooth walking speed: ~9.5% screen width per second
          const speedPctPerSec = 9.5;
          const stepDist = Math.min(dist, (speedPctPerSec * deltaMs) / 1000);
          const nextX = cur.x + (dx / dist) * stepDist;
          const nextY = cur.y + (dy / dist) * stepDist;

          // Check if next step is still in the painted green walkable zone
          if (ctx && !isPointWalkable(ctx, nextX, nextY, MASK_CANVAS_WIDTH, MASK_CANVAS_HEIGHT)) {
            // Hit obstacle boundary! Stop gracefully and rest before turning
            isWalkingRef.current = false;
            setTestChibiWalking(false);
            restUntilRef.current = now + 1000;
          } else {
            currentPosRef.current = { x: nextX, y: nextY };
            setTestChibiPos({ x: Number(nextX.toFixed(2)), y: Number(nextY.toFixed(2)) });
          }
        }
      } else {
        // Resting/idling: check if rest time is finished to pick next target
        if (now >= restUntilRef.current) {
          pickNewDestination();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      isWalkingRef.current = false;
      setTestChibiWalking(false);
    };
  }, [isTestingMovement, activeRoom]);

  // Stage resize observer
  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setStageDimensions({ width, height });
        }
      }
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const currentRoomBg = ROOM_OPTIONS.find((r) => r.id === activeRoom)?.bg || ROOM_OPTIONS[0].bg;
  const currentItem = catalog.find((i) => i.id === selectedItemId) || null;
  const roomItems = catalog.filter((i) => i.room === activeRoom);

  // Update item in state in REAL TIME (never reverts when clicking another item)
  const updateCurrentItem = useCallback(
    (updater: (prev: WellnessHomeItem) => WellnessHomeItem) => {
      if (!selectedItemId) return;
      setCatalog((prevCatalog) =>
        prevCatalog.map((item) => {
          if (item.id === selectedItemId) {
            return updater(item);
          }
          return item;
        })
      );
      setDirtyItemIds((prev) => new Set(prev).add(selectedItemId));
    },
    [selectedItemId]
  );

  // Switch active item
  const handleSelectItem = (item: WellnessHomeItem) => {
    setSelectedItemId(item.id);
    if (item.room !== activeRoom) {
      setActiveRoom(item.room);
    }
  };

  // Add Brand-New Furniture Item from Upload (Always ADDITIVE, NEVER overwriting focused item!)
  const addNewFurnitureFromFile = async (file: File, dropCoords?: { xPct: number; yPct: number }) => {
    if (!file) return;

    const isImage = (file.type && file.type.startsWith("image/")) || /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(file.name);
    if (!isImage) {
      showToast("Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP, SVG)!", "error");
      return;
    }

    try {
      setUploading(true);

      // 1. Read as Data URL directly in browser for instant zero-latency preview
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Không thể đọc tệp hình ảnh"));
        reader.readAsDataURL(file);
      });

      // 2. Measure natural dimensions
      const tempImg = new Image();
      await new Promise<void>((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = () => reject(new Error("Không thể tải ảnh để đo kích thước"));
        tempImg.src = dataUrl;
      });

      const naturalW = tempImg.naturalWidth || 300;
      const naturalH = tempImg.naturalHeight || 300;

      // 3. Always create a BRAND NEW item with unique ID — NEVER overwrite existing focused item!
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
      const newId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const cx = dropCoords ? dropCoords.xPct : 50;
      const cy = dropCoords ? dropCoords.yPct : 70;

      const wPct = Math.min(30, Math.max(14, (naturalW / stageDimensions.width) * 100));
      const hPct = Math.min(35, Math.max(14, (naturalH / stageDimensions.height) * 100));

      const newItem: WellnessHomeItem = {
        id: newId,
        room: activeRoom as "scene_interior_wide" | "scene_bedroom",
        name_vi: cleanName || "Vật Phẩm Mới",
        name_en: cleanName || "New Furniture",
        tag_vi: activeRoom === "scene_bedroom" ? "Phòng Ngủ" : "Phòng Khách",
        tag_en: activeRoom === "scene_bedroom" ? "Bedroom" : "Living Room",
        desc_vi: `Vật phẩm ${cleanName} tải lên từ máy tính.`,
        desc_en: `Custom uploaded furniture ${cleanName}.`,
        img_src: dataUrl,
        is_starter: false,
        natural_width: naturalW,
        natural_height: naturalH,
        user_scale: 1.0,
        z_index: Math.round(cy * 10),
        corners: {
          tl: [Number((cx - wPct / 2).toFixed(2)), Number((cy - hPct / 2).toFixed(2))],
          tr: [Number((cx + wPct / 2).toFixed(2)), Number((cy - hPct / 2).toFixed(2))],
          br: [Number((cx + wPct / 2).toFixed(2)), Number((cy + hPct / 2).toFixed(2))],
          bl: [Number((cx - wPct / 2).toFixed(2)), Number((cy + hPct / 2).toFixed(2))],
        },
      };

      // Add to catalog and select the newly created item
      setCatalog((prev) => [newItem, ...prev]);
      setSelectedItemId(newItem.id);
      setDirtyItemIds((prev) => new Set(prev).add(newItem.id));

      showToast(`🎉 Đã thêm món mới "${newItem.name_vi}" (${naturalW}x${naturalH}px) vào phòng!`, "success");

      // 4. Asynchronously upload to server for persistent storage
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("suggestedId", newId);

        const res = await fetch("/api/healthclues/wellness-home/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            setCatalog((prev) =>
              prev.map((it) => (it.id === newId ? { ...it, img_src: result.url } : it))
            );
          }
        }
      } catch {
        // Data URL is already applied and will persist
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi tải ảnh lên", "error");
    } finally {
      setUploading(false);
      if (addNewFileInputRef.current) addNewFileInputRef.current.value = "";
    }
  };

  // Explicitly Replace Image of Currently Selected Item (Only when clicking Replace Image button)
  const replaceItemImageFromFile = async (file: File) => {
    if (!file || !selectedItemId) {
      showToast("Vui lòng chọn một vật phẩm để thay ảnh!", "error");
      return;
    }

    const isImage = (file.type && file.type.startsWith("image/")) || /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(file.name);
    if (!isImage) {
      showToast("Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP, SVG)!", "error");
      return;
    }

    try {
      setUploading(true);

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Không thể đọc tệp hình ảnh"));
        reader.readAsDataURL(file);
      });

      const tempImg = new Image();
      await new Promise<void>((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = () => reject(new Error("Không thể tải ảnh để đo kích thước"));
        tempImg.src = dataUrl;
      });

      const naturalW = tempImg.naturalWidth || 300;
      const naturalH = tempImg.naturalHeight || 300;

      updateCurrentItem((prev) => ({
        ...prev,
        img_src: dataUrl,
        natural_width: naturalW,
        natural_height: naturalH,
      }));

      showToast(`🖼️ Đã thay ảnh mới cho món đang chọn (${naturalW}x${naturalH}px)!`, "success");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("suggestedId", selectedItemId);

        const res = await fetch("/api/healthclues/wellness-home/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            updateCurrentItem((prev) => ({
              ...prev,
              img_src: result.url,
            }));
          }
        }
      } catch {
        // Data URL is already applied
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi đổi ảnh vật phẩm", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void replaceItemImageFromFile(file);
  };

  // Save single item
  const handleSaveCurrentItem = async () => {
    if (!currentItem) return;
    try {
      setSaving(true);
      const res = await fetch("/api/healthclues/wellness-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin_save_item",
          item: currentItem,
        }),
      });
      if (!res.ok) throw new Error("Lỗi khi lưu vật phẩm");
      const data = await res.json();
      if (data.catalog) setCatalog(data.catalog);

      setDirtyItemIds((prev) => {
        const next = new Set(prev);
        next.delete(currentItem.id);
        return next;
      });

      showToast(`Đã lưu "${currentItem.name_vi}" thành công!`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi lưu vật phẩm", "error");
    } finally {
      setSaving(false);
    }
  };
  const handleSaveItem = handleSaveCurrentItem;

  // Batch save all dirty items
  const handleSaveAllDirtyItems = async () => {
    if (dirtyItemIds.size === 0) {
      showToast("Không có thay đổi nào cần lưu", "info");
      return;
    }

    try {
      setSaving(true);
      const itemsToSave = catalog.filter((i) => dirtyItemIds.has(i.id));
      const res = await fetch("/api/healthclues/wellness-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin_batch_save",
          items: itemsToSave,
        }),
      });

      if (!res.ok) throw new Error("Lỗi lưu danh sách vật phẩm");
      const data = await res.json();
      if (data.catalog) setCatalog(data.catalog);

      setDirtyItemIds(new Set());
      showToast(`Đã lưu toàn bộ ${itemsToSave.length} vật phẩm thành công!`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi lưu danh mục", "error");
    } finally {
      setSaving(false);
    }
  };

  // Add new item template
  const handleAddNewItem = () => {
    const newId = `custom_item_${Date.now().toString().slice(-4)}`;
    const newItem: WellnessHomeItem = {
      id: newId,
      room: activeRoom as "scene_interior_wide" | "scene_bedroom",
      name_vi: "Vật Phẩm Mới",
      name_en: "New Furniture",
      tag_vi: activeRoom === "scene_bedroom" ? "Phòng Ngủ" : "Phòng Khách",
      tag_en: activeRoom === "scene_bedroom" ? "Bedroom" : "Living Room",
      desc_vi: "Mô tả vật phẩm trang trí mới tại căn nhà nghỉ dưỡng.",
      desc_en: "Description of new decorative furniture piece.",
      img_src: "/healthclues/assets/home/items/table_coffee.png",
      is_starter: false,
      natural_width: 300,
      natural_height: 200,
      user_scale: 1.0,
      z_index: 500,
      corners: {
        tl: [35, 60],
        tr: [65, 60],
        br: [65, 85],
        bl: [35, 85],
      },
    };

    setCatalog((prev) => [newItem, ...prev]);
    setSelectedItemId(newItem.id);
    setDirtyItemIds((prev) => new Set(prev).add(newItem.id));
    showToast(`Đã thêm vật phẩm mới (${newId}). Hãy tải ảnh và kéo góc!`, "info");
  };

  // Delete item with optimistic state update & server sync
  const handleDeleteItem = async (itemId: string) => {
    try {
      setSaving(true);

      // 1. Optimistic removal from client state immediately
      setCatalog((prev) => prev.filter((i) => i.id !== itemId));
      setDirtyItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });

      if (selectedItemId === itemId) {
        const remaining = catalog.filter((i) => i.id !== itemId && i.room === activeRoom);
        setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
      }

      // 2. Call backend API to delete from DB and memory store
      const res = await fetch("/api/healthclues/wellness-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin_delete_item",
          itemId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Không thể xóa vật phẩm trên máy chủ");
      }

      const data = await res.json();
      if (Array.isArray(data.catalog)) {
        setCatalog(data.catalog);
      }

      setConfirmDeleteId(null);
      showToast(`Đã xóa vật phẩm ${itemId} thành công!`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi xóa", "error");
      void fetchCatalog();
    } finally {
      setSaving(false);
    }
  };

  // Handle scaling item proportionally around its center point
  const handleScaleChange = (nextScale: number) => {
    if (!currentItem) return;
    const clampedScale = Math.max(0.2, Math.min(3.0, Number(nextScale.toFixed(2))));
    const currentScale = Math.max(0.1, currentItem.user_scale || 1.0);
    if (Math.abs(clampedScale - currentScale) < 0.001) return;

    const ratio = clampedScale / currentScale;

    // Center anchor in percentage coordinates
    const cx = (currentItem.corners.tl[0] + currentItem.corners.tr[0] + currentItem.corners.br[0] + currentItem.corners.bl[0]) / 4;
    const cy = (currentItem.corners.tl[1] + currentItem.corners.tr[1] + currentItem.corners.br[1] + currentItem.corners.bl[1]) / 4;

    const round2 = (num: number) => Number(Math.max(0, Math.min(100, num)).toFixed(2));

    const newCorners = {
      tl: [round2(cx + (currentItem.corners.tl[0] - cx) * ratio), round2(cy + (currentItem.corners.tl[1] - cy) * ratio)] as [number, number],
      tr: [round2(cx + (currentItem.corners.tr[0] - cx) * ratio), round2(cy + (currentItem.corners.tr[1] - cy) * ratio)] as [number, number],
      br: [round2(cx + (currentItem.corners.br[0] - cx) * ratio), round2(cy + (currentItem.corners.br[1] - cy) * ratio)] as [number, number],
      bl: [round2(cx + (currentItem.corners.bl[0] - cx) * ratio), round2(cy + (currentItem.corners.bl[1] - cy) * ratio)] as [number, number],
    };

    updateCurrentItem((prev) => ({
      ...prev,
      user_scale: clampedScale,
      corners: newCorners,
    }));
  };

  // Mouse handlers for dragging corners and translation
  const handleMouseDownCenter = (e: React.MouseEvent) => {
    if (!currentItem) return;
    e.stopPropagation();
    setDragState({
      type: "center",
      startX: e.clientX,
      startY: e.clientY,
      initialCorners: JSON.parse(JSON.stringify(currentItem.corners)),
    });
  };

  const handleMouseDownCorner = (e: React.MouseEvent, cornerKey: "tl" | "tr" | "br" | "bl") => {
    if (!currentItem) return;
    e.stopPropagation();
    setDragState({
      type: "corner",
      cornerKey,
      startX: e.clientX,
      startY: e.clientY,
      initialCorners: JSON.parse(JSON.stringify(currentItem.corners)),
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !currentItem) return;
      const dxPx = e.clientX - dragState.startX;
      const dyPx = e.clientY - dragState.startY;

      const dxPct = (dxPx / stageDimensions.width) * 100;
      const dyPct = (dyPx / stageDimensions.height) * 100;

      if (dragState.type === "center") {
        const init = dragState.initialCorners;
        const newCorners = {
          tl: [Number((init.tl[0] + dxPct).toFixed(2)), Number((init.tl[1] + dyPct).toFixed(2))] as [number, number],
          tr: [Number((init.tr[0] + dxPct).toFixed(2)), Number((init.tr[1] + dyPct).toFixed(2))] as [number, number],
          br: [Number((init.br[0] + dxPct).toFixed(2)), Number((init.br[1] + dyPct).toFixed(2))] as [number, number],
          bl: [Number((init.bl[0] + dxPct).toFixed(2)), Number((init.bl[1] + dyPct).toFixed(2))] as [number, number],
        };
        updateCurrentItem((prev) => ({ ...prev, corners: newCorners }));
      } else if (dragState.type === "corner" && dragState.cornerKey) {
        const key = dragState.cornerKey;
        const initPt = dragState.initialCorners[key];
        const newCorners = {
          ...currentItem.corners,
          [key]: [Number((initPt[0] + dxPct).toFixed(2)), Number((initPt[1] + dyPct).toFixed(2))] as [number, number],
        };
        updateCurrentItem((prev) => ({ ...prev, corners: newCorners }));
      }
    },
    [dragState, currentItem, stageDimensions, updateCurrentItem]
  );

  const handleMouseUp = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  return (
    <div
      className="flex h-screen w-screen flex-col bg-[#0b1412] text-slate-100 select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Studio Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-emerald-900/30 bg-[#0f1f1a] px-5">
        <div className="flex items-center gap-3">
          <Link
            href="/play"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition"
          >
            <ArrowLeft size={14} />
            <span>Vào Game (/play)</span>
          </Link>
          <div className="h-4 w-px bg-emerald-800/40" />
          <h1 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-400">
            <Sliders size={16} />
            <span>HealthClues Studio · Admin CMS · Setup & Tọa Độ Vị Trí Nội Thất Chalet</span>
          </h1>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/20">
            Admin Homography 3D
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Day / Night Preview Toggle */}
          <div className="flex items-center rounded-lg bg-black/40 p-1 border border-emerald-900/40">
            <button
              type="button"
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition ${
                dayNightPreview === "day" ? "bg-amber-500 text-stone-900" : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setDayNightPreview("day")}
            >
              <Sun size={12} />
              <span>Ban Ngày</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition ${
                dayNightPreview === "night" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setDayNightPreview("night")}
            >
              <Moon size={12} />
              <span>Ban Đêm</span>
            </button>
          </div>

          {/* Walkable Mask Painter Toggle Button */}
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-md active:scale-95 ${
              isPainterMode
                ? "border-emerald-400 bg-emerald-500 text-stone-950 font-black shadow-emerald-500/25 ring-2 ring-emerald-400/50"
                : "border-emerald-600/60 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 hover:text-white"
            }`}
            onClick={() => setIsPainterMode((prev) => !prev)}
            data-testid="admin-toggle-painter-btn"
          >
            <Paintbrush size={14} />
            <span>{isPainterMode ? "Đang Bôi Mặt Sàn" : "🖌️ Bôi Vùng Đi Lại"}</span>
          </button>

          {/* Add Item Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 transition"
            onClick={handleAddNewItem}
            data-testid="admin-add-item-btn"
          >
            <Plus size={14} />
            <span>Thêm Món Mới</span>
          </button>

          {/* Save All Batch Button */}
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-black shadow-lg transition ${
              dirtyItemIds.size > 0
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 animate-pulse"
                : "border border-emerald-800/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
            }`}
            onClick={handleSaveAllDirtyItems}
            disabled={saving}
            data-testid="admin-batch-save-btn"
          >
            <Save size={14} />
            <span>
              {saving
                ? "Đang lưu..."
                : dirtyItemIds.size > 0
                ? `Lưu Tất Cả (${dirtyItemIds.size} món)`
                : "Đã Lưu Toàn Bộ"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Sidebar + Stage Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Item List & Coordinates Editor */}
        <aside className="flex w-96 flex-col border-r border-emerald-900/30 bg-[#0c1815] overflow-y-auto">
          {/* Room Selector Pills */}
          <div className="border-b border-emerald-900/20 p-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chọn Phòng Trang Trí</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {ROOM_OPTIONS.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-bold transition border ${
                    activeRoom === room.id
                      ? "border-emerald-500 bg-emerald-950/70 text-emerald-300 shadow-sm"
                      : "border-slate-800 bg-black/20 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                  onClick={() => setActiveRoom(room.id)}
                >
                  {room.name}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Upload Card in Sidebar */}
          <div className="p-3 border-b border-emerald-900/20">
            <input
              type="file"
              ref={addNewFileInputRef}
              data-testid="admin-add-new-file-input"
              accept="image/png,image/webp,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void addNewFurnitureFromFile(file);
                e.target.value = "";
              }}
            />
            <div
              className={`rounded-xl border border-dashed p-3 cursor-pointer transition text-center select-none ${
                isDraggingOverUploadCard
                  ? "border-emerald-400 bg-emerald-900/40 ring-2 ring-emerald-400/50"
                  : "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-900/30"
              }`}
              onClick={() => addNewFileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOverUploadCard(true);
              }}
              onDragLeave={() => setIsDraggingOverUploadCard(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOverUploadCard(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void addNewFurnitureFromFile(file);
              }}
              data-testid="admin-sidebar-upload-card"
            >
              <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-xs mb-1">
                <Upload size={15} />
                <span>Tải thêm đồ nội thất từ máy</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {uploading ? "Đang xử lý tải ảnh..." : "Kéo thả hoặc bấm để chọn ảnh PNG / JPG từ máy tính"}
              </p>
            </div>
          </div>

          {/* Item List in Active Room */}
          <div className="border-b border-emerald-900/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300">
                Vật phẩm trong phòng ({roomItems.length})
              </span>
              <span className="text-[10px] text-slate-500">Bấm để chỉnh tọa độ</span>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {roomItems.map((item) => {
                const isSelected = item.id === selectedItemId;
                const isDirty = dirtyItemIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer border transition ${
                      isSelected
                        ? "border-emerald-400 bg-[#163028] text-emerald-200 shadow"
                        : "border-transparent bg-black/20 text-slate-300 hover:bg-black/40 hover:text-white"
                    }`}
                    onClick={() => handleSelectItem(item)}
                    data-testid={`catalog-item-row-${item.id}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={item.img_src}
                        alt=""
                        className="h-7 w-7 rounded bg-black/40 object-contain p-0.5 border border-white/10"
                      />
                      <div className="truncate">
                        <div className="truncate font-bold">{item.name_vi}</div>
                        <div className="text-[10px] text-slate-400">ID: {item.id} · Z: {item.z_index}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isDirty && (
                        <span className="h-2 w-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" title="Chưa lưu" />
                      )}
                      <button
                        type="button"
                        className="rounded p-1 text-red-400/70 hover:text-red-200 hover:bg-red-950/80 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        title={`Xóa món "${item.name_vi}"`}
                        data-testid={`catalog-delete-btn-${item.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Item Property & Homography Details */}
          {currentItem ? (
            <div className="flex-1 p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Sliders size={14} className="text-emerald-400" />
                  <span>Chỉnh Sửa Vật Phẩm</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded bg-red-950/80 border border-red-500/50 px-2.5 py-1 text-[11px] font-bold text-red-200 hover:bg-red-900/90 shadow transition"
                    onClick={() => setConfirmDeleteId(currentItem.id)}
                    disabled={saving}
                    data-testid="admin-form-delete-btn"
                    title="Xóa vật phẩm này"
                  >
                    <Trash2 size={13} />
                    <span>Xóa món này</span>
                  </button>
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 shadow transition"
                    onClick={handleSaveCurrentItem}
                    disabled={saving}
                    data-testid="admin-save-item-btn"
                  >
                    {saving ? "Lưu..." : "Lưu món này"}
                  </button>
                </div>
              </div>

              {/* Upload Transparent PNG Section */}
              <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/20 p-3">
                <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-300 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon size={14} />
                  <span>Tải Ảnh Vật Phẩm (PNG Trong Suốt)</span>
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Chọn ảnh định dạng PNG/WebP trong suốt từ máy tính. Hệ thống sẽ tự động đo kích thước thật và hiển thị lên phòng!
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    data-testid="admin-replace-file-input"
                    accept="image/png,image/webp,image/jpeg"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-700/40 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-600 hover:text-white transition shadow"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    data-testid="admin-upload-image-btn"
                  >
                    <Upload size={14} />
                    <span>{uploading ? "Đang tải ảnh lên..." : "Tải Ảnh Từ Máy Tính"}</span>
                  </button>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 truncate">
                  Đường dẫn hiện tại: <span className="font-mono text-slate-300">{currentItem.img_src}</span>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Tên Tiếng Việt</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    value={currentItem.name_vi}
                    onChange={(e) => updateCurrentItem((p) => ({ ...p, name_vi: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Tên Tiếng Anh</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    value={currentItem.name_en}
                    onChange={(e) => updateCurrentItem((p) => ({ ...p, name_en: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Mô Tả Tiếng Việt</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                  value={currentItem.desc_vi}
                  onChange={(e) => updateCurrentItem((p) => ({ ...p, desc_vi: e.target.value }))}
                />
              </div>

              {/* Scale / Zoom Slider Control */}
              <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-3 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <ZoomIn size={14} className="text-emerald-400" />
                    <span>Thanh Kéo Phóng To / Thu Nhỏ</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
                      {Math.round((currentItem.user_scale || 1.0) * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({(currentItem.user_scale || 1.0).toFixed(2)}x)
                    </span>
                  </div>
                </div>

                {/* Slider bar with - and + step buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-7 w-7 shrink-0 rounded bg-black/60 border border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500 flex items-center justify-center font-bold text-sm transition active:scale-95"
                    onClick={() => handleScaleChange(Number(((currentItem.user_scale || 1.0) - 0.05).toFixed(2)))}
                    title="Thu nhỏ 5%"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.25"
                    max="2.50"
                    step="0.05"
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    value={currentItem.user_scale || 1.0}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    data-testid="admin-scale-slider"
                  />
                  <button
                    type="button"
                    className="h-7 w-7 shrink-0 rounded bg-black/60 border border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500 flex items-center justify-center font-bold text-sm transition active:scale-95"
                    onClick={() => handleScaleChange(Number(((currentItem.user_scale || 1.0) + 0.05).toFixed(2)))}
                    title="Phóng to 5%"
                  >
                    +
                  </button>
                </div>

                {/* Preset Zoom Levels */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((preset) => {
                    const isActive = Math.abs((currentItem.user_scale || 1.0) - preset) < 0.02;
                    return (
                      <button
                        key={preset}
                        type="button"
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                          isActive
                            ? "bg-emerald-500 text-slate-950 font-black shadow"
                            : "bg-black/40 text-slate-400 hover:text-white hover:bg-black/70 border border-slate-800"
                        }`}
                        onClick={() => handleScaleChange(preset)}
                      >
                        {preset === 1.0 ? "100%" : `${Math.round(preset * 100)}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dimensions & Stacking */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Rộng Thật (px)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    value={currentItem.natural_width}
                    onChange={(e) => updateCurrentItem((p) => ({ ...p, natural_width: Number(e.target.value) || 100 }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Cao Thật (px)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    value={currentItem.natural_height}
                    onChange={(e) => updateCurrentItem((p) => ({ ...p, natural_height: Number(e.target.value) || 100 }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Z-Index (Lớp)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    value={currentItem.z_index}
                    onChange={(e) => updateCurrentItem((p) => ({ ...p, z_index: Number(e.target.value) || 500 }))}
                  />
                </div>
              </div>

              {/* 4 Corner Percentage Coordinates */}
              <div className="rounded-xl border border-slate-800 bg-black/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <Maximize2 size={13} className="text-amber-400" />
                    <span>Tọa Độ 4 Góc Phối Cảnh (%)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">TL, TR, BR, BL</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="rounded bg-black/50 p-1.5 border border-slate-800">
                    <span className="text-slate-400">Top-Left: </span>
                    <span className="text-amber-300">{currentItem.corners.tl[0]}%, {currentItem.corners.tl[1]}%</span>
                  </div>
                  <div className="rounded bg-black/50 p-1.5 border border-slate-800">
                    <span className="text-slate-400">Top-Right: </span>
                    <span className="text-amber-300">{currentItem.corners.tr[0]}%, {currentItem.corners.tr[1]}%</span>
                  </div>
                  <div className="rounded bg-black/50 p-1.5 border border-slate-800">
                    <span className="text-slate-400">Btm-Left: </span>
                    <span className="text-amber-300">{currentItem.corners.bl[0]}%, {currentItem.corners.bl[1]}%</span>
                  </div>
                  <div className="rounded bg-black/50 p-1.5 border border-slate-800">
                    <span className="text-slate-400">Btm-Right: </span>
                    <span className="text-amber-300">{currentItem.corners.br[0]}%, {currentItem.corners.br[1]}%</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  💡 <strong>Cách chỉnh:</strong> Kéo điểm tròn ở giữa ảnh để <strong>di chuyển</strong> cả vật phẩm. Kéo 4 góc tròn màu vàng để <strong>co giãn & uốn phối cảnh nghiêng 3D</strong> chuẩn theo sàn phòng khách/ngủ!
                </p>
              </div>

              {/* Danger Zone: Permanent Deletion */}
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 space-y-2">
                <div className="text-[11px] font-bold text-red-300 flex items-center gap-1.5">
                  <Trash2 size={13} className="text-red-400" />
                  <span>Vùng Nguy Hiểm</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Xóa vật phẩm này khỏi danh mục hệ thống và khỏi căn nhà của người chơi.
                </p>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-500/50 bg-red-600/30 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-600 hover:text-white transition shadow"
                  onClick={() => setConfirmDeleteId(currentItem.id)}
                  disabled={saving}
                  data-testid="admin-danger-delete-btn"
                >
                  <Trash2 size={14} />
                  <span>Xóa Vật Phẩm Này Vĩnh Viễn</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500">
              Chưa chọn vật phẩm nào
            </div>
          )}
        </aside>

        {/* Right Stage: Interactive Canvas with Homography Warping */}
        <main className="relative flex flex-1 items-center justify-center bg-black overflow-hidden p-4">
          <div
            ref={stageRef}
            className={`relative w-full max-w-[1280px] aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border bg-cover bg-center select-none transition-all ${
              isDraggingOverStage
                ? "border-emerald-400 ring-4 ring-emerald-500/50 shadow-emerald-500/20"
                : "border-emerald-900/40"
            }`}
            style={{ backgroundImage: `url(${currentRoomBg})` }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOverStage(true);
            }}
            onDragLeave={(e) => {
              if (!stageRef.current?.contains(e.relatedTarget as Node)) {
                setIsDraggingOverStage(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOverStage(false);
              const file = e.dataTransfer.files?.[0];
              if (file && stageRef.current) {
                const rect = stageRef.current.getBoundingClientRect();
                const xPct = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
                const yPct = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
                void addNewFurnitureFromFile(file, { xPct, yPct });
              }
            }}
            data-testid="admin-stage"
          >
            {/* Drag & Drop Visual Overlay Indicator */}
            {isDraggingOverStage && (
              <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-black/80 border-4 border-dashed border-emerald-400 backdrop-blur-sm pointer-events-none animate-pulse">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 mb-3 shadow-lg">
                  <Upload size={32} />
                </div>
                <span className="text-base font-black uppercase tracking-wider text-white">Thả Ảnh Vào Đây Để Đặt Đồ Nội Thất!</span>
                <span className="text-xs text-emerald-300 mt-1 font-semibold">Tự động nhận diện PNG trong suốt & đặt vào đúng vị trí thả</span>
              </div>
            )}
            {/* Night Filter Preview */}
            {dayNightPreview === "night" && (
              <div className="absolute inset-0 bg-slate-950/60 pointer-events-none mix-blend-multiply transition-opacity duration-300 z-10" />
            )}

            {/* Walkable Mask Canvas Layer */}
            <canvas
              ref={painterCanvasRef}
              className={`absolute inset-0 h-full w-full ${
                isPainterMode
                  ? "pointer-events-auto cursor-crosshair z-[950]"
                  : "pointer-events-none opacity-40 z-20"
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              data-testid="admin-walkable-canvas"
            />

            {/* Floating Walkable Painter Controls Bar */}
            {isPainterMode && (
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-500/60 bg-[#081812]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md"
                data-testid="admin-painter-toolbar"
              >
                <div className="flex items-center gap-1.5 pr-2 border-r border-emerald-800/60">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">🖌️ Bôi Sàn</span>
                </div>

                {/* Tool Switcher: Brush vs Eraser */}
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-emerald-900/40">
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      painterTool === "brush"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() => setPainterTool("brush")}
                    title="Bôi màu xanh lên sàn để cho phép nhân vật đi qua"
                  >
                    <Paintbrush size={13} />
                    <span>🟢 Cọ Vẽ</span>
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      painterTool === "eraser"
                        ? "bg-red-700 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() => setPainterTool("eraser")}
                    title="Tẩy xoá phần sàn vướng chân bàn ghế, góc đàn"
                  >
                    <Eraser size={13} />
                    <span>⚪ Cọ Tẩy</span>
                  </button>
                </div>

                {/* Brush Size Controls */}
                <div className="flex items-center gap-1 pl-1 pr-2 border-r border-emerald-800/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-0.5">Nét:</span>
                  {[
                    { label: "Nhỏ", size: 20 },
                    { label: "Vừa", size: 45 },
                    { label: "Lớn", size: 80 },
                  ].map((b) => (
                    <button
                      key={b.size}
                      type="button"
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
                        brushSize === b.size
                          ? "bg-emerald-500 text-stone-950 font-black"
                          : "bg-black/40 text-slate-300 hover:bg-black/70"
                      }`}
                      onClick={() => setBrushSize(b.size)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                {/* Action buttons: Preset, Clear, Test Movement, Save, Close */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 px-2 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-900 transition"
                    onClick={handleApplyPreset}
                    title="Tô kín vùng sàn gỗ nguyên bản ban đầu"
                  >
                    <Sparkles size={12} />
                    <span>🎯 Mẫu Chuẩn</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg bg-black/60 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-400 hover:text-white transition"
                    onClick={handleClearMask}
                    title="Xóa trắng vùng vẽ mặt sàn"
                  >
                    <RefreshCw size={12} />
                    <span>🧹 Xóa</span>
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                      isTestingMovement
                        ? "bg-amber-500 text-stone-950 border-amber-400 font-black animate-pulse"
                        : "bg-black/60 text-slate-300 border-slate-700 hover:text-white"
                    }`}
                    onClick={() => setIsTestingMovement((prev) => !prev)}
                    title="Cho nhân vật Chibi đi thử trên vùng đã bôi để kiểm tra"
                  >
                    <Footprints size={13} />
                    <span>{isTestingMovement ? "Dừng Thử" : "🚶 Thử Đi"}</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black text-white hover:bg-emerald-500 transition shadow-lg"
                    onClick={handleSaveWalkableMask}
                    disabled={saving}
                  >
                    <Save size={13} />
                    <span>{saving ? "Lưu..." : "💾 Lưu Sàn"}</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-black/60 p-1 text-slate-400 hover:text-white hover:bg-red-950/80 transition"
                    onClick={() => setIsPainterMode(false)}
                    title="Đóng bảng bôi sàn"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Live Preview Walking Chibi */}
            {isTestingMovement && (
              <div
                className="absolute z-[960] pointer-events-none -translate-x-1/2 -translate-y-[85%]"
                style={{
                  left: `${testChibiPos.x}%`,
                  top: `${testChibiPos.y}%`,
                }}
              >
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full bg-black/40 blur-[1px]" />
                <img
                  src="/healthclues/assets/characters/chibi-anna.png"
                  alt="Chibi"
                  className={`w-12 h-14 object-contain filter drop-shadow-md ${
                    testChibiFacingLeft ? "-scale-x-100" : ""
                  } ${testChibiWalking ? "animate-bounce" : ""}`}
                />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-950/90 border border-emerald-400/60 px-2 py-0.5 text-[9px] font-bold text-emerald-200 shadow">
                  {testChibiWalking ? "Đang đi theo sàn..." : "Nghỉ ngơi ☕"}
                </div>
              </div>
            )}

            {/* Render All Items in this Room */}
            {roomItems.map((item) => {
              const isSelected = item.id === selectedItemId;
              const w = item.natural_width;
              const h = item.natural_height;

              const p0 = { x: (item.corners.tl[0] / 100) * stageDimensions.width, y: (item.corners.tl[1] / 100) * stageDimensions.height };
              const p1 = { x: (item.corners.tr[0] / 100) * stageDimensions.width, y: (item.corners.tr[1] / 100) * stageDimensions.height };
              const p2 = { x: (item.corners.br[0] / 100) * stageDimensions.width, y: (item.corners.br[1] / 100) * stageDimensions.height };
              const p3 = { x: (item.corners.bl[0] / 100) * stageDimensions.width, y: (item.corners.bl[1] / 100) * stageDimensions.height };

              const m = getSquareToQuadTransform(w, h, p0, p1, p2, p3);

              // Center anchor coordinate for translation
              const centerX = (p0.x + p1.x + p2.x + p3.x) / 4;
              const centerY = (p0.y + p1.y + p2.y + p3.y) / 4;

              return (
                <div
                  key={item.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: isSelected ? 900 : item.z_index }}
                >
                  {/* Warped Furniture Sprite */}
                  <div
                    className="absolute top-0 left-0"
                    style={{
                      width: `${w}px`,
                      height: `${h}px`,
                      transformOrigin: "0 0",
                      transform: m ? `matrix3d(${m.join(",")})` : undefined,
                    }}
                  >
                    <img
                      src={item.img_src}
                      alt={item.name_vi}
                      className={`h-full w-full object-contain filter drop-shadow(0 15px 25px rgba(0,0,0,0.45)) pointer-events-auto cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-black" : "opacity-90 hover:opacity-100"
                      }`}
                      onClick={() => handleSelectItem(item)}
                    />
                  </div>

                  {/* If Selected: Render Interactive Drag Handles */}
                  {isSelected && (
                    <>
                      {/* Perspective Bounding Polygon Outline */}
                      <svg className="absolute inset-0 pointer-events-none h-full w-full">
                        <polygon
                          points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                          fill="rgba(52, 211, 153, 0.12)"
                          stroke="#34d399"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                      </svg>

                      {/* Center Move Anchor */}
                      <div
                        className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 text-stone-900 shadow-xl flex items-center justify-center pointer-events-auto cursor-move hover:scale-110 active:scale-95 transition"
                        style={{ left: `${centerX}px`, top: `${centerY}px` }}
                        onMouseDown={handleMouseDownCenter}
                        title="Giữ chuột kéo để di chuyển cả vật phẩm"
                        data-testid="admin-center-drag-handle"
                      >
                        <Move size={16} />
                      </div>

                      {/* Quick Delete Stage Button */}
                      <button
                        type="button"
                        className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 text-white shadow-xl flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-red-500 hover:scale-110 active:scale-95 transition border border-white/20"
                        style={{ left: `${centerX + 32}px`, top: `${centerY}px` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        title={`Xóa món "${item.name_vi}"`}
                        data-testid="admin-stage-quick-delete"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Floating Quick Zoom Bar Directly on Stage */}
                      <div
                        className="absolute -translate-x-1/2 -translate-y-full rounded-full bg-stone-900/90 backdrop-blur border border-emerald-500/50 px-2.5 py-1 shadow-2xl flex items-center gap-1.5 pointer-events-auto z-30"
                        style={{
                          left: `${centerX}px`,
                          top: `${Math.max(28, Math.min(p0.y, p1.y) - 10)}px`,
                        }}
                      >
                        <button
                          type="button"
                          className="h-5 w-5 rounded bg-black/60 hover:bg-emerald-600 text-white flex items-center justify-center text-xs font-black transition active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScaleChange(Number(((item.user_scale || 1.0) - 0.05).toFixed(2)));
                          }}
                          title="Thu nhỏ 5%"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="0.25"
                          max="2.50"
                          step="0.05"
                          value={item.user_scale || 1.0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleScaleChange(parseFloat(e.target.value));
                          }}
                          className="w-20 h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-emerald-400"
                          title="Kéo thanh trượt để phóng to / thu nhỏ trực tiếp trên sàn"
                          data-testid="admin-stage-quick-scale-slider"
                        />
                        <button
                          type="button"
                          className="h-5 w-5 rounded bg-black/60 hover:bg-emerald-600 text-white flex items-center justify-center text-xs font-black transition active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScaleChange(Number(((item.user_scale || 1.0) + 0.05).toFixed(2)));
                          }}
                          title="Phóng to 5%"
                        >
                          +
                        </button>
                        <span className="text-[10px] font-mono font-bold text-amber-300 ml-0.5">
                          {Math.round((item.user_scale || 1.0) * 100)}%
                        </span>
                      </div>

                      {/* 4 Corner Perspective Handles */}
                      <div
                        className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-2 border-stone-950 shadow-lg pointer-events-auto cursor-nwse-resize hover:scale-125 transition"
                        style={{ left: `${p0.x}px`, top: `${p0.y}px` }}
                        onMouseDown={(e) => handleMouseDownCorner(e, "tl")}
                        title="Kéo góc Trên-Trái (TL)"
                        data-testid="admin-corner-tl"
                      />
                      <div
                        className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-2 border-stone-950 shadow-lg pointer-events-auto cursor-nesw-resize hover:scale-125 transition"
                        style={{ left: `${p1.x}px`, top: `${p1.y}px` }}
                        onMouseDown={(e) => handleMouseDownCorner(e, "tr")}
                        title="Kéo góc Trên-Phải (TR)"
                        data-testid="admin-corner-tr"
                      />
                      <div
                        className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-2 border-stone-950 shadow-lg pointer-events-auto cursor-nwse-resize hover:scale-125 transition"
                        style={{ left: `${p2.x}px`, top: `${p2.y}px` }}
                        onMouseDown={(e) => handleMouseDownCorner(e, "br")}
                        title="Kéo góc Dưới-Phải (BR)"
                        data-testid="admin-corner-br"
                      />
                      <div
                        className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-2 border-stone-950 shadow-lg pointer-events-auto cursor-nesw-resize hover:scale-125 transition"
                        style={{ left: `${p3.x}px`, top: `${p3.y}px` }}
                        onMouseDown={(e) => handleMouseDownCorner(e, "bl")}
                        title="Kéo góc Dưới-Trái (BL)"
                        data-testid="admin-corner-bl"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* In-App Confirmation Modal for Item Deletion */}
      {confirmDeleteId && (() => {
        const targetItem = catalog.find((i) => i.id === confirmDeleteId);
        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            data-testid="delete-confirm-dialog"
          >
            <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-[#12211d] p-6 shadow-2xl text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                <Trash2 size={26} />
              </div>
              <h3 className="text-base font-bold text-white">Xác nhận xóa vật phẩm?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bạn có chắc chắn muốn xóa vật phẩm{" "}
                <strong className="text-amber-300">{targetItem?.name_vi || confirmDeleteId}</strong>{" "}
                (<span className="font-mono text-slate-400">{confirmDeleteId}</span>) khỏi danh mục và căn nhà không?
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={saving}
                  data-testid="cancel-delete-btn"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500 bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 shadow-lg transition active:scale-95 disabled:opacity-50"
                  onClick={() => void handleDeleteItem(confirmDeleteId)}
                  disabled={saving}
                  data-testid="confirm-delete-action-btn"
                >
                  <Trash2 size={14} />
                  <span>{saving ? "Đang xóa..." : "Xác Nhận Xóa"}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xl transition border ${
            toast.type === "success"
              ? "border-emerald-500 bg-emerald-950 text-emerald-200"
              : toast.type === "error"
              ? "border-red-500 bg-red-950 text-red-200"
              : "border-cyan-500 bg-cyan-950 text-cyan-200"
          }`}
        >
          {toast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
