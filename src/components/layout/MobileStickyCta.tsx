"use client";

import { Button } from "@/components/ui/Button";
import { scrollToId } from "@/lib/utils";

export function MobileStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050816]/95 p-3 backdrop-blur-xl sm:hidden">
      <div className="flex gap-2">
        <Button
          fullWidth
          size="md"
          onClick={() => scrollToId("contact")}
        >
          Đặt lịch tư vấn
        </Button>
        <Button
          fullWidth
          size="md"
          variant="secondary"
          onClick={() => scrollToId("ai-livestream")}
        >
          Xem demo
        </Button>
      </div>
    </div>
  );
}
