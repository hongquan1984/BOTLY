'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Sparkles, ArrowRight, Smartphone, RefreshCw } from 'lucide-react';
import { trackClientEvent } from '@/components/analytics/AnalyticsTracker';

const APP_STORE_URL = 'https://apps.apple.com/vn/app/soulscape-meditation-emotion/id6769265902';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.soulscape.world&pcampaignid=web_share';

export function SmartAppDownloadLanding() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [redirecting, setRedirecting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    const searchParams = new URLSearchParams(window.location.search);
    const noRedirect = searchParams.get('noredirect') === '1' || searchParams.get('preview') === '1';
    const utmSource = searchParams.get('utm_source') || '';
    const utmMedium = searchParams.get('utm_medium') || '';
    const utmCampaign = searchParams.get('utm_campaign') || '';

    // Generate local QR code for desktop visitors (scannable by phone camera)
    const currentSmartLink = window.location.origin + '/app' + (utmSource ? `?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}` : '');
    QRCode.toDataURL(currentSmartLink, {
      width: 260,
      margin: 2,
      color: {
        dark: '#030712',
        light: '#ffffff'
      }
    }).then(setQrDataUrl).catch(console.error);

    if (isIOS) {
      setPlatform('ios');
      setTargetUrl(APP_STORE_URL);
      if (!noRedirect) {
        setRedirecting(true);
        trackAppClick('app_store', 'ios', 'auto_redirect');

        const timer = setTimeout(() => {
          window.location.replace(APP_STORE_URL);
        }, 750);
        return () => clearTimeout(timer);
      }
    } else if (isAndroid) {
      setPlatform('android');
      setTargetUrl(PLAY_STORE_URL);
      if (!noRedirect) {
        setRedirecting(true);
        trackAppClick('google_play', 'android', 'auto_redirect');

        const timer = setTimeout(() => {
          window.location.replace(PLAY_STORE_URL);
        }, 750);
        return () => clearTimeout(timer);
      }
    } else {
      setPlatform('desktop');
    }
  }, []);

  const trackAppClick = (store: 'app_store' | 'google_play', devicePlatform: string, method: string) => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const metadata = {
      store,
      platform: devicePlatform,
      method,
      utm_source: searchParams?.get('utm_source') || 'direct',
      utm_medium: searchParams?.get('utm_medium') || '',
      utm_campaign: searchParams?.get('utm_campaign') || '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp: new Date().toISOString()
    };

    trackClientEvent('onboarding_app_download_click', {
      locale: 'en',
      metadata
    });
  };

  const handleManualClick = (store: 'app_store' | 'google_play') => {
    trackAppClick(store, platform, 'manual_button_click');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[180px]" />
      </div>

      {/* Header bar */}
      <header className="relative z-10 border-b border-indigo-950/60 bg-[#070b14]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-800 text-amber-300 text-lg font-bold shadow-lg shadow-indigo-950/50">
              🌱
            </span>
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-300 transition">
              Soulscape <span className="text-xs font-medium text-indigo-400">by Botly</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/en/wellness" className="text-slate-400 hover:text-white transition">
              ← Botly Wellness
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Free Download
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Mobile Redirecting Notice Banner (When auto-redirecting on iOS/Android) */}
        {redirecting && (
          <div className="w-full max-w-md mx-auto mb-8 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#121b2d] to-[#0a101d] p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-950/80 border border-indigo-800/80 text-3xl shadow-inner mb-4">
              <RefreshCw className="h-8 w-8 text-amber-300 animate-spin" />
            </div>
            <span className="inline-block rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/20 mb-2">
              {platform === 'ios' ? ' iOS Device Detected' : '▶ Android Device Detected'}
            </span>
            <h2 className="text-xl font-bold text-white mb-2">
              {platform === 'ios' ? 'Opening App Store...' : 'Opening Google Play Store...'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Redirecting you to the official app store download page.
            </p>
            <a
              href={targetUrl}
              onClick={() => handleManualClick(platform === 'ios' ? 'app_store' : 'google_play')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 active:scale-95 transition"
            >
              <span>{platform === 'ios' ? 'Tap Here to Open App Store' : 'Tap Here to Open Google Play'}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column: Visual Mockup / Mascot Artwork */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative group w-full max-w-[340px] sm:max-w-[380px]">
              <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-amber-400/30 via-indigo-500/30 to-cyan-400/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000" />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-indigo-800/40 bg-[#0d1424] shadow-2xl p-2">
                <Image
                  src="/app/soulscape-hero.jpg"
                  alt="Soulscape - Meditation & Emotion"
                  width={600}
                  height={600}
                  priority
                  className="w-full h-auto rounded-[2rem] object-cover shadow-inner"
                />
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-300 text-sm mb-1">
                    {'★★★★★'}
                    <span className="text-xs font-bold text-white ml-1.5">4.9 / 5.0 Rating</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">
                    Over 10,000+ people resting easier and reclaiming peaceful sleep
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: App Information & Download Actions */}
          <div className="lg:col-span-7 flex flex-col text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950/80 px-3.5 py-1.5 text-xs font-bold text-amber-300 border border-indigo-800/60 w-fit mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>BEDTIME SOMATIC GROUNDING & SLEEP COMPANION</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15] mb-4">
              Soulscape: <br />
              <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Meditation & Emotion
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
              Zero streak guilt. Soften 2 AM nervous system alarms with restorative 432Hz sleep soundscapes, guided bedtime resets, and an empathetic Sprout companion.
            </p>

            {/* Feature Highlights Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <div className="flex items-start gap-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 text-base">
                  🎵
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">432Hz Soundscapes & Pink Noise</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Gentle acoustic frequencies to lull active minds into deep rest.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 text-base">
                  🌱
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Nurture Your Emotional Sprout</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Zero streak guilt. Every feeling is a welcome guest.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 text-base">
                  🫁
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">3-Minute Bedside Reset</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Paced 4-4-8 breathing slider to down-regulate heart rate.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300 text-base">
                  🌙
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">8-Hour Continuous Sleep Timer</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Smooth background audio playback even when phone locks.</p>
                </div>
              </div>
            </div>

            {/* Download Buttons Section */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* App Store iOS Button */}
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleManualClick('app_store')}
                className={`flex-1 flex items-center justify-center gap-3.5 rounded-2xl px-6 py-4 shadow-xl transition active:scale-95 cursor-pointer ${
                  platform === 'ios'
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/20 ring-2 ring-amber-300'
                    : 'bg-white text-slate-950 hover:bg-slate-100 shadow-white/10'
                }`}
              >
                <span className="text-2xl leading-none"></span>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">Download on the</p>
                  <p className="text-sm font-black leading-tight">App Store (iOS)</p>
                </div>
              </a>

              {/* Google Play Android Button */}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleManualClick('google_play')}
                className={`flex-1 flex items-center justify-center gap-3.5 rounded-2xl px-6 py-4 shadow-xl transition active:scale-95 cursor-pointer ${
                  platform === 'android'
                    ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-emerald-400/20 ring-2 ring-emerald-300'
                    : 'bg-[#131b2e] text-white hover:bg-[#1a253e] border border-indigo-700/50 shadow-indigo-950/40'
                }`}
              >
                <span className="text-xl text-emerald-400 leading-none">▶</span>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GET IT ON</p>
                  <p className="text-sm font-black leading-tight">Google Play (Android)</p>
                </div>
              </a>
            </div>

            {/* Desktop QR Code Card */}
            {platform === 'desktop' && qrDataUrl && (
              <div className="flex items-center gap-5 rounded-3xl border border-indigo-900/50 bg-[#0a101f]/90 p-4 shadow-xl max-w-md">
                <div className="relative shrink-0 rounded-2xl bg-white p-2 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code to Download Soulscape" className="h-24 w-24 rounded-lg object-contain" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
                    <Smartphone className="h-3.5 w-3.5" />
                    Scan with Your Phone Camera
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Point your iPhone or Android camera at the QR code to open the download page instantly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-indigo-950/60 bg-[#05080f]/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Soulscape by Botly Wellness. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>✓ Privacy Protected</span>
            <span>✓ Ad-free Sanctuary</span>
            <span>✓ 100% Free Download</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
