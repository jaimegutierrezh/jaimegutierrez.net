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

  // ---- TEST DE VERDADERO O FALSO ----
  // <div class="test" data-test><ol><li class="test__item" data-correcta="v|f">
  //   <p class="test__frase">…</p><div class="test__explicacion">…</div></li>…
  // Los botones los pone el JS. Al responder se marca acierto o fallo y se
  // muestra la explicación. Sin JS, las explicaciones se ven directamente.
  document.querySelectorAll('[data-test]').forEach(test => {
    const items = [...test.querySelectorAll('.test__item')];
    const marcador = test.querySelector('.test__marcador');
    const final = test.querySelector('.test__final');

    items.forEach(item => {
      const botones = document.createElement('div');
      botones.className = 'test__botones';
      [['v', 'Verdadero'], ['f', 'Falso']].forEach(([valor, texto]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'test__boton';
        b.dataset.respuesta = valor;
        b.textContent = texto;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => responder(item, valor));
        botones.append(b);
      });
      const veredicto = document.createElement('p');
      veredicto.className = 'test__veredicto';
      const explicacion = item.querySelector('.test__explicacion');
      explicacion.prepend(veredicto);
      explicacion.setAttribute('aria-live', 'polite');
      item.querySelector('.test__frase').after(botones);
    });

    function responder(item, valor) {
      if (item.dataset.respondida) return;
      const acierto = valor === item.dataset.correcta;
      item.dataset.respondida = acierto ? 'acierto' : 'fallo';
      item.querySelectorAll('.test__boton').forEach(b => {
        b.disabled = true;
        b.setAttribute('aria-pressed', String(b.dataset.respuesta === valor));
        b.classList.toggle('is-correcta', b.dataset.respuesta === item.dataset.correcta);
      });
      const correcta = item.dataset.correcta === 'v' ? 'verdadera' : 'falsa';
      item.querySelector('.test__veredicto').textContent = acierto ? `Bien: es ${correcta}.` : `No: es ${correcta}.`;
      actualizar();
    }

    function actualizar() {
      const hechas = items.filter(i => i.dataset.respondida);
      const aciertos = hechas.filter(i => i.dataset.respondida === 'acierto').length;
      const completo = hechas.length === items.length;
      test.classList.toggle('is-completo', completo);
      if (final) final.hidden = !completo;
      if (marcador) marcador.textContent = completo ? `${aciertos} de ${items.length} aciertos` : '';
    }

    test.querySelector('.test__repetir')?.addEventListener('click', () => {
      items.forEach(item => {
        delete item.dataset.respondida;
        item.querySelector('.test__veredicto').textContent = '';
        item.querySelectorAll('.test__boton').forEach(b => {
          b.disabled = false;
          b.setAttribute('aria-pressed', 'false');
          b.classList.remove('is-correcta');
        });
      });
      actualizar();
      items[0].scrollIntoView({ behavior: reducir() ? 'auto' : 'smooth', block: 'center' });
    });

    test.classList.add('is-activo');
    actualizar();
  });

  // ---- VISTA DEL PROFESOR ----
  // Se entra con #clave=… en la URL: la clave pasa a la sesión de la pestaña
  // (sigue al navegar entre clases) y desaparece de la barra de direcciones.
  // Lo marcado con data-solo-profesor (botón de proyector, atajo P) solo se
  // ve en esta vista.
  const CLAVE_SESION = 'encuesta-clave';
  const mClave = location.hash.match(/clave=([^&]+)/);
  if (mClave) {
    try { sessionStorage.setItem(CLAVE_SESION, decodeURIComponent(mClave[1])); } catch (e) { /* nada */ }
    history.replaceState(null, '', location.pathname + location.search);
  }
  let clave = null;
  try { clave = sessionStorage.getItem(CLAVE_SESION); } catch (e) { /* nada */ }
  const esProfesor = Boolean(clave);
  raiz.classList.toggle('vista-profesor', esProfesor);
  if (!esProfesor) document.querySelectorAll('[data-solo-profesor]').forEach(el => el.remove());

  // ---- MODO PROYECTOR (solo profesor) ----
  const botonProyector = document.querySelector('[data-accion="proyector"]');
  function ponerProyector(activo) {
    if (!esProfesor) return;
    raiz.classList.toggle('modo-proyector', activo);
    botonProyector?.setAttribute('aria-pressed', String(activo));
    CURSO_UTIL.guardar('curso-proyector', activo ? '1' : '0');
  }
  if (CURSO_UTIL.leer('curso-proyector') === '1') ponerProyector(true);
  botonProyector?.addEventListener('click', () => ponerProyector(!raiz.classList.contains('modo-proyector')));

  // ---- APERTURAS: CLASES Y SOLUCIONES QUE ABRE EL PROFESOR ----
  // - Clase cerrada: <html data-clase="clase2">. Se tapa con una cortina hasta
  //   que el profesor la abra para el grupo (el de ?grupo= o, si no hay, el de
  //   config.js, así que también afecta a los visitantes de la web).
  // - Solución cerrada: <details data-solucion="clase1-reto">. Solo se cierra
  //   cuando la página se abre con ?grupo= (en clase).
  // Las dos usan la lista del script (accion=soluciones). Los alumnos consultan
  // cada 10 s; el profesor tiene botones para abrir y cerrar. Sin conexión, todo
  // se muestra para no dejar la clase sin material.
  const params = new URLSearchParams(location.search);
  const valido = g => Boolean(g) && /^[a-z0-9-]{1,40}$/.test(g);
  const grupoUrl = valido(params.get('grupo')) ? params.get('grupo') : null;
  const grupoDefecto = valido(window.ENCUESTA_CONFIG?.grupo) ? window.ENCUESTA_CONFIG.grupo : null;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const endpoint = (local && params.get('api')) || window.ENCUESTA_CONFIG?.endpoint;
  const idClase = raiz.dataset.clase && valido(raiz.dataset.clase) ? raiz.dataset.clase : null;
  const grupoAp = grupoUrl || (idClase ? grupoDefecto : null);
  const candado = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  const piezas = [];

  function botonProfesor(clase, id) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = clase;
    b.addEventListener('click', () => cambiar(id, b.dataset.abrir === '1', b));
    return b;
  }

  // Clase entera
  if (idClase && endpoint && grupoAp) {
    const titulo = document.querySelector('.barra__titulo')?.textContent || 'Esta clase';
    const cortina = document.createElement('section');
    cortina.className = 'cortina';
    cortina.setAttribute('role', 'status');
    cortina.innerHTML = `<div class="cortina__interior">${candado}<p class="cortina__titulo"></p><p class="cortina__texto">Esta clase todavía no está abierta. Se abrirá en el aula.</p><a class="cortina__volver" href="../">← Volver al curso</a></div>`;
    cortina.querySelector('.cortina__titulo').textContent = titulo;
    document.querySelector('main')?.before(cortina);
    const boton = esProfesor ? botonProfesor('cortina__boton', idClase) : null;
    piezas.push({
      id: idClase,
      poner(abierta) {
        raiz.classList.toggle('clase-abierta', abierta);
        cortina.hidden = abierta;
        if (!boton) return;
        boton.dataset.abrir = abierta ? '0' : '1';
        boton.textContent = abierta ? 'Cerrar la clase' : 'Abrir la clase a los alumnos';
        // Para abrir, dentro de la cortina; para cerrar, en la barra superior
        if (abierta) document.querySelector('.barra__acciones')?.prepend(boton);
        else cortina.querySelector('.cortina__volver').before(boton);
      },
      cerrada: () => !raiz.classList.contains('clase-abierta'),
    });
  } else if (idClase) {
    raiz.classList.add('clase-abierta');
  }

  // Soluciones de los retos (solo en clase, con ?grupo=)
  if (grupoUrl && endpoint) {
    document.querySelectorAll('[data-solucion]').forEach(det => {
      const aviso = document.createElement('div');
      aviso.className = 'solucion-cerrada';
      aviso.dataset.parada = '';
      aviso.setAttribute('role', 'status');
      aviso.innerHTML = `${candado}<p><strong>Solución cerrada.</strong> Se abrirá cuando terminéis el ejercicio.</p>`;
      det.before(aviso);
      const boton = esProfesor ? botonProfesor('solucion-profesor', det.dataset.solucion) : null;
      piezas.push({
        id: det.dataset.solucion,
        poner(abierta) {
          const antes = !det.hidden;
          det.hidden = !abierta;
          aviso.hidden = abierta;
          if (abierta && !antes && esProfesor) det.open = true;
          if (!boton) return;
          boton.dataset.abrir = abierta ? '0' : '1';
          boton.textContent = abierta ? 'Volver a cerrar la solución' : 'Abrir la solución a la clase';
          // El botón de abrir va bajo el aviso; el de cerrar, bajo la solución
          (abierta ? det : aviso).after(boton);
        },
        cerrada: () => det.hidden,
      });
    });
  }

  function pintarAperturas(abiertas) {
    piezas.forEach(p => p.poner(abiertas.includes(p.id)));
  }

  async function cambiar(id, abrir, boton) {
    boton.disabled = true;
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ accion: 'solucion', grupo: grupoAp, clave, id, abrir }),
      });
      const json = await resp.json();
      if (json.ok) pintarAperturas(json.abiertas);
      else boton.textContent = json.error === 'clave' ? 'La clave no es correcta' : 'No se pudo cambiar. Prueba otra vez';
    } catch (e) {
      boton.textContent = 'Sin conexión. Prueba otra vez';
    }
    boton.disabled = false;
  }

  if (piezas.length) {
    // Mientras se consulta el estado, todo empieza cerrado
    pintarAperturas([]);
    const todas = piezas.map(p => p.id);
    let primera = true;
    let temporizador = null;
    const quedanCerradas = () => piezas.some(p => p.cerrada());
    async function consultar() {
      clearTimeout(temporizador);
      if (!document.hidden || primera) {
        try {
          const resp = await fetch(`${endpoint}?accion=soluciones&grupo=${encodeURIComponent(grupoAp)}`);
          const json = await resp.json();
          if (json.ok) pintarAperturas(json.abiertas);
          else if (primera) pintarAperturas(todas);
        } catch (e) {
          if (primera) pintarAperturas(todas);
        }
        primera = false;
      }
      // Los alumnos siguen consultando mientras quede algo cerrado
      if (!esProfesor && quedanCerradas()) temporizador = setTimeout(consultar, 10000);
    }
    consultar();
    // Al volver a la pestaña se consulta en el momento
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !esProfesor && quedanCerradas()) consultar();
    });
  }

  // ---- NAVEGACIÓN CON TECLADO Y MANDO ----
  // → / ← y Avance/Retroceso de página (los mandos de presentación envían estas
  // teclas) saltan entre elementos con data-parada. «P» cambia el modo proyector
  // (solo en la vista del profesor) y «F» pone la pantalla completa.
  function destinos() {
    const alto = window.innerHeight;
    const barraAlto = barra ? barra.offsetHeight : 0;
    // Los elementos ocultos (por ejemplo, una solución cerrada) no cuentan
    return [...document.querySelectorAll('[data-parada]')].filter(el => el.getClientRects().length).map(el => {
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
        // Solo hace algo en la vista del profesor
        ponerProyector(!raiz.classList.contains('modo-proyector')); break;
      case 'f':
      case 'F':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else raiz.requestFullscreen?.();
        break;
    }
  });
});
