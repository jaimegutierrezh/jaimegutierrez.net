/* ================================================
   CLASE 2 · ¿Mucho o poco? Números relativos
   Gráfico del scrollytelling: viviendas turísticas por provincia,
   primero en número absoluto y después por cada 1.000 habitantes.
   Datos: ../datos/ine_viviendas_turisticas_provincias_2026.csv (INE)
   ================================================ */

'use strict';

// ---- DATOS ----
const RUTA_CSV = '../datos/ine_viviendas_turisticas_provincias_2026.csv';
const NOMBRES = {
  'Palmas, Las': 'Las Palmas',
  'Balears, Illes': 'Baleares',
  'Alicante/Alacant': 'Alicante',
  'Santa Cruz de Tenerife': 'S. C. de Tenerife',
  'Castellón/Castelló': 'Castellón',
  'Valencia/València': 'Valencia',
  'Rioja, La': 'La Rioja',
  'Coruña, A': 'A Coruña',
  'Araba/Álava': 'Álava',
};
let PROVINCIAS = null; // [{ nombre, viviendas, poblacion, tasa, puestoAbs, puestoTasa }]

// Separa una línea de CSV respetando las comillas («"Asturias, Principado de"»)
function campos(linea) {
  const out = [];
  let actual = '', comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (comillas && linea[i + 1] === '"') { actual += '"'; i++; }
      else comillas = !comillas;
    } else if (c === ',' && !comillas) { out.push(actual); actual = ''; }
    else actual += c;
  }
  out.push(actual);
  return out;
}

function leerCsv(texto) {
  const [cabecera, ...lineas] = texto.trim().split(/\r?\n/);
  const cols = campos(cabecera);
  return lineas.map(l => {
    const v = campos(l);
    return Object.fromEntries(cols.map((c, i) => [c, v[i]]));
  });
}

async function cargarDatos() {
  try {
    const filas = leerCsv(await (await fetch(RUTA_CSV)).text());
    const lista = filas.map(f => {
      const viviendas = +f.viviendas_turisticas_may2026;
      const poblacion = +f.poblacion_abr2026;
      return { nombre: NOMBRES[f.provincia] || f.provincia, viviendas, poblacion, tasa: viviendas / poblacion * 1000 };
    });
    [...lista].sort((a, b) => b.viviendas - a.viviendas).forEach((p, i) => { p.puestoAbs = i + 1; });
    [...lista].sort((a, b) => b.tasa - a.tasa).forEach((p, i) => { p.puestoTasa = i + 1; });
    PROVINCIAS = lista;
    window.CURSO.redibujar('absolutoRelativo');
  } catch (e) {
    document.querySelectorAll('[data-error-grafico]').forEach(el => { el.hidden = false; });
  }
}

