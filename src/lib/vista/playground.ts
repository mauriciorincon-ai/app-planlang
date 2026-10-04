/**
 * Vista de P5 Playground: arma en el build lo que no cambia (portada, recibe → hace → entrega, ficha técnica, el
 * ejemplo llano, los límites) y los datos de la isla de cliente: el compacto de la corrida (`core/playground`), los
 * umbrales del plan con su rango, las reglas de los criterios, las columnas de señales y la curva riesgo-cobertura del
 * informe. El cálculo al mover un umbral lo hace `core/playground/consecuencias.ts` en el navegador.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import { SENAL_DE_CONFIANZA } from "@core/brecha/contexto";
import {
  compactar,
  senalesQueLeenLasAristas,
} from "@core/playground/compactar";
import type { Compacto } from "@core/playground/compacto";
import { consecuencias, umbralesDelPlan } from "@core/playground/consecuencias";
import { esAristaTripleta } from "@core/plan/esquema";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { ruta } from "@/lib/ruta";
import { SUBTIPO } from "@/textos/caso";
import {
  CURVA,
  EJEMPLO,
  FICHA_TECNICA,
  FUNCION_NOMBRADA,
  INTERRUPTOR,
  IPO,
  LIMITES,
  PORQUE_FUNCION,
  PORTADA,
  SENAL,
  SIMBOLO,
} from "@/textos/playground";
import type { Fila } from "./agente";
import type { PuntoCurva } from "./brecha";
import { pieDeCorrida } from "./caso";
import { decimal, enumerar, versionCorta } from "./formato";

const X = (t: TextoBilingue, i: Idioma) => t[i];

export interface UmbralIsla {
  id: string;
  nombre: string;
  descripcion: string;
  senal: string;
  operador: string;
  inclusivo: boolean;
  valorPlan: number | boolean;
  rango: { min: number; max: number; paso: number } | null;
  /** Decimales con que se muestra el valor (los del paso del rango). */
  decimales: number;
}

export interface DatosIsla {
  idioma: Idioma;
  compacto: Compacto;
  umbrales: UmbralIsla[];
  criterios: { id: string; regla: string }[];
  casos: { id: string; tipo: string; href: string }[];
  /** Columnas de la tabla de las decisiones: las señales que leen las aristas de los nodos jugables. */
  columnas: { senal: string; nodo: string; titulo: string }[];
  /** Los nodos que deciden, en el orden del grafo del plan (el compacto los guarda en orden canónico). */
  nodosEnOrden: string[];
  curva: {
    puntos: PuntoCurva[];
    plan: number;
    n: number;
    umbral: string;
    /** La lectura de la curva en llano (con riesgo 0 en todo el rango dice que aún no puede mostrar el equilibrio). */
    lectura: string;
  } | null;
  version: string;
}

export interface VistaPlayground {
  portada: { antetitulo: string };
  recibeSub: string;
  recibe: { titulo: string; detalle: string }[];
  hace: string[];
  entrega: { titulo: string; detalle: string }[];
  ejemplo: string | null;
  ficha: Fila[];
  limites: string[];
  nucleoDetalle: string;
  isla: DatosIsla;
  pie: string;
}

function decimalesDe(paso: number): number {
  const s = String(paso);
  return s.includes(".") ? s.length - s.indexOf(".") - 1 : 0;
}

/**
 * El nombre llano de una señal. Una señal que decide en el grafo y no tiene nombre detiene el build nombrándola: la
 * vitrina no pone el código donde iba la palabra.
 */
function nombreLlano(s: string): TextoBilingue {
  const n = SENAL[s];
  if (!n)
    throw new Error(
      `vitrina: la señal «${s}» decide en el grafo y el playground no tiene su nombre llano (src/textos/playground.ts, SENAL).`,
    );
  return n;
}

/** El valor de un umbral como se lee en la vitrina (0,75 · 1000). */
export function valorUmbral(v: number, decimales: number, i: Idioma): string {
  return decimal(v, decimales, i);
}

/**
 * El ejemplo llano del líder, medido: el primer valor por encima del plan, en el primer umbral numérico, que cambia
 * algún caso de camino. Si ninguno lo hace, no hay ejemplo (no se inventa uno).
 */
function ejemplo(c: Compacto, d: DatosDemo, i: Idioma): string | null {
  const plan = umbralesDelPlan(c);
  for (const u of c.umbrales) {
    if (u.rango === "booleano" || typeof u.valor_en_plan !== "number") continue;
    const dec = decimalesDe(u.rango.paso);
    for (let k = 1; ; k++) {
      const v = Math.round((u.valor_en_plan + k * u.rango.paso) * 1e6) / 1e6;
      if (v > u.rango.max + 1e-9) break;
      const r = consecuencias(c, { ...plan, [u.id]: v });
      const solos = r.cambios.filter(
        (x) => x.antes === "solo" && x.ahora === "persona",
      );
      if (r.cambios.length === 0) continue;
      if (r.cambios.length !== 1 || solos.length !== 1) return null;
      const caso = solos[0]!;
      const valor = caso.senales[u.senal];
      const delPlan = d.plan.umbrales.find((x) => x.id === u.id);
      if (!delPlan || typeof valor !== "number") return null;
      return X(
        EJEMPLO.texto({
          umbral: u.id,
          nombre: delPlan.nombre,
          desde: valorUmbral(u.valor_en_plan, dec, i),
          hasta: valorUmbral(v, dec, i),
          caso: caso.id,
          senal: nombreLlano(u.senal),
          valor: valorUmbral(valor, dec, i),
          minutos: r.minutos - r.minutos_plan,
          errores: r.introducidos.length,
        }),
        i,
      );
    }
  }
  return null;
}

