import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Database,
  UserCheck,
  Bell,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Scale,
  Server,
  Phone,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Chính Sách & Quyền Riêng Tư | Botly",
  description:
    "Chính sách bảo mật và quyền riêng tư của Botly (botly.vn). Cam kết bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP và tiêu chuẩn bảo mật quốc tế.",
  alternates: {
    canonical: "https://www.botly.vn/chinh-sach-quyen-rieng-tu",
  },
  openGraph: {
    title: "Chính Sách & Quyền Riêng Tư | Botly",
    description:
      "Botly cam kết bảo vệ dữ liệu cá nhân theo chuẩn Nghị định 13/2023/NĐ-CP và các tiêu chuẩn bảo mật quốc tế hàng đầu.",
    url: "https://www.botly.vn/chinh-sach-quyen-rieng-tu",
    siteName: "Botly",
    locale: "vi_VN",
    type: "article",
  },
};

const SECTIONS = [
  { id: "pham-vi", title: "1. Phạm vi áp dụng & Giới thiệu" },
  { id: "thu-thap", title: "2. Dữ liệu cá nhân chúng tôi thu thập" },
  { id: "muc-dich", title: "3. Mục đích xử lý & Sử dụng dữ liệu" },
  { id: "chia-se", title: "4. Cam kết không bán & Chia sẻ dữ liệu" },
  { id: "an-toan", title: "5. Cơ chế lưu trữ & An toàn thông tin" },
  { id: "cookie", title: "6. Cookie & Công nghệ theo dõi" },
  { id: "quyen-nguoi-dung", title: "7. Quyền của chủ thể dữ liệu (NĐ 13/2023/NĐ-CP)" },
  { id: "tre-em", title: "8. Bảo vệ dữ liệu trẻ em" },
  { id: "cap-nhat", title: "9. Sửa đổi & Hiệu lực chính sách" },
  { id: "lien-he", title: "10. Thông tin liên hệ & Tiếp nhận yêu cầu" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 antialiased selection:bg-teal-500/25 selection:text-teal-200">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-teal-500/10 via-cyan-500/5 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-60 h-[450px] w-[600px] rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030712]/80 backdrop-blur-xl">
        <Container className="flex h-16 sm:h-20 items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 text-slate-300 hover:text-white transition"
          >
            <div className="relative h-9 w-28 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-1 transition group-hover:border-teal-500/40">
              <Image
                src="/logo.png"
                alt="Botly.vn Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
              / Chính sách quyền riêng tư
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Về trang chủ</span>
          </Link>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-10 sm:pt-16 sm:pb-14 border-b border-white/5">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-300 mb-5">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>Bảo vệ dữ liệu & Quyền riêng tư</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Chính Sách & Quyền Riêng Tư
            </h1>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-300">
              Botly (<span className="text-teal-300 font-medium">botly.vn</span>) cam kết bảo vệ tuyệt đối sự riêng tư, bảo mật thông tin cá nhân và minh bạch trong mọi hoạt động xử lý dữ liệu theo <strong className="text-white">Nghị định số 13/2023/NĐ-CP</strong> của Chính phủ Việt Nam và các tiêu chuẩn bảo mật quốc tế.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 border-t border-white/10 pt-4">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-teal-400" />
                <span>Hiệu lực từ: <strong>14/10/2026</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-cyan-400" />
                <span>Quy chuẩn: <strong>NĐ 13/2023/NĐ-CP & ISO/IEC 27001</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span>Mã hóa đầu cuối: <strong>TLS 1.3 / AES-256</strong></span>
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content Layout */}
      <main className="py-12 sm:py-16">
        <Container>
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
            {/* Quick Navigation Sticky Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Mục lục chính sách</span>
                </p>
                <nav className="space-y-1 text-xs">
                  {SECTIONS.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block rounded-lg px-2.5 py-1.5 text-slate-400 hover:bg-white/5 hover:text-teal-300 transition"
                    >
                      {sec.title}
                    </a>
                  ))}
                </nav>
                <div className="pt-3 border-t border-white/10 text-[11px] text-slate-500 leading-relaxed">
                  Cần hỗ trợ quyền dữ liệu? Email:{" "}
                  <a href="mailto:lienhe@botly.vn" className="text-teal-400 underline">
                    lienhe@botly.vn
                  </a>
                </div>
              </div>
            </aside>

            {/* Detailed Policy Text */}
            <article className="space-y-12 text-sm leading-relaxed text-slate-300">
              {/* Section 1 */}
              <section id="pham-vi" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">1</span>
                  Phạm vi áp dụng & Giới thiệu
                </h2>
                <p>
                  Chính sách này áp dụng cho toàn bộ các cá nhân và tổ chức truy cập, đăng ký và sử dụng các sản phẩm, giải pháp công nghệ do <strong>Botly Vietnam</strong> phát triển và vận hành thông qua tên miền chính thức <code>botly.vn</code> (bao gồm nền tảng tự động hóa AI, ứng dụng web sức khỏe & giấc ngủ <em>Mindful Haven / Night Companion</em>, và các dịch vụ AI cho doanh nghiệp).
                </p>
                <p>
                  Bằng việc truy cập, tương tác hoặc cung cấp dữ liệu cho Botly, bạn xác nhận đã đọc, hiểu và đồng ý với các nguyên tắc xử lý dữ liệu được nêu trong văn bản này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng dừng sử dụng dịch vụ hoặc liên hệ với chúng tôi để được giải đáp cụ thể.
                </p>
              </section>

              {/* Section 2 */}
              <section id="thu-thap" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">2</span>
                  Dữ liệu cá nhân chúng tôi thu thập
                </h2>
                <p>
                  Botly tuân thủ nguyên tắc <em>Tối thiểu hóa dữ liệu (Data Minimization)</em> — chỉ thu thập những dữ liệu thực sự cần thiết để vận hành và cá nhân hóa trải nghiệm của bạn:
                </p>
                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                      <UserCheck className="h-4 w-4 text-teal-400" />
                      <span>Thông tin bạn chủ động cung cấp</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-400 list-disc list-inside">
                      <li>Họ tên, địa chỉ email, số điện thoại liên hệ khi đăng ký tư vấn.</li>
                      <li>Phản hồi bài trắc nghiệm khảo sát giấc ngủ, nhịp sinh học ban đêm, mục tiêu thư giãn (dữ liệu phục vụ phân tích cá nhân hóa phác đồ ngủ).</li>
                      <li>Nội dung đóng góp ý kiến, phản hồi âm thanh hoặc thông tin gửi qua biểu mẫu hỗ trợ.</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                      <Server className="h-4 w-4 text-cyan-400" />
                      <span>Dữ liệu kỹ thuật & Tự động thu thập</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-slate-400 list-disc list-inside">
                      <li>Địa chỉ IP, loại trình duyệt, hệ điều hành và định danh thiết bị.</li>
                      <li>Thời gian lắng nghe âm thanh, tiến trình hoàn thành các tầng sóng não (432Hz, Delta, Sleep Cocoon).</li>
                      <li>Trang đã xem, thời lượng phiên truy cập thông qua Cookie ẩn danh hóa.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="muc-dich" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">3</span>
                  Mục đích xử lý & Sử dụng dữ liệu
                </h2>
                <p>Dữ liệu thu thập được sử dụng duy nhất cho các mục đích hợp pháp sau đây:</p>
                <div className="space-y-2.5">
                  {[
                    "Cá nhân hóa phác đồ âm thanh ru ngủ: Đề xuất nhịp thở (5-5, 4-7-8), tần số 432Hz và giọng hướng dẫn phù hợp với tình trạng trằn trọc/căng thẳng của bạn.",
                    "Cung cấp và duy trì dịch vụ: Triển khai các giải pháp AI Automation, AI Livestream và chăm sóc khách hàng doanh nghiệp.",
                    "Đo lường & Cải thiện hiệu năng: Đánh giá tỷ lệ hoàn thành lộ trình nghe, phát hiện lỗi kỹ thuật âm thanh để tối ưu trải nghiệm người dùng.",
                    "Hỗ trợ kỹ thuật & Giao tiếp: Gửi email xác nhận, lời nhắc nghe đêm (khi bạn cho phép) và giải đáp thắc mắc dịch vụ.",
                    "Bảo vệ an toàn nền tảng: Phát hiện và ngăn chặn hành vi gian lận, tấn công mạng hoặc sử dụng trái phép tài nguyên hệ thống.",
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4 */}
              <section id="chia-se" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">4</span>
                  Cam kết không bán & Chia sẻ dữ liệu
                </h2>
                <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-4.5 text-xs sm:text-sm space-y-3">
                  <p className="font-semibold text-teal-200">
                    🔒 Cam kết nguyên tắc cốt lõi của Botly:
                  </p>
                  <p className="text-slate-300">
                    Chúng tôi <strong className="text-white">tuyệt đối KHÔNG bán, cho thuê, thương mại hóa hoặc trao đổi dữ liệu cá nhân</strong> của bạn cho bất kỳ đơn vị quảng cáo hay bên thứ ba nào vì mục đích sinh lợi độc lập.
                  </p>
                  <p className="text-slate-400">
                    Dữ liệu chỉ có thể được chia sẻ trong phạm vi giới hạn nghiêm ngặt với các đối tác hạ tầng đám mây uy tín toàn cầu (như Vercel, Supabase Cloud - máy chủ tuân thủ tiêu chuẩn SOC 2 Type II và GDPR) phục vụ vận hành cơ sở dữ liệu, hoặc khi có yêu cầu bắt buộc bằng văn bản từ cơ quan thực thi pháp luật có thẩm quyền của Nhà nước Việt Nam.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="an-toan" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">5</span>
                  Cơ chế lưu trữ & An toàn thông tin
                </h2>
                <p>
                  Botly áp dụng các biện pháp an ninh kỹ thuật và quy trình quản trị hiện đại bậc nhất để ngăn ngừa việc truy cập trái phép, rò rỉ, mất mát hoặc can thiệp dữ liệu:
                </p>
                <ul className="grid gap-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                  <li><strong>Mã hóa đường truyền:</strong> Toàn bộ kết nối giữa trình duyệt của bạn và hệ thống máy chủ Botly được mã hóa bắt buộc qua giao thức <code>HTTPS/TLS 1.3</code>.</li>
                  <li><strong>Mã hóa cơ sở dữ liệu:</strong> Dữ liệu nhạy cảm được mã hóa ở trạng thái nghỉ (Encryption at Rest) bằng thuật toán chuẩn công nghiệp <code>AES-256</code>.</li>
                  <li><strong>Kiểm soát phân quyền (RBAC):</strong> Chỉ các kỹ sư được chỉ định với cơ chế xác thực đa yếu tố (2FA) mới được cấp quyền truy cập hạ tầng cơ sở dữ liệu để phục vụ bảo trì.</li>
                  <li><strong>Thời gian lưu trữ:</strong> Dữ liệu được bảo lưu trong suốt thời gian bạn sử dụng dịch vụ hoặc cho đến khi bạn gửi yêu cầu xóa tài khoản/dữ liệu theo quy định.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section id="cookie" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">6</span>
                  Cookie & Công nghệ theo dõi
                </h2>
                <p>
                  Chúng tôi sử dụng cookie và công nghệ lưu trữ cục bộ (Local Storage) để:
                </p>
                <div className="grid gap-2 text-xs sm:text-sm text-slate-400">
                  <p>• <strong>Cookie thiết yếu:</strong> Duy trì phiên đăng nhập, ghi nhớ trạng thái âm thanh đang nghe (âm lượng, lựa chọn giọng nói <em>Female Whisper / Male Calm</em>) và không yêu cầu bạn phải cấu hình lại mỗi lần vào trang.</p>
                  <p>• <strong>Cookie phân tích ẩn danh:</strong> Thống kê lưu lượng truy cập và đo lường tỷ lệ rớt ở các bước khảo sát để cải thiện giao diện mà không định danh cá nhân cụ thể.</p>
                </div>
                <p className="text-xs text-slate-400">
                  Bạn có toàn quyền tắt hoặc xóa cookie trong phần cài đặt trình duyệt của mình bất kỳ lúc nào. Tuy nhiên, việc tắt cookie thiết yếu có thể làm giảm trải nghiệm cá nhân hóa của một số tính năng âm thanh.
                </p>
              </section>

              {/* Section 7 */}
              <section id="quyen-nguoi-dung" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">7</span>
                  Quyền của chủ thể dữ liệu (Theo NĐ 13/2023/NĐ-CP)
                </h2>
                <p>
                  Theo quy định pháp luật Việt Nam, bạn sở hữu đầy đủ các quyền hợp pháp đối với dữ liệu cá nhân của mình:
                </p>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3 space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-teal-400" />
                      Quyền biết & Truy cập
                    </p>
                    <p className="text-slate-400">Bạn có quyền biết chúng tôi thu thập dữ liệu gì và yêu cầu cung cấp bản sao dữ liệu cá nhân của bạn.</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3 space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-cyan-400" />
                      Quyền chỉnh sửa & Bổ sung
                    </p>
                    <p className="text-slate-400">Bạn có quyền yêu cầu cập nhật, đính chính các thông tin cá nhân chưa chính xác.</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3 space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      Quyền rút lại sự đồng ý
                    </p>
                    <p className="text-slate-400">Bạn có quyền hủy đăng ký nhận email, thông báo đẩy hoặc rút lại sự cho phép xử lý dữ liệu bất kỳ lúc nào.</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3 space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-rose-400" />
                      Quyền yêu cầu xóa dữ liệu
                    </p>
                    <p className="text-slate-400">Bạn có quyền yêu cầu Botly xóa vĩnh viễn toàn bộ dữ liệu cá nhân của mình khỏi cơ sở dữ liệu (Right to be Forgotten).</p>
                  </div>
                </div>
              </section>

              {/* Section 8 */}
              <section id="tre-em" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">8</span>
                  Bảo vệ dữ liệu trẻ em
                </h2>
                <p>
                  Dịch vụ của Botly hướng đến đối tượng người trưởng thành và người đi làm. Chúng tôi không chủ định thu thập hay lưu trữ thông tin cá nhân của người dưới 16 tuổi mà không có sự đồng ý rõ ràng bằng văn bản của cha mẹ hoặc người giám hộ hợp pháp. Nếu phát hiện trường hợp thông tin trẻ em vô tình được cung cấp, chúng tôi sẽ tiến hành xóa dữ liệu đó ngay lập tức.
                </p>
              </section>

              {/* Section 9 */}
              <section id="cap-nhat" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">9</span>
                  Sửa đổi & Hiệu lực chính sách
                </h2>
                <p>
                  Botly có thể cập nhật chính sách này theo thời gian để phản ánh các thay đổi về công nghệ, tính năng sản phẩm hoặc quy định pháp luật hiện hành. Mọi sửa đổi có hiệu lực ngay khi được đăng tải công khai trên trang web này kèm theo ngày cập nhật mới nhất.
                </p>
              </section>

              {/* Section 10 */}
              <section id="lien-he" className="scroll-mt-24 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-500/20 text-teal-300 text-xs font-bold">10</span>
                  Thông tin liên hệ & Tiếp nhận yêu cầu
                </h2>
                <p>
                  Mọi thắc mắc, đề nghị thực thi quyền chủ thể dữ liệu (truy xuất, chỉnh sửa, yêu cầu xóa dữ liệu) hoặc phản ánh về an toàn thông tin, vui lòng liên hệ bộ phận Bảo vệ Dữ liệu của chúng tôi:
                </p>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 sm:p-6 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Email chuyên trách Bảo mật & Quyền riêng tư:</p>
                      <a href="mailto:lienhe@botly.vn" className="text-sm sm:text-base font-bold text-teal-300 hover:underline">
                        lienhe@botly.vn
                      </a>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Thời gian xử lý: Trong vòng 72 giờ làm việc</span>
                    </p>
                  </div>
                </div>
              </section>
            </article>
          </div>
        </Container>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
