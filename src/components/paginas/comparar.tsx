import type { Idioma } from "@core/formatos/bilingue";
import { ChipCaso } from "@/components/brecha/chip-caso";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { LeerComo } from "@/components/perfil/leer-como";
import { TablaF, type ColumnaF, type FilaF } from "@/components/tabla-f";
import { Veredicto, claseDeVeredicto } from "@/components/veredicto";
import { datosDemo } from "@/lib/datos/vitrina";
import { pieDeCorrida } from "@/lib/vista/caso";
import { vistaComparar, type VistaComparar } from "@/lib/vista/comparar";
import {
  AVISO,
  ETIQUETA,
  EXPERTO,
  LADOS as ROTULO_LADO,
  PAUSAS,
  PORTADA,
  SECCIONES,
} from "@/textos/comparar";
import { PERFIL } from "@/textos/comun";

type Lado = "multiagente" | "agente_unico";
const LADOS: readonly Lado[] = ["multiagente", "agente_unico"];

/**
 * «Comparar dos corridas» (S4, maqueta de FORMA «no vista»): la corrida multiagente y su línea base de agente único, criterio
 * por criterio, riesgo por riesgo y caso por caso. Primero la conclusión del líder; después la medida del experto. Los
 * casos que difieren enlazan a su página cuando la tienen (`ChipCaso`).
 */
export async function PaginaComparar({ idioma }: { idioma: Idioma }) {
  const d = await datosDemo("demo-a");
  const v = vistaComparar(d, idioma);
  return (
    <Marco
      idioma={idioma}
      pagina="comparar"
      demo="demo-a"
      corrida={pieDeCorrida(d, idioma)}
    >
      <div className={CONT}>
        <section aria-labelledby="c-t" className="pt-8 pb-6">
          <p className="text-chico text-tinta-2">
            {PORTADA.antetitulo[idioma]}
          </p>
          <h1 id="c-t" className="mt-2 text-titulo">
            {PORTADA.titulo[idioma]}
          </h1>
          <p className="mt-3 max-w-[72ch] text-texto leading-[1.6]">
            {PORTADA.intro[idioma]}
          </p>
          <div className="mt-4">
            <LeerComo
              rotulo={PERFIL.leerComo[idioma]}
              lider={PERFIL.lider[idioma]}
              experto={PERFIL.experto[idioma]}
            />
          </div>
        </section>

        {v ? (
          <Contenido v={v} idioma={idioma} />
        ) : (
          <p className="pb-10 text-texto">{AVISO.noPublicada[idioma]}</p>
        )}
      </div>
    </Marco>
  );
}

