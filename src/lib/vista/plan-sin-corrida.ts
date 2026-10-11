/**
 * La vista de un plan sin corrida (S5): del plan aprobado a filas listas para pintar, en los dos idiomas. Pura: no
 * lee la corrida (no hay), no calcula nada que el plan no declare, y dice lo que falta. Cada elemento lleva quién lo
 * propuso (`plantilla` · `entrevistador` · `usuario`), que el código decide y el plan guarda.
 */
import {
  comoBilingue,
  type Idioma,
  type TextoBilingue,
  type TextoLibre,
} from "@core/formatos/bilingue";
import type { Plan } from "@core/plan/esquema";
import {
  ETIQUETA,
  FICHA_SIN_CORRIDA,
  ORIGEN,
  SECCIONES,
  TIPO_ACTOR,
} from "@/textos/plan-sin-corrida";
import {
  CRITICIDAD,
  ESTADO_SUPUESTO,
  REVERSIBILIDAD,
} from "@/textos/plan-comun";
import { OPERADOR, SIMBOLO } from "@/textos/playground";
import { delVocabulario } from "./vocabulario";

export type Origen = keyof Omit<typeof ORIGEN, "sinOrigen">;

export interface ElementoVista {
  id: string;
  titulo: string;
  detalle: string[];
  origen: string;
}

export interface SeccionSinCorrida {
  id: keyof typeof SECCIONES;
  titulo: string;
  elementos: ElementoVista[];
}

export interface VistaSinCorrida {
  id: string;
  nombre: string;
  version: string;
  dominio: string;
  aprobacion: string | null;
  huella: string | null;
  ficha: { etiqueta: string; nota: string; falta: string };
  problema: string;
  secciones: SeccionSinCorrida[];
  contrato: string[];
}

const T = (x: TextoBilingue, i: Idioma): string => x[i];
const L = (x: TextoLibre, i: Idioma): string => comoBilingue(x)[i];

/** Un valor del plan en palabras: el vocabulario de la vitrina, no el enum crudo (AU-S5 M-1). */
const palabra = (
  voc: Readonly<Record<string, TextoBilingue>>,
  valor: string,
  donde: string,
  i: Idioma,
): string => delVocabulario(voc, valor, donde)[i];

/** El origen en el idioma de la página; un elemento sin origen lo dice, no lo inventa. */
function origenDe(x: { origen?: Origen }, i: Idioma): string {
  return x.origen ? T(ORIGEN[x.origen], i) : T(ORIGEN.sinOrigen, i);
}

