/**
 * Validador del plan (M1: RF-01.2–01.5, RF-09.4). Un plan se acepta solo si es un CONTRATO completo y
 * medible: cada criterio con regla de medición interpretable, cada umbral con señal declarada en la
 * traza, cada riesgo con detector (o marcado «no detectable»), al menos una pausa humana, ninguna
 * prioridad alta sin mitigación, ningún ciclo entre decisiones, ninguna referencia rota y toda
 * condición parseable. Los motivos se devuelven en ES y EN con el elemento que los produce.
 *
 * Determinista y sin efectos: mismo plan → mismos motivos en el mismo orden.
 */
import {
  informeDeInstrumentos,
  type InformeInstrumentos,
} from "../../packages/instrumentos-de-plan/src";
import { ErrorSintaxis, parsear, referencias } from "../brecha/condiciones";
import {
  CLAVES_DE_SESION,
  FUNCIONES_DE_CONDICION,
  VOCABULARIO,
} from "../brecha/contexto";
import { FUNCIONES } from "../playground/aristas";
import type { TextoBilingue } from "../formatos/bilingue";
import {
  esAristaTripleta,
  PlanSchema,
  type AristaCondicional,
  type ContratoDeGrafo,
  type Plan,
} from "./esquema";

export const CODIGOS = [
  "ESQUEMA",
  "CICLO",
  "DEPENDENCIA_DESCONOCIDA",
  "PRIORIDAD_ALTA_SIN_MITIGACION",
  "SUPUESTO_CRITICO_SIN_PRUEBA",
  "CRITERIO_SIN_REGLA",
  "UMBRAL_SIN_SENAL",
  "RIESGO_SIN_DETECTOR",
  "SIN_PAUSA_HUMANA",
  "CONDICION_NO_INTERPRETABLE",
  "REFERENCIA_ROTA",
  "OPERADOR_INCLUSIVO_INCOHERENTE",
  "NODO_ESCRITOR_SIN_RAMA_POR_DEFECTO",
  "ORDEN_DE_ARISTAS",
  "UMBRAL_TIPO_INCOHERENTE",
  "HUELLA_AUSENTE",
  "SENAL_NO_DECLARADA",
] as const;
export type Codigo = (typeof CODIGOS)[number];

export interface Motivo {
  codigo: Codigo;
  elemento: string;
  mensaje: TextoBilingue;
}

export type ResultadoValidacion =
  | {
      ok: true;
      plan: Plan;
      instrumentos: InformeInstrumentos;
      advertencias: Motivo[];
    }
  | { ok: false; motivos: Motivo[]; advertencias: Motivo[] };

const REFERENCIA_UMBRAL = /^umbral\.([A-Za-z0-9_-]+)$/;

function motivo(
  codigo: Codigo,
  elemento: string,
  es: string,
  en: string,
): Motivo {
  return { codigo, elemento, mensaje: { es, en } };
}

/** Parsea una condición del plan; devuelve motivos si no es interpretable o referencia un umbral inexistente. */
function validarCondicion(
  texto: string,
  elemento: string,
  umbrales: ReadonlySet<string>,
): Motivo[] {
  try {
    const ast = parsear(texto);
    const salida: Motivo[] = [];
    for (const ruta of referencias(ast).rutas) {
      const m = REFERENCIA_UMBRAL.exec(ruta);
      if (m && !umbrales.has(m[1] as string)) {
        salida.push(
          motivo(
            "REFERENCIA_ROTA",
            elemento,
            `La condición referencia «${ruta}» y ese umbral no existe en el plan.`,
            `The condition references “${ruta}” and that threshold does not exist in the plan.`,
          ),
        );
      }
    }
    return salida;
  } catch (e) {
    const detalle = e instanceof ErrorSintaxis ? e.message : String(e);
    return [
      motivo(
        "CONDICION_NO_INTERPRETABLE",
        elemento,
        `La condición «${texto}» no se puede interpretar (${detalle}).`,
        `The condition “${texto}” cannot be interpreted (${detalle}).`,
      ),
    ];
  }
}

