/**
 * Preferencias de lectura de la vitrina (ADR-008): tema y perfil viven como atributos de `<html>` y en
 * `localStorage` del visitante (solo comodidad: si el almacenamiento falla, la página se lee igual).
 * El idioma NO es preferencia de cliente: sale de la ruta (`/es`, `/en`); aquí solo se recuerda para
 * que `/` sepa adónde llevar al volver.
 */
export const PREFIJO = "planlang.";

export const TEMAS = ["oscuro", "claro"] as const;
export type Tema = (typeof TEMAS)[number];

export const PERFILES = ["lider", "experto"] as const;
export type Perfil = (typeof PERFILES)[number];

export const ATRIBUTO = { tema: "data-theme", perfil: "data-perfil" } as const;
/** Lo lleva el `<html>` de las páginas de un idioma (no el de `/`): el script previo lo recuerda. */
export const ATRIBUTO_IDIOMA = "data-idioma";
/**
 * Lo pone el script previo al terminar la carga: activa las letras que la primera pintura no necesita, la mono de
 * datos y la Fraunces de la piel de CV Viva en Fichas (ADR-008).
 */
export const ATRIBUTO_MONO = "data-mono";
export type Preferencia = keyof typeof ATRIBUTO;

export const VALORES: { tema: readonly Tema[]; perfil: readonly Perfil[] } = {
  tema: TEMAS,
  perfil: PERFILES,
};

/** Clase que `<html>` lleva mientras entra lo que cambia con el perfil (fundido de 0,45 s; nada si se reduce el movimiento). */
export const CLASE_CAMBIO_PERFIL = "perfil-cambio";
