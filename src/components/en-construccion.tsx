import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import { ruta, type Pantalla } from "@/lib/ruta";
import { EN_CONSTRUCCION, MARCA, PESTANAS, VEREDICTOS } from "@/textos/comun";
import { BotonEnlace } from "./boton";
import { CONT, cx } from "./cx";
import { Icono } from "./icono";
import { Marco } from "./marco/marco";
import { Veredicto } from "./veredicto";

export function metadatosEnConstruccion(
  idioma: Idioma,
  pagina: Pantalla,
): Metadata {
  return { title: `${MARCA} · ${PESTANAS[pagina][idioma]}` };
}

/**
 * Las pantallas que llegan en las fases 2–4 del sprint 2: la pestaña existe y dice que se está
 * construyendo, sin simular nada (design-system § 6: jamás se simula lo que no corrió).
 */
export function EnConstruccion({
  idioma,
  pagina,
}: {
  idioma: Idioma;
  pagina: Pantalla;
}) {
  return (
    <Marco idioma={idioma} pagina={pagina}>
      <div className={cx(CONT, "grid justify-items-start gap-4 py-14")}>
        <Veredicto clase="beta">{VEREDICTOS.en_construccion[idioma]}</Veredicto>
        <h1 className="text-titulo">{PESTANAS[pagina][idioma]}</h1>
        <p className="max-w-guia text-guia text-tinta-2">
          {EN_CONSTRUCCION.titulo[idioma]}. {EN_CONSTRUCCION.texto[idioma]}
        </p>
        <BotonEnlace href={ruta(idioma, "entrada")}>
          {EN_CONSTRUCCION.volver[idioma]}
          <Icono de={ArrowRight} tam={15} />
        </BotonEnlace>
      </div>
    </Marco>
  );
}
