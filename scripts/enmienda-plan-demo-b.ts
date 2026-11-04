/**
 * Las enmiendas del plan del demo B como funciones puras (las usa el CLI `enmendar-plan-demo-b.ts` y el test que prueba
 * que `plans/demo-b/v1.1.json` sale de aquí).
 */
import type { TextoBilingue } from "../core/formatos/bilingue";
import type { Plan } from "../core/plan";

const tb = (es: string, en: string): TextoBilingue => ({ es, en });

/** El inglés de cada texto que el v1 trae solo en español (M-25), por su español exacto. */
const EN: Readonly<Record<string, string>> = {
  // D1
  "solo las exactas": "exact matches only",
  "la homonimia escapa": "namesakes slip through",
  "toda coincidencia en lista vinculante y toda aproximada sobre el umbral":
    "every match on a binding list and every approximate match above the threshold",
  "Ley 1121 art. 20; AMLR 76(5)": "Law 1121 art. 20; AMLR 76(5)",
  // D3
  "solo la decisión": "the decision only",
  "sin trazabilidad": "no traceability",
  "entradas, reglas, versión de lista, salida y revisor":
    "inputs, rules, list version, output and reviewer",
  "AMLR art. 77; OFAC Framework": "AMLR art. 77; OFAC Framework",
  // D4
  "puntaje que propone el modelo": "a score proposed by the model",
  "inauditable; la especificación (RF-04b.3) lo prohíbe":
    "cannot be audited; the specification (RF-04b.3) forbids it",
  "puntaje por reglas declaradas: actividad, jurisdicción y coherencia entre ingresos y actividad":
    "a score from declared rules: activity, jurisdiction and consistency between income and activity",
  "auditable; sin atributos protegidos (Ley 1581 art. 5)":
    "auditable; no protected attributes (Law 1581 art. 5)",
  // R1–R4
  "lista con versión y fecha; bloqueo + escalamiento obligatorio":
    "list with version and date; mandatory block + escalation",
  "toda salida rechazar pasa por el oficial; investigador de contexto antes":
    "every reject output goes to the officer; the context investigator comes first",
  "cada conclusión cita regla o coincidencia por código":
    "each conclusion cites its rule or match, by code",
  "separación control/datos; puntuación por reglas, no por el modelo":
    "control/data separation; scoring by rules, not by the model",
  diseño: "design",
  "ocurrencia → 1": "occurrence → 1",
  "ocurrencia → 2": "occurrence → 2",
  "detección → 1": "detection → 1",
};

function bilingue(v: string | TextoBilingue): TextoBilingue;
function bilingue(
  v: string | TextoBilingue | undefined,
): TextoBilingue | undefined;
function bilingue(
  v: string | TextoBilingue | undefined,
): TextoBilingue | undefined {
  if (v === undefined || typeof v !== "string") return v;
  const en = EN[v];
  if (en === undefined) throw new Error(`sin redacción en inglés: «${v}»`);
  return tb(v, en);
}

/** Copia `o` con los campos dados en los dos idiomas (los ausentes siguen ausentes). */
function conCampos<T extends object>(o: T, campos: readonly string[]): T {
  const copia = { ...o } as Record<string, unknown>;
  for (const k of campos)
    if (k in copia)
      copia[k] = bilingue(copia[k] as string | TextoBilingue | undefined);
  return copia as T;
}

/**
 * La enmienda v1 → v1.1 (S3 fase 3; decisión del usuario 2026-10-04: «v1.1 con los tres»): SOLO medición y redacción.
 * Umbrales y contrato de grafo quedan idénticos — las corridas del B siguen valiendo (ADR-005).
 *   1. Los 24 textos que el v1 trae solo en español (opciones de D1, D3 y D4; mitigaciones de R1–R4), en los dos
 *      idiomas (M-25). El español es el del v1, palabra por palabra.
 *   2. S1 declara su mínimo con la clave que el verificador decide (`tasa_min`: el mismo 0,8 sobre la misma condición).
 *   3. S2 nuevo: la comparación con la línea base de agente único que el contrato exige (regla dura 10), con la regla
 *      estricta que el usuario eligió para el A («no peor en nada», a un presupuesto no mayor: ADR-006).
 */
