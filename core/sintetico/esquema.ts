/**
 * Esquemas del conjunto sintético (spec § 6.8, M3): plan de beneficios legible, caso con verdad
 * conocida y lote con huella. Los lee el verificador de brecha (fase 4) y el demo en Python (fase 3)
 * los consume como JSON; el generador valida su propia salida contra estos esquemas.
 */
import { z } from "zod";
import { TextoBilingueSchema } from "../formatos/bilingue";

const HEX64 = /^[0-9a-f]{64}$/;
const CODIGO_PROCEDIMIENTO = /^SYN-P-\d{3}$/;
const CODIGO_DIAGNOSTICO = /^SYN-D-\d{2}$/;

export const CAUSALES = ["a", "b", "c", "d", "e", "f"] as const;
export const ESTADOS_PROCEDIMIENTO = [
  "requiere_autorizacion",
  "exento",
  "excluido",
] as const;

export const ProcedimientoSchema = z
  .object({
    codigo: z.string().regex(CODIGO_PROCEDIMIENTO),
    nombre: TextoBilingueSchema,
    categoria: z.string().min(1),
    costo: z.number().int().positive(),
    estado: z.enum(ESTADOS_PROCEDIMIENTO),
    diagnosticos_compatibles: z
      .array(z.string().regex(CODIGO_DIAGNOSTICO))
      .min(1),
    causal: z.enum(CAUSALES).nullable(),
    exento_motivo: TextoBilingueSchema.nullable(),
    homonimo_de: z.string().regex(CODIGO_PROCEDIMIENTO).nullable(),
  })
  .strict()
  .refine((p) => (p.estado === "excluido") === (p.causal !== null), {
    message: "un procedimiento excluido lleva causal, y solo él",
  })
  .refine((p) => (p.estado === "exento") === (p.exento_motivo !== null), {
    message: "un procedimiento exento lleva su motivo, y solo él",
  });
export type Procedimiento = z.infer<typeof ProcedimientoSchema>;

export const PlanBeneficiosSchema = z
  .object({
    formato: z.literal("planlang-plan-beneficios/v1"),
    id: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    demo_id: z.string().min(1),
    dominio_id: z.string().min(1),
    nombre: TextoBilingueSchema,
    aviso: TextoBilingueSchema,
    unidad_de_costo: TextoBilingueSchema,
    tope_alto_costo: z.string().regex(/^umbral\.U\d+$/),
    reglas: z
      .array(
        z
          .object({
            id: z.string().regex(/^RB-\d{2}$/),
            texto: TextoBilingueSchema,
          })
          .strict(),
      )
      .min(1),
    causales_de_exclusion: z
      .array(
        z
          .object({
            id: z.enum(CAUSALES),
            norma: z.string().min(5),
            resumen: TextoBilingueSchema,
          })
          .strict(),
      )
      .length(CAUSALES.length),
    diagnosticos: z
      .array(
        z
          .object({
            codigo: z.string().regex(CODIGO_DIAGNOSTICO),
            nombre: TextoBilingueSchema,
          })
          .strict(),
      )
      .min(1),
    procedimientos: z.array(ProcedimientoSchema).min(1),
    huella: z.string().regex(HEX64).nullable(),
  })
  .strict()
  .superRefine((pb, ctx) => {
    const diagnosticos = new Set(pb.diagnosticos.map((d) => d.codigo));
    const codigos = new Set(pb.procedimientos.map((p) => p.codigo));
    if (codigos.size !== pb.procedimientos.length)
      ctx.addIssue({
        code: "custom",
        message: "códigos de procedimiento repetidos",
      });
    if (diagnosticos.size !== pb.diagnosticos.length)
      ctx.addIssue({
        code: "custom",
        message: "códigos de diagnóstico repetidos",
      });
    for (const p of pb.procedimientos) {
      for (const d of p.diagnosticos_compatibles)
        if (!diagnosticos.has(d))
          ctx.addIssue({
            code: "custom",
            path: ["procedimientos", p.codigo],
            message: `diagnóstico desconocido ${d}`,
          });
      if (p.homonimo_de !== null && !codigos.has(p.homonimo_de))
        ctx.addIssue({
          code: "custom",
          path: ["procedimientos", p.codigo],
          message: `homónimo desconocido ${p.homonimo_de}`,
        });
    }
  });
export type PlanBeneficios = z.infer<typeof PlanBeneficiosSchema>;

export const TIPOS_CASO = [
  "normal",
  "borde",
  "faltante",
  "adversario",
] as const;
export type TipoCaso = (typeof TIPOS_CASO)[number];

export const SUBTIPOS = [
  "normal_aprobable",
  "normal_alto_costo",
  "normal_excluido",
  "normal_exento",
  "normal_urgencia",
  "borde_costo_igual_U2",
  "borde_contradiccion_orden_texto",
  "borde_urgencia_cobertura_dudosa",
  "borde_texto_ambiguo",
  "borde_empate_umbrales",
  "faltante_un_ciclo",
  "faltante_dos_ciclos",
  "faltante_tres_ciclos",
  "faltante_sin_respuesta",
  "adversario_inyeccion_texto_libre",
  "adversario_inyeccion_orden_adjunta",
  "adversario_dato_sensible",
  "adversario_homonimo",
] as const;
export type Subtipo = (typeof SUBTIPOS)[number];

export const DETALLES_ADVERSARIO = [
  "inyeccion",
  "dato_sensible",
  "homonimo",
] as const;
export const TIPOS_ATENCION = [
  "ambulatoria",
  "hospitalaria",
  "urgencia",
] as const;
export const DECISIONES = ["aprobar", "negar"] as const;
/** Campos que la aclaración puede completar (los demás vienen en la orden o en el texto). */
export const CAMPOS_ACLARABLES = ["diagnostico", "costo_estimado"] as const;
export const MOTIVOS_ESCALAMIENTO = [
  "costo_mayor_que_U2",
  "contradiccion_orden_texto",
  "propuesta_negar",
  "aclaracion_agotada",
] as const;

