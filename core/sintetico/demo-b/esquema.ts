/**
 * Esquemas del conjunto sintético del demo B «vinculación con debida diligencia» (spec § 6.8 y § 10.4, RF-04b.1):
 * las listas de control con sus reglas legibles, el caso con verdad conocida y el lote con huella.
 *
 * Las listas hacen para el B lo que el plan de beneficios hace para el A: son el «mundo» con que se deriva la
 * verdad conocida, y por eso el lote y la corrida las citan por huella. El plan B v1 aprobado no las nombra (se
 * aprobó antes de que existieran y no se re-aprueba por esto): las ata el lote.
 */
import { z } from "zod";
import { TextoBilingueSchema } from "../../formatos/bilingue-esquema";

const HEX64 = /^[0-9a-f]{64}$/;
export const DEMO_B = "demo-b";

export const CODIGO_JURISDICCION = /^SYN-J-\d{2}$/;
export const CODIGO_ACTIVIDAD = /^SYN-ACT-\d{2}$/;
export const DOCUMENTO_SINTETICO = /^SYN-ID-\d{6}$/;
/** S9: el NIT sintético de una persona jurídica. */
export const NIT_SINTETICO = /^SYN-NIT-\d{6}$/;
/** El documento de quien solicita: el de una persona o el NIT de una sociedad (S9). */
export const DOCUMENTO_O_NIT = /^SYN-(ID|NIT)-\d{6}$/;
export const NIVELES = ["bajo", "medio", "alto"] as const;
export type Nivel = (typeof NIVELES)[number];

const Regla = (patron: RegExp) =>
  z
    .object({ id: z.string().regex(patron), texto: TextoBilingueSchema })
    .strict();

export const EntradaListaSchema = z
  .object({
    id: z.string().regex(/^L[VC]-\d{2}-\d{3}$/),
    nombre: z.string().min(1),
    alias: z.array(z.string().min(1)),
    nacimiento: z.number().int().min(1900).max(2010),
    nacionalidad: z.string().regex(CODIGO_JURISDICCION),
    motivo: TextoBilingueSchema,
  })
  .strict();
export type EntradaLista = z.infer<typeof EntradaListaSchema>;

export const ListaSchema = z
  .object({
    id: z.string().regex(/^L[VC]-\d{2}$/),
    nombre: TextoBilingueSchema,
    vinculante: z.boolean(),
    version: z.string().min(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fuente_simulada: TextoBilingueSchema,
    entradas: z.array(EntradaListaSchema).min(1),
  })
  .strict()
  .refine((l) => l.entradas.every((e) => e.id.startsWith(`${l.id}-`)), {
    message: "cada entrada lleva el id de su lista",
  })
  .refine((l) => l.vinculante === l.id.startsWith("LV"), {
    message: "las listas vinculantes son LV y las de consulta LC",
  });
export type Lista = z.infer<typeof ListaSchema>;

export const ActividadSchema = z
  .object({
    codigo: z.string().regex(CODIGO_ACTIVIDAD),
    nombre: TextoBilingueSchema,
    riesgo: z.enum(NIVELES),
    ingreso_tipico: z
      .object({
        min: z.number().int().positive(),
        max: z.number().int().positive(),
      })
      .strict()
      .refine((r) => r.min < r.max, { message: "rango de ingreso vacío" }),
  })
  .strict();
export type Actividad = z.infer<typeof ActividadSchema>;

export const JurisdiccionSchema = z
  .object({
    codigo: z.string().regex(CODIGO_JURISDICCION),
    nombre: TextoBilingueSchema,
    riesgo: z.enum(NIVELES),
  })
  .strict();
export type Jurisdiccion = z.infer<typeof JurisdiccionSchema>;

const Pesos = <K extends string>(claves: readonly [K, ...K[]]) =>
  z
    .object(
      Object.fromEntries(
        claves.map((k) => [k, z.number().int().min(0)]),
      ) as Record<K, z.ZodNumber>,
    )
    .strict();

/** Puntos por factor del puntaje de riesgo (decisión D4 del plan B: 40 · 30 · 30, estimados). */
export const PesosPuntajeSchema = z
  .object({
    actividad: Pesos(["bajo", "medio", "alto", "sin_dato"]),
    jurisdiccion: Pesos(["bajo", "medio", "alto", "sin_dato"]),
    coherencia: Pesos(["coherente", "incoherente", "sin_dato"]),
  })
  .strict();
export type PesosPuntaje = z.infer<typeof PesosPuntajeSchema>;

export const ListasSchema = z
  .object({
    formato: z.literal("planlang-listas/v1"),
    id: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    demo_id: z.literal(DEMO_B),
    dominio_id: z.string().min(1),
    nombre: TextoBilingueSchema,
    aviso: TextoBilingueSchema,
    unidad_de_ingreso: TextoBilingueSchema,
    anio_de_referencia: z.number().int().min(2000).max(2100),
    listas: z.array(ListaSchema).min(2),
    actividades: z.array(ActividadSchema).min(1),
    jurisdicciones: z.array(JurisdiccionSchema).min(1),
    puntaje: PesosPuntajeSchema,
    reglas_coincidencia: z.array(Regla(/^RL-\d{2}$/)).min(1),
    reglas_inconsistencia: z.array(Regla(/^RI-\d{2}$/)).min(1),
    reglas_puntaje: z.array(Regla(/^RP-\d{2}$/)).min(1),
    reglas_propuesta: z.array(Regla(/^RD-\d{2}$/)).min(1),
    reglas_guardia: z.array(Regla(/^RG-\d{2}$/)).min(1),
    reglas_verdad: z.array(Regla(/^RV-\d{2}$/)).min(1),
    huella: z.string().regex(HEX64).nullable(),
  })
  .strict()
  .superRefine((m, ctx) => {
    const ids = m.listas.flatMap((l) => [l.id, ...l.entradas.map((e) => e.id)]);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "ids de lista o de entrada repetidos",
      });
    if (
      !m.listas.some((l) => l.vinculante) ||
      !m.listas.some((l) => !l.vinculante)
    )
      ctx.addIssue({
        code: "custom",
        message: "hace falta al menos una lista vinculante y una de consulta",
      });
    const jur = new Set(m.jurisdicciones.map((j) => j.codigo));
    for (const l of m.listas)
      for (const e of l.entradas)
        if (!jur.has(e.nacionalidad))
          ctx.addIssue({
            code: "custom",
            path: ["listas", e.id],
            message: `jurisdicción desconocida ${e.nacionalidad}`,
          });
    for (const k of NIVELES) {
      if (!m.actividades.some((a) => a.riesgo === k))
        ctx.addIssue({
          code: "custom",
          message: `ninguna actividad de riesgo ${k}`,
        });
      if (!m.jurisdicciones.some((j) => j.riesgo === k))
        ctx.addIssue({
          code: "custom",
          message: `ninguna jurisdicción de riesgo ${k}`,
        });
    }
  });
