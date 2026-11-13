/**
 * HealthClues Premium Fantasy RPG Landing Page Interactive Script
 * - 3D Rotating Revolving Carousel (CoverFlow / Map Selection Style)
 * - Touch Swipe & Keyboard Navigation
 * - Ambient Golden Dust Particle Simulation
 * - Header Scroll & Smooth Navigation
 * - Privacy-First Analytics Tracker
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. 3D Rotating Revolving Carousel Controller
  // =========================================================================
  var currentIndex = 0;
  var totalCards = 7;
  var autoRotateTimer = null;
  var cards = [];
  var dotsContainer = null;
  var isMobile = window.innerWidth < 768;

  function update3DCarousel() {
    isMobile = window.innerWidth < 768;

    cards.forEach(function (card, i) {
      // Calculate signed distance in circular loop (-3 to +3)
      var diff = ((i - currentIndex) % totalCards + totalCards) % totalCards;
      if (diff > totalCards / 2) diff -= totalCards;

      card.classList.remove('is-center');

      var transform = '';
      var opacity = 0;
      var zIndex = 1;
      var pointerEvents = 'none';

      if (diff === 0) {
        // Front Center Card
        card.classList.add('is-center');
        transform = 'translate3d(0%, 0, 0px) rotateY(0deg) scale(1)';
        opacity = 1;
        zIndex = 20;
        pointerEvents = 'auto';
      } else if (diff === 1) {
        // Right Card 1
        transform = 'translate3d(64%, 0, -140px) rotateY(-20deg) scale(0.85)';
        opacity = 0.72;
        zIndex = 10;
        pointerEvents = 'auto';
      } else if (diff === -1) {
        // Left Card 1
        transform = 'translate3d(-64%, 0, -140px) rotateY(20deg) scale(0.85)';
        opacity = 0.72;
        zIndex = 10;
        pointerEvents = 'auto';
      } else if (diff === 2) {
        // Right Card 2 (Desktop: visible at 0.35, Mobile: smooth fade to 0)
        var xOff = isMobile ? '105%' : '112%';
        transform = 'translate3d(' + xOff + ', 0, -260px) rotateY(-28deg) scale(0.75)';
        opacity = isMobile ? 0 : 0.35;
        zIndex = 5;
        pointerEvents = isMobile ? 'none' : 'auto';
      } else if (diff === -2) {
        // Left Card 2 (Desktop: visible at 0.35, Mobile: smooth fade to 0)
        var xOff = isMobile ? '-105%' : '-112%';
        transform = 'translate3d(' + xOff + ', 0, -260px) rotateY(28deg) scale(0.75)';
        opacity = isMobile ? 0 : 0.35;
        zIndex = 5;
        pointerEvents = isMobile ? 'none' : 'auto';
      } else {
        // Far hidden cards in the back
        transform = 'translate3d(0%, 0, -500px) scale(0.5)';
        opacity = 0;
        zIndex = 1;
        pointerEvents = 'none';
      }

      card.setAttribute('data-diff', diff);
      card.style.transform = transform;
      card.style.opacity = opacity;
      card.style.zIndex = zIndex;
      card.style.pointerEvents = pointerEvents;
    });

    // Update dots
    var dots = document.querySelectorAll('.carousel-dot');
    dots.forEach(function (dot, idx) {
      if (idx === currentIndex) {
        dot.classList.add('is-active');
      } else {
        dot.classList.remove('is-active');
      }
    });

    logAnalyticsEvent('3d_carousel_rotated', {
      index: currentIndex,
      cardTitle: cards[currentIndex]?.querySelector('.card-title')?.innerText || ''
    });
  }

  function rotateNext() {
    currentIndex = (currentIndex + 1) % totalCards;
    update3DCarousel();
  }

  function rotatePrev() {
    currentIndex = (currentIndex - 1 + totalCards) % totalCards;
    update3DCarousel();
  }

  function goToCard(idx) {
    if (idx < 0 || idx >= totalCards) return;
    currentIndex = idx;
    update3DCarousel();
  }

  function startAutoRotate() {
    if (autoRotateTimer) clearInterval(autoRotateTimer);
    autoRotateTimer = setInterval(rotateNext, 3000); // Tự động xoay sau mỗi 3 giây
  }

  var idleResumeTimer = null;

  function stopAutoRotate() {
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
      autoRotateTimer = null;
    }
    // Tự động kích hoạt lại sau 3 giây không tương tác
    if (idleResumeTimer) clearTimeout(idleResumeTimer);
    idleResumeTimer = setTimeout(function () {
      startAutoRotate();
    }, 3000);
  }

  function init3DCarousel() {
    cards = Array.from(document.querySelectorAll('.carousel-3d-card'));
    totalCards = cards.length;
    if (totalCards === 0) return;

    dotsContainer = document.getElementById('carousel-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (var i = 0; i < totalCards; i++) {
        (function (idx) {
          var dot = document.createElement('button');
          dot.className = 'carousel-dot' + (idx === 0 ? ' is-active' : '');
          dot.setAttribute('aria-label', 'Chuyển đến thẻ ' + (idx + 1));
          dot.addEventListener('click', function () {
            goToCard(idx);
            stopAutoRotate();
          });
          dotsContainer.appendChild(dot);
        })(i);
      }
    }

    // Prev / Next button clicks
    var prevBtn = document.getElementById('carousel-prev');
    var nextBtn = document.getElementById('carousel-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        rotatePrev();
        stopAutoRotate();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        rotateNext();
        stopAutoRotate();
      });
    }

    // Clicking any card brings it to front if not center
    cards.forEach(function (card, idx) {
      card.addEventListener('click', function (e) {
        // If clicking CTA button inside the card, allow default link action
        if (e.target.closest('.card-cta-btn')) return;

        if (idx !== currentIndex) {
          goToCard(idx);
          stopAutoRotate();
        }
      });
    });

    // Touch Swipe gesture support
    var track = document.getElementById('carousel-track');
    if (track) {
      var touchStartX = 0;
      var touchStartY = 0;
      var touchEndX = 0;
      var touchEndY = 0;

      track.addEventListener('touchstart', function (e) {
        stopAutoRotate();
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      track.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        var diffX = touchEndX - touchStartX;
        var diffY = touchEndY - touchStartY;
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
          if (diffX < 0) {
            rotateNext(); // swiped left -> show next
          } else {
            rotatePrev(); // swiped right -> show prev
          }
        }
      }, { passive: true });

      // Hover to pause auto rotate
      var container = document.querySelector('.hc-carousel-3d-container');
      if (container) {
        container.addEventListener('mouseenter', stopAutoRotate);
        container.addEventListener('mouseleave', startAutoRotate);
      }
    }

    // Keyboard Arrow Keys
    window.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        rotateNext();
        stopAutoRotate();
      } else if (e.key === 'ArrowLeft') {
        rotatePrev();
        stopAutoRotate();
      }
    });

    window.addEventListener('resize', function () {
      update3DCarousel();
    }, { passive: true });

    update3DCarousel();
    startAutoRotate();
  }

  // =========================================================================
  // 2. CTA Routing Configuration
  // =========================================================================
  function getPlayUrl() {
    var port = window.location.port;
    if (port && port !== '3000' && port !== '3249' && port !== '3257' && port !== '3261' && port !== '3268' && port !== '3269' && port !== '3329') {
      return 'http://localhost:3249/play';
    }
    return '/play';
  }

  function initCtaLinks() {
    var playLinks = document.querySelectorAll('a[href="/play"]');
    var targetUrl = getPlayUrl();
    playLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        logAnalyticsEvent('cta_clicked', {
          id: link.id || 'cta_button',
          href: targetUrl,
          text: link.innerText.trim()
        });
      });
      if (targetUrl !== '/play') {
        link.href = targetUrl;
      }
    });
  }

  // =========================================================================
  // 3. Privacy-First Analytics Tracker
  // =========================================================================
  function logAnalyticsEvent(eventName, data) {
    var payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data: data || {}
    };
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push(payload);
    }
    console.log('[HealthClues Analytics]', payload);
  }

  logAnalyticsEvent('landing_page_viewed', {
    referrer: document.referrer,
    viewport: window.innerWidth + 'x' + window.innerHeight
  });

  // =========================================================================
  // 4. Header Scroll Effect
  // =========================================================================
  function initHeaderScroll() {
    var header = document.getElementById('top-nav');
    if (!header) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }

  // =========================================================================
  // 5. Lightweight Ambient Golden Dust Canvas Particles
  // =========================================================================
  function initAmbientParticles() {
    var canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var maxParticles = window.innerWidth < 768 ? 20 : 45;
    var width, height;
    var animationFrameId;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    function createParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() * -0.4) - 0.1,
        opacity: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        hue: Math.random() > 0.4 ? 45 : 155
      };
    }

    for (var i = 0; i < maxParticles; i++) {
      particles.push(createParticle());
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.008;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        var alpha = Math.max(0.1, Math.min(0.75, p.opacity));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (p.hue === 45) {
          ctx.fillStyle = 'rgba(255, 214, 102, ' + alpha + ')';
        } else {
          ctx.fillStyle = 'rgba(52, 211, 153, ' + alpha + ')';
        }
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.hue === 45 ? '#ffd666' : '#34d399';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    });

    animationFrameId = requestAnimationFrame(render);
  }

  // =========================================================================
  // Initialize on DOM Ready
  // =========================================================================
  document.addEventListener('DOMContentLoaded', function () {
    init3DCarousel();
    initCtaLinks();
    initHeaderScroll();
    initAmbientParticles();
  });
})();
