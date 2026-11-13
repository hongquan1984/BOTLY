"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import "./healthclues-landing.css";

interface DoorCard {
  id: string;
  badge: string;
  badgeClass: string;
  title: string;
  desc: string;
  tags: string[];
  image: string;
}

const SEVEN_DOORS: DoorCard[] = [
  {
    id: "door-01",
    badge: "🛡️ PHÒNG TUYẾN SỨC KHỎE",
    badgeClass: "badge-health",
    title: "Đồng Hành Chiến Thắng Bệnh Tật",
    desc: "Cùng bạn tìm hiểu và từng bước quản lý gout, tiểu đường, huyết áp, đau nửa đầu và nhiều vấn đề thể trạng khác.",
    tags: ["Gout & Khớp", "Tiểu Đường", "Huyết Áp"],
    image: "/landing/card-health-journey.jpg",
  },
  {
    id: "door-02",
    badge: "🌿 DƯỢC LIỆU & BẰNG CHỨNG",
    badgeClass: "badge-herbal",
    title: "Khám Phá Những Liệu Pháp Bí Ẩn",
    desc: "Khám phá thảo mộc, phương pháp tự nhiên, trí tuệ cổ truyền và các nghiên cứu khoa học có bằng chứng chuẩn mực.",
    tags: ["Dược Thảo Tự Nhiên", "Khoa học PubMed"],
    image: "/landing/card-herbal-discovery.jpg",
  },
  {
    id: "door-03",
    badge: "🔬 KHOA HỌC SỰ SỐNG",
    badgeClass: "badge-body",
    title: "Giải Mã Bí Mật Cơ Thể",
    desc: "Khám phá dinh dưỡng tế bào, nhịp sinh học 24h và cách cơ thể tự phục hồi qua những kiến thức khoa học trực quan.",
    tags: ["Nhịp Sinh Học 24h", "Dinh Dưỡng Vi Chất"],
    image: "/landing/card-body-knowledge.jpg",
  },
  {
    id: "door-04",
    badge: "🏃 VẬN ĐỘNG VI MÔ",
    badgeClass: "badge-fitness",
    title: "Rèn Luyện, Chinh Phục Bản Thân",
    desc: "Từng bước vận động, kiểm soát cân nặng, cải thiện sức bền và hình thành thói quen rèn luyện không mệt mỏi.",
    tags: ["Thử Thách 2 Phút", "Tăng Sức Bền"],
    image: "/landing/card-fitness.jpg",
  },
  {
    id: "door-05",
    badge: "🌙 THUNG LŨNG GIẤC NGỦ",
    badgeClass: "badge-sleep",
    title: "Khám Phá Giấc Ngủ & Tâm Trí",
    desc: "Tìm hiểu cơ chế giấc ngủ sâu, giải tỏa stress và cùng thần thú Luna lắng nghe thanh âm bình yên trước giờ ngủ.",
    tags: ["Thần Thú Luna", "Giảm Căng Thẳng"],
    image: "/landing/card-sleep-mind.webp",
  },
  {
    id: "door-06",
    badge: "✨ TÍNH NĂNG ĐANG PHÁT TRIỂN",
    badgeClass: "badge-home",
    title: "Thế Giới Của Bạn",
    desc: "Hoàn thành nhiệm vụ, tích lũy EXP, mở Rương Quà Bí Ẩn và xây dựng không gian mơ ước nhìn ra hồ tuyết Alps.",
    tags: ["Rương Quà Bí Ẩn", "Cấp độ Hiệp Sĩ"],
    image: "/landing/card-dream-home.jpg",
  },
  {
    id: "door-07",
    badge: "🍵 CỘNG ĐỒNG · MULTIPLAYER",
    badgeClass: "badge-village",
    title: "Làng Đồng Hành",
    desc: "Kết nối, chia sẻ hành trình sống khỏe, vẫy tay chào nhau và gửi tặng một tách trà ấm khích lệ tinh thần.",
    tags: ["Thấy bạn bè online", "Vẫy tay chào 👋"],
    image: "/landing/community-village.webp",
  },
];