function validarContrato(
  contrato: ContratoDeGrafo,
  umbrales: ReadonlySet<string>,
  motivos: Motivo[],
): void {
  const nodos = new Map(contrato.nodos_esperados.map((n) => [n.id, n.tipo]));
  const senales = new Set(contrato.senales_obligatorias_en_traza);

  // Pausas humanas: al menos una y sobre un nodo de tipo pausa_humana.
  const pausasValidas = contrato.pausas_humanas.filter(
    (p) => nodos.get(p.nodo) === "pausa_humana",
  );
  if (pausasValidas.length === 0) {
    motivos.push(
      motivo(
        "SIN_PAUSA_HUMANA",
        "contrato_de_grafo.pausas_humanas",
        "El contrato de grafo no declara ninguna pausa humana sobre un nodo de tipo pausa_humana.",
        "The graph contract declares no human pause on a node of type pausa_humana.",
      ),
    );
  }
  for (const p of contrato.pausas_humanas) {
    if (!nodos.has(p.nodo)) {
      motivos.push(
        motivo(
          "REFERENCIA_ROTA",
          `pausas_humanas.${p.nodo}`,
          `La pausa referencia el nodo «${p.nodo}», que no está en nodos_esperados.`,
          `The pause references node “${p.nodo}”, which is not in nodos_esperados.`,
        ),
      );
    }
  }

  // Aristas condicionales.
  const porNodo = new Map<string, AristaCondicional[]>();
  contrato.aristas_condicionales.forEach((a, i) => {
    const el = `aristas_condicionales[${i}] (${a.desde} #${a.orden})`;
    for (const destino of [a.desde, a.si_verdadero, a.si_falso]) {
      if (destino !== undefined && !nodos.has(destino)) {
        motivos.push(
          motivo(
            "REFERENCIA_ROTA",
            el,
            `La arista referencia el nodo «${destino}», que no existe.`,
            `The edge references node “${destino}”, which does not exist.`,
          ),
        );
      }
    }
    if (esAristaTripleta(a)) {
      if (!senales.has(a.senal)) {
        motivos.push(
          motivo(
            "UMBRAL_SIN_SENAL",
            el,
            `La señal «${a.senal}» de la arista no está en senales_obligatorias_en_traza.`,
            `Edge signal “${a.senal}” is not in senales_obligatorias_en_traza.`,
          ),
        );
      }
      if (typeof a.valor === "string") {
        const m = REFERENCIA_UMBRAL.exec(a.valor);
        if (m && !umbrales.has(m[1] as string)) {
          motivos.push(
            motivo(
              "REFERENCIA_ROTA",
              el,
              `La arista referencia «${a.valor}» y ese umbral no existe.`,
              `The edge references “${a.valor}” and that threshold does not exist.`,
            ),
          );
        }
      }
      if (
        (a.operador === "mayor_o_igual_que" ||
          a.operador === "menor_o_igual_que") &&
        !a.inclusivo
      ) {
        motivos.push(
          motivo(
            "OPERADOR_INCLUSIVO_INCOHERENTE",
            el,
            `El operador ${a.operador} exige inclusivo: true.`,
            `Operator ${a.operador} requires inclusivo: true.`,
          ),
        );
      }
    } else {
      // M-23: la función nombrada existe en el registro cerrado (el mismo que Python) y lee lo que el registro dice.
      const registrada = Object.hasOwn(FUNCIONES, a.funcion.nombre)
        ? FUNCIONES[a.funcion.nombre]
        : undefined;
      if (!registrada)
        motivos.push(
          motivo(
            "REFERENCIA_ROTA",
            el,
            `La función «${a.funcion.nombre}» no está registrada: ni el grafo ni el playground sabrían evaluarla.`,
            `Function “${a.funcion.nombre}” is not registered: neither the graph nor the playground could evaluate it.`,
          ),
        );
      else if (
        JSON.stringify(registrada.entradas) !==
        JSON.stringify(a.funcion.entradas)
      )
        motivos.push(
          motivo(
            "REFERENCIA_ROTA",
            el,
            `La función «${a.funcion.nombre}» lee ${registrada.entradas.join(", ")}; el plan le da ${a.funcion.entradas.join(", ")}.`,
            `Function “${a.funcion.nombre}” reads ${registrada.entradas.join(", ")}; the plan gives it ${a.funcion.entradas.join(", ")}.`,
          ),
        );
      for (const entrada of a.funcion.entradas) {
        if (!senales.has(entrada)) {
          motivos.push(
            motivo(
              "UMBRAL_SIN_SENAL",
              el,
              `La función ${a.funcion.nombre} lee «${entrada}», que no es una señal obligatoria de la traza.`,
              `Function ${a.funcion.nombre} reads “${entrada}”, which is not a mandatory trace signal.`,
            ),
          );
        }
      }
    }
    const lista = porNodo.get(a.desde) ?? [];
    lista.push(a);
    porNodo.set(a.desde, lista);
  });

  for (const [desde, aristas] of [...porNodo.entries()].sort(([a], [b]) =>
    a < b ? -1 : 1,
  )) {
    const ordenes = aristas.map((a) => a.orden).sort((x, y) => x - y);
    const esperado = ordenes.map((_, i) => i + 1);
    if (JSON.stringify(ordenes) !== JSON.stringify(esperado)) {
      motivos.push(
        motivo(
          "ORDEN_DE_ARISTAS",
          desde,
          `Las aristas de «${desde}» deben numerarse 1..n sin huecos ni repeticiones (tienen ${ordenes.join(",")}).`,
          `Edges of “${desde}” must be numbered 1..n without gaps or repeats (they have ${ordenes.join(",")}).`,
        ),
      );
    }
    const conFalso = aristas.filter((a) => a.si_falso !== undefined);
    const porDefecto = contrato.ramas_por_defecto[desde];
    const tieneDefecto =
      (aristas.length === 1 && conFalso.length === 1) ||
      porDefecto !== undefined;
    if (!tieneDefecto) {
      motivos.push(
        motivo(
          "NODO_ESCRITOR_SIN_RAMA_POR_DEFECTO",
          desde,
          `El nodo escritor «${desde}» necesita rama por defecto: si_falso en su única arista o una entrada en ramas_por_defecto.`,
          `Writer node “${desde}” needs a default branch: si_falso on its single edge or an entry in ramas_por_defecto.`,
        ),
      );
    }
    if (aristas.length > 1 && conFalso.length > 0 && porDefecto !== undefined) {
      motivos.push(
        motivo(
          "NODO_ESCRITOR_SIN_RAMA_POR_DEFECTO",
          desde,
          `El nodo «${desde}» declara si_falso en aristas múltiples Y rama por defecto: ambigüedad.`,
          `Node “${desde}” declares si_falso on multiple edges AND a default branch: ambiguous.`,
        ),
      );
    }
  }
  for (const [desde, destino] of Object.entries(contrato.ramas_por_defecto)) {
    if (!porNodo.has(desde))
      motivos.push(
        motivo(
          "REFERENCIA_ROTA",
          `ramas_por_defecto.${desde}`,
          `«${desde}» no tiene aristas condicionales.`,
          `“${desde}” has no conditional edges.`,
        ),
      );
    if (!nodos.has(destino))
      motivos.push(
        motivo(
          "REFERENCIA_ROTA",
          `ramas_por_defecto.${desde}`,
          `El destino «${destino}» no existe.`,
          `Target “${destino}” does not exist.`,
        ),
      );
  }
}

