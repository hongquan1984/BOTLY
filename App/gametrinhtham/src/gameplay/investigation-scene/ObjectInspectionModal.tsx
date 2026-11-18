"use client";

import React, { useMemo, useState } from "react";
import type { CaseClue, DetailHotspot, SceneHotspot } from "../../types";
import { detectiveAudio } from "../../audio/detectiveSoundEngine";

interface Props {
  sceneHotspot: SceneHotspot;
  allClues: CaseClue[];
  recordedClueIds: string[];
  onRecordClue: (clue: CaseClue) => void;
  onClose: () => void;
}

export function ObjectInspectionModal({
  sceneHotspot,
  allClues,
  recordedClueIds,
  onRecordClue,
  onClose,
}: Props) {
  const detailHotspots = sceneHotspot.detailHotspots || [];
  const [selectedDetail, setSelectedDetail] = useState<DetailHotspot | null>(null);
  const [justRecordedId, setJustRecordedId] = useState<string | null>(null);
  const [sealFlash, setSealFlash] = useState(false);

  const handleClose = () => {
    detectiveAudio.playPaperFlip();
    onClose();
  };

  const handleSelectDetail = (detail: DetailHotspot) => {
    detectiveAudio.playUiClick();
    setSelectedDetail(detail);
  };

  // Helper to convert detail into a recorded CaseClue
  const handleRecordDetail = (detail: DetailHotspot) => {
    // If detail points to an existing clue
    if (detail.associatedClueId) {
      const match = allClues.find((c) => c.id === detail.associatedClueId);
      if (match) {
        onRecordClue(match);
        setJustRecordedId(detail.id);
        setTimeout(() => setJustRecordedId(null), 2500);
        return;
      }
    }

    // Otherwise synthesize a CaseClue from the detail
    const newClue: CaseClue = {
      id: `clue-${detail.id}`,
      caseId: sceneHotspot.sceneId.replace("scene-", "case-"),
      sceneId: sceneHotspot.sceneId,
      title: detail.title,
      shortDescription: detail.subtitle || detail.observation.slice(0, 80),
      detailedObservation: detail.observation,
      icon: detail.discoveredIcon || "📝",
      source: {
        type:
          detail.category === "statement"
            ? "witness"
            : detail.category === "timestamp"
            ? "record"
            : detail.category === "medical_record"
            ? "test_result"
            : "item",
        location: sceneHotspot.name,
        timestamp: detail.evidenceData?.timestamp,
        verified: true,
        medicalRef: detail.evidenceData?.medicalRef,
      },
      isKeyClue: Boolean(detail.isCrucialEvidence),
    };

    onRecordClue(newClue);
    setJustRecordedId(detail.id);
    setSealFlash(true);
    setTimeout(() => setSealFlash(false), 520);
    setTimeout(() => setJustRecordedId(null), 2500);
  };

  const isDetailRecorded = (detail: DetailHotspot) => {
    if (detail.associatedClueId && recordedClueIds.includes(detail.associatedClueId)) {
      return true;
    }
    return recordedClueIds.includes(`clue-${detail.id}`);
  };

  const activeDetail = useMemo(() => {
    if (selectedDetail && detailHotspots.some((d) => d.id === selectedDetail.id)) {
      return selectedDetail;
    }
    const firstUnrecorded = detailHotspots.find((d) => !isDetailRecorded(d));
    return firstUnrecorded || detailHotspots[0] || null;
  }, [selectedDetail, detailHotspots, recordedClueIds]);

  const inspectionType = sceneHotspot.inspectionType || "generic";
  const hasUnrecordedPrimaryClue =
    Boolean(sceneHotspot.clueId) && !recordedClueIds.includes(sceneHotspot.clueId);
  const recordedCountHere = detailHotspots.filter((d) => isDetailRecorded(d)).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col bg-black/85 backdrop-blur-md p-2 sm:p-5 animate-in fade-in">
      <div
        className={`detective-obj-modal relative w-full max-w-4xl m-auto max-h-[calc(100dvh-16px)] sm:max-h-[94dvh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#1a1815] border-2 border-[#8c7657] shadow-2xl text-slate-100 overflow-hidden ${
          sealFlash ? "animate-seal-pop ring-2 ring-emerald-400/70" : ""
        }`}
      >
        {/* Compact Clean Header (Zero Dev Jargon) */}
        <div className="detective-obj-header flex items-center justify-between px-3.5 sm:px-5 py-2.5 bg-[#26221c] border-b border-[#3d362c] shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl p-1.5 rounded-xl bg-amber-950/60 border border-amber-700/50 shrink-0">
              {sceneHotspot.discoveredIcon || "🔍"}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  SOI CẬN CẢNH
                </span>
                <span className="text-[10px] bg-slate-800 text-amber-200 px-2 py-0.2 rounded-full font-mono whitespace-nowrap">
                  {recordedCountHere}/{detailHotspots.length} đã lưu
                </span>
              </div>
              <h3 className="text-xs sm:text-base font-black text-amber-100 truncate">
                {sceneHotspot.name}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition shrink-0"
            title="Đóng kiểm tra cận cảnh"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body (Visual Object + Detail Tabs & Observation) */}
        <div className="detective-obj-grid flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto min-h-0">
          {/* Left Column: Visual Object Scaled Cleanly on Mobile so Detail & Action fit viewport */}
          <div className="detective-obj-left md:col-span-7 bg-[#12110f] px-3 py-3 sm:p-5 flex flex-col items-center justify-center relative select-none border-b md:border-b-0 md:border-r border-[#3d362c] overflow-hidden">
            <div className="detective-obj-scale origin-center scale-[0.62] sm:scale-[0.82] md:scale-100 -my-10 sm:-my-4 md:my-0 flex items-center justify-center">
            {(() => {
              const renderPins = (pinTheme: "amber" | "emerald" = "amber") =>
                detailHotspots.map((d) => {
                  const isSelected = activeDetail?.id === d.id;
                  const isRecorded = isDetailRecorded(d);
                  return (
                    <button
                      key={d.id}
                      data-detail-id={d.id}
                      aria-label={d.title}
                      onClick={() => handleSelectDetail(d)}
                      style={{
                        left: `${d.x}%`,
                        top: `${d.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className={`absolute z-30 flex items-center justify-center rounded-full transition cursor-pointer ${
                        isSelected
                          ? pinTheme === "emerald"
                            ? "w-7 h-7 bg-emerald-400 text-slate-950 font-black shadow-lg ring-4 ring-emerald-300/60 scale-110"
                            : "w-7 h-7 bg-amber-400 text-slate-950 font-black shadow-lg ring-4 ring-amber-300/60 scale-110"
                          : isRecorded
                          ? "w-6 h-6 bg-emerald-700 text-white border-2 border-emerald-300 shadow-md"
                          : "w-6 h-6 bg-black/85 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border-2 border-amber-400 shadow-md animate-pulse"
                      }`}
                      title="Chạm để soi chi tiết"
                    >
                      <span className="text-[11px]">{isRecorded ? "✓" : d.discoveredIcon || "•"}</span>
                    </button>
                  );
                });

              return (
                <>
                  {inspectionType === "phone" && (
                    <div className="relative w-64 h-[420px] rounded-[40px] bg-slate-900 border-4 border-slate-700 shadow-2xl p-3 flex flex-col justify-between overflow-hidden ring-4 ring-black/40">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl z-20 flex items-center justify-center">
                        <div className="w-8 h-1 rounded-full bg-slate-700" />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 px-3 pt-3 pb-1 z-10">
                        <span className="font-bold">01:24</span>
                        <div className="flex items-center gap-1.5">
                          <span>5G</span>
                          <span>📶</span>
                          <span>🔋 72%</span>
                        </div>
                      </div>
                      <div className="my-auto text-center space-y-4 px-2 z-10">
                        <div className="text-4xl font-extralight tracking-tight text-white font-mono">
                          01:24
                        </div>
                        <p className="text-[11px] text-amber-200/80 font-medium">Rạng sáng · Đêm mưa</p>
                        <div className="space-y-2 text-left">
                          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-white">
                            <div className="flex justify-between text-[10px] text-amber-300 font-bold mb-0.5">
                              <span>📱 VideoStream</span>
                              <span>01:24</span>
                            </div>
                            <p className="text-[11px] text-slate-200">Hoạt động liên tục: 00:40 – 01:24</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-white">
                            <div className="flex justify-between text-[10px] text-teal-300 font-bold mb-0.5">
                              <span>💬 Chat Messenger</span>
                              <span>01:02</span>
                            </div>
                            <p className="text-[11px] text-slate-200">Đã xem và thả tim tin nhắn mới.</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-24 h-1 bg-white/50 rounded-full mx-auto mb-1" />
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "coffee_cup" && (
                    <div className="relative w-64 h-[380px] flex flex-col items-center justify-center">
                      <div className="relative w-48 h-64 rounded-b-3xl bg-gradient-to-b from-amber-950/70 via-[#3b2212] to-[#1d0f07] border-4 border-slate-200/70 shadow-2xl p-4 flex flex-col justify-between overflow-hidden">
                        <div className="w-full h-8 rounded-full bg-white/25 border border-white/40 shadow-inner flex items-center justify-center text-[11px] text-amber-100 font-bold">
                          🧊 Đá đã tan hoàn toàn
                        </div>
                        <div className="my-auto w-full bg-[#fbf6ea] border border-[#d6c4a5] p-2.5 rounded-lg text-slate-900 shadow font-mono text-[11px] space-y-1">
                          <div className="text-center font-bold text-amber-950 border-b border-dashed border-slate-300 pb-1">
                            ☕ SLEEPHAVEN MART
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span>Cold Brew Cỡ Vừa</span>
                            <span className="font-bold">07:00 AM</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-600">
                            <span>Cà phê đen đá</span>
                            <span>Hôm qua</span>
                          </div>
                        </div>
                        <div className="text-center text-[10px] text-amber-100 font-bold bg-black/40 rounded-lg py-1">
                          Mực cà phê còn ~2/3 ly (uống &lt; 1/2)
                        </div>
                      </div>
                      <div className="w-48 h-4 rounded-full bg-black/40 blur-sm mt-2" />
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "sleep_diary" && (
                    <div className="relative w-full max-w-md h-[380px] bg-[#fbf8ee] rounded-2xl border-4 border-[#7a5933] shadow-2xl p-4 sm:p-5 text-slate-900 font-serif overflow-hidden flex flex-col justify-between">
                      <div className="border-b-2 border-[#d9ccb2] pb-2 flex justify-between items-center text-xs text-[#735838] font-sans">
                        <span className="font-bold">📖 NIGHT NOTES — SỔ TAY CỦA AN</span>
                        <span>Trang đôi</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 my-auto text-[11px] sm:text-xs leading-relaxed text-[#2c2013]">
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-[#d9ccb2] space-y-1.5">
                          <div className="font-bold text-amber-900 border-b border-dashed border-amber-300 pb-1">
                            Night Notes:
                          </div>
                          <p className="italic">
                            "01:15 AM: Noise outside? Must sleep. Mình đã tắt điện thoại từ 22:00 rồi mà mắt vẫn tỉnh..."
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-[#d9ccb2] space-y-1 font-sans text-[11px]">
                          <div className="font-bold text-slate-800 border-b border-dashed border-slate-300 pb-1">
                            Lịch giờ ngủ tuần qua:
                          </div>
                          <div>• Thứ 2: 22:00</div>
                          <div>• Thứ 3: 02:15</div>
                          <div>• Thứ 4: 23:30</div>
                          <div>• Thứ 5: 01:45</div>
                        </div>
                      </div>
                      <div className="border-t border-[#d9ccb2] pt-2 flex justify-between text-[11px] text-[#735838] font-sans">
                        <span>Mực viết tay còn mới</span>
                        <span>🖋️ Bút máy đen</span>
                      </div>
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "plant" && (
                    <div className="relative w-64 h-[380px] flex flex-col items-center justify-center">
                      <div className="relative w-56 h-72 rounded-2xl bg-gradient-to-b from-[#2b241d] to-[#17120d] border-4 border-[#524433] shadow-2xl p-4 flex flex-col justify-end items-center overflow-hidden">
                        <div className="absolute top-3 right-3 text-2xl">🪔</div>
                        <div className="text-6xl mb-1 filter drop-shadow">🌿</div>
                        <div className="w-36 h-24 rounded-b-2xl bg-[#a0522d] border-2 border-[#5c2e17] shadow-inner p-2 flex flex-col items-center justify-between text-white">
                          <div className="w-full bg-[#fbf6ea] text-slate-900 text-[10px] font-mono px-1.5 py-0.5 rounded text-center font-bold">
                            Tưới lúc 18:00
                          </div>
                          <div className="text-[9px] text-amber-100 font-sans">Cỡ nhỏ (~15cm)</div>
                        </div>
                      </div>
                      {renderPins("emerald")}
                    </div>
                  )}

                  {inspectionType === "laptop" && (
                    <div className="relative w-full max-w-md h-[380px] rounded-2xl bg-gradient-to-b from-[#2c2519] to-[#18140e] border-4 border-[#63513a] shadow-2xl p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[11px] text-amber-200 font-bold">
                        <span>💡 Đèn bàn học: BẬT SÁNG</span>
                        <span className="font-mono text-slate-300">23:35 PM</span>
                      </div>
                      <div className="rounded-xl bg-slate-900 border-2 border-slate-700 p-3.5 text-left space-y-2 shadow-inner">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-1.5 text-[10px] text-slate-400 font-mono">
                          <span>📧 Mail Client · Hộp thư đi</span>
                          <span className="text-emerald-400 font-bold">Sent ✓</span>
                        </div>
                        <div className="text-xs font-bold text-amber-200">
                          Re: Báo cáo tài chính Quý — Gửi lúc 23:35 đêm qua
                        </div>
                        <p className="text-[11px] text-slate-300">
                          File đính kèm: Q4_Report_Final.xlsx vừa được chỉnh sửa lần cuối lúc 23:34.
                        </p>
                      </div>
                      <div className="self-end bg-amber-200 text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow rotate-1">
                        🗒️ 8:00 AM họp duyệt báo cáo
                      </div>
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "window" && (
                    <div className="relative w-full max-w-md h-[380px] rounded-2xl bg-gradient-to-b from-[#17253a] via-[#121e31] to-[#0b111c] border-4 border-[#475569] shadow-2xl p-4 flex flex-col justify-between overflow-hidden">
                      <div className="flex justify-between text-[11px] text-sky-200 font-bold z-10">
                        <span>🪟 Rèm vải: VÉN MỞ HAI BÊN</span>
                        <span className="font-mono text-amber-300">~25 lux</span>
                      </div>
                      <div className="my-auto flex items-center justify-center relative z-10">
                        <div className="w-40 h-44 rounded-xl border-2 border-slate-500/70 bg-sky-900/20 flex flex-col items-center justify-center p-3 text-center space-y-2">
                          <div className="text-4xl">🌙💡</div>
                          <p className="text-[11px] text-sky-100 leading-relaxed">
                            Đèn cao áp ngoài phố và đèn phòng rọi trực tiếp về phía giường ngủ.
                          </p>
                        </div>
                      </div>
                      <div className="text-center text-[10px] text-slate-300 bg-black/40 rounded-lg py-1 z-10">
                        Cả 2 dải rèm buộc gọn sang hai bên khung cửa
                      </div>
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "photo_exif" && (
                    <div className="relative w-68 h-[380px] rounded-[34px] bg-slate-900 border-4 border-slate-700 shadow-2xl p-3 flex flex-col justify-between overflow-hidden">
                      <div className="text-[10px] font-mono text-slate-400 flex justify-between px-2 pt-1">
                        <span>📸 Story Gallery</span>
                        <span>IMG_8841.JPG</span>
                      </div>
                      <div className="my-2 rounded-2xl bg-gradient-to-br from-amber-900/60 to-stone-900 border border-amber-700/50 p-4 text-center space-y-1.5">
                        <div className="text-5xl">🥩</div>
                        <div className="text-xs font-bold text-amber-200">Đĩa Bò Bít Tết Tiêu Đen</div>
                        <div className="text-[10px] text-slate-300">Đăng story hôm qua lúc 20:00</div>
                      </div>
                      <div className="rounded-xl bg-black/70 border border-slate-700 p-2.5 text-[10px] font-mono text-emerald-300 space-y-1">
                        <div className="text-slate-400 uppercase font-bold">EXIF METADATA:</div>
                        <div>• Date Taken: 19/10/2026 19:30</div>
                        <div>• Camera: Phone 12MP f/1.8</div>
                      </div>
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "receipt" && (
                    <div className="relative w-72 h-[380px] bg-[#faf7ef] text-slate-900 rounded-xl border-2 border-[#d4cab2] shadow-2xl p-4 font-mono flex flex-col justify-between">
                      <div className="text-center border-b-2 border-dashed border-slate-400 pb-2">
                        <div className="text-[10px] text-slate-500">RESTAURANT</div>
                        <div className="text-sm font-black tracking-wide">SEAFOOD & BEER</div>
                        <div className="text-[10px] text-slate-600 mt-0.5">Time: Tối qua · 21:15</div>
                      </div>
                      <div className="space-y-2 text-xs my-auto">
                        <div className="flex justify-between"><span>1. Cod Tacos & Hải sản</span><span>✓</span></div>
                        <div className="flex justify-between font-bold text-amber-900"><span>2. 4x Draft Beer (Bia tươi)</span><span>✓</span></div>
                        <div className="flex justify-between"><span>3. Crab Cakes / Lẩu ghẹ</span><span>✓</span></div>
                      </div>
                      <div className="border-t-2 border-dashed border-slate-400 pt-2 text-[10px] text-slate-600 flex justify-between">
                        <span>THANH TOÁN HOÀN TẤT</span>
                        <span>21:15 PM</span>
                      </div>
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "water_bottle" && (
                    <div className="relative w-64 h-[380px] flex flex-col items-center justify-center">
                      <div className="w-16 h-8 rounded-t-xl bg-slate-300 border-2 border-slate-500 shadow" />
                      <div className="relative w-32 h-64 rounded-b-3xl rounded-t-xl bg-gradient-to-b from-sky-700 to-sky-950 border-4 border-sky-400/50 shadow-2xl p-3 flex flex-col justify-between items-center text-white overflow-hidden">
                        <div className="text-xs font-mono font-black tracking-widest text-sky-200 mt-2">
                          500ml
                        </div>
                        <div className="w-full h-36 rounded-xl bg-sky-400/25 border border-sky-300/50 flex flex-col justify-end overflow-hidden">
                          <div className="w-full h-[80%] bg-sky-400/70 flex items-center justify-center text-[11px] font-bold text-slate-950 text-center px-1">
                            Còn ~400ml nước
                          </div>
                        </div>
                        <div className="text-[10px] text-sky-200 font-bold">Mới uống &lt;400ml</div>
                      </div>
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "pill_bottle" && (
                    <div className="relative w-64 h-[380px] flex flex-col items-center justify-center">
                      <div className="w-40 h-10 rounded-t-lg bg-slate-100 border-2 border-slate-400 shadow flex items-center justify-center text-[10px] text-slate-500 font-bold">
                        NẮP VẶN AN TOÀN
                      </div>
                      <div className="w-36 h-60 rounded-b-2xl bg-gradient-to-b from-amber-500 to-orange-700 border-4 border-orange-900/40 shadow-2xl p-3 flex flex-col justify-between">
                        <div className="w-full bg-white rounded-lg p-2.5 text-slate-900 shadow font-sans space-y-1">
                          <div className="text-xs font-black text-slate-950">ALLOPURINOL</div>
                          <div className="text-[11px] font-bold text-amber-800">300mg · Take 1 daily</div>
                          <div className="text-[10px] text-slate-600 border-t border-slate-200 pt-1">
                            Ngưng uống: 14 ngày nay
                          </div>
                        </div>
                        <div className="text-center text-[11px] font-bold text-amber-100 bg-black/30 rounded-lg py-1">
                          💊 Lọ vẫn còn nhiều viên
                        </div>
                      </div>
                      {renderPins("amber")}
                    </div>
                  )}

                  {inspectionType === "medical_chart" && (
                    <div className="relative w-72 h-[380px] bg-white text-slate-900 rounded-xl border-2 border-slate-300 shadow-2xl p-4 font-sans flex flex-col justify-between">
                      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2">
                        <div>
                          <div className="text-sm font-black tracking-tight">LAB RESULTS</div>
                          <div className="text-[10px] text-slate-500">Patient: Minh (34y)</div>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-700">23 Oct</div>
                      </div>
                      <div className="space-y-2.5 my-auto text-xs">
                        <div className="p-2.5 rounded-xl bg-rose-50 border-2 border-rose-500 flex justify-between items-center">
                          <div>
                            <div className="font-black text-rose-900">Uric Acid</div>
                            <div className="text-[10px] text-rose-700">Ref: &lt; 7.0 mg/dL</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-rose-700">9.8 mg/dL</div>
                            <div className="text-[10px] font-mono text-rose-600">(~583 µmol/L)</div>
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 px-1 border-b pb-1">
                          <span>Creatinine</span><span>0.9 mg/dL</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 px-1">
                          <span>Glucose</span><span>92 mg/dL</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 text-right font-mono">Signed: Clinic Lab</div>
                      {renderPins("amber")}
                    </div>
                  )}

                  {(inspectionType === "generic" || inspectionType === "interactive_card") && (() => {
                    const themeMap = {
                      clipboard: { bg: "from-[#f7edd2] to-[#e7d6ac]", border: "border-[#9c733d]", text: "text-[#2c1c0f]", sub: "text-[#6b4822]", pillBg: "bg-white/85 border-[#cbb382] text-[#3a2511]" },
                      screen: { bg: "from-[#0f172a] to-[#080d18]", border: "border-sky-500/60", text: "text-sky-100", sub: "text-sky-300/80", pillBg: "bg-slate-900/90 border-sky-400/35 text-sky-100" },
                      beverage: { bg: "from-[#2e1e12] to-[#1a1009]", border: "border-amber-500/60", text: "text-amber-100", sub: "text-amber-300/80", pillBg: "bg-black/45 border-amber-400/35 text-amber-100" },
                      food_box: { bg: "from-[#3a1d14] to-[#210f0a]", border: "border-orange-500/60", text: "text-orange-100", sub: "text-orange-200/80", pillBg: "bg-black/45 border-orange-400/35 text-orange-100" },
                      pill: { bg: "from-[#fffdf5] to-[#f4ebd4]", border: "border-emerald-700/50", text: "text-slate-900", sub: "text-emerald-800", pillBg: "bg-white border-emerald-600/30 text-slate-800" },
                      device: { bg: "from-[#13222a] to-[#0b1318]", border: "border-emerald-400/60", text: "text-emerald-100", sub: "text-emerald-300/80", pillBg: "bg-black/55 border-emerald-400/35 text-emerald-100" },
                      plant: { bg: "from-[#1e2c21] to-[#111a13]", border: "border-emerald-600/50", text: "text-emerald-100", sub: "text-emerald-300/80", pillBg: "bg-black/45 border-emerald-500/35 text-emerald-100" },
                      bed: { bg: "from-[#182238] to-[#0e1524]", border: "border-indigo-400/55", text: "text-indigo-100", sub: "text-indigo-300/80", pillBg: "bg-slate-900/85 border-indigo-400/35 text-indigo-100" },
                      fitness: { bg: "from-[#1f1b2e] to-[#120f1c]", border: "border-violet-400/60", text: "text-violet-100", sub: "text-violet-300/80", pillBg: "bg-black/50 border-violet-400/35 text-violet-100" },
                    };
                    const theme = themeMap[sceneHotspot.inspectionTheme || "device"];
                    return (
                      <div className={`relative w-full max-w-md h-[380px] rounded-2xl bg-gradient-to-b ${theme.bg} border-4 ${theme.border} p-4 sm:p-5 flex flex-col justify-between shadow-2xl overflow-hidden`}>
                        <div className="flex items-start justify-between gap-2 border-b border-current/15 pb-2.5 z-10">
                          <div className="min-w-0">
                            <span className={`text-[10px] font-black uppercase tracking-wider block ${theme.sub}`}>
                              {sceneHotspot.inspectionSubtitle || "HỒ SƠ VẬT CHỨNG CẬN CẢNH"}
                            </span>
                            <h4 className={`text-sm sm:text-base font-black truncate ${theme.text}`}>
                              {sceneHotspot.inspectionTitle || sceneHotspot.name}
                            </h4>
                          </div>
                          <span className="text-2xl shrink-0">{sceneHotspot.discoveredIcon || "🔍"}</span>
                        </div>

                        <div className="my-auto flex flex-col items-center justify-center text-center gap-2.5 z-10 px-2">
                          <div className={`w-16 h-16 rounded-2xl border ${theme.pillBg} flex items-center justify-center text-4xl shadow-md`}>
                            {activeDetail?.discoveredIcon || sceneHotspot.discoveredIcon || "🔍"}
                          </div>
                          <p className={`text-[11px] font-semibold max-w-xs leading-snug ${theme.text}`}>
                            {sceneHotspot.inspectMessage}
                          </p>
                          <div className="grid grid-cols-1 gap-1.5 w-full max-w-xs text-left">
                            {detailHotspots.slice(0, 3).map((d) => (
                              <div
                                key={`preview-${d.id}`}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center justify-between gap-2 ${theme.pillBg}`}
                              >
                                <span className="truncate">{d.discoveredIcon || "•"} {d.title}</span>
                                {d.evidenceData?.timestamp && (
                                  <span className="font-mono opacity-80 shrink-0">{d.evidenceData.timestamp}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={`text-[10px] font-mono opacity-75 text-center border-t border-current/15 pt-1.5 z-10 ${theme.text}`}>
                          {sceneHotspot.description}
                        </div>
                        {renderPins("amber")}
                      </div>
                    );
                  })()}
                </>
              );
            })()}
            </div>

            <p className="detective-obj-tip text-[10px] sm:text-[11px] text-slate-400 mt-1 text-center">
              👉 Chạm vào từng chấm tròn trên vật thể để kiểm tra.
            </p>
          </div>

          {/* Right Column: Detail Selector & Objective Observation */}
          <div className="detective-obj-right md:col-span-5 bg-[#1f1b16] p-3.5 sm:p-5 flex flex-col justify-between space-y-3">
            <div>
              {/* Neutral Detail Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#383127] mb-2.5">
                {detailHotspots.map((d, idx) => {
                  const isSelected = activeDetail?.id === d.id;
                  const isRecorded = isDetailRecorded(d);

                  return (
                    <button
                      key={d.id}
                      data-detail-tab-id={d.id}
                      onClick={() => handleSelectDetail(d)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 font-black shadow"
                          : isRecorded
                          ? "bg-emerald-950/70 border border-emerald-600/60 text-emerald-200"
                          : "bg-[#2b251f] text-slate-300 hover:bg-[#383028]"
                      }`}
                    >
                      <span>{isRecorded ? "✓" : `Điểm #${idx + 1}`}</span>
                      {(isSelected || isRecorded) && (
                        <span className="truncate max-w-28">{d.title}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Detail Display */}
              {activeDetail ? (
                <div className="space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-lg p-1.5 rounded-xl bg-amber-950/80 border border-amber-700/60 shrink-0">
                      {activeDetail.discoveredIcon || "🔍"}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-amber-400 block">
                        {activeDetail.category === "timestamp"
                          ? "⏱️ DẤU THỜI GIAN"
                          : activeDetail.category === "statement"
                          ? "💬 LỜI KHAI ĐỐI CHỨNG"
                          : activeDetail.category === "medical_record"
                          ? "🔬 DỮ LIỆU CHỈ SỐ"
                          : "📋 QUAN SÁT THỰC ĐỊA"}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-amber-100 leading-tight">
                        {activeDetail.title}
                      </h4>
                    </div>
                  </div>

                  {activeDetail.evidenceData?.timestamp && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-700/60">
                      <span>⏱️</span>
                      <span className="font-mono text-white">
                        {activeDetail.evidenceData.timestamp}
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-[#14120f] border border-[#3b3429] text-xs text-slate-200 leading-relaxed shadow-inner">
                    <p>{activeDetail.observation}</p>
                  </div>

                  {activeDetail.evidenceData?.medicalRef && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-[11px] text-emerald-200 leading-relaxed">
                      <span className="font-bold text-emerald-300 block mb-0.5">
                        Cơ sở khoa học liên đới:
                      </span>
                      <p>{activeDetail.evidenceData.medicalRef.summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-5 px-3 rounded-xl bg-[#14120f] border border-dashed border-[#494033] text-center space-y-1.5">
                  <div className="text-2xl">🔎</div>
                  <p className="text-xs font-bold text-amber-200">
                    Chưa chọn chi tiết nào
                  </p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Chạm vào chấm đánh dấu trên hình hoặc bấm Điểm #1, #2... để xem thông tin trước khi lưu.
                  </p>
                </div>
              )}

              {/* Subtle Reminder if only secondary detail recorded while primary evidence still unrecorded */}
              {recordedCountHere > 0 && hasUnrecordedPrimaryClue && (
                <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/35 text-[11px] text-amber-200 font-semibold">
                  💡 Vẫn còn chi tiết khác đáng lưu trên vật thể này — hãy kiểm tra hết các Điểm!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Always-Visible Sticky Footer Action Bar (Save Button NEVER Pushed Off-Screen on Mobile) */}
        <div className="detective-obj-footer px-3.5 sm:px-5 py-2.5 bg-[#26221c] border-t border-[#3d362c] shrink-0 space-y-1.5">
          {justRecordedId && (
            <p className="text-[11px] text-emerald-400 text-center font-bold animate-in fade-in">
              ✨ Đã lưu vào Sổ Vật Chứng & mở mục Y khoa tương ứng!
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            {activeDetail ? (
              isDetailRecorded(activeDetail) ? (
                <div
                  data-testid="object-save-action"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-900/70 border border-emerald-500 text-emerald-200 font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>✓ ĐÃ LƯU VÀO SỔ</span>
                </div>
              ) : (
                <button
                  data-testid="object-save-action"
                  onClick={() => handleRecordDetail(activeDetail)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>+ GHI NHẬN VÀO SỔ MANH MỐI</span>
                </button>
              )
            ) : (
              <span className="text-[11px] text-slate-400 truncate">
                Chọn 1 điểm để ghi nhận dữ kiện
              </span>
            )}

            <button
              onClick={handleClose}
              className="px-3.5 py-2.5 rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-bold text-xs transition whitespace-nowrap shrink-0"
            >
              Quay lại ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
