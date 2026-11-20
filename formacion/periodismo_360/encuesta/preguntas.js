/* ================================================
   ENCUESTA · Definición de las preguntas
   La comparten el formulario (formulario.js) y la vista del
   profesor (resultados.js). Si cambias opciones aquí, cámbialas
   también en la validación de Apps Script (privado/encuesta/Codigo.gs).
   ================================================ */

'use strict';

// ---- PROVINCIAS ----
const PROVINCIAS = [
  'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Barcelona', 'Bizkaia', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria',
  'Castellón', 'Ceuta', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Gipuzkoa', 'Girona',
  'Granada', 'Guadalajara', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén',
  'La Rioja', 'Las Palmas', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga',
  'Melilla', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra',
  'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria',
  'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Zamora', 'Zaragoza',
];

// ---- PREGUNTAS ----
// tipo: duracion | unica | multiple | numero | texto | lista
// campo: nombre de la columna en la hoja y en el CSV
window.ENCUESTA = {
  provincias: PROVINCIAS,
  columnas: [
    'pantalla_horas', 'pantalla_origen', 'app', 'app_otra', 'preocupacion',
    'sueno_horas', 'informacion', 'informativos_tv', 'artista', 'gasto_ocio',
    'convivencia', 'alquiler', 'edad_independencia', 'ya_independizado', 'provincia',
  ],
  preguntas: [
    {
      campo: 'pantalla_horas',
      tipo: 'duracion',
      titulo: '¿Cuánto tiempo usas el móvil al día?',
      ayuda: 'Míralo en Ajustes › Tiempo de uso (iPhone) o en Bienestar digital (Android): la media diaria de la última semana.',
    },
    {
      campo: 'pantalla_origen',
      tipo: 'unica',
      titulo: '¿De dónde has sacado el dato anterior?',
      opciones: ['Lo he mirado en el móvil', 'Es una estimación mía'],
    },
    {
      campo: 'app',
      tipo: 'unica',
      titulo: '¿Qué app usas más?',
      opciones: ['TikTok', 'Instagram', 'WhatsApp', 'YouTube', 'X', 'Spotify', 'Twitch', 'Otra'],
      otra: { opcion: 'Otra', campo: 'app_otra', max: 30, etiqueta: '¿Cuál?' },
    },
    {
      campo: 'preocupacion',
      tipo: 'unica',
      titulo: '¿Te preocupa el tiempo que pasas con el móvil?',
      opciones: ['Nada', 'Poco', 'Bastante', 'Mucho'],
      ordinal: true,
    },
    {
      campo: 'sueno_horas',
      tipo: 'numero',
      titulo: '¿Cuántas horas sueles dormir entre semana?',
      min: 0, max: 14, paso: 0.5, unidad: 'horas',
    },
    {
      campo: 'informacion',
      tipo: 'multiple',
      titulo: '¿Dónde te informas de la actualidad?',
      ayuda: 'Marca todas las que uses.',
      opciones: ['TikTok', 'Instagram', 'X', 'YouTube', 'Webs o apps de medios',
        'Televisión', 'Radio', 'Pódcast', 'Newsletters', 'Casi no me informo'],
      exclusiva: 'Casi no me informo',
    },
    {
      campo: 'informativos_tv',
      tipo: 'unica',
      titulo: 'En la última semana, ¿cuántos informativos de televisión has visto enteros?',
      opciones: ['Ninguno', '1 o 2', 'De 3 a 5', '6 o más'],
      ordinal: true,
    },
    {
      campo: 'artista',
      tipo: 'texto',
      titulo: '¿Qué artista has escuchado más este año?',
      max: 60,
    },
    {
      campo: 'gasto_ocio',
      tipo: 'numero',
      titulo: '¿Cuánto gastas al mes en ocio?',
      ayuda: 'Salir, conciertos, suscripciones, juegos…',
      min: 0, max: 3000, paso: 1, unidad: '€ al mes',
    },
    {
      campo: 'convivencia',
      tipo: 'unica',
      titulo: '¿Con quién vives durante el curso?',
      opciones: ['Con mi familia', 'En piso compartido', 'Solo/a', 'En pareja',
        'Residencia o colegio mayor', 'Otra'],
    },
    {
      campo: 'alquiler',
      tipo: 'numero',
      titulo: '¿Cuánto pagas al mes de alquiler?',
      ayuda: 'Solo tu parte.',
      min: 0, max: 3000, paso: 1, unidad: '€ al mes',
      casilla: { campo: 'alquiler', valor: 0, texto: 'No pago alquiler', desactiva: true },
      mostrarSi: r => r.convivencia && r.convivencia !== 'Con mi familia',
    },
    {
      campo: 'edad_independencia',
      tipo: 'numero',
      titulo: '¿A qué edad crees que te independizarás?',
      ayuda: 'Si ya lo has hecho, ¿a qué edad fue?',
      min: 16, max: 45, paso: 1, unidad: 'años',
      casilla: { campo: 'ya_independizado', valor: 'Sí', texto: 'Ya me he independizado', desactiva: false },
    },
    {
      campo: 'provincia',
      tipo: 'lista',
      titulo: '¿En qué provincia te has criado?',
      opciones: [...PROVINCIAS, 'Fuera de España'],
    },
  ],
};
