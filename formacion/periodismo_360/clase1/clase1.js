/* ================================================
   CLASE 1 · Tu vida en datos
   Datos, textos y gráficos propios de esta clase.

   Sin parámetros, la página usa datos FICTICIOS de ejemplo.
   Con ?grupo=nombre carga las respuestas reales de la encuesta
   (agregadas) y rehace las cifras, las frases y el gráfico.
   ================================================ */

'use strict';

// ---- DATOS DE EJEMPLO ----
// Clase ficticia de 25 personas: los mismos valores que datos/encuesta_ejemplo.csv.
// El HTML lleva escritos estos mismos resultados para que se lea sin JS.
const EJEMPLO = {
  n: 25,
  pantalla: [4.5, 6.2, 3.6, 5.0, 15, 4.1, 7.0, 3.2, 4.4, 5.5, 2.5, 4.8, 6.0,
    4.2, 3.8, 5.3, 4.5, 3.0, 6.6, 4.3, 5.1, 3.5, 4.6, 5.8, 4.0],
  apps: { TikTok: 8, Instagram: 8, WhatsApp: 4, YouTube: 3, Spotify: 2 },
  convivencia: { 'Con mi familia': 20, 'Fuera de casa': 5 },
  edad_mediana: 30,
};
const MINIMO = 5;

// Punto inventado que se añade al scrollytelling si la clase no tiene ningún
// valor extremo: así siempre se puede ver cómo tira de la media.
const EXTREMO_INVENTADO = 14;

// Lo que dibuja el gráfico del scrollytelling en cada momento.
// inventado: valor del punto añadido (o null si el extremo es real)
const ESTADO = { horas: EJEMPLO.pantalla, inventado: null };

// ---- CÁLCULOS ----
const U = () => window.CURSO.util;

function cuantil(ordenados, q) {
  const pos = (ordenados.length - 1) * q;
  const base = Math.floor(pos);
  const resto = pos - base;
  return ordenados[base + 1] !== undefined
    ? ordenados[base] + resto * (ordenados[base + 1] - ordenados[base])
    : ordenados[base];
}

// Valor extremo: el máximo, si supera Q3 + 1,5 × rango intercuartílico
function atipicoDe(horas) {
  if (horas.length < MINIMO) return null;
  const s = [...horas].sort((a, b) => a - b);
  const q1 = cuantil(s, 0.25), q3 = cuantil(s, 0.75);
  const max = s[s.length - 1];
  return max > q3 + 1.5 * (q3 - q1) ? max : null;
}

// forzado: valor que se trata como extremo aunque la regla no lo marque
function estadisticas(horas, forzado = null) {
  const u = U();
  const atipico = forzado ?? atipicoDe(horas);
  const sin = atipico === null ? horas : (() => {
    const copia = [...horas];
    copia.splice(copia.indexOf(atipico), 1);
    return copia;
  })();
  return {
    n: horas.length,
    suma: horas.reduce((a, b) => a + b, 0),
    media: u.media(horas),
    mediana: u.mediana(horas),
    moda: u.moda(horas),
    atipico,
    mediaSin: u.media(sin),
    medianaSin: u.mediana(sin),
    tramos: [
      horas.filter(v => v < 4).length,
      horas.filter(v => v >= 4 && v < 6).length,
      horas.filter(v => v >= 6).length,
    ],
  };
}

// ---- FORMATOS DE TEXTO ----
const f1 = n => U().formato(n, 1);
const corto = n => (Number.isInteger(n) ? String(n) : f1(n));
const pct = (a, b) => Math.round((a / b) * 100);

// Para las frases de televisión: redondea HACIA ABAJO al cuarto de hora, así
// «al menos X» sigue siendo cierto y la cifra se dice fácil.
const alCuarto = h => Math.floor(Math.round(h * 60) / 15) * 15 / 60;

