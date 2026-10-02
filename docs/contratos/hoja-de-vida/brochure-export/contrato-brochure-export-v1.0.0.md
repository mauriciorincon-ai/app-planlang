---
id: contrato-brochure-export
titulo: Contrato brochure-export.json — schema v1.0.0 (referencia del portafolio)
version: 1.0.0
fecha: 2026-08-20
fuente: app-dash-agent-ai/docs/brochure-export.json (definido 2026-08-19, PR #7 — PRIMER export del portafolio)
tags: [contrato, brochure, vitrina]
---

# Contrato `docs/brochure-export.json` — schema v1.0.0

> **Por qué esta copia existe:** el schema lo definió **Dash Agent AI** en su entrega de
> brochure (2026-08-19) y su repo es **PRIVADO** — las sesiones de las demás apps no pueden
> leerlo. Esta copia de referencia vive en la planeadora (que toda app lee en RO) para que
> cada builder adopte el contrato sin acceso al repo de Dash. **La fuente canónica del schema
> sigue siendo el export de Dash**; si el contrato evoluciona (semver del FORMATO), esta copia
> se actualiza con él.

## Reglas del portafolio al adoptar el contrato

1. **El bloque `_schema` se copia TAL CUAL** al export de cada app (el formato viaja con el
   archivo — quien lo consuma no necesita buscar otro documento).
2. **Toda cifra de `metricas[]` lleva `fuente`**: `medido` · `calculada` · `declarado` ·
   `estimacion`. Una cifra sin fuente no entra.
3. **`enlaces.produccion: null` SIEMPRE en este portafolio** (regla 17 — cero enlaces): la
   producción se MUESTRA, jamás se ENTREGA. `razon` es lo que la vitrina muestra en su lugar
   (para apps con producción viva: acceso por **lista de espera**; para apps locales: la
   arquitectura). `repositorio` también `null` — ningún enlace de acceso viaja en el export.
4. **`app.estado`**: `"inicial"` mientras el brochure describe la construcción cerrada;
   `"sellado"` cuando el gate de pruebas del usuario terminó (`sellado_en` deja de ser null).
   El sello NO congela: todo sprint que cambie features ajusta brochure + export en su PR.
5. **`funcionalidades.total`** se cuadra contra `docs/MANUAL-DE-USO.md` (la misma regla de
   conteo del brochure); las descartadas van en `descartadas[]` con razón y fecha.
6. El export **se produce y actualiza SIEMPRE junto al `BROCHURE.html`**, en el mismo PR.

## Notas de adopción (2026-08-21 — feedback de las 2 primeras adopciones: ds y habla)

- **Adoptar = TRADUCIR, no calcar.** Copiar el ejemplo donde no aplica es publicar una mentira:
  ds declaró `local_only: false` (se sirve desde la web; lo local es el cómputo) y su
  `gpu_requerida` como `declarado` (regla de producto, no salida de comando).
- **`privacidad` es un MENÚ, no un molde:** cada app declara solo los booleanos que puede
  AFIRMAR con verdad (`escribe_en_las_fuentes` es propio de Dash; habla lo omitió — correcto),
  siempre con su `detalle`.
- **`razon_repositorio` en repos PÚBLICOS:** «El repositorio no se enlaza desde la vitrina
  (regla de cero enlaces del portafolio).» — texto de habla, recomendado para todo el
  portafolio. «Repositorio privado» SOLO donde sea verdad (Dash).
- **El test del contrato vigila FORMA, no VIGENCIA:** no puede saber si un valor sigue siendo
  cierto. Cada métrica se MIDE al generarla y **el export se genera de ÚLTIMO en el PR** — el
  de habla nació declarando 251 pruebas cuando su propio test recién escrito ya las volvía 261.

- **PROPUESTA v1.1.0 (2026-08-23, cierre hoja-de-vida S5 — G-Metodo aprobado): campo opcional
  `grupos[].icono`.** Hoy los iconos de las tarjetas de la vitrina se copian a mano del brochure
  de cada app; si allá cambian, aquí envejecen sin aviso. El export debe transportar también la
  identidad visual que acompaña a los datos. **Aditivo y compatible: NO fuerza re-emisión** —
  cada app lo adopta la próxima vez que actualice su export (sello o sprint que toque features).
  La vitrina lo trata como opcional mientras conviven versiones.
- **PROPUESTA v1.1.0 AMPLIADA (2026-09-12, cierre hoja-de-vida S6+S7 — G-Metodo aprobado):
  cuatro campos opcionales más, `proceso`, `titular`, `limites[]` y `nunca[]`.** Son lo que la
  **ficha técnica** (contrato `ficha-tecnica` v1.3.1 de hoja-de-vida, ADR-016) necesita y hoy
  declara CV Viva por cada app en su complemento (`procedencia_proceso: cv-viva`): el titular de
  valor (qué no hace nadie más), el proceso en BPMN (carriles · pasos ≤60 caracteres · un inicio
  · ≥1 fin), los límites y lo que la app **nunca** hace. Cuando la app los mande, el complemento
  se retira y la procedencia pasa a ser suya. Forma exacta: la del contrato `ficha-tecnica`
  (`docs/contrato-ficha-tecnica/` en la app, generado del Zod). **Aditivo y compatible: sin
  re-emisión forzada** — se adopta cuando cada app actualice su export.

## Ejemplo canónico completo (el export real de Dash Agent AI, 2026-08-19)

```json
{
  "_schema": {
    "_lee_esto_primero": "Este bloque documenta el formato y no es dato de la app. Se conserva en cada export para que el esquema viaje con el archivo: quien lo consuma no necesita buscar otro documento. Las apps que adopten este formato copian este bloque tal cual y rellenan el resto.",
    "_origen": "Definido por app-dash-agent-ai en su entrega de brochure (2026-08-19). Es el PRIMER export del portafolio; las demás apps lo adoptan.",
    "_consumidor": "La vitrina de hoja-de-vida. Renderiza la ficha de cada app sin abrir su repositorio.",
    "_regla_madre": "Toda cifra de `metricas[]` lleva su etiqueta de `fuente`. Es la regla dura 3 de Dash Agent AI aplicada a su propia ficha: una app que exige procedencia a cada número de su pantalla no puede publicar cifras sueltas sobre sí misma. Se recomienda al resto del portafolio.",
    "schema_version": "semver del FORMATO, no de la app. Cambio mayor = campo eliminado o con significado distinto; menor = campo nuevo opcional; parche = documentación.",
    "app.estado": "\"inicial\" mientras el brochure describe la construcción cerrada; \"sellado\" cuando el gate de pruebas del usuario terminó. `sellado_en` es null hasta entonces.",
    "funcionalidades.total": "El número que el brochure declara en su pie. `fuente_del_conteo` dice contra qué documento se cuadró — sin eso, el total es una afirmación.",
    "funcionalidades.descartadas": "Las que se construyeron o se planearon y NO existen. Van aquí con su razón y su fecha para que nadie las cuente como pendientes ni como entregadas.",
    "metricas[].fuente": "Una de cuatro: \"medido\" (salió de un contador o un comando), \"calculada\" (medido operado con una tarifa o una regla, y se dice cuál), \"declarado\" (lo fijó una persona), \"estimacion\" (deducido). Una cifra sin fuente no entra.",
    "enlaces.produccion": "null cuando la app no tiene URL pública. `razon` explica por qué, y es lo que la vitrina muestra en lugar del enlace. Nunca se rellena con un enlace de repositorio ni con una promesa."
  },

  "schema_version": "1.0.0",
  "actualizado": "2026-08-19",

  "app": {
    "slug": "dash-agent-ai",
    "nombre": "Dash Agent AI",
    "ciclo": "H1",
    "estado": "inicial",
    "sellado_en": null,
    "sprints_cerrados": 3,
    "version_repo": "0.1.0"
  },

  "promesa": {
    "tagline": "Tus agentes de IA saben todo de ti. Es hora de que tú sepas todo de ellos.",
    "intro": "Un panel que vive entero en tu computador, lee el rastro de trabajo que tus agentes dejan en tu disco y te dice qué te cuestan, si te rinden y qué saben de ti.",
    "para_quien": "Para quien trabaja a diario con agentes de IA, paga una suscripción y hoy no puede saber cuánto costó construir cada cosa, si la suscripción le rinde, ni qué hay escrito sobre él en los archivos de instrucciones que sus agentes leen.",
    "diferencial": "Medir tokens ya lo hacen varias herramientas gratuitas. Lo que no hace nadie es el auditor de memoria: el inventario de lo que tus agentes saben de ti y la detección determinista de lo que dejó de ser cierto."
  },

  "funcionalidades": {
    "total": 12,
    "fuente_del_conteo": "docs/MANUAL-DE-USO.md",
    "descartadas": [
      {
        "id": "B3",
        "nombre": "Sugeridor de skills y optimización",
        "fecha": "2026-08-19",
        "razon": "Se construyó, se midió sobre el corpus real del usuario y se retiró: 83 sugerencias descontextualizadas. La premisa (repetición de texto) no encajaba con su forma de trabajar (repetición de estructura). No es una funcionalidad pendiente."
      }
    ],
    "grupos": [
      {
        "orden": 1,
        "estrella": true,
        "nombre": "Lo que saben de ti",
        "linea": "Y si sigue siendo cierto. Esto no lo hace nadie más.",
        "features": [
          {
            "id": "B1",
            "nombre": "Auditor de memoria — con su plan de limpieza",
            "que_hace": "Inventario de todo lo que tus agentes tienen escrito sobre ti (CLAUDE.md, memorias, configuración de MCP) y detección determinista de lo que caducó, con archivo, línea y texto exacto. El plan de limpieza es una lista que ejecutas tú: la app no borra ni edita nada.",
            "seccion_manual": "Auditor de memoria · El plan de limpieza"
          },
          {
            "id": "B2",
            "nombre": "Detector de desperdicio",
            "que_hace": "Los patrones donde el trabajo se va sin producir nada —bucles de reintento, sesiones abandonadas, re-lecturas masivas— cada uno con su umbral escrito y sus casos concretos.",
            "seccion_manual": "Desperdicio"
          }
        ]
      },
      {
        "orden": 2,
        "estrella": false,
        "nombre": "Lo que te cuestan",
        "linea": "Tus tokens reales, en dólares — y si el plan te rinde.",
        "features": [
          {
            "id": "C1",
            "nombre": "Medidor de consumo real",
            "que_hace": "Tokens por sesión, modelo y día, con los cuatro contadores separados: entrada, salida, caché de creación y caché de lectura.",
            "seccion_manual": "Resumen · Costos y ROI"
          },
          {
            "id": "C2",
            "nombre": "Tarifas con fuente y fecha",
            "que_hace": "Cada dólar declara con qué tarifas se calculó y de qué fecha son, desde una copia local versionada con su origen y su sha256. Sin llamadas a internet.",
            "seccion_manual": "Cómo se lee una cifra"
          },
          {
            "id": "C3",
            "nombre": "ROI de la suscripción frente a la API",
            "que_hace": "Compara lo que pagas con lo que habrías pagado por API a tarifas de lista con este mismo consumo. Las dos cifras nunca se suman, y viajan con sus dos advertencias: es un contrafactual, y los límites reales de cada plan no son públicos.",
            "seccion_manual": "Costos y ROI · Las dos advertencias"
          },
          {
            "id": "C6",
            "nombre": "Presupuesto y proyección",
            "que_hace": "Umbral mensual declarado y proyección de fin de mes con el ritmo real de los últimos siete días. No proyecta cuando no puede, y dice cuál de las tres razones lo impide.",
            "seccion_manual": "La proyección · Declarar lo que pagas"
          }
        ]
      },
      {
        "orden": 3,
        "estrella": false,
        "nombre": "Dónde se fue, y qué hiciste",
        "linea": "El gasto anclado al repo donde ocurrió, tarea por tarea.",
        "features": [
          {
            "id": "C4",
            "nombre": "Atribución por app",
            "que_hace": "Cuánto costó construir cada app del portafolio, con el gasto anclado al repositorio donde ocurrió — el dato existe en la fuente, no se reparte a ojo. Una sesión en dos repos se parte.",
            "seccion_manual": "Atribución por app"
          },
          {
            "id": "C5",
            "nombre": "Línea de tiempo de tareas",
            "que_hace": "Las sesiones día a día con lo que se pidió y lo que costó cada tarea. Una sesión leída a medias se muestra rota, con la línea exacta donde se cortó.",
            "seccion_manual": "Línea de tiempo"
          }
        ]
      },
      {
        "orden": 4,
        "estrella": false,
        "nombre": "Lo que no se pierde",
        "linea": "Claude Code borra tu rastro a los 30 días. Aquí no.",
        "features": [
          {
            "id": "C8",
            "nombre": "Índice propio incremental",
            "que_hace": "Indexa los transcripts en streaming antes de que Claude Code los borre a los 30 días, siempre fuera de las fuentes, y declara cuántas líneas repetían un consumo ya contado.",
            "seccion_manual": "El índice es tuyo"
          },
          {
            "id": "C10",
            "nombre": "Reporte de evidencia",
            "que_hace": "Un HTML autocontenido con el snapshot del período, que se abre sin la app y sin internet, e incluye lo que no se pudo leer. Sin marca de hora: dos reportes del mismo período son idénticos byte a byte.",
            "seccion_manual": "El reporte de evidencia"
          }
        ]
      },
      {
        "orden": 5,
        "estrella": false,
        "nombre": "Por qué puedes creerle",
        "linea": "La garantía no se promete: se comprueba en pantalla.",
        "features": [
          {
            "id": "C9",
            "nombre": "Solo lectura demostrable",
            "que_hace": "Las cuatro capas de la garantía con cómo se comprueba cada una. La de permisos se mide en el momento preguntándole al propio Node; las otras dicen «verificada en CI» y no una hora que no tienen.",
            "seccion_manual": "Confianza"
          },
          {
            "id": "C7",
            "nombre": "Stack y MCP",
            "que_hace": "Inventario de los servidores MCP declarados en las configuraciones locales, si su binario existe en disco, y el censo de versiones del CLI que escribieron la historia. No prueba conexiones ni edita nada.",
            "seccion_manual": "Stack y MCP"
          }
        ]
      }
    ]
  },

  "metricas": [
    {
      "clave": "funcionalidades",
      "etiqueta": "Funcionalidades del MVP",
      "valor": 12,
      "unidad": "funcionalidades",
      "fuente": "medido",
      "detalle": "Contadas contra docs/MANUAL-DE-USO.md. B3 no cuenta: está descartada."
    },
    {
      "clave": "pantallas",
      "etiqueta": "Pantallas de la app",
      "valor": 8,
      "unidad": "pantallas",
      "fuente": "medido",
      "detalle": "Archivos page.tsx bajo src/app/. La ruta /conoce sirve este brochure y no es una pantalla del producto."
    },
    {
      "clave": "pruebas_unitarias",
      "etiqueta": "Pruebas unitarias y de integración",
      "valor": 693,
      "unidad": "pruebas",
      "fuente": "medido",
      "detalle": "Salida de `pnpm test` el 2026-08-19: 44 archivos, 693 pruebas."
    },
    {
      "clave": "cobertura_lineas",
      "etiqueta": "Cobertura de líneas",
      "valor": 97.5,
      "unidad": "%",
      "fuente": "medido",
      "detalle": "v8 sobre engine, reader, db, lib y components; umbrales por glob en vitest.config.mts."
    },
    {
      "clave": "dependencias_runtime",
      "etiqueta": "Dependencias en tiempo de ejecución",
      "valor": 5,
      "unidad": "paquetes",
      "fuente": "medido",
      "detalle": "next, react, react-dom, better-sqlite3 y pino. Ninguna es un SDK de IA, y un gate del CI falla si aparece uno."
    },
    {
      "clave": "llamadas_de_red",
      "etiqueta": "Llamadas de red salientes en runtime",
      "valor": 0,
      "unidad": "llamadas",
      "fuente": "medido",
      "detalle": "Una prueba permanente del CI falla si el runtime abre un socket saliente."
    },
    {
      "clave": "costo_operacion_mensual",
      "etiqueta": "Costo de operación mensual",
      "valor": 0,
      "unidad": "USD",
      "fuente": "calculada",
      "detalle": "Suma de servicios contratados: ninguno. No hay servidor, base de datos, telemetría ni proveedor de IA que facturar."
    },
    {
      "clave": "peso_brochure",
      "etiqueta": "Peso de este brochure",
      "valor": 181314,
      "unidad": "bytes",
      "fuente": "medido",
      "detalle": "Archivo autocontenido con cuatro caras tipográficas embebidas. `wc -c docs/BROCHURE.html`."
    },
    {
      "clave": "decisiones_registradas",
      "etiqueta": "Decisiones de arquitectura registradas",
      "valor": 13,
      "unidad": "ADR",
      "fuente": "medido",
      "detalle": "Archivos de decisions/."
    }
  ],

  "stack": [
    { "nombre": "Next.js", "papel": "la app y su servidor local, que escucha solo en 127.0.0.1" },
    { "nombre": "TypeScript", "papel": "modo estricto en todo el repositorio" },
    { "nombre": "SQLite (better-sqlite3)", "papel": "el índice propio, siempre fuera de las fuentes" },
    { "nombre": "Vitest y Playwright", "papel": "las pruebas, incluidas las tres permanentes de la garantía" },
    { "nombre": "Pino", "papel": "registro local; no sale nada de la máquina" }
  ],

  "privacidad": {
    "local_only": true,
    "red_saliente": false,
    "escribe_en_las_fuentes": false,
    "usa_ia": false,
    "detalle": "La app vive entera en la máquina de quien la usa. No hay servidor, cuenta ni nube. La garantía de solo lectura tiene cuatro capas —el modelo de permisos de Node al arrancar, una frontera de módulo única, el índice siempre fuera de las fuentes, y tres pruebas permanentes en el CI— y una pantalla dedicada a comprobarlas."
  },

  "enlaces": {
    "produccion": null,
    "razon": "App 100 % local: no existe URL de producción y no la habrá. El servidor escucha solo en 127.0.0.1, en la máquina de quien la usa.",
    "repositorio": null,
    "razon_repositorio": "Repositorio privado.",
    "brochure_archivo": "docs/BROCHURE.html",
    "brochure_ruta_local": "/conoce"
  }
}
```
