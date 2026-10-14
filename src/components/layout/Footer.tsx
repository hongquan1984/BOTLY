import { Share2, Link2, Video, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/data/site";

const serviceLinks = [
  { label: "AI Livestream", href: "#ai-livestream" },
  { label: "AI Customer Service", href: "#services" },
  { label: "Marketing Automation", href: "#automation" },
  { label: "Workflow Automation", href: "#automation" },
  { label: "Custom AI Development", href: "#services" },
];

const resourceLinks = [
  { label: "Blog", href: "#top" },
  { label: "Case Study", href: "#case-studies" },
  { label: "Tài liệu", href: "#process" },
  { label: "Demo", href: "#contact" },
  { label: "FAQ", href: "#faq" },
];

const companyLinks = [
  { label: "Giới thiệu", href: "#why-us" },
  { label: "Liên hệ", href: "#contact" },
  { label: "Chính sách & Quyền riêng tư", href: "/chinh-sach-quyen-rieng-tu" },
  { label: "Điều khoản sử dụng", href: "#contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050816] pt-16 pb-8">
      <Container>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              {siteConfig.tagline}
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={siteConfig.social.facebook}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
                aria-label="Facebook"
                target="_blank"
                rel="noreferrer"
              >
                <Share2 className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.social.linkedin}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
                aria-label="LinkedIn"
                target="_blank"
                rel="noreferrer"
              >
                <Link2 className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.social.youtube}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
                aria-label="YouTube"
                target="_blank"
                rel="noreferrer"
              >
                <Video className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Dịch vụ
            </h3>
            <ul className="mt-4 space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-cyan-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Tài nguyên
            </h3>
            <ul className="mt-4 space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-cyan-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Công ty
            </h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-cyan-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>{siteConfig.contact.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>{siteConfig.contact.phone}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span>{siteConfig.contact.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Tất cả quyền được bảo
            lưu.
          </p>
          <p>
            Logo & thông tin liên hệ: chỉnh trong{" "}
            <code className="text-slate-400">src/data/site.ts</code>
          </p>
        </div>
      </Container>
    </footer>
  );
}
