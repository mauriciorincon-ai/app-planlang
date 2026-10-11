import type { Idioma } from "@core/formatos/bilingue";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { Chip } from "@/components/chip";
import { LeerComo } from "@/components/perfil/leer-como";
import { Seccion } from "@/components/seccion";
import { Veredicto } from "@/components/veredicto";
import { planSinCorrida } from "@/lib/datos/planes";
import {
  vistaSinCorrida,
  type SeccionSinCorrida,
} from "@/lib/vista/plan-sin-corrida";
import { PERFIL } from "@/textos/comun";
import { ETIQUETA, PORTADA, SECCIONES } from "@/textos/plan-sin-corrida";

/**
 * Un plan sin corrida (S5, maqueta de FORMA «no vista»): el contrato tal como se aprobó, sin trazas, brecha, playground
 * ni visor. Lo primero que se lee es la ficha de lo que NO hay (P15); después el problema, el contrato en cifras y cada
 * sección del plan. Quién propuso cada elemento (RF-02.4: plantilla · entrevistador · usuario) se lee como experto. No
 * es de ningún demo: el marco no lleva demo ni corrida.
 */
export async function PaginaPlanSinCorrida({
  idioma,
  id,
}: {
  idioma: Idioma;
  id: string;
}) {
  const p = await planSinCorrida(id);
  const v = vistaSinCorrida(p.plan, idioma);
  return (
    <Marco idioma={idioma} pagina="planes" id={id}>
      <div className={CONT}>
        <section aria-labelledby="ps-t" className="pt-8 pb-7 escritorio:pt-14">
          <div className="escritorio:max-w-[calc(7/12*100%)]">
            <p className="mb-3 text-chico text-tinta-2">
              {PORTADA.antetitulo[idioma]} · {v.dominio}
            </p>
            <h1 id="ps-t" className="text-titulo text-balance">
              {v.nombre}
            </h1>
            <p className="mt-4 max-w-guia text-guia text-tinta-2">
              {PORTADA.guia[idioma]}
            </p>
            <div className="mt-4">
              <LeerComo
                rotulo={PERFIL.leerComo[idioma]}
                lider={PERFIL.lider[idioma]}
                experto={PERFIL.experto[idioma]}
              />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="ps-ficha-t"
          data-ficha="sin-corrida"
          className="border-t border-linea py-8"
        >
          {/* El rótulo es el título de la sección: símbolo + texto + color (P13), una sola vez. */}
          <h2 id="ps-ficha-t" className="text-seccion">
            <Veredicto clase="beta">{v.ficha.etiqueta}</Veredicto>
          </h2>
          <p className="mt-3 max-w-[72ch] text-texto leading-[1.6]">
            {v.ficha.nota}
          </p>
          <p className="mt-2 max-w-[72ch] text-chico text-tinta-2">
            {v.ficha.falta}
          </p>
          <dl className="mt-5 grid gap-x-6 gap-y-2 text-chico escritorio:grid-cols-[auto_minmax(0,1fr)]">
            <dt className="text-tinta-2">{ETIQUETA.version[idioma]}</dt>
            <dd className="font-mono">
              {v.id} · v{v.version}
            </dd>
            <dt className="text-tinta-2">{ETIQUETA.dominio[idioma]}</dt>
            <dd className="font-mono">{v.dominio}</dd>
            {v.aprobacion ? (
              <>
                <dt className="text-tinta-2">{ETIQUETA.aprobado[idioma]}</dt>
                <dd>{v.aprobacion}</dd>
              </>
            ) : null}
            {v.huella ? (
              <>
                <dt className="text-tinta-2">{ETIQUETA.huella[idioma]}</dt>
                <dd className="font-mono [overflow-wrap:anywhere]">
                  {v.huella}
                </dd>
              </>
            ) : null}
          </dl>
        </section>

        <Seccion id="ps-problema-t" titulo={SECCIONES.problema[idioma]}>
          <p className="max-w-[72ch] text-texto leading-[1.6]">{v.problema}</p>
        </Seccion>

        <Seccion
          id="ps-contrato-t"
          titulo={SECCIONES.contrato[idioma]}
          nota={v.contrato.join(" · ")}
        >
          <p className="solo-experto max-w-[72ch] text-chico text-tinta-2">
            {PORTADA.origenes[idioma]}
          </p>
        </Seccion>

        {v.secciones.map((s) => (
          <SeccionDeElementos key={s.id} s={s} idioma={idioma} />
        ))}
      </div>
    </Marco>
  );
}

function SeccionDeElementos({
  s,
  idioma,
}: {
  s: SeccionSinCorrida;
  idioma: Idioma;
}) {
  return (
    <Seccion
      id={`ps-${s.id}-t`}
      titulo={s.titulo}
      nota={String(s.elementos.length)}
    >
      <ul className="grid gap-0">
        {s.elementos.map((e) => (
          <li
            key={e.id}
            data-elemento={e.id}
            className="grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-linea py-3 escritorio:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_auto]"
          >
            <div className="min-w-0">
              <span className="mr-2 font-mono text-dato text-tinta-2">
                {e.id}
              </span>
              <span className="text-apoyo">{e.titulo}</span>
            </div>
            <div className="grid gap-1 text-chico text-tinta-2">
              {e.detalle.map((d) => (
                <span key={d} className="[overflow-wrap:anywhere]">
                  {d}
                </span>
              ))}
            </div>
            <div className="solo-experto justify-self-start">
              <Chip procedencia="declarado">
                <span lang={idioma}>{e.origen}</span>
              </Chip>
            </div>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}