/** Los nodos con aristas condicionales, en el orden en que el plan declara el grafo. */
function nodosEnOrden(c: Compacto, d: DatosDemo): string[] {
  const orden = d.plan.contrato_de_grafo.nodos_esperados.map((n) => n.id);
  const pos = (n: string) => {
    const k = orden.indexOf(n);
    return k < 0 ? orden.length : k;
  };
  // `sort` es estable: los nodos que el plan no nombra quedan al final, en el orden canónico del compacto.
  return [...new Set(c.aristas.map((a) => a.desde))].sort(
    (a, b) => pos(a) - pos(b),
  );
}

/** La regla de un nodo escritor en una línea (orden de evaluación de la ficha técnica). */
function ordenDeEvaluacion(c: Compacto, nodos: string[]): string {
  return nodos
    .map((n) => {
      const reglas = c.aristas
        .filter((a) => a.desde === n)
        .sort((a, b) => a.orden - b.orden);
      // Cada nodo sale de una arista: tiene al menos una regla.
      const destino = reglas[0]!.si_verdadero;
      const conds = reglas.map((a) => {
        if (!esAristaTripleta(a))
          return `${a.funcion.nombre}(${a.funcion.entradas.join(", ")})`;
        const v =
          typeof a.valor === "string" && a.valor.startsWith("umbral.")
            ? a.valor.slice(7)
            : String(a.valor);
        return `${a.senal} ${SIMBOLO[a.operador]} ${v}`;
      });
      const mismoDestino = reglas.every((a) => a.si_verdadero === destino);
      return mismoDestino
        ? `${n} (${conds.join(" ∨ ")} → ${destino})`
        : `${n} (${reglas.map((a, k) => `${conds[k]} → ${a.si_verdadero}`).join("; ")})`;
    })
    .join(" · ");
}