// ---- FORMATOS ----
const miles = n => n.toLocaleString('es-ES');
const decimal = n => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ---- GRÁFICO: ABSOLUTO FRENTE A RELATIVO ----
// Barras horizontales. Cada provincia es un grupo que se desplaza a su fila;
// las que no están en el paso actual se desvanecen.
//   0: top 10 en número de viviendas
//   1: Málaga y Girona destacadas (más del doble)
//   2: por cada 1.000 habitantes (Málaga y Girona empatan)
//   3: dónde quedan Barcelona y Madrid
//   4: «una por cada N vecinos», la forma de contarlo en la tele
window.CURSO.graficos.absolutoRelativo = function crear(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 480, H = 360, IZQ = 128, DER = 392, ARRIBA = 52, FILA = 29;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('role', 'img');
  const el = (tag, attrs = {}, padre = svg) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    padre.appendChild(n);
    return n;
  };

  if (!PROVINCIAS) {
    svg.setAttribute('aria-label', 'Cargando el gráfico');
    el('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', class: 'g-marca' }).textContent = 'Cargando datos del INE…';
    return { paso() {} };
  }

  const titulo = el('text', { x: 0, y: 18, class: 'g-titulo-eje' });
  const subtitulo = el('text', { x: 0, y: 36, class: 'g-marca' });
  el('line', { x1: IZQ, x2: IZQ, y1: ARRIBA - 8, y2: H - 8, class: 'g-eje' });

  const DESTACADAS = { 'Málaga': 'a', 'Girona': 'b', 'Barcelona': 'c', 'Madrid': 'c' };
  const filas = {};
  PROVINCIAS.forEach(p => {
    const g = el('g', { class: 'g-fila' });
    const nombre = el('text', { x: IZQ - 8, y: FILA / 2 + 4, 'text-anchor': 'end', class: 'g-fila__nombre' }, g);
    nombre.textContent = p.nombre;
    const barra = el('rect', { x: IZQ, y: 4, width: DER - IZQ, height: FILA - 8, rx: 2, class: 'g-barra' }, g);
    const valor = el('text', { y: FILA / 2 + 4, class: 'g-fila__valor' }, g);
    filas[p.nombre] = { g, barra, valor, p };
  });

  const topAbs = [...PROVINCIAS].sort((a, b) => b.viviendas - a.viviendas).slice(0, 10);
  const topTasa = [...PROVINCIAS].sort((a, b) => b.tasa - a.tasa);
  const maxAbs = topAbs[0].viviendas;
  const maxTasa = topTasa[0].tasa;

  function mostrar(lista, { medida, destacar = [], formato }) {
    const visibles = new Set(lista.map(p => p.nombre));
    Object.values(filas).forEach(({ g, barra, valor, p }) => {
      const i = lista.indexOf(p);
      const v = medida === 'abs' ? p.viviendas / maxAbs : p.tasa / maxTasa;
      const largo = Math.max(v * (DER - IZQ), 1);
      if (i >= 0) g.style.transform = `translateY(${ARRIBA + i * FILA}px)`;
      g.classList.toggle('is-oculta', !visibles.has(p.nombre));
      barra.style.transform = `scaleX(${largo / (DER - IZQ)})`;
      valor.setAttribute('x', IZQ + largo + 6);
      valor.textContent = formato(p);
      const tono = destacar.includes(p.nombre) ? DESTACADAS[p.nombre] : null;
      g.dataset.tono = tono || '';
    });
  }

  const conPuesto = p => `${decimal(p.tasa)} · ${p.puestoTasa}.ª`;
  const pasos = [
    () => {
      titulo.textContent = 'Viviendas turísticas';
      subtitulo.textContent = 'Número total por provincia, mayo de 2026. Las 10 primeras';
      mostrar(topAbs, { medida: 'abs', formato: p => miles(p.viviendas) });
    },
    () => {
      titulo.textContent = 'Viviendas turísticas';
      subtitulo.textContent = 'Málaga tiene más del doble que Girona';
      mostrar(topAbs, { medida: 'abs', destacar: ['Málaga', 'Girona'], formato: p => miles(p.viviendas) });
    },
    () => {
      titulo.textContent = 'Viviendas turísticas por cada 1.000 habitantes';
      subtitulo.textContent = 'Mayo de 2026. Las 10 primeras';
      mostrar(topTasa.slice(0, 10), { medida: 'tasa', destacar: ['Málaga', 'Girona'], formato: p => decimal(p.tasa) });
    },
    () => {
      titulo.textContent = 'Viviendas turísticas por cada 1.000 habitantes';
      subtitulo.textContent = 'Y el puesto que ocupa cada provincia de las 52';
      const lista = topTasa.slice(0, 8).concat(topTasa.filter(p => p.nombre === 'Barcelona' || p.nombre === 'Madrid'));
      mostrar(lista, { medida: 'tasa', destacar: ['Málaga', 'Girona', 'Barcelona', 'Madrid'], formato: conPuesto });
    },
    () => {
      titulo.textContent = 'Una vivienda turística por cada…';
      subtitulo.textContent = 'Habitantes por vivienda turística, mayo de 2026';
      const lista = topTasa.slice(0, 8).concat(topTasa.filter(p => p.nombre === 'Barcelona' || p.nombre === 'Madrid'));
      mostrar(lista, { medida: 'tasa', destacar: ['Málaga', 'Girona', 'Madrid'], formato: p => `1 de cada ${miles(Math.round(p.poblacion / p.viviendas))}` });
    },
  ];
  const textos = [
    'Viviendas turísticas por provincia en mayo de 2026. Málaga, 45.176; Alicante, 32.148; Las Palmas, 26.998; Girona, 20.821.',
    'Málaga tiene más del doble de viviendas turísticas que Girona.',
    'Por cada 1.000 habitantes, Málaga y Girona empatan en 24,8.',
    'Barcelona queda en el puesto 37 y Madrid en el 44 de 52 provincias.',
    'En Málaga y Girona hay una vivienda turística por cada 40 habitantes; en Madrid, una por cada 535.',
  ];

  return {
    paso(n) {
      const i = Math.min(Math.max(n, 0), pasos.length - 1);
      pasos[i]();
      svg.setAttribute('aria-label', textos[i]);
    },
  };
};

cargarDatos();
