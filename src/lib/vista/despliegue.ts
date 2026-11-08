/**
 * «Diseño de despliegue» (S10): del plan, el informe y las trazas de la corrida publicada a lo que pinta la página.
 * El diseño y las cifras salen de `core/despliegue`; aquí se le ponen los textos, se arma el mapa del diagramador con
 * la misma gramática del agente (sin tocar el contrato), se valida y se dibuja. El mapa no es el grafo de ninguna
 * corrida: no hay «diagrama = grafo» que exigir, y el único lienzo que se publica es el de los componentes.
 */
import { num, numCorto } from "@core/brecha/numeros";
import {
  disenoDeDespliegue,
  type DisenoDeDespliegue,
  type IdComponente,
} from "@core/despliegue/diseno";
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import { idDeMapa } from "@core/visor/ids";
import { geometria, type Geometria } from "@core/visor/geometria";
import {
  construirMapa,
  terminalesDelMapa,
  type TextosDeNodo,
} from "@core/visor/mapa";
import { aSvg } from "@core/visor/svg";
import {
  EXCEPCIONES_PLANLANG,
  erroresDe,
  validarMapa,
} from "@core/visor/validar";
import type { DatosDemo } from "@/lib/datos/vitrina";
import type { IdDemo } from "@/lib/demos";
import {
  AVISO,
  COMPONENTE,
  FUENTES,
  MADUREZ,
  MADUREZ_CAJA,
  MEDIDO,
  PLANO,
  PORTADA,
  RIESGOS,
} from "@/textos/despliegue";
import { GRAFO } from "@/textos/agente";
import { pieDeCorrida } from "./caso";
import { GRAMATICA, erroresDeEsquema } from "./visor";

/**
 * El componente que lleva el control de cada riesgo del plan, por demo. Es una lectura del autor sobre la mitigación
 * que declara el plan (`mitigaciones[].accion`); `[]` es «sin componente». `disenoDeDespliegue` falla si un riesgo del
 * plan no está aquí o si aquí hay uno que el plan no tiene.
 */
export const CONTROLES: Readonly<
  Record<IdDemo, Readonly<Record<string, readonly IdComponente[]>>>
> = {
  "demo-a": {
    R1: ["cola_humana"],
    R2: ["puerto_modelo", "guardia"],
    R3: ["guardia", "cola_humana"],
    R4: ["orquestador"],
    R5: ["puerto_modelo", "orquestador"],
    R6: ["guardia"],
    R7: ["orquestador", "trazas"],
    R8: ["puerto_modelo"],
    R9: ["puerto_modelo", "cola_humana"],
    R10: ["orquestador", "cola_humana"],
  },
  "demo-b": {
    R1: ["guardia", "cola_humana"],
    R2: ["cola_humana"],
    R3: ["guardia"],
    R4: ["guardia"],
  },
};

export interface FilaComponente {
  k: number;
  id: IdComponente;
  nombre: string;
  madurez: "implementado" | "en-construccion";
  madurezTexto: string;
  lider: string;
  experto: string;
  paraQue: string;
  /** Una línea para el texto equivalente del diagrama (G10). */
  equivalente: string;
}

export interface FilaRiesgo {
  id: string;
  modo: string;
  gravedad: string;
  legal: string | null;
  mitigaciones: string[];
  componentes: string[];
}

export interface VistaDespliegue {
  pie: string;
  antetitulo: string;
  rotulo: string;
  aviso: string;
  lienzo: { svg: string; columnas: Array<{ numero: string; x: number }> };
  componentes: FilaComponente[];
  medido: {
    casos: string;
    latencia: string[][];
    costo: string[] | null;
    capacidad: { lineas: string[] } | { noMedida: string };
  };
  riesgos: FilaRiesgo[];
}

const memo = new Map<string, { diseno: DisenoDeDespliegue; geo: Geometria }>();

const textosDeNodos = (
  diseno: DisenoDeDespliegue,
  fecha: string,
): Record<string, TextosDeNodo> =>
  Object.fromEntries(
    diseno.componentes.map((c) => {
      const t = COMPONENTE[c.id];
      return [
        c.id,
        {
          lider: t.lider,
          experto: t.experto,
          por_que_importa: t.paraQue,
          fuentes: [
            ...FUENTES[c.id],
            ...c.evidencia.map((e) => ({
              tipo: "codigo" as const,
              ruta: e.archivo,
              titulo: {
                es: "Código que lo respalda",
                en: "Code that backs it",
              },
              fecha,
            })),
          ],
        },
      ];
    }),
  );

