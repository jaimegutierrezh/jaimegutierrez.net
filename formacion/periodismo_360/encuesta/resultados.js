/* ================================================
   ENCUESTA · Vista del profesor
   Resultados en directo para proyectar y descarga del CSV.
   Acceso: resultados.html?grupo=…#clave=…
   ================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const C = window.ENCUESTA_COMUN;
  const E = window.ENCUESTA;
  const $ = s => document.querySelector(s);
  const INTERVALO = 5000;
  const CLAVE_SESION = 'encuesta-clave';

  const acceso = $('.acceso');
  const rejilla = $('.panel-encuesta__rejilla');
  const estado = $('.panel-encuesta__estado');
  const contador = $('.panel-encuesta__n');
  const btnPausa = $('[data-accion="pausa"]');
  const btnCsv = $('[data-accion="csv"]');
  $('.panel-encuesta__grupo').textContent = `Grupo: ${C.grupo}`;

  let filas = [];          // objetos { columna: valor }
  let origen = 'servidor'; // servidor | csv | ejemplo
  let pausado = false;
  let temporizador = null;
  let ultima = null;

  // ---- CLAVE ----
  function leerClave() {
    const m = location.hash.match(/clave=([^&]+)/);
    if (m) {
      const clave = decodeURIComponent(m[1]);
      try { sessionStorage.setItem(CLAVE_SESION, clave); } catch (e) { /* nada */ }
      history.replaceState(null, '', location.pathname + location.search);
      return clave;
    }
    try { return sessionStorage.getItem(CLAVE_SESION); } catch (e) { return null; }
  }
  let clave = leerClave();

  // ---- CARGA DESDE EL SERVIDOR ----
  async function cargar() {
    if (origen !== 'servidor' || pausado) return;
    const url = `${C.endpoint}?accion=respuestas&grupo=${encodeURIComponent(C.grupo)}&clave=${encodeURIComponent(clave)}`;
    try {
      const resp = await fetch(url);
      const json = await resp.json();
      if (!json.ok) {
        if (json.error === 'clave') { pedirClave('La clave no es correcta.'); return; }
        throw new Error(json.error);
      }
      filas = json.filas.map(f => Object.fromEntries(json.columnas.map((c, i) => [c, f[i]])));
      ultima = new Date();
      mostrarPanel();
      pintar();
    } catch (err) {
      estado.textContent = 'Sin conexión con la hoja. Reintentando…';
    }
    programar();
  }
  function programar() {
    clearTimeout(temporizador);
    if (origen === 'servidor' && !pausado) temporizador = setTimeout(cargar, INTERVALO);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });

  function pedirClave(mensaje) {
    acceso.hidden = false;
    rejilla.hidden = true;
    $('#acceso-mensaje').textContent = mensaje || '';
    $('#acceso-sin-servidor').hidden = Boolean(C.endpoint);
    $('#acceso-form').hidden = !C.endpoint;
  }
  function mostrarPanel() {
    acceso.hidden = true;
    rejilla.hidden = false;
  }

  $('#acceso-form').addEventListener('submit', e => {
    e.preventDefault();
    clave = $('#acceso-clave').value.trim();
    try { sessionStorage.setItem(CLAVE_SESION, clave); } catch (err) { /* nada */ }
    origen = 'servidor';
    cargar();
  });

  // ---- PLAN B: CARGAR UN CSV ----
  $('#cargar-csv').addEventListener('change', async e => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const texto = await archivo.text();
    const tabla = leerCsv(texto.replace(/^﻿/, ''));
    const cab = tabla.shift() || [];
    filas = tabla.filter(f => f.length > 1).map(f => {
      const o = Object.fromEntries(cab.map((c, i) => [c.trim(), f[i] ?? '']));
      ['pantalla_horas', 'sueno_horas', 'gasto_ocio', 'alquiler', 'edad_independencia'].forEach(c => {
        if (o[c] !== '' && o[c] !== undefined) o[c] = Number(String(o[c]).replace(',', '.'));
      });
      return o;
    });
    origen = 'csv';
    clearTimeout(temporizador);
    ultima = new Date();
    mostrarPanel();
    pintar();
  });

  function leerCsv(texto) {
    const filasCsv = [];
    let fila = [], celda = '', comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const ch = texto[i];
      if (comillas) {
        if (ch === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
        else if (ch === '"') comillas = false;
        else celda += ch;
      } else if (ch === '"') comillas = true;
      else if (ch === ',') { fila.push(celda); celda = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && texto[i + 1] === '\n') i++;
        fila.push(celda); filasCsv.push(fila); fila = []; celda = '';
      } else celda += ch;
    }
    if (celda || fila.length) { fila.push(celda); filasCsv.push(fila); }
    return filasCsv;
  }

  // ---- DATOS DE EJEMPLO (para ensayar sin servidor) ----
  $('[data-accion="ejemplo"]').addEventListener('click', () => {
    filas = datosEjemplo(28);
    origen = 'ejemplo';
    clearTimeout(temporizador);
    ultima = new Date();
    mostrarPanel();
    pintar();
  });

  function datosEjemplo(n) {
    let s = 11;
    const azar = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const elige = (ops, pesos) => {
      const t = pesos.reduce((a, b) => a + b, 0);
      let r = azar() * t;
      for (let i = 0; i < ops.length; i++) { r -= pesos[i]; if (r <= 0) return ops[i]; }
      return ops[ops.length - 1];
    };
    const op = campo => E.preguntas.find(p => p.campo === campo).opciones;
    return Array.from({ length: n }, (_, i) => {
      const conv = elige(op('convivencia'), [14, 6, 2, 1, 4, 1]);
      const info = op('informacion').filter((o, k) => k < 9 && azar() < [0.6, 0.7, 0.3, 0.4, 0.5, 0.35, 0.15, 0.2, 0.1][k]);
      return {
        grupo: 'ejemplo', fecha: '',
        pantalla_horas: i === 0 ? 14.5 : Math.round((2.5 + azar() * 4.5) * 4) / 4,
        pantalla_origen: elige(op('pantalla_origen'), [3, 2]),
        app: elige(op('app'), [8, 9, 4, 3, 1, 2, 1, 1]), app_otra: '',
        preocupacion: elige(op('preocupacion'), [3, 9, 10, 4]),
        sueno_horas: Math.round((5.5 + azar() * 3) * 2) / 2,
        informacion: (info.length ? info : ['Casi no me informo']).join('; '),
        informativos_tv: elige(op('informativos_tv'), [10, 11, 5, 2]),
        artista: elige(['Bad Bunny', 'bad bunny', 'Rosalía', 'ROSALIA', 'Quevedo', 'Taylor Swift', 'Aitana'], [4, 2, 3, 1, 3, 3, 2]),
        gasto_ocio: Math.round(40 + azar() * 120),
        convivencia: conv,
        alquiler: conv === 'Con mi familia' ? '' : (azar() < 0.15 ? 0 : Math.round(350 + azar() * 250)),
        edad_independencia: Math.round(26 + azar() * 8), ya_independizado: '',
        provincia: elige(['Madrid', 'Toledo', 'Valencia', 'Sevilla', 'León'], [12, 3, 2, 2, 1]),
      };
    });
  }

  // ---- AGREGADOS ----
  const numeros = campo => filas.map(f => f[campo]).filter(v => v !== '' && v !== null && v !== undefined && !isNaN(v)).map(Number);
  function recuento(campo, opciones, multiple = false) {
    const cuenta = new Map(opciones.map(o => [o, 0]));
    let respondidas = 0;
    filas.forEach(f => {
      const v = f[campo];
      if (v === '' || v === undefined || v === null) return;
      respondidas++;
      (multiple ? String(v).split(';').map(x => x.trim()) : [v]).forEach(x => {
        if (cuenta.has(x)) cuenta.set(x, cuenta.get(x) + 1);
      });
    });
    return { cuenta, respondidas };
  }

  // ---- PINTAR ----
  function pintar() {
    contador.textContent = filas.length;
    const textos = { servidor: 'En directo', csv: 'Datos cargados desde un CSV', ejemplo: 'Datos de ejemplo (ficticios)' };
    estado.textContent = `${textos[origen]} · ${ultima ? ultima.toLocaleTimeString('es-ES') : ''}`;
    btnPausa.hidden = origen !== 'servidor';
    btnCsv.disabled = !filas.length;

    pintarPantalla();
    pintarMedidoEstimado();
    pintarBarras('#t-app', 'app', { ordenar: true, ultimo: 'Otra' });
    pintarBarras('#t-preocupacion', 'preocupacion');
    pintarBarras('#t-informacion', 'informacion', { multiple: true, ordenar: true, ultimo: 'Casi no me informo', porcentaje: true });
    pintarBarras('#t-informativos', 'informativos_tv');
    pintarBarras('#t-convivencia', 'convivencia', { ordenar: true, ultimo: 'Otra' });
    pintarCifras('#t-gasto', numeros('gasto_ocio'), v => `${C.numero(v, 0)} €`);
    pintarCifras('#t-edad', filas.filter(f => f.ya_independizado !== 'Sí').map(f => f.edad_independencia)
      .filter(v => v !== '' && v !== undefined && !isNaN(v)).map(Number), v => `${C.numero(v, 1)} años`);
  }

  function pintarCifras(sel, valores, formato) {
    const cuerpo = $(`${sel} .tarjeta__cuerpo`);
    if (!valores.length) { cuerpo.innerHTML = '<p class="vacio">Sin respuestas todavía</p>'; return; }
    cuerpo.replaceChildren(cifras([
      ['media', 'Media', formato(C.media(valores))],
      ['mediana', 'Mediana', formato(C.mediana(valores))],
      ['', 'Respuestas', String(valores.length)],
    ]));
  }

  function cifras(items) {
    const caja = document.createElement('div');
    caja.className = 'cifras';
    items.forEach(([mod, etiqueta, valor]) => {
      const d = document.createElement('div');
      d.className = 'cifras__item' + (mod ? ` cifras__item--${mod}` : '');
      const b = document.createElement('b'); b.textContent = valor;
      const s = document.createElement('span'); s.textContent = etiqueta;
      d.append(b, s);
      caja.appendChild(d);
    });
    return caja;
  }

  function pintarBarras(sel, campo, { multiple = false, ordenar = false, ultimo = null, porcentaje = false } = {}) {
    const p = E.preguntas.find(q => q.campo === campo);
    const { cuenta, respondidas } = recuento(campo, p.opciones, multiple);
    const cuerpo = $(`${sel} .tarjeta__cuerpo`);
    if (!respondidas) { cuerpo.innerHTML = '<p class="vacio">Sin respuestas todavía</p>'; return; }
    let lista = [...cuenta.entries()];
    if (ordenar) {
      lista.sort((a, b) => b[1] - a[1]);
      if (ultimo) lista = lista.filter(x => x[0] !== ultimo).concat(lista.filter(x => x[0] === ultimo));
    }
    const max = Math.max(...lista.map(x => x[1]), 1);
    const top = Math.max(...lista.map(x => x[1]));
    const caja = document.createElement('div');
    caja.className = 'barras';
    lista.forEach(([nombre, n]) => {
      const fila = document.createElement('div');
      fila.className = 'barras__fila' + (n === top && n > 0 ? ' barras__fila--destacada' : '');
      const etiqueta = document.createElement('span'); etiqueta.textContent = nombre;
      const pista = document.createElement('span'); pista.className = 'barras__pista';
      const b = document.createElement('span'); b.className = 'barras__barra'; b.style.width = `${(n / max) * 100}%`;
      pista.appendChild(b);
      const valor = document.createElement('span'); valor.className = 'barras__valor';
      valor.textContent = porcentaje ? `${Math.round((n / respondidas) * 100)}%` : String(n);
      fila.append(etiqueta, pista, valor);
      caja.appendChild(fila);
    });
    cuerpo.replaceChildren(caja);
    const nota = $(`${sel} .tarjeta__nota`);
    if (nota && porcentaje) {
      const suma = lista.reduce((a, x) => a + Math.round((x[1] / respondidas) * 100), 0);
      nota.textContent = `% sobre las ${respondidas} personas que han respondido. Suman ${suma}%: cada persona puede marcar varias.`;
    }
  }

  function pintarMedidoEstimado() {
    const cuerpo = $('#t-origen .tarjeta__cuerpo');
    const grupos = E.preguntas.find(p => p.campo === 'pantalla_origen').opciones.map(op => {
      const v = filas.filter(f => f.pantalla_origen === op).map(f => f.pantalla_horas)
        .filter(x => x !== '' && x !== undefined && !isNaN(x)).map(Number);
      return [op, v];
    });
    if (!grupos.some(g => g[1].length)) { cuerpo.innerHTML = '<p class="vacio">Sin respuestas todavía</p>'; return; }
    cuerpo.replaceChildren(cifras(grupos.map(([op, v], i) => [
      i === 0 ? 'mediana' : 'media',
      `${op === 'Lo he mirado en el móvil' ? 'Medido' : 'Estimado'} · ${v.length} pers.`,
      v.length ? C.duracion(C.mediana(v)) : '—',
    ])));
  }

  // Diagrama de puntos apilados de las horas de pantalla
  function pintarPantalla() {
    const valores = numeros('pantalla_horas');
    const cuerpo = $('#t-pantalla .tarjeta__cuerpo');
    if (!valores.length) { cuerpo.innerHTML = '<p class="vacio">Sin respuestas todavía</p>'; return; }
    const NS = 'http://www.w3.org/2000/svg';
    const maxV = Math.max(12, Math.ceil(Math.max(...valores) / 2) * 2);
    const ancho = 720, r = 7, paso = 2 * r + 2;
    const pilas = new Map();
    valores.forEach(v => { const t = Math.round(v * 2) / 2; pilas.set(t, (pilas.get(t) || 0) + 1); });
    const alturaPila = Math.max(...pilas.values()) * paso;
    const arr = 40, base = arr + Math.max(alturaPila, 80) + 6, alto = base + 40;
    const m = { izq: 12, der: 30 };
    const x = v => m.izq + (v / maxV) * (ancho - m.izq - m.der);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    svg.setAttribute('role', 'img');
    const med = C.media(valores), mdn = C.mediana(valores);
    svg.setAttribute('aria-label', `Horas de pantalla de ${valores.length} personas. Media ${C.duracion(med)}, mediana ${C.duracion(mdn)}.`);
    const add = (nombre, attrs, texto) => {
      const n = document.createElementNS(NS, nombre);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (texto) n.textContent = texto;
      svg.appendChild(n);
      return n;
    };
    add('line', { class: 'g-eje', x1: m.izq, x2: ancho - m.der, y1: base, y2: base });
    for (let h = 0; h <= maxV; h += 2) {
      add('text', { class: 'g-marca', x: x(h), y: base + 22, 'text-anchor': 'middle' }, h === maxV ? `${h} h` : String(h));
    }
    const k = new Map();
    [...valores].sort((a, b) => a - b).forEach(v => {
      const t = Math.round(v * 2) / 2;
      const i = k.get(t) || 0; k.set(t, i + 1);
      add('circle', { class: 'g-punto', cx: x(t), cy: base - r - 3 - i * paso, r });
    });
    [[mdn, 'Mediana', 'var(--teal)', 'end', -6], [med, 'Media', 'var(--accent)', 'start', 6]].forEach(([v, et, color, ancla, dx]) => {
      add('line', { x1: x(v), x2: x(v), y1: arr - 8, y2: base, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' });
      add('text', { x: x(v) + dx, y: arr - 14, 'text-anchor': ancla, fill: color, class: 'g-etiqueta' }, `${et} ${C.duracion(v)}`);
    });
    cuerpo.replaceChildren(svg, cifras([
      ['media', 'Media', C.duracion(med)],
      ['mediana', 'Mediana', C.duracion(mdn)],
      ['', 'Máximo', C.duracion(Math.max(...valores))],
      ['', 'Respuestas', String(valores.length)],
    ]));
  }

  // ---- DESCARGAR CSV ----
  btnCsv.addEventListener('click', () => {
    const columnas = ['grupo', 'fecha', ...E.columnas];
    const celda = v => {
      let s = v === null || v === undefined ? '' : String(v);
      if (/^[=+\-@]/.test(s) && isNaN(Number(s))) s = "'" + s; // evita fórmulas al abrirlo
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const texto = [columnas.join(','), ...filas.map(f => columnas.map(c => celda(f[c])).join(','))].join('\r\n');
    const blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `encuesta_${C.grupo}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // ---- PAUSA ----
  btnPausa.addEventListener('click', () => {
    pausado = !pausado;
    btnPausa.textContent = pausado ? 'Reanudar' : 'Pausar';
    btnPausa.setAttribute('aria-pressed', String(pausado));
    if (!pausado) cargar();
  });

  // ---- ARRANQUE ----
  if (C.endpoint && clave) cargar();
  else pedirClave();
});
