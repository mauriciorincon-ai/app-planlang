---
sprint: 002
app: planlang
status: closed
opened: 2026-09-27
closed: 2026-10-03
branch: sprint-002/la-vitrina
pr: https://github.com/mauriciorincon-ai/app-planlang/pull/8
---

# Sprint 002 Summary — planlang «La vitrina»

> Estado de este documento: **final para el merge** (condición de merge: viaja dentro del PR #8). Primer sprint con
> UI. El gate de FIDELIDAD de P1 se pasó el 2026-09-29; las cuatro miradas y la de los cambios de la auditoría están
> registradas en la bitácora. El ⭐ del sprint se difiere al acumulado del ciclo con sus dos contrapesos (abajo).
> Acto de ciclo: **ninguno** — el S2 es el sprint 2 de 3 del ciclo H1; el S3 cierra el ciclo.

## Outcome

- **Principal — Sí.** La vitrina reproduce la maqueta aprobada en React con 7 pantallas (Entrada, Plan, Agente,
  Brecha, Playground, Casos y Fichas), en `/es` y `/en`, en tema oscuro y claro, a 380 px y en escritorio, con los
  perfiles líder y experto. Usa la corrida real de 20 casos medida con el plan v1.3.
  - Lleva el rótulo «Simulación · no operativo» en toda pantalla (también en la raíz y en la 404), la divulgación
    del oráculo, la ficha de reproducibilidad y el demo B «en construcción».
  - Se despliega en el preview protegido del PR; producción, al mergear.
  - Fidelidad de P1 aprobada el 2026-09-29.
- **Secundario — Sí, con una desviación decidida por el usuario.**
  - **Playground:** los cuatro umbrales recalculan, en el navegador, los casos que cambian, los errores, los
    minutos de auditor, los criterios y la curva riesgo-cobertura. Con los valores del plan reproduce el informe;
    tarda menos de 100 ms con 200 casos y menos de 16 ms por movimiento con 20. Desde la auditoría, el mismo barrido
    da los mismos bytes en Node, Chromium, Firefox y WebKit.
  - **Visor:** el grafo se dibuja desde el grafo compilado (contrato diagramador 0.3.0) con líder, experto, código y
    sus trazas reales por nodo. El gate «diagrama = grafo» corre en CI y en el gate de publicación.
  - **Desviación:** el modo Texas no mueve casos con este plan (U4 queda inerte y explicado, desviación 3).
- **Terciario — Sí.**
  - **Paquete:** `pnpm paquete:vitrina` produce el paquete para hoja-de-vida (86 archivos con manifiesto de huellas,
    sin maqueta, sin URL, sin Sentry). Su gate de publicación cubre M9, RF-09.2, «diagrama = grafo» y la paridad;
    su rastreo y su pasada de interacción en CI están verdes.
  - **Fichas:** la ficha del agente A es válida contra el contrato v1.3.1 y `docs/brochure-export.json` lleva toda
    cifra con su fuente. El PR de contenido en hoja-de-vida lo hace el usuario.
  - **En background:** el lote de 200 corrió completo con el plan v1.4 (200 de 200, 0 errores; desviación 53). La
    deuda del S1 marcada «S2» quedó pagada salvo lo que se pasó al S3 con razón (desviación 9).
  - **LangSmith sigue sin aprovisionar** (desviación 54): las corridas no tienen espejo.

## Qué se construyó

- **Vitrina (`src/`, Next 16 exportado estático):**
  - rutas por idioma (ADR-008) y ruteo del export (ADR-007);
  - tema y perfil sin #418 (script previo y atributos; la forma del árbol no depende del cliente);
  - Tailwind v4 sobre los tokens del design system 1.0.0;
  - Inter y JetBrains Mono locales (Fraunces solo en el marco de CV Viva);
  - diccionarios `{es, en}` redactados dos veces;
  - componentes canon con prueba de forma invariante.
- **Las 7 pantallas:**
  - P1 Entrada;
  - P2 Plan (decisiones, riesgos con control legal, supuestos, criterios, umbrales, contrato del grafo);
  - P3 Agente (ficha, lienzo SVG generado y lista por capa, panel por nodo y arista, el spike frente al mismo
    contrato);
  - P4 Brecha (las 9 secciones del informe, con sus fallas al frente);
  - P5 Playground;
  - P6 Casos (índice y 20 casos por idioma);
  - P7 Fichas.
- **`core/visor/`:** grafo compilado → mapa 0.3.0 → geometría → SVG y lista por capa (ADR-010), bajo la guardia
  de determinismo y G2; golden ES/EN.
- **`core/playground/`:** `compactar` (lo único que viaja al navegador) y `consecuencias`.
- **Verificador** 1.1.0 → 1.2.0: control legal, ámbito de sesión (M-14), tolerancia de S3, corridas de otro plan
  con la misma verdad (ADR-005), M-24 y M-26.
- **Reusables:** instrumentos-de-plan 0.2.0 (`control_legal`, C06) y diagramador 0.3.0 (copia fijada y lock por
  archivo).
- **Planes:**
  - **v1.3**, solo medición: R8 por sesión, R1/R6 con control legal, tolerancia de S3 y textos bilingües;
  - **v1.4**, el respaldo «sin modelo, a una persona» (AU-9).
- **Agentes (`agents/`):**
  - `--max-turns 2` solo con `--json-schema` (ADR-004 enmendado y medido: 0 reintentos de esquema en 466
    llamadas);
  - el respaldo de AU-9;
  - trazas a salvo ante una excepción (M-9);
  - `constraints.txt` (M-12);
  - exportador del grafo con su código.
- **Paquete y fichas:** `scripts/paquete-vitrina.ts` (ADR-009), `scripts/fichas.ts`, `docs/brochure-export.json`
  y `content/agentes/planlang-demo-a.ficha-tecnica.json`.
- **Documentos:**
  - manual ES/EN (abrir la vitrina, mover umbrales, las fichas, entregar el paquete);
  - guía de prueba acumulativa ES/EN (46 pruebas) y kit de prueba al día;
  - `design-sync/` (12 tarjetas, sin publicar);
  - ADR 007–010;
  - registro de fidelidad en `docs/fidelidad/p1…p4` y `cierre`.

## DoD — checklist

| Estándar              | Estado                  | Evidencia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Testing               | ✓                       | vitest **2555** + 1 saltada (104 archivos) con los umbrales de cobertura: total 98,3 % líneas · 97,8 % sentencias · 88,7 % ramas; `core/brecha` 99,0 % · 93,6 %, `core/playground` 100 % · 96,6 %, `core/visor` 98,8 % · 92,7 %, `src/lib` 97,4 % · 80,4 %, `src/components` 97,6 % · 86,4 % · pytest **159** (96,39 %) · Playwright **152** (teléfono, escritorio, `paridad-firefox`, `paridad-webkit`; 2 saltadas: las de solo teléfono en escritorio) + paquete 3/3, sin fallas ni reintentos · cada gate nuevo con demo en rojo en la bitácora |
| CI/CD                 | ✓ con un aviso          | `quality · e2e · lighthouse · python` con conclusión propia `success` sobre `11115e5` (y sobre el commit final del PR, ver el cuerpo). **Aviso:** sobre `8048989` y `edf146f` Lighthouse salió rojo por el LCP de `/en/playground` (2.638 y 2.646 ms frente a 2.500) con los mismos bytes que pasaron en `11115e5`: la simulación es bimodal en localhost. Desde el 2026-10-04 el playground tiene 2,8 s de LCP por ruta (ADR-011, deuda S3, abajo)                                                                                                |
| Observabilidad        | ✓ con deuda             | sin runtime: la vitrina no llama a nada; consola limpia en e2e y en las pasadas de capturas; **LangSmith sin aprovisionar** (las corridas de fondo corrieron sin espejo, con sus trazas propias completas)                                                                                                                                                                                                                                                                                                                                         |
| Seguridad             | ✓ con un aviso aceptado | export y paquete sin variables ni URL (barridos con su rojo); gitleaks en cada commit y hook PreToolUse sobre el contenido (B-8), que ahora falla cerrado; `pnpm trazas:verificar` sobre las 8 corridas; `pip-audit --skip-editable` limpio; `pnpm audit` con **un aviso aceptado** (`braces` GHSA-vfj7-8cjw-p6xm, solo del lint, sin versión corregida; `scripts/avisos-aceptados.json`, revisar antes del 2026-11-02, con prueba que falla al vencer)                                                                                            |
| Performance           | ✓ con deuda             | Lighthouse móvil con presupuesto en 9 URL (mediana de 3); playground < 100 ms sobre 200 y < 16 ms por movimiento (medianas, prueba); las trazas nunca viajan al cliente. LCP ≤ 2,5 s en todas las rutas salvo el playground, que tiene 2,8 s por decisión del usuario (ADR-011); el reparto tiene su gate                                                                                                                                                                                                                                          |
| UX/A11y (+6-B)        | ✓                       | fidelidad a la maqueta aprobada en 4 miradas + la de los cambios de la auditoría; axe sin violaciones críticas, serias ni moderadas en cada pantalla, en sus dos idiomas, temas y perfiles; foco visible (lienzo incluido), «Saltar al contenido», regiones con nombre, color nunca solo (botón deshabilitado punteado, capa activa subrayada); sin desplazamiento a 380 px; `reduced-motion` con visibilidad real; bilingüe redactado, con guardia de frases armadas por fragmentos                                                               |
| IA embebida (7 + 7-S) | ✓                       | ninguna en la vitrina; corridas de fondo con la suscripción según la regla 6 (`--max-turns 2` solo con esquema, medido); humo real 3/3 antes de correr                                                                                                                                                                                                                                                                                                                                                                                             |
| Manual de uso         | ✓                       | `docs/MANUAL-DE-USO.md` ES/EN, fila S2 en su historial; barrido de promesas aplazadas: las que quedan son ciertas hoy (demo B, entrevistador y la corrida de 200 en la vitrina son del S3)                                                                                                                                                                                                                                                                                                                                                         |
| Guía de prueba        | ✓                       | `docs/GUIA-DE-PRUEBA.html` acumulativa ES/EN: 46 pruebas (21 del S1 enteras, 6 mejoradas, 25 nuevas); ⭐ 15 (~60 min); ⭐⭐ 4 paradas (~22 min) que declaran las 11 ⭐ que dejan fuera; kit de prueba en `docs/kit-de-prueba/`                                                                                                                                                                                                                                                                                                                     |
| Reusables             | ✓                       | locks multiarchivo con huellas y prueba; 6 enmiendas propuestas al diagramador (abajo)                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Design system         | ✓                       | `design-sync/` en el PR, regenerado byte a byte por prueba; **no se publica** (va después del ⭐⭐ del S3, lo invoca el usuario)                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Métricas técnicas (acceptance criteria del SPRINT_002)

| Criterio                                                                                                   | Resultado                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 7 pantallas × `/es` y `/en` × oscuro/claro × 380 px y escritorio, sin desplazamiento horizontal; axe verde | ✓ e2e y pasada de cierre (73 pares, 73 mediciones)                                                                                     |
| Gate de FIDELIDAD de P1 registrado antes de P2–P7                                                          | ✓ 2026-09-29 («lo abrí y lo apruebo»)                                                                                                  |
| Visor: «diagrama = grafo» verde con demo en rojo                                                           | ✓ en la prueba, en `diagrama:verificar` sobre lo publicado y en el gate de publicación                                                 |
| Playground: paridad con el informe; < 100 ms sobre 200; modo Texas mueve casos                             | ✓ paridad y tiempos · ✗ Texas: inerte con este plan y explicado en pantalla (decisión del usuario, desviación 3; propuesta para el S3) |
| Ficha del agente válida contra v1.3.1; `brochure-export.json` con toda cifra con fuente                    | ✓ (Ajv contra copias fijadas + reglas Zod)                                                                                             |
| `pnpm paquete:vitrina` con manifiesto; sin maqueta, URL ni variables; gate de publicación verde            | ✓ 86 archivos; `paquete:verificar` y rastreo verdes                                                                                    |
| Guía acumulativa con las 21 del S1 y las paradas del S1 marcadas                                           | ✓ las 3 paradas del S1, diferidas otra vez con nombre («paradas-S1-diferidas-S2»)                                                      |
| 4 checks `success` propios; lo nuevo anotado como primera corrida                                          | ✓ (abajo)                                                                                                                              |

**Primera ejecución en este PR (sin histórico, no se afirma regresión ni no-regresión):**

- el paso «ningún paquete por debajo de main» (`5e6097d`);
- Lighthouse sobre `/es/fichas` (`3449bfd`), `/en` y `/en/playground` (`1bcdbd7`);
- el `pip install -c constraints.txt` en Linux;
- la paridad del playground en Firefox y WebKit y la pasada de interacción del paquete (`8048989`).

## Auditoría final (`/audita-sprint`)

Auditor independiente del constructor, en solo lectura, con el diff `main...4164785` delante:
**0 Críticos · 3 Altos · 20 Medios · 82 Bajos** (57 de calidad, 13 campos sin lector, 12 de consistencia;
`sprints/SPRINT_002-auditoria.md`, cada uno con `archivo:línea`). Veredicto de la Fase 1: «requiere ajustes». El
usuario aprobó la Fase 1 y pidió **ajustar todos los hallazgos** (2026-10-02), no solo los Altos.

**Pagados: todos.** Las demos en rojo de cada uno están en la bitácora, lote por lote:

| Commit                | Qué paga                                                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2caa8cb`             | los 3 Altos: ningún número de entidades cableado en la vista (AU-S2-1, 2, 3)                                                                                                                                                                                  |
| `60ac791` · `eea1e07` | lo que viaja y lo que se publica, núcleo, visor y lo que lee la vista (AU-S2-4…10, 13, 15, 17–19, 21–23 y Bajos)                                                                                                                                              |
| `64e8ce6` · `a12fe25` | foco visible en el lienzo y semántica de tablas (AU-S2-14); nombres accesibles, «Saltar al contenido», regiones; frases del experto redactadas enteras; axe moderado, Lighthouse en `/en`, barrido de tintas más ancho                                        |
| `1bcdbd7`             | errores con nombre en el vocabulario (AU-S2-16) y C-1…C-12                                                                                                                                                                                                    |
| `9619c96`             | Bajos del núcleo y de los gates (B7–B57): intérpretes con nulo idénticos, guardia de determinismo por árbol de sintaxis, hook que falla cerrado, barridos del paquete, verificador de dependencias por línea mayor, alerta de lo que el modelo dejó sin medir |
| `badcdf3`             | campos sin lector P-1…P-12                                                                                                                                                                                                                                    |
| `8fe38b5`             | paridad en Chromium, Firefox y WebKit (AU-S2-11, que la auditoría dejaba para el S3) y documentos (AU-S2-20)                                                                                                                                                  |
| `11115e5`             | pasada de capturas de cierre versionada (AU-S2-12)                                                                                                                                                                                                            |
| este commit           | fichas regeneradas con el summary (AU-S2-B6) y cuerpo del PR (AU-S2-B2)                                                                                                                                                                                       |

Declarados como desviación en lugar de cambio: B4 (peso de las capturas), B5 (lote de 200 regenerado) y B33 (el
mapa sin `recorridos`), desviaciones 55–57.

Lo que la auditoría destapó y vale contar:

- tres frentes de números del plan escritos a mano en la vista;
- una vista que narraba como «modo Texas» cualquier regla desconocida;
- el playground medía un criterio con métrica distinto que el verificador. La paridad nueva lo cazó y se corrigió;
- el campo `opcion_elegida` sin lector escondía un defecto de la regla 20: el informe en inglés copiaba como propia
  una opción escrita solo en español. Se corrigió en la fuente y se regeneraron los informes;
- una prueba nueva que no podía fallar (P-4), vista al exigirle el rojo y reemplazada.

Veredicto tras la Fase 2: **listo para cierre**.

## Gate ⭐ — diferimiento y contrapesos

**⭐ diferido: 15 pruebas al acumulado del ciclo (S1: 5 · S2: 10)**, con el ⭐⭐ de 4 paradas (~22 min) para el
cierre de pruebas del ciclo (acto 2, el sello MVP). Las 3 paradas del ⭐ del S1 se ofrecieron en la fase 0 y el
usuario respondió «continúa» sin correrlas (2026-09-28): siguen en el acumulado como excepción nombrada
«paradas-S1-diferidas-S2».

| Contrapeso                     | Evidencia (archivo, cuenta medida, corrida)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pasada de capturas del builder | 2026-10-03, build de `32fbbe8`: 73 pares (146 encuadres) de las 7 pantallas en 380 y 1280 px, oscuro y claro, ES y EN, y el perfil experto; 73 mediciones sin desplazamiento, con fuentes y consola limpias; 23/23 interacciones. Registro versionado en `docs/fidelidad/cierre/` (huella SHA-256 de cada encuadre, miniaturas y 13 recortes de los cambios de forma). **Leídos como imagen:** los 13 recortes y 4 encuadres enteros (Playground 1280 oscuro ES, Entrada 380 claro EN, Agente 1280 oscuro ES experto, Fichas 1280 claro ES); en la pasada anterior (2026-10-02), 11 |
| e2e de `reduced-motion`        | 14 pruebas «movimiento reducido» (7 pantallas × teléfono y escritorio, `reducedMotion: "reduce"`, visibilidad real de lo del experto y axe), en `tests/e2e/*.spec.ts`; verdes en la CI del PR #8 sobre `11115e5`                                                                                                                                                                                                                                                                                                                                                                    |

Gate de FIDELIDAD de P1 (indiferible, no viaja con el ⭐): aprobado el 2026-09-29. Miradas 2, 3 y 4: aprobadas el
2026-09-30, el 2026-10-01 y el 2026-10-02. Cambios de forma de la auditoría: «lo abri y lo apruebo, sigamos»
(2026-10-03). Todas registradas en la bitácora con su artefacto.

## Decisiones no anticipadas

- **ADR-007 — ruteo del export:** URL limpias en el sitio y `.html` explícitos en el paquete; la maqueta sale del
  export (`docs/diseno/`).
- **ADR-008 — i18n por ruta y datos en build:** sin IndexedDB (enmienda a la línea de stack); derivados en
  `data/vitrina/` con manifiesto; `swap` en lugar de `block` para las fuentes; mono y Fraunces tras la carga.
- **ADR-009 — paquete para hoja-de-vida:** `basePath /piezas/planlang`, árbol de hoja-de-vida, manifiesto con
  lector, gate de publicación, el `roadmap:` previo se conserva.
- **ADR-010 — conversión grafo → mapa 0.3.0:** las convenciones donde la app no cabe en el contrato (terminales,
  función nombrada, rama por defecto, código sin URL, geometría de la maqueta).
- **ADR-004 enmendado:** `--max-turns 2` solo con `--json-schema`, medido en 466 llamadas.
- **ADR-003 adenda:** todo JSON versionado en NFC (guardia nueva).
- **Planes v1.3 y v1.4**, aprobados por el usuario; la vitrina sigue en la corrida de 20 con la v1.3 y la de 200
  queda como dato para el S3.
- **ADR-011 — margen de LCP del playground:** 2,8 s solo para `/*/playground`, porque la simulación de Lighthouse
  sobre localhost da ~1,96 s o ~2,65 s con los mismos bytes; el resto de rutas sigue en 2,5 s, con una prueba que
  exige un presupuesto de LCP por URL medida. Decisión del usuario del 2026-10-04, deuda del S3 (desviación 58).

## Bugs + resoluciones

Detalle en la tabla «Bugs y fricciones» de la bitácora. Los de producto:

- **Lienzo y visor:**
  - «0.75» con punto en el lienzo en español: `valorDeRegla`, con coma y sin `Intl`;
  - la línea a «fin» del spike tachaba su rótulo: los terminales no se conectan por abajo, más D11 sobre los rótulos;
  - el índice de capas marcaba la 05 al final del recorrido;
  - «Sin probar» se veía como anillo continuo: punta recta en las marcas discontinuas.
- **Hidratación y accesibilidad:** contraste rojo intermitente en axe, porque los botones de tema y perfil pasaban a
  «pulsado» con transición al hidratar; ahora la opción se pinta desde el atributo del `<html>`.
- **Rendimiento:**
  - LCP 2,72 s en la Entrada: la mono de datos pasa a cargarse después del `load`;
  - el playground en 2.499,99 ms por Zod en la isla: los esquemas salen del cliente;
  - FCP de Fichas +450 ms por Fraunces: también tras la carga;
  - Lighthouse rojo en el commit de cierre (`edf146f`) por el LCP de `/en/playground`: margen por ruta (ADR-011).
- **Fichas:**
  - «vplan v1.3» y «5 funcionalidades» en un nodo;
  - `procedencia` sin proceso en el complemento.

  Se vieron al leer los componentes de hoja-de-vida y se corrigieron antes de entregar.

- **Casos y Plan:**
  - «Observado: outpatient» en inglés;
  - el relato de A-006 no contaba la instrucción escondida;
  - «enrutad/or» partido en el teléfono.
- **Sentry se descargaba sin DSN:** pasó a importación dinámica.
- **CI roja en `quality`** por enlaces a los casos antes de que existiera P6. Desde entonces, el job entero corre en
  local antes de cada push.
- **Auditoría:** la divergencia de la métrica en el playground y el `opcion_elegida` monolingüe copiado al inglés
  (arriba).
- **Ruido de la máquina, no del producto:**
  - la carga media llegó a 27–138 por otras sesiones: las pruebas largas del e2e pasaron de 30 s y cinco unitarias
    de tiempo cayeron en rojo. Aisladas y en la corrida siguiente pasan; en la CI, sin intermitentes;
  - el puerto 3000 lo tomó otra app: `PLANLANG_E2E_PUERTO` (en `.env.example`).

## Qué salió bien / qué generó fricción

- **Bien:**
  - La paridad como contrato: el playground, el verificador y los dos intérpretes de aristas dicen lo mismo, y
    cuando no (la métrica, el nulo) una prueba lo nombró.
  - La auditoría independiente con «ajustar todo» encontró defectos reales en los Bajos (el `opcion_elegida`
    monolingüe, la métrica del playground, una prueba que no podía fallar).
  - Las miradas por fase con su matriz: ninguna se pasó con «continúa», y en la mirada 3 la repregunta funcionó.
  - El lote de 200 corrió entero en una noche, sin un error ni un límite de uso.
- **Fricción:**
  - El volumen de la Fase 2 de la auditoría (105 hallazgos) llevó más que la fase 4; las compactaciones se
    gestionaron con puntos de retoma en la bitácora.
  - La máquina compartida con otras sesiones metió ruido en el e2e local y ocupó el puerto 3000.
  - El LCP de `/en/playground` oscila alrededor del presupuesto en la CI con los mismos bytes: tumbó el commit de
    cierre y llevó al ADR-011.
  - Las capturas de fidelidad pesan 52 MB en un repo público.

## Sugerencias de mejora al método

1. **Kit — hook PreToolUse que falla cerrado:** el hook de secretos de Claude Code dejaba pasar todo si faltaba
   gitleaks o jq. En planlang falla cerrado, como el pre-commit (`KIT_SIN_GITLEAKS=1` lo salta a sabiendas), con
   prueba que corre el comando real (`tests/unit/guardias/hook-secretos.test.ts`). Propuesta: llevarlo al kit.
2. **Kit — `verificar-dependencias` con degradaciones declaradas:** la plantilla no contempla una bajada a
   propósito. planlang usa `scripts/degradaciones-permitidas.json` (coincidencia exacta; una entrada sin uso falla).
   **Tras el merge de este PR, el primer PR siguiente debe borrar las dos entradas** (`@types/node`,
   `undici-types`): ya no aplicarán y el script fallará a propósito.
3. **Método — paridad entre motores para lo que corre en el navegador del visitante:** golden escrito por Node
   (jsdom) y exigido byte a byte en Chromium, Firefox y WebKit con la misma función de huella en los dos lados
   (`tests/e2e/_paridad.ts`). El rojo se demuestra con una divergencia que solo ocurre en un motor.
4. **Método — Lighthouse con margen:** una URL que vive a ±150 ms del presupuesto da rojos sin cambios. Propuesta:
   que el gate de performance avise cuando la mediana quede a menos de un 10 % del presupuesto.
5. **Enmiendas al diagramador** (en `packages/diagramador/CONTRATO.lock`, `enmiendas_propuestas`): tipo
   `terminal` · `condicion.funcion` · `condicion.por_defecto` · `fuente.tipo: "codigo"` · glifo de `regla` =
   hexágono · tabla G15 con Inter.
6. **Para la planeadora:**
   - el bloque `roadmap:` de `SPRINT_002.md` no trae las `descripcion` que exige `roadmapFeatureSchema`
     (desviación 6); el paquete conserva el `roadmap:` que tenga hoja-de-vida;
   - `ordenes/CLAUDE-md-para-app.md` sigue con la cabecera v1.30.0, el marcador `[DOMAIN …]` y sin los deltas del
     kit v1.31–v1.32.1 (desviación 2);
   - el centinela «Worktrees prohibidos» vive solo en esta app (desviación 1);
   - para el plan del demo A: dar a `propuesta` un valor adverso parcial para que U4 mueva casos (desviación 3).
7. **Design system:** proponer al `design-system.md` los tamaños 14 · 22 · 11 px y la interlínea 1,6 que la maqueta
   usa fuera del § 2.3 (desviación 15), y `swap` con respaldo ajustado (desviación 16).

## Deuda técnica aceptada

| Qué                                                                                                                  | Por qué                                                                                                                                                               | Sprint de pago                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ⭐ acumulado: 15 pruebas (S1: 5 · S2: 10), con las 3 paradas del S1                                                  | diferido por decisión del usuario, con contrapesos                                                                                                                    | gate ⭐⭐ del cierre de pruebas del ciclo                                                                                                 |
| LangSmith sin aprovisionar                                                                                           | la clave no está en el entorno del builder                                                                                                                            | antes del ⭐⭐ (parada de LangSmith)                                                                                                      |
| LCP del playground con 2,8 s de presupuesto en vez de 2,5 (ADR-011, desviación 58)                                   | la simulación de Lighthouse es bimodal en localhost (~1,96 s o ~2,65 s con los mismos bytes); lo alcanzable sin tocar la fuente aprobada ni el framework baja ~0,13 s | S3: bajar el modo alto de 2,5 s (textos de la isla por idioma, DOM más liviano o su chunk después de la primera pintura) y volver a 2.500 |
| El informe en Markdown arma frases por fragmentos (`core/brecha/render-md.ts`, 76 ternarios; `core/brecha/m9.ts`, 6) | la vitrina ya se pagó; reescribir el informe cambia los bytes de todos los publicados                                                                                 | S3                                                                                                                                        |
| Los evaluadores del verificador atribuyen nodos con los nombres del demo A                                           | necesita el esquema del plan (M-20)                                                                                                                                   | S3, con el demo B                                                                                                                         |
| El mapa sin `recorridos` (desviación 57)                                                                             | las trazas viven en P3 y P6                                                                                                                                           | S3, con las enmiendas del ADR-010                                                                                                         |
| La corrida de 200 en la vitrina                                                                                      | la vitrina sigue en la de 20 con la v1.3                                                                                                                              | S3                                                                                                                                        |
| U4 inerte con este plan                                                                                              | decisión del usuario                                                                                                                                                  | S3 (propuesta a la planeadora)                                                                                                            |
| M-8, M-15, M-16, M-17, M-18, M-20 y el resto de M-25                                                                 | cambian la forma de la traza, el grafo o el esquema del plan                                                                                                          | S3                                                                                                                                        |
| Unidad de U2 solo en español                                                                                         | cambiarla invalida el lote (ADR-005)                                                                                                                                  | con el próximo lote                                                                                                                       |
| Capturas de fidelidad: 52 MB (desviación 55)                                                                         | registro de cada mirada aprobada                                                                                                                                      | S3: techo por mirada o fuera del árbol de trabajo                                                                                         |
| Aviso `braces` aceptado                                                                                              | sin versión corregida; solo del lint                                                                                                                                  | revisar antes del 2026-11-02 (prueba que falla al vencer)                                                                                 |
| Borrar las dos entradas de `scripts/degradaciones-permitidas.json`                                                   | dejan de aplicar tras este merge                                                                                                                                      | el primer PR después del merge                                                                                                            |

## Archivos clave

1. `src/app/[idioma]/` — las 7 pantallas de la vitrina (ES/EN).
2. `src/lib/vista/` — de los datos verificados a lo que pinta cada pantalla, con errores con nombre.
3. `core/visor/` — grafo compilado → mapa 0.3.0 → SVG y lista por capa (ADR-010).
4. `core/playground/consecuencias.ts` — el recálculo que corre en el navegador.
5. `src/components/playground/juego.tsx` — la isla del playground.
6. `src/lib/datos/vitrina.ts` — la carga verificada de lo que declara `data/vitrina/manifiesto.json`.
7. `scripts/paquete-vitrina.ts` — el paquete para hoja-de-vida y su gate de publicación (ADR-009).
8. `tests/e2e/paridad.spec.ts` — la paridad del playground en Chromium, Firefox y WebKit.
9. `docs/fidelidad/cierre/index.html` — la pasada de capturas de cierre y los cambios de la auditoría.
10. `sprints/SPRINT_002-auditoria.md` — la auditoría final.

## Cómo probar

`docs/GUIA-DE-PRUEBA.html` (doble clic): ⭐⭐ 4 paradas (~22 min) · ⭐ 15 (~60 min) · el resto lo cubre la CI. La
vitrina: `pnpm build && pnpm start` y abrir `/` (elige idioma) → las 7 pestañas → un caso → `/en`, en los dos temas
y perfiles. En terminal: `pnpm test`, `pnpm test:e2e`, `pnpm trazas:verificar`, `pnpm diagrama:verificar`,
`pnpm paquete:vitrina && pnpm test:e2e:paquete`, `cd agents && .venv/bin/pytest`.
