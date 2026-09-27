/**
 * Esquemas Zod del plan (especificación § 6.1–6.7 con los cambios de la F1: E-4 prioridad de acción,
 * E-14 `inclusivo`, E-19 payload completo de la pausa; y las desviaciones registradas en el S1:
 * `orden` + `ramas_por_defecto` en las aristas, funciones nombradas para reglas que no caben en la
 * tripleta, `riesgos_cubiertos` en los evaluadores).
 *
 * Todo texto de producto es bilingüe `{ es, en }` (regla 20). Todos los objetos son `strict`: una
 * clave desconocida es un error, no un silencio.
 */
import { z } from "zod";
import { TextoBilingueSchema } from "../formatos/bilingue";

export const ID = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/, "id estable: letras, dígitos, _ y -");

// --------------------------------------------------------------------------- decisiones (§ 6.3)

export const REVERSIBILIDAD = ["una_via", "costosa", "dos_vias"] as const;
export const TIPO_DECISION = ["explicita", "implicita"] as const;
export const ESTADO_DECISION = ["abierta", "decidida", "superada"] as const;

export const OpcionSchema = z
  .object({
    nombre: z.string().min(1),
    pros: z.string().optional(),
    contras: z.string().optional(),
  })
  .strict();

export const DecisionSchema = z
  .object({
    id: ID,
    pregunta: TextoBilingueSchema,
    opciones: z.array(OpcionSchema).min(2),
    opcion_elegida: z.string().optional(),
    justificacion: TextoBilingueSchema.optional(),
    reversibilidad: z.enum(REVERSIBILIDAD),
    tipo: z.enum(TIPO_DECISION),
    estado: z.enum(ESTADO_DECISION),
    depende_de: z.array(ID).default([]),
    umbrales_asociados: z.array(ID).default([]),
    riesgos_asociados: z.array(ID).default([]),
  })
  .strict()
  .refine(
    (d) => d.estado !== "decidida" || (d.opcion_elegida && d.justificacion),
    {
      message: "una decisión «decidida» lleva opcion_elegida y justificacion",
    },
  );

// --------------------------------------------------------------------------- modos de falla (§ 6.4)

export const Escala = z.number().int().min(1).max(10);

export const MitigacionSchema = z
  .object({
    accion: z.string().min(1),
    momento: z.string().min(1),
    efecto_esperado: z.string().min(1),
  })
  .strict();

export const TIPO_DETECTOR = ["conteo", "tasa"] as const;

export const DetectorSchema = z
  .object({
    tipo: z.enum(TIPO_DETECTOR),
    poblacion: z.string().min(1),
    condicion: z.string().min(1),
    ocurre_si: z
      .string()
      .regex(
        /^(>|>=|<|<=|==)\s*-?[0-9]+(\.[0-9]+)?$/,
        "ocurre_si: operador y número, p. ej. «> 0»",
      ),
  })
  .strict();

export const ModoDeFallaSchema = z
  .object({
    id: ID,
    decision_id: ID.optional(),
    modo: TextoBilingueSchema,
    efecto: TextoBilingueSchema,
    causa: TextoBilingueSchema,
    severidad: Escala,
    ocurrencia: Escala,
    deteccion: Escala,
    mitigaciones: z.array(MitigacionSchema).default([]),
    detector_en_trazas: DetectorSchema.nullable(),
    no_detectable_en_trazas: z.string().min(1).optional(),
  })
  .strict();

// --------------------------------------------------------------------------- supuestos (§ 6.5)

export const CRITICIDAD = ["alta", "media", "baja"] as const;
export const ESTADO_SUPUESTO = [
  "sin_probar",
  "confirmado",
  "refutado",
] as const;

export const MedibleSchema = z
  .object({
    metricas: z.array(z.string().min(1)).min(1),
    poblacion: z.string().min(1),
    condicion: z.string().min(1).optional(),
    comparacion: z.string().min(1).optional(),
    umbral_confirmacion: z.record(z.string(), z.number()).optional(),
  })
  .strict();

export const SupuestoSchema = z
  .object({
    id: ID,
    enunciado: TextoBilingueSchema,
    criticidad: z.enum(CRITICIDAD),
    prueba_barata: TextoBilingueSchema,
    medible_en_trazas: MedibleSchema.optional(),
    estado: z.enum(ESTADO_SUPUESTO),
  })
  .strict();

// --------------------------------------------------------------------------- criterios (§ 6.6)

export const TIPO_CRITERIO = ["absoluto", "tasa", "latencia", "costo"] as const;
export const AGREGACION = [
  "todos_cumplen",
  "pass^k",
  "tasa",
  "mediana",
  "promedio",
  "maximo",
] as const;
export const ORIGEN = ["plantilla", "entrevistador", "usuario"] as const;