function horasEnPalabras(h) {
  const total = Math.round(h * 60);
  const horas = Math.floor(total / 60), min = total % 60;
  const hTxt = `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  if (min === 0) return hTxt;
  if (min === 30) return `${hTxt} y media`;
  if (min === 15) return `${hTxt} y cuarto`;
  if (min === 45) return `${hTxt} y tres cuartos`;
  return `${hTxt} y ${min} minutos`;
}

// «TikTok e Instagram», «TikTok y YouTube», «A, B y C»
function enumerar(lista) {
  if (lista.length < 2) return lista.join('');
  const ultima = lista[lista.length - 1];
  const nexo = /^(i|hi)(?!e)/i.test(ultima) ? 'e' : 'y';
  return `${lista.slice(0, -1).join(', ')} ${nexo} ${ultima}`;
}

function fraseModa(moda) {
  if (moda.veces < 2) return 'en esta clase no hay: ningún valor se repite.';
  const valores = moda.valores.sort((a, b) => a - b).map(v => `${f1(v)} h`);
  return valores.length === 1
    ? `${valores[0]}, que se repite ${moda.veces} veces.`
    : `hay ${valores.length}: ${enumerar(valores)}, que se repiten ${moda.veces} veces cada una.`;
}

function fraseSeis(k) {
  if (k === 0) return 'Nadie llega a las seis horas.';
  if (k === 1) return 'Y una persona llega a las seis horas o más.';
  return `Y ${k} personas llegan a las seis horas o más.`;
}

// ---- PINTAR LOS DATOS EN LA PÁGINA ----
function poner(clave, texto) {
  document.querySelectorAll(`[data-dato="${clave}"]`).forEach(el => { el.textContent = texto; });
}

function nota(clave, partes) {
  // partes: textos y { enlace, texto } (se construye con DOM, sin innerHTML)
  document.querySelectorAll(`[data-dato="${clave}"]`).forEach(el => {
    el.replaceChildren(...partes.map(p => {
      if (typeof p === 'string') return document.createTextNode(p);
      const a = document.createElement('a');
      a.href = p.enlace;
      a.textContent = p.texto;
      return a;
    }));
  });
}

function pintar(datos, origen) {
  const general = estadisticas(datos.pantalla);
  // El scrollytelling necesita un valor extremo: si la clase no tiene ninguno,
  // se añade un punto inventado (y se dice).
  const inventado = general.atipico === null
    ? Math.max(EXTREMO_INVENTADO, Math.ceil(Math.max(...datos.pantalla)) + 4)
    : null;
  const s = inventado === null ? general : estadisticas([...datos.pantalla, inventado], inventado);
  const real = origen.tipo === 'real';

  // Portada (cifras decorativas)
  poner('p-mediana', `${f1(general.mediana)} h`);
  poner('p-n', String(datos.n));

  // Gancho
  document.querySelectorAll('[data-dato="media"]').forEach(el => {
    el.dataset.contar = String(general.media);
    el.textContent = f1(general.media);
  });
  document.querySelector('.cifra[aria-label]')?.setAttribute('aria-label', `${f1(general.media)} horas`);
  poner('n', String(datos.n));
  nota('nota-origen', [origen.texto]);

  // Tipos de datos: app más usada y convivencia
  const apps = Object.entries(datos.apps || {}).sort((a, b) => b[1] - a[1]);
  if (apps.length) {
    const top = apps[0][1];
    const primeras = apps.filter(a => a[1] === top).map(a => a[0]);
    const totalApps = apps.reduce((a, b) => a + b[1], 0);
    poner('app-frase', primeras.length > 1
      ? `Hay empate: ${enumerar(primeras)}, ${top} personas cada una.`
      : `La más usada es ${primeras[0]}: ${top} de ${totalApps} personas.`);
    poner('p-app', primeras[0]);
  }
  const conv = datos.convivencia || {};
  const totalConv = Object.values(conv).reduce((a, b) => a + b, 0);
  if (totalConv) {
    const familia = conv['Con mi familia'] || 0;
    poner('familia-frase', `${familia} de ${totalConv} dicen que sí, el ${pct(familia, totalConv)}%`);
    poner('p-familia', `${pct(familia, totalConv)}%`);
  }
  if (datos.edad_mediana !== null && datos.edad_mediana !== undefined) {
    poner('p-edad', `${corto(datos.edad_mediana)} años`);
  }

  // Scrollytelling de medias. El paso 1 siempre muestra la media real de la
  // clase (la del gancho); el punto inventado, si lo hay, llega en el paso 2.
  poner('s-suma', f1(general.suma));
  poner('s-n1', String(general.n));
  poner('s-media', `${f1(general.media)} h`);
  if (inventado === null) {
    poner('s-extremo-1', `Pero mirad este punto: una persona dice que pasa ${corto(s.atipico)} horas al día con el móvil.`);
    poner('s-extremo-2', 'Un solo valor extremo tira de la media hacia arriba.');
    poner('s-quitar', 'Si quitamos esa respuesta, la media baja a ');
  } else {
    poner('s-extremo-1', `En esta clase nadie se sale de lo normal. Imaginad que llega una persona más y dice que pasa ${corto(inventado)} horas al día con el móvil: es un punto inventado.`);
    poner('s-extremo-2', `Con ese único valor extremo, la media sube a ${f1(s.media)} h.`);
    poner('s-quitar', 'Si quitamos el punto inventado, la media vuelve a ');
  }
  poner('s-n', String(s.n));
  poner('s-posicion', s.n % 2
    ? `el puesto ${(s.n + 1) / 2}`
    : `la media de los puestos ${s.n / 2} y ${s.n / 2 + 1}`);
  poner('s-mediana', `${f1(s.mediana)} h`);
  poner('s-media-sin', `${f1(s.mediaSin)} h`);
  poner('s-minutos', `unos ${Math.round((s.media - s.mediaSin) * 60)} minutos`);
  poner('s-mediana-sin', f1(s.medianaSin) === f1(s.mediana)
    ? `La mediana se queda en ${f1(s.mediana)} h.`
    : `La mediana apenas cambia: pasa de ${f1(s.mediana)} h a ${f1(s.medianaSin)} h.`);
  poner('s-moda', fraseModa(s.moda));
  // La frase para la tele describe a la clase real: nunca incluye el punto inventado
  poner('s-tv', `«La mitad de la clase pasa al menos ${horasEnPalabras(alCuarto(general.mediana))} al día con el móvil».`);
  const extra = inventado === null ? '' : ` más un punto inventado de ${corto(inventado)} horas para ver el efecto de un valor extremo`;
  if (real) {
    nota('s-nota', [`Datos de vuestra encuesta (grupo «${origen.grupo}»)${extra}.`]);
  } else {
    nota('s-nota', ['Datos ficticios de ejemplo (', { enlace: 'datos/encuesta_ejemplo.csv', texto: 'descargar CSV' }, ').']);
  }
  ESTADO.horas = inventado === null ? datos.pantalla : [...datos.pantalla, inventado];
  ESTADO.inventado = inventado;
  window.CURSO.redibujar('mediaMediana');

  // Pantalla de TV
  const [t1, t2, t3] = general.tramos;
  const maxTramo = Math.max(t1, t2, t3, 1);
  [t1, t2, t3].forEach((v, i) => {
    poner(`tv-t${i + 1}`, String(v));
    const barra = document.querySelector(`[data-barra="${i + 1}"]`);
    if (barra) barra.style.setProperty('--v', (v / maxTramo).toFixed(2));
  });
  const palabras = horasEnPalabras(alCuarto(general.mediana));
  poner('tv-cifra', f1(general.mediana));
  poner('tv-rotulo', `La mitad de la clase pasa al menos ${palabras} al día con el móvil`);
  poner('tv-fuente', real ? `Fuente: encuesta del curso (grupo ${origen.grupo})` : 'Fuente: encuesta del curso (datos de ejemplo)');
  poner('tv-locucion', `${palabras.charAt(0).toUpperCase()}${palabras.slice(1)} al día con el móvil. Es lo que pasa, como mínimo, la mitad de esta clase. ${fraseSeis(t3)}`);
  document.querySelector('.pantalla-tv')?.setAttribute('aria-label',
    `Simulación de un gráfico de televisión: la mitad de la clase pasa al menos ${palabras} al día con el móvil. ` +
    `${t1} personas pasan menos de 4 horas, ${t2} entre 4 y 6, y ${t3} seis horas o más.`);
}

// ---- CARGAR LAS RESPUESTAS REALES ----
async function cargarClase() {
  const params = new URLSearchParams(location.search);
  const grupo = params.get('grupo');
  const ejemplo = { tipo: 'ejemplo', texto: 'Datos ficticios de ejemplo. El día de clase se sustituyen por las respuestas de vuestra encuesta.' };
  if (!grupo || !/^[a-z0-9-]{1,40}$/.test(grupo)) return pintar(EJEMPLO, ejemplo);

  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const endpoint = (local && params.get('api')) || window.ENCUESTA_CONFIG?.endpoint;
  if (!endpoint) return pintar(EJEMPLO, ejemplo);

  try {
    const resp = await fetch(`${endpoint}?accion=clase&grupo=${encodeURIComponent(grupo)}`);
    const datos = await resp.json();
    if (!datos.ok) throw new Error(datos.error);
    if (datos.insuficiente || !datos.pantalla || datos.pantalla.length < MINIMO) {
      return pintar(EJEMPLO, { tipo: 'ejemplo', texto: `Aún no hay respuestas suficientes en el grupo «${grupo}» (hacen falta ${MINIMO}). De momento, datos ficticios de ejemplo.` });
    }
    pintar(datos, { tipo: 'real', grupo, texto: `Datos de vuestra encuesta: ${datos.n} respuestas (grupo «${grupo}»).` });
  } catch (err) {
    pintar(EJEMPLO, { tipo: 'ejemplo', texto: `No se han podido cargar las respuestas del grupo «${grupo}». De momento, datos ficticios de ejemplo.` });
  }
}

// ---- GRÁFICO: MEDIA, MEDIANA Y MODA ----
// Diagrama de puntos apilados (un punto por persona) con las líneas de
// media y mediana. Cada paso del scrollytelling activa un estado.
window.CURSO.graficos.mediaMediana = function crear(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const horas = ESTADO.horas;
  const inventado = ESTADO.inventado;
  const s = estadisticas(horas, inventado);
  const ancho = 480, alto = 300;
  const m = { izq: 16, der: 24, arr: 56, aba: 56 };
  const xMax = Math.max(16, Math.ceil(Math.max(...horas) / 4) * 4);
  const r = 6.5; // cabe en un intervalo de media hora sin solaparse (con xMax 16)
  const base = alto - m.aba;
  const x = v => m.izq + (v / xMax) * (ancho - m.izq - m.der);

  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    `Horas de pantalla al día de ${s.n} personas. Media ${f1(s.media)} horas; ` +
    `mediana ${f1(s.mediana)} horas` + (inventado !== null
      ? `; se añade un punto inventado de ${corto(inventado)} horas.`
      : `; una persona declara ${corto(s.atipico)} horas.`));

  function el(nombre, attrs = {}, padre = svg) {
    const n = document.createElementNS(NS, nombre);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    padre.appendChild(n);
    return n;
  }

  // Eje
  el('line', { class: 'g-eje', x1: m.izq, x2: ancho - m.der, y1: base, y2: base });
  const pasoEje = xMax > 16 ? 4 : 2;
  for (let h = 0; h <= xMax; h += pasoEje) {
    el('line', { class: 'g-eje', x1: x(h), x2: x(h), y1: base, y2: base + 6 });
    const t = el('text', { class: 'g-marca', x: x(h), y: base + 24, 'text-anchor': 'middle' });
    t.textContent = h === xMax ? `${h} h` : h;
  }
  const tituloEje = el('text', { class: 'g-titulo-eje', x: m.izq, y: base + 48 });
  tituloEje.textContent = 'Horas al día con el móvil · cada punto es una persona';

  // Puntos apilados en intervalos de media hora
  const pilas = new Map();
  const puntos = [...horas].sort((a, b) => a - b).map(v => {
    const tramo = Math.round(v * 2) / 2;
    const k = pilas.get(tramo) || 0;
    pilas.set(tramo, k + 1);
    const c = el('circle', {
      class: 'g-punto' + (v === s.atipico ? ' g-punto--atipico' : '') +
        (v === inventado ? ' g-punto--inventado' : ''),
      cx: x(tramo), cy: base - r - 3 - k * (2 * r + 1.5), r,
    });
    c.dataset.valor = v;
    return c;
  });
  const puntoAtipico = puntos.findLast(p => +p.dataset.valor === s.atipico);
  const anillo = puntoAtipico && el('circle', {
    class: 'g-anillo',
    cx: puntoAtipico.getAttribute('cx'), cy: puntoAtipico.getAttribute('cy'), r: r + 6,
  });
  // El punto inventado lleva su etiqueta y no aparece hasta el paso 2
  const etiquetaInventado = inventado !== null && el('text', {
    class: 'g-etiqueta g-etiqueta--inventado', 'text-anchor': 'middle',
    x: puntoAtipico.getAttribute('cx'), y: +puntoAtipico.getAttribute('cy') - r - 12,
  });
  if (etiquetaInventado) etiquetaInventado.textContent = 'inventado';

  // Líneas de referencia: se dibujan en x = 0 y se desplazan con transform
  function capaLinea(clase, anclaje) {
    const g = el('g', { class: `g-capa ${clase}` });
    el('line', { class: 'g-linea', x1: 0, x2: 0, y1: m.arr - 10, y2: base }, g);
    const t = el('text', {
      class: 'g-etiqueta', x: anclaje === 'end' ? -8 : 8, y: m.arr - 16, 'text-anchor': anclaje,
    }, g);
    return { g, t };
  }
  const lMediana = capaLinea('g-mediana', 'end');
  const lMedia = capaLinea('g-media', 'start');
  function ponerLinea(l, nombre, valor) {
    l.g.style.transform = `translateX(${x(valor)}px)`;
    l.t.textContent = `${nombre} ${f1(valor)} h`;
  }
  ponerLinea(lMedia, 'Media', s.media);
  ponerLinea(lMediana, 'Mediana', s.mediana);

  // Estados de cada paso. Con un punto inventado, los pasos 0 y 1 muestran
  // solo los datos reales (y la media real); el punto llega en el paso 2.
  const conInventado = inventado !== null;
  const estados = [
    { media: null, anillo: false, mediana: null, atenuar: false, moda: false, latido: false, oculto: conInventado },
    { media: conInventado ? s.mediaSin : s.media, anillo: false, mediana: null, atenuar: false, moda: false, latido: false, oculto: conInventado },
    { media: s.media, anillo: true, mediana: null, atenuar: false, moda: false, latido: false },
    { media: s.media, anillo: true, mediana: s.mediana, atenuar: false, moda: false, latido: false },
    { media: s.mediaSin, anillo: false, mediana: s.medianaSin, atenuar: true, moda: false, latido: false },
    { media: s.mediaSin, anillo: false, mediana: s.medianaSin, atenuar: true, moda: true, latido: false },
    { media: s.media, anillo: true, mediana: s.mediana, atenuar: false, moda: false, latido: true },
  ];

  return {
    paso(n) {
      const e = estados[Math.max(0, Math.min(n, estados.length - 1))];
      lMedia.g.classList.toggle('is-visible', e.media !== null);
      if (e.media !== null) ponerLinea(lMedia, 'Media', e.media);
      lMediana.g.classList.toggle('is-visible', e.mediana !== null);
      if (e.mediana !== null) ponerLinea(lMediana, 'Mediana', e.mediana);
      anillo?.classList.toggle('is-visible', e.anillo);
      anillo?.classList.toggle('is-latido', e.latido);
      puntoAtipico?.classList.toggle('is-atenuado', e.atenuar);
      puntoAtipico?.classList.toggle('g-oculto', Boolean(e.oculto));
      if (etiquetaInventado) etiquetaInventado.classList.toggle('g-oculto', Boolean(e.oculto) || e.atenuar);
      puntos.forEach(p => p.classList.toggle('g-punto--moda',
        e.moda && s.moda.veces > 1 && s.moda.valores.includes(+p.dataset.valor)));
    },
  };
};

document.addEventListener('DOMContentLoaded', cargarClase);
