/* ================================================
   CLASE 4 · Datos sucios, fuentes y mapas
   - Perfil: botones que marcan cada problema en los archivos sucios.
   - Intervalos: las 52 provincias coloreadas según cómo se corten.
     Datos: ../datos/ine_viviendas_turisticas_provincias_2026.csv (INE)
   - Curva del 112 para la pantalla de TV.
     Datos: ../datos/112_incidentes_dana_valencia_29oct2024_10min.csv
   ================================================ */

'use strict';

const NS = 'http://www.w3.org/2000/svg';
const dec = (n, d = 1) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });

function nodo(padre, tipo, attrs = {}, texto) {
  const el = document.createElementNS(NS, tipo);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (texto !== undefined) el.textContent = texto;
  padre.appendChild(el);
  return el;
}

async function leer(ruta) {
  return window.CURSO.util.leerCsv(await (await fetch(ruta)).text());
}

// ---- PERFIL DE LOS ARCHIVOS SUCIOS ----
// Cada botón marca en los archivos los fragmentos con ese problema y muestra
// su explicación. Sin JS se ven todas las explicaciones.
function montarPerfil(caja) {
  const botones = [...caja.querySelectorAll('.perfil__boton')];
  const marcas = [...caja.querySelectorAll('.crudo [data-problema]')];
  const explicaciones = [...caja.querySelectorAll('.perfil__explica')];
  const pista = caja.querySelector('.perfil__pista');

  botones.forEach(b => {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      const id = b.dataset.problema;
      const yaActivo = b.getAttribute('aria-pressed') === 'true';
      botones.forEach(o => o.setAttribute('aria-pressed', String(!yaActivo && o === b)));
      if (!yaActivo) b.classList.add('is-visto');
      marcas.forEach(m => m.classList.toggle('is-marcado', !yaActivo && m.dataset.problema === id));
      explicaciones.forEach(e => e.classList.toggle('is-activa', !yaActivo && e.dataset.problema === id));
      pista.hidden = !yaActivo;
    });
  });
}

// ---- INTERVALOS DE UN MAPA DE COROPLETAS ----
const RUTA_VIVIENDAS = '../datos/ine_viviendas_turisticas_provincias_2026.csv';
const COLORES = ['#fbe3d6', '#f2b08f', '#e07a4c', '#c1440e', '#7d2c09'];
const METODOS = {
  iguales: {
    cortes: v => { const min = v[0], max = v[v.length - 1], paso = (max - min) / 5; return [1, 2, 3, 4].map(i => min + paso * i); },
    lectura: 'Cinco tramos del mismo ancho. Como tres provincias están muy por encima del resto, 31 de las 52 caen en el color más claro: el mapa casi solo enseña Málaga, Girona y Las Palmas.',
  },
  cuantiles: {
    cortes: v => [1, 2, 3, 4].map(i => v[Math.round(v.length * i / 5)]),
    lectura: 'Unas diez provincias por color. El mapa queda repartido y se ven diferencias en todas partes, aunque entre algunos tramos la distancia sea de menos de una vivienda por cada 1.000 habitantes.',
  },
  redondos: {
    cortes: () => [2, 5, 10, 20],
    lectura: 'Cortes en cifras fáciles de decir: menos de 2, de 2 a 5, de 5 a 10, de 10 a 20 y más de 20. Se explican en una frase de locución y separan los extremos sin borrar el resto.',
  },
};

