"use client";

import { Button } from "@/components/ui/Button";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export function CookieNotice() {
  const [accepted, setAccepted, ready] = useLocalStorage(
    "aiflow-cookie-accepted",
    false
  );

  if (!ready || accepted) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#0A1020]/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-auto sm:mx-0">
      <p className="text-sm text-slate-300">
        Website sử dụng cookie cơ bản để cải thiện trải nghiệm và ghi nhớ lựa chọn
        của bạn (ví dụ: đóng popup demo).
      </p>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={() => setAccepted(true)}>
          Đồng ý
        </Button>
      </div>
    </div>
  );
}