export type ListasB = z.infer<typeof ListasSchema>;

// ─── Caso ────────────────────────────────────────────────────────────────────────────────────

export const TIPOS_CASO_B = [
  "normal",
  "borde",
  "faltante",
  "adversario",
] as const;
export type TipoCasoB = (typeof TIPOS_CASO_B)[number];

/** Los subtipos de persona natural (S3). Solo ellos entran a los bloques estándar: sus lotes no cambian un byte. */
export const SUBTIPOS_NATURALES_B = [
  "normal_limpio",
  "normal_riesgo_alto",
  "normal_lista_vinculante",
  "normal_lista_consulta",
  "borde_puntaje_en_U2",
  "borde_titular_invertido",
  "borde_casi_zona_gris",
  "borde_ingresos_en_limite",
  "faltante_documento_fondos",
  "faltante_ingresos",
  "faltante_dato_identidad",
  "adversario_homonimo_zona_gris",
  "adversario_homonimo_identico",
  "adversario_transliteracion",
  "adversario_inyeccion",
  "adversario_documentos_contradictorios",
  "adversario_dato_sensible",
] as const;
export type SubtipoNaturalB = (typeof SUBTIPOS_NATURALES_B)[number];

/**
 * S9: los subtipos de persona jurídica, uno por cada estructura que el lote `planlang-b-002-20` necesita para medir C7
 * (plan B v1.2): directa, control sin propiedad, indirecta que cruza el 25 %, indirecta justo debajo, exactamente el
 * 25 % por dos caminos, un dueño homónimo de una persona sancionada, una cadena de cuatro niveles y una persona que
 * llega al 25 % solo sumando dos caminos.
 */
export const SUBTIPOS_JURIDICOS_B = [
  "normal_juridica_directa",
  "normal_juridica_control_no_dueno",
  "normal_juridica_cadena_profunda",
  "borde_juridica_indirecta_cruza_25",
  "borde_juridica_indirecta_bajo_25",
  "borde_juridica_exacta_25",
  "borde_juridica_dos_caminos",
  "adversario_juridica_beneficiario_homonimo",
] as const;
export type SubtipoJuridicoB = (typeof SUBTIPOS_JURIDICOS_B)[number];

export const SUBTIPOS_B = [
  ...SUBTIPOS_NATURALES_B,
  ...SUBTIPOS_JURIDICOS_B,
] as const;
export type SubtipoB = (typeof SUBTIPOS_B)[number];

