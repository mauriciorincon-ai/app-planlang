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
import type { Operador, Plan } from "@core/plan/esquema";
import { prioridades, rpn } from "@core/plan";
import type { OrigenDeRespuestas, VersionDelPlan } from "@/lib/datos/planes";
import {
  CONTRATO,
  ETIQUETA,
  FICHA_SIN_CORRIDA,
  ORIGEN,
  RESPUESTAS,
  SECCIONES,
  TIPO_ACTOR,
  TIPO_NODO,
} from "@/textos/plan-sin-corrida";
import {
  CRITICIDAD,
  ESTADO_SUPUESTO,
  REVERSIBILIDAD,
} from "@/textos/plan-comun";
import { OPERADOR, SIMBOLO } from "@/textos/playground";
import { controlLegal, prioridad } from "./plan-comun";
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

/** Lo que el repo guarda además del plan (S6): de quién son las respuestas y qué versiones lo precedieron. */
export interface ContextoDelPlan {
  respuestas: OrigenDeRespuestas | null;
  anteriores: readonly VersionDelPlan[];
}

/** El contrato del grafo en detalle: lo que el agente por construir tendría que cumplir, ya en palabras. */
export interface ContratoDetalle {
  nodos: { id: string; tipo: string }[];
  aristas: {
    clave: string;
    desde: string;
    orden: number;
    condicion: string;
    hacia: string;
  }[];
  porDefecto: { desde: string; hacia: string }[];
  pausas: { nodo: string; quien: string; ve: string; politica: string }[];
  senales: string[];
}

