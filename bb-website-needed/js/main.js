/* ========================================
   Blink Beyond — Shared JavaScript
   ======================================== */

// Register GSAP plugins immediately if available
if (typeof gsap !== 'undefined') {
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  if (typeof Draggable !== 'undefined') gsap.registerPlugin(Draggable);
}

/* ========================================
   PAGE TRANSITION — BLUE CURTAIN WIPE
   ======================================== */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Reset scroll position immediately on script load
window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.clearScrollMemory && ScrollTrigger.clearScrollMemory('manual');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        ScrollTrigger.refresh();
      });
    });
    // Fonts load async — reflow after fonts settle shifts all element heights,
    // invalidating every ScrollTrigger start/end point calculated before fonts were ready.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        window.scrollTo(0, 0);
        ScrollTrigger.refresh();
      });
    }
    // Safety net: catch any remaining layout shifts (images, custom fonts via @font-face)
    setTimeout(() => { ScrollTrigger.refresh(); }, 600);
  }
});

(function() {
  var overlay = document.querySelector('.page-transition-overlay');
  if (!overlay) return;

  var cameFromTransition = false;
  try { cameFromTransition = sessionStorage.getItem('bb_page_transition') === '1'; } catch(e) {}

  if (cameFromTransition) {
    try { sessionStorage.removeItem('bb_page_transition'); } catch(e) {}
    // Overlay is already covering the screen via .bb-entering CSS + inline bg set in <head>.
    // Remove the class so GSAP can take over, then slide the curtain upward.
    document.documentElement.classList.remove('bb-entering');
    gsap.set(overlay, { y: '0%', pointerEvents: 'all' });
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        gsap.to(overlay, {
          y: '-100%',
          duration: 0.9,
          ease: 'power3.inOut',
          onComplete: function() {
            gsap.set(overlay, { pointerEvents: 'none' });
            // Clear the blue background set inline in <head> so the page renders normally
            document.documentElement.style.background = '';
            document.documentElement.style.backgroundColor = '';
          }
        });
      });
    });
  }

  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('javascript')) return;
    if (link.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    var dest = href;

    try { sessionStorage.setItem('bb_page_transition', '1'); } catch(e) {}

    gsap.set(overlay, { y: '100%', pointerEvents: 'all' });
    gsap.to(overlay, {
      y: '0%',
      duration: 0.7,
      ease: 'power3.inOut',
      onComplete: function() {
        window.location.href = dest;
      }
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  /* ========================================
     FAB TOGGLE (floating action button)
     ======================================== */
  (function() {
    const fabToggle  = document.querySelector('.fab-toggle');
    const fabOptions = document.querySelector('.fab-options');
    if (!fabToggle || !fabOptions) return;

    fabToggle.addEventListener('click', () => {
      const isOpen = fabOptions.classList.contains('open');
      fabOptions.classList.toggle('open', !isOpen);
      fabToggle.classList.toggle('open', !isOpen);
      fabToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.fab-container')) {
        fabOptions.classList.remove('open');
        fabToggle.classList.remove('open');
        fabToggle.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  /* ========================================
     PREMIUM BRANDED SPLASH SCREEN
     ======================================== */
  const loader = document.getElementById('page-loader');
    // URL override for testing: ?loader=show forces the preloader to run
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('loader') === 'show') {
        localStorage.removeItem('bb_loader_seen');
        try { sessionStorage.removeItem('bb_loader_seen'); } catch (e) {}
        document.cookie = 'bb_loader_seen=; path=/; max-age=0';
        document.documentElement.classList.remove('bb-loader-skip');
      }
    } catch (e) {}
  if (loader) {
    const docEl = document.documentElement;
    const getCookieSeen = () => /(?:^|; )bb_loader_seen=1/.test(document.cookie);
    const getSeenFlag = () => {
      if (docEl.classList.contains('bb-loader-skip')) return true;
      try {
        if (localStorage.getItem('bb_loader_seen') === '1') return true;
      } catch (e) {}
      if (getCookieSeen()) return true;
      try {
        return sessionStorage.getItem('bb_loader_seen') === '1';
      } catch (e) {
        return false;
      }
    };
    const setSeenFlag = () => {
      try { localStorage.setItem('bb_loader_seen', '1'); } catch (e) {}
      document.cookie = 'bb_loader_seen=1; path=/; max-age=31536000';
      try { sessionStorage.setItem('bb_loader_seen', '1'); } catch (e) {}
    };

    if (getSeenFlag()) {
      loader.classList.add('skip');
      loader.remove();
    } else {
      setSeenFlag();
      const counterEl = document.getElementById('loader-percent');
      const barFill = document.getElementById('loader-bar-fill');
      const fillText = document.getElementById('loader-fill-text');
      let current = 0;
      const duration = 2500; // total ms
      const startTime = performance.now();

      function animateLoader(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Eased progress (cubic ease-in-out)
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        current = Math.floor(eased * 100);

        if (counterEl) {
          const counterValue = current + '%';
          counterEl.textContent = counterValue;
          counterEl.dataset.value = counterValue;
          counterEl.style.setProperty('--progress', current + '%');
        }
        if (barFill) barFill.style.width = current + '%';

        if (fillText) {
          const pct = Math.floor(eased * 100);
          fillText.style.background = `linear-gradient(to right, #ffffff ${pct}%, rgba(255,255,255,0.18) ${pct}%)`;
          fillText.style.webkitBackgroundClip = 'text';
          fillText.style.backgroundClip = 'text';
          fillText.style.webkitTextFillColor = 'transparent';
        }

        if (progress < 1) {
          requestAnimationFrame(animateLoader);
        } else {
          setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 900);
          }, 400);
        }
      }

      requestAnimationFrame(animateLoader);
    }
  }

  /* ========================================
     SPLIT LETTERS & MAGNETIC EFFECT
     ======================================== */
  function splitWord(el,text){
    if(el) el.innerHTML=[...text].map(l=>`<span class="letter">${l}</span>`).join('');
  }
  const wPlay = document.getElementById('wPlay');
  const wReel = document.getElementById('wReel');
  if (wPlay) splitWord(wPlay, 'Play');
  if (wReel) splitWord(wReel, 'Reel');

  document.querySelectorAll('.play-text .letter, .reel-text .letter').forEach(l=>{
    l.addEventListener('mousemove', e=>{
      const r = l.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width/2)) / r.width * 14;
      const y = (e.clientY - (r.top + r.height/2)) / r.height * 14;
      l.style.transform = `translate(${x}px, ${y}px)`;
    });
    l.addEventListener('mouseleave', ()=>{
      l.style.transform = '';
    });
  });

  // ── Navbar scroll effect ──
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ── Fullscreen Menu GSAP ──
  (function initFullscreenMenu() {
    const btn = document.getElementById('cnHamburger');
    const closeBtn = document.getElementById('fsMenuClose');
    const menu = document.getElementById('fsMenu');
    const links = document.querySelectorAll('.fs-link');
    if (!menu || !btn || !closeBtn) return;

    // Split text into spans for the text roll effect
    links.forEach(link => {
      const text = link.getAttribute('data-text');
      const topLayer = link.querySelector('.text-roll-top');
      const bottomLayer = link.querySelector('.text-roll-bottom');
      if (!topLayer || !bottomLayer || !text) return;

      const letters = [...text].map(char => `<span class="letter">${char}</span>`).join('');
      topLayer.innerHTML = letters;
      bottomLayer.innerHTML = letters;

      // Hover animation logic for non-touch
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        link.addEventListener('mouseenter', () => {
          gsap.killTweensOf(link.querySelectorAll('.text-roll-top .letter'));
          gsap.killTweensOf(link.querySelectorAll('.text-roll-bottom .letter'));
          gsap.to(link.querySelectorAll('.text-roll-top .letter'), {
            y: '-100%',
            duration: 0.4,
            ease: 'power2.inOut',
            stagger: 0.02
          });
          gsap.fromTo(link.querySelectorAll('.text-roll-bottom .letter'),
            { y: '100%' },
            { y: '0%', duration: 0.4, ease: 'power2.inOut', stagger: 0.02 }
          );
        });
        link.addEventListener('mouseleave', () => {
          gsap.killTweensOf(link.querySelectorAll('.text-roll-top .letter'));
          gsap.killTweensOf(link.querySelectorAll('.text-roll-bottom .letter'));
          gsap.to(link.querySelectorAll('.text-roll-top .letter'), {
            y: '0%',
            duration: 0.4,
            ease: 'power2.inOut',
            stagger: 0.02
          });
          gsap.to(link.querySelectorAll('.text-roll-bottom .letter'), {
            y: '100%',
            duration: 0.4,
            ease: 'power2.inOut',
            stagger: 0.02
          });
        });
      }
    });

    let isOpen = false;
    let tl = gsap.timeline({ paused: true })
      .set(menu, { visibility: 'visible' })
      .to(menu, { y: '0%', duration: 0.7, ease: 'power3.inOut' })
      .from(links, { y: 60, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, '-=0.2')
      .from('.fs-menu-footer', { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' }, '-=0.3');

    const openMenu = () => {
      if (isOpen) return;
      isOpen = true;
      document.body.style.overflow = 'hidden';
      tl.play(0);
      
      // On mobile, trigger text roll once upon reveal
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        links.forEach(link => {
          gsap.fromTo(link.querySelectorAll('.text-roll-bottom .letter'),
            { y: '100%' },
            { y: '0%', duration: 0.5, ease: 'power2.inOut', stagger: 0.03, delay: 0.5 }
          );
          gsap.fromTo(link.querySelectorAll('.text-roll-top .letter'),
            { y: '0%' },
            { y: '-100%', duration: 0.5, ease: 'power2.inOut', stagger: 0.03, delay: 0.5 }
          );
        });
      }
    };

    const closeMenu = (onComplete) => {
      if (!isOpen) return;
      isOpen = false;
      document.body.style.overflow = '';
      tl.reverse().then(() => {
        if (onComplete) onComplete();
      });
    };

    btn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', () => closeMenu());

    // Intercept link clicks in menu to trigger transition curtain
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const dest = link.getAttribute('href');
        if (!dest || dest.startsWith('#')) return; 
        e.preventDefault();
        
        try { sessionStorage.setItem('bb_page_transition', '1'); } catch(e) {}
        
        // Since the menu is already blue and covers the screen, 
        // we can simply navigate. The new page's entrance transition 
        // will seamlessly slide the blue curtain UP.
        window.location.href = dest;
      });
    });

  })();

  // ── Scroll Reveal (Intersection Observer) ──
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  // ── Service word hover pulse ──
  document.querySelectorAll('.service-big-word').forEach(word => {
    word.addEventListener('mouseenter', () => {
      word.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      word.style.transform = 'scale(1.04)';
    });
    word.addEventListener('mouseleave', () => {
      word.style.transform = 'scale(1)';
    });
  });

  // ── Parallax Scroll-Driven Animation ──
  const parallaxSections = document.querySelectorAll('.parallax-word-section');
  if (parallaxSections.length) {
    if (window.innerWidth > 768) {
      // ── Desktop: pin + card-rotation + image parallax ──
      parallaxSections.forEach((section, i) => {
        gsap.set(section, { zIndex: i + 1 });

        const inner = section.querySelector('.parallax-sticky');
        if (!inner) return;

        if (i < parallaxSections.length - 1) {
          ScrollTrigger.create({
            trigger: section,
            start: 'bottom bottom',
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
          });
        }

        if (i > 0) {
          gsap.set(inner, { rotation: 30, transformOrigin: 'bottom left' });
          gsap.to(inner, {
            rotation: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'top 25%',
              scrub: true,
            },
          });
        }

        const imgs = section.querySelectorAll('.parallax-img');
        // 6 unique entry vectors — each image travels from a distinct origin
        const entryVectors = [
          { x: '-22vw', y: '-14vh', rot: -20 }, // top-left  → slides from far left + above
          { x:  '20vw', y: '-16vh', rot:  18 }, // top-right → slides from right + above
          { x: '-24vw', y:   '6vh', rot: -14 }, // mid-left  → slides from far left
          { x:  '10vw', y:  '22vh', rot:  12 }, // mid-right → slides from below + slight right
          { x: '-12vw', y:  '24vh', rot: -22 }, // bot-left  → slides from below + left
          { x:  '22vw', y:  '18vh', rot:  20 }, // bot-right → slides from below + far right
        ];
        imgs.forEach((img, index) => {
          const vec = entryVectors[index % entryVectors.length];
          gsap.fromTo(img,
            { x: vec.x, y: vec.y, rotation: vec.rot, scale: 0.82, opacity: 0 },
            {
              x: '0vw', y: '0vh', rotation: 0, scale: 1, opacity: 1, ease: 'none',
              scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: true }
            }
          );
        });
      });
    }
    // Mobile: no animation — sections display statically via CSS
  }

  // ── OSMO-style reel ring: circle + 36 tick marks ──
  const ringSvg = document.getElementById('reel-ring');
  if (ringSvg) {
    const r = 200, tickLen = 8, numTicks = 36;
    let markup = `<circle cx="0" cy="0" r="${r}" fill="none" stroke="rgba(0,0,0,0.09)" stroke-width="1"/>`;
    for (let i = 0; i < numTicks; i++) {
      const angle = (i * 360 / numTicks) * Math.PI / 180;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const x1 = (cos * (r - tickLen)).toFixed(2), y1 = (sin * (r - tickLen)).toFixed(2);
      const x2 = (cos * r).toFixed(2),             y2 = (sin * r).toFixed(2);
      markup += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(0,0,0,0.09)" stroke-width="1"/>`;
    }
    ringSvg.innerHTML = markup;
  }

  // ── Contact form interaction ──
  const contactForm = document.getElementById('contactForm');
  // (Formspree handles the submission natively, so JS intercept is removed)

  // ── Parallax-like float on mouse for hero ──
  const heroContent = document.querySelector('.hero-content');
  const heroSection = document.querySelector('.hero-parallax');
  if (heroContent && heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroContent.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      heroContent.style.transform = '';
    });
  }

  // ── Smooth number counter for stats ──
  const statEls = document.querySelectorAll('[data-count]');
  if (statEls.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          let startTime = null;
          const duration = 1500;
          const easeOut = t => 1 - Math.pow(1 - t, 3);
          
          const animateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;
            if (progress < 1) {
              const current = Math.floor(target * easeOut(progress));
              el.textContent = current + suffix;
              requestAnimationFrame(animateCount);
            } else {
              el.textContent = target + suffix;
            }
          };
          requestAnimationFrame(animateCount);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statEls.forEach(el => counterObserver.observe(el));
  }

  // ── Magnetic Cards Reveal Effect ──
  const magneticCards = document.querySelectorAll('.magnetic-card');
  
  magneticCards.forEach(card => {
    const reveal = card.querySelector('.magnetic-reveal');
    const revealInner = card.querySelector('.magnetic-reveal-inner');
    
    if (!reveal || !revealInner) return;

    let isHovered = false;
    let cardSize = { width: 0, height: 0 };
    
    // Target position (raw mouse) vs Current position (smoothed)
    const targetPos = { x: 0, y: 0 };
    const currentPos = { x: 0, y: 0 };
    let animationFrameId;

    // Smooth lerp function
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const updateSize = () => {
      cardSize = {
        width: card.offsetWidth,
        height: card.offsetHeight
      };
      // Keep the inner text full width of the card
      revealInner.style.width = `${cardSize.width}px`;
      revealInner.style.height = `${cardSize.height}px`;
    };

    const animate = () => {
      if (!isHovered) {
        // Option to stop animation when not hovered, but 
        // we keep it running briefly to finish smoothing out.
      }
      
      currentPos.x = lerp(currentPos.x, targetPos.x, 0.15);
      currentPos.y = lerp(currentPos.y, targetPos.y, 0.15);

      // Move the circle cutout
      reveal.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px) translate(-50%, -50%)`;
      // Move the inner text inversely to keep it fixed relative to the card
      revealInner.style.transform = `translate(${-currentPos.x}px, ${-currentPos.y}px)`;

      animationFrameId = requestAnimationFrame(animate);
    };

    // Update dimensions on resize
    updateSize();
    window.addEventListener('resize', updateSize);

    card.addEventListener('mouseenter', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Snap instantly to enter position
      targetPos.x = x;
      targetPos.y = y;
      currentPos.x = x;
      currentPos.y = y;
      
      isHovered = true;
      card.classList.add('is-hovered');
      
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animate();
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      targetPos.x = e.clientX - rect.left;
      targetPos.y = e.clientY - rect.top;
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      card.classList.remove('is-hovered');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    });

    // ── Touch support: show reveal circle at tap point ──
    card.addEventListener('touchstart', (e) => {
      const rect = card.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      targetPos.x = x;
      targetPos.y = y;
      currentPos.x = x;
      currentPos.y = y;

      isHovered = true;
      card.classList.add('is-hovered');

      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animate();
    }, { passive: true });

    card.addEventListener('touchend', () => {
      isHovered = false;
      card.classList.remove('is-hovered');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    });
  });

  /* ========================================
     BALLOON POP GAME
     ======================================== */
  const balloonCanvas = document.getElementById('balloon-canvas');
  if (balloonCanvas) {
    const ctx = balloonCanvas.getContext("2d");
    const scoreEl = document.getElementById('balloon-score');
    const timerEl = document.getElementById('balloon-timer');
    const overlay = document.getElementById('balloon-overlay'); 
    const finalScoreEl = document.getElementById('final-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const music = document.getElementById('game-music');

    let balloons = [];
    let particles = [];
    const balloonCount = 30; 
    
    let score = 0;
    let timeLeft = 45;
    let gameActive = true;
    let gameStarted = false;
    let timerInterval;
    let canvasW = 0;
    let canvasH = 0;

    const colors = [
      { base: "#ff2e63", light: "#ff6b8f", dark: "#9d0b2e" },
      { base: "#00d2ff", light: "#80eaff", dark: "#006a80" },
      { base: "#ffd700", light: "#fff080", dark: "#998100" },
      { base: "#9d50bb", light: "#c089d8", dark: "#4f285e" },
      { base: "#43e97b", light: "#a6f7c1", dark: "#1e6a38" },
      { base: "#ff9a9e", light: "#fecfef", dark: "#cc7a7e" },
      { base: "#00c9ff", light: "#92fe9d", dark: "#00607a" },
    ];

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 12;
        this.speedY = (Math.random() - 0.5) * 12;
        this.gravity = 0.2;
        this.opacity = 1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.opacity -= 0.025;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class Balloon {
      constructor(first = true) {
        this.init(first);
      }
      init(firstLoad) {
        this.r = Math.random() * 15 + 30;
        this.x = Math.random() * canvasW;
        this.y = firstLoad ? Math.random() * canvasH : canvasH + this.r + 200;

        this.colorSet = colors[Math.floor(Math.random() * colors.length)];
        this.speed = Math.random() * 1 + 0.4;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;
        this.angle = Math.random() * Math.PI * 2;
        this.popped = false;

        this.prevX = this.x;
        this.tailMidY = this.r + 40;
        this.tailEndY = this.r + 120;
        this.tailVelMid = 0;
        this.tailVelEnd = 0;
      }
      drawBalloonPath(r) {
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.bezierCurveTo(-r * 1.2, r * 0.8, -r * 1.3, -r * 1.2, 0, -r * 1.2);
        ctx.bezierCurveTo(r * 1.3, -r * 1.2, r * 1.2, r * 0.8, 0, r);
        ctx.closePath();
      }
      drawString() {
        const dx = this.x - this.prevX;
        this.prevX = this.x;
        const stiffness = 0.08;
        const damping = 0.85;
        const gravity = 0.35;

        const midTarget = this.r + 40 + Math.abs(dx) * 8;
        this.tailVelMid += (midTarget - this.tailMidY) * stiffness;
        this.tailVelMid *= damping;
        this.tailMidY += this.tailVelMid;

        const endTarget = this.r + 120 + Math.abs(dx) * 14;
        this.tailVelEnd += (endTarget - this.tailEndY) * stiffness;
        this.tailVelEnd *= damping;
        this.tailVelEnd += gravity;
        this.tailEndY += this.tailVelEnd;

        const sway = Math.sin(this.angle * 1.8) * 6 + dx * 4;

        ctx.beginPath();
        ctx.moveTo(0, this.r + 5);
        ctx.bezierCurveTo(
          sway, this.tailMidY * 0.5,
          -sway, this.tailMidY,
          sway * 0.6, this.tailEndY
        );
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      pop() {
        if (this.popped) return;
        this.popped = true;
        for (let i = 0; i < 20; i++) {
          particles.push(new Particle(this.x, this.y, this.colorSet.base));
        }
        setTimeout(() => this.init(false), 1000 + Math.random() * 1000);
      }
      update() {
        if (this.popped) return;
        this.y -= this.speed;
        this.angle += this.wobbleSpeed;
        this.x += Math.sin(this.angle * 0.6) * 0.8;
        if (this.y < -this.r - 200) this.init(false);
        this.draw();
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.angle) * 0.06);

        this.drawString();
        this.drawBalloonPath(this.r);
        
        const grad = ctx.createRadialGradient(-this.r * 0.3, -this.r * 0.5, this.r * 0.1, 0, 0, this.r * 1.5);
        grad.addColorStop(0, this.colorSet.light);
        grad.addColorStop(0.4, this.colorSet.base);
        grad.addColorStop(1, this.colorSet.dark);
        
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.restore();
      }
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = balloonCanvas.parentElement.getBoundingClientRect();
      canvasW = rect.width;
      canvasH = rect.height;
      
      balloonCanvas.width = canvasW * dpr;
      balloonCanvas.height = canvasH * dpr;
      balloonCanvas.style.width = `${canvasW}px`;
      balloonCanvas.style.height = `${canvasH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (balloons.length === 0) {
        for (let i = 0; i < balloonCount; i++) balloons.push(new Balloon(true));
      }
    };

    const playMusic = () => {
      if (music) {
        music.volume = 0.5;
        music.play().catch(e => console.log('Audio autoplay prevented'));
      }
    };

    const startGame = () => {
      gameStarted = true;
      gameActive = true;
      score = 0;
      timeLeft = 45;
      scoreEl.textContent = score;
      timerEl.textContent = timeLeft + 's';
      if(overlay) overlay.style.display = 'none';
      
      playMusic();

      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          timeLeft = 0;
          endGame();
        }
        timerEl.textContent = timeLeft + 's';
      }, 1000);
    };

    const endGame = () => {
      gameActive = false;
      clearInterval(timerInterval);
      if(overlay) {
        overlay.style.display = 'flex';
        finalScoreEl.textContent = score;
      }
      if (music) {
        music.pause();
        music.currentTime = 0;
      }
    };

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
         startGame();
         balloons.forEach(b => b.init(true));
      });
    }

    balloonCanvas.addEventListener('mousedown', (e) => {
      if (!gameActive && gameStarted) return; 
      
      const rect = balloonCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      let clickedBalloon = null;
      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        if (b.popped) continue;
        
        const dx = b.x - clickX;
        const dy = b.y - b.r * 0.2 - clickY;
        
        if (Math.sqrt(dx * dx + dy * dy) < b.r + 20) { 
          clickedBalloon = b;
          break; 
        }
      }

      if (clickedBalloon) {
        if (!gameStarted) startGame(); 
        clickedBalloon.pop();
        score++;
        scoreEl.textContent = score;
      }
    });

    balloonCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!gameActive && gameStarted) return; 
      
      const rect = balloonCanvas.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const clickY = touch.clientY - rect.top;
      
      let clickedBalloon = null;
      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        if (b.popped) continue;
        
        const dx = b.x - clickX;
        const dy = b.y - b.r * 0.2 - clickY;
        
        if (Math.sqrt(dx * dx + dy * dy) < b.r + 20) { 
          clickedBalloon = b;
          break; 
        }
      }

      if (clickedBalloon) {
        if (!gameStarted) startGame(); 
        clickedBalloon.pop();
        score++;
        scoreEl.textContent = score;
      }
    }, { passive: false });

    const animate = () => {
      ctx.clearRect(0, 0, canvasW, canvasH);
      
      particles = particles.filter(p => p.opacity > 0);
      particles.forEach(p => { p.update(); p.draw(); });

      balloons.forEach(b => b.update());
      
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
  }

  /* ========================================
     FOOTER BRAND VAPORIZE TEXT EFFECT
     ======================================== */
  const brandWrap = document.getElementById('footer-brand-wrap');
  const brandCanvas = document.getElementById('footer-brand-canvas');
  
  if (brandWrap && brandCanvas) {
    const bCtx = brandCanvas.getContext('2d');
    const brandText = 'BLINK BEYOND';
    let brandParticles = [];
    let brandAnimFrame = null;
    let isHovered = false;
    let isVaporizing = false;
    let isReforming = false;
    let brandCanvasW = 0;
    let brandCanvasH = 0;
    
    // DPR for retina
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Vaporize config
    const SPREAD = 3;
    const VAPORIZE_SPEED = 1.8;
    const REFORM_LERP = 0.06;
    
    // Create particles from text
    function createBrandParticles() {
      if (!bCtx || !brandCanvasW || !brandCanvasH) return;
      
      const w = brandCanvasW;
      const h = brandCanvasH;
      
      // Set canvas dimensions
      brandCanvas.style.width = w + 'px';
      brandCanvas.style.height = h + 'px';
      brandCanvas.width = Math.floor(w * dpr);
      brandCanvas.height = Math.floor(h * dpr);
      
      // Calculate responsive font size
      const fontSize = Math.min(Math.floor(w / 7), Math.floor(h * 0.55), 180);
      const font = '900 ' + (fontSize * dpr) + 'px "Barlow Condensed", sans-serif';
      
      // Render text for sampling
      bCtx.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
      bCtx.fillStyle = 'rgba(255, 255, 255, 1)';
      bCtx.font = font;
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.fillText(brandText, brandCanvas.width / 2, brandCanvas.height / 2);
      
      // Sample pixels
      const imageData = bCtx.getImageData(0, 0, brandCanvas.width, brandCanvas.height);
      const data = imageData.data;
      
      // Calculate sample rate based on DPR
      const sampleRate = Math.max(1, Math.round(dpr));
      
      brandParticles = [];
      
      for (let y = 0; y < brandCanvas.height; y += sampleRate) {
        for (let x = 0; x < brandCanvas.width; x += sampleRate) {
          const idx = (y * brandCanvas.width + x) * 4;
          const alpha = data[idx + 3];
          
          if (alpha > 20) {
            const normalizedAlpha = (alpha / 255) * (sampleRate / dpr);
            brandParticles.push({
              x: x,
              y: y,
              originalX: x,
              originalY: y,
              r: data[idx],
              g: data[idx + 1],
              b: data[idx + 2],
              opacity: normalizedAlpha,
              originalAlpha: normalizedAlpha,
              vx: 0,
              vy: 0,
              speed: 0,
              angle: 0
            });
          }
        }
      }
      
      // Clear and render statically
      bCtx.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
      renderBrandParticles();
    }
    
    // Render particles
    function renderBrandParticles() {
      if (!bCtx) return;
      bCtx.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
      bCtx.save();
      bCtx.scale(dpr, dpr);
      
      for (let i = 0; i < brandParticles.length; i++) {
        const p = brandParticles[i];
        if (p.opacity > 0.01) {
          bCtx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + p.opacity + ')';
          bCtx.fillRect(p.x / dpr, p.y / dpr, 1, 1);
        }
      }
      
      bCtx.restore();
    }
    
    // Vaporize animation
    let lastTime = 0;
    let vaporProgress = 0;
    
    function animateBrand(currentTime) {
      if (!lastTime) lastTime = currentTime;
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      
      if (isVaporizing) {
        vaporProgress += dt * VAPORIZE_SPEED * 100;
        const progress = Math.min(100, vaporProgress);
        
        // Calculate vaporize X position (left to right)
        const textMetrics = bCtx ? bCtx.measureText(brandText) : { width: brandCanvasW * dpr };
        const textWidth = brandCanvasW * dpr;
        const textLeft = (brandCanvas.width - textWidth) / 2;
        const vaporX = textLeft + textWidth * progress / 100;
        
        let allDone = true;
        
        for (let i = 0; i < brandParticles.length; i++) {
          const p = brandParticles[i];
          
          if (p.originalX <= vaporX) {
            // Initialize motion on first contact
            if (p.speed === 0) {
              p.angle = Math.random() * Math.PI * 2;
              p.speed = (Math.random() * 1 + 0.5) * SPREAD;
              p.vx = Math.cos(p.angle) * p.speed;
              p.vy = Math.sin(p.angle) * p.speed;
            }
            
            // Physics
            const dx = p.originalX - p.x;
            const dy = p.originalY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const damping = Math.max(0.95, 1 - dist / (100 * SPREAD));
            
            const spreadX = (Math.random() - 0.5) * SPREAD * 3;
            const spreadY = (Math.random() - 0.5) * SPREAD * 3;
            
            p.vx = (p.vx + spreadX + dx * 0.002) * damping;
            p.vy = (p.vy + spreadY + dy * 0.002) * damping;
            
            // Limit velocity
            const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const maxVel = SPREAD * 2;
            if (vel > maxVel) {
              p.vx *= maxVel / vel;
              p.vy *= maxVel / vel;
            }
            
            p.x += p.vx * dt * 20;
            p.y += p.vy * dt * 10;
            p.opacity = Math.max(0, p.opacity - dt * 0.35);
            
            if (p.opacity > 0.01) allDone = false;
          } else {
            allDone = false;
          }
        }
        
        renderBrandParticles();
        
        if (allDone && vaporProgress >= 100) {
          isVaporizing = false;
          // Keep in vaporized state while hovered
        }
        
      } else if (isReforming) {
        let allBack = true;
        
        for (let i = 0; i < brandParticles.length; i++) {
          const p = brandParticles[i];
          
          // Lerp back to original position
          p.x += (p.originalX - p.x) * REFORM_LERP;
          p.y += (p.originalY - p.y) * REFORM_LERP;
          p.opacity += (p.originalAlpha - p.opacity) * REFORM_LERP;
          
          // Slow down velocity
          p.vx *= 0.9;
          p.vy *= 0.9;
          
          const dx = Math.abs(p.x - p.originalX);
          const dy = Math.abs(p.y - p.originalY);
          const opDiff = Math.abs(p.opacity - p.originalAlpha);
          
          if (dx > 0.5 || dy > 0.5 || opDiff > 0.01) {
            allBack = false;
          }
        }
        
        renderBrandParticles();
        
        if (allBack) {
          // Snap to original
          for (let i = 0; i < brandParticles.length; i++) {
            const p = brandParticles[i];
            p.x = p.originalX;
            p.y = p.originalY;
            p.opacity = p.originalAlpha;
            p.speed = 0;
            p.vx = 0;
            p.vy = 0;
          }
          renderBrandParticles();
          isReforming = false;
          
          if (!isHovered) {
            cancelAnimationFrame(brandAnimFrame);
            brandAnimFrame = null;
            return;
          }
        }
      }
      
      if (isVaporizing || isReforming) {
        brandAnimFrame = requestAnimationFrame(animateBrand);
      }
    }
    
    // Start vaporize loop
    function startVaporize() {
      isVaporizing = true;
      isReforming = false;
      vaporProgress = 0;
      lastTime = 0;
      
      // Reset particles for fresh vaporize
      for (let i = 0; i < brandParticles.length; i++) {
        const p = brandParticles[i];
        p.speed = 0;
        p.vx = 0;
        p.vy = 0;
      }
      
      if (brandAnimFrame) cancelAnimationFrame(brandAnimFrame);
      brandAnimFrame = requestAnimationFrame(animateBrand);
    }
    
    // Start reform
    function startReform() {
      isVaporizing = false;
      isReforming = true;
      lastTime = 0;
      
      if (brandAnimFrame) cancelAnimationFrame(brandAnimFrame);
      brandAnimFrame = requestAnimationFrame(animateBrand);
    }
    
    // Events
    brandWrap.addEventListener('mouseenter', () => {
      isHovered = true;
      startVaporize();
    });
    
    brandWrap.addEventListener('mouseleave', () => {
      isHovered = false;
      startReform();
    });
    
    // Resize handling
    function resizeBrandCanvas() {
      const rect = brandWrap.getBoundingClientRect();
      brandCanvasW = rect.width;
      brandCanvasH = rect.height;
      createBrandParticles();
    }
    
    // Use ResizeObserver for responsive
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        resizeBrandCanvas();
      });
      ro.observe(brandWrap);
    }
    
    window.addEventListener('resize', resizeBrandCanvas);
    
    // Initial render — wait for fonts
    document.fonts.ready.then(() => resizeBrandCanvas());
  }

  /* ========================================
     TESTIMONIAL PARALLAX STACK (SERVICES)
     ======================================== */
  const testimonialStack = document.getElementById('testimonial-stack');
  if (testimonialStack) {
    const cards = document.querySelectorAll('.testimonial-card');
    const seeMore = document.getElementById('testimonials-see-more');
    const seeMoreBtn = document.getElementById('testimonials-see-more-btn');

    // Simple scroll-driven depth effect without extra dependencies
    const handleScroll = () => {
      const rect = testimonialStack.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const center = viewportH / 2;

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.top + cardRect.height / 2;
        const distance = (cardCenter - center) / viewportH; // -1..1

        const translateY = distance * -80; // move up slightly as it crosses center
        const depthScale = 1 - Math.abs(distance) * 0.08;
        const rotateX = distance * -10;
        const opacity = 1 - Math.abs(distance) * 0.5;

        card.style.transform =
          `translate3d(0, ${translateY}px, 0) scale(${depthScale}) rotateX(${rotateX}deg)`;
        card.style.opacity = opacity;
      });

      if (seeMore && rect.top < center && rect.bottom < viewportH * 0.8) {
        seeMore.classList.add('visible');
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    if (seeMoreBtn) {
      seeMoreBtn.addEventListener('click', () => {
        window.location.href = 'testimonials.html';
      });
    }
  }

});

