/**
 * El complemento de la ficha de planlang que viaja a hoja-de-vida (`data/fichas/planlang.yaml`). planlang propone
 * sus campos (procedencia: app); el bloque `roadmap:` lo administra la planeadora y llega por copia aparte
 * (procedencia cv-viva; sus ids son la clave de los votos). Una entrega nueva del paquete **conserva** ese bloque si
 * el archivo de hoja-de-vida ya lo trae: pisarlo dejaría los votos sin su idea (AU-S2-7).
 */
import { parse, stringify } from "yaml";

export const CABECERA_COMPLEMENTO = [
  "# Complemento de la ficha técnica de planlang, propuesto por la app (procedencia: app).",
  "# Lo genera `pnpm fichas` en planlang (docs/fichas/planlang.complemento-propuesto.json); no se edita aquí.",
  "# El bloque `roadmap:` lo administra la planeadora: si este archivo ya lo trae en hoja-de-vida, la entrega",
  "# lo conserva (`pnpm paquete:vitrina --hoja-de-vida <ruta>` lo fusiona); nunca se borra al copiar.",
].join("\n");

export interface Fusion {
  yaml: string;
  /** Si conservó el `roadmap:` del archivo que ya estaba en hoja-de-vida. */
  conservoRoadmap: boolean;
}

/**
 * El YAML del complemento: los campos que propone planlang y, si `existente` (el YAML que hoy tiene hoja-de-vida)
 * trae `roadmap:`, ese bloque tal cual. Un `roadmap` en lo propuesto se rechaza: no es de planlang.
 */
export function fusionarComplemento(
  propuesto: Record<string, unknown>,
  existente: string | null,
): Fusion {
  if (Object.hasOwn(propuesto, "roadmap"))
    throw new Error(
      "paquete: el complemento propuesto trae `roadmap`, que administra la planeadora; planlang no lo escribe.",
    );
  const previo =
    existente === null
      ? null
      : (parse(existente) as Record<string, unknown> | null);
  const roadmap =
    previo && Object.hasOwn(previo, "roadmap") ? previo.roadmap : undefined;
  const salida = roadmap === undefined ? propuesto : { ...propuesto, roadmap };
  return {
    yaml: `${CABECERA_COMPLEMENTO}\n${stringify(salida, { lineWidth: 0, defaultStringType: "QUOTE_DOUBLE", defaultKeyType: "PLAIN" })}`,
    conservoRoadmap: roadmap !== undefined,
  };
}
