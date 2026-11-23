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

// ---- MEJORA UN GRÁFICO ----
// Taller con botones: se parte de un gráfico apilado feo y cada botón aplica
// una mejora. Algunas mejoras dependen de otras, así que al aplicar una pueden
// aparecer botones nuevos. Hay una mejora trampa que se explica y no se aplica.
// Datos: ../datos/ine_tich_2026_frecuencia_uso_por_edad.csv (INE, TIC-H 2026)
const RUTA_FRECUENCIA = '../datos/ine_tich_2026_frecuencia_uso_por_edad.csv';

const SEGMENTOS = [
  { id: 'varias', col: 'pct_varias_veces_al_dia', nombre: 'Varias veces al día' },
  { id: 'una', col: 'pct_a_diario_no_varias', nombre: 'Una vez al día' },
  { id: 'semana', col: 'pct_cada_semana_no_a_diario', nombre: 'Cada semana' },
  { id: 'menos', col: 'pct_ultimos_3_meses_no_cada_semana', nombre: 'Menos de una vez por semana' },
  { id: 'antes', col: 'pct_hace_mas_de_3_meses', nombre: 'Hace más de 3 meses' },
  { id: 'nunca', col: 'pct_nunca', nombre: 'Nunca' },
];
const ARCOIRIS = ['#F8766D', '#B79F00', '#00BA38', '#00BFC4', '#619CFF', '#F564E3'];

const CAMBIOS = [
  { id: 'ordenar', boton: 'Poner el segmento más grande pegado al eje', requiere: [],
    porque: 'En una barra apilada solo se comparan bien los segmentos que tocan el eje: son los únicos que empiezan a la misma altura. Ahí va el más importante, y encima, de mayor a menor.' },
  { id: 'porcentajes', boton: 'Pasar a porcentajes', requiere: [],
    porque: 'Cada grupo de edad tiene una población distinta, de 5 a 8 millones. Para comparar costumbres y no tamaños, cada barra tiene que sumar 100.' },
  { id: 'otros', boton: 'Agrupar los segmentos pequeños', requiere: ['ordenar'],
    porque: 'Cuatro de los seis segmentos son finísimos. Juntos, «menos que a diario», cuentan algo; por separado, solo son ruido.' },
  { id: 'paleta', boton: 'Usar una paleta más limpia', requiere: ['otros'],
    porque: 'Con tres segmentos sobran los colores de arcoíris: una gama de grises ordena de más a menos sin distraer.' },
  { id: 'destacar', boton: 'Destacar «Varias veces al día»', requiere: ['paleta'],
    porque: 'Un solo color fuerte para lo que cuenta la noticia. El resto es contexto y va en gris.' },
  { id: 'etiquetas', boton: 'Cambiar la leyenda por etiquetas junto a las barras', requiere: ['destacar'],
    porque: 'Sin leyenda, el ojo no tiene que ir y volver para saber qué es cada color. En la tele no hay tiempo para eso.' },
  { id: 'reordenar', boton: 'Ordenar las barras de mayor a menor', requiere: ['destacar'], trampa: true,
    porque: 'Este no. Los grupos de edad tienen un orden propio y la historia es justo esa: el uso baja con la edad. Si se reordenan, se pierde. Con países o con apps sí se ordena; con edades, años o «nada, poco, mucho», no.' },
  { id: 'valores', boton: 'Escribir el valor en el segmento destacado', requiere: ['destacar', 'porcentajes'],
    porque: 'Con las cifras escritas, la caída del 94 % al 63 % se lee sin mirar el eje.' },
  { id: 'titulo', boton: 'Poner un título que cuente la noticia', requiere: ['destacar', 'porcentajes'],
    porque: '«Uso de internet por edad» describe el gráfico; el título nuevo cuenta lo que hay que ver en él.' },
  { id: 'limpiar', boton: 'Quitar la rejilla y el eje', requiere: ['valores'],
    porque: 'Si cada cifra importante está escrita, la escala sobra. Menos líneas, menos ruido.' },
];