export function enmendarBV11(v1: Plan): Record<string, unknown> {
  const decisiones = v1.decisiones.map((d) => ({
    ...conCampos(d, ["opcion_elegida"]),
    opciones: d.opciones.map((o) =>
      conCampos(o, ["nombre", "pros", "contras"]),
    ),
  }));
  const riesgos = v1.riesgos.map((r) => ({
    ...conCampos(r, ["no_detectable_en_trazas"]),
    mitigaciones: r.mitigaciones.map((m) =>
      conCampos(m, ["accion", "momento", "efecto_esperado"]),
    ),
  }));
  const supuestos = v1.supuestos.map((s) => {
    if (s.id !== "S1" || !s.medible_en_trazas) return s;
    const minimo =
      s.medible_en_trazas.umbral_confirmacion?.[
        "proporcion_homonimos_resueltos_bien"
      ];
    if (minimo === undefined) throw new Error("S1 sin su mínimo del v1");
    return {
      ...s,
      medible_en_trazas: {
        ...s.medible_en_trazas,
        metricas: ["tasa"],
        umbral_confirmacion: { tasa_min: minimo },
      },
    };
  });
  if (supuestos.some((s) => s.id === "S2"))
    throw new Error("el v1 ya tiene un S2");
  supuestos.push({
    id: "S2",
    origen: "usuario",
    criticidad: "media",
    estado: "sin_probar",
    enunciado: tb(
      "El multiagente (extractor e investigador de contexto) no rinde peor que un agente único a un presupuesto no mayor.",
      "The multi-agent (extractor and context investigator) does no worse than a single agent at no larger budget.",
    ),
    medible_en_trazas: {
      comparacion: "linea_base_agente_unico",
      metricas: ["exactitud", "latencia_mediana"],
      poblacion: "todos",
      umbral_confirmacion: {
        exactitud_dif_min: 0,
        latencia_mediana_razon_max: 1,
      },
    },
    prueba_barata: tb(
      "Línea base de agente único sobre el mismo lote de 20; comparar exactitud y latencia.",
      "Single-agent baseline on the same 20-case batch; compare accuracy and latency.",
    ),
  } as Plan["supuestos"][number]);
  const borrador: Record<string, unknown> = {
    ...v1,
    version: "1.1.0",
    estado_aprobacion: "borrador",
    huella: null,
    decisiones,
    riesgos,
    supuestos,
  };
  delete borrador.aprobado_por;
  delete borrador.aprobado_el;
  return borrador;
}

/**
 * La enmienda v1.1 → v1.2 (S9, «El reloj y los dueños»; aprobada por el usuario en el G-Plan del S9, chat de la
 * planeadora, 2026-11-02): el demo B aprende a decir quién es el dueño de una empresa.
 *   1. Nodo `beneficiarios` (regla, determinista): de la estructura societaria que extrae el modelo calcula quiénes son
 *      los beneficiarios finales —los que tienen 25 % o más de participación efectiva, directa o indirecta, y la persona
 *      que controla— y cruza a cada uno con las listas.
 *   2. Arista «persona jurídica ⇒ beneficiarios» (desde el extractor) y arista «beneficiario con coincidencia ⇒ pausa
 *      humana» (desde la decisión, con el mismo umbral U1 de la coincidencia de siempre, así el playground la mueve).
 *   3. Tres señales nuevas en la traza: `tipo_solicitante`, `beneficiarios` y `similitud_beneficiarios_max`.
 *   4. C7: en las solicitudes de persona jurídica (según la verdad conocida, no según lo que leyó el extractor), el
 *      conjunto de beneficiarios coincide con la verdad conocida en al menos el 90 %.
 * Cambia el contrato de grafo: las corridas de la v1 y la v1.1 no valen para ella (ADR-005). Los umbrales U1–U4 no
 * cambian.
 *
 * El 25 % y la persona que controla son los de 31 CFR § 1010.230(d)(1) y (d)(2) («25 percent or more of the equity
 * interests»; «a single individual with significant responsibility to control, manage, or direct»), leídos en su fuente
 * el 2026-11-03. La norma no fija cómo se calcula la participación indirecta: el nodo la calcula multiplicando los
 * porcentajes por cada camino y sumando los caminos (ADR-019).
 */
