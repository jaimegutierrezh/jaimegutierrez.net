/* ================================================
   RUTA HISTÓRICA · De dónde viene todo esto
   Gráficos históricos redibujados con sus datos originales.
   Requiere curso.js, rutas.js y datos.js (en ese orden, con defer).
   ================================================ */

'use strict';

(() => {
  const D = window.HISTORIA;
  const S = window.RUTAS.svg;
  const reducir = window.RUTAS.reducir;
  const num = (n, d = 0) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MES_EN = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

  // ---- REGLA DE AÑOS DE LA PORTADA ----
  // <div class="regla" data-desde="1780" data-hasta="2030" data-hitos="1786,1821">
  document.querySelectorAll('.regla').forEach(regla => {
    const hitos = new Set((regla.dataset.hitos || '').split(',').map(Number));
    const desde = +regla.dataset.desde, hasta = +regla.dataset.hasta;
    const frag = document.createDocumentFragment();
    let n = 0;
    for (let a = desde; a <= hasta; a++) {
      const hito = hitos.has(a);
      if (a % 5 && !hito) continue;
      const marca = document.createElement('span');
      // Los hitos alternan dos alturas para que no se pisen las etiquetas
      marca.className = 'regla__marca' + (hito ? ' regla__marca--hito' + (n++ % 2 ? ' regla__marca--alto' : '') : a % 100 === 0 ? ' regla__marca--siglo' : a % 10 === 0 ? ' regla__marca--decena' : '');
      marca.style.left = `${(a - desde) / (hasta - desde) * 100}%`;
      if (hito || a % 50 === 0) marca.innerHTML = `<span>${a}</span>`;
      frag.appendChild(marca);
    }
    regla.appendChild(frag);
  });

  // ---- PLAYFAIR: TRIGO Y SALARIOS (scrollytelling de curso.js) ----
  window.CURSO.graficos.playfair = svg => {
    const W = 820, H = 540, m = { t: 86, r: 70, b: 46, l: 54 };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Precio del trigo y salario semanal de un buen mecánico en Inglaterra, 1565-1821, según Playfair');
    const x = a => m.l + (a - 1560) / (1826 - 1560) * (W - m.l - m.r);
    const y = v => H - m.b - v / 100 * (H - m.t - m.b);
    const fondo = S('g', {}, svg);
    for (let v = 0; v <= 100; v += 20) {
      S('line', { class: 'h-rejilla', x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, fondo);
      S('text', { class: 'h-texto', x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, fondo).textContent = v;
    }
    for (let a = 1600; a <= 1800; a += 50) {
      S('text', { class: 'h-texto', x: x(a), y: H - m.b + 20, 'text-anchor': 'middle' }, fondo).textContent = a;
    }
    S('text', { class: 'h-texto h-texto--fuerte', x: m.l - 8, y: m.t - 14, 'text-anchor': 'end' }, fondo).textContent = 'chelines';

    // Barras: precio del trigo
    const barras = S('g', {}, svg);
    const ancho = (x(1565) - x(1560)) * 0.78;
    const rects = D.trigo.filter(f => f[1] !== null).map(([a, t], i) => {
      const r = S('rect', { class: 'h-trigo', x: x(a) - ancho / 2, y: y(t), width: ancho, height: y(0) - y(t) }, barras);
      S('title', {}, r).textContent = `${a}: ${t} chelines el cuarto de trigo`;
      r.style.transitionDelay = `${i * 12}ms`;
      r.style.transform = 'scaleY(0)';
      return r;
    });
    S('text', { class: 'h-texto h-texto--fuerte', x: x(1590), y: y(62), 'text-anchor': 'middle' }, barras).textContent = 'Precio del trigo';

    // Línea: salario semanal
    const conSalario = D.trigo.filter(f => f[2] !== null);
    const puntos = conSalario.map(([a, , s]) => `${x(a)},${y(s)}`).join(' L');
    const area = S('path', { class: 'h-salario-area', d: `M${x(conSalario[0][0])},${y(0)} L${puntos} L${x(conSalario.at(-1)[0])},${y(0)} Z` }, svg);
    const linea = S('path', { class: 'h-salario', d: `M${puntos}` }, svg);
    const etiquetaSalario = S('text', { class: 'h-texto h-texto--sangre', x: x(1745), y: y(16) }, svg);
    etiquetaSalario.textContent = 'Salario semanal de un buen mecánico';

    // Monarcas (franja superior, como en el original)
    const monarcas = S('g', { class: 'g-capa' }, svg);
    D.monarcas.forEach(([nombre, ini, fin, republica], i) => {
      const alto = 12, yy = m.t - 52 + (i % 2) * 16;
      S('rect', { class: 'h-monarca' + (republica ? ' h-monarca--commonwealth' : ''), x: x(ini), y: yy, width: Math.max(x(fin) - x(ini), 2), height: alto }, monarcas);
      if (x(fin) - x(ini) > 34) {
        S('text', { class: 'h-texto h-texto--serif', x: (x(ini) + x(fin)) / 2, y: yy + 10, 'text-anchor': 'middle', 'font-size': 10 }, monarcas)
          .textContent = nombre.replace('Elizabeth', 'Isabel I').replace('James', 'Jacobo').replace('Charles', 'Carlos').replace('George', 'Jorge').replace('Anne', 'Ana').replace('W&M', 'Guill. y M.');
      }
    });

    // Cociente: semanas de salario para pagar un cuarto de trigo
    const ratio = conSalario.map(([a, t, s]) => [a, t / s]);
    const topeR = Math.ceil(Math.max(...ratio.map(r => r[1])) / 4) * 4;
    const yR = v => H - m.b - v / topeR * (H - m.t - m.b);
    const capaRatio = S('g', { class: 'g-capa' }, svg);
    for (let v = 0; v <= topeR; v += 4) {
      S('text', { class: 'h-texto h-texto--teal', x: W - m.r + 8, y: yR(v) + 4 }, capaRatio).textContent = v;
    }
    S('text', { class: 'h-texto h-texto--teal', x: W - m.r + 8, y: m.t - 14 }, capaRatio).textContent = 'semanas';
    const lineaRatio = S('path', { class: 'h-ratio', d: 'M' + ratio.map(([a, r]) => `${x(a)},${yR(r)}`).join(' L') }, svg);
    const [a0, r0] = ratio[0], [a1, r1] = ratio.at(-1);
    S('text', { class: 'h-texto h-texto--teal', x: x(a0) + 4, y: yR(r0) + 22 }, capaRatio).textContent = `${a0}: ${num(r0, 1)} semanas`;
    S('text', { class: 'h-texto h-texto--teal', x: x(a1), y: yR(r1) - 12, 'text-anchor': 'end' }, capaRatio).textContent = `${a1}: ${num(r1, 1)}`;
    S('circle', { cx: x(a0), cy: yR(r0), r: 4.5, fill: 'var(--teal)' }, capaRatio);
    S('circle', { cx: x(a1), cy: yR(r1), r: 4.5, fill: 'var(--teal)' }, capaRatio);

    const largo = l => { const n = l.getTotalLength(); l.style.strokeDasharray = n; return n; };
    const nSal = largo(linea), nRat = largo(lineaRatio);
    linea.style.strokeDashoffset = nSal;
    lineaRatio.style.strokeDashoffset = nRat;
    area.style.opacity = 0;
    etiquetaSalario.style.opacity = 0;

    return {
      paso(n) {
        rects.forEach(r => { r.style.transform = 'none'; r.style.opacity = n >= 3 ? 0.18 : ''; });
        linea.style.strokeDashoffset = n >= 1 ? 0 : nSal;
        linea.style.opacity = n >= 3 ? 0.25 : 1;
        area.style.opacity = n >= 1 && n < 3 ? 1 : 0;
        etiquetaSalario.style.opacity = n >= 1 && n < 3 ? 1 : 0;
        monarcas.classList.toggle('is-visible', n === 2);
        capaRatio.classList.toggle('is-visible', n >= 3);
        lineaRatio.style.strokeDashoffset = n >= 3 ? 0 : nRat;
      },
    };
  };

  // ---- GUARDIAN 1821: PICTOGRAMA DE ALUMNOS ----
  // <div class="alumnos__rejilla" data-puntos="80" data-total="240" data-previos="80">
  document.querySelectorAll('.alumnos__rejilla').forEach(rejilla => {
    const total = +rejilla.dataset.total, llenos = +rejilla.dataset.puntos, previos = +(rejilla.dataset.previos || llenos);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const p = document.createElement('span');
      p.className = 'alumnos__punto' + (i < Math.min(llenos, previos) ? ' alumnos__punto--lleno' : i < llenos ? ' alumnos__punto--nuevo' : '');
      frag.appendChild(p);
    }
    rejilla.appendChild(frag);
  });

  // ---- SNOW: EL MAPA DEL CÓLERA ----
  window.RUTAS.piezas.snow = el => {
    const svg = el.querySelector('svg');
    const lectura = el.parentElement.querySelector('.pieza__lectura');
    const todos = D.snow.calles.flat();
    const xs = todos.filter((_, i) => i % 2 === 0), ys = todos.filter((_, i) => i % 2 === 1);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const margen = 0.4;
    svg.setAttribute('viewBox', `${x0 - margen} ${-y1 - margen} ${x1 - x0 + 2 * margen} ${y1 - y0 + 2 * margen}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Mapa del brote de cólera de 1854 en el Soho de Londres: muertes y bombas de agua');
    const bombas = D.snow.bombas.map(([nombre, x, y]) => ({ nombre, x, y }));
    const iBroad = bombas.findIndex(b => b.nombre === 'Broad St');
    const masCercana = (x, y) => {
      let mejor = 0, dist = Infinity;
      bombas.forEach((b, i) => { const d = (b.x - x) ** 2 + (b.y - y) ** 2; if (d < dist) { dist = d; mejor = i; } });
      return mejor;
    };

    // Zonas: la bomba más cercana a cada punto (en línea recta)
    const zonas = S('g', { class: 'h-zona' }, svg);
    const tonos = ['#E8DCC0', '#DCCFAF', '#E2D5B6', '#D6C8A6'];
    const paso = 0.2;
    for (let y = y0 - margen; y < y1 + margen; y += paso) {
      let inicio = x0 - margen, actual = masCercana(inicio, y);
      for (let x = x0 - margen + paso; x <= x1 + margen + paso; x += paso) {
        const b = x > x1 + margen ? -1 : masCercana(x, y);
        if (b !== actual) {
          S('rect', { x: inicio, y: -y - paso, width: x - inicio + 0.02, height: paso + 0.04, fill: actual === iBroad ? 'rgba(163, 52, 27, 0.32)' : tonos[actual % tonos.length] }, zonas);
          inicio = x; actual = b;
        }
      }
    }

    const calles = S('g', {}, svg);
    D.snow.calles.forEach(c => {
      // Cada calle es una polilínea: x0, y0, x1, y1…
      let d = '';
      for (let i = 0; i < c.length; i += 2) d += `${i ? 'L' : 'M'}${c[i]},${-c[i + 1]} `;
      S('path', { class: 'h-calle', d }, calles);
    });

    const muertes = S('g', {}, svg);
    const b0 = bombas[iBroad];
    let enBroad = 0;
    const cuadros = [];
    for (let i = 0; i < D.snow.muertes.length; i += 2) {
      const mx = D.snow.muertes[i], my = D.snow.muertes[i + 1];
      const broad = masCercana(mx, my) === iBroad;
      if (broad) enBroad++;
      const r = S('rect', { class: 'h-muerte' + (broad ? ' is-broad' : ''), x: mx - 0.07, y: -my - 0.07, width: 0.14, height: 0.14 }, muertes);
      cuadros.push({ r, d: Math.hypot(mx - b0.x, my - b0.y) });
    }
    const total = cuadros.length;

    S('circle', { class: 'h-anillo', cx: b0.x, cy: -b0.y, r: 0.7 }, svg);
    const capaBombas = S('g', {}, svg);
    bombas.forEach((b, i) => {
      const c = S('circle', { class: 'h-bomba' + (i === iBroad ? ' h-bomba--broad' : ''), cx: b.x, cy: -b.y, r: i === iBroad ? 0.22 : 0.17 }, capaBombas);
      S('title', {}, c).textContent = `Bomba de agua: ${b.nombre}`;
      if (i === iBroad) S('text', { class: 'h-bomba-nombre', x: b.x + 0.32, y: -b.y + 0.12, 'font-size': 0.42 }, capaBombas).textContent = 'Bomba de Broad Street';
    });

    const textos = {
      calles: 'El Soho de Londres en 1854: las calles y las 13 bombas de agua del barrio.',
      muertes: `Cada cuadrado es una muerte. Hay ${num(total)} en este mapa.`,
      bomba: 'En el centro del brote está la bomba de agua de Broad Street.',
      cercania: `${num(enBroad)} de las ${num(total)} muertes (${num(enBroad / total * 100)} %) están más cerca de la bomba de Broad Street que de ninguna otra. Snow lo midió andando por las calles; aquí, en línea recta.`,
    };
    el.dataset.total = total;
    el.dataset.broad = enBroad;
    return {
      estado(v) { if (lectura) lectura.textContent = textos[v] || ''; },
      entrar(repetir) {
        if (reducir()) return;
        if (repetir || el.dataset.estado !== 'muertes') {
          el.dataset.estado = 'muertes';
          this.estado('muertes');
          el.parentElement.querySelectorAll('.conmutador [data-estado]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.estado === 'muertes')));
        }
        // Las muertes aparecen desde la bomba hacia fuera
        cuadros.forEach(({ r }) => { r.style.transition = 'none'; r.style.opacity = 0; });
        requestAnimationFrame(() => requestAnimationFrame(() => {
          cuadros.forEach(({ r, d }) => { r.style.transition = `opacity 0.3s ease ${Math.round(d * 260)}ms`; r.style.opacity = ''; });
          setTimeout(() => cuadros.forEach(({ r }) => { r.style.transition = ''; }), 3500);
        }));
      },
    };
  };

  // ---- NIGHTINGALE: ROSA Y BARRAS ----
  window.RUTAS.piezas.nightingale = el => {
    const svg = el.querySelector('svg');
    const W = 900, H = 500;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Muertes en el ejército británico en la guerra de Crimea, por causa y mes, abril de 1854 a marzo de 1856');
    const filas = D.nightingale.map(([mes, anio, ejercito, enf, her, otr, tEnf, tHer, tOtr]) => ({ mes: MES_EN[mes], anio, tasas: [tEnf, tHer, tOtr] }));
    const CLASES = ['h-enfermedad', 'h-heridas', 'h-otras'];
    const NOMBRES = ['enfermedades evitables', 'heridas', 'otras causas'];
    const etiqueta = f => `${MESES[f.mes]} ${f.anio}`;

    // Rosa: el área de cada cuña es proporcional a la tasa (radio = raíz)
    const rosa = S('g', { class: 'h-vista h-vista--rosa' }, svg);
    const k = 200 / Math.sqrt(1022.8);
    const cunas = [];
    [[0, 235, 245], [12, 685, 245]].forEach(([desde, cx, cy], n) => {
      // El grupo exterior coloca la rosa; el interior se escala con CSS desde su centro
      const g = S('g', { class: 'h-cuna-g' }, S('g', { transform: `translate(${cx} ${cy})` }, rosa));
      filas.slice(desde, desde + 12).forEach((f, i) => {
        const a0 = (-90 + i * 30) * Math.PI / 180, a1 = (-90 + (i + 1) * 30) * Math.PI / 180;
        const mes = S('g', { class: 'h-cuna' }, g);
        f.tasas.map((t, c) => [t, c]).sort((p, q) => q[0] - p[0]).forEach(([t, c]) => {
          const r = k * Math.sqrt(t);
          if (r < 0.3) return;
          const cuna = S('path', { class: CLASES[c], d: `M0,0 L${r * Math.cos(a0)},${r * Math.sin(a0)} A${r},${r} 0 0 1 ${r * Math.cos(a1)},${r * Math.sin(a1)} Z` }, mes);
          S('title', {}, cuna).textContent = `${etiqueta(f)} · ${NOMBRES[c]}: ${num(t, 1)} muertes al año por cada 1.000 soldados`;
        });
        const rMax = k * Math.sqrt(Math.max(...f.tasas));
        const am = (a0 + a1) / 2, rt = Math.max(rMax, 30) + 12;
        S('text', { class: 'h-texto', x: rt * Math.cos(am), y: rt * Math.sin(am) + 4, 'text-anchor': 'middle', 'font-size': 11 }, g).textContent = MESES[f.mes];
        cunas.push({ mes, i: desde + i });
      });
      S('text', { class: 'h-texto h-texto--fuerte', x: cx, y: H - 12, 'text-anchor': 'middle' }, rosa)
        .textContent = n === 0 ? 'Abril de 1854 – marzo de 1855' : 'Abril de 1855 – marzo de 1856';
    });
    S('text', { class: 'h-texto h-texto--serif', x: 495, y: 70, 'text-anchor': 'middle' }, rosa).textContent = 'Marzo de 1855: llega la Comisión Sanitaria →';

    // Barras apiladas: los mismos datos, mes a mes
    const barras = S('g', { class: 'h-vista h-vista--barras' }, svg);
    const m = { t: 40, r: 20, b: 50, l: 56 };
    const xb = i => m.l + i * (W - m.l - m.r) / 24;
    const yb = v => H - m.b - v / 1200 * (H - m.t - m.b);
    const ab = (W - m.l - m.r) / 24 * 0.78;
    for (let v = 0; v <= 1200; v += 300) {
      S('line', { class: 'h-rejilla', x1: m.l, x2: W - m.r, y1: yb(v), y2: yb(v) }, barras);
      S('text', { class: 'h-texto', x: m.l - 8, y: yb(v) + 4, 'text-anchor': 'end' }, barras).textContent = num(v);
    }
    S('text', { class: 'h-texto h-texto--fuerte', x: m.l - 30, y: m.t - 18 }, barras).textContent = 'Muertes al año por cada 1.000 soldados';
    filas.forEach((f, i) => {
      let base = 0;
      const g = S('g', {}, barras);
      f.tasas.forEach((t, c) => {
        const r = S('rect', { class: `h-barra-n ${CLASES[c]}`, x: xb(i) + 2, y: yb(base + t), width: ab, height: yb(base) - yb(base + t) }, g);
        r.style.transitionDelay = `${i * 25}ms`;
        S('title', {}, r).textContent = `${etiqueta(f)} · ${NOMBRES[c]}: ${num(t, 1)}`;
        base += t;
      });
      if (f.mes % 3 === 0) S('text', { class: 'h-texto', x: xb(i) + 2 + ab / 2, y: H - m.b + 18, 'text-anchor': 'middle', 'font-size': 11 }, barras).textContent = f.mes === 0 ? `${MESES[f.mes]} ${String(f.anio).slice(2)}` : MESES[f.mes];
    });
    const xc = xb(11) + 2 + ab + ((W - m.l - m.r) / 24 - ab) / 2;
    S('line', { x1: xc, x2: xc, y1: m.t, y2: H - m.b, stroke: 'var(--r-sangre)', 'stroke-dasharray': '4 4', 'stroke-width': 1.5 }, barras);
    S('text', { class: 'h-texto h-texto--sangre', x: xc + 8, y: m.t + 14 }, barras).textContent = 'Marzo de 1855: llega la Comisión Sanitaria';

    return {
      entrar(repetir) {
        if (reducir() || el.dataset.estado !== 'rosa') return;
        cunas.forEach(({ mes, i }) => { mes.style.transition = 'none'; mes.style.transform = 'scale(0)'; });
        requestAnimationFrame(() => requestAnimationFrame(() => cunas.forEach(({ mes, i }) => {
          mes.style.transition = `transform 0.7s cubic-bezier(.2,.8,.2,1) ${i * 70}ms`;
          mes.style.transform = '';
        })));
      },
    };
  };

  // ---- MINARD: LA CAMPAÑA DE RUSIA ----
  window.RUTAS.piezas.minard = el => {
    const svg = el.querySelector('svg');
    const W = 1000, H = 480;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Mapa de Minard de la campaña de Napoleón en Rusia, 1812: tamaño del ejército en la ida y la vuelta, y temperaturas de la retirada');
    const x = lon => 30 + (lon - 23.6) / (38.0 - 23.6) * (W - 60);
    const y = lat => 40 + (56.0 - lat) / (56.0 - 53.8) * 250;
    const grosor = n => Math.max(n / 340000 * 52, 1.5);
    const flujos = S('g', {}, svg);
    const tramos = [];
    [1, 2, 3].forEach(grupo => {
      const puntos = D.minard.tropas.filter(t => t[4] === grupo);
      for (let i = 0; i < puntos.length - 1; i++) {
        const [lo0, la0, n0, d0] = puntos[i], [lo1, la1, , d1] = puntos[i + 1];
        const dir = d0 === d1 ? d0 : d1;
        tramos.push({ grupo, dir, n: n0, l: S('line', { class: `h-flujo h-flujo--${dir.toLowerCase()}`, x1: x(lo0), y1: y(la0), x2: x(lo1), y2: y(la1), 'stroke-width': grosor(n0) }, flujos) });
      }
    });
    // La vuelta se dibuja encima de la ida
    tramos.filter(t => t.dir === 'R').forEach(t => flujos.appendChild(t.l));

    D.minard.ciudades.forEach(([nombre, lon, lat]) => {
      S('circle', { class: 'h-ciudad', cx: x(lon), cy: y(lat), r: 3 }, svg);
      S('text', { class: 'h-ciudad-nombre', x: x(lon) + 5, y: y(lat) - 6 }, svg).textContent = nombre.replace('Moscou', 'Moscú');
    });

    // Temperaturas de la retirada (grados Réaumur, como en el original)
    const yT = t => 350 + (-t) / 30 * 95;
    const temps = D.minard.temperaturas;
    S('line', { class: 'h-rejilla', x1: 30, x2: W - 30, y1: yT(0), y2: yT(0) }, svg);
    S('path', { class: 'h-temp', d: 'M' + temps.map(([lon, t]) => `${x(lon)},${yT(t)}`).join(' L') }, svg);
    temps.forEach(([lon, t, fecha]) => {
      S('line', { x1: x(lon), x2: x(lon), y1: yT(t), y2: 300, stroke: 'rgba(42,33,23,0.25)', 'stroke-width': 1 }, svg);
      const dia = fecha ? ` · ${fecha.replace('Oct', '').replace('Nov', '').replace('Dec', '')} ${fecha.slice(0, 3).replace('Oct', 'oct').replace('Nov', 'nov').replace('Dec', 'dic')}` : '';
      S('text', { class: 'h-texto', x: x(lon), y: yT(t) + 16, 'text-anchor': 'middle', 'font-size': 11 }, svg).textContent = `${t}°${dia}`;
    });
    S('text', { class: 'h-texto h-texto--fuerte', x: W - 30, y: yT(0) - 8, 'text-anchor': 'end' }, svg).textContent = 'Temperatura en la retirada (grados Réaumur: −30 °R son −37,5 °C)';

    const contador = S('text', { class: 'h-contador', x: 40, y: 32 }, svg);
    const contadorTexto = S('text', { class: 'h-texto', x: 40, y: 50 }, svg);
    contadorTexto.textContent = 'hombres en el ejército principal';
    const poner = t => { contador.textContent = num(t.n); };
    contador.textContent = num(tramos.filter(t => t.grupo === 1).at(-1).n);
    let temporizadores = [];
    return {
      entrar() {
        temporizadores.forEach(clearTimeout);
        temporizadores = [];
        if (reducir()) return;
        tramos.forEach(t => { t.l.style.opacity = 0; });
        // Primero la ida y después la vuelta; en cada fase, los tres cuerpos a la vez
        let base = 0;
        ['A', 'R'].forEach(dir => {
          let pasos = 0;
          [1, 2, 3].forEach(grupo => {
            tramos.filter(t => t.dir === dir && t.grupo === grupo).forEach((t, i) => {
              pasos = Math.max(pasos, i + 1);
              temporizadores.push(setTimeout(() => { t.l.style.opacity = ''; if (grupo === 1) poner(t); }, base + i * 130));
            });
          });
          base += pasos * 130 + 300;
        });
      },
    };
  };

  // ---- DU BOIS: LIBRES Y ESCLAVOS ----
  window.RUTAS.piezas.dubois = el => {
    const svg = el.querySelector('svg');
    const W = 640, H = 500;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Proporción de personas negras libres y esclavizadas en Estados Unidos, 1790-1870, al estilo de Du Bois');
    const datos = [[1790, 8], [1800, 11], [1810, 13.5], [1820, 13], [1830, 14], [1840, 13], [1850, 12], [1860, 11], [1870, 100]];
    S('text', { class: 'h-db-titulo', x: W / 2, y: 40, 'text-anchor': 'middle' }, svg).textContent = 'PROPORTION OF FREEMEN AND SLAVES AMONG AMERICAN NEGROES .';
    S('text', { class: 'h-db-subtitulo', x: W / 2, y: 62, 'text-anchor': 'middle' }, svg).textContent = 'PROPORTION DES NÈGRES LIBRES ET DES ESCLAVES EN AMÉRIQUE .';
    const top = 130, alto = 330, x0 = 50, x1 = W - 50;
    const x = a => x0 + (a - 1790) / 80 * (x1 - x0);
    const y = p => top + p / 100 * alto;
    S('rect', { class: 'h-db-esclavos', x: x0, y: top, width: x1 - x0, height: alto }, svg);
    const libres = S('path', { class: 'h-db-libres', d: `M${x0},${top} ` + datos.map(([a, p]) => `L${x(a)},${y(p)}`).join(' ') + ` L${x1},${top} Z` }, svg);
    libres.style.transformOrigin = `0px ${top}px`;
    datos.forEach(([a, p]) => {
      S('text', { class: 'h-db-texto', x: x(a), y: top - 12, 'text-anchor': a === 1790 ? 'start' : a === 1870 ? 'end' : 'middle' }, svg).textContent = `${num(p, p % 1 ? 1 : 0)}%`;
      S('text', { class: 'h-db-texto', x: x(a), y: top + alto + 22, 'text-anchor': a === 1790 ? 'start' : a === 1870 ? 'end' : 'middle' }, svg).textContent = a;
    });
    S('text', { class: 'h-db-texto', x: W / 2 - 40, y: top + alto * 0.6, 'text-anchor': 'middle', fill: '#E8D7C0', style: 'fill:#E8D7C0' }, svg).textContent = 'SLAVES';
    S('text', { class: 'h-db-texto', x: W / 2 - 40, y: top + alto * 0.6 + 18, 'text-anchor': 'middle', style: 'fill:#E8D7C0' }, svg).textContent = 'ESCLAVES';
    S('text', { class: 'h-db-texto', x: W / 2 - 40, y: top + 28, 'text-anchor': 'middle', style: 'fill:#E8D7C0' }, svg).textContent = 'FREE — LIBRE';
    return {
      entrar() {
        if (reducir()) return;
        libres.style.transition = 'none';
        libres.style.transform = 'scaleY(0)';
        requestAnimationFrame(() => requestAnimationFrame(() => { libres.style.transition = ''; libres.style.transform = ''; }));
      },
    };
  };

  // ---- ISOTYPE: REPETIR, NO AGRANDAR ----
  // Los alumnos de 1821 en figuras de 1.000: 8 frente a 23
  window.RUTAS.piezas.isotype = el => {
    const svg = el.querySelector('svg');
    const lectura = el.parentElement.querySelector('.pieza__lectura');
    const W = 780, H = 270, x0 = 170, paso = 26;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Alumnos de las escuelas dominicales de Manchester en 1821: 8.000 según el informe oficial y 23.108 según la tabla del Guardian, en figuras de 1.000');
    // Figura de 20 × 48 con la base en (0, 0)
    const figura = (padre, x, y, clase) => {
      const g = S('g', { transform: `translate(${x} ${y})` }, padre);
      const f = S('g', { class: 'h-figura-g' }, g);
      S('circle', { class: clase, cx: 10, cy: -40, r: 7.5 }, f);
      S('path', { class: clase, d: 'M3,-31 h14 a3,3 0 0 1 3,3 v15 h-4 v13 h-5 v-12 h-2 v12 h-5 v-13 h-4 v-15 a3,3 0 0 1 3,-3 z' }, f);
      return f;
    };
    // Hay sitio entre filas para la figura agrandada (48 × 2,9 de alto)
    const filas = [[70, 'Informe oficial', '8.000', 8, 8], [232, 'Tabla de N. H.', '23.108', 23, 8]];
    const etiquetas = (y, nombre, cifra) => {
      S('text', { class: 'h-texto h-texto--fuerte', x: 0, y: y - 26 }, svg).textContent = nombre;
      S('text', { class: 'h-texto', x: 0, y: y - 8, 'font-size': 22, 'font-family': 'var(--ff-display)', 'font-weight': 900 }, svg).textContent = cifra;
    };
    filas.forEach(([y, nombre, cifra]) => etiquetas(y, nombre, cifra));

    const repetir = S('g', { class: 'h-vista h-vista--repetir' }, svg);
    const todas = [];
    filas.forEach(([y, , , n, previas]) => {
      for (let i = 0; i < n; i++) {
        const f = figura(repetir, x0 + i * paso, y, i < previas ? 'h-figura' : 'h-figura h-figura--nueva');
        f.style.transitionDelay = `${todas.length * 45}ms`;
        todas.push(f);
      }
    });
    S('text', { class: 'h-texto', x: x0, y: H - 6 }, repetir).textContent = 'Cada figura, 1.000 alumnos.';

    const agrandar = S('g', { class: 'h-vista h-vista--agrandar' }, svg);
    figura(agrandar, x0, filas[0][0], 'h-figura');
    const escala = 23108 / 8000;
    const grande = S('g', { class: 'h-grande' }, S('g', { transform: `translate(${x0} ${filas[1][0]})` }, agrandar));
    figura(S('g', { transform: `scale(${escala})` }, grande), 0, 0, 'h-figura h-figura--nueva');
    S('text', { class: 'h-texto h-texto--sangre', x: x0 + 20 * escala + 16, y: filas[1][0] - 60 }, agrandar).textContent = `${num(escala, 1)} veces más alta…`;
    S('text', { class: 'h-texto h-texto--sangre', x: x0 + 20 * escala + 16, y: filas[1][0] - 40 }, agrandar).textContent = `…pero ocupa ${num(escala * escala, 1)} veces más superficie`;

    const textos = {
      repetir: 'Isotype: la figura vale siempre lo mismo. Para decir «más», se repite. 8 figuras frente a 23: se cuentan y se comparan de un vistazo.',
      agrandar: `El error clásico: agrandar la figura. Es ${num(escala, 1)} veces más alta, pero el ojo compara superficies y ve ${num(escala * escala, 1)} veces más. Exagera la diferencia.`,
    };
    return { estado(v) { if (lectura) lectura.textContent = textos[v] || ''; } };
  };

  // ---- UNIVAC: LA NOCHE ELECTORAL DE 1952 ----
  window.RUTAS.piezas.univac = el => {
    const lineas = [...el.querySelectorAll('.tele__linea')];
    const textos = lineas.map(l => l.textContent);
    const votos = el.parentElement.querySelectorAll('.votos__barra');
    let temporizador = 0;
    const final = () => { lineas.forEach((l, i) => { l.textContent = textos[i]; }); votos.forEach(v => { v.style.transform = ''; }); };
    return {
      entrar() {
        clearTimeout(temporizador);
        if (reducir()) { final(); return; }
        lineas.forEach(l => { l.textContent = ''; });
        votos.forEach(v => { v.style.transition = 'none'; v.style.transform = 'scaleX(0)'; });
        const cursor = document.createElement('span');
        cursor.className = 'tele__cursor';
        let li = 0, ci = 0;
        const escribir = () => {
          if (li >= lineas.length) {
            cursor.remove();
            votos.forEach((v, i) => { v.style.transition = `transform 0.9s cubic-bezier(.2,.8,.2,1) ${i * 250}ms`; v.style.transform = ''; });
            return;
          }
          const t = textos[li];
          lineas[li].textContent = t.slice(0, ++ci);
          lineas[li].appendChild(cursor);
          if (ci >= t.length) { li++; ci = 0; temporizador = setTimeout(escribir, 420); }
          else temporizador = setTimeout(escribir, 38);
        };
        escribir();
      },
    };
  };

  // ---- PIEZAS QUE SOLO ESCALONAN SU APARICIÓN ----
  // (casas de Dedman y chinchetas de chicagocrime.org)
  const escalonar = selector => el => {
    el.querySelectorAll(selector).forEach((c, i) => { c.style.transitionDelay = `${i * 90}ms`; });
    return {};
  };
  // ---- USA TODAY: SECUENCIA DE PASOS ----
  // Texto y foto del paso activo; las flechas avanzan o retroceden.
  window.RUTAS.piezas.rorick = el => {
    const total = el.querySelectorAll('.secuencia__foto').length;
    const ant = el.querySelector('[data-mover="-1"]');
    const sig = el.querySelector('[data-mover="1"]');
    const contador = el.querySelector('[data-contador]');
    let actual = 1;
    const ir = n => {
      actual = Math.min(total, Math.max(1, n));
      el.dataset.estado = actual;
      el.querySelectorAll('[data-paso]').forEach(p => p.classList.toggle('is-activo', Number(p.dataset.paso) === actual));
      ant.disabled = actual === 1;
      sig.disabled = actual === total;
      contador.textContent = actual;
    };
    [ant, sig].forEach(b => b.addEventListener('click', () => ir(actual + Number(b.dataset.mover))));
    return { estado(v) { ir(Number(v)); } };
  };

  window.RUTAS.piezas.casas = escalonar('.casas__casa');

  window.RUTAS.piezas.chinchetas = el => {
    const svg = el.querySelector('svg');
    const W = 640, H = 360;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-hidden', 'true');
    S('rect', { width: W, height: H, fill: '#E7E3DC' }, svg);
    for (let cx = 0; cx < W; cx += 64) for (let cy = 0; cy < H; cy += 48) S('rect', { class: 'h-manzana', x: cx + 6, y: cy + 6, width: 52, height: 36, rx: 3 }, svg);
    S('line', { class: 'h-avenida', x1: 0, y1: 240, x2: W, y2: 96 }, svg);
    S('line', { class: 'h-avenida', x1: 320, y1: 0, x2: 320, y2: H }, svg);
    let semilla = 11;
    const azar = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 34; i++) {
      const px = 20 + azar() * (W - 40), py = 30 + azar() * (H - 40);
      const c = S('path', { class: 'h-chincheta', d: `M${px},${py} c-7,-10 -9,-14 -9,-18 a9,9 0 1 1 18,0 c0,4 -2,8 -9,18 z` }, svg);
      c.style.transitionDelay = `${i * 60}ms`;
    }
    return {};
  };

  // ---- PAPELES DE PANAMÁ: UN PUNTO, 10.000 DOCUMENTOS ----
  window.RUTAS.piezas.panama = el => {
    const svg = el.querySelector('svg');
    const columnas = 50, filas = 23, paso = 12;
    svg.setAttribute('viewBox', `0 0 ${columnas * paso} ${filas * paso}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '1.150 puntos: cada uno representa 10.000 documentos de los Papeles de Panamá');
    const puntos = [];
    for (let i = 0; i < columnas * filas; i++) {
      puntos.push(S('circle', { class: 'h-doc', cx: (i % columnas) * paso + paso / 2, cy: Math.floor(i / columnas) * paso + paso / 2, r: paso * 0.36 }, svg));
    }
    let temporizador = 0;
    return {
      entrar() {
        clearInterval(temporizador);
        if (reducir()) { puntos.forEach(p => p.classList.add('is-lleno')); return; }
        puntos.forEach(p => p.classList.remove('is-lleno'));
        let i = 0;
        temporizador = setInterval(() => {
          for (let k = 0; k < 23 && i < puntos.length; k++, i++) puntos[i].classList.add('is-lleno');
          if (i >= puntos.length) clearInterval(temporizador);
        }, 40);
      },
    };
  };
})();
