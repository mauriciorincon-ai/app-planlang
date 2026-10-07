import { UserCheck } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import type { ChipCaso } from "@/lib/vista/caso";
import { PRIMEROS_CON_PAGINA } from "@/lib/vista/paginas-caso";
import { MIRADA, ORACULO, PORTADA } from "@/textos/caso";
import { PERFIL } from "@/textos/comun";
import { cx } from "../cx";
import { Icono } from "../icono";
import { AvisoPerfil } from "../perfil/aviso-perfil";
import { LeerComo } from "../perfil/leer-como";

/** La portada de Casos: antetítulo con la corrida, el título y la guía. */
export function PortadaCaso({
  antetitulo,
  idioma,
}: {
  antetitulo: string;
  idioma: Idioma;
}) {
  return (
    <section
      aria-labelledby="p6-t"
      className="pt-8 pb-8 escritorio:pt-14 escritorio:pb-9"
    >
      <div className="escritorio:max-w-[calc(7/12*100%)]">
        <p className="mb-3 text-chico text-tinta-2">{antetitulo}</p>
        <h1 id="p6-t" className="text-titulo text-balance">
          {PORTADA.titulo[idioma]}
        </h1>
        <p className="mt-4 max-w-guia text-guia text-tinta-2">
          {PORTADA.guia[idioma]}
        </p>
      </div>
    </section>
  );
}

/** La franja del oráculo: las decisiones humanas se simularon (DA-04). En Brecha, Playground y Casos. */
export function Oraculo({ idioma, demo }: { idioma: Idioma; demo: IdDemo }) {
  return (
    <div className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-3 rounded-control border border-l-3 border-linea border-l-tipo-4 bg-sup-1 px-4 py-3 text-chico text-tinta-2">
      <Icono de={UserCheck} tam={18} className="text-tinta-1" />
      <p>
        <b className="font-medium text-tinta-1">{ORACULO.titulo[idioma]}</b>{" "}
        {ORACULO.texto[demo][idioma]}
      </p>
    </div>
  );
}

/** «El caso en una mirada»: el perfil de lectura y el selector de los casos de la corrida. */
export function MiradaCaso({
  chips,
  actual,
  idioma,
  demo,
  total,
}: {
  chips: readonly ChipCaso[];
  actual: string | null;
  idioma: Idioma;
  demo: IdDemo;
  /** Cuántos casos tiene la corrida (los chips son solo los que tienen página). */
  total: number;
}) {
  return (
    <section aria-labelledby="c-mirada" className="pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 id="c-mirada" className="text-seccion">
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
          texto: MIRADA.avisoLider[demo][idioma],
          boton: PERFIL.verComoExperto[idioma],
        }}
        experto={{
          titulo: PERFIL.leesComoExperto[idioma],
          texto: MIRADA.avisoExperto[demo][idioma],
          boton: PERFIL.volverALider[idioma],
        }}
      />
      <nav
        aria-label={MIRADA.selector[idioma]}
        className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-chico"
      >
        <span className="text-tinta-2">
          {MIRADA.casosDeLaCorrida({ conPagina: chips.length, total, primeros: PRIMEROS_CON_PAGINA })[idioma]}
        </span>
        {chips.map((c) => (
          <a
            key={c.id}
            href={c.enlace}
            aria-current={c.id === actual ? "page" : undefined}
            className={cx(
              "inline-flex min-h-7.5 items-center gap-2 rounded-chip border bg-sup-1 px-2.5 py-1 text-tinta-1 no-underline",
              c.id === actual
                ? "border-tinta-1 shadow-[inset_0_0_0_1px_var(--tinta-1)]"
                : "border-linea hover:border-tinta-2",
            )}
          >
            <span className="font-mono text-dato leading-none font-medium text-tinta-2">
              {c.id}
            </span>
            {c.descriptor}
          </a>
        ))}
      </nav>
    </section>
  );
}