export function vistaSinCorrida(p: Plan, i: Idioma): VistaSinCorrida {
  const c = p.contrato_de_grafo;
  const contrato = [
    `${c.nodos_esperados.length} ${T(ETIQUETA.nodos, i)}`,
    `${c.aristas_condicionales.length} ${T(ETIQUETA.aristas, i)}`,
    `${c.pausas_humanas.length} ${T(ETIQUETA.pausas, i)}`,
  ];
  return {
    id: p.id,
    nombre: T(p.nombre, i),
    version: p.version,
    dominio: p.dominio_id,
    aprobacion:
      p.aprobado_por && p.aprobado_el
        ? `${p.aprobado_por} · ${T(ETIQUETA.el, i)} ${p.aprobado_el}`
        : null,
    huella: p.huella,
    ficha: {
      etiqueta: T(FICHA_SIN_CORRIDA.etiqueta, i),
      nota: T(FICHA_SIN_CORRIDA.nota, i),
      falta: T(FICHA_SIN_CORRIDA.falta, i),
    },
    problema: T(p.problema, i),
    contrato,
    secciones: [
      {
        id: "actores",
        titulo: T(SECCIONES.actores, i),
        elementos: p.actores.map((a) => ({
          id: a.id,
          titulo: T({ es: a.es, en: a.en }, i),
          detalle: [
            palabra(
              TIPO_ACTOR,
              a.tipo,
              "TIPO_ACTOR (src/textos/plan-sin-corrida.ts)",
              i,
            ),
          ],
          origen: origenDe(a, i),
        })),
      },
      {
        id: "decisiones",
        titulo: T(SECCIONES.decisiones, i),
        elementos: p.decisiones.map((d) => ({
          id: d.id,
          titulo: T(d.pregunta, i),
          detalle: [
            ...(d.opcion_elegida
              ? [`${T(ETIQUETA.elegida, i)}: ${L(d.opcion_elegida, i)}`]
              : []),
            ...(d.justificacion
              ? [`${T(ETIQUETA.razon, i)}: ${T(d.justificacion, i)}`]
              : []),
            `${T(ETIQUETA.reversibilidad, i)}: ${palabra(REVERSIBILIDAD, d.reversibilidad, "REVERSIBILIDAD (src/textos/plan-comun.ts)", i)}`,
          ],
          origen: origenDe(d, i),
        })),
      },
      {
        id: "riesgos",
        titulo: T(SECCIONES.riesgos, i),
        elementos: p.riesgos.map((r) => ({
          id: r.id,
          titulo: T(r.modo, i),
          detalle: [
            `${T(ETIQUETA.severidad, i)} ${r.severidad} · ${T(ETIQUETA.ocurrencia, i)} ${r.ocurrencia} · ${T(ETIQUETA.deteccion, i)} ${r.deteccion}`,
          ],
          origen: origenDe(r, i),
        })),
      },
      {
        id: "supuestos",
        titulo: T(SECCIONES.supuestos, i),
        elementos: p.supuestos.map((s) => ({
          id: s.id,
          titulo: T(s.enunciado, i),
          detalle: [
            `${palabra(CRITICIDAD, s.criticidad, "CRITICIDAD (src/textos/plan-comun.ts)", i)} · ${palabra(ESTADO_SUPUESTO, s.estado, "ESTADO_SUPUESTO (src/textos/plan-comun.ts)", i)}`,
          ],
          origen: origenDe(s, i),
        })),
      },
      {
        id: "criterios",
        titulo: T(SECCIONES.criterios, i),
        elementos: p.criterios_aceptacion.map((k) => ({
          id: k.id,
          titulo: T(k.enunciado, i),
          detalle: [
            `${T(ETIQUETA.objetivo, i)}: ${String(k.valor_objetivo)} · ${k.regla_de_medicion.agregacion}`,
            `${T(ETIQUETA.criterio, i)}: ${k.regla_de_medicion.condicion ?? k.regla_de_medicion.metrica ?? ""} · ${k.regla_de_medicion.poblacion}`,
          ],
          origen: origenDe(k, i),
        })),
      },
      {
        id: "umbrales",
        titulo: T(SECCIONES.umbrales, i),
        elementos: p.umbrales.map((u) => ({
          id: u.id,
          titulo: T(u.nombre, i),
          detalle: [
            `${u.senal} ${SIMBOLO[u.operador]} ${String(u.valor_en_plan)}${u.unidad ? ` ${L(u.unidad, i)}` : ""} (${palabra(OPERADOR, u.operador, "OPERADOR (src/textos/playground.ts)", i)})`,
          ],
          origen: origenDe(u, i),
        })),
      },
    ],
  };
}

export const ORIGENES_VISIBLES: readonly Origen[] = [
  "plantilla",
  "entrevistador",
  "usuario",
];

/** Una fila de la sección «Planes sin corrida» de la Entrada (S5). */
export interface FilaPlanSinCorrida {
  id: string;
  nombre: string;
  version: string;
  dominio: string;
  aprobacion: string;
}

export function filaDePlanSinCorrida(p: Plan, i: Idioma): FilaPlanSinCorrida {
  const v = vistaSinCorrida(p, i);
  return {
    id: v.id,
    nombre: v.nombre,
    version: v.version,
    dominio: v.dominio,
    aprobacion: v.aprobacion ?? "",
  };
}
