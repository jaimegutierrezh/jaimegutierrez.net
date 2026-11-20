/* ================================================
   CLASE 1 · Tu vida en datos
   Datos y gráficos propios de esta clase
   ================================================ */

'use strict';

// ---- DATOS DE EJEMPLO ----
// Horas de pantalla al día de una clase FICTICIA (25 personas).
// Son los mismos valores que datos/encuesta_ejemplo.csv. El día de clase
// se sustituyen por las respuestas reales de la encuesta.
const HORAS_PANTALLA = [
  4.5, 6.2, 3.6, 5.0, 15, 4.1, 7.0, 3.2, 4.4, 5.5, 2.5, 4.8, 6.0,
  4.2, 3.8, 5.3, 4.5, 3.0, 6.6, 4.3, 5.1, 3.5, 4.6, 5.8, 4.0,
];
const ATIPICO = 15;

// ---- GRÁFICO: MEDIA, MEDIANA Y MODA ----
// Diagrama de puntos apilados (un punto por persona) con las líneas de
// media y mediana. Cada paso del scrollytelling activa un estado.
window.CURSO.graficos.mediaMediana = function crear(svg) {
  const U = window.CURSO.util;
  const NS = 'http://www.w3.org/2000/svg';
  const ancho = 480, alto = 300;
  const m = { izq: 16, der: 24, arr: 56, aba: 56 };
  const xMax = 16;
  const r = 6.5; // cabe en un intervalo de media hora (13,5 unidades) sin solaparse
  const base = alto - m.aba;
  const x = v => m.izq + (v / xMax) * (ancho - m.izq - m.der);

  const sinAtipico = HORAS_PANTALLA.filter(v => v !== ATIPICO);
  const media25 = U.media(HORAS_PANTALLA);
  const media24 = U.media(sinAtipico);
  const mediana = U.mediana(HORAS_PANTALLA);
  const moda = U.moda(HORAS_PANTALLA).valores;

  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    `Horas de pantalla al día de 25 personas. Media ${U.formato(media25)} horas; ` +
    `mediana ${U.formato(mediana)} horas; una persona declara ${ATIPICO} horas.`);

  function el(nombre, attrs = {}, padre = svg) {
    const n = document.createElementNS(NS, nombre);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    padre.appendChild(n);
    return n;
  }

  // Eje
  el('line', { class: 'g-eje', x1: m.izq, x2: ancho - m.der, y1: base, y2: base });
  for (let h = 0; h <= xMax; h += 2) {
    el('line', { class: 'g-eje', x1: x(h), x2: x(h), y1: base, y2: base + 6 });
    const t = el('text', { class: 'g-marca', x: x(h), y: base + 24, 'text-anchor': 'middle' });
    t.textContent = h === xMax ? `${h} h` : h;
  }
  const tituloEje = el('text', { class: 'g-titulo-eje', x: m.izq, y: base + 48 });
  tituloEje.textContent = 'Horas al día con el móvil · cada punto es una persona';

  // Puntos apilados en intervalos de media hora
  const pilas = new Map();
  const puntos = [...HORAS_PANTALLA].sort((a, b) => a - b).map(v => {
    const tramo = Math.round(v * 2) / 2;
    const k = pilas.get(tramo) || 0;
    pilas.set(tramo, k + 1);
    const c = el('circle', {
      class: 'g-punto' + (v === ATIPICO ? ' g-punto--atipico' : ''),
      cx: x(tramo), cy: base - r - 3 - k * (2 * r + 1.5), r,
    });
    c.dataset.valor = v;
    return c;
  });
  const puntoAtipico = puntos.find(p => +p.dataset.valor === ATIPICO);
  const anillo = el('circle', {
    class: 'g-anillo',
    cx: puntoAtipico.getAttribute('cx'), cy: puntoAtipico.getAttribute('cy'), r: r + 6,
  });

  // Líneas de referencia: se dibujan en x = 0 y se desplazan con transform
  function capaLinea(clase, texto, anclaje) {
    const g = el('g', { class: `g-capa ${clase}` });
    el('line', { class: 'g-linea', x1: 0, x2: 0, y1: m.arr - 10, y2: base }, g);
    const t = el('text', {
      class: 'g-etiqueta', x: anclaje === 'end' ? -8 : 8, y: m.arr - 16, 'text-anchor': anclaje,
    }, g);
    t.textContent = texto;
    return { g, t };
  }
  const lMediana = capaLinea('g-mediana', `Mediana ${U.formato(mediana)} h`, 'end');
  const lMedia = capaLinea('g-media', '', 'start');
  lMediana.g.style.transform = `translateX(${x(mediana)}px)`;

  function ponerMedia(valor) {
    lMedia.g.style.transform = `translateX(${x(valor)}px)`;
    lMedia.t.textContent = `Media ${U.formato(valor)} h`;
  }
  ponerMedia(media25);

  // Estados de cada paso
  const estados = [
    { media: null, anillo: false, mediana: false, atenuar: false, moda: false, latido: false },
    { media: media25, anillo: false, mediana: false, atenuar: false, moda: false, latido: false },
    { media: media25, anillo: true, mediana: false, atenuar: false, moda: false, latido: false },
    { media: media25, anillo: true, mediana: true, atenuar: false, moda: false, latido: false },
    { media: media24, anillo: false, mediana: true, atenuar: true, moda: false, latido: false },
    { media: media24, anillo: false, mediana: true, atenuar: true, moda: true, latido: false },
    { media: media25, anillo: true, mediana: true, atenuar: false, moda: false, latido: true },
  ];

  return {
    paso(n) {
      const e = estados[Math.max(0, Math.min(n, estados.length - 1))];
      lMedia.g.classList.toggle('is-visible', e.media !== null);
      if (e.media !== null) ponerMedia(e.media);
      lMediana.g.classList.toggle('is-visible', e.mediana);
      anillo.classList.toggle('is-visible', e.anillo);
      anillo.classList.toggle('is-latido', e.latido);
      puntoAtipico.classList.toggle('is-atenuado', e.atenuar);
      puntos.forEach(p => p.classList.toggle('g-punto--moda', e.moda && moda.includes(+p.dataset.valor)));
    },
  };
};
