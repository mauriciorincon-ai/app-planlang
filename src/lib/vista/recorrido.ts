/**
 * La vista del recorrido animado de un caso (S10): el lienzo del agente que corrió (el MISMO dibujo de P3 Agente), el
 * recorrido del caso en la forma del contrato (validado con V5 y V12 dentro del mapa), las reglas CSS que según
 * `data-paso` marcan cada nodo, y por cada paso que decide el contrafactual de cada umbral que leen sus reglas,
 * calculado sobre el compacto del playground con su mismo código (P2): el enlace abre el playground con ese valor.
 */
import type { Idioma } from "@core/formatos/bilingue";
import type { Traza } from "@core/formatos/traza";
import { compactar } from "@core/playground/compactar";
import type { Compacto } from "@core/playground/compacto";
import {
  contrafactualesDelCaso,
  type ContrafactualDeUmbral,
} from "@core/playground/contrafactual";
import { cssDeRecorrido, recorridoDeCaso } from "@core/visor/recorrido-de-caso";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { ruta } from "@/lib/ruta";
import { APAGADO, ENCENDIDO } from "@/textos/plan-comun";
import { CAMINA, CONTRAFACTUAL } from "@/textos/recorrido";
import { entradaDelLienzo } from "./agente";
import { decimal, decimalesDelPaso } from "./formato";
import { dibujo, lienzoDeRecorrido, textosDelMapa, type Lienzo } from "./visor";

/** El espacio de nombres de los ids del SVG del recorrido y el id de su contenedor (el que lleva `data-paso`). */
export const NS_RECORRIDO = "recorrido";
export const CONTENEDOR_RECORRIDO = "camina";

export interface ContrafactualVista {
  umbral: string;
  texto: string;
  /** El playground con ese valor del umbral; `null` si no hay valor que cambie la rama. */
  enlace: string | null;
  probar: string | null;
}

export interface PasoDelRecorrido {
  /** 1…N: el valor de `data-paso`. */
  k: number;
  /** El `orden` del paso en la traza (el del paso del recorrido estático, `#paso-N`). */
  orden: number;
  nodo: string;
  nodoMapa: string;
  nombre: string;
  posicion: string;
  pausa: string | null;
  /** El nodo decide con reglas que no leen ningún umbral. */
  sinUmbral: string | null;
  contrafactuales: ContrafactualVista[];
}

export interface VistaRecorrido {
  contenedor: string;
  ns: string;
  lienzo: Pick<Lienzo, "svg" | "columnas">;
  css: string;
  /** La transición entre pasos: va en su propia hoja, con `media="(prefers-reduced-motion: no-preference)"` (G12). */
  movimiento: string;
  pasos: PasoDelRecorrido[];
}

const compactos = new Map<string, Compacto>();

/** El compacto del playground de la corrida del caso, uno por build (el mismo que viaja a la isla del playground). */
function compactoDe(d: DatosDemo): Compacto {
  const clave = `${d.id}:${d.manifiesto.corrida.huella}`;
  let c = compactos.get(clave);
  if (!c) {
    c = compactar(
      d.plan,
      d.corrida,
      d.lote,
      d.informe,
      d.manifiesto.playground,
      d.llegadas,
    );
    compactos.set(clave, c);
  }
  return c;
}

/** El valor de un umbral como lo pinta el playground: con los decimales de su paso, o encendido/apagado. */
function valorDe(
  v: number | boolean,
  rango: Compacto["umbrales"][number]["rango"],
  i: Idioma,
): string {
  if (typeof v === "boolean") return (v ? ENCENDIDO : APAGADO)[i];
  return decimal(v, rango === "booleano" ? 0 : decimalesDelPaso(rango.paso), i);
}

