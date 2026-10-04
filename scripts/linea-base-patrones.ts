/**
 * M-17 (S3): la línea base de extracción por PATRONES que el ADR-001 declaraba «no medida» (deuda del S1, que el S2
 * pasó al S3). Es el extractor que cualquiera escribiría sin modelo: los nombres del catálogo del plan de beneficios
 * (gana la coincidencia más larga, por los homónimos), una expresión para el costo y una palabra clave para la
 * urgencia, sobre todo lo que el modelo lee (nota del médico, observaciones de la orden y las aclaraciones que el
 * médico entrega). Se compara campo a campo con la verdad conocida. No produce confianza: el plan mide la calibración
 * de la confianza (supuesto S1), y un patrón no la tiene.
 * Uso: `pnpm tsx scripts/linea-base-patrones.ts [lote.json…]`.
 */
import type { Caso, Lote, PlanBeneficios } from "../core/sintetico/esquema";
import { PlanBeneficiosSchema } from "../core/sintetico/esquema";
import { leerJson } from "./_io";

export interface ExtraccionPorPatrones {
  procedimiento: string | null;
  diagnostico: string | null;
  urgencia: boolean;
  costo_estimado: number | null;
}

const normalizar = (s: string): string =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** El código cuyo nombre aparece en el texto; si aparecen varios, el más largo (el homónimo exacto gana). */
function porNombre(
  texto: string,
  opciones: readonly { codigo: string; nombre: { es: string } }[],
): string | null {
  const hallados = opciones
    .filter((o) => texto.includes(normalizar(o.nombre.es)))
    .sort((a, b) => b.nombre.es.length - a.nombre.es.length);
  return hallados[0]?.codigo ?? null;
}

/** Lo que el extractor por patrones saca de UN caso: lee lo mismo que el modelo al final de sus aclaraciones. */
export function extraerPorPatrones(
  caso: Caso,
  pb: PlanBeneficios,
): ExtraccionPorPatrones {
  const e = caso.entrada;
  const texto = normalizar(
    [
      e.texto_medico.es,
      e.orden_adjunta.observaciones.es,
      ...e.aclaraciones_simuladas.map((a) => a.texto.es),
    ].join("\n"),
  );
  const costo = /costo[^\d\n]{0,25}(\d{2,5})/.exec(texto);
  return {
    procedimiento: porNombre(texto, pb.procedimientos),
    diagnostico: porNombre(texto, pb.diagnosticos),
    urgencia: /\burgencias?\b/.test(texto),
    costo_estimado: costo ? Number(costo[1]) : null,
  };
}

export const CAMPOS = [
  "procedimiento",
  "diagnostico",
  "urgencia",
  "costo_estimado",
] as const;

export interface MedidaLineaBase {
  lote: string;
  casos: number;
  /** Casos cuya verdad dice que los cuatro campos se pueden recuperar del texto (`presente`). */
  recuperables: number;
  /** Recuperables con los cuatro campos exactos. */
  exactos: number;
  /** Aciertos por campo sobre los recuperables. */
  por_campo: Record<(typeof CAMPOS)[number], number>;
  /** Casos de inyección en que el patrón marcó urgencia sin haberla (la instrucción escondida lo movió). */
  inyecciones_que_mueven_urgencia: string[];
}

export function medirLineaBase(
  lote: Lote,
  pb: PlanBeneficios,
): MedidaLineaBase {
  const recuperables = lote.casos.filter((c) => c.verdad_conocida.presente);
  const por_campo = {
    procedimiento: 0,
    diagnostico: 0,
    urgencia: 0,
    costo_estimado: 0,
  };
  let exactos = 0;
  for (const c of recuperables) {
    const x = extraerPorPatrones(c, pb);
    const v = c.verdad_conocida.campos;
    let todos = true;
    for (const k of CAMPOS) {
      if (x[k] === v[k]) por_campo[k] += 1;
      else todos = false;
    }
    if (todos) exactos += 1;
  }
  return {
    lote: lote.id,
    casos: lote.casos.length,
    recuperables: recuperables.length,
    exactos,
    por_campo,
    inyecciones_que_mueven_urgencia: lote.casos
      .filter(
        (c) =>
          c.adversario_detalle === "inyeccion" &&
          !c.verdad_conocida.urgencia &&
          extraerPorPatrones(c, pb).urgencia,
      )
      .map((c) => c.id),
  };
}

async function main(): Promise<number> {
  const rutas = process.argv.slice(2);
  const pb = PlanBeneficiosSchema.parse(
    leerJson("data/plan-beneficios/demo-a.json"),
  );
  for (const ruta of rutas.length
    ? rutas
    : [
        "data/casos/demo-a/planlang-a-001-20.json",
        "data/casos/demo-a/planlang-a-001-200.json",
      ]) {
    const m = medirLineaBase(leerJson(ruta) as unknown as Lote, pb);
    console.log(JSON.stringify(m));
  }
  return 0;
}

if (process.argv[1]?.endsWith("linea-base-patrones.ts"))
  main().then((c) => process.exit(c));