async function montarIntervalos(caja) {
  const svg = caja.querySelector('.intervalos__grafico');
  const leyenda = caja.querySelector('.intervalos__leyenda');
  const lectura = caja.querySelector('.intervalos__lectura');
  let provincias;
  try {
    provincias = (await leer(RUTA_VIVIENDAS)).map(f => ({
      nombre: f.provincia.replace(/^(.*), (La|Las|A|Illes)$/, '$2 $1').replace(/\/.*$/, ''),
      tasa: +f.viviendas_turisticas_may2026 / +f.poblacion_abr2026 * 1000,
    })).sort((a, b) => a.tasa - b.tasa);
  } catch (e) {
    caja.querySelector('[data-error-grafico]').hidden = false;
    return;
  }
  const valores = provincias.map(p => p.tasa);
  const max = Math.ceil(valores[valores.length - 1] / 5) * 5;
  let circulos = [], gCortes, x, yBase, metodoActual = 'iguales';

  // Se dibuja a la medida de la caja: en el móvil, con menos ancho en el
  // viewBox, para que el texto y los puntos no se queden diminutos.
  function dibujar() {
    const W = Math.round(Math.max(320, Math.min(640, svg.getBoundingClientRect().width || 640)));
    const x0 = 14, x1 = W - 14;
    x = v => x0 + (v / max) * (x1 - x0);
    // Puntos apilados como un diagrama de puntos (cada uno, una provincia)
    const ocupados = {};
    const pila = provincias.map(p => {
      const col = Math.round(x(p.tasa) / 11);
      return { ...p, col, fila: (ocupados[col] = (ocupados[col] || 0) + 1) - 1 };
    });
    const filasMax = Math.max(...pila.map(p => p.fila)) + 1;
    yBase = 34 + filasMax * 11;
    const H = yBase + 42;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.textContent = '';
    gCortes = nodo(svg, 'g');
    nodo(svg, 'line', { x1: x0, x2: x1, y1: yBase, y2: yBase, class: 'iv-eje' });
    for (let v = 0; v <= max; v += 5) nodo(svg, 'text', { x: x(v), y: yBase + 18, 'text-anchor': 'middle' }, String(v));
    nodo(svg, 'text', { x: x1, y: yBase + 36, 'text-anchor': 'end' }, 'viviendas turísticas por cada 1.000 habitantes');
    circulos = pila.map(p => {
      const c = nodo(svg, 'circle', { cx: p.col * 11, cy: yBase - 8 - p.fila * 11, r: 5, class: 'iv-punto' });
      nodo(c, 'title', {}, `${p.nombre}: ${dec(p.tasa)}`);
      return c;
    });
    // Nombre de las dos del extremo de arriba, encima de su columna
    const tope = pila.slice(-2);
    nodo(svg, 'text', { x: tope[1].col * 11 + 5, y: yBase - 8 - (Math.max(...tope.map(p => p.fila)) + 1) * 11 - 4, 'text-anchor': 'end', class: 'iv-nombre' },
      `${tope.map(p => p.nombre).join(' y ')} ${dec(tope[1].tasa)}`);
  }

  function aplicar(metodo) {
    metodoActual = metodo;
    const cortes = METODOS[metodo].cortes(valores);
    const clase = v => cortes.filter(c => v >= c).length;
    circulos.forEach((c, i) => c.setAttribute('fill', COLORES[clase(valores[i])]));
    gCortes.textContent = '';
    cortes.forEach(c => nodo(gCortes, 'line', { x1: x(c), x2: x(c), y1: 6, y2: yBase, class: 'iv-corte' }));
    const limites = [0, ...cortes, valores[valores.length - 1]];
    leyenda.textContent = '';
    COLORES.forEach((color, i) => {
      const n = valores.filter(v => clase(v) === i).length;
      const li = document.createElement('li');
      const desde = i === 0 ? 'Menos de ' + dec(limites[1]) : (i === 4 ? 'Más de ' + dec(limites[4]) : `${dec(limites[i])}–${dec(limites[i + 1])}`);
      li.innerHTML = `<i style="background:${color}"></i>`;
      li.append(`${desde}: ${n} ${n === 1 ? 'provincia' : 'provincias'}`);
      leyenda.appendChild(li);
    });
    lectura.textContent = METODOS[metodo].lectura;
    caja.querySelectorAll('.intervalos__boton').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.metodo === metodo)));
  }
  caja.querySelectorAll('.intervalos__boton').forEach(b => b.addEventListener('click', () => aplicar(b.dataset.metodo)));
  dibujar();
  aplicar('iguales');
  const medir = () => svg.getBoundingClientRect().width;
  let ancho = medir();
  window.addEventListener('resize', () => {
    if (Math.abs(medir() - ancho) < 20) return;
    ancho = medir();
    dibujar();
    aplicar(metodoActual);
  });
}

// ---- CURVA DEL 112 PARA LA PANTALLA DE TV ----
const RUTA_112 = '../datos/112_incidentes_dana_valencia_29oct2024_10min.csv';
const ALERTA = 20 * 60 + 11; // 20:11, minuto del día

async function montarCurva112(svg) {
  let filas;
  try { filas = await leer(RUTA_112); } catch (e) { return; }
  // El CSV no trae los intervalos sin incidentes: el eje es de tiempo real,
  // así que cada punto se coloca en su minuto y los huecos ocupan su sitio.
  let acumulado = 0;
  const puntos = filas.map(f => {
    acumulado += +f.incidentes;
    return { min: +f.hora * 60 + +f.minuto + 10, total: acumulado }; // fin del intervalo
  });
  const inicio = 5 * 60, fin = 24 * 60, izq = 4, der = 396, arriba = 14, abajo = 160;
  const x = m => izq + (m - inicio) / (fin - inicio) * (der - izq);
  const y = v => abajo - v / 2400 * (abajo - arriba);
  const ruta = `M${x(inicio)},${y(0)} ` + puntos.map(p => `L${x(p.min).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ');
  svg.textContent = '';
  nodo(svg, 'path', { d: `${ruta} L${x(fin)},${y(0)} Z`, class: 'tv-area' });
  const linea = nodo(svg, 'path', { d: ruta, class: 'tv-linea' });
  nodo(svg, 'line', { x1: izq, x2: der, y1: abajo, y2: abajo, class: 'tv-base' });
  [6, 12, 18, 24].forEach(h => nodo(svg, 'text', { x: x(h * 60), y: abajo + 22, 'text-anchor': h === 24 ? 'end' : 'middle' }, `${h}:00`));
  nodo(svg, 'line', { x1: x(ALERTA), x2: x(ALERTA), y1: arriba - 6, y2: abajo, class: 'tv-alerta' });
  nodo(svg, 'text', { x: x(ALERTA) - 6, y: arriba + 6, 'text-anchor': 'end', class: 'tv-alerta-texto' }, '20:11 · alerta');
  try { linea.style.setProperty('--largo', Math.ceil(linea.getTotalLength())); } catch (e) { /* oculta: sin animación */ }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-perfil]').forEach(montarPerfil);
  document.querySelectorAll('[data-intervalos]').forEach(montarIntervalos);
  document.querySelectorAll('[data-curva-112]').forEach(montarCurva112);
});