export interface VistaSinCorrida {
  id: string;
  nombre: string;
  version: string;
  dominio: string;
  aprobacion: string | null;
  huella: string | null;
  /** De quién son las respuestas de la entrevista, dicho por el archivo que la entrevista usó. */
  respuestas: string;
  /** Cuándo corrió la entrevista (la fecha de su transcripción); `null` si el repo no la guarda. */
  entrevista: string | null;
  /** Las versiones anteriores que siguen en el repo, una línea cada una. */
  anteriores: string[];
  ficha: { etiqueta: string; nota: string; falta: string };
  problema: string;
  secciones: SeccionSinCorrida[];
  contrato: string[];
  contratoDetalle: ContratoDetalle;
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

/** Las respuestas en una frase: de quién son y, si las revisó, qué cambió. */
function frasePorRespuestas(o: OrigenDeRespuestas | null, i: Idioma): string {
  if (!o) return T(RESPUESTAS.sinRegistro, i);
  if (o.clase === "delegadas") return T(RESPUESTAS.delegadas, i);
  const r = o.revision;
  const base = T(RESPUESTAS.revisadas(r?.fecha ?? o.entrevista), i);
  const cambiadas = r?.cambiadas ?? [];
  return `${base} · ${
    cambiadas.length
      ? T(RESPUESTAS.cambiadas(cambiadas.join(", ")), i)
      : T(RESPUESTAS.sinCambios, i)
  }`;
}

/** Una versión anterior en una línea: versión · quién la aprobó y cuándo · de quién eran las respuestas · su huella. */
function lineaDeVersion(v: VersionDelPlan, i: Idioma): string {
  const aprobada =
    v.aprobado_por && v.aprobado_el
      ? ` · ${v.aprobado_por} ${T(ETIQUETA.el, i)} ${v.aprobado_el}`
      : "";
  const corta = RESPUESTAS.corta;
  const quien = T(
    !v.respuestas
      ? corta.sinRegistro
      : v.respuestas.clase === "delegadas"
        ? corta.delegadas
        : corta.revisadas,
    i,
  );
  return `v${v.version}${aprobada} · ${quien} · ${v.huella.slice(0, 8)}…`;
}

/**
 * La prioridad de acción de un riesgo (tabla AIAG-VDA del reusable) y su control legal, en palabras. Se calcula del
 * plan, no de una corrida: `prioridad` y `controlLegal` solo leen las prioridades y el control legal del riesgo.
 */
function prioridadDelRiesgo(r: Plan["riesgos"][number], i: Idioma): string {
  const p = prioridades(r);
  const ri = {
    estado: "sin_corrida",
    prioridad_de_accion: p.prioridad_de_accion,
    prioridad_de_tabla: p.prioridad_de_tabla,
    control_legal: p.control_legal,
    rpn: rpn(r),
  };
  const legal = controlLegal(ri, i);
  return `${T(ETIQUETA.prioridad, i)}: ${prioridad(ri, i).texto}${legal ? ` · ${legal}` : ""}`;
}

/** El valor de una arista en palabras: `umbral.U2` dice también el valor que el plan le dio. */
function valorDeArista(p: Plan, valor: string | number | boolean): string {
  const v = String(valor);
  const m = /^umbral\.(.+)$/.exec(v);
  const u = m ? p.umbrales.find((x) => x.id === m[1]) : undefined;
  return u ? `${v} (= ${String(u.valor_en_plan)})` : v;
}

/**
 * El operador que la arista evalúa de verdad: «menor que» o «mayor que» con `inclusivo` es «≤» o «≥» (así lo lee el
 * intérprete); en los demás la bandera no cambia nada. El símbolo ya dice todo: ni «inclusivo» ni una palabra al lado.
 */
function operadorEfectivo(operador: Operador, inclusivo: boolean): Operador {
  if (!inclusivo) return operador;
  if (operador === "menor_que") return "menor_o_igual_que";
  if (operador === "mayor_que") return "mayor_o_igual_que";
  return operador;
}

function contratoDetalle(p: Plan, i: Idioma): ContratoDetalle {
  const c = p.contrato_de_grafo;
  // En el orden del flujo: el de los nodos del plan, y dentro de cada nodo, el orden en que se evalúan sus aristas.
  const posicion = (id: string) =>
    c.nodos_esperados.findIndex((n) => n.id === id);
  const aristas = [...c.aristas_condicionales].sort(
    (a, b) => posicion(a.desde) - posicion(b.desde) || a.orden - b.orden,
  );
  return {
    nodos: c.nodos_esperados.map((n) => ({
      id: n.id,
      tipo: palabra(
        TIPO_NODO,
        n.tipo,
        "TIPO_NODO (src/textos/plan-sin-corrida.ts)",
        i,
      ),
    })),
    aristas: aristas.map((a) => ({
      clave: `${a.desde}-${a.orden}`,
      desde: a.desde,
      orden: a.orden,
      condicion:
        "funcion" in a
          ? `${T(CONTRATO.funcion, i)} ${a.funcion.nombre}(${a.funcion.entradas.join(", ")})`
          : `${a.senal} ${SIMBOLO[operadorEfectivo(a.operador, a.inclusivo)]} ${valorDeArista(p, a.valor)}`,
      hacia: a.si_verdadero,
    })),
    // Igual que las aristas: en el orden del flujo, no en el de las claves del objeto.
    porDefecto: Object.entries(c.ramas_por_defecto)
      .sort(([a], [b]) => posicion(a) - posicion(b))
      .map(([desde, hacia]) => ({ desde, hacia })),
    pausas: c.pausas_humanas.map((h) => {
      const rol = p.actores.find((a) => a.id === h.rol);
      return {
        nodo: h.nodo,
        quien: rol ? T({ es: rol.es, en: rol.en }, i) : h.rol,
        ve: h.payload_minimo.join(", "),
        politica: T(h.politica_simulada, i),
      };
    }),
    senales: [...c.senales_obligatorias_en_traza],
  };
}

export function vistaSinCorrida(
  p: Plan,
  i: Idioma,
  contexto: ContextoDelPlan = { respuestas: null, anteriores: [] },
): VistaSinCorrida {
  const c = p.contrato_de_grafo;
  // «1 pausa humana», no «1 pausas humanas»: la cuenta concuerda con su número.
  const cuenta = (n: number, uno: TextoBilingue, varios: TextoBilingue) =>
    `${n} ${T(n === 1 ? uno : varios, i)}`;
  const contrato = [
    cuenta(c.nodos_esperados.length, ETIQUETA.nodo, ETIQUETA.nodos),
    cuenta(c.aristas_condicionales.length, ETIQUETA.arista, ETIQUETA.aristas),
    cuenta(c.pausas_humanas.length, ETIQUETA.pausa, ETIQUETA.pausas),
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
    respuestas: frasePorRespuestas(contexto.respuestas, i),
    entrevista: contexto.respuestas?.entrevista ?? null,
    anteriores: contexto.anteriores.map((v) => lineaDeVersion(v, i)),
    ficha: {
      etiqueta: T(FICHA_SIN_CORRIDA.etiqueta, i),
      nota: T(FICHA_SIN_CORRIDA.nota, i),
      falta: T(FICHA_SIN_CORRIDA.falta, i),
    },
    problema: T(p.problema, i),
    contrato,
    contratoDetalle: contratoDetalle(p, i),
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
            prioridadDelRiesgo(r, i),
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
