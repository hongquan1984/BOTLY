"use client";

import React from "react";

interface Props {
  title?: string;
  revelationText: string;
  onProceed: () => void;
}

export function CaseRevelationModal({
  title = "PHÁT HIỆN ĐIỂM MÂU THUẪN ĐẢO CHIỀU!",
  revelationText,
  onProceed,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg m-auto rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-400 p-5 sm:p-7 text-white shadow-2xl text-center space-y-4">
        {/* Glowing Badge */}
        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-4xl shadow-inner animate-bounce">
          ⚡
        </div>

        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
            BƯỚC NGOẶT ĐIỀU TRA (REVELATION)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-amber-200 mt-1">
            {title}
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs sm:text-sm text-amber-100 leading-relaxed font-medium text-left">
          {revelationText}
        </div>

        <p className="text-xs text-slate-400 italic">
          Bằng chứng mâu thuẫn đã bóc trần giả định sai lầm ban đầu. Bây giờ bạn đã có thể đưa ra kết luận khoa học chính xác!
        </p>

        <div className="pt-2">
          <button
            onClick={onProceed}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <span>XEM KẾT LUẬN & KIẾN THỨC Y KHOA</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
