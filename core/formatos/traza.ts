/**
 * `planlang-trace/v1` — el lado LECTOR del contrato Python → TypeScript (regla 19 del kit).
 *
 * Python (`agents/src/app_agents/exportador.py`) escribe con su serializador real; aquí cada archivo se
 * declara con Zod y el verificador lo lee validado. Los objetos de primer nivel son `strict`: una clave
 * que el exportador añada sin avisar rompe la lectura en CI, no pasa en silencio. El contenido libre
 * (cobertura, documento adverso, payload de la pausa) se valida en lo que el verificador usa.
 */
import { z } from "zod";
import { TextoBilingueSchema } from "./bilingue-esquema";
import {
  AristaCondicionalSchema,
  OPERADOR,
  PausaHumanaSchema,
} from "../plan/esquema";

export const FORMATO_TRAZA = "planlang-trace/v1";
export const FORMATO_GRAFO = "planlang-grafo/v1";
export const FORMATO_RAMAS = "planlang-ramas/v1";

const HEX64 = /^[0-9a-f]{64}$/;
const Huella = z.string().regex(HEX64);
const Json = z.json();

export const TIPOS_ERROR_PROVEEDOR = [
  "limite_de_uso",
  "timeout",
  "esquema_invalido",
  "otro",
] as const;
export const ErrorProveedorSchema = z.enum(TIPOS_ERROR_PROVEEDOR).nullable();

export const VARIANTES = ["multiagente", "agente_unico"] as const;
export type Variante = (typeof VARIANTES)[number];

export const PasoSchema = z
  .object({
    orden: z.number().int().min(1),
    nodo: z.string().min(1),
    tipo_nodo: z.string().nullable(),
    inicio_ms: z.number().int().min(0),
    duracion_ms: z.number().int().min(0),
    tokens: z
      .object({
        entrada: z.number().int().min(0),
        salida: z.number().int().min(0),
      })
      .strict(),
    costo_nominal_usd: z.number().min(0),
    error_proveedor: ErrorProveedorSchema,
    reintentos_esquema: z.number().int().min(0),
  })
  .strict();
export type Paso = z.infer<typeof PasoSchema>;

/** Un registro por arista evaluada: lo que vio el nodo escritor ANTES de enrutar (regla dura 3). */
export const DecisionDeAristaSchema = z
  .object({
    desde: z.string().min(1),
    orden_arista: z.number().int().min(1),
    paso: z.number().int().min(1),
    tipo: z.enum(["tripleta", "funcion"]),
    senal: z.string().nullable(),
    valor_observado: Json,
    operador: z.enum(OPERADOR).nullable(),
    valor_declarado: z.union([z.number(), z.boolean(), z.string()]).nullable(),
    umbral_aplicado: Json,
    inclusivo: z.boolean().nullable(),
    funcion: z.string().nullable(),
    entradas: z.record(z.string(), Json).nullable(),
    resultado: z.boolean(),
    rama_tomada: z.string().min(1),
  })
  .strict();
export type DecisionDeArista = z.infer<typeof DecisionDeAristaSchema>;

export const PausaRegistradaSchema = z
  .object({
    nodo: z.string().min(1),
    paso: z.number().int().min(1),
    rol: z.string().min(1),
    payload: z.record(z.string(), Json),
    respuesta_simulada: z
      .object({ decision: z.string().min(1), politica: z.string().min(1) })
      .strict(),
  })
  .strict();
export type PausaRegistrada = z.infer<typeof PausaRegistradaSchema>;

export const ExtraccionSchema = z
  .object({
    campos: z.record(z.string(), Json),
    campos_faltantes: z.array(z.string()),
    confianza: z.number().min(0).max(1),
    costo_estimado: z.number().nullable(),
    urgencia: z.boolean(),
  })
  .strict();

/** Demo B (S3): la extracción de los tres documentos de la solicitud. */
export const ExtraccionBSchema = z
  .object({
    campos: z.record(z.string(), Json),
    campos_faltantes: z.array(z.string()),
  })
  .strict();

const TextoBilingueTraza = z
  .object({ es: z.string(), en: z.string() })
  .strict();

