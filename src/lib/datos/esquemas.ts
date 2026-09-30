/**
 * Esquemas de lo que la vitrina lee al compilar (ADR-008: datos en build, sin IndexedDB). El plan tiene su
 * esquema completo en `core/plan`; aquí viven el manifiesto de la vitrina, el entorno de una corrida y la
 * forma mínima del informe que las pantallas consumen (el informe entero lo tipa `core/brecha/informe`).
 */
import { z } from "zod";
import {
  AristaCondicionalSchema,
  PausaHumanaSchema,
} from "@core/plan/esquema";

const Huella = z.string().regex(/^[0-9a-f]{64}$/);
const RefCorrida = z.object({ ruta: z.string().min(1), huella: Huella });

export const ManifiestoVitrinaSchema = z.object({
  formato: z.literal("planlang-vitrina/v1"),
  nota: z.string().optional(),
  demos: z.record(
    z.string(),
    z.object({
      plan: z.object({ archivo: z.string().min(1), huella: Huella }),
      /** `sprint`: el sprint en que se construyó el agente y corrió el lote (lo dice la Entrada). */
      corrida: RefCorrida.extend({ sprint: z.number().int().positive() }),
      repeticiones: z.array(RefCorrida),
      linea_base: RefCorrida.nullable(),
      informe: z.object({ archivo: z.string().min(1), huella: Huella }),
      /**
       * El spike de la F1, dibujado frente al mismo contrato (P3): la copia fijada de su grafo exportado y la
       * lectura del autor (reglas, tipos y pausa, con la línea del código). Ambos por SHA-256 de sus bytes: la
       * copia no lleva huella propia.
       */
      spike: z
        .object({
          fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          grafo: z.object({
            archivo: z.string().min(1),
            sha256: Huella,
            origen: z.string().min(1),
          }),
          lectura: z.object({ archivo: z.string().min(1), sha256: Huella }),
        })
        .optional(),
    }),
  ),
});
export type ManifiestoVitrina = z.infer<typeof ManifiestoVitrinaSchema>;
export type DemoDelManifiesto = ManifiestoVitrina["demos"][string];

/** `runs/<demo>/<corrida>/entorno.json`: las versiones con que corrió el agente (las nombra la pila). */
export const EntornoCorridaSchema = z.object({
  claude_cli: z.string().min(1),
  paquetes: z
    .object({ langchain: z.string().min(1), langgraph: z.string().min(1) })
    .loose(),
  python: z.string().min(1),
  sistema: z.string().optional(),
});
export type EntornoCorrida = z.infer<typeof EntornoCorridaSchema>;

/** Forma mínima del informe: formato, verificador y las secciones que las pantallas leen. */
export const InformeMinimoSchema = z
  .object({
    formato: z.literal("planlang-informe/v1"),
    version_verificador: z.string().min(1),
    demo_id: z.string().min(1),
    corrida_id: z.string().min(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    veredicto: z
      .object({ valor: z.enum(["cumple", "cumple_con_alertas", "no_cumple"]) })
      .loose(),
    criterios: z.array(
      z.object({ id: z.string(), estado: z.string() }).loose(),
    ),
    riesgos: z.array(z.object({ id: z.string(), estado: z.string() }).loose()),
    supuestos: z.array(
      z.object({ id: z.string(), estado: z.string() }).loose(),
    ),
    brechas_no_previstas: z
      .object({ brechas: z.array(z.object({ categoria: z.string() }).loose()) })
      .loose(),
    contrato_de_grafo: z
      .object({
        nodos: z.array(
          z
            .object({ id: z.string(), tipo: z.string(), en_grafo: z.boolean() })
            .loose(),
        ),
        rf_09_2: z.array(
          z.object({ visitas: z.number(), discrepancias: z.number() }).loose(),
        ),
      })
      .loose(),
    ficha_reproducibilidad: z.object({}).loose(),
    huella: Huella,
  })
  .loose();

const BloqueDeCodigo = z
  .object({
    archivo: z.string().regex(/^agents\/src\/[\w/.-]+\.py$/),
    desde: z.number().int().positive(),
    hasta: z.number().int().positive(),
    codigo: z.string().min(1),
  })
  .strict();
export type BloqueDeCodigo = z.infer<typeof BloqueDeCodigo>;

/**
 * `data/vitrina/<demo>/grafo-codigo.json` (S2, `agents/src/app_agents/exportar_grafo.py`): por nodo, su función
 * con archivo y líneas y las claves del estado que escribe; más la clase del estado y la función de la arista.
 * Rutas relativas al repo, sin URL (regla 17). Frescura: `agents/tests/test_exportar_grafo.py`.
 */
export const GrafoCodigoSchema = z
  .object({
    formato: z.literal("planlang-grafo-codigo/v1"),
    demo_id: z.string().min(1),
    nodos: z.record(
      z.string(),
      BloqueDeCodigo.extend({ escribe: z.array(z.string().min(1)) }),
    ),
    ruta: BloqueDeCodigo,
    estado: BloqueDeCodigo,
    huella: Huella,
  })
  .strict();
export type GrafoCodigo = z.infer<typeof GrafoCodigoSchema>;

/** Lo que la vitrina lee del plan de beneficios sintético de la corrida (la ficha del agente cuenta sus reglas). */
export const PlanBeneficiosMinimoSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    procedimientos: z
      .array(
        z
          .object({
            codigo: z.string().min(1),
            estado: z.enum(["requiere_autorizacion", "excluido", "exento"]),
          })
          .loose(),
      )
      .min(1),
    huella: Huella,
  })
  .loose();
export type PlanBeneficiosMinimo = z.infer<typeof PlanBeneficiosMinimoSchema>;

/** El grafo exportado del spike: `get_graph().to_json()` tal cual (nodos y aristas de LangGraph). */
export const GrafoLangGraphSchema = z.object({
  nodes: z.array(z.object({ id: z.string().min(1) }).loose()),
  edges: z.array(
    z
      .object({
        source: z.string().min(1),
        target: z.string().min(1),
        conditional: z.boolean().optional(),
      })
      .loose(),
  ),
});

/** La lectura del autor del spike: lo que el grafo exportado no dice (tipos, reglas, ramas por defecto, pausa). */
export const LecturaSpikeSchema = z
  .object({
    formato: z.literal("planlang-lectura-spike/v1"),
    nota: z.string().min(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    modelo: z.string().min(1),
    tipos: z.record(z.string(), z.string()),
    aristas_condicionales: z.array(AristaCondicionalSchema),
    ramas_por_defecto: z.record(z.string(), z.string()),
    pausas_humanas: z.array(PausaHumanaSchema),
    citas: z.record(z.string(), z.string()),
  })
  .strict();
export type LecturaSpike = z.infer<typeof LecturaSpikeSchema>;
