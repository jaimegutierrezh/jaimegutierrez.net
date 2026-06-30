/* ================================================
   JAIME GUTIÉRREZ — jaimegutierrez.net
   ================================================ */

'use strict';

// ---- NAV: fondo al hacer scroll ----
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 50);
}, { passive: true });

// ---- NAV: toggle móvil ----
const navToggle = document.getElementById('navToggle');
const navList   = document.getElementById('navList');

navToggle?.addEventListener('click', () => {
  const isOpen = navList.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', isOpen);
  const [s1, s2] = navToggle.querySelectorAll('span');
  s1.style.transform = isOpen ? 'rotate(45deg) translate(3.5px, 3.5px)' : '';
  s2.style.transform = isOpen ? 'rotate(-45deg) translate(3.5px, -3.5px)' : '';
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

navList?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navList.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.querySelectorAll('span').forEach(s => s.style.transform = '');
    document.body.style.overflow = '';
  });
});

// ---- HERO: canvas de puntos ----
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let dots = [];
  const SPACING = 36;

  function build() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    dots = [];

    const cols = Math.ceil(canvas.width  / SPACING) + 1;
    const rows = Math.ceil(canvas.height / SPACING) + 1;
    const cx   = canvas.width  / 2;
    const cy   = canvas.height / 2;
    const maxD = Math.hypot(cx, cy);

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const x = c * SPACING;
        const y = r * SPACING;
        const d = Math.hypot(x - cx, y - cy);
        const base = (1 - d / maxD) * 0.5 + 0.05;
        dots.push({
          x, y,
          r: Math.random() > 0.88 ? 1.8 : 1,
          a: base * (0.7 + Math.random() * 0.3),
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dots.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(15,14,12,${d.a})`;
      ctx.fill();
    });
  }

  build();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); draw(); }, 200);
  }, { passive: true });
})();

// ---- SKILL BARS: animar al entrar en viewport ----
(function initSkillBars() {
  const fills = document.querySelectorAll('.skill__fill');
  if (!fills.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.width = (el.dataset.w || 0) + '%';
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.4 });

  fills.forEach(f => obs.observe(f));
})();

// ---- REVEAL: fade-in al hacer scroll ----
(function initReveal() {
  const targets = document.querySelectorAll(
    '.work-card, .teaching-item, .about__lead, .about__text p, .about__photo-wrap, .about__skills, .contact__heading'
  );
  if (!targets.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, i * 70);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => {
    el.classList.add('reveal');
    obs.observe(el);
  });
})();

// ---- SMOOTH SCROLL para links de ancla ----
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const offset = document.getElementById('nav')?.offsetHeight ?? 52;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth',
    });
  });
});