export const CamposSchema = z
  .object({
    procedimiento: z.string().regex(CODIGO_PROCEDIMIENTO).nullable(),
    diagnostico: z.string().regex(CODIGO_DIAGNOSTICO).nullable(),
    urgencia: z.boolean(),
    costo_estimado: z.number().int().positive().nullable(),
  })
  .strict();
export type Campos = z.infer<typeof CamposSchema>;

const IdentificadorSintetico = (prefijo: string) =>
  z.string().regex(new RegExp(`^SYN-${prefijo}-\\d+(-X)?$`));

export const EntradaSchema = z
  .object({
    afiliado: z
      .object({
        documento: IdentificadorSintetico("A"),
        nombre: z.string().min(1),
        edad: z.number().int().min(18).max(89),
        sexo: z.enum(["F", "M"]),
        telefono: z.string().regex(/^555-01\d{2}$/),
        correo: z.string().regex(/^[a-z0-9.]+@example\.com$/),
        historia_clinica: IdentificadorSintetico("HC"),
      })
      .strict(),
    prestador: z
      .object({ nombre: z.string().min(1), nit: IdentificadorSintetico("NIT") })
      .strict(),
    medico: z
      .object({
        nombre: z.string().min(1),
        registro: IdentificadorSintetico("RM"),
      })
      .strict(),
    orden_adjunta: z
      .object({
        tipo_atencion: z.enum(TIPOS_ATENCION),
        codigo_procedimiento: z.string().regex(CODIGO_PROCEDIMIENTO),
        observaciones: TextoBilingueSchema,
      })
      .strict(),
    texto_medico: TextoBilingueSchema,
    aclaraciones_simuladas: z.array(
      z
        .object({
          ciclo: z.number().int().positive(),
          aporta: z.array(z.enum(CAMPOS_ACLARABLES)),
          texto: TextoBilingueSchema,
        })
        .strict(),
    ),
  })
  .strict();

export const VerdadConocidaSchema = z
  .object({
    presente: z.boolean(),
    campos: CamposSchema,
    decision: z.enum(DECISIONES),
    debe_escalar: z.boolean(),
    motivos_escalamiento: z.array(z.enum(MOTIVOS_ESCALAMIENTO)),
    urgencia: z.boolean(),
    servicio_exento: z.boolean(),
    contradiccion_orden_texto: z.boolean(),
    causal: z.enum(CAUSALES).nullable(),
    ciclos_aclaracion_necesarios: z.number().int().min(0).nullable(),
  })
  .strict();
export type VerdadConocida = z.infer<typeof VerdadConocidaSchema>;

export const CasoSchema = z
  .object({
    id: z.string().regex(/^A[H]?-\d{3}$/),
    demo_id: z.literal("demo-a"),
    tipo: z.enum(TIPOS_CASO),
    subtipo: z.enum(SUBTIPOS),
    adversario_detalle: z.enum(DETALLES_ADVERSARIO).nullable(),
    adversario: z
      .object({
        vector: z.enum(["texto_libre", "orden_adjunta"]),
        carga: TextoBilingueSchema,
        intenta: TextoBilingueSchema,
      })
      .strict()
      .nullable(),
    entrada: EntradaSchema,
    verdad_conocida: VerdadConocidaSchema,
    esperado: TextoBilingueSchema,
    identificadores_sinteticos: z.array(z.string().min(1)).min(1),
    simulacion: z
      .object({
        confianza_extractor: z.number().min(0).max(1),
        campos_extraidos: CamposSchema,
        redactor_repite_identificador: z.boolean(),
        campos_ausentes_en_texto: z.array(z.enum(CAMPOS_ACLARABLES)),
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
export type Caso = z.infer<typeof CasoSchema>;

export const ProporcionesSchema = z
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
export type Proporciones = z.infer<typeof ProporcionesSchema>;

const Referencia = z
  .object({
    id: z.string(),
    version: z.string(),
    huella: z.string().regex(HEX64),
  })
  .strict();

export const LoteSchema = z
  .object({
    formato: z.literal("planlang-casos/v1"),
    id: z.string().min(1),
    demo_id: z.literal("demo-a"),
    semilla: z.string().min(1),
    receta: z.enum(["estandar", "humo"]),
    n: z.number().int().positive(),
    bloque: z.number().int().positive(),
    version_generador: z.string().regex(/^\d+\.\d+\.\d+$/),
    proporciones: ProporcionesSchema.nullable(),
    composicion: z
      .object({
        por_tipo: z.record(z.string(), z.number().int()),
        por_subtipo: z.record(z.string(), z.number().int()),
      })
      .strict(),
    umbrales_de_referencia: z
      .object({
        U1: z.number(),
        U2: z.number(),
        U3: z.number().int(),
        U4: z.boolean(),
      })
      .strict(),
    plan: Referencia,
    plan_beneficios: Referencia,
    idioma_de_corrida: z.enum(["es", "en"]),
    politica_aclaraciones: TextoBilingueSchema,
    afirmacion_privacidad: TextoBilingueSchema,
    casos: z.array(CasoSchema),
    huella: z.string().regex(HEX64).nullable(),
  })
  .strict()
  .refine((l) => l.casos.length === l.n, {
    message: "n no coincide con los casos",
  })
  .refine((l) => new Set(l.casos.map((c) => c.id)).size === l.casos.length, {
    message: "ids de caso repetidos",
  });
export type Lote = z.infer<typeof LoteSchema>;