/** Demo B: la mejor coincidencia con las listas y la versión y fecha de cada lista consultada (D3). */
export const CoincidenciasSchema = z
  .object({
    listas_consultadas: z.array(
      z
        .object({
          fecha: z.string(),
          id: z.string().min(1),
          version: z.string().min(1),
          vinculante: z.boolean(),
        })
        .strict(),
    ),
    mejor: z
      .object({
        entrada_id: z.string().min(1),
        exacta: z.boolean(),
        lista_id: z.string().min(1),
        nombre_listado: z.string().min(1),
        similitud: z.number().min(0).max(1),
        vinculante: z.boolean(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const InvestigacionSchema = z
  .object({
    conclusion: z.enum(["misma_persona", "homonimo"]),
    entrada_id: z.string().min(1),
    razones: TextoBilingueTraza,
  })
  .strict();

export const PuntajeTrazaSchema = z
  .object({
    total: z.number().int().min(0),
    componentes: z.array(
      z
        .object({
          factor: z.string().min(1),
          nivel: z.string().min(1),
          puntos: z.number().int().min(0),
          regla: z.string().min(1),
          valor: z.string().nullable(),
        })
        .strict(),
    ),
    inconsistencias: z.array(
      z.object({ campo: z.string().min(1), regla: z.string().min(1) }).strict(),
    ),
    reglas_propuesta: z.array(z.string().min(1)).min(1),
  })
  .strict();

/** El expediente que escribe el código (RF-04b.7): cada conclusión con su cita. */
export const ExpedienteSchema = z
  .object({
    caso_id: z.string().min(1),
    conclusiones: z.array(
      z
        .object({
          cita: z
            .object({ tipo: z.string().min(1), ref: z.string() })
            .catchall(Json)
            .nullable(),
          id: z.string().min(1),
          tema: z.string().min(1),
          texto: TextoBilingueTraza,
        })
        .strict(),
    ),
    conclusiones_sin_cita: z.number().int().min(0),
    datos_usados: z.array(z.string()),
    decision: z
      .object({
        final: z.string().min(1),
        propuesta: z.string().min(1),
        revisada_por_persona: z.boolean(),
        rol: z.string().nullable(),
      })
      .strict(),
    listas_consultadas: z.array(z.record(z.string(), Json)),
    plan: z.record(z.string(), Json),
    solicitud: z.string().min(1),
  })
  .strict();

export const SalidaFinalSchema = z
  .object({ es: z.string(), en: z.string(), aviso_ia: TextoBilingueSchema })
  .strict();

export const DocumentoAdversoSchema = z
  .object({ completo: z.boolean(), idiomas: z.array(z.string()) })
  .catchall(Json);

export const GuardiaSalidaSchema = z
  .object({
    acciones_ejecutadas: z.array(z.string()),
    acciones_intentadas: z.array(z.string()),
    carga_detectada_en_entrada: z.boolean(),
    hallazgos: z.array(Json),
    severidad_accion: z.number().int().min(0).max(3),
  })
  .strict();

export const TrazaSchema = z
  .object({
    formato: z.literal(FORMATO_TRAZA),
    corrida_id: z.string().min(1),
    caso_id: z.string().min(1),
    variante: z.enum(VARIANTES),
    resultado: z.enum(["completo", "error"]),
    pasos: z.array(PasoSchema),
    nodos_visitados: z.array(z.string()),
    senales: z.record(z.string(), Json),
    decisiones_de_arista: z.array(DecisionDeAristaSchema),
    pausas_humanas: z.array(PausaRegistradaSchema),
    extraccion: z.union([ExtraccionSchema, ExtraccionBSchema]).nullable(),
    aclaraciones: z.array(z.record(z.string(), Json)),
    cobertura: z.record(z.string(), Json).nullable(),
    salida_final: SalidaFinalSchema.nullable(),
    documento_adverso: DocumentoAdversoSchema.nullable(),
    guardia_salida: GuardiaSalidaSchema.nullable(),
    error_proveedor: ErrorProveedorSchema,
    error_de_esquema_en_traspaso: z.boolean(),
    // Demo B (S3): ausentes en las trazas del A.
    coincidencias: CoincidenciasSchema.nullable().optional(),
    investigacion: InvestigacionSchema.nullable().optional(),
    puntaje: PuntajeTrazaSchema.nullable().optional(),
    expediente: ExpedienteSchema.nullable().optional(),
    huella: Huella,
  })
  .strict();
export type Traza = z.infer<typeof TrazaSchema>;
export type ExtraccionA = z.infer<typeof ExtraccionSchema>;

/** La extracción del demo A (con su confianza), o `null` si la traza no extrajo o es de otro demo. */
export const extraccionA = (
  t: Pick<Traza, "extraccion">,
): ExtraccionA | null =>
  t.extraccion !== null && "confianza" in t.extraccion ? t.extraccion : null;

const Referencia = z
  .object({
    archivo: z.string().min(1),
    huella: Huella,
    id: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();

export const SesionSchema = z
  .object({
    numero: z.number().int().min(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    casos_ejecutados: z.array(z.string()),
    limites_alcanzados: z.number().int().min(0),
    detenida_por: z.string().nullable(),
  })
  .strict();

export const CorridaSchema = z
  .object({
    formato: z.literal(FORMATO_TRAZA),
    tipo: z.literal("corrida"),
    corrida_id: z.string().min(1),
    demo_id: z.string().min(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    variante: z.enum(VARIANTES),
    proveedor: z.string().min(1),
    modelo: z.string().min(1),
    plan: Referencia,
    /** El mundo con que se derivó la verdad del lote: el plan de beneficios del A o las listas del B. */
    plan_beneficios: Referencia.optional(),
    listas: Referencia.optional(),
    casos: z
      .object({
        archivo: z.string().min(1),
        huella: Huella,
        id: z.string().min(1),
        n_lote: z.number().int().min(1),
        semilla: z.string().min(1),
      })
      .strict(),
    umbrales_aplicados: z.record(
      z.string(),
      z.union([z.number(), z.boolean()]),
    ),
    version_grafo: Huella,
    ramas_esperadas: z
      .object({ archivo: z.string().min(1), huella: Huella })
      .strict(),
    casos_ejecutados: z.array(z.string()),
    casos_con_error: z.array(z.string()),
    sesiones: z.array(SesionSchema).min(1),
    trazas: z.array(
      z
        .object({
          archivo: z.string().min(1),
          caso_id: z.string().min(1),
          huella: Huella,
          resultado: z.enum(["completo", "error"]),
        })
        .strict(),
    ),
    ficha: z
      .object({
        nombre: TextoBilingueSchema,
        descripcion: TextoBilingueSchema,
        etiqueta: TextoBilingueSchema,
      })
      .strict(),
    revisor_simulado: TextoBilingueSchema,
    huella: Huella,
  })
  .strict()
  .refine(
    (c) => (c.plan_beneficios === undefined) !== (c.listas === undefined),
    {
      message:
        "la corrida cita un solo mundo: plan de beneficios (A) o listas (B)",
    },
  );
export type Corrida = z.infer<typeof CorridaSchema>;

export const GrafoSchema = z
  .object({
    formato: z.literal(FORMATO_GRAFO),
    demo_id: z.string().min(1),
    variante: z.enum(VARIANTES),
    nodos: z.array(
      z.object({ id: z.string().min(1), tipo: z.string().min(1) }).strict(),
    ),
    aristas_condicionales: z.array(AristaCondicionalSchema),
    ramas_por_defecto: z.record(z.string(), z.string()),
    pausas_humanas: z.array(PausaHumanaSchema),
    langgraph: z
      .object({ nodes: z.array(Json), edges: z.array(Json) })
      .catchall(Json),
    huella: Huella,
  })
  .strict();
export type Grafo = z.infer<typeof GrafoSchema>;

export const VisitaSchema = z
  .object({
    caso_id: z.string().min(1),
    desde: z.string().min(1),
    paso: z.number().int().min(1),
    rama_tomada: z.string().min(1),
    resultados: z.array(z.boolean()),
  })
  .strict();
export type Visita = z.infer<typeof VisitaSchema>;

export const RamasEsperadasSchema = z
  .object({
    formato: z.literal(FORMATO_RAMAS),
    corrida_id: z.string().min(1),
    fuente: z.string().min(1),
    umbrales_aplicados: z.record(
      z.string(),
      z.union([z.number(), z.boolean()]),
    ),
    visitas: z.array(VisitaSchema),
    huella: Huella,
  })
  .strict();
export type RamasEsperadas = z.infer<typeof RamasEsperadasSchema>;
