/* ================================================
   CURSO · Rutas opcionales (desvíos)
   Comportamiento compartido: reloj de años, antes y después,
   conmutadores y piezas que se animan al entrar en pantalla.
   Requiere curso.js (cargado antes, con defer).
   ================================================ */

'use strict';

// ---- REGISTRO DE PIEZAS ----
// Cada ruta registra sus piezas antes de DOMContentLoaded:
//   RUTAS.piezas.nombre = elemento => ({ estado(valor) {}, entrar() {} })
// <div data-pieza="nombre" data-estado="inicial">…</div>
// estado(valor) lo llaman los conmutadores; entrar() se llama la primera vez
// que la pieza aparece en pantalla (para las animaciones).
window.RUTAS = window.RUTAS || { piezas: {} };

// Utilidad para crear SVG sin repetir el espacio de nombres
window.RUTAS.svg = function (etiqueta, atributos = {}, padre) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', etiqueta);
  Object.entries(atributos).forEach(([k, v]) => { if (v !== undefined && v !== null) el.setAttribute(k, v); });
  if (padre) padre.appendChild(el);
  return el;
};
window.RUTAS.reducir = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  const reducir = window.RUTAS.reducir;

  // ---- PIEZAS ----
  const instancias = new Map();
  document.querySelectorAll('[data-pieza]').forEach(el => {
    const crear = window.RUTAS.piezas[el.dataset.pieza];
    if (!crear) return;
    const pieza = crear(el) || {};
    instancias.set(el.dataset.pieza, { el, pieza });
    if (el.dataset.estado && pieza.estado) pieza.estado(el.dataset.estado);
  });
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        e.target.classList.add('is-visible');
        instancias.get(e.target.dataset.pieza)?.pieza.entrar?.();
      });
    }, { threshold: 0.3 });
    instancias.forEach(({ el }) => obs.observe(el));
  } else {
    instancias.forEach(({ el, pieza }) => { el.classList.add('is-visible'); pieza.entrar?.(); });
  }

  // ---- CONMUTADORES ----
  // <div class="conmutador" data-para="nombre"><button data-estado="a">…
  document.querySelectorAll('.conmutador[data-para]').forEach(grupo => {
    const destino = instancias.get(grupo.dataset.para);
    const botones = [...grupo.querySelectorAll('[data-estado]')];
    if (!destino) { grupo.hidden = true; return; }
    const marcar = valor => botones.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.estado === valor)));
    marcar(destino.el.dataset.estado);
    botones.forEach(b => b.addEventListener('click', () => {
      destino.el.dataset.estado = b.dataset.estado;
      destino.pieza.estado?.(b.dataset.estado);
      marcar(b.dataset.estado);
    }));
  });

  // ---- REPETIR UNA ANIMACIÓN ----
  // <button class="repetir" data-repetir="nombre">
  document.querySelectorAll('[data-repetir]').forEach(boton => {
    const destino = instancias.get(boton.dataset.repetir);
    if (!destino?.pieza.entrar) { boton.hidden = true; return; }
    boton.addEventListener('click', () => destino.pieza.entrar(true));
  });

  // ---- ANTES Y DESPUÉS ----
  // <div class="antesdespues" data-antesdespues> … <input class="antesdespues__rango" type="range">
  document.querySelectorAll('[data-antesdespues]').forEach(caja => {
    const rango = caja.querySelector('.antesdespues__rango');
    if (!rango) return;
    const poner = () => caja.style.setProperty('--pos', `${rango.value}%`);
    rango.addEventListener('input', poner);
    poner();
    // Pequeño vaivén la primera vez que aparece, para que se vea que se mueve
    if (!reducir() && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const inicio = +rango.value;
        const t0 = performance.now();
        const paso = t => {
          const p = Math.min((t - t0) / 1600, 1);
          rango.value = inicio + Math.sin(p * Math.PI * 2) * 18 * (1 - p);
          poner();
          if (p < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      }, { threshold: 0.6 });
      obs.observe(caja);
    }
  });

  // ---- TARJETAS QUE SE GIRAN ----
  document.querySelectorAll('.giro__carta').forEach(carta => {
    carta.addEventListener('click', () => {
      carta.setAttribute('aria-pressed', String(carta.getAttribute('aria-pressed') !== 'true'));
    });
  });

  // ---- RELOJ DE AÑOS ----
  // Lee data-anio de cada .parada y data-era / data-tono-reloj de su .etapa
  const reloj = document.querySelector('.reloj');
  const paradas = [...document.querySelectorAll('.parada[data-anio]')];
  if (reloj && paradas.length && 'IntersectionObserver' in window) {
    const anio = reloj.querySelector('.reloj__anio');
    const era = reloj.querySelector('.reloj__era');
    let mostrado = parseInt(paradas[0].dataset.anio, 10);
    let animacion = 0;
    const contarHasta = fin => {
      cancelAnimationFrame(animacion);
      const inicio = mostrado;
      if (reducir() || inicio === fin) { mostrado = fin; anio.textContent = fin; return; }
      const t0 = performance.now();
      const paso = t => {
        const p = Math.min((t - t0) / 700, 1);
        mostrado = Math.round(inicio + (fin - inicio) * (1 - Math.pow(1 - p, 3)));
        anio.textContent = mostrado;
        if (p < 1) animacion = requestAnimationFrame(paso);
      };
      animacion = requestAnimationFrame(paso);
    };
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        const p = e.target;
        const etapa = p.closest('.etapa');
        contarHasta(parseInt(p.dataset.anio, 10));
        era.textContent = etapa?.dataset.era || '';
        reloj.dataset.tono = etapa?.dataset.tonoReloj || '';
        reloj.style.setProperty('--avance', paradas.indexOf(p) / Math.max(paradas.length - 1, 1));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    paradas.forEach(p => obs.observe(p));

    // Solo se ve dentro de la cronología
    const primera = document.querySelector('.etapa');
    const ultima = [...document.querySelectorAll('.etapa')].pop();
    const ver = () => {
      const y = window.innerHeight / 2;
      const dentro = primera.getBoundingClientRect().top < y && ultima.getBoundingClientRect().bottom > y;
      reloj.classList.toggle('is-visible', dentro);
    };
    window.addEventListener('scroll', ver, { passive: true });
    ver();
  }
});