export const ReglaDeMedicionSchema = z
  .object({
    poblacion: z.string().min(1),
    condicion: z.string().min(1).optional(),
    metrica: z.string().min(1).optional(),
    agregacion: z.enum(AGREGACION),
    k: z.number().int().min(1).optional(),
    k_aplica_a: z.string().optional(),
  })
  .strict();

export const CriterioSchema = z
  .object({
    id: ID,
    enunciado: TextoBilingueSchema,
    tipo: z.enum(TIPO_CRITERIO),
    regla_de_medicion: ReglaDeMedicionSchema,
    valor_objetivo: z.union([z.number(), z.boolean()]),
    origen: z.enum(ORIGEN),
  })
  .strict();

// --------------------------------------------------------------------------- umbrales (§ 6.7 + E-14)

export const OPERADOR = [
  "igual_a",
  "distinto_de",
  "menor_que",
  "menor_o_igual_que",
  "mayor_que",
  "mayor_o_igual_que",
] as const;
export type Operador = (typeof OPERADOR)[number];

export const RangoJugableSchema = z.union([
  z
    .object({ min: z.number(), max: z.number(), paso: z.number().positive() })
    .strict(),
  z.object({ tipo: z.literal("booleano") }).strict(),
]);

export const UmbralSchema = z
  .object({
    id: ID,
    nombre: TextoBilingueSchema,
    descripcion_lider: TextoBilingueSchema,
    decision_id: ID,
    senal: z.string().min(1),
    operador: z.enum(OPERADOR),
    inclusivo: z.boolean(),
    valor_en_plan: z.union([z.number(), z.boolean()]),
    unidad: z.string().optional(),
    rango_jugable: RangoJugableSchema,
    consecuencia_si_verdadero: z.string().min(1),
    costo_humano_por_caso_min: z.number().nonnegative().optional(),
  })
  .strict();

// --------------------------------------------------------------------------- contrato de grafo (§ 6.2, RF-01.6)

export const TIPO_NODO = [
  "enrutador",
  "modelo",
  "regla",
  "pausa_humana",
  "herramienta",
] as const;

export const NodoEsperadoSchema = z
  .object({ id: ID, tipo: z.enum(TIPO_NODO) })
  .strict();

export const ValorAristaSchema = z.union([z.number(), z.boolean(), z.string()]);

/** Tripleta `señal · operador · valor · inclusivo` (regla dura 2). `valor` puede ser `umbral.Ux`. */
export const AristaTripletaSchema = z
  .object({
    desde: ID,
    orden: z.number().int().min(1),
    senal: z.string().min(1),
    operador: z.enum(OPERADOR),
    valor: ValorAristaSchema,
    inclusivo: z.boolean(),
    si_verdadero: ID,
    si_falso: ID.optional(),
  })
  .strict();

/** Regla que no cabe en la tripleta: función nombrada con sus entradas; el playground la marca «no observado». */
export const AristaFuncionSchema = z
  .object({
    desde: ID,
    orden: z.number().int().min(1),
    funcion: z
      .object({ nombre: ID, entradas: z.array(z.string().min(1)).min(1) })
      .strict(),
    si_verdadero: ID,
    si_falso: ID.optional(),
    nota: TextoBilingueSchema.optional(),
  })
  .strict();

export const AristaCondicionalSchema = z.union([
  AristaTripletaSchema,
  AristaFuncionSchema,
]);

export const PausaHumanaSchema = z
  .object({
    nodo: ID,
    rol: ID,
    payload_minimo: z.array(z.string().min(1)).min(1),
    politica_simulada: TextoBilingueSchema,
  })
  .strict();

export const TIPO_EVALUADOR = ["regla", "juez_modelo", "humano"] as const;

export const EvaluadorSchema = z
  .object({
    id: ID,
    tipo: z.enum(TIPO_EVALUADOR),
    modo: z.enum(["selectivo", "total"]).optional(),
    opcional_en_corte: z.boolean().optional(),
    riesgos_cubiertos: z.array(ID).default([]),
  })
  .strict();

export const LineaBaseSchema = z
  .object({
    agente_unico: z.boolean(),
    lote: z.string().min(1),
    mismo_presupuesto: z.boolean(),
  })
  .strict();

export const ContratoDeGrafoSchema = z
  .object({
    nodos_esperados: z.array(NodoEsperadoSchema).min(1),
    aristas_condicionales: z.array(AristaCondicionalSchema),
    ramas_por_defecto: z.record(ID, ID).default({}),
    pausas_humanas: z.array(PausaHumanaSchema),
    senales_obligatorias_en_traza: z.array(z.string().min(1)).min(1),
    evaluadores_requeridos: z.array(EvaluadorSchema),
    linea_base: LineaBaseSchema.optional(),
  })
  .strict();

// --------------------------------------------------------------------------- plan (§ 6.2)

