/**
 * Lado de cliente de las preferencias: los conmutadores leen el atributo de `<html>` con
 * `useSyncExternalStore` (el servidor no lo conoce: su instantánea es `null` y la hidratación no
 * discute) y lo cambian con `fijarPreferencia`. Lo que cambia es una PROPIEDAD (`aria-pressed`,
 * el atributo de `<html>`), nunca la forma del árbol (regla de desarrollo 5-a).
 */
import { useSyncExternalStore } from "react";
import {
  ATRIBUTO,
  CLASE_CAMBIO_PERFIL,
  PREFIJO,
  type Perfil,
  type Preferencia,
  type Tema,
} from "./claves";

function suscribir(avisar: () => void): () => void {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [ATRIBUTO.tema, ATRIBUTO.perfil],
  });
  return () => observador.disconnect();
}

export function leerPreferencia(clave: Preferencia): string | null {
  return document.documentElement.getAttribute(ATRIBUTO[clave]);
}

export function usePreferencia(clave: "tema"): Tema | null;
export function usePreferencia(clave: "perfil"): Perfil | null;
export function usePreferencia(clave: Preferencia): string | null {
  return useSyncExternalStore(
    suscribir,
    () => leerPreferencia(clave),
    () => null,
  );
}

let temporizador: ReturnType<typeof setTimeout> | undefined;

export function fijarPreferencia(clave: "tema", valor: Tema): void;
export function fijarPreferencia(clave: "perfil", valor: Perfil): void;
export function fijarPreferencia(clave: Preferencia, valor: string): void {
  const html = document.documentElement;
  if (clave === "perfil" && html.getAttribute(ATRIBUTO.perfil) !== valor) {
    html.classList.add(CLASE_CAMBIO_PERFIL);
    clearTimeout(temporizador);
    temporizador = setTimeout(
      () => html.classList.remove(CLASE_CAMBIO_PERFIL),
      600,
    );
  }
  html.setAttribute(ATRIBUTO[clave], valor);
  try {
    localStorage.setItem(PREFIJO + clave, valor);
  } catch {
    // Sin almacenamiento (ventana privada, datos bloqueados): la preferencia dura lo que la página.
  }
}