/* ========================================
   GSAP PARALLAX + LENIS SMOOTH SCROLL
   (Runs after DOMContentLoaded, outside it)
   ======================================== */
window.addEventListener('load', () => {
  // Guard: only run if GSAP is available (loaded via CDN on index.html)
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // ── Fonts-ready refresh (catches web font reflows that shift ScrollTrigger positions) ──
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }
  // Debounced resize refresh
  let _stResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_stResizeTimer);
    _stResizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
  });

  // ── Hero Parallax ──
  const triggerElement = document.querySelector('[data-parallax-layers]');

  if (triggerElement) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElement,
        start: '0% 0%',
        end: '100% 0%',
        scrub: 1
      }
    });

    const layers = [
      { layer: '1', yPercent: 70 },
      { layer: '2', yPercent: 55 },
      { layer: '3', yPercent: 40 },
      { layer: '4', yPercent: 10 }
    ];

    layers.forEach((layerObj, idx) => {
      tl.to(
        triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
        {
          yPercent: layerObj.yPercent,
          ease: 'none'
        },
        idx === 0 ? undefined : '<'
      );
    });
  }

  // ── Lamp Effect Observer ──
  const footerLamp = document.getElementById('footer-lamp');
  if (footerLamp) {
    const lampObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footerLamp.classList.add('lamp-active');
          lampObserver.disconnect(); // only animate once
        }
      });
    }, { threshold: 0.3 });
    lampObserver.observe(footerLamp);
  }

  // ── Hero Inner Text — scroll-revealed paragraph ──
  // Skip animation when element lives inside the pinned reel section
  // (it's visible by default there; animating it conflicts with pinning)
  const heroInnerText = document.getElementById('heroInnerText');
  if (heroInnerText && !heroInnerText.closest('#home-reel-section')) {
    gsap.fromTo(heroInnerText,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: heroInnerText,
          start: 'top 80%',
          end: 'top 45%',
          scrub: false,
          toggleActions: 'play none none reverse'
        }
      }
    );
  }

  // ── ARC — Static half-circle fan (Osmo-style) ──
  const arcScene = document.getElementById('arcScene');
  const arcRing  = document.getElementById('arcRing');

  if (arcScene && arcRing && window.innerWidth > 768) {
    const cards      = gsap.utils.toArray('#arcRing > .a-card');
    const total      = cards.length;
    const ringRadius = arcRing.offsetWidth / 2;
    // Guard: if layout hasn't settled yet (offsetWidth = 0), bail out — prevents all
    // cards from stacking at 0,0 which causes the "elements eating each other" overlap
    if (!ringRadius) return;

    // Clone each card once so we have 14 total — fills the full 360° with no blank gap
    cards.forEach((card, i) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.style.pointerEvents = 'none';
      arcRing.appendChild(clone);
    });

    // Re-query so allCards includes originals + clones (14 total)
    const allCards   = gsap.utils.toArray('#arcRing > .a-card');
    const allTotal   = allCards.length;          // 14
    const stepDeg    = 360 / allTotal;           // ~25.7° even spacing

    allCards.forEach((card, i) => {
      const angleDeg = -170 + stepDeg * i;       // start at -170° and go full circle
      const angleRad = angleDeg * (Math.PI / 180);
      const cx = ringRadius + ringRadius * Math.cos(angleRad);
      const cy = ringRadius + ringRadius * Math.sin(angleRad);
      gsap.set(card, {
        left:            cx - card.offsetWidth  / 2,
        top:             cy - card.offsetHeight / 2,
        rotation:        angleDeg + 90,
        transformOrigin: 'center center',
        force3D:         true,
        opacity:         1   // reveal now that position is correct
      });
    });

    // Ring starts at rest
    gsap.set(arcRing, { rotation: 0, force3D: true });

    // ── Continuous auto-rotation — same direction & feel as blue ticker ──
    // Ticker: 25s per cycle ≈ 6.3°/s at this ring size for matching perceived speed
    // Direction: negative (counterclockwise) = cards drift left, same as ticker
    const DEG_PER_SEC = 6.3;
    let autoAngle  = 0;
    let lastTs     = null;

    function rotateTick(ts) {
      if (!lastTs) lastTs = ts;
      const delta = Math.min((ts - lastTs) / 1000, 0.05); // cap at 50ms to avoid jump on tab refocus
      lastTs = ts;
      autoAngle -= DEG_PER_SEC * delta;
      arcRing.style.transform = `translate(-50%, 0) rotate(${autoAngle}deg)`;
      requestAnimationFrame(rotateTick);
    }
    requestAnimationFrame(rotateTick);

  }

});