function Contenido({ v, idioma }: { v: VistaComparar; idioma: Idioma }) {
  const cols = (titulos: readonly string[], anchos: readonly string[]) =>
    titulos.map((titulo, k) => ({
      titulo,
      ancho: anchos[k] ?? "auto",
    })) as ColumnaF[];
  const etq = (x: { [k in Idioma]: string }) => x[idioma];

  const cabeceraLados = [
    ROTULO_LADO.multiagente[idioma],
    ROTULO_LADO.agente_unico[idioma],
  ];

  const filasMetricas: FilaF[] = v.metricas.map((m) => ({
    clave: m.etiqueta,
    celdas: [m.etiqueta, ...LADOS.map((l) => m.valores[l])],
  }));

  const filasCriterios: FilaF[] = v.criterios.map((k) => ({
    clave: k.id,
    celdas: [
      `${k.id} · ${k.enunciado}`,
      k.objetivo,
      ...LADOS.map((l) => `${k.celdas[l].estado} · ${k.celdas[l].valor}`),
    ],
  }));

  const filasRiesgos: FilaF[] = v.riesgos.map((r) => ({
    clave: r.id,
    celdas: [
      `${r.id} · ${r.modo}`,
      r.umbral,
      ...LADOS.map(
        (l) =>
          `${r.celdas[l].estado} · ${r.celdas[l].valor} (${r.celdas[l].marcados})`,
      ),
    ],
  }));

  const filasPausas: FilaF[] = v.pausas.map((p) => ({
    clave: p.etiqueta,
    celdas: [p.etiqueta, ...LADOS.map((l) => String(p.valores[l]))],
  }));

  const filasCasos: FilaF[] = v.casos.map((x) => ({
    clave: x.id,
    celdas: [
      <span key="id" className="font-mono">
        {x.id}
      </span>,
      `${x.verdad} · ${x.debeEscalar ? etq(ETIQUETA.debeEscalar) : etq(ETIQUETA.noDebeEscalar)}`,
      ...LADOS.map((l) => (
        <span key={l}>
          {x.celdas[l].decision} ·{" "}
          {x.celdas[l].pausa ? etq(ETIQUETA.si) : etq(ETIQUETA.no)}
        </span>
      )),
      <ChipCaso key="pagina" c={{ id: x.id, href: x.href }} idioma={idioma} />,
    ],
  }));

  return (
    <>
      <section
        aria-labelledby="s-veredicto-t"
        className="border-t border-linea py-8"
      >
        <h2 id="s-veredicto-t" className="text-seccion">
          {SECCIONES.veredicto[idioma]}
        </h2>
        <div className="mt-4 grid gap-3 escritorio:grid-cols-2">
          {LADOS.map((l, k) => (
            <div key={l} className="grid justify-items-start gap-2">
              <p className="text-chico text-tinta-2">{cabeceraLados[k]}</p>
              <Veredicto clase={claseDeVeredicto(v.veredictos[l].valor)}>
                {v.veredictos[l].texto}
              </Veredicto>
            </div>
          ))}
        </div>
        <p className="solo-lider mt-4 max-w-[72ch] text-texto leading-[1.6]">
          {v.textos.lider.veredicto}
        </p>
        <p className="solo-experto mt-4 max-w-[72ch] text-texto leading-[1.6]">
          {EXPERTO.veredicto[idioma]}
        </p>
        <p className="mt-3 max-w-[72ch] text-chico text-tinta-2">
          {v.textos.costo}
        </p>
        <div className="mt-6">
          <TablaF
            etiqueta={etq(ETIQUETA.medida)}
            columnas={cols(
              [etq(ETIQUETA.medida), ...cabeceraLados],
              ["minmax(0,1.6fr)", "minmax(0,1fr)", "minmax(0,1fr)"],
            )}
            filas={filasMetricas}
          />
        </div>
        <div className="mt-6">
          <TablaF
            etiqueta={etq(ETIQUETA.criterio)}
            columnas={cols(
              [etq(ETIQUETA.criterio), etq(ETIQUETA.objetivo), ...cabeceraLados],
              [
                "minmax(0,2fr)",
                "minmax(0,0.6fr)",
                "minmax(0,1fr)",
                "minmax(0,1fr)",
              ],
            )}
            filas={filasCriterios}
          />
        </div>
      </section>

      <section
        aria-labelledby="s-riesgos-t"
        className="border-t border-linea py-8"
      >
        <h2 id="s-riesgos-t" className="text-seccion">
          {SECCIONES.riesgos[idioma]}
        </h2>
        <p className="solo-lider mt-4 max-w-[72ch] text-texto leading-[1.6]">
          {v.textos.lider.riesgos}
        </p>
        <p className="solo-experto mt-4 max-w-[72ch] text-texto leading-[1.6]">
          {EXPERTO.riesgos[idioma]}
        </p>
        <div className="mt-6">
          <TablaF
            etiqueta={etq(ETIQUETA.riesgo)}
            columnas={cols(
              [etq(ETIQUETA.riesgo), etq(ETIQUETA.umbral), ...cabeceraLados],
              [
                "minmax(0,2fr)",
                "minmax(0,0.7fr)",
                "minmax(0,1fr)",
                "minmax(0,1fr)",
              ],
            )}
            filas={filasRiesgos}
          />
        </div>
        <div className="mt-6">
          <TablaF
            etiqueta={etq(PAUSAS.titulo)}
            columnas={cols(
              [etq(PAUSAS.titulo), ...cabeceraLados],
              ["minmax(0,2fr)", "minmax(0,1fr)", "minmax(0,1fr)"],
            )}
            filas={filasPausas}
          />
        </div>
      </section>

      <section
        aria-labelledby="s-casos-t"
        className="border-t border-linea py-8"
      >
        <h2 id="s-casos-t" className="text-seccion">
          {SECCIONES.casos[idioma]}
        </h2>
        <p className="mt-4 text-texto">
          {ETIQUETA.decision[idioma]} · {cabeceraLados[0]}:{" "}
          {v.decisiones.multiagente} · {cabeceraLados[1]}:{" "}
          {v.decisiones.agente_unico}
        </p>
        <p className="solo-lider mt-4 max-w-[72ch] text-texto leading-[1.6]">
          {v.textos.lider.casos}
        </p>
        <p className="solo-experto mt-4 max-w-[72ch] text-texto leading-[1.6]">
          {EXPERTO.casos[idioma]}
        </p>
        <p className="mt-3 max-w-[72ch] text-chico text-tinta-2">
          {v.textos.revisor}
        </p>
        <div className="mt-6">
          <TablaF
            etiqueta={etq(SECCIONES.casos)}
            columnas={cols(
              [
                etq(ETIQUETA.caso),
                etq(ETIQUETA.verdad),
                ...cabeceraLados,
                etq(ETIQUETA.pagina),
              ],
              [
                "minmax(0,0.8fr)",
                "minmax(0,1.2fr)",
                "minmax(0,1fr)",
                "minmax(0,1fr)",
                "minmax(0,1fr)",
              ],
            )}
            filas={filasCasos}
          />
        </div>
      </section>
    </>
  );
}