function contrafactualVista(
  d: DatosDemo,
  c: Compacto,
  u: ContrafactualDeUmbral,
  i: Idioma,
): ContrafactualVista {
  const rango = c.umbrales.find((x) => x.id === u.umbral)!.rango;
  const nombre = d.plan.umbrales.find((x) => x.id === u.umbral)?.nombre[i];
  if (!nombre)
    throw new Error(
      `recorrido: el umbral ${u.umbral} del compacto no está en el plan`,
    );
  const r = u.resultado;
  if (r.tipo === "cambia") {
    const valor = valorDe(r.valor, rango, i);
    return {
      umbral: u.umbral,
      texto: CONTRAFACTUAL.cambia({
        umbral: u.umbral,
        nombre,
        valor,
        plan: valorDe(u.plan, rango, i),
        rama: r.rama,
        desenlace: r.desenlace,
      })[i],
      enlace: `${ruta(i, "playground", undefined, d.id)}?u=${u.umbral}:${String(r.valor)}`,
      probar: CONTRAFACTUAL.probar({ umbral: u.umbral, valor })[i],
    };
  }
  return {
    umbral: u.umbral,
    texto:
      r.razon === "sin_valor"
        ? CONTRAFACTUAL.sinValor({ umbral: u.umbral, nombre })[i]
        : CONTRAFACTUAL.seSeparaAntes({
            umbral: u.umbral,
            valor: valorDe(r.valor, rango, i),
            paso: r.paso,
          })[i],
    enlace: null,
    probar: null,
  };
}

export function vistaRecorrido(
  d: DatosDemo,
  t: Traza,
  i: Idioma,
): VistaRecorrido {
  const { entrada, clave } = entradaDelLienzo(d);
  const { mapa } = dibujo(entrada, clave);
  const demo = d.corrida.manifiesto.ficha.nombre;
  const rec = recorridoDeCaso(
    t,
    textosDelMapa(mapa),
    CAMINA.svgTitulo({ caso: t.caso_id, demo: demo[i] }),
  );
  const lienzo = lienzoDeRecorrido(
    entrada,
    clave,
    i,
    {
      ns: NS_RECORRIDO,
      titulo: CAMINA.svgTitulo({ caso: t.caso_id, demo: demo[i] }),
      descripcion: CAMINA.svgDescripcion,
    },
    rec.recorrido,
  );
  const c = compactoDe(d);
  const porPaso = new Map(
    contrafactualesDelCaso(c, t.caso_id).map((v) => [v.paso, v] as const),
  );
  const nombreDe = new Map(mapa.nodos.map((n) => [n.id, n.nombre[i]]));
  const contenedor = `#${CONTENEDOR_RECORRIDO}`;
  return {
    contenedor: CONTENEDOR_RECORRIDO,
    ns: NS_RECORRIDO,
    lienzo,
    // El panel del paso se ve por el mismo atributo: un `<article>` por paso, uno visible a la vez.
    css: `${cssDeRecorrido(rec, NS_RECORRIDO, contenedor)}${contenedor} [data-panel] { display: none; }\n${rec.pasos
      .map(
        (p) =>
          `${contenedor}[data-paso="${p.n}"] [data-panel="${p.n}"] { display: grid; }`,
      )
      .join("\n")}\n`,
    movimiento: `${contenedor} svg[data-visor="${NS_RECORRIDO}"] .d-nodo, ${contenedor} svg[data-visor="${NS_RECORRIDO}"] .d-nodo .caja { transition: opacity 0.35s ease, stroke-width 0.35s ease, fill 0.35s ease; }\n`,
    pasos: rec.pasos.map((p): PasoDelRecorrido => {
      const v = porPaso.get(p.paso);
      // El compacto y la traza son de la misma corrida: una visita que decide en la traza está en el compacto.
      if (p.rama !== null && (!v || v.desde !== p.nodo || v.rama !== p.rama))
        throw new Error(
          `recorrido: el paso ${p.paso} de ${t.caso_id} no coincide con su visita en el compacto del playground`,
        );
      const nombre = nombreDe.get(p.nodo_mapa) ?? p.nodo;
      return {
        k: p.n,
        orden: p.paso,
        nodo: p.nodo,
        nodoMapa: p.nodo_mapa,
        nombre,
        posicion: CAMINA.posicion({
          k: p.n,
          n: rec.pasos.length,
          nodo: nombre,
        })[i],
        pausa: p.pausa
          ? CAMINA.pausa({ rol: p.pausa.rol, decision: p.pausa.decision })[i]
          : null,
        sinUmbral:
          v?.sin_umbral === "sin_umbral" ? CONTRAFACTUAL.sinUmbral[i] : null,
        contrafactuales: (v?.umbrales ?? []).map((u) =>
          contrafactualVista(d, c, u, i),
        ),
      };
    }),
  };
}
