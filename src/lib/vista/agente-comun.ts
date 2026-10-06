/**
 * Lo que P3 Agente comparte entre demos: el contexto de una corrida (sus trazas, sus pausas y el informe) y el perfil
 * que cada demo aporta al esqueleto de `agente.ts` (su ficha, la frase «En los N casos» de cada nodo, sus tablas de
 * trazas y la arista que se puede tocar). Pura: las mismas trazas dan el mismo contexto.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { Traza } from "@core/formatos/traza";
import type { AristaTripleta, Umbral } from "@core/plan/esquema";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { APAGADO, ENCENDIDO } from "@/textos/plan-comun";
import {
  MARCA_CORRIO,
  PANEL,
  UNIDADES,
  type TextosDeNodoVitrina,
} from "@/textos/agente";
import { decimal, entero, versionCorta } from "./formato";
import {
  categoriaDeRegla,
  reglaDeLaPausa,
  type CategoriaRegla,
} from "./motivo-pausa";
import { conPlan } from "./plan-en-texto";
import type { Campo, FilaTraza, Grupo, VistaAgente } from "./agente";

/** La rama que tomó cada visita a un nodo y la regla que la decidió (la primera que se cumplió, o ninguna). */
export function visitas(t: Traza, nodo: string) {
  const porPaso = new Map<number, Traza["decisiones_de_arista"]>();
  for (const d of t.decisiones_de_arista.filter((x) => x.desde === nodo))
    (porPaso.get(d.paso) ?? porPaso.set(d.paso, []).get(d.paso)!).push(d);
  return [...porPaso.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([paso, ds]) => {
      const regla = ds
        .filter((d) => d.resultado)
        .sort((a, b) => a.orden_arista - b.orden_arista)[0];
      return { paso, rama: ds[0]!.rama_tomada, regla };
    });
}

type Pausa = Traza["pausas_humanas"][number];

/** El valor de un umbral como lo lee una persona: decimales con coma en español, booleanos en palabras. */
export function valorDeUmbral(v: unknown, i: Idioma): string {
  if (typeof v === "boolean") return (v ? ENCENDIDO : APAGADO)[i];
  if (typeof v === "number")
    return Number.isInteger(v) ? entero(v, i) : decimal(v, 2, i);
  return String(v);
}

/** Lo que costó un nodo en un caso: segundos, tokens de salida y USD nominales. */
export function tiempoSalidaCosto(t: Traza, nodo: string, i: Idioma): string {
  const ps = t.pasos.filter((p) => p.nodo === nodo);
  const s = ps.reduce((a, p) => a + p.duracion_ms, 0) / 1000;
  const salida = ps.reduce((a, p) => a + p.tokens.salida, 0);
  const usd = ps.reduce((a, p) => a + p.costo_nominal_usd, 0);
  return `${decimal(s, 1, i)} s · ${entero(salida, i)} ${UNIDADES.deSalida[i]} · ${decimal(usd, 4, i)} USD`;
}

export const siNo = (b: boolean, i: Idioma) =>
  (b ? PANEL.trazas_.si : PANEL.trazas_.no)[i];

/** La corrida que pinta P3, ya leída: lo que el esqueleto y los dos perfiles cuentan. */
export interface ContextoAgente {
  i: Idioma;
  X: (t: TextoBilingue) => string;
  /** Un texto que cita el plan con `{plan:…}`, resuelto contra el plan publicado (AU-S2-3). */
  XP: (t: TextoBilingue) => string;
  trazas: readonly Traza[];
  n: number;
  /** La versión corta del plan con que corrió («v1.2»). */
  corrida: string;
  sprint: number;
  fecha: string;
  modelo: string;
  marca: string;
  criterio: (
    id: string,
  ) => DatosDemo["informe"]["criterios"][number] | undefined;
  cumple: (id: string) => boolean;
  /** El estado del criterio en el informe (cumple · incumple · incompleto). */
  estado: (id: string) => string | undefined;
  con: (nodo: string) => Traza[];
  pasosDe: (nodo: string) => Traza["pasos"];
  senal: (t: Traza, k: string) => unknown;
  pausas: ReadonlyArray<{ t: Traza; p: Pausa }>;
  /** La categoría de la regla que mandó una pausa a una persona (la arista que registra su motivo). */
  motivoDe: (t: Traza, p: Pausa) => CategoriaRegla;
}

