/* ================================================
   CLASE 3 · El gráfico justo
   Scrollytelling: los mismos datos de ESTUDES responden a preguntas
   distintas, y cada pregunta pide su gráfico.
   Datos: ../datos/estudes_consumo_14_18_1998_2025.csv (Ministerio de Sanidad)
   ================================================ */

'use strict';

// ---- DATOS ----
const RUTA_CSV = '../datos/estudes_consumo_14_18_1998_2025.csv';
const SERIES = [
  { clave: 'alcohol_ultimos_30_dias', nombre: 'Alcohol', tono: 'a' },
  { clave: 'tabaco_ultimos_30_dias', nombre: 'Tabaco', tono: 'b' },
  { clave: 'cannabis_ultimos_30_dias', nombre: 'Cannabis', tono: 'c' },
];
let FILAS = null; // [{ anio, alcohol_ultimos_30_dias, … }]

async function cargarDatos() {
  try {
    const filas = window.CURSO.util.leerCsv(await (await fetch(RUTA_CSV)).text());
    FILAS = filas.map(f => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, +v])));
    window.CURSO.redibujar('elegirGrafico');
  } catch (e) {
    document.querySelectorAll('[data-error-grafico]').forEach(el => { el.hidden = false; });
  }
}

const dec = n => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ---- GRÁFICO: ELEGIR SEGÚN LA PREGUNTA ----
// Cuatro capas que se encienden y apagan según el paso:
//   0: barras · ¿qué es más común hoy?
//   1: líneas con el tiempo real · ¿cómo ha cambiado?
//   2: pendiente 2014 → 2025 · ¿cuánto ha cambiado entre dos momentos?
//   3: líneas con los años como categorías (mal) · el hueco 2016-2019 desaparece
//   4: líneas con el tiempo real y el hueco marcado
window.CURSO.graficos.elegirGrafico = function crear(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 480, H = 330, IZQ = 44, DER = 400, ARRIBA = 62, ABAJO = 292;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('role', 'img');
  const el = (tag, attrs = {}, padre = svg) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    padre.appendChild(n);
    return n;
  };
  const texto = (padre, x, y, t, clase, ancla = 'start') => {
    const n = el('text', { x, y, class: clase, 'text-anchor': ancla }, padre);
    n.textContent = t;
    return n;
  };

  if (!FILAS) {
    svg.setAttribute('aria-label', 'Cargando el gráfico');
    texto(svg, W / 2, H / 2, 'Cargando datos de ESTUDES…', 'g-marca', 'middle');
    return { paso() {} };
  }

  const titulo = texto(svg, 0, 18, '', 'g-titulo-eje');
  const subtitulo = texto(svg, 0, 36, '', 'g-marca');
  const y = v => ABAJO - (v / 80) * (ABAJO - ARRIBA);
  const anios = FILAS.map(f => f.anio);
  const xReal = a => IZQ + ((a - anios[0]) / (anios[anios.length - 1] - anios[0])) * (DER - IZQ);
  const xCat = a => IZQ + (anios.indexOf(a) / (anios.length - 1)) * (DER - IZQ);
  const ultima = FILAS[FILAS.length - 1];
  const fila = a => FILAS.find(f => f.anio === a);

  // Posición vertical de las etiquetas de las series, separadas al menos 15 px
  function separar(valores) {
    const orden = valores.map((v, i) => ({ i, y: y(v) })).sort((p, q) => p.y - q.y);
    for (let k = 1; k < orden.length; k++) orden[k].y = Math.max(orden[k].y, orden[k - 1].y + 15);
    const out = [];
    orden.forEach(o => { out[o.i] = o.y; });
    return out;
  }

  // Rejilla y eje Y compartidos por las capas de líneas y pendiente
  function ejeY(capa) {
    [0, 20, 40, 60, 80].forEach(v => {
      el('line', { x1: IZQ, x2: DER, y1: y(v), y2: y(v), class: v === 0 ? 'g-eje' : 'g-rejilla' }, capa);
      texto(capa, IZQ - 6, y(v) + 4, `${v}`, 'g-marca', 'end');
    });
    texto(capa, IZQ - 6, ARRIBA - 12, '%', 'g-marca', 'end');
  }

  // Capa 0: barras de 2025
  const c0 = el('g', { class: 'g-capa' });
  const ordenadas = [...SERIES].sort((a, b) => ultima[b.clave] - ultima[a.clave]);
  const BAR_IZQ = 100, BAR_MAX = 290;
  el('line', { x1: BAR_IZQ, x2: BAR_IZQ, y1: ARRIBA + 10, y2: ARRIBA + 3 * 56 + 4, class: 'g-eje' }, c0);
  ordenadas.forEach((s, i) => {
    const yy = ARRIBA + 20 + i * 56;
    const largo = (ultima[s.clave] / 60) * BAR_MAX;
    texto(c0, BAR_IZQ - 10, yy + 22, s.nombre, 'g-fila__nombre', 'end');
    el('rect', { x: BAR_IZQ, y: yy, width: largo, height: 34, rx: 2, class: `g-serie g-serie--${s.tono}` }, c0);
    texto(c0, BAR_IZQ + largo + 8, yy + 22, `${dec(ultima[s.clave])} %`, 'g-fila__valor');
  });

  // Capas 1, 3 y 4: líneas (tiempo real o años como categorías)
  function capaLineas(x, hueco) {
    const c = el('g', { class: 'g-capa' });
    ejeY(c);
    if (hueco) {
      el('rect', { x: x(2016), y: ARRIBA - 4, width: x(2019) - x(2016), height: ABAJO - ARRIBA + 4, class: 'g-hueco' }, c);
      texto(c, (x(2016) + x(2019)) / 2, ARRIBA - 10, hueco, 'g-marca g-marca--acento', 'middle');
    }
    // Si 2016 y 2019 quedan juntos (años como categorías), se separan las etiquetas
    const juntos = x(2019) - x(2016) < 40;
    [1998, 2006, 2016, 2019, 2025].forEach(a => {
      const ancla = juntos && a === 2016 ? 'end' : juntos && a === 2019 ? 'start' : 'middle';
      const dx = ancla === 'end' ? -2 : ancla === 'start' ? 2 : 0;
      texto(c, x(a) + dx, ABAJO + 18, String(a), 'g-marca', ancla);
    });
    const yEtq = separar(SERIES.map(s => ultima[s.clave]));
    SERIES.forEach((s, k) => {
      const d = FILAS.map((f, i) => `${i ? 'L' : 'M'}${x(f.anio).toFixed(1)},${y(f[s.clave]).toFixed(1)}`).join('');
      el('path', { d, class: `g-linea-serie g-linea-serie--${s.tono}` }, c);
      FILAS.forEach(f => el('circle', { cx: x(f.anio), cy: y(f[s.clave]), r: 2.5, class: `g-serie g-serie--${s.tono}` }, c));
      texto(c, DER + 8, yEtq[k] + 4, s.nombre, `g-etiqueta-serie g-etiqueta-serie--${s.tono}`);
    });
    return c;
  }
  const c1 = capaLineas(xReal, null);

  // Capa 2: pendiente 2014 → 2025
  const c2 = el('g', { class: 'g-capa' });
  ejeY(c2);
  const X1 = 150, X2 = 320;
  texto(c2, X1, ABAJO + 18, '2014', 'g-marca', 'middle');
  texto(c2, X2, ABAJO + 18, '2025', 'g-marca', 'middle');
  const yEtq2 = separar(SERIES.map(s => ultima[s.clave]));
  SERIES.forEach((s, k) => {
    const a = fila(2014)[s.clave], b = ultima[s.clave];
    el('line', { x1: X1, x2: X2, y1: y(a), y2: y(b), class: `g-linea-serie g-linea-serie--${s.tono}` }, c2);
    el('circle', { cx: X1, cy: y(a), r: 4, class: `g-serie g-serie--${s.tono}` }, c2);
    el('circle', { cx: X2, cy: y(b), r: 4, class: `g-serie g-serie--${s.tono}` }, c2);
    texto(c2, X1 - 10, y(a) + 4, dec(a), 'g-fila__valor', 'end');
    texto(c2, X2 + 10, yEtq2[k] + 4, `${dec(b)} · ${s.nombre}`, `g-etiqueta-serie g-etiqueta-serie--${s.tono}`);
  });

  const c3 = capaLineas(xCat, '¿3 años?');
  const c4 = capaLineas(xReal, '3 años');
  const capas = [c0, c1, c2, c3, c4];

  const pasos = [
    ['¿Qué es más común hoy?', 'Estudiantes de 14 a 18 años que lo han consumido en el último mes, 2025', 0],
    ['¿Cómo ha cambiado?', '% de estudiantes, último mes, 1998-2025', 1],
    ['¿Cuánto ha cambiado entre dos momentos?', '% de estudiantes, último mes, 2014 y 2025', 2],
    ['Cuidado: los años como categorías', 'Cada encuesta a la misma distancia, aunque no lo esté', 3],
    ['Con el tiempo real', 'Entre 2016 y 2019 hay tres años, no dos', 4],
  ];
  const descripciones = [
    'Barras: en 2025, el 51,8 % de los estudiantes ha bebido alcohol en el último mes, el 15,5 % ha fumado y el 11,6 % ha consumido cannabis.',
    'Líneas de 1998 a 2025: el alcohol oscila y baja desde 2012; el tabaco y el cannabis bajan.',
    'Pendiente de 2014 a 2025: alcohol del 68,2 al 51,8 %, tabaco del 25,9 al 15,5 % y cannabis del 18,6 al 11,6 %.',
    'Las mismas líneas con los años a la misma distancia: el salto de 2016 a 2019 parece de dos años.',
    'Las líneas con el tiempo real: el tramo de 2016 a 2019 ocupa tres años.',
  ];

  return {
    paso(n) {
      const i = Math.min(Math.max(n, 0), pasos.length - 1);
      const [t, s, capa] = pasos[i];
      titulo.textContent = t;
      subtitulo.textContent = s;
      capas.forEach((c, j) => c.classList.toggle('is-visible', j === capa));
      svg.setAttribute('aria-label', descripciones[i]);
    },
  };
};

cargarDatos();
