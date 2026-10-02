import { FlaskConical } from "lucide-react";
import { CONT, cx } from "@/components/cx";
import { Icono } from "@/components/icono";
import { MarcaPlanlang } from "@/components/marcas";
import { SCRIPT_IDIOMA } from "@/lib/preferencias/script-idioma";
import { ELEGIR, ROTULO } from "@/textos/comun";
import { PORTADA } from "@/textos/entrada";
import { ruta } from "@/lib/ruta";

const OPCION =
  "grid gap-1 rounded-control border border-tinta-3 px-4 py-3 no-underline transition-colors hover:border-tinta-2";

/**
 * `/` — elige idioma (ADR-008). Con JS lleva al último idioma usado o al del navegador; con `?elegir`, o sin
 * JS, muestra los dos enlaces. Cada texto va en su idioma, marcado con `lang`.
 */
export default function Inicio() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_IDIOMA }} />
      <div className="border-b border-linea text-dato text-tinta-2">
        <div className={cx(CONT, "flex flex-wrap gap-x-4 gap-y-0.5 py-1.75")}>
          <span className="inline-flex items-center gap-1.5 font-medium text-tinta-1">
            <Icono de={FlaskConical} tam={14} />
            <span lang="es">{ROTULO.simulacion.es}</span>
            <span aria-hidden="true">/</span>
            <span lang="en">{ROTULO.simulacion.en}</span>
          </span>
        </div>
      </div>
      <main className={cx(CONT, "grid justify-items-start gap-6 py-14")}>
        <p className="inline-flex items-center gap-2 text-sub font-semibold tracking-apretado">
          <MarcaPlanlang />
          planlang
        </p>
        <h1 className="grid gap-1 text-titulo">
          <span lang="es">{PORTADA.titulo.es}</span>
          <span lang="en" className="text-tinta-2">
            {PORTADA.titulo.en}
          </span>
        </h1>
        <nav aria-label={ELEGIR.grupo} className="flex flex-wrap gap-3">
          <a
            href={ruta("es", "entrada")}
            hrefLang="es"
            lang="es"
            className={OPCION}
          >
            <span className="text-sub font-semibold">{ELEGIR.es.nombre}</span>
            <span className="text-chico text-tinta-2">{ELEGIR.es.texto}</span>
          </a>
          <a
            href={ruta("en", "entrada")}
            hrefLang="en"
            lang="en"
            className={OPCION}
          >
            <span className="text-sub font-semibold">{ELEGIR.en.nombre}</span>
            <span className="text-chico text-tinta-2">{ELEGIR.en.texto}</span>
          </a>
        </nav>
      </main>
    </>
  );
}