export function vistaPlayground(d: DatosDemo, i: Idioma): VistaPlayground {
  const inf = d.informe;
  const c = compactar(d.plan, d.corrida, d.lote, inf, d.manifiesto.playground);
  // Toda señal que decide tiene su nombre llano antes de que la isla las pinte (la isla no adivina uno).
  for (const s of senalesQueLeenLasAristas(c.aristas)) nombreLlano(s);
  // Igual con las funciones nombradas y los interruptores: la isla no narra una con el texto de otra (AU-S2-1).
  for (const a of c.aristas)
    if (!esAristaTripleta(a) && !PORQUE_FUNCION[a.funcion.nombre])
      throw new Error(
        `playground: la función «${a.funcion.nombre}» del plan no tiene su «por qué» en PORQUE_FUNCION (src/textos/playground.ts).`,
      );
  for (const u of d.plan.umbrales)
    if (typeof u.valor_en_plan === "boolean" && !INTERRUPTOR[u.id])
      throw new Error(
        `playground: el umbral booleano ${u.id} no tiene sus textos en INTERRUPTOR (src/textos/playground.ts).`,
      );
  // Las decisiones de la corrida que el playground recalcula (la del compacto), buscada por su id y no por la
  // posición (C-6). Si el informe no trae su prueba cruzada, el compacto y el informe no son de la misma corrida.
  const deLaCorrida = inf.contrato_de_grafo.rf_09_2.find(
    (r) => r.corrida_id === c.corrida_id,
  );
  if (!deLaCorrida)
    throw new Error(
      `playground: el informe no trae la prueba cruzada RF-09.2 de la corrida que recalcula (${c.corrida_id})`,
    );
  const decisiones = deLaCorrida.visitas;
  const v = versionCorta(
    inf.ficha_reproducibilidad.corrida.plan_de_ejecucion.version,
  );
  const vPlan = versionCorta(inf.plan_en_breve.version);
  const ligadas = new Set(Object.keys(c.ligaduras));
  const columnas = c.nodos_jugables.flatMap((n) =>
    [
      ...new Set(
        c.aristas
          .filter((a) => a.desde === n)
          .flatMap((a) =>
            esAristaTripleta(a) ? [a.senal] : a.funcion.entradas,
          ),
      ),
    ]
      .filter((s) => !ligadas.has(s))
      .map((s) => ({
        senal: s,
        nodo: n,
        titulo: X(nombreLlano(s), i),
      })),
  );
  // Primero el nodo que más reglas tiene (el que más se mueve al jugar), como la maqueta.
  const reglasDe = (n: string) => c.aristas.filter((a) => a.desde === n).length;
  columnas.sort((a, b) => reglasDe(b.nodo) - reglasDe(a.nodo));
  const s1 = inf.supuestos.find((s) => s.curva && s.curva.length > 0);
  const u1 = d.plan.umbrales.find((u) => u.senal === SENAL_DE_CONFIANZA);
  const funciones = c.aristas
    .filter((a) => !esAristaTripleta(a))
    .map((a) => {
      const f = (a as { funcion: { nombre: string; entradas: string[] } })
        .funcion;
      const u = d.plan.umbrales.find((x) => f.entradas.includes(x.senal));
      const firma = `${f.nombre}(${f.entradas.join(", ")})`;
      return u ? X(FUNCION_NOMBRADA({ umbral: u.id, firma }), i) : firma;
    })
    .join("; ");
  const minutos = c.minutos_por_persona;
  const rf = inf.contrato_de_grafo.rf_09_2;
  const orden = nodosEnOrden(c, d);
  return {
    portada: {
      antetitulo: X(
        PORTADA.antetitulo({
          corrida: inf.corrida_id,
          casos: c.casos.length,
          decisiones,
        }),
        i,
      ),
    },
    recibeSub: X(IPO.recibeSub({ casos: c.casos.length, decisiones }), i),
    recibe: IPO.recibeItems({
      senales: enumerar([...new Set(columnas.map((x) => x.titulo))], i),
      casos: c.casos.length,
      umbrales: c.umbrales.length,
    }).map((x) => ({ titulo: X(x.titulo, i), detalle: X(x.detalle, i) })),
    hace: IPO.haceItems(minutos).map((t) => X(t, i)),
    entrega: IPO.entregaItems.map((x) => ({
      titulo: X(x.titulo, i),
      detalle: X(x.detalle, i),
    })),
    ejemplo: ejemplo(c, d, i),
    ficha: [
      {
        k: X(FICHA_TECNICA.entrada, i),
        v: X(
          FICHA_TECNICA.entradaValor({ n: c.casos.length, v, d: decisiones }),
          i,
        ),
      },
      {
        k: X(FICHA_TECNICA.regla, i),
        v: X(FICHA_TECNICA.reglaValor(funciones), i),
      },
      { k: X(FICHA_TECNICA.orden, i), v: ordenDeEvaluacion(c, orden) },
      {
        k: X(FICHA_TECNICA.cruzada, i),
        v: X(
          FICHA_TECNICA.cruzadaValor({
            dif: rf.reduce((n, r) => n + r.discrepancias, 0),
            d: rf.reduce((n, r) => n + r.visitas, 0),
            c: rf.length,
          }),
          i,
        ),
      },
      {
        k: X(FICHA_TECNICA.determinismo, i),
        v: X(FICHA_TECNICA.determinismoValor, i),
      },
      {
        k: X(FICHA_TECNICA.noObservado, i),
        v: X(FICHA_TECNICA.noObservadoValor, i),
      },
      {
        k: X(FICHA_TECNICA.carga, i),
        v: X(
          FICHA_TECNICA.cargaValor({
            m: minutos,
            n: c.umbrales.length,
            v: vPlan,
          }),
          i,
        ),
      },
      {
        k: X(FICHA_TECNICA.criterios, i),
        v: X(FICHA_TECNICA.criteriosValor(c.criterios.length), i),
      },
    ],
    limites: inf.playground.limites.map((l) => X(l, i)),
    nucleoDetalle: X(
      LIMITES.nucleoDetalle(rf.reduce((n, r) => n + r.visitas, 0)),
      i,
    ),
    isla: {
      idioma: i,
      compacto: c,
      umbrales: d.plan.umbrales.map((u) => ({
        id: u.id,
        nombre: X(u.nombre, i),
        descripcion: X(u.descripcion_lider, i),
        senal: u.senal,
        operador: u.operador,
        inclusivo: u.inclusivo,
        valorPlan: u.valor_en_plan,
        rango: "min" in u.rango_jugable ? { ...u.rango_jugable } : null,
        decimales:
          "min" in u.rango_jugable ? decimalesDe(u.rango_jugable.paso) : 0,
      })),
      criterios: d.plan.criterios_aceptacion.map((cr) => {
        const r = cr.regla_de_medicion;
        return {
          id: cr.id,
          regla: r.metrica
            ? `${r.agregacion}(${r.metrica})`
            : `${r.poblacion} ⇒ ${r.condicion ?? ""}`,
        };
      }),
      casos: c.casos.map((k) => ({
        id: k.id,
        tipo: X(SUBTIPO[k.subtipo] ?? { es: k.subtipo, en: k.subtipo }, i),
        href: ruta(i, "caso", k.id),
      })),
      columnas,
      nodosEnOrden: orden,
      curva:
        s1 && typeof u1?.valor_en_plan === "number"
          ? {
              puntos: s1.curva!.map((p) => ({ ...p })),
              plan: u1.valor_en_plan,
              n: s1.n,
              umbral: u1.id,
              lectura: s1.curva!.some((p) => (p.riesgo ?? 0) > 0)
                ? X(CURVA.lectura, i)
                : X(CURVA.lecturaSinRiesgo(s1.n), i),
            }
          : null,
      version: vPlan,
    },
    pie: pieDeCorrida(d, i),
  };
}