async function montarMejora(caja) {
  let filas;
  try {
    filas = window.CURSO.util.leerCsv(await (await fetch(RUTA_FRECUENCIA)).text());
  } catch (e) {
    caja.querySelector('.mejora__explicacion').textContent = 'No se han podido cargar los datos.';
    return;
  }
  const grupos = filas.map(f => ({
    edad: f.edad.replace(/^De (\d+) a (\d+) años$/, '$1-$2'),
    poblacion: +f.poblacion,
    pct: Object.fromEntries(SEGMENTOS.map(s => [s.id, +f[s.col]])),
  }));

  const svg = caja.querySelector('svg');
  const botonera = caja.querySelector('.mejora__botones');
  const explicacion = caja.querySelector('.mejora__explicacion');
  const historial = caja.querySelector('.mejora__historial');
  const aplicadosCaja = caja.querySelector('.mejora__aplicados');
  const reiniciar = caja.querySelector('.mejora__reiniciar');
  const INICIO = explicacion.innerHTML;
  const NS = 'http://www.w3.org/2000/svg';
  const aplicados = new Set();
  const descartados = new Set();
  let vistos = new Set();

  const el = (tag, attrs = {}, padre = svg) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    padre.appendChild(n);
    return n;
  };
  const texto = (x, y, t, clase, ancla = 'start', padre = svg) => {
    const n = el('text', { x, y, class: clase, 'text-anchor': ancla }, padre);
    n.textContent = t;
    return n;
  };
  const tiene = id => aplicados.has(id);

  // Segmentos en el orden de abajo arriba según el estado
  function segmentos() {
    if (tiene('otros')) {
      return [
        { id: 'varias', nombre: 'Varias veces al día', valor: g => g.pct.varias },
        { id: 'una', nombre: 'Una vez al día', valor: g => g.pct.una },
        { id: 'resto', nombre: 'Menos que a diario', valor: g => +(100 - g.pct.varias - g.pct.una).toFixed(1) },
      ];
    }
    const lista = SEGMENTOS.map(s => ({ id: s.id, nombre: s.nombre, valor: g => g.pct[s.id] }));
    if (tiene('ordenar')) return lista; // ya están de mayor a menor
    return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  function color(seg, i, n) {
    // «Menos que a diario» (al agrupar) no es ninguno de los seis: le toca el azul
    if (!tiene('paleta')) return seg.id === 'resto' ? '#619CFF' : ARCOIRIS[SEGMENTOS.findIndex(s => s.id === seg.id)];
    if (tiene('destacar')) return seg.id === 'varias' ? 'var(--accent)' : ['#9AA0A6', '#C9CDD1', '#E3E5E8'][i] || '#E3E5E8';
    return ['#5F6368', '#9AA0A6', '#D5D8DC'][i] || '#D5D8DC';
  }

  function dibujar() {
    svg.replaceChildren();
    const W = 560, H = 400;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const segs = segmentos();
    const pct = tiene('porcentajes');
    const directas = tiene('etiquetas');
    const IZQ = 52, DER = directas ? 410 : 540;
    const ARRIBA = directas || tiene('limpiar') ? 70 : 118, ABAJO = 350;
    const max = pct ? 100 : 9;
    const y = v => ABAJO - (v / max) * (ABAJO - ARRIBA);
    const ancho = (DER - IZQ) / grupos.length;

    // Título
    texto(0, 22, tiene('titulo') ? 'A más edad, menos gente conectada varias veces al día' : 'Uso de internet por edad', 'mj-titulo');
    texto(0, 42, pct ? '% de personas según la frecuencia de uso, 2026' : 'Millones de personas según la frecuencia de uso, 2026', 'mj-subtitulo');

    // Leyenda arriba (hasta que se cambia por etiquetas)
    if (!directas) {
      let lx = 0, ly = 66;
      segs.forEach((s, i) => {
        const largo = s.nombre.length * 6.4 + 26;
        if (lx + largo > W) { lx = 0; ly += 20; }
        el('rect', { x: lx, y: ly - 10, width: 12, height: 12, style: `fill:${color(s, i, segs.length)}` });
        texto(lx + 17, ly, s.nombre, 'mj-leyenda');
        lx += largo;
      });
    }

    // Eje y rejilla
    if (!tiene('limpiar')) {
      const marcas = pct ? [0, 25, 50, 75, 100] : [0, 2, 4, 6, 8];
      marcas.forEach(v => {
        el('line', { x1: IZQ, x2: DER, y1: y(v), y2: y(v), class: 'mj-rejilla' });
        texto(IZQ - 8, y(v) + 4, pct ? `${v} %` : `${v}`, 'mj-marca', 'end');
      });
      if (!pct) texto(0, ARRIBA - 14, 'millones', 'mj-marca');
    }
    el('line', { x1: IZQ, x2: DER, y1: ABAJO, y2: ABAJO, class: 'mj-eje' });

    // Barras
    grupos.forEach((g, gi) => {
      const x = IZQ + gi * ancho + ancho * 0.14;
      const w = ancho * 0.72;
      let acum = 0;
      segs.forEach((s, i) => {
        const v = pct ? s.valor(g) : (s.valor(g) / 100) * g.poblacion / 1e6;
        const y0 = y(acum), y1 = y(acum + v);
        el('rect', { x, y: y1, width: w, height: Math.max(y0 - y1, 0), style: `fill:${color(s, i, segs.length)}` });
        if (tiene('valores') && s.id === 'varias') {
          texto(x + w / 2, y1 + 18, `${Math.round(v)} %`, 'mj-valor', 'middle');
        }
        acum += v;
      });
      texto(x + w / 2, ABAJO + 18, g.edad, 'mj-marca', 'middle');
    });

    // Etiquetas directas junto a la última barra
    if (directas) {
      const g = grupos[grupos.length - 1];
      let acum = 0;
      const posiciones = segs.map(s => {
        const v = pct ? s.valor(g) : (s.valor(g) / 100) * g.poblacion / 1e6;
        const medio = y(acum + v / 2);
        acum += v;
        return medio;
      });
      // Separación mínima de 16 px, de abajo arriba
      for (let k = 1; k < posiciones.length; k++) posiciones[k] = Math.min(posiciones[k], posiciones[k - 1] - 16);
      segs.forEach((s, i) => {
        const etq = texto(DER + 8, posiciones[i] + 4, s.nombre, 'mj-etiqueta');
        if (s.id === 'varias' && tiene('destacar')) etq.classList.add('mj-etiqueta--destacada');
      });
    }

    texto(0, H - 4, 'Fuente: INE, Encuesta TIC-H 2026. Personas de 16 a 74 años', 'mj-fuente');
    svg.setAttribute('aria-label', descripcion(segs, pct));
  }

  function descripcion(segs, pct) {
    const partes = [`Barras apiladas de seis grupos de edad, ${pct ? 'en porcentaje' : 'en millones de personas'}, con ${segs.length} segmentos`];
    partes.push(tiene('destacar') ? 'Destacado: varias veces al día, del 94 % entre los 16 y 24 años al 63 % entre los 65 y 74.' : `de abajo arriba: ${segs.map(s => s.nombre).join(', ')}.`);
    return partes.join(' ');
  }

  function disponibles() {
    return CAMBIOS.filter(c => !aplicados.has(c.id) && !descartados.has(c.id) && c.requiere.every(r => aplicados.has(r)));
  }

  function pintarBotones() {
    botonera.replaceChildren();
    const lista = disponibles();
    lista.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mejora__boton';
      if (!vistos.has(c.id) && vistos.size) b.classList.add('is-nuevo');
      b.textContent = c.boton;
      b.addEventListener('click', () => aplicar(c));
      botonera.append(b);
    });
    vistos = new Set([...vistos, ...lista.map(c => c.id)]);
    if (!lista.length) {
      const fin = document.createElement('p');
      fin.className = 'mejora__fin';
      fin.textContent = 'No quedan cambios. Comparad con el gráfico del principio: los datos son los mismos.';
      botonera.append(fin);
    }
  }

  function aplicar(c) {
    explicacion.classList.toggle('is-trampa', Boolean(c.trampa));
    explicacion.replaceChildren();
    const fuerte = document.createElement('strong');
    fuerte.textContent = c.trampa ? 'Trampa. ' : `${c.boton}. `;
    explicacion.append(fuerte, c.porque);
    const li = document.createElement('li');
    li.textContent = c.boton;
    if (c.trampa) { descartados.add(c.id); li.classList.add('is-descartado'); }
    else aplicados.add(c.id);
    historial.append(li);
    aplicadosCaja.hidden = false;
    reiniciar.hidden = false;
    dibujar();
    pintarBotones();
  }

  reiniciar.addEventListener('click', () => {
    aplicados.clear();
    descartados.clear();
    vistos = new Set();
    historial.replaceChildren();
    aplicadosCaja.hidden = true;
    reiniciar.hidden = true;
    explicacion.classList.remove('is-trampa');
    explicacion.innerHTML = INICIO;
    dibujar();
    pintarBotones();
  });

  dibujar();
  pintarBotones();
}