// ══════════════════════════════════════════
// CINEMATIC TUBE-LIGHT FOOTER
// IntersectionObserver triggers flicker + content reveal
// ══════════════════════════════════════════
(function() {
  const footer = document.getElementById('site-footer');
  const lamp = document.getElementById('footer-lamp');
  if (!footer || !lamp) return;

  let fired = false;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !fired) {
        fired = true;

        // 1. Start flicker animation (CSS handles the keyframes)
        setTimeout(function() {
          lamp.classList.add('lamp-active');
        }, 200); // faster start

        // 2. After flicker completes (~2.5s animation + 0.6s delay = 3.1s),
        //    reveal footer content
        setTimeout(function() {
          footer.classList.add('footer-revealed');
        }, 1400);

        observer.disconnect();
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  observer.observe(footer);
})();

// ══════════════════════════════════════════
// Team Showcase — Scatter Entry Animations
// Each of the 7 cards flies in from a unique direction
// ══════════════════════════════════════════
(function() {
  const teamSection = document.querySelector('.team-showcase-section');
  if (!teamSection || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // [x offset vw, y offset vh, rotation deg] — unique per card index
  const entries = [
    { x: '-80vw', y: '0vh',   rotation: -6  },   // t-1: from far left
    { x: '80vw',  y: '-10vh', rotation: 5   },   // t-2: from far right, slightly up
    { x: '-20vw', y: '70vh',  rotation: -4  },   // t-3: from bottom-left
    { x: '60vw',  y: '-30vh', rotation: 8   },   // t-4: from top-right
    { x: '-90vw', y: '20vh',  rotation: -7  },   // t-5: from far left, slightly down
    { x: '0vw',   y: '80vh',  rotation: 3   },   // t-6: from straight below
    { x: '70vw',  y: '40vh',  rotation: 6   },   // t-7: from bottom-right
  ];

  const wraps = teamSection.querySelectorAll('.team-img-wrap');

  wraps.forEach((wrap, i) => {
    const { x, y, rotation } = entries[i] || { x: '0vw', y: '60vh', rotation: 0 };

    gsap.fromTo(wrap,
      { opacity: 0, x, y, rotation, scale: 0.85 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 90%',
          end: 'center 45%',
          scrub: 1.2,
        }
      }
    );
  });
})();

