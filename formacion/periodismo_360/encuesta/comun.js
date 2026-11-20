/* ================================================
   ENCUESTA · Utilidades comunes (formulario y profesor)
   ================================================ */

'use strict';

window.ENCUESTA_COMUN = (function () {
  const cfg = window.ENCUESTA_CONFIG || {};
  const params = new URLSearchParams(location.search);

  // ---- GRUPO Y DIRECCIÓN DEL SERVIDOR ----
  const grupoUrl = params.get('grupo');
  const grupo = grupoUrl && /^[a-z0-9-]{1,40}$/.test(grupoUrl) ? grupoUrl : cfg.grupo;
  // Solo en local se puede apuntar a otro servidor para hacer pruebas
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const endpoint = (local && params.get('api')) || cfg.endpoint || '';

  // ---- FORMATOS ----
  function numero(n, decimales = 1) {
    return n.toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  }
  function duracion(horas) {
    if (horas === null || horas === undefined || horas === '' || isNaN(horas)) return '—';
    const total = Math.round(Number(horas) * 60);
    const h = Math.floor(total / 60), m = total % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  // Acepta «7,5» y «7.5»
  function leerNumero(texto) {
    if (typeof texto !== 'string' || texto.trim() === '') return null;
    const n = Number(texto.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  // ---- ESTADÍSTICOS ----
  function media(v) { return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
  function mediana(v) {
    if (!v.length) return null;
    const s = [...v].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  // ---- ALMACENAMIENTO LOCAL (solo comodidades) ----
  function guardar(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) { /* nada */ } }
  function leer(clave) { try { return localStorage.getItem(clave); } catch (e) { return null; } }
  function borrar(clave) { try { localStorage.removeItem(clave); } catch (e) { /* nada */ } }

  return { grupo, endpoint, numero, duracion, leerNumero, media, mediana, guardar, leer, borrar };
})();
