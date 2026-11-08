import type { Idioma } from "@core/formatos/bilingue";
import { Lienzo } from "@/components/agente/lienzo";
import { SALTO } from "@/components/caso/recorrido";
import { Chip } from "@/components/chip";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { Seccion } from "@/components/seccion";
import { TablaF } from "@/components/tabla-f";
import { datosDemo } from "@/lib/datos/vitrina";
import type { IdDemo } from "@/lib/demos";
import { vistaDespliegue } from "@/lib/vista/despliegue";
import {
  MEDIDO,
  NO_DICE,
  PLANO,
  PORTADA,
  RIESGOS,
  SECCIONES,
} from "@/textos/despliegue";

/**
 * «Diseño de despliegue» (S10, FORMA y TEXTO «no vistos»): cómo correría el agente de un demo en producción, sin que
 * nada esté desplegado. Primero el plano de siete componentes (un lienzo generado por `core/visor` con su texto
 * equivalente, G10), después lo que la corrida publicada sí midió, el control de cada riesgo del plan en su componente
 * y lo que el diseño no dice. Ninguna cifra sin su fuente y ningún «no medido» disfrazado de número.
 */
export async function PaginaDespliegue({
  idioma,
  demo,
}: {
  idioma: Idioma;
  demo: IdDemo;
}) {
  const i = idioma;
  const v = vistaDespliegue(await datosDemo(demo), i);
  const texto = "despliegue-texto";
  return (
    <Marco idioma={i} pagina="despliegue" demo={demo} corrida={v.pie}>
      <div className={CONT}>
        <section aria-labelledby="d-t" className="pt-8 pb-7 escritorio:pt-14">
          <div className="escritorio:max-w-[calc(7/12*100%)]">
            <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-chico text-tinta-2">
              <Chip procedencia="maqueta">{v.rotulo}</Chip>
            </p>
            <h1 id="d-t" className="text-titulo text-balance">
              {PORTADA.titulo[i]}
            </h1>
            <p className="mt-4 max-w-guia text-guia text-tinta-2">
              {PORTADA.guia[i]}
            </p>
            <p className="mt-3 max-w-[72ch] text-chico text-tinta-2">
              {v.aviso}
            </p>
          </div>
        </section>

        <Seccion id="d-plano" titulo={SECCIONES.plano[i]}>
          <p className="mb-6 max-w-[72ch] text-texto">{PLANO.lectura[i]}</p>
          <a href={`#${texto}`} className={SALTO}>
            {PLANO.saltar[i]}
          </a>
          <Lienzo
            svg={v.lienzo.svg}
            columnas={v.lienzo.columnas}
            region={PLANO.region[i]}
            indice={PLANO.indice[i]}
            irACapa={PLANO.irACapa[i]}
            seleccionable={false}
          />
          <h3 id={texto} className="mt-8 mb-2 text-sub font-semibold">
            {PLANO.equivalente[i]}
          </h3>
          <ol data-equivalente className="grid list-none gap-0 p-0">
            {v.componentes.map((c) => (
              <li
                key={c.id}
                data-componente={c.id}
                data-madurez={c.madurez}
                className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3.5 border-t border-linea py-2.5 text-chico leading-[1.55]"
              >
                <span className="font-mono text-dato text-tinta-2">{c.k}</span>
                <span>
                  <strong className="font-semibold">{c.nombre}</strong>
                  {" · "}
                  <span className="text-tinta-2">{c.madurezTexto}</span>
                  <br />
                  {c.lider} {c.experto}
                  <br />
                  <span className="text-tinta-2">{c.paraQue}</span>
                </span>
              </li>
            ))}
          </ol>
        </Seccion>

        <Seccion id="d-medido" titulo={SECCIONES.medido[i]}>
          <p className="mb-2 max-w-[72ch] text-texto">{MEDIDO.lectura[i]}</p>
          <p className="mb-6 text-chico text-tinta-2">{v.medido.casos}</p>

          <h3 className="mb-2 text-sub font-semibold">
            {MEDIDO.latencia.titulo[i]}
          </h3>
          <TablaF
            etiqueta={MEDIDO.latencia.titulo[i]}
            columnas={MEDIDO.latencia.columnas.map((c, k) => ({
              titulo: c[i],
              ancho: k === 0 ? "minmax(0,2fr)" : "minmax(0,1fr)",
              mono: k > 0,
            }))}
            filas={v.medido.latencia.map((f) => ({
              clave: f[0] as string,
              celdas: f,
            }))}
          />
          <p className="mt-2 mb-8 max-w-[72ch] text-dato text-tinta-2">
            {MEDIDO.latencia.nota[i]}
          </p>

          <h3 className="mb-2 text-sub font-semibold">
            {MEDIDO.costo.titulo[i]}
          </h3>
          {v.medido.costo ? (
            <TablaF
              etiqueta={MEDIDO.costo.titulo[i]}
              columnas={MEDIDO.costo.columnas.map((c) => ({
                titulo: c[i],
                ancho: "minmax(0,1fr)",
                mono: true,
              }))}
              filas={[{ clave: "costo", celdas: v.medido.costo }]}
            />
          ) : (
            <p className="text-chico">{MEDIDO.noMedido[i]}</p>
          )}
          <p className="mt-2 mb-8 max-w-[72ch] text-dato text-tinta-2">
            {MEDIDO.costo.nota[i]}
          </p>

          <h3 className="mb-2 text-sub font-semibold">
            {MEDIDO.capacidad.titulo[i]}
          </h3>
          {"lineas" in v.medido.capacidad ? (
            <ul className="grid max-w-[72ch] gap-2 text-chico leading-relaxed">
              {v.medido.capacidad.lineas.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          ) : (
            <p
              data-no-medido="capacidad"
              className="max-w-[72ch] text-chico leading-relaxed"
            >
              {v.medido.capacidad.noMedida}
            </p>
          )}
        </Seccion>

        <Seccion id="d-riesgos" titulo={SECCIONES.riesgos[i]}>
          <p className="mb-6 max-w-[72ch] text-texto">{RIESGOS.lectura[i]}</p>
          <TablaF
            etiqueta={SECCIONES.riesgos[i]}
            columnas={[
              { titulo: RIESGOS.columnas[0]![i], ancho: "minmax(0,2fr)" },
              { titulo: RIESGOS.columnas[1]![i], ancho: "minmax(0,3fr)" },
              { titulo: RIESGOS.columnas[2]![i], ancho: "minmax(0,2fr)" },
            ]}
            filas={v.riesgos.map((r) => ({
              clave: r.id,
              atributos: { "data-riesgo": r.id },
              celdas: [
                <span key="r">
                  <span className="font-mono text-dato">{r.id}</span> {r.modo}
                  <br />
                  <span className="text-dato text-tinta-2">
                    {r.gravedad}
                    {r.legal ? ` · ${r.legal}` : ""}
                  </span>
                </span>,
                <span key="c" className="grid gap-1.5">
                  {r.mitigaciones.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </span>,
                <span key="k">
                  {r.componentes.length
                    ? r.componentes.join(" · ")
                    : RIESGOS.sinComponente[i]}
                </span>,
              ],
            }))}
          />
          <p className="mt-2 max-w-[72ch] text-dato text-tinta-2">
            {RIESGOS.nota[i]}
          </p>
        </Seccion>

        <Seccion id="d-nodice" titulo={SECCIONES.nodefine[i]}>
          <ul className="grid max-w-[72ch] list-disc gap-2 pl-5 text-chico leading-relaxed">
            {NO_DICE.items.map((t) => (
              <li key={t.es}>{t[i]}</li>
            ))}
          </ul>
        </Seccion>
      </div>
    </Marco>
  );
}
