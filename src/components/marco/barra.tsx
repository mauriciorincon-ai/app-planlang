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
import type { Idioma } from "@core/formatos/bilingue";
import { PANTALLAS, ruta, type Pantalla } from "@/lib/ruta";
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

/**
 * Barra de navegación: marca, las siete pestañas con ícono, idioma y tema. Bajo 861 px las pestañas bajan
 * a su propia fila y se deslizan de lado (la página no). El idioma son ENLACES a la misma pantalla en el
 * otro idioma (ADR-008: el idioma sale de la ruta).
 */
export function Barra({
  idioma,
  pagina,
  id,
}: {
  idioma: Idioma;
  pagina: Pantalla;
  id?: string;
}) {
  return (
    <header className="border-b border-linea">
      <div
        className={cx(
          CONT,
          "flex min-h-14 flex-wrap items-center gap-x-4 pt-2.5",
          "escritorio:flex-nowrap escritorio:gap-x-7 escritorio:gap-y-2 escritorio:pt-0",
        )}
      >
        <a
          href={ruta(idioma, "entrada")}
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
            "escritorio:order-none escritorio:mt-0 escritorio:basis-auto",
          )}
        >
          {PANTALLAS.map((p) => (
            <a
              key={p}
              href={ruta(idioma, p)}
              aria-current={p === pagina ? "page" : undefined}
              className={cx(
                "-mb-px flex items-center gap-1.75 border-b-2 border-transparent px-2.5 pt-2.5 pb-3 text-apoyo whitespace-nowrap text-tinta-2 no-underline first:pl-0 hover:text-tinta-1",
                "escritorio:py-0 escritorio:first:pl-2.5",
                "aria-[current=page]:border-tinta-1 aria-[current=page]:font-medium aria-[current=page]:text-tinta-1",
              )}
            >
              <Icono de={ICONO[p]} tam={15} />
              {PESTANAS[p][idioma]}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex gap-2">
          <div className={SEG} role="group" aria-label={BARRA.idioma[idioma]}>
            <a
              href={ruta("es", pagina, id)}
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
              href={ruta("en", pagina, id)}
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
