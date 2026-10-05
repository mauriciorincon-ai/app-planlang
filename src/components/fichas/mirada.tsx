/**
 * «Las fichas en una mirada» y la sección 1, la ficha de reproducibilidad, de P7 Fichas (maqueta `07-fichas.html`):
 * el perfil de lectura, recibe → hace → entrega, las filas de la ficha (las mismas que la sección 9 de Brecha, más el
 * entorno) y, para el experto, los pasos para repetir la corrida. Sin lógica: pinta `src/lib/vista/fichas.ts`. Las
 * dos lecturas están siempre en el árbol; el perfil las oculta por atributo (regla 5-a).
 */
import {
  Ban,
  ClipboardPenLine,
  FileText,
  Fingerprint,
  History,
  Inbox,
  Send,
  type LucideIcon,
} from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import type { VistaFichas } from "@/lib/vista/fichas";
import { PERFIL } from "@/textos/comun";
import { MIRADA, REPRO } from "@/textos/fichas";
import {
  ColumnaIpo,
  Definiciones,
  FlechaIpo,
  ItemEst,
  ListaEst,
  MarcaCorrio,
} from "../agente/piezas";
import { Chip } from "../chip";
import { CODIGO_EN_LINEA } from "../con-codigo";
import { Icono } from "../icono";
import { AvisoPerfil } from "../perfil/aviso-perfil";
import { BloqueExperto } from "../perfil/bloque-experto";
import { LeerComo } from "../perfil/leer-como";
import { Seccion } from "../seccion";
import { TituloNumerado } from "../titulo-numerado";

const LECTURA = "mb-6 max-w-[72ch] text-texto leading-[1.6]";

/** Lo que entrega P7, en el orden de la maqueta: la ficha que se queda, las dos que viajan y lo que nunca va. */
const ICONO_ENTREGA: readonly LucideIcon[] = [
  Fingerprint,
  FileText,
  FileText,
  Ban,
];

export function MiradaFichas({
  v,
  idioma,
}: {
  v: VistaFichas;
  idioma: Idioma;
}) {
  const hecho = MIRADA.hecho[idioma];
  return (
    <section
      id="s-ficha"
      aria-labelledby="s-ficha-t"
      className="border-t border-linea pt-8 pb-10"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 id="s-ficha-t" className="text-seccion">
          {MIRADA.titulo[idioma]}
        </h2>
        <LeerComo
          rotulo={PERFIL.leerComo[idioma]}
          lider={PERFIL.lider[idioma]}
          experto={PERFIL.experto[idioma]}
        />
      </div>
      <AvisoPerfil
        lider={{
          titulo: PERFIL.leesComoLider[idioma],
          texto: MIRADA.avisoLider[idioma],
          boton: PERFIL.verComoExperto[idioma],
        }}
        experto={{
          titulo: PERFIL.leesComoExperto[idioma],
          texto: MIRADA.avisoExperto[idioma],
          boton: PERFIL.volverALider[idioma],
        }}
      />

      <div className="mt-6 grid grid-cols-1 amplio:grid-cols-[minmax(0,4fr)_28px_minmax(0,5fr)_28px_minmax(0,4fr)]">
        <ColumnaIpo icono={Inbox} titulo={MIRADA.recibe[idioma]}>
          <ListaEst>
            {v.mirada.recibe.map((x) => (
              <ItemEst
                key={x.titulo}
                inicio={<MarcaCorrio texto={hecho} />}
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
        <FlechaIpo />
        <ColumnaIpo icono={ClipboardPenLine} titulo={MIRADA.hace[idioma]}>
          <ListaEst numerada>
            {v.mirada.hace.map((paso, k) => (
              <ItemEst
                key={paso}
                inicio={
                  <span className="font-mono text-dato leading-[1.9] font-medium text-tinta-2">
                    {k + 1}
                  </span>
                }
                fin={<MarcaCorrio texto={hecho} />}
                titulo={paso}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
        <FlechaIpo />
        <ColumnaIpo icono={Send} titulo={MIRADA.entrega[idioma]}>
          <ListaEst>
            {v.mirada.entrega.map((x, k) => (
              <ItemEst
                key={x.titulo}
                inicio={
                  <Icono
                    de={ICONO_ENTREGA[k] ?? FileText}
                    tam={15}
                    className="mt-0.5 text-tinta-2"
                  />
                }
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
      </div>
    </section>
  );
}

export function Reproducibilidad({
  v,
  idioma,
}: {
  v: VistaFichas;
  idioma: Idioma;
}) {
  return (
    <Seccion
      id="f-rep"
      titulo={<TituloNumerado n={1} titulo={REPRO.titulo[idioma]} />}
      nota={<Chip procedencia="real">{v.repro.chip}</Chip>}
    >
      <p className={LECTURA}>{REPRO.lectura[idioma]}</p>
      <div className="rounded-baldosa border border-linea bg-sup-1 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sub font-semibold">
            <Icono de={Fingerprint} tam={17} className="text-tinta-2" />
            {v.textos.cuadro}
          </h3>
          <Chip procedencia="real">{v.repro.chip}</Chip>
        </div>
        <Definiciones filas={v.repro.filas} />
      </div>
      <BloqueExperto rotulo={PERFIL.experto[idioma]} className="mt-4">
        <h3 className="mb-2 flex items-center gap-2 text-sub font-semibold">
          <Icono de={History} className="text-tinta-2" />
          {REPRO.repetir[idioma]}
        </h3>
        <ol className="m-0 grid list-none gap-0 p-0">
          {v.repro.pasos.map((p, k) => (
            <li
              key={p.comando}
              className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 border-t border-linea py-1.75 text-chico leading-normal first:border-t-0"
            >
              <span className="font-mono text-dato leading-[1.7] text-tinta-2">
                {k + 1}
              </span>
              <span>
                <code className={CODIGO_EN_LINEA}>{p.comando}</code> {p.texto}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-dato leading-normal text-tinta-2">
          {REPRO.pie[idioma]}
        </p>
      </BloqueExperto>
    </Seccion>
  );
}
