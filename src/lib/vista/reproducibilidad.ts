/**
 * La ficha de reproducibilidad del demo: lo que hace falta para obtener otra vez el mismo informe, byte a byte. Se pinta
 * en la sección 9 de P4 Brecha y en la sección 1 de P7 Fichas; P7 suma el entorno de la corrida (versiones de Python, de
 * los paquetes y del CLI), como su maqueta. Todo sale del informe y del `entorno.json` de la corrida.
 */
import type { Idioma } from "@core/formatos/bilingue";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { TIPO_DE_CASO } from "@/textos/agente";
import { VARIANTE } from "@/textos/brecha";
import { APAGADO, ENCENDIDO } from "@/textos/plan-comun";
import { REPRODUCIBILIDAD as R } from "@/textos/reproducibilidad";
import type { Fila } from "./agente";
import { numeroDato } from "./formato";
import { delVocabulario } from "./vocabulario";

/** Dónde se pinta: cambian dos rótulos y P7 suma el entorno. */
export type DondeFicha = "brecha" | "fichas";

/** «2.1.282 (Claude Code)» → «2.1.282». */
const soloVersion = (s: string) => s.match(/\d+(\.\d+)+/)?.[0] ?? s;

export function filasDeReproducibilidad(
  d: DatosDemo,
  i: Idioma,
  donde: DondeFicha,
): Fila[] {
  const inf = d.informe;
  const f = inf.ficha_reproducibilidad;
  const umbralesTexto = Object.entries(f.umbrales_aplicados)
    .map(
      ([k, v]) =>
        `${k} ${typeof v === "boolean" ? (v ? ENCENDIDO : APAGADO)[i] : numeroDato(v, i)}`,
    )
    .join(" · ");
  const igualesAlPlan =
    JSON.stringify(f.umbrales_aplicados) ===
    JSON.stringify(f.umbrales_del_plan);
  const variante = delVocabulario(
    VARIANTE,
    f.corrida.variante,
    "VARIANTE (src/textos/brecha.ts)",
  )[i];
  const proveedor =
    f.corrida.proveedor === "suscripcion"
      ? R.suscripcion[i]
      : f.corrida.proveedor;
  const ent = d.entorno;
  const entorno = [
    `Python ${ent.python}`,
    ...Object.entries(ent.paquetes).map(([p, v]) => `${p} ${v}`),
    `Claude Code ${soloVersion(ent.claude_cli)}`,
    ent.sistema,
  ].join(" · ");
  return [
    {
      k: R.plan[i],
      v: `${f.plan.id} ${f.plan.version} · \`${f.plan.huella}\``,
    },
    ...(f.corrida.plan_de_ejecucion.huella !== f.plan.huella
      ? [
          {
            k: R.planConQueCorrio[i],
            v: `${f.plan.id} ${f.corrida.plan_de_ejecucion.version} · \`${f.corrida.plan_de_ejecucion.huella}\``,
          },
        ]
      : []),
    {
      k: R.casos[i],
      v: `${f.casos.id} · ${R.semilla[i]} ${f.casos.semilla} · n = ${f.casos.n_lote} · \`${f.casos.huella}\``,
    },
    {
      k: R.generador[i],
      v: R.generadorValor({
        receta: d.lote.receta,
        version: d.lote.version_generador,
        composicion: Object.entries(d.lote.composicion.por_tipo).map(
          ([tipo, n]) => ({
            tipo: delVocabulario(
              TIPO_DE_CASO,
              tipo,
              "TIPO_DE_CASO (src/textos/agente.ts)",
            ),
            n,
          }),
        ),
      })[i],
    },
    {
      k: R.corrida[i],
      v: `${f.corrida.id} · ${f.corrida.fecha} · ${proveedor} / ${f.corrida.modelo} · ${variante} · \`${f.corrida.huella}\``,
    },
    {
      k: (donde === "fichas" ? R.grafoCompilado : R.grafo)[i],
      v: `\`${f.corrida.version_grafo}\``,
    },
    ...f.repeticiones.map((r) => ({
      k: R.repeticion[i],
      v: `${r.corrida_id} · \`${r.huella}\``,
    })),
    ...(f.linea_base
      ? [
          {
            k: R.lineaBase[i],
            v: `${f.linea_base.corrida_id} · \`${f.linea_base.huella}\``,
          },
        ]
      : []),
    ...(donde === "fichas" ? [{ k: R.entorno[i], v: entorno }] : []),
    {
      k: R.ejecucion[i],
      v: R.ejecucionValor({
        sesiones: f.corrida.sesiones,
        casos: f.corrida.casos_ejecutados,
        errores: f.corrida.casos_con_error,
        limites: f.corrida.limites_alcanzados,
      })[i],
    },
    {
      k: R.umbrales[i],
      v: `${umbralesTexto} — ${(igualesAlPlan ? R.losDelPlan : R.distintosDelPlan)[i]}`,
    },
    { k: R.revision[i], v: f.revisor_simulado[i] },
    {
      k: R.verificador[i],
      v: `${f.verificador.version} · ${f.verificador.formato}`,
    },
    {
      k: (donde === "fichas" ? R.huellaDel : R.huellaEste)[i],
      v: `\`${inf.huella}\``,
    },
  ];
}
