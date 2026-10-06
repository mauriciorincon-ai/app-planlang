import {
  ClipboardList,
  Fingerprint,
  Gauge,
  House,
  Languages,
  Route,
  SlidersHorizontal,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import { CONMUTADOR_EN, DEMOS, type IdDemo } from "@/lib/demos";
import { PANTALLAS, ruta, rutaEntrada, type Pantalla } from "@/lib/ruta";
import { BARRA, MARCA, PESTANAS } from "@/textos/comun";
import { CONT, cx } from "../cx";
import { Icono } from "../icono";
import { MarcaPlanlang } from "../marcas";
import { SEG, SEG_OPCION } from "../segmentado";
import { ConmutadorTema } from "./conmutador-tema";

const ICONO: Record<Pantalla, LucideIcon> = {
  entrada: House,
  plan: ClipboardList,
  agente: Workflow,
  brecha: Gauge,
  playground: SlidersHorizontal,
  caso: Route,
  fichas: Fingerprint,
};

/** La letra y el nombre de cada demo en el conmutador (un demo nuevo no compila sin los suyos). */
const OPCION_DEMO: Readonly<
  Record<IdDemo, { letra: string; nombre: TextoBilingue }>
> = {
  "demo-a": { letra: "A", nombre: BARRA.demoA },
  "demo-b": { letra: "B", nombre: BARRA.demoB },
};

/**
 * Barra de navegación: marca, las siete pestañas con ícono, idioma y tema. Bajo 861 px las pestañas bajan
 * a su propia fila y se deslizan de lado (la página no). El idioma son ENLACES a la misma pantalla en el
 * otro idioma (ADR-008: el idioma sale de la ruta). En las pantallas del B, las pestañas enlazan dentro del B y un
 * conmutador lleva a la misma pantalla del A (ADR-014); las del A no cambian.
 */
export function Barra({
  idioma,
  pagina,
  id,
  demo,
}: {
  idioma: Idioma;
  pagina: Pantalla;
  id?: string;
  demo: IdDemo;
}) {
  // Con el conmutador de demo, las siete pestañas no caben en una fila a ningún ancho de escritorio (el contenedor
  // llega a 1.120 px): van en su propia fila, como en el teléfono. En el A la barra es la del S2.
  const conConmutador = CONMUTADOR_EN[demo];
  const pestanasEnSuFila = conConmutador;
  return (
    <header className="border-b border-linea">
      <div
        className={cx(
          CONT,
          "flex min-h-14 flex-wrap items-center gap-x-4 pt-2.5",
          !pestanasEnSuFila &&
            "escritorio:flex-nowrap escritorio:gap-x-7 escritorio:gap-y-2 escritorio:pt-0",
        )}
      >
        <a
          href={rutaEntrada(idioma)}
          aria-label={BARRA.inicio[idioma]}
          className="inline-flex items-center gap-2 text-sub font-semibold tracking-apretado no-underline"
        >
          <MarcaPlanlang />
          {MARCA}
        </a>
        <nav
          aria-label={BARRA.secciones[idioma]}
          className={cx(
            "order-3 mt-1.5 flex basis-full gap-1 self-stretch overflow-x-auto [scrollbar-width:none]",
            !pestanasEnSuFila &&
              "escritorio:order-none escritorio:mt-0 escritorio:basis-auto",
          )}
        >
          {PANTALLAS.map((p) => (
            <a
              key={p}
              href={ruta(idioma, p, undefined, demo)}
              aria-current={p === pagina ? "page" : undefined}
              className={cx(
                "-mb-px flex items-center gap-1.75 border-b-2 border-transparent px-2.5 pt-2.5 pb-3 text-apoyo whitespace-nowrap text-tinta-2 no-underline first:pl-0 hover:text-tinta-1",
                !pestanasEnSuFila && "escritorio:py-0 escritorio:first:pl-2.5",
                "aria-[current=page]:border-tinta-1 aria-[current=page]:font-medium aria-[current=page]:text-tinta-1",
              )}
            >
              <Icono de={ICONO[p]} tam={15} />
              {PESTANAS[p][idioma]}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex gap-2">
          {conConmutador && (
            <div className={SEG} role="group" aria-label={BARRA.demo[idioma]}>
              {DEMOS.map((d) => (
                <a
                  key={d}
                  href={ruta(idioma, pagina, undefined, d)}
                  aria-label={OPCION_DEMO[d].nombre[idioma]}
                  aria-current={d === demo ? "true" : undefined}
                  className={SEG_OPCION}
                >
                  {OPCION_DEMO[d].letra}
                </a>
              ))}
            </div>
          )}
          <div className={SEG} role="group" aria-label={BARRA.idioma[idioma]}>
            <a
              href={ruta("es", pagina, id, demo)}
              hrefLang="es"
              lang="es"
              aria-label="Español"
              aria-current={idioma === "es" ? "true" : undefined}
              className={SEG_OPCION}
            >
              <Icono de={Languages} tam={13} />
              ES
            </a>
            <a
              href={ruta("en", pagina, id, demo)}
              hrefLang="en"
              lang="en"
              aria-label="English"
              aria-current={idioma === "en" ? "true" : undefined}
              className={SEG_OPCION}
            >
              EN
            </a>
          </div>
          <ConmutadorTema
            etiqueta={BARRA.tema[idioma]}
            oscuro={BARRA.oscuro[idioma]}
            claro={BARRA.claro[idioma]}
          />
        </div>
      </div>
    </header>
  );
}