export const ESTADO_APROBACION = ["borrador", "aprobado"] as const;
export const TIPO_ACTOR = ["humano", "sistema"] as const;

export const ActorSchema = z
  .object({
    id: ID,
    es: z.string().min(1),
    en: z.string().min(1),
    tipo: z.enum(TIPO_ACTOR),
    rol_en_pausa: z.boolean().optional(),
  })
  .strict();

export const LotesSchema = z
  .object({
    demo: z.number().int().positive(),
    completo: z.number().int().positive(),
    corridas_espaciadas_de: z.number().int().positive(),
    fuera_de_ci: z.literal(true),
    proveedor: z.string().min(1),
    modelo_alias: z.string().min(1),
  })
  .strict();

export const PlanBeneficiosSinteticoSchema = z
  .object({
    procedimientos: z.number().int().positive(),
    exentos_de_autorizacion: z.number().int().nonnegative(),
    exclusiones_con_causal: z.number().int().nonnegative(),
    tope_alto_costo: z.string().min(1),
  })
  .strict();

export const VERSION_SEMANTICA = /^[0-9]+\.[0-9]+\.[0-9]+$/;

export const PlanSchema = z
  .object({
    id: ID,
    nombre: TextoBilingueSchema,
    version: z.string().regex(VERSION_SEMANTICA, "versión semántica x.y.z"),
    dominio_id: ID,
    estado_aprobacion: z.enum(ESTADO_APROBACION),
    aprobado_por: z.string().optional(),
    aprobado_el: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    problema: TextoBilingueSchema,
    actores: z.array(ActorSchema).min(1),
    flujo_objetivo: z.array(TextoBilingueSchema).min(1),
    decisiones: z.array(DecisionSchema).min(1),
    riesgos: z.array(ModoDeFallaSchema).min(1),
    supuestos: z.array(SupuestoSchema),
    criterios_aceptacion: z.array(CriterioSchema).min(1),
    umbrales: z.array(UmbralSchema).min(1),
    contrato_de_grafo: ContratoDeGrafoSchema,
    lotes: LotesSchema,
    plan_beneficios_sintetico: PlanBeneficiosSinteticoSchema.optional(),
    etiqueta_riesgo: TextoBilingueSchema.optional(),
    huella: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .nullable(),
  })
  .strict();

export type Plan = z.infer<typeof PlanSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type ModoDeFalla = z.infer<typeof ModoDeFallaSchema>;
export type Supuesto = z.infer<typeof SupuestoSchema>;
export type Criterio = z.infer<typeof CriterioSchema>;
export type Umbral = z.infer<typeof UmbralSchema>;
export type ContratoDeGrafo = z.infer<typeof ContratoDeGrafoSchema>;
export type AristaCondicional = z.infer<typeof AristaCondicionalSchema>;
export type AristaTripleta = z.infer<typeof AristaTripletaSchema>;
export type AristaFuncion = z.infer<typeof AristaFuncionSchema>;
export type Evaluador = z.infer<typeof EvaluadorSchema>;
export type PausaHumana = z.infer<typeof PausaHumanaSchema>;

export function esAristaTripleta(a: AristaCondicional): a is AristaTripleta {
  return "senal" in a;
}

/** JSON Schema del plan (draft 2020-12), generado desde Zod; se versiona en `core/plan/plan.schema.json`. */
export function jsonSchemaDelPlan(): Record<string, unknown> {
  return z.toJSONSchema(PlanSchema, { target: "draft-2020-12" }) as Record<
    string,
    unknown
  >;
}

// --------------------------------------------------------------------------- plantilla de dominio (§ 6.1)

export const RestriccionRegulatoriaSchema = z
  .object({
    id: ID,
    jurisdiccion: z.string().min(1),
    norma: z.string().min(1),
    url: z.string().url().optional(),
    verificada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    vigencia: z.string().min(1),
    restriccion_llana: TextoBilingueSchema,
    criterio: TextoBilingueSchema,
    pausa: z.boolean(),
  })
  .strict();

export const PlantillaDominioSchema = z
  .object({
    id: ID,
    nombre: TextoBilingueSchema,
    version: z.string().regex(VERSION_SEMANTICA),
    etiqueta_riesgo: TextoBilingueSchema,
    actores_tipicos: z.array(ActorSchema).min(1),
    decisiones_tipicas: z.array(DecisionSchema).min(1),
    riesgos_tipicos: z.array(ModoDeFallaSchema).min(1),
    criterios_sugeridos: z.array(CriterioSchema).min(1),
    restricciones_regulatorias: z.array(RestriccionRegulatoriaSchema).min(1),
    preguntas_guia: z.array(TextoBilingueSchema).min(1),
    huella: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .nullable(),
  })
  .strict();

export type PlantillaDominio = z.infer<typeof PlantillaDominioSchema>;