// ---- ANATOMÍA: NÚMEROS SOBRE EL GRÁFICO ----
// Cada número es un botón; al pulsarlo, su descripción se despliega en el panel.
function montarPartesGrafico(caja) {
  const puntos = [...caja.querySelectorAll('.partes-grafico__punto')];
  const items = [...caja.querySelectorAll('.partes-grafico__item')];
  const contador = caja.querySelector('.partes-grafico__contador');
  let activo = 0;

  function elegir(n) {
    activo = n;
    caja.classList.add('is-iniciado');
    puntos.forEach(p => {
      const es = Number(p.dataset.punto) === n;
      p.classList.toggle('is-activo', es);
      p.setAttribute('aria-pressed', es);
      if (es) p.classList.add('is-visto');
    });
    items.forEach(li => li.classList.toggle('is-activo', Number(li.dataset.punto) === n));
    contador.textContent = n + ' de ' + items.length;
  }

  puntos.forEach(p => {
    p.setAttribute('aria-pressed', 'false');
    p.addEventListener('click', () => elegir(Number(p.dataset.punto)));
  });
  caja.querySelectorAll('[data-avance]').forEach(b => b.addEventListener('click', () => {
    const total = items.length;
    elegir(((activo - 1 + Number(b.dataset.avance) + total) % total) + 1);
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-partes-grafico]').forEach(montarPartesGrafico);
  document.querySelectorAll('[data-mejora]').forEach(montarMejora);
});
