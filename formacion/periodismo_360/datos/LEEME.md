# Datos oficiales del curso

Datos para comparar la encuesta de clase con las estadísticas oficiales. Todos se descargaron el 22 de noviembre de 2026 y están en CSV (UTF-8, coma como separador y punto decimal). Los porcentajes van de 0 a 100.

| Archivo | Qué contiene | Fuente |
|---|---|---|
| `ine_tich_2026_uso_internet_por_edad.csv` | % de personas que usaron internet en los últimos 3 meses, a diario (al menos 5 días a la semana) y varias veces al día, por grupo de edad. 2026. | INE, Encuesta sobre Equipamiento y Uso de TIC en los Hogares (TIC-H) 2026, [tabla 82785](https://www.ine.es/jaxi/Tabla.htm?tpx=82785&L=0) |
| `ine_tich_2026_frecuencia_uso_por_edad.csv` | Reparto de cada grupo de edad según la frecuencia con que usa internet: varias veces al día, una vez al día, cada semana, menos de una vez por semana, hace más de 3 meses y nunca. Suman 100. Incluye la población de cada grupo. 2026. | INE, TIC-H 2026, [tabla 82785](https://www.ine.es/jaxi/Tabla.htm?tpx=82785&L=0). Las categorías se calculan restando los porcentajes acumulados de esa tabla (la tabla 82787, que parece darlas ya separadas, suma más de 100). |
| `ine_tich_2026_ia_generativa_por_edad.csv` | % de personas que usaron alguna herramienta de IA generativa en los últimos 3 meses, en total y según el fin, por grupo de edad. 2026. | INE, [nota de prensa TIC-H 2026](https://www.ine.es/dyngs/Prensa/TICH2026.htm) (11-nov-2026) |
| `ine_viviendas_turisticas_provincias_2026.csv` | Viviendas turísticas y plazas por provincia en mayo de 2026, con el dato de mayo de 2025 para calcular la variación, y la población residente a 1 de abril de 2026 para calcular tasas. | INE, [Viviendas turísticas en España, tabla 39364](https://www.ine.es/jaxiT3/Tabla.htm?t=39364) (estadística experimental) y [Estadística Continua de Población, tabla 69792](https://www.ine.es/jaxiT3/Tabla.htm?t=69792) |
| `eurostat_edad_emancipacion_2025.csv` | Edad media estimada a la que los jóvenes dejan el hogar familiar, por país y sexo. 2025, con el dato de 2024 para comparar. | Eurostat, [yth_demo_030](https://ec.europa.eu/eurostat/databrowser/view/yth_demo_030/default/table) (actualizado el 16-abr-2026) |
| `eurostat_edad_emancipacion_espana_ue.csv` | La misma edad media para España (total, hombres y mujeres) y la UE-27, de 2010 a 2025. | Eurostat, yth_demo_030 |
| `estudes_consumo_14_18_1998_2025.csv` | % de estudiantes de 14 a 18 años que han consumido alcohol, tabaco o cannabis alguna vez, en los últimos 12 meses, en los últimos 30 días y a diario. 1998-2025. | Ministerio de Sanidad, Plan Nacional sobre Drogas, [ESTUDES 2025, resumen ejecutivo](https://pnsd.sanidad.gob.es/profesionales/sistemasInformacion/sistemaInformacion/pdf/2025/ESTUDES_2025_Resumen_Ejecutivo_es.pdf) |
| `estudes_juego_e_internet_14_18.csv` | % de estudiantes de 14 a 18 años que han jugado con dinero, con posible juego problemático y con posible uso problemático de internet o de redes sociales. 2021-2025. | OEDA, [Informe sobre adicciones comportamentales 2025, resumen ejecutivo](https://pnsd.sanidad.gob.es/profesionales/sistemasInformacion/sistemaInformacion/pdf/2026/2025_OEDA_AdiccionesComportamentales_ResumenEjecutivo.pdf) |
| `112_informe_llamadas_dana_29oct2024.pdf` | Informe del 112 de la Comunitat Valenciana para el juzgado que investiga la dana: llamadas e incidentes por hora (anexo I, toda la Comunitat y todo tipo de incidentes) y listado de cada incidente por fenómeno natural en la provincia de Valencia el 29 de octubre de 2024, por hora y por municipio. 100 páginas. | Subdirección General de Emergencias, Generalitat Valenciana (febrero de 2025). Copia del que ya estaba en `ejercicios/datos/`. |
| `112_incidentes_dana_valencia_29oct2024_10min.csv` | Incidentes por fenómeno natural gestionados por el 112 en la provincia de Valencia el 29 de octubre de 2024, agrupados cada diez minutos. 2.342 en total. | Extraído del listado del PDF anterior. Comprobado el 23-nov-2026: coincide intervalo a intervalo con el listado. |
| `sucios/viviendas_turisticas_ine_sucio.csv` y `sucios/poblacion_provincias_sucio.csv` | Los datos de `ine_viviendas_turisticas_provincias_2026.csv`, **ensuciados a propósito** para la clase 4. Las cifras no cambian. | Ver «Archivos sucios», más abajo. |

## Para tener en cuenta

- **El INE no mide horas.** La TIC-H cuenta qué porcentaje de personas usa internet y con qué frecuencia, pero no cuánto tiempo al día. No hay una cifra oficial de «horas de pantalla» con la que comparar la encuesta de clase.
- **ESTUDES no es anual.** La encuesta se hace cada dos años, pero entre 2016 y 2019 pasaron tres. En un gráfico de líneas, el eje temporal tiene que respetar ese hueco.
- **Las series de juego e internet son cortas.** Los indicadores de juego empiezan en 2021 o 2023, el de uso problemático de internet solo aparece con dato en 2025 en el resumen, y el de redes sociales se midió por primera vez en 2025.
- **Eurostat marca una ruptura de serie en 2021** (indicador `b`): ese año cambió la metodología de la encuesta. Conviene avisarlo si se compara antes y después.
- **Las viviendas turísticas tienen estacionalidad.** El INE las cuenta dos veces al año (mayo y noviembre; antes, febrero y agosto). Para calcular una variación hay que comparar el mismo mes: mayo con mayo.
- **La población tiene que ser del mismo momento que las viviendas.** El archivo antiguo del workbook (`ejercicios/datos/`) cruza viviendas de 2024 con el padrón de 2021.
- **En 2025, España e Italia empatan** (30,2 años) en la edad de emancipación.

## Archivos sucios (clase 4)

Se han hecho a partir de los datos limpios del INE para practicar limpieza y cruce. Lo que se ha cambiado:

- `viviendas_turisticas_ine_sucio.csv`: separado por punto y coma; números con punto de miles; una línea de título, una fila «Total Nacional» (suma de las provincias) y una nota de fuente al final; provincia con su código delante, al estilo del INE («07 Balears, Illes»); un espacio al final de «Cádiz» y «Toledo»; Málaga duplicada.
- `poblacion_provincias_sucio.csv`: separado por comas; código de provincia sin el cero de delante («7»); nombres de uso corriente que no coinciden con los del INE (Álava, Alicante, Illes Balears, Castellón, A Coruña, La Rioja, Las Palmas, Valencia, Gerona, Lérida, Guipúzcoa, Vizcaya, Orense).
- Cruzando por nombre, tras quitar los espacios, no cruzan 13 provincias; sin quitarlos, 15. Cruzando por código con dos cifras, cruzan las 52.

## Para tener en cuenta en el 112

- **Llamadas no son incidentes.** Un incidente puede generar decenas de llamadas. El anexo I (19.821 llamadas y 4.770 incidentes) es de toda la Comunitat Valenciana y de todo tipo de incidentes; el CSV (2.342), solo de fenómeno natural en la provincia de Valencia.
- **El CSV omite los intervalos sin incidentes:** tiene 108 filas en lugar de 114 (faltan de 5:20 a 5:50, 11:00 y 11:30).
- Hasta las 20:10 (CSV) hubo 1.199 incidentes; contando al segundo con el listado del PDF, 1.202 antes de las 20:11.
- El listado incluye descripciones con edades y situaciones personales: se cuentan, no se reproducen.

## Reutilización

Los datos del INE, de Eurostat y del Ministerio de Sanidad se pueden reutilizar citando la fuente. Los rankings de Spotify (clase 3) no se guardan aquí: se consultan en directo en [kworb.net](https://kworb.net/spotify/country/es_weekly.html), una recopilación no oficial de Spotify Charts.