export function HealthCluesLandingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleResumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const totalCards = SEVEN_DOORS.length;

  const rotateNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalCards);
  }, [totalCards]);

  const rotatePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  }, [totalCards]);

  const goToCard = useCallback((idx: number) => {
    if (idx >= 0 && idx < totalCards) {
      setCurrentIndex(idx);
    }
  }, [totalCards]);

  const startAutoRotate = useCallback(() => {
    if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
    autoRotateTimerRef.current = setInterval(rotateNext, 3000);
  }, [rotateNext]);

  const stopAutoRotate = useCallback(() => {
    if (autoRotateTimerRef.current) {
      clearInterval(autoRotateTimerRef.current);
      autoRotateTimerRef.current = null;
    }
    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    idleResumeTimerRef.current = setTimeout(() => {
      startAutoRotate();
    }, 3000);
  }, [startAutoRotate]);

  // Auto rotation lifecycle
  useEffect(() => {
    startAutoRotate();
    return () => {
      if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
      if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    };
  }, [startAutoRotate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        rotateNext();
        stopAutoRotate();
      } else if (e.key === "ArrowLeft") {
        rotatePrev();
        stopAutoRotate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rotateNext, rotatePrev, stopAutoRotate]);

  // Header scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Ambient Canvas Particles Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const maxParticles = window.innerWidth < 768 ? 20 : 45;
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulseSpeed: number;
      hue: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: Math.random() * -0.4 - 0.1,
        opacity: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        hue: Math.random() > 0.4 ? 45 : 155,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const now = Date.now();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(now * p.pulseSpeed) * 0.008;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const alpha = Math.max(0.1, Math.min(0.75, p.opacity));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle =
          p.hue === 45
            ? `rgba(255, 214, 102, ${alpha})`
            : `rgba(52, 211, 153, ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.hue === 45 ? "#ffd666" : "#34d399";
        ctx.fill();
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="hc-landing-root">
      {/* Ambient Canvas */}
      <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />

      {/* Navigation Header */}
      <header className={`hc-header ${isScrolled ? "is-scrolled" : ""}`} id="top-nav">
        <div className="hc-container hc-header-inner">
          <Link href="#hero" className="hc-brand">
            <img
              src="/landing/logo.png"
              alt="HealthClues Logo"
              className="hc-logo-img"
              onError={(e) => ((e.target as HTMLElement).style.display = "none")}
            />
            <div className="hc-brand-text">
              <span className="hc-brand-title">HEALTHCLUES</span>
              <span className="hc-brand-badge">RPG WELLNESS</span>
            </div>
          </Link>

          <nav className="hc-nav-links">
            <a href="#seven-doors" className="hc-nav-link">
              7 Cánh Cửa
            </a>
            <a href="#journey-steps" className="hc-nav-link">
              Lộ Trình
            </a>
          </nav>

          <div className="hc-header-actions">
            <span className="hc-lang-pill">🇻🇳 VI</span>
            <Link href="/play" className="hc-btn hc-btn-nav" id="nav-cta-btn">
              <span className="btn-sparkle">✨</span> Chơi Ngay
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1 — HERO */}
      <section className="hc-hero" id="hero">
        <div className="hc-hero-bg-container">
          <img
            src="/landing/hero-wellness-world.jpg"
            alt="Thế giới HealthClues cùng bé cáo Lumi"
            className="hc-hero-bg-img"
          />
          <div className="hc-hero-overlay" />
        </div>

        <div className="hc-container hc-hero-container">
          <div className="hc-hero-content">
            <div className="hc-hero-badge">
              <span className="badge-icon">✨</span>
              <span className="badge-text">HEALTHCLUES · CUỘC PHIÊU LƯU SỨC KHỎE</span>
            </div>

            <h1 className="hc-hero-headline">
              <span className="headline-gold">Vượt qua nỗi lo sức khỏe.</span>
              <span className="headline-white">Mở khóa hành trình của bạn!</span>
            </h1>

            <p className="hc-hero-desc">
              Dù bạn đang đối mặt với bệnh tật, khó ngủ, stress hay đơn giản muốn sống khỏe hơn — hãy cùng{" "}
              <strong>Lumi & Luna</strong> khám phá kiến thức, thực hiện nhiệm vụ và từng bước chăm sóc bản thân.
            </p>

            <div className="hc-hero-mobile-visual" aria-hidden="true">
              <img
                src="/landing/hero-mobile-visual.jpg"
                alt="Lumi và người bạn đồng hành trong thế giới HealthClues"
                className="hero-mobile-img"
              />
              <div className="mobile-visual-tag">
                <span className="visual-tag-dot" />
                <span>Bạn đồng hành Lumi & Thế giới Alps</span>
              </div>
            </div>

            <div className="hc-hero-cta-group">
              <Link href="/play" className="hc-btn hc-btn-primary hc-btn-glow" id="hero-primary-cta">
                <span className="btn-icon">🎮</span>
                <span className="btn-label">Bắt đầu cuộc phiêu lưu →</span>
                <span className="btn-shine" />
              </Link>

              <a href="#seven-doors" className="hc-btn hc-btn-secondary" id="hero-secondary-cta">
                <span className="btn-icon">🗺️</span>
                <span>Khám phá 7 cánh cửa</span>
              </a>
            </div>

            <div className="hc-hero-benefits-strip">
              <div className="benefit-chip">
                <span className="benefit-icon">🧭</span>
                <div className="benefit-label">
                  <strong>Khám phá</strong>
                  <span>Cơ thể & kiến thức</span>
                </div>
              </div>
              <div className="benefit-chip">
                <span className="benefit-icon">📜</span>
                <div className="benefit-label">
                  <strong>Nhiệm vụ</strong>
                  <span>Phù hợp với bạn</span>
                </div>
              </div>
              <div className="benefit-chip">
                <span className="benefit-icon">🎁</span>
                <div className="benefit-label">
                  <strong>Phần thưởng</strong>
                  <span>Thành tựu trong game</span>
                </div>
              </div>
            </div>

            <div className="hc-hero-reassurance">
              <span className="reassurance-icon">⚡</span>
              <span>Khởi đầu nhẹ nhàng · Tự chọn mục tiêu · Không áp lực phải hoàn hảo</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — 3D ROTATING CAROUSEL (7 CÁNH CỬA) */}
      <section className="hc-doors-section" id="seven-doors">
        <div className="hc-container">
          <div className="hc-section-header">
            <div className="hc-section-tag">7 PHÂN VÙNG TRẢI NGHIỆM</div>
            <h2 className="hc-section-title">
              Mỗi cơ thể có một câu chuyện.<br className="hc-desktop-br" />{" "}
              <span className="title-gold">Hành trình của bạn bắt đầu từ đâu?</span>
            </h2>
            <p className="hc-section-desc">
              <span className="hc-desktop-desc">Vuốt hoặc bấm phím mũi tên để xoay vòng khám phá từng cánh cửa:</span>
              <span className="hc-mobile-desc">Vuốt ngang để khám phá cánh cửa của bạn:</span>
            </p>
          </div>

          <div
            className="hc-carousel-3d-container"
            onMouseEnter={stopAutoRotate}
            onMouseLeave={startAutoRotate}
          >
            <div
              className="hc-carousel-3d-track carousel-3d-track"
              id="carousel-track"
              onTouchStart={(e) => {
                stopAutoRotate();
                touchStartXRef.current = e.changedTouches[0].screenX;
                touchStartYRef.current = e.changedTouches[0].screenY;
              }}
              onTouchEnd={(e) => {
                const diffX = e.changedTouches[0].screenX - touchStartXRef.current;
                const diffY = e.changedTouches[0].screenY - touchStartYRef.current;
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
                  if (diffX < 0) rotateNext();
                  else rotatePrev();
                }
              }}
            >
              {SEVEN_DOORS.map((door, i) => {
                let diff = ((i - currentIndex) % totalCards + totalCards) % totalCards;
                if (diff > totalCards / 2) diff -= totalCards;

                const isCenter = diff === 0;
                let transform = "";
                let opacity = 0;
                let zIndex = 1;
                let pointerEvents: "auto" | "none" = "none";

                if (diff === 0) {
                  transform = "translate3d(0%, 0, 0px) rotateY(0deg) scale(1)";
                  opacity = 1;
                  zIndex = 20;
                  pointerEvents = "auto";
                } else if (diff === 1) {
                  transform = "translate3d(64%, 0, -140px) rotateY(-20deg) scale(0.85)";
                  opacity = 0.72;
                  zIndex = 10;
                  pointerEvents = "auto";
                } else if (diff === -1) {
                  transform = "translate3d(-64%, 0, -140px) rotateY(20deg) scale(0.85)";
                  opacity = 0.72;
                  zIndex = 10;
                  pointerEvents = "auto";
                } else if (diff === 2) {
                  transform = "translate3d(105%, 0, -260px) rotateY(-28deg) scale(0.75)";
                  opacity = 0;
                  zIndex = 5;
                  pointerEvents = "none";
                } else if (diff === -2) {
                  transform = "translate3d(-105%, 0, -260px) rotateY(28deg) scale(0.75)";
                  opacity = 0;
                  zIndex = 5;
                  pointerEvents = "none";
                } else {
                  transform = "translate3d(0%, 0, -500px) scale(0.5)";
                  opacity = 0;
                  zIndex = 1;
                  pointerEvents = "none";
                }

                return (
                  <article
                    key={door.id}
                    className={`carousel-3d-card ${isCenter ? "is-center" : ""}`}
                    data-diff={diff}
                    style={{
                      transform,
                      opacity,
                      zIndex,
                      pointerEvents,
                    }}
                    onClick={() => {
                      if (!isCenter) {
                        goToCard(i);
                        stopAutoRotate();
                      }
                    }}
                  >
                    <div className="card-media">
                      <img src={door.image} alt={door.title} className="card-img" loading="lazy" />
                      <div className="card-overlay" />
                    </div>
                    <div className="card-content">
                      <span className={`card-badge ${door.badgeClass}`}>{door.badge}</span>
                      <h3 className="card-title">{door.title}</h3>
                      <p className="card-desc">{door.desc}</p>
                      <div className="card-tags">
                        {door.tags.map((tag, tIdx) => (
                          <span key={tIdx}>{tag}</span>
                        ))}
                      </div>
                      <Link href="/play" className="hc-btn hc-btn-primary card-cta-btn">
                        <span>Khám Phá Cánh Cửa Này</span>
                        <span className="btn-arrow">→</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              className="carousel-nav-btn carousel-prev-btn carousel-control carousel-control-prev"
              onClick={() => {
                rotatePrev();
                stopAutoRotate();
              }}
              aria-label="Cánh cửa trước"
            >
              ❮
            </button>
            <button
              className="carousel-nav-btn carousel-next-btn carousel-control carousel-control-next"
              onClick={() => {
                rotateNext();
                stopAutoRotate();
              }}
              aria-label="Cánh cửa tiếp theo"
            >
              ❯
            </button>
          </div>

          <div className="carousel-indicators" role="tablist">
            {SEVEN_DOORS.map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot ${idx === currentIndex ? "is-active" : ""}`}
                onClick={() => {
                  goToCard(idx);
                  stopAutoRotate();
                }}
                aria-label={`Chuyển đến thẻ ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — LỘ TRÌNH 5 BƯỚC */}
      <section className="hc-journey-section" id="journey-steps">
        <div className="hc-container">
          <div className="hc-section-header">
            <div className="hc-section-tag">LỘ TRÌNH ĐỒNG HÀNH</div>
            <h2 className="hc-section-title">
              Hành trình của bạn trong <span className="title-gold">HealthClues</span>
            </h2>
            <p className="hc-section-desc">
              5 cột mốc đơn giản biến việc chăm sóc sức khỏe thành một cuộc phiêu lưu thú vị:
            </p>
          </div>

          <div className="hc-pipeline-strip-wrap">
            <div className="hc-pipeline-strip">
              <div className="pipeline-item">
                <div className="pipeline-badge">01</div>
                <div className="pipeline-icon">🗺️</div>
                <div className="pipeline-info">
                  <h5>1. Khám Phá</h5>
                  <p>Chọn vấn đề bạn quan tâm</p>
                </div>
              </div>

              <div className="pipeline-arrow">➔</div>

              <div className="pipeline-item">
                <div className="pipeline-badge">02</div>
                <div className="pipeline-icon">📜</div>
                <div className="pipeline-info">
                  <h5>2. Nhận Kế Hoạch</h5>
                  <p>Trang bị 3 nhiệm vụ vừa sức</p>
                </div>
              </div>

              <div className="pipeline-arrow">➔</div>

              <div className="pipeline-item">
                <div className="pipeline-badge">03</div>
                <div className="pipeline-icon">🦊</div>
                <div className="pipeline-info">
                  <h5>3. Làm Nhiệm Vụ</h5>
                  <p>Đồng hành cùng Lumi mỗi sớm</p>
                </div>
              </div>

              <div className="pipeline-arrow">➔</div>

              <div className="pipeline-item">
                <div className="pipeline-badge">04</div>
                <div className="pipeline-icon">🎁</div>
                <div className="pipeline-info">
                  <h5>4. Nhận Thành Tựu</h5>
                  <p>Tích lũy EXP & mở rương quà</p>
                </div>
              </div>

              <div className="pipeline-arrow">➔</div>

              <div className="pipeline-item">
                <div className="pipeline-badge">05</div>
                <div className="pipeline-icon">🏡</div>
                <div className="pipeline-info">
                  <h5>5. Mở Rộng</h5>
                  <p>Không gian mơ ước và cộng đồng</p>
                </div>
              </div>
            </div>
          </div>

          {/* Master Final CTA Box */}
          <div className="hc-final-cta-box">
            <div className="final-cta-ambient-glow" />
            <div className="final-cta-inner">
              <div className="final-chibi-group">
                <img
                  src="/landing/chibi-wave.png"
                  alt="Hiệp sĩ vẫy tay chào"
                  className="chibi-sprite chibi-bounce"
                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                />
                <img
                  src="/landing/step-companion.png"
                  alt="Lumi tinh nghịch"
                  className="chibi-sprite chibi-lumi"
                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                />
                <img
                  src="/landing/chibi-heart.png"
                  alt="Hiệp sĩ thả tim"
                  className="chibi-sprite chibi-pulse"
                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                />
              </div>

              <h3 className="final-cta-headline">
                Sẵn sàng mở khóa phiên bản khỏe mạnh nhất?
              </h3>

              <p className="final-cta-sub">
                Khám phá theo nhịp độ của riêng bạn — <strong>không áp lực phải hoàn hảo</strong>.
              </p>

              <Link href="/play" className="hc-btn hc-btn-primary hc-btn-glow final-cta-btn">
                <span className="btn-icon">🎮</span>
                <span className="btn-label">Bắt đầu cuộc phiêu lưu ngay</span>
                <span className="btn-shine" />
              </Link>

              <div className="final-cta-note">
                ⚡ Hoàn toàn miễn phí · Chơi ngay trên trình duyệt web
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER & MEDICAL DISCLAIMER */}
      <footer className="hc-footer">
        <div className="hc-container hc-footer-container">
          <div className="hc-footer-disclaimer">
            <span className="disclaimer-icon">⚠️</span>
            <div className="disclaimer-text">
              <strong>LƯU Ý Y TẾ:</strong> HealthClues là trò chơi đồng hành xây dựng lối sống lành mạnh, không phải phần mềm chẩn đoán, kê đơn hoặc chữa bệnh. Thông điệp &ldquo;chiến thắng bệnh tật&rdquo; mang ý nghĩa khích lệ kiên trì và lạc quan; không thay thế tư vấn y tế chuyên nghiệp của bác sĩ.
            </div>
          </div>

          <div className="hc-footer-bottom">
            <div className="footer-copyright">
              © 2026 HealthClues. Phong cách Swiss Alpine Fantasy RPG Wellness.
            </div>
            <div className="footer-links">
              <Link href="/play" className="footer-link">
                Chơi game
              </Link>
              <a href="#hero" className="footer-link">
                Về đầu trang ↑
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
