# Datos oficiales del curso

Datos para comparar la encuesta de clase con las estadísticas oficiales. Todos se descargaron el 22 de noviembre de 2026 y están en CSV (UTF-8, coma como separador y punto decimal). Los porcentajes van de 0 a 100.

| Archivo | Qué contiene | Fuente |
|---|---|---|
| `ine_tich_2026_uso_internet_por_edad.csv` | % de personas que usaron internet en los últimos 3 meses, a diario (al menos 5 días a la semana) y varias veces al día, por grupo de edad. 2026. | INE, Encuesta sobre Equipamiento y Uso de TIC en los Hogares (TIC-H) 2026, [tabla 82785](https://www.ine.es/jaxi/Tabla.htm?tpx=82785&L=0) |
| `ine_tich_2026_ia_generativa_por_edad.csv` | % de personas que usaron alguna herramienta de IA generativa en los últimos 3 meses, en total y según el fin, por grupo de edad. 2026. | INE, [nota de prensa TIC-H 2026](https://www.ine.es/dyngs/Prensa/TICH2026.htm) (11-nov-2026) |
| `eurostat_edad_emancipacion_2025.csv` | Edad media estimada a la que los jóvenes dejan el hogar familiar, por país y sexo. 2025, con el dato de 2024 para comparar. | Eurostat, [yth_demo_030](https://ec.europa.eu/eurostat/databrowser/view/yth_demo_030/default/table) (actualizado el 16-abr-2026) |
| `eurostat_edad_emancipacion_espana_ue.csv` | La misma edad media para España (total, hombres y mujeres) y la UE-27, de 2010 a 2025. | Eurostat, yth_demo_030 |
| `estudes_consumo_14_18_1998_2025.csv` | % de estudiantes de 14 a 18 años que han consumido alcohol, tabaco o cannabis alguna vez, en los últimos 12 meses, en los últimos 30 días y a diario. 1998-2025. | Ministerio de Sanidad, Plan Nacional sobre Drogas, [ESTUDES 2025, resumen ejecutivo](https://pnsd.sanidad.gob.es/profesionales/sistemasInformacion/sistemaInformacion/pdf/2025/ESTUDES_2025_Resumen_Ejecutivo_es.pdf) |
| `estudes_juego_e_internet_14_18.csv` | % de estudiantes de 14 a 18 años que han jugado con dinero, con posible juego problemático y con posible uso problemático de internet o de redes sociales. 2021-2025. | OEDA, [Informe sobre adicciones comportamentales 2025, resumen ejecutivo](https://pnsd.sanidad.gob.es/profesionales/sistemasInformacion/sistemaInformacion/pdf/2026/2025_OEDA_AdiccionesComportamentales_ResumenEjecutivo.pdf) |

## Para tener en cuenta

- **El INE no mide horas.** La TIC-H cuenta qué porcentaje de personas usa internet y con qué frecuencia, pero no cuánto tiempo al día. No hay una cifra oficial de «horas de pantalla» con la que comparar la encuesta de clase.
- **ESTUDES no es anual.** La encuesta se hace cada dos años, pero entre 2016 y 2019 pasaron tres. En un gráfico de líneas, el eje temporal tiene que respetar ese hueco.
- **Las series de juego e internet son cortas.** Los indicadores de juego empiezan en 2021 o 2023, el de uso problemático de internet solo aparece con dato en 2025 en el resumen, y el de redes sociales se midió por primera vez en 2025.
- **Eurostat marca una ruptura de serie en 2021** (indicador `b`): ese año cambió la metodología de la encuesta. Conviene avisarlo si se compara antes y después.
- **En 2025, España e Italia empatan** (30,2 años) en la edad de emancipación.

## Reutilización

Los datos del INE, de Eurostat y del Ministerio de Sanidad se pueden reutilizar citando la fuente. Los rankings de Spotify (clase 3) no se guardan aquí: se consultan en directo en [kworb.net](https://kworb.net/spotify/country/es_weekly.html), una recopilación no oficial de Spotify Charts.
