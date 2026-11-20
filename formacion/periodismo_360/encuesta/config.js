/* ================================================
   ENCUESTA · Configuración
   ================================================ */

'use strict';

window.ENCUESTA_CONFIG = {
  // URL de la aplicación web de Google Apps Script (termina en /exec).
  // Se obtiene al publicar el script: ver privado/encuesta/INSTRUCCIONES.md.
  endpoint: 'https://script.google.com/macros/s/AKfycbxfHInDl_LUuWhVz00RUljC2Bnq3jRqSQ64BGXiohcTnp7uxVG-RyurPSbi8bO8w-b9/exec',

  // Grupo por defecto. Cada edición del curso usa uno distinto para no
  // mezclar respuestas. Se puede cambiar en la URL: ?grupo=master-2026
  grupo: 'prueba',
};
