/* ================================================
   CURSO · Periodismo de datos con IA
   Comportamiento compartido de las clases (minisite)
   ================================================ */

'use strict';

// ---- REGISTRO DE GRÁFICOS ----
// Cada clase registra sus gráficos de scrollytelling en CURSO.graficos
// antes de que se dispare DOMContentLoaded (scripts con defer, en orden).
// CURSO.redibujar(nombre) vuelve a crear un gráfico (por ejemplo, cuando
// llegan datos nuevos) y lo deja en el paso en el que estaba.
window.CURSO = window.CURSO || { graficos: {} };
window.CURSO.instancias = {};
window.CURSO.redibujar = nombre => window.CURSO.instancias[nombre]?.redibujar();

// ---- UTILIDADES ----
const CURSO_UTIL = {
  reducirMovimiento: window.matchMedia('(prefers-reduced-motion: reduce)'),
  formato(n, decimales = 1) {
    return n.toLocaleString('es-ES', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    });
  },
  media(valores) {
    return valores.reduce((a, b) => a + b, 0) / valores.length;
  },
  mediana(valores) {
    const v = [...valores].sort((a, b) => a - b);
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  },
  moda(valores) {
    const cuenta = new Map();
    valores.forEach(v => cuenta.set(v, (cuenta.get(v) || 0) + 1));
    let max = 0, modas = [];
    cuenta.forEach((n, v) => {
      if (n > max) { max = n; modas = [v]; }
      else if (n === max) modas.push(v);
    });
    return { valores: modas, veces: max };
  },
  guardar(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ }
  },
  leer(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  },
};
window.CURSO.util = CURSO_UTIL;