export const DETALLES_ADVERSARIO_B = [
  "homonimo",
  "transliteracion",
  "inyeccion",
  "documentos_contradictorios",
  "dato_sensible",
] as const;
export const DECISIONES_B = ["aprobar", "rechazar"] as const;
export const CONCLUSIONES = ["misma_persona", "homonimo"] as const;
export const MOTIVOS_ESCALAMIENTO_B = [
  "coincidencia_en_lista",
  "puntaje_en_o_sobre_U2",
  "inconsistencias_sobre_U3",
  "propuesta_rechazar",
  "carga_en_documento",
] as const;

export const CamposBSchema = z
  .object({
    nombre: z.string().min(1).nullable(),
    documento: z.string().regex(DOCUMENTO_O_NIT).nullable(),
    nacimiento: z.number().int().min(1900).max(2010).nullable(),
    nacionalidad: z.string().regex(CODIGO_JURISDICCION).nullable(),
    actividad: z.string().regex(CODIGO_ACTIVIDAD).nullable(),
    ingresos_mensuales: z.number().int().positive().nullable(),
    jurisdiccion_fondos: z.string().regex(CODIGO_JURISDICCION).nullable(),
    titular_actividad: z.string().regex(DOCUMENTO_O_NIT).nullable(),
    titular_fondos: z.string().min(1).nullable(),
  })
  .strict();
export type CamposB = z.infer<typeof CamposBSchema>;
/** Orden fijo de los campos (el del esquema): lo usan la extracción, el expediente y el validador. */
export const CAMPOS_B = Object.keys(CamposBSchema.shape) as (keyof CamposB)[];

const Documento = TextoBilingueSchema;

/** S9: quién solicita. Los casos de persona natural de los lotes del S3 no traen el campo. */
export const TIPOS_SOLICITANTE = ["natural", "juridica"] as const;

/**
 * S9: quién controla una sociedad, del catálogo de la norma (31 CFR § 1010.230(d)(2)(i): «an executive officer or
 * senior manager»). El modelo elige de aquí; no inventa un cargo.
 */
export const ROLES_DE_CONTROL = [
  "representante_legal",
  "gerente_general",
  "presidente",
  "director_financiero",
  "socio_administrador",
] as const;

/** Un porcentaje escrito con dos decimales a lo sumo (lo lee `beneficiarios.ts` en centésimas exactas). */
const PORCENTAJE = /^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$/;

/**
 * S9: la estructura societaria de una persona jurídica. `entidad` es la sociedad que solicita (está en `entidades`);
 * cada participación dice qué parte de una sociedad tiene una persona u otra sociedad.
 */