function dibujar(d: DatosDemo): { diseno: DisenoDeDespliegue; geo: Geometria } {
  const clave = `${d.id}:${d.plan.huella}:${d.manifiesto.corrida.huella}`;
  const hecho = memo.get(clave);
  if (hecho) return hecho;
  const pausa = d.plan.contrato_de_grafo.pausas_humanas[0];
  const diseno = disenoDeDespliegue({
    riesgos: d.plan.riesgos,
    pausa: pausa
      ? {
          rol: pausa.rol,
          payload_minimo: pausa.payload_minimo,
          politica_simulada: pausa.politica_simulada,
        }
      : null,
    controles: CONTROLES[d.id],
    plazos: d.informe.plazos,
    trazas: d.corrida.trazas,
  });
  const fecha = d.corrida.manifiesto.fecha;
  const mapa = construirMapa({
    gramatica: GRAMATICA,
    grafo: diseno.grafo,
    contrato: diseno.contrato,
    textos: textosDeNodos(diseno, fecha),
    sujeto_id: `${d.id}-despliegue`,
    sujeto_nombre: d.corrida.manifiesto.ficha.nombre,
    version: d.corrida.manifiesto.plan.version,
    fecha,
  });
  const esquema = erroresDeEsquema(mapa);
  if (esquema.length)
    throw new Error(
      `vitrina: el diseño de despliegue no pasa el esquema del contrato: ${esquema.join(" · ")}`,
    );
  const errores = erroresDe(
    validarMapa(mapa, GRAMATICA, {
      cobertura: "letra",
      excepciones: EXCEPCIONES_PLANLANG,
    }),
  );
  if (errores.length)
    throw new Error(
      `vitrina: el diseño de despliegue no pasa la validación del contrato: ${errores.map((x) => `${x.regla} ${x.id} ${x.mensaje}`).join(" · ")}`,
    );
  const geo = geometria(mapa, GRAMATICA, {
    idiomas: GRAMATICA.idiomas,
    terminales: terminalesDelMapa(mapa),
    textosTerminales: GRAFO.terminales,
    // Lo que sigue a la etiqueta del tipo en la caja: el rol de la pausa y, en lo que aún no tiene código, que no lo tiene.
    detalleNodo: {
      ...Object.fromEntries(
        diseno.componentes
          .filter((c) => c.madurez === "en-construccion")
          .map((c) => [idDeMapa(c.id), MADUREZ_CAJA]),
      ),
      ...(pausa
        ? { [idDeMapa("cola_humana")]: { es: pausa.rol, en: pausa.rol } }
        : {}),
    },
  });
  if (geo.avisos.length)
    throw new Error(
      `vitrina: el diseño de despliegue no se dibuja sin encimar: ${geo.avisos.join(" · ")}`,
    );
  const r = { diseno, geo };
  memo.set(clave, r);
  return r;
}

const usd = (x: number, i: Idioma) => `US$ ${num(x, i, 4)}`;

export function vistaDespliegue(d: DatosDemo, i: Idioma): VistaDespliegue {
  const { diseno, geo } = dibujar(d);
  const X = (t: TextoBilingue) => t[i];
  const m = diseno.medidas;

  const componentes = diseno.componentes.map((c, n): FilaComponente => {
    const t = COMPONENTE[c.id];
    const madurezTexto = X(MADUREZ[c.madurez]);
    return {
      k: n + 1,
      id: c.id,
      nombre: X(t.nombre),
      madurez: c.madurez,
      madurezTexto,
      lider: X(t.lider),
      experto: X(t.experto),
      paraQue: X(t.paraQue),
      equivalente: X(
        PLANO.paso({
          k: n + 1,
          nombre: X(t.nombre),
          madurez: madurezTexto,
          lider: X(t.lider),
        }),
      ),
    };
  });

  const nombreDe = (id: IdComponente) => X(COMPONENTE[id].nombre);

  const cap = m.capacidad;
  const capacidad: VistaDespliegue["medido"]["capacidad"] = cap
    ? {
        lineas: [
          X(
            MEDIDO.capacidad.nominal({
              valor: numCorto(cap.valor, i),
              unidad: cap.unidad,
            }),
          ),
          cap.minima
            ? X(
                MEDIDO.capacidad.minima({
                  valor: numCorto(cap.minima.valor, i),
                  unidad: cap.unidad,
                  tardias:
                    cap.minima.tardias_con_una_menos === null
                      ? null
                      : numCorto(cap.minima.tardias_con_una_menos, i),
                }),
              )
            : X(MEDIDO.capacidad.sinMinima),
          X(
            MEDIDO.capacidad.carga({
              carga: numCorto(cap.carga_por_dia, i, 1),
              dias: numCorto(cap.dias_habiles, i),
              pausas: numCorto(cap.pausas, i),
            }),
          ),
          ...(cap.horas_de_auditor === null
            ? []
            : [
                X(
                  MEDIDO.capacidad.horas({
                    horas: numCorto(cap.horas_de_auditor, i, 1),
                  }),
                ),
              ]),
          X(MEDIDO.capacidad.personas),
        ],
      }
    : { noMedida: X(MEDIDO.capacidad.noMedida) };

  return {
    pie: pieDeCorrida(d, i),
    antetitulo: X(PORTADA.antetitulo),
    rotulo: X(AVISO.rotulo),
    aviso: X(AVISO.texto),
    lienzo: {
      svg: aSvg(geo, GRAMATICA, {
        idioma: i,
        ns: "despliegue",
        titulo: PLANO.tituloSvg,
        descripcion: PLANO.descripcionSvg,
        seleccionables: false,
      }),
      columnas: geo.bandas.map((b) => ({ numero: b.numero, x: b.x })),
    },
    componentes,
    medido: {
      casos: X(MEDIDO.casos({ n: numCorto(m.casos, i) })),
      latencia: m.latencia_por_nodo.map((l) => [
        l.nodo,
        numCorto(l.pasos, i),
        num(l.p50_ms / 1000, i, 2),
        num(l.max_ms / 1000, i, 2),
      ]),
      costo: m.costo_por_caso
        ? [
            usd(m.costo_por_caso.media_usd, i),
            usd(m.costo_por_caso.p50_usd, i),
            usd(m.costo_por_caso.max_usd, i),
          ]
        : null,
      capacidad,
    },
    riesgos: diseno.riesgos.map((r) => ({
      id: r.id,
      modo: X(r.modo),
      gravedad: X(RIESGOS.severidad({ n: r.severidad })),
      legal: r.control_legal ? X(RIESGOS.legal) : null,
      mitigaciones: r.mitigaciones.map(X),
      componentes: r.componentes.map(nombreDe),
    })),
  };
}