/* ========================================
   INFO-CARD EXPLORE HINT — ALL SCREENS
   Detects device type: touch (mobile/tablet/iPad) vs hover (laptop/computer)
   Touch  → "TAP TO EXPLORE"   — hint hides permanently on first tap
   Hover  → "HOVER TO EXPLORE" — hint hides permanently on first mouseenter
   ======================================== */
(function () {
  var infocards = document.querySelectorAll('.info-card');
  if (!infocards.length) return;

  // Same media query used in CSS — true for laptop/desktop with a real mouse
  var isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Restore saved state immediately — no hint flash on revisit
  if (localStorage.getItem('bbCardHintSeen')) {
    document.body.classList.add('bb-card-hint-seen');
  }

  function markCardHintSeen() {
    if (document.body.classList.contains('bb-card-hint-seen')) return;
    localStorage.setItem('bbCardHintSeen', '1');
    document.body.classList.add('bb-card-hint-seen');
  }

  if (isHoverDevice) {
    // ── LAPTOP / COMPUTER (mouse hover) ──
    // Hint text says "Hover to Explore" — mark seen on first mouseenter
    infocards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        markCardHintSeen();
      }, { once: true });
    });
  } else {
    // ── MOBILE / TABLET / iPAD (touch) ──
    // Hint text says "Tap to Explore" — mark seen on first tap/click
    infocards.forEach(function (card) {
      card.addEventListener('click', function () {
        markCardHintSeen();
      }, { once: true });
    });
  }
}());