export function enmendarBV12(v11: Plan): Record<string, unknown> {
  const g = v11.contrato_de_grafo;
  if (g.nodos_esperados.some((n) => n.id === "beneficiarios"))
    throw new Error("el v1.1 ya tiene el nodo beneficiarios");
  if (v11.criterios_aceptacion.some((c) => c.id === "C7"))
    throw new Error("el v1.1 ya tiene un C7");
  const nodos = [...g.nodos_esperados];
  nodos.splice(nodos.findIndex((n) => n.id === "extractor") + 1, 0, {
    id: "beneficiarios",
    tipo: "regla",
  });
  const aristas = [
    {
      desde: "extractor",
      orden: 1,
      senal: "tipo_solicitante",
      operador: "igual_a",
      valor: "juridica",
      inclusivo: false,
      si_verdadero: "beneficiarios",
    },
    ...g.aristas_condicionales,
    {
      desde: "decision",
      orden: 7,
      senal: "similitud_beneficiarios_max",
      operador: "mayor_o_igual_que",
      valor: "umbral.U1",
      inclusivo: true,
      si_verdadero: "pausa_humana",
    },
  ] as Plan["contrato_de_grafo"]["aristas_condicionales"];
  const contrato_de_grafo: Plan["contrato_de_grafo"] = {
    ...g,
    nodos_esperados: nodos,
    aristas_condicionales: aristas,
    ramas_por_defecto: {
      ...g.ramas_por_defecto,
      extractor: "verificador_listas",
    },
    pausas_humanas: g.pausas_humanas.map((p) => ({
      ...p,
      payload_minimo: [...p.payload_minimo, "beneficiarios"],
    })),
    senales_obligatorias_en_traza: [
      ...g.senales_obligatorias_en_traza,
      "tipo_solicitante",
      "beneficiarios",
      "similitud_beneficiarios_max",
    ],
  };
  const c7 = {
    id: "C7",
    enunciado: tb(
      "En las solicitudes de persona jurídica, el conjunto de beneficiarios finales (25 % o más de participación efectiva, directa o indirecta, y la persona que controla; 31 CFR § 1010.230(d), consultado el 2026-11-03) coincide con la verdad conocida en al menos el 90 %.",
      "In legal-entity requests, the set of beneficial owners (25% or more effective ownership, direct or indirect, and the person who controls; 31 CFR § 1010.230(d), read on 2026-11-03) matches the known truth in at least 90% of them.",
    ),
    tipo: "tasa",
    regla_de_medicion: {
      agregacion: "tasa",
      condicion: "beneficiarios == verdad_conocida.beneficiarios",
      // La población es la de la verdad: una jurídica que el extractor leyera como natural no sale de la medida.
      poblacion: "verdad_conocida.tipo_solicitante == 'juridica'",
    },
    valor_objetivo: 0.9,
    origen: "usuario",
  } as Plan["criterios_aceptacion"][number];
  const flujo_objetivo = [...v11.flujo_objetivo];
  const iExtractor = flujo_objetivo.findIndex((f) =>
    f.es.startsWith("El extractor saca los datos"),
  );
  if (iExtractor < 0) throw new Error("el v1.1 no trae el paso del extractor");
  flujo_objetivo.splice(
    iExtractor + 1,
    0,
    tb(
      "Si el solicitante es una persona jurídica, un nodo de reglas calcula quiénes son sus beneficiarios finales a partir de la estructura societaria y cruza a cada uno con las listas; si alguno coincide, el caso va al oficial.",
      "If the applicant is a legal entity, a rules node works out who its beneficial owners are from the ownership structure and checks each one against the lists; if any matches, the case goes to the officer.",
    ),
  );
  const borrador: Record<string, unknown> = {
    ...v11,
    version: "1.2.0",
    estado_aprobacion: "borrador",
    huella: null,
    flujo_objetivo,
    criterios_aceptacion: [...v11.criterios_aceptacion, c7],
    contrato_de_grafo,
  };
  delete borrador.aprobado_por;
  delete borrador.aprobado_el;
  return borrador;
}
