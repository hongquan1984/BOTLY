import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/data/site";
import { JsonLd } from "@/components/sections/JsonLd";
import { ToastProvider } from "@/components/layout/ToastProvider";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { MonetagInPagePush } from "@/components/monetag/MonetagInPagePush";
import { LocaleHtmlLang } from "@/components/seo/LocaleHtmlLang";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  verification: {
    google: "fgxRfdqGUzMGmQFxW1WEhlBOLYyUFZanclS2lVBY1VI",
    other: {
      "google-site-verification": "fgxRfdqGUzMGmQFxW1WEhlBOLYyUFZanclS2lVBY1VI",
      "mylead-verification": "4d9b36e2182769ce219a6ab4f8104424",
    },
  },
  title: {
    default: "Botly Wellness – Eat better. Feel calmer. Live mindfully.",
    template: `%s | ${siteConfig.name}`,
  },
  description: "Practical wellness tools for healthy eating, sustainable weight goals, stress management and meditation.",
  keywords: ["wellness", "healthy eating", "weight management", "stress management", "meditation", "mindfulness"],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  icons: {
    icon: [{ url: "/favicon-logo.png", type: "image/png" }],
    apple: [{ url: "/favicon-logo.png" }],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteConfig.url,
    siteName: "Botly Wellness",
    title: "Botly Wellness – Sống Khỏe & Dinh Dưỡng Khoa Học",
    description: "Nền tảng y sinh học, công thức thực phẩm và hướng dẫn sống khỏe dựa trên bằng chứng khoa học.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Botly Wellness – Sống Khỏe & Dinh Dưỡng Khoa Học",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Botly Wellness – Sống Khỏe & Dinh Dưỡng Khoa Học",
    description: "Nền tảng y sinh học, công thức thực phẩm và hướng dẫn sống khỏe dựa trên bằng chứng khoa học.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: { canonical: siteConfig.url },
};

export const viewport: Viewport = {
  themeColor: "#f7f8f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") || "/";
  const lang = pathname.startsWith("/vi/") ? "vi" : "en";

  return (
    <html lang={lang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LocaleHtmlLang />
        <JsonLd />
        <AnalyticsTracker />
        <MonetagInPagePush />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