// ── Founder flip-cards ──
// Detects device type: touch (mobile/tablet/iPad) vs hover (laptop/computer)
// Touch  → "TAP FOR INFO"   — click toggles the card flip
// Hover  → "HOVER FOR INFO" — CSS hover reveals info, no flip needed
(function () {
  var flipCards = document.querySelectorAll('.flip-card');
  if (!flipCards.length) return;

  // Same media query used in CSS — matches laptop/desktop with a real mouse
  var isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Restore saved state immediately so hint never flashes on revisit
  if (localStorage.getItem('bbFlipHintSeen')) {
    document.body.classList.add('bb-flip-hint-seen');
  }

  function markHintsSeen() {
    if (document.body.classList.contains('bb-flip-hint-seen')) return;
    localStorage.setItem('bbFlipHintSeen', '1');
    document.body.classList.add('bb-flip-hint-seen');
  }

  if (isHoverDevice) {
    // ── LAPTOP / COMPUTER (mouse hover) ──
    // Info is shown via CSS :hover — no click-flip needed.
    // Just mark hints as permanently seen on first mouseenter.
    flipCards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        markHintsSeen();
      }, { once: true });
    });

  } else {
    // ── MOBILE / TABLET / iPAD (touch) ──
    // No hover, so tapping flips the card to reveal info.
    flipCards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.stopPropagation();
        card.classList.toggle('flipped');
        markHintsSeen();
      });
    });

    // Tap outside any card → unflip all
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.flip-card')) {
        flipCards.forEach(function (card) {
          card.classList.remove('flipped');
        });
      }
    });
  }
}());

