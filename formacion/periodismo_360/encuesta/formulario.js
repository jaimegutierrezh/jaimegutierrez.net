/* ================================================
   ENCUESTA · Formulario de los alumnos
   Una pregunta por pantalla. Todas se pueden saltar.
   ================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const C = window.ENCUESTA_COMUN;
  const { preguntas } = window.ENCUESTA;
  const caja = document.getElementById('pantalla');
  const barra = document.querySelector('.encuesta__progreso-barra');
  const btnAtras = document.getElementById('atras');
  const btnSiguiente = document.getElementById('siguiente');
  const nav = document.querySelector('.navegacion');
  const claveEnviada = `encuesta-enviada-${C.grupo}`;

  const respuestas = {};
  let indice = -1; // -1 = pantalla de inicio
  let estado = null; // respuesta de ?accion=estado: { abierta, motivo, hasta }

  // ---- MENSAJES DE ENCUESTA CERRADA ----
  const MOTIVOS = {
    cerrada: 'Esta encuesta ya no admite respuestas. Si crees que es un error, avisa al profesor.',
    fecha: 'El plazo para responder esta encuesta ha terminado. Gracias de todas formas.',
    grupo: 'Este enlace no corresponde a ninguna encuesta abierta. Revisa el enlace que os han dado en clase.',
  };

  // ---- PREGUNTAS VISIBLES ----
  // Las condicionales (alquiler) dependen de respuestas anteriores
  const visibles = () => preguntas.filter(p => !p.mostrarSi || p.mostrarSi(respuestas));

  // ---- UTILIDADES DE DOM ----
  function el(etiqueta, attrs = {}, hijos = []) {
    const n = document.createElement(etiqueta);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'texto') n.textContent = v;
      else if (k === 'clase') n.className = v;
      else if (v !== false && v !== undefined) n.setAttribute(k, v === true ? '' : v);
    });
    hijos.forEach(h => h && n.appendChild(h));
    return n;
  }
  const idCampo = (p, sufijo = '') => `campo-${p.campo}${sufijo}`;

  // ---- PANTALLA DE INICIO ----
  function pintarInicio() {
    const yaEnviada = C.leer(claveEnviada);
    const hijos = [
      el('p', { clase: 'pantalla__contador', texto: 'Encuesta anónima · 5 minutos' }),
      el('h1', { clase: 'pantalla__titulo', tabindex: '-1', texto: 'Tu vida en datos' }),
      el('div', { clase: 'pantalla__campos' }, [
        el('p', { clase: 'pantalla__texto', texto: 'No pedimos nombre, correo ni edad exacta. Las respuestas solo se usan en clase, se muestran siempre agrupadas y se borran al terminar el curso.' }),
        el('p', { clase: 'pantalla__texto', texto: 'Puedes saltarte cualquier pregunta.' }),
      ]),
    ];
    if (!C.endpoint) {
      hijos.push(el('p', { clase: 'pantalla__aviso', texto: 'Modo prueba: la encuesta todavía no está conectada y las respuestas no se guardarán.' }));
    } else if (yaEnviada) {
      hijos.push(el('p', { clase: 'pantalla__aviso', texto: 'Ya has respondido desde este dispositivo. Si lo haces otra vez, contará como una respuesta más.' }));
    }
    if (estado?.hasta) {
      hijos.push(el('p', { clase: 'pantalla__ayuda', texto: `Abierta hasta el ${estado.hasta}.` }));
    }
    pintar(hijos, 'Empezar');
    if (C.endpoint && estado === null) comprobarEstado();
  }

  // ---- ¿ESTÁ ABIERTA? ----
  // Si no se puede comprobar (sin conexión), se deja empezar: el script
  // vuelve a comprobarlo al enviar.
  async function comprobarEstado() {
    btnSiguiente.disabled = true;
    btnSiguiente.textContent = 'Comprobando…';
    try {
      const resp = await fetch(`${C.endpoint}?accion=estado&grupo=${encodeURIComponent(C.grupo)}`);
      const json = await resp.json();
      estado = json.ok ? json : { abierta: true };
    } catch (err) {
      estado = { abierta: true };
    }
    if (!estado.abierta) return pintarCerrada(estado.motivo);
    if (indice < 0) pintarInicio();
  }

  function pintarCerrada(motivo) {
    nav.hidden = true;
    caja.replaceChildren(
      el('p', { clase: 'pantalla__contador', texto: 'Encuesta cerrada' }),
      el('h1', { clase: 'pantalla__titulo', tabindex: '-1', texto: 'Tu vida en datos' }),
      el('p', { clase: 'pantalla__texto pantalla__campos', texto: MOTIVOS[motivo] || MOTIVOS.cerrada }),
    );
    caja.querySelector('.pantalla__titulo').focus({ preventScroll: true });
  }

  // ---- PANTALLA DE PREGUNTA ----
  function pintarPregunta(p, n, total) {
    const hijos = [
      el('p', { clase: 'pantalla__contador', texto: `${n} de ${total}` }),
      el('h1', { clase: 'pantalla__titulo', id: 'titulo-pregunta', tabindex: '-1', texto: p.titulo }),
    ];
    if (p.ayuda) hijos.push(el('p', { clase: 'pantalla__ayuda', id: 'ayuda-pregunta', texto: p.ayuda }));
    const campos = el('fieldset', {
      clase: 'pantalla__campos',
      'aria-labelledby': 'titulo-pregunta',
      'aria-describedby': p.ayuda ? 'ayuda-pregunta' : false,
    });
    campos.appendChild(controles(p));
    hijos.push(campos, el('p', { clase: 'pantalla__error', id: 'error', 'aria-live': 'polite' }));
    const ultima = n === total;
    pintar(hijos, ultima ? 'Enviar' : 'Siguiente');
  }

  function controles(p) {
    switch (p.tipo) {
      case 'duracion': return ctlDuracion(p);
      case 'unica': return ctlOpciones(p, 'radio');
      case 'multiple': return ctlOpciones(p, 'checkbox');
      case 'numero': return ctlNumero(p);
      case 'texto': return ctlTexto(p);
      case 'lista': return ctlLista(p);
    }
    return el('p', { texto: 'Tipo de pregunta desconocido' });
  }

  function ctlDuracion(p) {
    const v = respuestas[p.campo];
    const h = v !== undefined ? Math.floor(Math.round(v * 60) / 60) : '';
    const m = v !== undefined ? Math.round(v * 60) % 60 : '';
    const parte = (sufijo, etiqueta, valor, max) => el('label', { clase: 'campo' }, [
      el('span', { clase: 'campo__etiqueta', texto: etiqueta }),
      el('input', {
        clase: 'campo__entrada', id: idCampo(p, sufijo), type: 'text', inputmode: 'numeric',
        autocomplete: 'off', maxlength: '2', value: String(valor), 'data-max': max,
      }),
    ]);
    return el('div', { clase: 'campo__fila' }, [
      parte('-h', 'Horas', h, 24),
      parte('-m', 'Minutos', m, 59),
    ]);
  }

  function ctlOpciones(p, tipo) {
    const lista = el('div', {
      clase: 'opciones' + (p.opciones.length > 5 ? ' opciones--columnas' : ''),
      role: tipo === 'radio' ? 'radiogroup' : 'group',
      'aria-labelledby': 'titulo-pregunta',
    });
    const actual = respuestas[p.campo];
    p.opciones.forEach((op, i) => {
      const marcada = tipo === 'radio' ? actual === op : Array.isArray(actual) && actual.includes(op);
      const input = el('input', { type: tipo, name: p.campo, value: op, id: idCampo(p, `-${i}`), checked: marcada });
      lista.appendChild(el('label', { clase: 'opcion' + (tipo === 'checkbox' ? ' opcion--casilla' : '') }, [
        input, el('span', { clase: 'opcion__caja', texto: op }),
      ]));
    });
    const envoltura = el('div', {}, [lista]);
    if (p.otra) {
      const otra = el('label', { clase: 'campo campo__otra', hidden: actual !== p.otra.opcion }, [
        el('span', { clase: 'campo__etiqueta', texto: p.otra.etiqueta }),
        el('input', {
          clase: 'campo__entrada campo__entrada--ancha', id: idCampo(p, '-otra'), type: 'text',
          maxlength: String(p.otra.max), autocomplete: 'off', value: respuestas[p.otra.campo] || '',
        }),
      ]);
      envoltura.appendChild(otra);
      lista.addEventListener('change', () => {
        const sel = lista.querySelector('input:checked');
        otra.hidden = !(sel && sel.value === p.otra.opcion);
        if (!otra.hidden) otra.querySelector('input').focus();
      });
    }
    if (p.exclusiva) {
      // «Casi no me informo» no se combina con las demás
      lista.addEventListener('change', e => {
        const t = e.target;
        if (!t.checked) return;
        lista.querySelectorAll('input').forEach(i => {
          if (i !== t && (t.value === p.exclusiva || i.value === p.exclusiva)) i.checked = false;
        });
      });
    }
    if (tipo === 'radio') {
      // Con ratón o dedo, elegir una opción avanza sola (salvo «Otra»)
      lista.addEventListener('click', e => {
        const input = e.target.closest('label')?.querySelector('input');
        if (!input || e.detail === 0) return;
        if (p.otra && input.value === p.otra.opcion) return;
        setTimeout(siguiente, 280);
      });
    }
    return envoltura;
  }

  function ctlNumero(p) {
    const actual = respuestas[p.campo];
    const casillaMarcada = p.casilla && (p.casilla.desactiva
      ? actual === p.casilla.valor
      : respuestas[p.casilla.campo] === p.casilla.valor);
    const valorVisible = actual === undefined || (p.casilla?.desactiva && casillaMarcada)
      ? '' : String(actual).replace('.', ',');
    const entrada = el('input', {
      clase: 'campo__entrada', id: idCampo(p), type: 'text',
      inputmode: p.paso < 1 ? 'decimal' : 'numeric', autocomplete: 'off',
      value: valorVisible, disabled: p.casilla?.desactiva && casillaMarcada,
    });
    const fila = el('div', { clase: 'campo__fila' }, [
      el('label', { clase: 'campo', for: idCampo(p) }, [
        el('span', { clase: 'campo__etiqueta', texto: `Entre ${C.numero(p.min, 0)} y ${C.numero(p.max, 0)}` }),
        entrada,
      ]),
      el('span', { clase: 'campo__unidad', texto: p.unidad }),
    ]);
    const envoltura = el('div', {}, [fila]);
    if (p.casilla) {
      const casilla = el('input', { type: 'checkbox', id: idCampo(p, '-casilla'), checked: casillaMarcada });
      envoltura.appendChild(el('label', { clase: 'opcion opcion--casilla campo__casilla' }, [
        casilla, el('span', { clase: 'opcion__caja', texto: p.casilla.texto }),
      ]));
      if (p.casilla.desactiva) {
        casilla.addEventListener('change', () => {
          entrada.disabled = casilla.checked;
          if (casilla.checked) entrada.value = '';
        });
      }
    }
    return envoltura;
  }

  function ctlTexto(p) {
    return el('label', { clase: 'campo', for: idCampo(p) }, [
      el('span', { clase: 'campo__etiqueta', texto: `Máximo ${p.max} caracteres` }),
      el('input', {
        clase: 'campo__entrada campo__entrada--ancha', id: idCampo(p), type: 'text',
        maxlength: String(p.max), autocomplete: 'off', value: respuestas[p.campo] || '',
      }),
    ]);
  }

  function ctlLista(p) {
    const sel = el('select', { clase: 'campo__entrada', id: idCampo(p) }, [
      el('option', { value: '', texto: 'Elige una opción' }),
      ...p.opciones.map(o => el('option', { value: o, texto: o, selected: respuestas[p.campo] === o })),
    ]);
    return el('label', { clase: 'campo', for: idCampo(p) }, [sel]);
  }

  // ---- LEER Y VALIDAR LA PANTALLA ACTUAL ----
  // Devuelve un mensaje de error o null. Un campo vacío no es un error.
  function recoger(p) {
    const $ = s => document.getElementById(s);
    const fuera = (n, min, max) => Number.isNaN(n) || n < min || n > max;

    switch (p.tipo) {
      case 'duracion': {
        const h = C.leerNumero($(idCampo(p, '-h')).value);
        const m = C.leerNumero($(idCampo(p, '-m')).value);
        if (h === null && m === null) { delete respuestas[p.campo]; return null; }
        if (fuera(h ?? 0, 0, 24) || fuera(m ?? 0, 0, 59) || !Number.isInteger(h ?? 0) || !Number.isInteger(m ?? 0)) {
          return 'Escribe horas (0 a 24) y minutos (0 a 59) en números enteros.';
        }
        const total = (h ?? 0) + (m ?? 0) / 60;
        if (total > 24) return 'Un día tiene 24 horas como máximo.';
        respuestas[p.campo] = Math.round(total * 100) / 100;
        return null;
      }
      case 'unica': {
        const sel = caja.querySelector(`input[name="${p.campo}"]:checked`);
        if (sel) respuestas[p.campo] = sel.value; else delete respuestas[p.campo];
        if (p.otra) {
          const texto = $(idCampo(p, '-otra')).value.trim();
          if (sel && sel.value === p.otra.opcion && texto) respuestas[p.otra.campo] = texto;
          else delete respuestas[p.otra.campo];
        }
        return null;
      }
      case 'multiple': {
        const sel = [...caja.querySelectorAll(`input[name="${p.campo}"]:checked`)].map(i => i.value);
        if (sel.length) respuestas[p.campo] = sel; else delete respuestas[p.campo];
        return null;
      }
      case 'numero': {
        const casilla = p.casilla && $(idCampo(p, '-casilla'));
        if (casilla && p.casilla.desactiva && casilla.checked) {
          respuestas[p.campo] = p.casilla.valor;
          return null;
        }
        if (casilla && !p.casilla.desactiva) {
          if (casilla.checked) respuestas[p.casilla.campo] = p.casilla.valor;
          else delete respuestas[p.casilla.campo];
        }
        const n = C.leerNumero($(idCampo(p)).value);
        if (n === null) { delete respuestas[p.campo]; return null; }
        if (fuera(n, p.min, p.max)) return `Escribe un número entre ${C.numero(p.min, 0)} y ${C.numero(p.max, 0)}.`;
        respuestas[p.campo] = n;
        return null;
      }
      case 'texto': {
        const t = $(idCampo(p)).value.trim();
        if (t) respuestas[p.campo] = t; else delete respuestas[p.campo];
        return null;
      }
      case 'lista': {
        const v = $(idCampo(p)).value;
        if (v) respuestas[p.campo] = v; else delete respuestas[p.campo];
        return null;
      }
    }
    return null;
  }

  // ---- NAVEGACIÓN ----
  function pintar(hijos, textoSiguiente) {
    caja.replaceChildren(...hijos);
    caja.classList.remove('pantalla');
    void caja.offsetWidth; // reinicia la animación de entrada
    caja.classList.add('pantalla');
    btnSiguiente.textContent = textoSiguiente;
    btnSiguiente.disabled = false;
    btnAtras.hidden = indice < 0;
    nav.hidden = false;
    const lista = visibles();
    barra.style.width = `${Math.max(0, (indice) / lista.length) * 100}%`;
    caja.querySelector('.pantalla__titulo')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function mostrar() {
    if (indice < 0) return pintarInicio();
    const lista = visibles();
    pintarPregunta(lista[indice], indice + 1, lista.length);
  }

  function siguiente() {
    if (btnSiguiente.disabled) return;
    if (indice >= 0) {
      const error = recoger(visibles()[indice]);
      if (error) {
        document.getElementById('error').textContent = error;
        return;
      }
    }
    if (indice === visibles().length - 1) return enviar();
    indice++;
    mostrar();
  }

  function atras() {
    if (indice < 0) return;
    recoger(visibles()[indice]);
    indice--;
    mostrar();
  }

  btnSiguiente.addEventListener('click', siguiente);
  btnAtras.addEventListener('click', atras);
  caja.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') {
      e.preventDefault();
      siguiente();
    }
  });

  // ---- ENVÍO ----
  function respuestasFinales() {
    const r = { ...respuestas };
    // Si cambió de opinión y vive con su familia, el alquiler no aplica
    preguntas.forEach(p => {
      if (p.mostrarSi && !p.mostrarSi(r)) delete r[p.campo];
    });
    return r;
  }

  async function enviar() {
    const datos = { grupo: C.grupo, respuestas: respuestasFinales() };
    btnSiguiente.disabled = true;
    btnSiguiente.textContent = 'Enviando…';

    if (!C.endpoint) {
      console.info('Modo prueba. Esto es lo que se enviaría:', datos);
      return pintarFinal({ prueba: true, n: null, mediana_pantalla: null }, datos.respuestas);
    }
    try {
      const resp = await fetch(C.endpoint, { method: 'POST', body: JSON.stringify(datos) });
      const json = await resp.json();
      if (!json.ok) throw new Error(json.error || 'error');
      C.guardar(claveEnviada, new Date().toISOString());
      pintarFinal(json, datos.respuestas);
    } catch (err) {
      // Se cerró mientras respondía: no tiene sentido reintentar
      if (MOTIVOS[err.message]) return pintarCerrada(err.message);
      btnSiguiente.disabled = false;
      btnSiguiente.textContent = 'Reintentar';
      document.getElementById('error').textContent =
        'No se ha podido enviar. Revisa la conexión y vuelve a intentarlo: tus respuestas siguen aquí.';
    }
  }

  function pintarFinal(res, r) {
    nav.hidden = true;
    barra.style.width = '100%';
    const hijos = [
      el('p', { clase: 'pantalla__contador', texto: res.prueba ? 'Modo prueba · no se ha guardado' : 'Respuesta enviada' }),
      el('h1', { clase: 'pantalla__titulo', tabindex: '-1', texto: 'Gracias' }),
    ];
    if (res.n) {
      hijos.push(
        el('p', { clase: 'final__cifra', texto: String(res.n) }),
        el('p', { clase: 'pantalla__texto', texto: res.n === 1 ? 'respuesta en la clase, por ahora.' : 'respuestas en la clase, por ahora.' }),
      );
    }
    const datos = el('div', { clase: 'final__datos' });
    datos.appendChild(el('p', { clase: 'final__dato' }, [
      el('span', { texto: 'Tu tiempo de pantalla' }), el('b', { texto: C.duracion(r.pantalla_horas) }),
    ]));
    if (res.mediana_pantalla !== null && res.mediana_pantalla !== undefined) {
      datos.appendChild(el('p', { clase: 'final__dato' }, [
        el('span', { texto: 'Mediana de la clase, por ahora' }), el('b', { texto: C.duracion(res.mediana_pantalla) }),
      ]));
    }
    hijos.push(datos, el('p', { clase: 'pantalla__ayuda', texto: 'En unos minutos lo vemos juntos en la pantalla.' }));
    caja.replaceChildren(...hijos);
    caja.querySelector('.pantalla__titulo').focus({ preventScroll: true });
  }

  mostrar();
});