export const EstructuraSchema = z
  .object({
    entidad: z.string().regex(NIT_SINTETICO),
    entidades: z
      .array(
        z
          .object({
            nit: z.string().regex(NIT_SINTETICO),
            nombre: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    personas: z.array(
      z
        .object({
          documento: z.string().regex(DOCUMENTO_SINTETICO),
          nombre: z.string().min(1),
        })
        .strict(),
    ),
    participaciones: z
      .array(
        z
          .object({
            titular: z.string().regex(DOCUMENTO_O_NIT),
            participada: z.string().regex(NIT_SINTETICO),
            porcentaje: z.string().regex(PORCENTAJE),
          })
          .strict(),
      )
      .min(1),
    controla: z
      .object({
        documento: z.string().regex(DOCUMENTO_SINTETICO),
        rol: z.enum(ROLES_DE_CONTROL),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type Estructura = z.infer<typeof EstructuraSchema>;

export const EntradaBSchema = z
  .object({
    solicitud: z
      .object({
        id: z.string().regex(/^SYN-SOL-\d{6}$/),
        producto: z.enum([
          "cuenta_de_ahorros",
          "cuenta_corriente",
          "credito_de_consumo",
        ]),
        tipo_solicitante: z.enum(TIPOS_SOLICITANTE).optional(),
      })
      .strict(),
    documentos: z
      .object({
        identidad: Documento,
        actividad: Documento,
        fondos: Documento.nullable(),
        /** S9: el certificado de existencia con la composición accionaria (solo personas jurídicas). */
        existencia: Documento.optional(),
      })
      .strict(),
  })
  .strict();
export type EntradaB = z.infer<typeof EntradaBSchema>;

export const VerdadBSchema = z
  .object({
    campos: CamposBSchema,
    decision: z.enum(DECISIONES_B),
    debe_escalar: z.boolean(),
    motivos_escalamiento: z.array(z.enum(MOTIVOS_ESCALAMIENTO_B)),
    en_lista: z.boolean(),
    en_lista_vinculante: z.boolean(),
    entrada_lista: z
      .string()
      .regex(/^L[VC]-\d{2}-\d{3}$/)
      .nullable(),
    similitud_max: z.number().min(0).max(1),
    conclusion_investigador: z.enum(CONCLUSIONES).nullable(),
    puntaje_riesgo: z.number().int().min(0).max(100),
    inconsistencias: z.number().int().min(0),
    reglas: z.array(z.string().regex(/^R[VDIP]-\d{2}$/)).min(1),
    /** S9, solo personas jurídicas: quién solicita, su estructura y sus beneficiarios finales (por documento). */
    tipo_solicitante: z.literal("juridica").optional(),
    estructura: EstructuraSchema.optional(),
    beneficiarios: z.array(z.string().regex(DOCUMENTO_SINTETICO)).optional(),
  })
  .strict()
  .refine(
    (v) =>
      (v.tipo_solicitante === undefined) === (v.estructura === undefined) &&
      (v.estructura === undefined) === (v.beneficiarios === undefined),
    { message: "una persona jurídica trae su estructura y sus beneficiarios" },
  )
  .refine((v) => !v.en_lista_vinculante || v.en_lista, {
    message: "quien está en una lista vinculante está en una lista",
  })
  .refine((v) => v.motivos_escalamiento.length > 0 === v.debe_escalar, {
    message: "debe_escalar sí y solo sí hay motivos",
  });
export type VerdadB = z.infer<typeof VerdadBSchema>;

export const CasoBSchema = z
  .object({
    id: z.string().regex(/^B[H]?-\d{3}$/),
    demo_id: z.literal(DEMO_B),
    tipo: z.enum(TIPOS_CASO_B),
    subtipo: z.enum(SUBTIPOS_B),
    adversario_detalle: z.enum(DETALLES_ADVERSARIO_B).nullable(),
    adversario: z
      .object({
        vector: z.enum(["identidad", "actividad", "fondos", "existencia"]),
        carga: TextoBilingueSchema,
        intenta: TextoBilingueSchema,
      })
      .strict()
      .nullable(),
    entrada: EntradaBSchema,
    verdad_conocida: VerdadBSchema,
    esperado: TextoBilingueSchema,
    identificadores_sinteticos: z.array(z.string().min(1)).min(1),
    simulacion: z
      .object({
        campos_extraidos: CamposBSchema,
        conclusion_investigador: z.enum(CONCLUSIONES),
        /** S9: la estructura que devolverá el proveedor simulado (solo personas jurídicas). */
        estructura_extraida: EstructuraSchema.optional(),
      })
      .strict(),
    semilla: z.string().min(1),
    version_generador: z.string().regex(/^\d+\.\d+\.\d+$/),
  })
  .strict()
  .refine(
    (c) => (c.tipo === "adversario") === (c.adversario_detalle !== null),
    {
      message: "solo los adversarios llevan adversario_detalle",
    },
  )
  .refine((c) => c.subtipo.startsWith(c.tipo), {
    message: "el subtipo pertenece a su tipo",
  });
export type CasoB = z.infer<typeof CasoBSchema>;

const Referencia = z
  .object({
    id: z.string(),
    version: z.string(),
    huella: z.string().regex(HEX64),
  })
  .strict();

export const ProporcionesBSchema = z
  .object({
    normal: z.number().int().min(0),
    borde: z.number().int().min(0),
    faltante: z.number().int().min(0),
    adversario: z.number().int().min(0),
  })
  .strict()
  .refine((p) => p.normal + p.borde + p.faltante + p.adversario === 100, {
    message: "las proporciones son porcentajes enteros que suman 100",
  });

export const LoteBSchema = z
  .object({
    formato: z.literal("planlang-casos/v1"),
    id: z.string().min(1),
    demo_id: z.literal(DEMO_B),
    semilla: z.string().min(1),
    receta: z.enum(["estandar", "humo", "juridicas"]),
    n: z.number().int().positive(),
    bloque: z.number().int().positive(),
    version_generador: z.string().regex(/^\d+\.\d+\.\d+$/),
    proporciones: ProporcionesBSchema.nullable(),
    composicion: z
      .object({
        por_tipo: z.record(z.string(), z.number().int()),
        por_subtipo: z.record(z.string(), z.number().int()),
      })
      .strict(),
    umbrales_de_referencia: z.record(z.string().regex(/^U\d+$/), z.number()),
    plan: Referencia,
    listas: Referencia,
    idioma_de_corrida: z.enum(["es", "en"]),
    politica_revisor: TextoBilingueSchema,
    afirmacion_privacidad: TextoBilingueSchema,
    casos: z.array(CasoBSchema),
    huella: z.string().regex(HEX64).nullable(),
  })
  .strict()
  .refine((l) => l.casos.length === l.n, {
    message: "n no coincide con los casos",
  })
  .refine((l) => new Set(l.casos.map((c) => c.id)).size === l.casos.length, {
    message: "ids de caso repetidos",
  });
export type LoteB = z.infer<typeof LoteBSchema>;