/* ========================================
   HOME PAGE — STANDALONE REEL SECTION
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  const homeCard    = document.getElementById('home-card');
  const homeAnchor  = document.getElementById('home-card-anchor');
  const homeSection = document.getElementById('home-reel-section');
  if (!homeCard || !homeAnchor || !homeSection) return;

  function splitWord(el, text) {
    if (el) el.innerHTML = [...text].map(l => `<span class="letter">${l}</span>`).join('');
  }
  splitWord(document.getElementById('hPlay'), 'Play');
  splitWord(document.getElementById('hReel'), 'Reel');

  document.querySelectorAll('#hPlay .letter, #hReel .letter').forEach(l => {
    l.addEventListener('mousemove', e => {
      const r = l.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width  / 2)) / r.width  * 14;
      const y = (e.clientY - (r.top  + r.height / 2)) / r.height * 14;
      l.style.transform = `translate(${x}px, ${y}px)`;
    });
    l.addEventListener('mouseleave', () => { l.style.transform = ''; });
  });

  /* ── Mobile: tap Play/Reel to open video fullscreen ── */
  if (window.innerWidth <= 768) {
    const homePlayBtn = document.querySelector('.home-play-btn');
    const homeFsClose = document.getElementById('home-fs-close');

    if (homePlayBtn && homeCard) {
      homePlayBtn.addEventListener('click', () => {
        homeCard.classList.add('mobile-open');
        document.body.style.overflow = 'hidden';
      });
    }

    if (homeFsClose && homeCard) {
      homeFsClose.addEventListener('click', () => {
        homeCard.classList.remove('mobile-open');
        document.body.style.overflow = '';
      });
    }

    return;
  }

  const homePlayCircle = document.getElementById('home-play-circle');
  const homePlaySvg    = document.getElementById('home-play-svg');
  const homeFsUI       = document.getElementById('home-fs-ui');
  const homeFsFill     = document.getElementById('home-fs-fill');
  const homeInner      = document.getElementById('home-reel-inner');

  let scrollProg = 0, targetProg = 0, rafId = null;
  let isFS = false, progressTimer = null, barW = 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function updateHomeCard() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ar    = homeAnchor.getBoundingClientRect();
    const sRect = homeSection.getBoundingClientRect();

    const t  = ease(Math.max(0, Math.min(1, (scrollProg - .05) / .50)));
    const cW = lerp(ar.width,            vw, t);
    const cH = lerp(ar.height,           vh, t);
    const cX = lerp(ar.left - sRect.left, 0, t);
    const cY = lerp(ar.top  - sRect.top,  0, t);
    const cR = lerp(12, 0, t);

    homeCard.style.width        = cW + 'px';
    homeCard.style.height       = cH + 'px';
    homeCard.style.left         = cX + 'px';
    homeCard.style.top          = cY + 'px';
    homeCard.style.borderRadius = cR + 'px';

    const tf = Math.max(0, 1 - t * 2.8);
    if (homeInner) {
      homeInner.style.opacity       = tf;
      homeInner.style.transform     = `translateY(${-t * 28}px)`;
      homeInner.style.pointerEvents = tf > 0.15 ? 'all' : 'none';
    }
    const cardInfo = homeCard.querySelector('.home-card-info');
    if (cardInfo) cardInfo.style.opacity = String(Math.max(0, 1 - t * 6));

    const pc = lerp(44, 88, t);
    if (homePlayCircle) {
      homePlayCircle.style.width  = pc + 'px';
      homePlayCircle.style.height = pc + 'px';
      const si = Math.round(lerp(16, 28, t));
      if (homePlaySvg) { homePlaySvg.setAttribute('width', si); homePlaySvg.setAttribute('height', si); }
    }

    if (t >= 0.97) {
      if (!isFS) {
        isFS = true;
        if (homeFsUI) homeFsUI.classList.add('show');
        if (homePlayCircle) homePlayCircle.style.opacity = '0';
        homeCard.style.cursor = 'default';
        startProgress();
      }
    } else {
      if (isFS) {
        isFS = false;
        if (homeFsUI) homeFsUI.classList.remove('show');
        if (homePlayCircle) homePlayCircle.style.opacity = '1';
        homeCard.style.cursor = 'pointer';
        stopProgress();
      }
    }
  }

  function startProgress() {
    barW = 0;
    progressTimer = setInterval(() => {
      barW = Math.min(100, barW + 0.12);
      if (homeFsFill) homeFsFill.style.width = barW + '%';
      if (barW >= 100) barW = 0;
    }, 30);
  }
  function stopProgress() {
    clearInterval(progressTimer);
    if (homeFsFill) homeFsFill.style.width = '0%';
  }

  function smoothStep() {
    const delta = targetProg - scrollProg;
    scrollProg += delta * 0.18;
    updateHomeCard();
    if (Math.abs(delta) > 0.001) {
      rafId = requestAnimationFrame(smoothStep);
    } else {
      scrollProg = targetProg;
      updateHomeCard();
      rafId = null;
    }
  }

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: homeSection,
      start: 'top top',
      end: '+=900',
      onUpdate: self => {
        targetProg = self.progress;
        if (!rafId) rafId = requestAnimationFrame(smoothStep);
      }
    });
  }

  setTimeout(() => { homeCard.style.opacity = '1'; updateHomeCard(); }, 150);
  window.addEventListener('resize', updateHomeCard);

  const homeFsClose = document.getElementById('home-fs-close');
  if (homeFsClose) {
    homeFsClose.addEventListener('click', () => {
      homeSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const homePlayBtn = document.querySelector('.home-play-btn');
  if (homePlayBtn) {
    homePlayBtn.addEventListener('mouseenter', () => {
      if (scrollProg < 0.05) homeCard.style.transform = 'scale(1.04)';
    });
    homePlayBtn.addEventListener('mouseleave', () => {
      if (scrollProg < 0.05) homeCard.style.transform = 'scale(1)';
    });
  }
});

/* ========================================
   ABOUT PAGE — EXPANDING REEL CARD
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  const aboutCard    = document.getElementById('about-card');
  const aboutAnchor  = document.getElementById('about-card-anchor');
  const aboutSection = document.getElementById('about-reel-section');
  if (!aboutCard || !aboutAnchor || !aboutSection) return;

  // Split "Play" and "Reel" into individual letters
  function splitWord(el, text) {
    if (el) el.innerHTML = [...text].map(l => `<span class="letter">${l}</span>`).join('');
  }
  splitWord(document.getElementById('aPlay'), 'Play');
  splitWord(document.getElementById('aReel'), 'Reel');

  // Magnetic letter hover
  document.querySelectorAll('#aPlay .letter, #aReel .letter').forEach(l => {
    l.addEventListener('mousemove', e => {
      const r = l.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width  / 2)) / r.width  * 14;
      const y = (e.clientY - (r.top  + r.height / 2)) / r.height * 14;
      l.style.transform = `translate(${x}px, ${y}px)`;
    });
    l.addEventListener('mouseleave', () => { l.style.transform = ''; });
  });

  // Skip animation on mobile
  if (window.innerWidth <= 768) return;

  const aboutPlayCircle = document.getElementById('about-play-circle');
  const aboutPlaySvg    = document.getElementById('about-play-svg');
  const aboutFsUI       = document.getElementById('about-fs-ui');
  const aboutFsFill     = document.getElementById('about-fs-fill');
  const aboutInner      = document.querySelector('.about-reel-inner');

  let scrollProg = 0, targetProg = 0, rafId = null;
  let isFS = false, progressTimer = null, barW = 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function updateAboutCard() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const ar    = aboutAnchor.getBoundingClientRect();
    const sRect = aboutSection.getBoundingClientRect();

    const t  = ease(Math.max(0, Math.min(1, (scrollProg - .05) / .50)));
    const cW = lerp(ar.width,              vw, t);
    const cH = lerp(ar.height,             vh, t);
    const cX = lerp(ar.left - sRect.left,   0, t);
    const cY = lerp(ar.top  - sRect.top,    0, t);
    const cR = lerp(12, 0, t);

    aboutCard.style.width        = cW + 'px';
    aboutCard.style.height       = cH + 'px';
    aboutCard.style.left         = cX + 'px';
    aboutCard.style.top          = cY + 'px';
    aboutCard.style.borderRadius = cR + 'px';

    const tf = Math.max(0, 1 - t * 2.8);
    if (aboutInner) {
      aboutInner.style.opacity      = tf;
      aboutInner.style.transform    = `translateY(${-t * 28}px)`;
      aboutInner.style.pointerEvents = tf > 0.15 ? 'all' : 'none';
    }

    const pc = lerp(44, 88, t);
    if (aboutPlayCircle) {
      aboutPlayCircle.style.width  = pc + 'px';
      aboutPlayCircle.style.height = pc + 'px';
      const si = Math.round(lerp(16, 28, t));
      if (aboutPlaySvg) { aboutPlaySvg.setAttribute('width', si); aboutPlaySvg.setAttribute('height', si); }
    }

    if (t >= 0.97) {
      if (!isFS) {
        isFS = true;
        if (aboutFsUI) aboutFsUI.classList.add('show');
        if (aboutPlayCircle) aboutPlayCircle.style.opacity = '0';
        aboutCard.style.cursor = 'default';
        startProgress();
        // hide navbar for immersive video
        try {
          if (typeof navbarEl !== 'undefined' && navbarEl) {
            navbarEl.classList.add('bb-video-hidden');
            navbarEl.setAttribute('aria-hidden', 'true');
          }
        } catch (e) {}
      }
    } else {
      if (isFS) {
        isFS = false;
        if (aboutFsUI) aboutFsUI.classList.remove('show');
        if (aboutPlayCircle) aboutPlayCircle.style.opacity = '1';
        aboutCard.style.cursor = 'pointer';
        stopProgress();
        // restore navbar when exiting immersive video
        try {
          if (typeof navbarEl !== 'undefined' && navbarEl) {
            navbarEl.classList.remove('bb-video-hidden');
            navbarEl.removeAttribute('aria-hidden');
          }
        } catch (e) {}
      }
    }
  }

  function startProgress() {
    barW = 0;
    progressTimer = setInterval(() => {
      barW = Math.min(100, barW + 0.12);
      if (aboutFsFill) aboutFsFill.style.width = barW + '%';
      if (barW >= 100) barW = 0;
    }, 30);
  }
  function stopProgress() {
    clearInterval(progressTimer);
    if (aboutFsFill) aboutFsFill.style.width = '0%';
  }

  function smoothStep() {
    const delta = targetProg - scrollProg;
    scrollProg += delta * 0.18;
    updateAboutCard();
    if (Math.abs(delta) > 0.001) {
      rafId = requestAnimationFrame(smoothStep);
    } else {
      scrollProg = targetProg;
      updateAboutCard();
      rafId = null;
    }
  }

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: aboutSection,
      start: 'top top',
      end: '+=900',
      pin: true,
      pinSpacing: true,
      onUpdate: self => {
        targetProg = self.progress;
        if (!rafId) rafId = requestAnimationFrame(smoothStep);
      }
    });
  }

  setTimeout(() => { aboutCard.style.opacity = '1'; updateAboutCard(); }, 150);
  window.addEventListener('resize', updateAboutCard);

  const aboutFsClose = document.getElementById('about-fs-close');
  if (aboutFsClose) {
    aboutFsClose.addEventListener('click', () => {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const aboutPlayBtn = document.querySelector('.about-play-btn');
  if (aboutPlayBtn) {
    aboutPlayBtn.addEventListener('mouseenter', () => {
      if (scrollProg < 0.05) aboutCard.style.transform = 'scale(1.04)';
    });
    aboutPlayBtn.addEventListener('mouseleave', () => {
      if (scrollProg < 0.05) aboutCard.style.transform = 'scale(1)';
    });
  }

  // navbar element reference (used to hide during immersive video)
  const navbarEl = document.querySelector('.navbar');

  // ── BB Cards cursor bubble ──
  (function() {
    const bubble = document.getElementById('bbCursorBubble');
    const bubbleText = document.getElementById('bbCursorBubbleText');
    if (!bubble || !bubbleText) return;

    const aboutCard = document.querySelector('.bb-card--about');
    const servicesCard = document.querySelector('.bb-card--services');
    if (!aboutCard && !servicesCard) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let isVisible = false;
    let rafId = null;

    const lerp = (a, b, t) => a + (b - a) * t;

    function tick() {
      currentX = lerp(currentX, targetX, 0.12);
      currentY = lerp(currentY, targetY, 0.12);
      bubble.style.transform = `translate(${currentX}px, ${currentY}px)`;
      rafId = requestAnimationFrame(tick);
    }

    function showBubble(label) {
      bubbleText.textContent = label;
      if (!isVisible) {
        bubble.classList.add('bb-cursor-bubble--visible');
        isVisible = true;
        if (!rafId) rafId = requestAnimationFrame(tick);
      }
    }

    function hideBubble() {
      bubble.classList.remove('bb-cursor-bubble--visible');
      isVisible = false;
    }

    function trackMouse(e) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    if (aboutCard) {
      aboutCard.addEventListener('mouseenter', () => showBubble('ABOUT US'));
      aboutCard.addEventListener('mouseleave', hideBubble);
      aboutCard.addEventListener('mousemove', trackMouse);
    }

    if (servicesCard) {
      servicesCard.addEventListener('mouseenter', () => showBubble('SERVICES'));
      servicesCard.addEventListener('mouseleave', hideBubble);
      servicesCard.addEventListener('mousemove', trackMouse);
    }

    // Sync initial position to avoid bubble flying in from (0,0)
    document.addEventListener('mousemove', (e) => {
      if (!isVisible) { currentX = e.clientX; currentY = e.clientY; }
    }, { passive: true });
  })();

  // Project rows are pure CSS marquee animations — no JS needed here.

  // ── Circular Rotating Badge Stamp ──
  (function initCircularBadge() {
    const badges = document.querySelectorAll('.circular-badge');
    if (!badges.length) return;

    badges.forEach(badge => {
      const textContainer = badge.querySelector('.circular-badge-text');
      const text = badge.getAttribute('data-text') || 'BLINKBEYOND ★ ';
      const spinDuration = parseFloat(badge.getAttribute('data-spin-duration')) || 20;
      if (!textContainer) return;

      // 1. Split text into individual characters and wrap in spans
      const chars = [...text];
      textContainer.innerHTML = '';
      chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.setAttribute('aria-hidden', 'true');
        textContainer.appendChild(span);
      });

      const spans = textContainer.querySelectorAll('span');

      // 2. Position letters on the circle's circumference
      const positionLetters = () => {
        let containerWidth = badge.offsetWidth;
        if (!containerWidth) {
          containerWidth = badge.getBoundingClientRect().width || 120;
        }
        
        // Subtract a bit of padding to fit letters inside container border
        const radius = containerWidth / 2 - 12;
        const totalChars = chars.length;

        spans.forEach((span, index) => {
          const angle = (360 / totalChars) * index;
          // Position tangent to circle (bottom of letter facing center)
          span.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`;
        });
      };

      // Recalculate positions on size changes (handles initial layout and responsive resize)
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          positionLetters();
        });
        ro.observe(badge);
      } else {
        // Fallback for older browsers
        window.addEventListener('resize', positionLetters);
      }

      // 3. Continuous rotation animation via GSAP
      const tween = gsap.to(textContainer, {
        rotation: 360,
        duration: spinDuration,
        ease: 'none',
        repeat: -1
      });

      // 4. Hover behaviors (speedUp 4x faster by default)
      badge.addEventListener('mouseenter', () => {
        gsap.to(tween, { timeScale: 4, duration: 0.5, ease: 'power2.out' });
        gsap.to(badge, { scale: 1.05, duration: 0.4, ease: 'power2.out' });
      });

      badge.addEventListener('mouseleave', () => {
        gsap.to(tween, { timeScale: 1, duration: 0.5, ease: 'power2.out' });
        gsap.to(badge, { scale: 1, duration: 0.4, ease: 'power2.out' });
      });
    });
  })();
});
