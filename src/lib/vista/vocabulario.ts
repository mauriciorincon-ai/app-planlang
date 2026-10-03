/**
 * El vocabulario de presentación de la vitrina (textos, columnas, cifras por nodo o por señal) está escrito para el
 * grafo y el plan publicados. Un nodo, una señal o un estado nuevos sin su entrada no pueden salir en blanco ni con
 * un texto de relleno: el build se detiene nombrando la clave y dónde falta (AU-S2-16).
 */
export function delVocabulario<T>(
  mapa: Readonly<Record<string, T>>,
  clave: string,
  donde: string,
): T {
  const v = mapa[clave];
  if (v === undefined)
    throw new Error(
      `vitrina: «${clave}» no tiene su entrada en ${donde}; un nodo, una señal o un estado nuevos necesitan la suya antes de publicarse.`,
    );
  return v;
}