document.addEventListener('DOMContentLoaded', () => {
  const raiz = document.documentElement;
  const reducir = () => CURSO_UTIL.reducirMovimiento.matches;

  // ---- PROGRESO DE LECTURA Y BARRA SUPERIOR ----
  const progreso = document.querySelector('.progreso');
  const barra = document.querySelector('.barra');
  const portada = document.querySelector('.portada');
  const atajos = document.querySelector('.atajos');
  let atajosMostrados = false;

  function alHacerScroll() {
    const max = raiz.scrollHeight - window.innerHeight;
    if (progreso) progreso.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    if (barra) {
      const umbral = portada ? portada.offsetHeight * 0.6 : 80;
      const visible = window.scrollY > umbral;
      barra.classList.toggle('is-visible', visible);
      if (visible && atajos && !atajosMostrados) {
        atajosMostrados = true;
        atajos.classList.add('is-visible');
        setTimeout(() => atajos.classList.remove('is-visible'), 5000);
      }
    }
  }
  window.addEventListener('scroll', alHacerScroll, { passive: true });
  alHacerScroll();

  // ---- PARALLAX DE LA PORTADA ----
  const capas = portada ? [...portada.querySelectorAll('[data-velocidad]')] : [];
  let pendiente = false;
  function moverCapas() {
    pendiente = false;
    if (reducir()) return;
    const y = window.scrollY;
    if (y > portada.offsetHeight * 1.2) return;
    capas.forEach(capa => {
      const v = parseFloat(capa.dataset.velocidad) || 0;
      capa.style.transform = `translate3d(0, ${y * v}px, 0)`;
    });
  }
  if (capas.length) {
    window.addEventListener('scroll', () => {
      if (!pendiente) { pendiente = true; requestAnimationFrame(moverCapas); }
    }, { passive: true });
    moverCapas();
  }

  // ---- APARICIÓN AL HACER SCROLL ----
  const aparecen = document.querySelectorAll('.aparece');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    aparecen.forEach(el => obs.observe(el));
  } else {
    aparecen.forEach(el => el.classList.add('is-visible'));
  }

  // ---- CONTADORES ----
  // <span data-contar="4.6" data-decimales="1">4,6</span>
  // El HTML ya lleva la cifra final: sin JS se lee igual.
  const contadores = document.querySelectorAll('[data-contar]');
  function contar(el) {
    const fin = parseFloat(el.dataset.contar);
    const dec = parseInt(el.dataset.decimales || '0', 10);
    if (reducir() || isNaN(fin)) { el.textContent = CURSO_UTIL.formato(fin, dec); return; }
    const dur = 1400;
    const t0 = performance.now();
    function paso(t) {
      const p = Math.min((t - t0) / dur, 1);
      const suave = 1 - Math.pow(1 - p, 3);
      el.textContent = CURSO_UTIL.formato(fin * suave, dec);
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  if ('IntersectionObserver' in window) {
    const obsC = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (e.isIntersecting) { contar(e.target); obsC.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    contadores.forEach(el => obsC.observe(el));
  }

  // ---- MUESTRA FRENTE A POBLACIÓN ----
  // <div class="poblacion" data-poblacion data-total="600" data-destacados="25">
  document.querySelectorAll('[data-poblacion]').forEach(caja => {
    const total = parseInt(caja.dataset.total || '600', 10);
    const destacados = parseInt(caja.dataset.destacados || '25', 10);
    const elegidos = new Set();
    let semilla = 7;
    while (elegidos.size < destacados) {
      semilla = (semilla * 9301 + 49297) % 233280;
      elegidos.add(Math.floor((semilla / 233280) * total));
    }
    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const p = document.createElement('span');
      p.className = 'poblacion__punto' + (elegidos.has(i) ? ' poblacion__punto--clase' : '');
      if (elegidos.has(i)) p.style.transitionDelay = `${(i % 25) * 40 + 400}ms`;
      frag.appendChild(p);
    }
    caja.appendChild(frag);
  });

  // ---- SCROLLYTELLING ----
  // <div class="scrolly" data-scrolly="nombreGrafico">
  //   <div class="scrolly__grafico"><svg class="scrolly__svg"></svg></div>
  //   <div class="scrolly__pasos"><div class="scrolly__paso" data-paso="0">…
  document.querySelectorAll('[data-scrolly]').forEach(scrolly => {
    const crear = window.CURSO.graficos[scrolly.dataset.scrolly];
    const contenedor = scrolly.querySelector('.scrolly__grafico');
    const svg = scrolly.querySelector('.scrolly__svg');
    const pasos = [...scrolly.querySelectorAll('.scrolly__paso')];
    if (!crear || !svg) return;
    let grafico = crear(svg);
    let actual = -1;
    window.CURSO.instancias[scrolly.dataset.scrolly] = {
      redibujar() {
        svg.replaceChildren();
        grafico = crear(svg);
        grafico.paso(Math.max(actual, 0));
      },
    };

    function activar(n) {
      if (n === actual) return;
      actual = n;
      contenedor.dataset.paso = n;
      pasos.forEach(p => p.classList.toggle('is-activo', +p.dataset.paso === n));
      grafico.paso(n);
    }

    const obsP = new IntersectionObserver(entradas => {
      entradas.forEach(e => { if (e.isIntersecting) activar(+e.target.dataset.paso); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    pasos.forEach(p => obsP.observe(p));
    activar(0);
  });

  // ---- COPIAR PROMPTS ----
  document.querySelectorAll('.prompt__copiar').forEach(boton => {
    boton.addEventListener('click', async () => {
      const texto = boton.closest('.prompt').querySelector('.prompt__texto').innerText.trim();
      let ok = false;
      try {
        await navigator.clipboard.writeText(texto);
        ok = true;
      } catch (e) {
        const area = document.createElement('textarea');
        area.value = texto;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        area.remove();
      }
      const original = boton.dataset.texto || boton.textContent;
      boton.dataset.texto = original;
      boton.textContent = ok ? 'Copiado' : 'Selecciona y copia';
      boton.classList.toggle('is-copiado', ok);
      setTimeout(() => { boton.textContent = original; boton.classList.remove('is-copiado'); }, 2000);
    });
  });

  // ---- ÍNDICE LATERAL ----
  const indice = document.querySelector('.indice');
  const secciones = [...document.querySelectorAll('[data-seccion]')];
  if (indice && secciones.length) {
    const enlaces = [...indice.querySelectorAll('.indice__enlace')];
    const obsS = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        enlaces.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false'));
        indice.classList.toggle('indice--claro', e.target.dataset.tono === 'oscuro');
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    secciones.forEach(s => obsS.observe(s));
  }

  // ---- MODO PROYECTOR ----
  const botonProyector = document.querySelector('[data-accion="proyector"]');
  function ponerProyector(activo) {
    raiz.classList.toggle('modo-proyector', activo);
    botonProyector?.setAttribute('aria-pressed', String(activo));
    CURSO_UTIL.guardar('curso-proyector', activo ? '1' : '0');
  }
  if (CURSO_UTIL.leer('curso-proyector') === '1') ponerProyector(true);
  botonProyector?.addEventListener('click', () => ponerProyector(!raiz.classList.contains('modo-proyector')));

  // ---- NAVEGACIÓN CON TECLADO Y MANDO ----
  // → / ← y Avance/Retroceso de página (los mandos de presentación envían estas
  // teclas) saltan entre elementos con data-parada. «P» cambia el modo proyector
  // y «F» pone la pantalla completa.
  function destinos() {
    const alto = window.innerHeight;
    const barraAlto = barra ? barra.offsetHeight : 0;
    return [...document.querySelectorAll('[data-parada]')].map(el => {
      const r = el.getBoundingClientRect();
      const arriba = r.top + window.scrollY;
      return el.dataset.parada === 'centro'
        ? Math.max(0, arriba + r.height / 2 - alto / 2)
        : Math.max(0, arriba - barraAlto - 16);
    }).sort((a, b) => a - b);
  }
  function irA(direccion) {
    const y = window.scrollY;
    const lista = destinos();
    const destino = direccion > 0
      ? lista.find(t => t > y + 8)
      : [...lista].reverse().find(t => t < y - 8);
    if (destino === undefined) return;
    window.scrollTo({ top: destino, behavior: reducir() ? 'auto' : 'smooth' });
  }
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault(); irA(1); break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault(); irA(-1); break;
      case 'p':
      case 'P':
        ponerProyector(!raiz.classList.contains('modo-proyector')); break;
      case 'f':
      case 'F':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else raiz.requestFullscreen?.();
        break;
    }
  });
});