export function validarPlan(entrada: unknown): ResultadoValidacion {
  const motivos: Motivo[] = [];
  const advertencias: Motivo[] = [];

  const parse = PlanSchema.safeParse(entrada);
  if (!parse.success) {
    for (const issue of parse.error.issues) {
      const ruta = issue.path.map(String).join(".") || "$";
      motivos.push(
        motivo(
          "ESQUEMA",
          ruta,
          `Esquema: ${issue.message}`,
          `Schema: ${issue.message}`,
        ),
      );
    }
    return { ok: false, motivos, advertencias };
  }
  const plan = parse.data;
  const idsUmbral = new Set(plan.umbrales.map((u) => u.id));
  const idsDecision = new Set(plan.decisiones.map((d) => d.id));
  const idsRiesgo = new Set(plan.riesgos.map((r) => r.id));
  const senales = new Set(plan.contrato_de_grafo.senales_obligatorias_en_traza);

  // Instrumentos de plan (ciclos, una vía, prioridad de acción, supuestos críticos).
  const instrumentos = informeDeInstrumentos({
    decisiones: plan.decisiones,
    modos_de_falla: plan.riesgos,
    supuestos: plan.supuestos,
  });
  for (const b of instrumentos.bloqueantes) {
    const codigo: Codigo =
      b.tipo === "ciclo"
        ? "CICLO"
        : b.tipo === "dependencia_desconocida"
          ? "DEPENDENCIA_DESCONOCIDA"
          : b.tipo === "prioridad_alta_sin_mitigacion"
            ? "PRIORIDAD_ALTA_SIN_MITIGACION"
            : "SUPUESTO_CRITICO_SIN_PRUEBA";
    motivos.push({ codigo, elemento: b.ids.join(" → "), mensaje: b.mensaje });
  }

  // Decisiones: referencias.
  for (const d of plan.decisiones) {
    for (const u of d.umbrales_asociados)
      if (!idsUmbral.has(u))
        motivos.push(
          motivo(
            "REFERENCIA_ROTA",
            d.id,
            `La decisión referencia el umbral «${u}», que no existe.`,
            `The decision references threshold “${u}”, which does not exist.`,
          ),
        );
    for (const r of d.riesgos_asociados)
      if (!idsRiesgo.has(r))
        motivos.push(
          motivo(
            "REFERENCIA_ROTA",
            d.id,
            `La decisión referencia el riesgo «${r}», que no existe.`,
            `The decision references risk “${r}”, which does not exist.`,
          ),
        );
  }

  // Criterios: regla de medición completa e interpretable.
  for (const c of plan.criterios_aceptacion) {
    for (const id of c.riesgos_controlados ?? [])
      if (!idsRiesgo.has(id))
        motivos.push(
          motivo(
            "REFERENCIA_ROTA",
            c.id,
            `El criterio dice controlar el riesgo «${id}», que no existe.`,
            `The criterion claims to control risk “${id}”, which does not exist.`,
          ),
        );
    const r = c.regla_de_medicion;
    const exigeCondicion =
      r.agregacion === "todos_cumplen" ||
      r.agregacion === "pass^k" ||
      r.agregacion === "tasa";
    if (exigeCondicion && !r.condicion)
      motivos.push(
        motivo(
          "CRITERIO_SIN_REGLA",
          c.id,
          `El criterio ${c.id} (${r.agregacion}) no declara condición de medición.`,
          `Criterion ${c.id} (${r.agregacion}) declares no measurement condition.`,
        ),
      );
    if (!exigeCondicion && !r.metrica)
      motivos.push(
        motivo(
          "CRITERIO_SIN_REGLA",
          c.id,
          `El criterio ${c.id} (${r.agregacion}) no declara la métrica a agregar.`,
          `Criterion ${c.id} (${r.agregacion}) declares no metric to aggregate.`,
        ),
      );
    // M-26: una métrica con una agregación que no la agrega (o una condición en una que solo agrega la métrica) se
    // ignoraría en silencio al medir.
    if (exigeCondicion && r.metrica)
      motivos.push(
        motivo(
          "CRITERIO_SIN_REGLA",
          c.id,
          `El criterio ${c.id} declara la métrica «${r.metrica}», pero ${r.agregacion} mide su condición caso por caso y no la agrega.`,
          `Criterion ${c.id} declares metric “${r.metrica}”, but ${r.agregacion} measures its condition case by case and does not aggregate it.`,
        ),
      );
    if (!exigeCondicion && r.condicion)
      motivos.push(
        motivo(
          "CRITERIO_SIN_REGLA",
          c.id,
          `El criterio ${c.id} (${r.agregacion}) agrega la métrica y no mide la condición «${r.condicion}»: va en la población.`,
          `Criterion ${c.id} (${r.agregacion}) aggregates the metric and does not measure condition “${r.condicion}”: it belongs in the population.`,
        ),
      );
    if (r.agregacion === "pass^k" && !r.k)
      motivos.push(
        motivo(
          "CRITERIO_SIN_REGLA",
          c.id,
          `El criterio ${c.id} usa pass^k sin declarar k.`,
          `Criterion ${c.id} uses pass^k without declaring k.`,
        ),
      );
    if (!r.metrica && !r.condicion) continue;
    motivos.push(
      ...validarCondicion(r.poblacion, `${c.id}.poblacion`, idsUmbral),
    );
    if (r.condicion)
      motivos.push(
        ...validarCondicion(r.condicion, `${c.id}.condicion`, idsUmbral),
      );
    if (r.metrica && !senales.has(r.metrica))
      motivos.push(
        motivo(
          "UMBRAL_SIN_SENAL",
          c.id,
          `La métrica «${r.metrica}» no es una señal obligatoria de la traza.`,
          `Metric “${r.metrica}” is not a mandatory trace signal.`,
        ),
      );
  }

  // Umbrales: señal declarada, decisión existente, operador coherente, tipo del valor coherente.
  for (const u of plan.umbrales) {
    if (!senales.has(u.senal))
      motivos.push(
        motivo(
          "UMBRAL_SIN_SENAL",
          u.id,
          `El umbral ${u.id} usa la señal «${u.senal}», que no está en senales_obligatorias_en_traza.`,
          `Threshold ${u.id} uses signal “${u.senal}”, which is not in senales_obligatorias_en_traza.`,
        ),
      );
    if (!idsDecision.has(u.decision_id))
      motivos.push(
        motivo(
          "REFERENCIA_ROTA",
          u.id,
          `El umbral referencia la decisión «${u.decision_id}», que no existe.`,
          `The threshold references decision “${u.decision_id}”, which does not exist.`,
        ),
      );
    if (
      (u.operador === "mayor_o_igual_que" ||
        u.operador === "menor_o_igual_que") &&
      !u.inclusivo
    )
      motivos.push(
        motivo(
          "OPERADOR_INCLUSIVO_INCOHERENTE",
          u.id,
          `El operador ${u.operador} exige inclusivo: true.`,
          `Operator ${u.operador} requires inclusivo: true.`,
        ),
      );
    const booleano = "tipo" in u.rango_jugable;
    if (booleano !== (typeof u.valor_en_plan === "boolean"))
      motivos.push(
        motivo(
          "UMBRAL_TIPO_INCOHERENTE",
          u.id,
          `El umbral ${u.id} mezcla un rango ${booleano ? "booleano" : "numérico"} con un valor ${typeof u.valor_en_plan}.`,
          `Threshold ${u.id} mixes a ${booleano ? "boolean" : "numeric"} range with a ${typeof u.valor_en_plan} value.`,
        ),
      );
  }

  // Riesgos: detector o marca explícita; condiciones interpretables; decisión existente.
  for (const r of plan.riesgos) {
    if (r.detector_en_trazas === null && !r.no_detectable_en_trazas)
      motivos.push(
        motivo(
          "RIESGO_SIN_DETECTOR",
          r.id,
          `El riesgo ${r.id} no tiene detector en trazas ni está marcado «no detectable» con su razón.`,
          `Risk ${r.id} has no trace detector and is not marked “not detectable” with a reason.`,
        ),
      );
    if (r.detector_en_trazas) {
      motivos.push(
        ...validarCondicion(
          r.detector_en_trazas.poblacion,
          `${r.id}.poblacion`,
          idsUmbral,
        ),
      );
      motivos.push(
        ...validarCondicion(
          r.detector_en_trazas.condicion,
          `${r.id}.condicion`,
          idsUmbral,
        ),
      );
    }
    if (r.decision_id && !idsDecision.has(r.decision_id))
      motivos.push(
        motivo(
          "REFERENCIA_ROTA",
          r.id,
          `El riesgo referencia la decisión «${r.decision_id}», que no existe.`,
          `The risk references decision “${r.decision_id}”, which does not exist.`,
        ),
      );
  }

  // Supuestos medibles: condiciones interpretables.
  for (const s of plan.supuestos) {
    if (!s.medible_en_trazas) continue;
    motivos.push(
      ...validarCondicion(
        s.medible_en_trazas.poblacion,
        `${s.id}.poblacion`,
        idsUmbral,
      ),
    );
    if (s.medible_en_trazas.condicion)
      motivos.push(
        ...validarCondicion(
          s.medible_en_trazas.condicion,
          `${s.id}.condicion`,
          idsUmbral,
        ),
      );
  }

  // Contrato de grafo.
  validarContrato(plan.contrato_de_grafo, idsUmbral, motivos);
  for (const e of plan.contrato_de_grafo.evaluadores_requeridos) {
    for (const r of e.riesgos_cubiertos)
      if (!idsRiesgo.has(r))
        motivos.push(
          motivo(
            "REFERENCIA_ROTA",
            `evaluadores.${e.id}`,
            `El evaluador cubre el riesgo «${r}», que no existe.`,
            `The evaluator covers risk “${r}”, which does not exist.`,
          ),
        );
    if (e.tipo === "regla" && e.riesgos_cubiertos.length === 0)
      advertencias.push(
        motivo(
          "REFERENCIA_ROTA",
          `evaluadores.${e.id}`,
          `El evaluador de regla ${e.id} no cubre ningún riesgo: sus fallas contarán como brechas no previstas.`,
          `Rule evaluator ${e.id} covers no risk: its failures will count as unforeseen gaps.`,
        ),
      );
  }

  // M-23: lo que lee cada condición existe. Una raíz que no es señal declarada ni clave del contexto es una
  // advertencia (al aprobar, un motivo: `aprobarPlan`); una función que el contexto no registra, un motivo.
  // Por ámbito (AU-S2-B54): una condición de caso lee señales y el contexto del caso; un detector de sesión, las
  // claves de la sesión. Antes se unían las tres listas y una condición de caso que leía `limites_alcanzados` pasaba
  // (en ejecución quedaba «indeterminado»). La métrica de un criterio también se valida.
  const conocidas: Record<"caso" | "sesion", Set<string>> = {
    caso: new Set<string>([...senales, ...Object.keys(VOCABULARIO), "todos"]),
    sesion: new Set<string>([...CLAVES_DE_SESION, "umbral"]),
  };
  const funcionesConocidas = new Set<string>(FUNCIONES_DE_CONDICION);
  type Condicion = [string, string | undefined, "caso" | "sesion"];
  const condiciones: Condicion[] = [
    ...plan.criterios_aceptacion.flatMap((c): Condicion[] => [
      [`${c.id}.poblacion`, c.regla_de_medicion.poblacion, "caso"],
      [`${c.id}.condicion`, c.regla_de_medicion.condicion ?? undefined, "caso"],
      [`${c.id}.metrica`, c.regla_de_medicion.metrica ?? undefined, "caso"],
    ]),
    ...plan.riesgos.flatMap((r): Condicion[] => {
      const d = r.detector_en_trazas;
      if (!d) return [];
      const ambito = d.ambito === "sesion" ? "sesion" : "caso";
      return [
        [`${r.id}.poblacion`, d.poblacion, ambito],
        [`${r.id}.condicion`, d.condicion, ambito],
      ];
    }),
    ...plan.supuestos.flatMap((s): Condicion[] =>
      s.medible_en_trazas
        ? [
            [`${s.id}.poblacion`, s.medible_en_trazas.poblacion, "caso"],
            [
              `${s.id}.condicion`,
              s.medible_en_trazas.condicion ?? undefined,
              "caso",
            ],
          ]
        : [],
    ),
  ];
  for (const [elemento, texto, ambito] of condiciones) {
    if (!texto) continue;
    let refs: { rutas: string[]; funciones: string[] };
    try {
      refs = referencias(parsear(texto));
    } catch {
      continue; // ya es CONDICION_NO_INTERPRETABLE
    }
    const raices = [...new Set(refs.rutas.map((r) => r.split(".")[0]!))];
    for (const raiz of raices.filter((x) => !conocidas[ambito].has(x)))
      advertencias.push(
        ambito === "sesion"
          ? motivo(
              "SENAL_NO_DECLARADA",
              elemento,
              `El detector es de sesión y lee «${raiz}», que no es una clave de la sesión (${CLAVES_DE_SESION.join(", ")}).`,
              `The detector is session-scoped and reads “${raiz}”, which is not a session key (${CLAVES_DE_SESION.join(", ")}).`,
            )
          : motivo(
              "SENAL_NO_DECLARADA",
              elemento,
              `La condición lee «${raiz}», que no está en senales_obligatorias_en_traza ni en el contexto del caso: el agente no tiene por qué registrarla.`,
              `The condition reads “${raiz}”, which is neither in senales_obligatorias_en_traza nor in the case context: the agent has no reason to record it.`,
            ),
      );
    for (const f of refs.funciones.filter((x) => !funcionesConocidas.has(x)))
      motivos.push(
        motivo(
          "REFERENCIA_ROTA",
          elemento,
          `La condición llama a «${f}», que el verificador no registra.`,
          `The condition calls “${f}”, which the verifier does not register.`,
        ),
      );
  }

  // Huella: un plan aprobado la lleva (su coincidencia la verifica `cargarPlan`, que es asíncrono).
  if (plan.estado_aprobacion === "aprobado" && plan.huella === null)
    motivos.push(
      motivo(
        "HUELLA_AUSENTE",
        "huella",
        "Un plan aprobado debe llevar huella.",
        "An approved plan must carry a fingerprint.",
      ),
    );

  if (motivos.length > 0) return { ok: false, motivos, advertencias };
  return { ok: true, plan, instrumentos, advertencias };
}
