/** Vistas sintéticas mínimas para probar criterios, detectores y supuestos sin exportar una corrida. */
import { readFileSync } from "node:fs";
import { contextoDesdeObjeto } from "../../core/brecha/condiciones";
import type { VistaDeCaso } from "../../core/brecha/contexto";
import type { JsonValor } from "../../core/formatos/jcs";
import type { Traza } from "../../core/formatos/traza";
import type {
  Criterio,
  ModoDeFalla,
  Plan,
  Supuesto,
} from "../../core/plan/esquema";
import type { Caso } from "../../core/sintetico/esquema";

export function vista(
  caso_id: string,
  obj: Record<string, JsonValor>,
  traza: Partial<Traza> = {},
  caso: Partial<Caso> = {},
): VistaDeCaso {
  return {
    caso_id,
    caso: {
      id: caso_id,
      tipo: "normal",
      subtipo: "normal_aprobable",
      adversario_detalle: null,
      ...caso,
    } as Caso,
    traza: {
      caso_id,
      senales: obj,
      pasos: [],
      pausas_humanas: [],
      ...traza,
    } as Traza,
    ctx: contextoDesdeObjeto({ todos: true, ...obj }),
  };
}

export const planV11 = (): Plan =>
  JSON.parse(readFileSync("plans/demo-a/v1.1.json", "utf8")) as Plan;

export const tb = (es: string) => ({ es, en: es });

export function criterio(
  id: string,
  regla: Criterio["regla_de_medicion"],
  extra: Partial<Criterio> = {},
): Criterio {
  return {
    id,
    enunciado: tb(id),
    tipo: "absoluto",
    regla_de_medicion: regla,
    valor_objetivo: true,
    origen: "usuario",
    ...extra,
  };
}

export function riesgo(
  id: string,
  detector: ModoDeFalla["detector_en_trazas"],
  extra: Partial<ModoDeFalla> = {},
): ModoDeFalla {
  return {
    id,
    modo: tb(id),
    efecto: tb("e"),
    causa: tb("c"),
    severidad: 5,
    ocurrencia: 4,
    deteccion: 3,
    mitigaciones: [],
    detector_en_trazas: detector,
    ...extra,
  };
}

export function supuesto(
  id: string,
  medible: Supuesto["medible_en_trazas"],
): Supuesto {
  return {
    id,
    enunciado: tb(id),
    criticidad: "media",
    prueba_barata: tb("p"),
    medible_en_trazas: medible,
    estado: "sin_probar",
  };
}
