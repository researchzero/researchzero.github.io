/* ============================================
   ResearchZero website scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initMobileMenu();
  initHeroReveal();
  initScrollAnimations();
  initCounters();
  initCarousel();
  initParticleCanvas();
  initTimelineFill();
  initStatBars();
});

/* --- Sticky Nav --- */
function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --- Mobile Menu --- */
function initMobileMenu() {
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* --- Hero text stagger reveal --- */
function initHeroReveal() {
  const elements = document.querySelectorAll('.reveal-text');
  if (!elements.length) return;

  elements.forEach(el => {
    const delay = parseInt(el.dataset.delay || '0', 10);
    setTimeout(() => {
      el.classList.add('revealed');
    }, 300 + delay);
  });
}

/* --- Scroll Animations (IntersectionObserver) --- */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* --- Animated Counters --- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  let animated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateCounters(counters);
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach(el => observer.observe(el));
}

function animateCounters(counters) {
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.count, 10);
    const suffix = counter.dataset.suffix || '';
    const prefix = counter.dataset.prefix || '';
    const duration = 2200;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(target * eased);
      counter.textContent = prefix + current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  });
}

/* --- Testimonial Carousel --- */
function initCarousel() {
  const track = document.querySelector('.testimonials-track');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  if (!track || !dots.length) return;

  let current = 0;
  const total = dots.length;

  function goTo(index) {
    current = ((index % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  let autoplay = setInterval(() => goTo(current + 1), 6000);
  const carousel = document.querySelector('.testimonials-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', () => clearInterval(autoplay));
    carousel.addEventListener('mouseleave', () => {
      autoplay = setInterval(() => goTo(current + 1), 6000);
    });
  }
}

/* --- Hero Canvas — Enhanced Network with Hex Grid (light bg) --- */
function initParticleCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w, h, cx, cy;
  let nodes = [];
  let pulses = [];
  let hexGrid = [];
  let mouse = { x: -9999, y: -9999 };
  let animFrame = null;
  let pulseTimer = null;
  let running = false;
  let heroVisible = false;
  let lastDraw = 0;

  const NODE_COUNT = 64;
  const CONNECTION_DIST = 140;
  const MOUSE_RADIUS = 180;
  const FRAME_INTERVAL = 1000 / 30;
  // Colors that work on the light #fafafa background
  const RED = [185, 28, 28];
  const GRAY = [120, 120, 130];

  function resize() {
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
    buildHexGrid();
  }

  function buildHexGrid() {
    hexGrid = [];
    const size = 40;
    const hSpacing = size * 1.732;
    const vSpacing = size * 1.5;
    const cols = Math.ceil(w / hSpacing) + 2;
    const rows = Math.ceil(h / vSpacing) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * hSpacing + (row % 2 ? hSpacing / 2 : 0);
        const y = row * vSpacing;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.min(w, h) * 0.5;

        if (dist < maxDist) {
          hexGrid.push({ x, y, size: size * 0.95, dist });
        }
      }
    }
  }

  function drawHexagon(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = x + size * Math.cos(angle);
      const hy = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  }

  function createNodes() {
    nodes = [];
    const maxR = Math.min(w, h) * 0.44;
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.55) * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      nodes.push({
        x, y, ox: x, oy: y,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.8 + 0.8,
        phase: Math.random() * Math.PI * 2,
        glow: 0,
        diamond: Math.random() > 0.75,
      });
    }
  }

  function emitPulse() {
    if (!running) return;
    if (pulses.length > 4) pulses.shift();
    pulses.push({ r: 0, maxR: Math.min(w, h) * 0.48, alpha: 0.35 });
  }

  function draw(time) {
    if (!running) {
      animFrame = null;
      return;
    }
    if (time - lastDraw < FRAME_INTERVAL) {
      animFrame = requestAnimationFrame(draw);
      return;
    }
    lastDraw = time;

    ctx.clearRect(0, 0, w, h);
    const t = time * 0.001;

    // --- Hex grid background (very subtle on light) ---
    for (const hex of hexGrid) {
      const maxDist = Math.min(w, h) * 0.5;
      const distFade = 1 - hex.dist / maxDist;
      const pulseEffect = Math.sin(t * 0.5 + hex.dist * 0.005) * 0.01;
      const alpha = distFade * 0.025 + pulseEffect;

      drawHexagon(hex.x, hex.y, hex.size);
      ctx.strokeStyle = `rgba(${GRAY.join(',')}, ${Math.max(0, alpha)})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // --- Reference rings (dashed, subtle) ---
    const ringRadii = [0.08, 0.18, 0.3, 0.42];
    for (const pct of ringRadii) {
      const r = Math.min(w, h) * pct;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GRAY.join(',')}, 0.04)`;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // --- Crosshair ---
    const chLen = 30;
    const chGap = 12;
    ctx.strokeStyle = `rgba(${RED.join(',')}, 0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - chGap); ctx.lineTo(cx, cy - chGap - chLen);
    ctx.moveTo(cx, cy + chGap); ctx.lineTo(cx, cy + chGap + chLen);
    ctx.moveTo(cx - chGap, cy); ctx.lineTo(cx - chGap - chLen, cy);
    ctx.moveTo(cx + chGap, cy); ctx.lineTo(cx + chGap + chLen, cy);
    ctx.stroke();

    // Diamond at crosshair center
    ctx.strokeStyle = `rgba(${RED.join(',')}, 0.12)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 6, cy);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx - 6, cy);
    ctx.closePath();
    ctx.stroke();

    // --- Update & draw pulses ---
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.r += 1.8;
      p.alpha = 0.3 * (1 - p.r / p.maxR);
      if (p.r >= p.maxR) { pulses.splice(i, 1); continue; }

      ctx.beginPath();
      ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${RED.join(',')}, ${p.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // --- Update nodes ---
    for (const n of nodes) {
      n.x = n.ox + Math.sin(t * 0.4 + n.phase) * 6 + n.vx * Math.sin(t * 0.3) * 10;
      n.y = n.oy + Math.cos(t * 0.35 + n.phase) * 6 + n.vy * Math.cos(t * 0.3) * 10;

      const mdx = n.x - mouse.x;
      const mdy = n.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < MOUSE_RADIUS && mdist > 0) {
        const force = (1 - mdist / MOUSE_RADIUS) * 25;
        n.x += (mdx / mdist) * force;
        n.y += (mdy / mdist) * force;
      }

      n.glow *= 0.94;
      for (const p of pulses) {
        const pdx = n.ox - cx;
        const pdy = n.oy - cy;
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (Math.abs(pDist - p.r) < 35) {
          n.glow = Math.max(n.glow, p.alpha * 2.5);
        }
      }
    }

    // --- Draw connections ---
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const fade = 1 - dist / CONNECTION_DIST;
          const glow = Math.max(nodes[i].glow, nodes[j].glow);
          const alpha = fade * (0.06 + glow * 0.25);
          const color = glow > 0.1 ? RED : GRAY;
          ctx.strokeStyle = `rgba(${color.join(',')}, ${alpha})`;
          ctx.lineWidth = 0.6 + glow * 0.8;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // --- Draw nodes ---
    for (const n of nodes) {
      if (n.glow > 0.08) {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size * 6);
        grad.addColorStop(0, `rgba(${RED.join(',')}, ${n.glow * 0.4})`);
        grad.addColorStop(1, `rgba(${RED.join(',')}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      const baseAlpha = 0.18 + n.glow * 0.6;
      const color = n.glow > 0.15 ? RED : GRAY;
      ctx.fillStyle = `rgba(${color.join(',')}, ${baseAlpha})`;
      ctx.beginPath();

      // Some nodes drawn as diamonds for futuristic feel
      if (n.diamond) {
        const s = n.size + n.glow * 1.5;
        ctx.moveTo(n.x, n.y - s * 1.4);
        ctx.lineTo(n.x + s * 1.4, n.y);
        ctx.lineTo(n.x, n.y + s * 1.4);
        ctx.lineTo(n.x - s * 1.4, n.y);
        ctx.closePath();
      } else {
        ctx.arc(n.x, n.y, n.size + n.glow * 1.5, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // --- Center glow ---
    const centerPulse = 0.25 + Math.sin(t * 1.5) * 0.08;
    const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    cGrad.addColorStop(0, `rgba(${RED.join(',')}, ${centerPulse})`);
    cGrad.addColorStop(0.5, `rgba(${RED.join(',')}, ${centerPulse * 0.3})`);
    cGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fill();

    // Center dot
    ctx.fillStyle = `rgba(${RED.join(',')}, 0.7)`;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();

    animFrame = requestAnimationFrame(draw);
  }

  function start() {
    if (running || !heroVisible || document.hidden) return;
    running = true;
    emitPulse();
    pulseTimer = setInterval(emitPulse, 3500);
    if (animFrame === null) {
      animFrame = requestAnimationFrame(draw);
    }
  }

  function stop() {
    if (!running && animFrame === null && pulseTimer === null) return;
    running = false;
    pulses = [];
    if (animFrame !== null) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    if (pulseTimer !== null) {
      clearInterval(pulseTimer);
      pulseTimer = null;
    }
  }

  if (window.innerWidth > 768) {
    resize();
    createNodes();

    window.addEventListener('resize', () => { resize(); createNodes(); });

    const hero = document.getElementById('hero') || canvas.closest('.hero, .chain-hero');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    }

    const heroSection = hero || canvas.parentElement;
    if (heroSection && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            heroVisible = false;
            stop();
          } else {
            heroVisible = true;
            start();
          }
        });
      }, { threshold: 0 });
      observer.observe(heroSection);
    } else {
      heroVisible = true;
      start();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });
  }
}

/* --- Timeline line fill on scroll --- */
function initTimelineFill() {
  const fill = document.querySelector('.timeline-line-fill');
  const timeline = document.querySelector('.process-timeline');
  if (!fill || !timeline) return;

  function updateFill() {
    const rect = timeline.getBoundingClientRect();
    const timelineTop = rect.top;
    const timelineHeight = rect.height;
    const viewportCenter = window.innerHeight * 0.6;

    if (timelineTop > viewportCenter) {
      fill.style.height = '0%';
    } else {
      const progress = Math.min(1, (viewportCenter - timelineTop) / timelineHeight);
      fill.style.height = `${progress * 100}%`;
    }
  }

  window.addEventListener('scroll', updateFill, { passive: true });
  updateFill();
}

/* --- Stat bar animations --- */
function initStatBars() {
  const cards = document.querySelectorAll('.stat-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.stat-bar-fill');
          if (fill) {
            const width = fill.style.width;
            fill.style.setProperty('--fill-width', width);
            fill.style.width = '0';
            entry.target.classList.add('animated');
            requestAnimationFrame(() => {
              fill.style.width = width;
            });
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  cards.forEach(card => observer.observe(card));
}