export function contextoAgente(d: DatosDemo, i: Idioma): ContextoAgente {
  const trazas = d.corrida.trazas;
  const criterio = (id: string) => d.informe.criterios.find((c) => c.id === id);
  const corrida = versionCorta(d.corrida.manifiesto.plan.version);
  return {
    i,
    X: (t) => t[i],
    XP: (t) => conPlan(t[i], d.plan, i, d.id),
    trazas,
    n: trazas.length,
    corrida,
    sprint: d.manifiesto.corrida.sprint,
    fecha: d.corrida.manifiesto.fecha,
    modelo: d.corrida.manifiesto.modelo,
    marca: MARCA_CORRIO(corrida)[i],
    criterio,
    cumple: (id) => criterio(id)?.estado === "cumple",
    estado: (id) => criterio(id)?.estado,
    con: (nodo) => trazas.filter((t) => t.nodos_visitados.includes(nodo)),
    pasosDe: (nodo) =>
      trazas.flatMap((t) => t.pasos.filter((p) => p.nodo === nodo)),
    senal: (t, k) => t.senales[k],
    pausas: trazas.flatMap((t) => t.pausas_humanas.map((p) => ({ t, p }))),
    motivoDe: (t, p) =>
      categoriaDeRegla(
        reglaDeLaPausa(t.caso_id, p.payload.motivo, t.decisiones_de_arista),
        d.id,
      ),
  };
}

/** Lo que el plan de un nodo le exige, por sección (la lectura del autor que comprueba `copia-contra-plan`). */
export interface PlanDeNodo {
  decisiones: string[];
  riesgos: string[];
  supuestos: string[];
  criterios: string[];
  umbrales: string[];
  /** Umbrales cuya señal escribe el nodo (la marca «señal» de la matriz). */
  senal?: string[];
}

/** Lo que cada demo aporta al esqueleto de P3: su copia, sus cifras y sus tablas. */
export interface PerfilAgente {
  portadaTitulo: TextoBilingue;
  /** Los textos de cada nodo del contrato y dónde viven (para nombrar el diccionario si falta uno). */
  nodos: Readonly<Record<string, TextosDeNodoVitrina>>;
  dondeNodos: string;
  /** La frase «En los N casos» de un nodo, con sus cifras de la corrida. */
  enLaCorrida: (nodo: string) => TextoBilingue;
  /** Campos del panel del líder que solo tiene un nodo de este demo (van al final). */
  camposExtra: (nodo: string) => Campo[];
  trazasDeNodo: Readonly<
    Record<string, { columnas: TextoBilingue[]; detalle: TextoBilingue[] }>
  >;
  dondeTrazas: string;
  planPorNodo: Readonly<Record<string, PlanDeNodo>>;
  ficha: VistaAgente["ficha"];
  arquitectura: Grupo;
  regimen: TextoBilingue;
  /** Las celdas propias de la tabla de trazas de un nodo, la barra si la hay y el texto del caso. */
  filaTraza: (
    t: Traza,
    nodo: string,
  ) => Pick<FilaTraza, "celdas" | "pares" | "barra" | "solicitud">;
  tipoDeCaso: (id: string) => string;
  notaTrazas: (nodo: string) => string;
  /** La arista que se puede tocar en el lienzo: su umbral, su regla, el valor que lee y sus textos. */
  arista: {
    umbral: Umbral;
    regla: AristaTripleta;
    valor: (t: Traza) => number;
    titulo: string;
    rol: string;
    costo: string;
    enLaCorrida: (p: { n: number; de: number; casos: string }) => string;
    nota: (p: { n: number; otros: number; nodo: string }) => string;
    etiqueta: string;
  };
}
