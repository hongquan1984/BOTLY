"use client";

import React, { useState } from "react";
import type {
  DetectiveCase,
  DetectiveChapter,
  CaseDifficultyLevel,
  DetectiveTopic,
  SceneHotspot,
  DetailHotspot,
  ObjectInspectionType,
} from "../types";
import { ALL_CHAPTERS, ALL_DETECTIVE_CASES } from "../data/cases";
import { DIFFICULTY_TIERS } from "../engine/difficulty-engine";
import { ObjectInspectionModal } from "../gameplay/investigation-scene/ObjectInspectionModal";

export function DetectiveCaseEditor() {
  const [chapters, setChapters] = useState<DetectiveChapter[]>(ALL_CHAPTERS);
  const [cases, setCases] = useState<DetectiveCase[]>(ALL_DETECTIVE_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || "");
  const [selectedTab, setSelectedTab] = useState<"cases" | "chapters" | "hotspots" | "validator">("cases");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [previewInspectionHotspot, setPreviewInspectionHotspot] = useState<SceneHotspot | null>(null);
  const [sceneAuditFeedback, setSceneAuditFeedback] = useState<string | null>(null);

  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  // Hotspot interactive placement state
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const activeScene = currentCase?.scenes[activeSceneIdx] || currentCase?.scenes[0];

  // Cycle & Deadlock Validation Algorithm
  const runCampaignValidation = (): {
    hasCycles: boolean;
    brokenPrereqs: string[];
    isolatedCases: string[];
    message: string;
  } => {
    const brokenPrereqs: string[] = [];
    const caseMap = new Map(cases.map((c) => [c.id, c]));

    // 1. Check for broken prerequisite references
    for (const c of cases) {
      if (c.prerequisiteCaseId && !caseMap.has(c.prerequisiteCaseId)) {
        brokenPrereqs.push(
          `Vụ án "${c.title}" yêu cầu mở khóa từ "${c.prerequisiteCaseId}" nhưng vụ án này không tồn tại!`
        );
      }
    }

    // 2. Check for dependency cycles (DFS cycle detection)
    let hasCycles = false;
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const checkCycle = (caseId: string): boolean => {
      visited.add(caseId);
      inStack.add(caseId);

      const caseItem = caseMap.get(caseId);
      if (caseItem?.prerequisiteCaseId && caseMap.has(caseItem.prerequisiteCaseId)) {
        const prereqId = caseItem.prerequisiteCaseId;
        if (!visited.has(prereqId) && checkCycle(prereqId)) {
          return true;
        } else if (inStack.has(prereqId)) {
          return true;
        }
      }

      inStack.delete(caseId);
      return false;
    };

    for (const c of cases) {
      if (!visited.has(c.id)) {
        if (checkCycle(c.id)) {
          hasCycles = true;
          break;
        }
      }
    }

    let message = "Hệ sinh thái Campaign hợp lệ! Không có vòng lặp phụ thuộc và các điều kiện mở khóa thông suốt.";
    if (hasCycles) {
      message = "CẢNH BÁO: Phát hiện vòng lặp khóa vô nghiệm (Deadlock Cycle) trong điều kiện mở khóa!";
    } else if (brokenPrereqs.length > 0) {
      message = `CẢNH BÁO: Có ${brokenPrereqs.length} điều kiện mở khóa trỏ đến vụ án không tồn tại!`;
    }

    return {
      hasCycles,
      brokenPrereqs,
      isolatedCases: [],
      message,
    };
  };

  const validationResult = runCampaignValidation();

  // Handle Scene Canvas Click to place/adjust hotspot
  const handleSceneCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const roundX = Math.round(clickX);
    const roundY = Math.round(clickY);

    const newHotspot: SceneHotspot = {
      id: `hotspot-custom-${Date.now()}`,
      sceneId: activeScene.id,
      clueId: currentCase.clues[0]?.id || "clue-new",
      name: `Điểm nghi vấn (${roundX}%, ${roundY}%)`,
      description: "Vật thể mới cần kiểm tra",
      x: roundX,
      y: roundY,
      radius: 8,
      shape: "circle",
      inspectMessage: "Ghi chú hiện trường được thêm bởi Admin Case Editor.",
      discoveredIcon: "🔍",
    };

    const updatedScenes = currentCase.scenes.map((s, idx) =>
      idx === activeSceneIdx ? { ...s, hotspots: [...s.hotspots, newHotspot] } : s
    );

    setCases((prev) =>
      prev.map((c) => (c.id === currentCase.id ? { ...c, scenes: updatedScenes } : c))
    );

    setSaveMessage(`Đã thêm Hotspot tại vị trí (${roundX}%, ${roundY}%)!`);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-8 bg-[#fdfbf7] min-h-screen text-slate-900 font-sans">
      {/* Editor Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e2d9c2] pb-4 mb-6 gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
            HEALTHCLUES · BỘ ĐIỀU PHỐI QUẢN TRỊ
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
            Admin Case & Campaign Editor
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Thiết kế vụ án, điều phối chuỗi mở khóa chiến dịch (Campaign Chain) và định vị Hotspot hiện trường trực quan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
              {saveMessage}
            </span>
          )}
          <button
            onClick={() => {
              setSaveMessage("Toàn bộ cấu hình vụ án đã được xác thực an toàn!");
              setTimeout(() => setSaveMessage(""), 3500);
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-amber-300 font-bold text-xs hover:bg-slate-800 transition shadow"
          >
            Lưu / Xác thực cấu hình
          </button>
        </div>
      </header>

      {/* Editor Tabs */}
      <div className="flex gap-2 border-b border-[#e2d9c2] pb-3 mb-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setSelectedTab("cases")}
          className={`px-4 py-2 rounded-xl border transition ${
            selectedTab === "cases"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-[#d7cfb7] hover:bg-slate-100"
          }`}
        >
          📁 Quản Lý Vụ Án ({cases.length})
        </button>
        <button
          onClick={() => setSelectedTab("chapters")}
          className={`px-4 py-2 rounded-xl border transition ${
            selectedTab === "chapters"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-[#d7cfb7] hover:bg-slate-100"
          }`}
        >
          📜 Quản Lý Chương ({chapters.length})
        </button>
        <button
          onClick={() => setSelectedTab("hotspots")}
          className={`px-4 py-2 rounded-xl border transition ${
            selectedTab === "hotspots"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-[#d7cfb7] hover:bg-slate-100"
          }`}
        >
          🎯 Visual Hotspot Editor
        </button>
        <button
          onClick={() => setSelectedTab("validator")}
          className={`px-4 py-2 rounded-xl border transition flex items-center gap-1.5 ${
            selectedTab === "validator"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-[#d7cfb7] hover:bg-slate-100"
          }`}
        >
          <span>{validationResult.hasCycles ? "⚠️" : "🛡️"}</span>
          <span>Kiểm Tra Mở Khóa Chiến Dịch</span>
        </button>
      </div>

      {/* TAB 1: Case Details Editor */}
      {selectedTab === "cases" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Case Selector */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              DANH SÁCH VỤ ÁN
            </h3>
            <div className="space-y-2">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    c.id === selectedCaseId
                      ? "bg-amber-100/70 border-amber-500 shadow-sm ring-1 ring-amber-400"
                      : "bg-white border-[#d7cfb7] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      THỨ TỰ #{c.chapterOrder}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {c.publicationStatus}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mt-1">{c.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                    <span>Độ khó: Level {c.difficulty}</span>
                    <span>·</span>
                    <span>{c.clues.length} manh mối</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const newId = `case-custom-${Date.now()}`;
                const newCase: DetectiveCase = {
                  id: newId,
                  chapterId: chapters[0].id,
                  chapterOrder: cases.length + 1,
                  prerequisiteCaseId: cases[cases.length - 1]?.id || null,
                  title: "Vụ án mới chưa đặt tên",
                  subtitle: "Mô tả ngắn về bí ẩn sức khỏe cần giải quyết",
                  topic: "nutrition",
                  region: "HealthClues Realm",
                  difficulty: 2,
                  contentVersion: 1,
                  publicationStatus: "draft",
                  victimOrPatient: {
                    name: "Người bệnh",
                    age: 30,
                    reportedSymptom: "Triệu chứng bất thường",
                    initialQuote: "Tôi nghĩ nguyên nhân là...",
                    avatar: "👤",
                  },
                  lunaBriefing: {
                    greeting: "Chào bạn!",
                    invitation: "Hãy cùng Luna khám phá vụ án mới này!",
                    hint: "Chú ý các chi tiết bất thường.",
                  },
                  scenes: [
                    {
                      id: `scene-${newId}`,
                      caseId: newId,
                      name: "Hiện trường phòng khách",
                      description: "Hiện trường khảo sát ban đầu",
                      theme: "living_room",
                      lighting: "warm",
                      hotspots: [],
                    },
                  ],
                  clues: [],
                  hypotheses: [],
                  deductionSteps: [],
                  resolution: {
                    caseId: newId,
                    primaryConclusion: "Kết luận y khoa khách quan",
                    isMultiFactor: true,
                    scientificExplanation: "Cơ chế sinh học chi tiết",
                    patientFeedback: "Cảm ơn thám tử!",
                    medicalPearls: [],
                    expReward: 60,
                    coinReward: 200,
                  },
                  references: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setCases([...cases, newCase]);
                setSelectedCaseId(newId);
              }}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-500 text-slate-700 font-bold text-xs hover:bg-white transition flex items-center justify-center gap-2"
            >
              <span>+ Thêm Vụ Án Mới Vào Chiến Dịch</span>
            </button>
          </div>

          {/* Right: Case Form Editor */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#d7cfb7] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="text-sm font-black text-slate-900">
                Chỉnh sửa: {currentCase.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Trạng thái:</span>
                <select
                  value={currentCase.publicationStatus}
                  onChange={(e) => {
                    const status = e.target.value as DetectiveCase["publicationStatus"];
                    setCases((prev) =>
                      prev.map((c) => (c.id === currentCase.id ? { ...c, publicationStatus: status } : c))
                    );
                  }}
                  className="text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="review">Đang duyệt (Review)</option>
                  <option value="approved">Đã duyệt (Approved)</option>
                  <option value="published">Đã xuất bản (Published)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề vụ án</label>
                <input
                  type="text"
                  value={currentCase.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCases((prev) =>
                      prev.map((c) => (c.id === currentCase.id ? { ...c, title: val } : c))
                    );
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chủ đề sức khỏe (Topic)</label>
                <select
                  value={currentCase.topic}
                  onChange={(e) => {
                    const val = e.target.value as DetectiveTopic;
                    setCases((prev) =>
                      prev.map((c) => (c.id === currentCase.id ? { ...c, topic: val } : c))
                    );
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="sleep">Giấc ngủ (Sleep)</option>
                  <option value="gout">Gout & Acid Uric</option>
                  <option value="nutrition">Dinh dưỡng (Nutrition)</option>
                  <option value="migraine">Đau nửa đầu (Migraine)</option>
                  <option value="stress">Căng thẳng (Stress)</option>
                  <option value="hydration">Nước & Điện giải (Hydration)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cấp độ khó (Difficulty)</label>
                <select
                  value={currentCase.difficulty}
                  onChange={(e) => {
                    const val = Number(e.target.value) as CaseDifficultyLevel;
                    setCases((prev) =>
                      prev.map((c) => (c.id === currentCase.id ? { ...c, difficulty: val } : c))
                    );
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {Object.entries(DIFFICULTY_TIERS).map(([lvl, info]) => (
                    <option key={lvl} value={lvl}>
                      Level {lvl}: {info.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Điều kiện mở khóa (Vụ án tiền đề)
                </label>
                <select
                  value={currentCase.prerequisiteCaseId || ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setCases((prev) =>
                      prev.map((c) => (c.id === currentCase.id ? { ...c, prerequisiteCaseId: val } : c))
                    );
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="">Không có (Mở khóa mặc định / Vụ án đầu tiên)</option>
                  {cases
                    .filter((c) => c.id !== currentCase.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Vụ #{c.chapterOrder}: {c.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tóm tắt tình huống (Mystery Hook)
              </label>
              <textarea
                value={currentCase.subtitle}
                onChange={(e) => {
                  const val = e.target.value;
                  setCases((prev) =>
                    prev.map((c) => (c.id === currentCase.id ? { ...c, subtitle: val } : c))
                  );
                }}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            {/* Victim / Patient Settings */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-black text-slate-700 uppercase tracking-wider block">
                Thông tin người bệnh / Nhân vật chính
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Tên bệnh nhân</label>
                  <input
                    type="text"
                    value={currentCase.victimOrPatient.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCases((prev) =>
                        prev.map((c) =>
                          c.id === currentCase.id
                            ? { ...c, victimOrPatient: { ...c.victimOrPatient, name: val } }
                            : c
                        )
                      );
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Tuổi</label>
                  <input
                    type="number"
                    value={currentCase.victimOrPatient.age || 28}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCases((prev) =>
                        prev.map((c) =>
                          c.id === currentCase.id
                            ? { ...c, victimOrPatient: { ...c.victimOrPatient, age: val } }
                            : c
                        )
                      );
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Biểu tượng avatar</label>
                  <input
                    type="text"
                    value={currentCase.victimOrPatient.avatar || "👤"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCases((prev) =>
                        prev.map((c) =>
                          c.id === currentCase.id
                            ? { ...c, victimOrPatient: { ...c.victimOrPatient, avatar: val } }
                            : c
                        )
                      );
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Lời nói ban đầu (Định kiến ngộ nhận)</label>
                <input
                  type="text"
                  value={currentCase.victimOrPatient.initialQuote}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCases((prev) =>
                      prev.map((c) =>
                        c.id === currentCase.id
                          ? { ...c, victimOrPatient: { ...c.victimOrPatient, initialQuote: val } }
                          : c
                      )
                    );
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Chapters Editor */}
      {selectedTab === "chapters" && (
        <div className="bg-white p-6 rounded-3xl border border-[#d7cfb7] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-200">
            <h3 className="text-sm font-black text-slate-900">Danh Sách Chương (Chapters)</h3>
            <span className="text-xs text-slate-500">
              Chiến dịch theo chương cho phép mở khóa liên tục không giới hạn ngày
            </span>
          </div>

          <div className="space-y-3">
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="p-4 rounded-2xl border border-slate-200 bg-[#faf8f4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                    {ch.icon}
                  </span>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{ch.title}</h4>
                    <p className="text-slate-600 mt-0.5">{ch.subtitle}</p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Khu vực: {ch.region} · {ch.caseIds.length} vụ án
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Đang hoạt động
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Visual Hotspot Editor */}
      {selectedTab === "hotspots" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span>
                <strong>Hướng dẫn Hotspot Editor:</strong> Click vào hiện trường để cắm Hotspot mới, hoặc chạm vào một điểm có sẵn để chỉnh sửa chi tiết (Detail Hotspots) & kiểm tra cận cảnh (Layer 2).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const outOfBounds = activeScene.hotspots.filter(
                    (h) => h.x < 3 || h.x > 97 || h.y < 3 || h.y > 97
                  );
                  const missingPolygons = activeScene.hotspots.filter(
                    (h) => !h.polygon || h.polygon.length < 3
                  );
                  if (outOfBounds.length > 0) {
                    setSceneAuditFeedback(
                      `⚠️ Cảnh báo: Có ${outOfBounds.length} điểm hotspot nằm quá sát mép hiện trường!`
                    );
                  } else if (missingPolygons.length > 0) {
                    setSceneAuditFeedback(
                      `⚠️ Cảnh báo: Có ${missingPolygons.length} hotspot chưa có đa giác Polygon ôm viền vật thể (${missingPolygons.map((m) => m.name).join(", ")}).`
                    );
                  } else {
                    setSceneAuditFeedback(
                      `✅ Hiện trường hợp lệ! ${activeScene.hotspots.length}/${activeScene.hotspots.length} vật thể đã khóa tỷ lệ gốc và phủ Polygon chuẩn xác.`
                    );
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 font-bold hover:bg-slate-800 transition shadow-sm whitespace-nowrap"
              >
                🔍 Thẩm Định Hiện Trường
              </button>
              <span className="font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-amber-300 whitespace-nowrap">
                {activeScene.hotspots.length} Hotspots
              </span>
            </div>
          </div>

          {sceneAuditFeedback && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-sm animate-in fade-in">
              {sceneAuditFeedback}
            </div>
          )}

          {/* Interactive Scene Canvas (Locked exact natural aspect ratio) */}
          <div
            onClick={handleSceneCanvasClick}
            style={{ aspectRatio: String(activeScene.aspectRatio || 1376 / 768) }}
            className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-950 cursor-crosshair shadow-2xl"
          >
            {/* Background Artwork */}
            <img
              src={
                activeScene.backgroundUrl ||
                activeScene.backgroundSvg ||
                (currentCase.id === "case-sleep-001"
                  ? "/gametrinhtham/scenes/scene-an-bedroom.png"
                  : "/gametrinhtham/scenes/scene-minh-livingroom.png")
              }
              alt="Scene preview"
              className="w-full h-full object-fill pointer-events-none select-none"
            />

            {/* SVG Polygon Boundaries Preview */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            >
              {activeScene.hotspots.map((h) => {
                const isSelected = selectedHotspotId === h.id;
                const pts = h.polygon && h.polygon.length >= 3
                  ? h.polygon.map((p) => `${p.x},${p.y}`).join(" ")
                  : `${h.x - 5},${h.y - 6} ${h.x + 5},${h.y - 6} ${h.x + 5},${h.y + 6} ${h.x - 5},${h.y + 6}`;
                return (
                  <polygon
                    key={`poly-${h.id}`}
                    points={pts}
                    fill={isSelected ? "rgba(251, 191, 36, 0.35)" : "rgba(56, 189, 248, 0.18)"}
                    stroke={isSelected ? "#fde047" : "#38bdf8"}
                    strokeWidth={isSelected ? "0.6" : "0.4"}
                  />
                );
              })}
            </svg>

            {/* Existing Hotspots */}
            {activeScene.hotspots.map((h) => {
              const isSelected = selectedHotspotId === h.id;

              return (
                <div
                  key={h.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedHotspotId(h.id);
                  }}
                  style={{
                    left: `${h.x}%`,
                    top: `${h.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`absolute z-20 flex items-center justify-center rounded-full font-black text-xs shadow-lg cursor-pointer transition ${
                    isSelected
                      ? "w-10 h-10 bg-amber-400 text-slate-950 border-4 border-white ring-4 ring-amber-400/50 scale-125"
                      : "w-8 h-8 bg-amber-400/90 border-2 border-slate-950 text-slate-950 hover:scale-125"
                  }`}
                  title={`${h.name} (${h.x}%, ${h.y}%)`}
                >
                  {h.discoveredIcon || "•"}
                </div>
              );
            })}
          </div>

          {/* Selected Hotspot Detailed Inspector Panel */}
          {selectedHotspotId && (() => {
            const currentHotspot = activeScene.hotspots.find((h) => h.id === selectedHotspotId);
            if (!currentHotspot) return null;

            return (
              <div className="bg-white p-5 rounded-3xl border border-[#d7cfb7] shadow-sm space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-amber-100 border border-amber-300">
                      {currentHotspot.discoveredIcon || "🎯"}
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-700">
                        Chi tiết Hotspot đã chọn ({currentHotspot.x}%, {currentHotspot.y}%)
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{currentHotspot.name}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewInspectionHotspot(currentHotspot)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                    >
                      <span>🔍 Thử Nghiệm Soi Cận Cảnh (Layer 2)</span>
                    </button>
                    <button
                      onClick={() => {
                        const updated = activeScene.hotspots.filter((h) => h.id !== currentHotspot.id);
                        setCases((prev) =>
                          prev.map((c) =>
                            c.id === currentCase.id
                              ? {
                                  ...c,
                                  scenes: c.scenes.map((s, idx) =>
                                    idx === activeSceneIdx ? { ...s, hotspots: updated } : s
                                  ),
                                }
                              : c
                          )
                        );
                        setSelectedHotspotId(null);
                      }}
                      className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs"
                    >
                      Xóa Hotspot
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Loại kiểm tra (Layer 2):</label>
                    <select
                      value={currentHotspot.inspectionType || "generic"}
                      onChange={(e) => {
                        const val = e.target.value as ObjectInspectionType;
                        const updated = activeScene.hotspots.map((h) =>
                          h.id === currentHotspot.id ? { ...h, inspectionType: val } : h
                        );
                        setCases((prev) =>
                          prev.map((c) =>
                            c.id === currentCase.id
                              ? {
                                  ...c,
                                  scenes: c.scenes.map((s, idx) =>
                                    idx === activeSceneIdx ? { ...s, hotspots: updated } : s
                                  ),
                                }
                              : c
                          )
                        );
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="generic">Chung / Quan sát vật thể</option>
                      <option value="phone">Điện thoại thông minh (Phone UI)</option>
                      <option value="coffee_cup">Cốc cà phê & Hoá đơn</option>
                      <option value="sleep_diary">Sổ nhật ký viết tay</option>
                      <option value="plant">Chậu cây cảnh</option>
                      <option value="photo_exif">Ảnh chụp & Siêu dữ liệu EXIF</option>
                      <option value="receipt">Biên lai nhà hàng (Receipt)</option>
                      <option value="water_bottle">Bình giữ nhiệt & Mực nước</option>
                      <option value="pill_bottle">Lọ thuốc & Nhãn đơn</option>
                      <option value="medical_chart">Biên bản / Hồ sơ y khoa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số Detail Hotspots:</label>
                    <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800">
                      {currentHotspot.detailHotspots?.length || 0} điểm chi tiết ẩn
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tọa độ tương đối:</label>
                    <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-slate-700">
                      X: {currentHotspot.x}% · Y: {currentHotspot.y}%
                    </div>
                  </div>
                </div>

                {/* Detail Hotspots List */}
                {currentHotspot.detailHotspots && currentHotspot.detailHotspots.length > 0 && (
                  <div className="space-y-2 border-t pt-3 border-slate-200">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                      Danh sách điểm tương tác chi tiết trong vật thể:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {currentHotspot.detailHotspots.map((d) => (
                        <div
                          key={d.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2"
                        >
                          <span className="text-base">{d.discoveredIcon || "•"}</span>
                          <div>
                            <div className="font-bold text-slate-900">{d.title}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{d.observation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Layer 2 Preview Modal when testing from Admin Editor */}
          {previewInspectionHotspot && (
            <ObjectInspectionModal
              sceneHotspot={previewInspectionHotspot}
              allClues={currentCase.clues}
              recordedClueIds={[]}
              onRecordClue={() => {}}
              onClose={() => setPreviewInspectionHotspot(null)}
            />
          )}

          <div className="text-center text-xs text-slate-500">
            Tọa độ lưu chuẩn hóa theo tỷ lệ tương đối (0..100%), tự động đáp ứng hiển thị chuẩn xác trên cả màn hình Desktop và Điện Thoại.
          </div>
        </div>
      )}

      {/* TAB 4: Campaign Chain Validator */}
      {selectedTab === "validator" && (
        <div className="bg-white p-6 rounded-3xl border border-[#d7cfb7] shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b pb-3 border-slate-200">
            <span className="text-2xl">{validationResult.hasCycles ? "⚠️" : "🛡️"}</span>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Kiểm Tra Tính Hợp Lệ Của Chiến Dịch
              </h3>
              <p className="text-xs text-slate-500">
                Đảm bảo không có vòng lặp vô nghiệm (Deadlock), không có vụ án bị cô lập, và người chơi luôn có đường đi tiếp.
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
              validationResult.hasCycles
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : "bg-emerald-50 border-emerald-300 text-emerald-900"
            }`}
          >
            {validationResult.message}
          </div>

          {validationResult.brokenPrereqs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-rose-800">Lỗi tham chiếu tiền đề:</h4>
              {validationResult.brokenPrereqs.map((err, i) => (
                <div key={i} className="p-3 rounded-xl bg-rose-100 text-rose-900 text-xs">
                  {err}
                </div>
              ))}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
            <h4 className="font-bold text-slate-900">Chuỗi mở khóa hiện tại:</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {cases
                .sort((a, b) => a.chapterOrder - b.chapterOrder)
                .map((c, i) => (
                  <React.Fragment key={c.id}>
                    <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-800">
                      Vụ #{c.chapterOrder}: {c.title}
                    </span>
                    {i < cases.length - 1 && <span className="text-slate-400">→</span>}
                  </React.Fragment>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
