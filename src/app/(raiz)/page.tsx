import { CONT, cx } from "@/components/cx";
import { MarcaPlanlang } from "@/components/marcas";
import { RotuloBilingue } from "@/components/marco/rotulo";
import { SCRIPT_IDIOMA } from "@/lib/preferencias/script-idioma";
import { ELEGIR } from "@/textos/comun";
import { PORTADA } from "@/textos/entrada";
import { rutaEntrada } from "@/lib/ruta";

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
      <RotuloBilingue />
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
            href={rutaEntrada("es")}
            hrefLang="es"
            lang="es"
            className={OPCION}
          >
            <span className="text-sub font-semibold">{ELEGIR.es.nombre}</span>
            <span className="text-chico text-tinta-2">{ELEGIR.es.texto}</span>
          </a>
          <a
            href={rutaEntrada("en")}
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
