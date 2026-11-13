"use client";

import { useEffect, useState } from "react";
import { loadHealthCluesProfileHistory, type CloudSession, type HealthCluesProfileRevision } from "@/lib/wellness-cloud";

export function HealthCluesProfileHistory({ session, locale }: { session: CloudSession; locale: "en" | "vi" }) {
  const vi = locale === "vi";
  const [revisions, setRevisions] = useState<HealthCluesProfileRevision[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    void loadHealthCluesProfileHistory(session).then(rows => {
      if (!active) return;
      setRevisions(rows);
      setStatus("ready");
    }).catch(() => {
      if (active) setStatus("error");
    });
    return () => { active = false; };
  }, [session]);

  return <section aria-labelledby="healthclues-profile-history" className="account-sync mt-5">
    <h2 id="healthclues-profile-history">{vi ? "Lịch sử hồ sơ HealthClues" : "HealthClues profile history"}</h2>
    <p>{vi ? "Các phiên bản cũ chỉ riêng bạn xem được và sẽ bị xóa khi bạn xóa hồ sơ." : "Previous saved versions are private to you and are erased when you delete your profile."}</p>
    {status === "loading" ? <p role="status" className="mt-3 text-sm">{vi ? "Đang tải lịch sử…" : "Loading saved versions…"}</p>
      : status === "error" ? <p role="alert" className="mt-3 text-sm">{vi ? "Không thể tải lịch sử hồ sơ." : "Profile history is temporarily unavailable."}</p>
      : revisions.length ? <ol className="mt-3 space-y-2">{revisions.map(revision => <li key={revision.version} className="rounded-xl border border-[#dce4d8] bg-white p-3 text-sm"><span className="font-bold">{vi ? `Phiên bản ${revision.version}` : `Version ${revision.version}`}</span><span className="ml-2">{typeof revision.profile.topic === "string" ? revision.profile.topic : (vi ? "Chủ đề wellness" : "Wellness topic")}</span><time className="mt-1 block text-xs text-[#657469]" dateTime={revision.changed_at}>{new Date(revision.changed_at).toLocaleString(vi ? "vi-VN" : "en", { dateStyle: "medium", timeStyle: "short" })}</time></li>)}</ol>
        : <p className="mt-3 text-sm text-[#657469]">{vi ? "Các thay đổi đã lưu sẽ xuất hiện tại đây." : "Saved changes will appear here."}</p>}
  </section>;
}
