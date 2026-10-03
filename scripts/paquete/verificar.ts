/**
 * El lector del manifiesto del paquete (`planlang-paquete/v1`, AU-S2-8). Compara un árbol —el de hoja-de-vida
 * después de copiar, o el propio `dist/paquete-hoja-de-vida/`— contra el manifiesto: cada archivo declarado existe
 * con su SHA-256, y en la carpeta de la vitrina no sobra ninguno (los chunks se nombran por su contenido, así que una
 * copia encima de una entrega vieja deja archivos huérfanos servidos). Funciones puras sobre un lector inyectado.
 */
export interface ManifiestoPaquete {
  formato: "planlang-paquete/v1";
  base: string;
  archivos: Record<string, string>;
}

export interface Arbol {
  /** Las rutas de archivo bajo una carpeta, relativas a la raíz del árbol. */
  listar(carpeta: string): string[];
  /** El SHA-256 de un archivo, o `null` si no existe. */
  sha256(ruta: string): string | null;
}

/** Los problemas del árbol frente al manifiesto; vacío si coincide. */
export function verificarContraManifiesto(
  m: ManifiestoPaquete,
  arbol: Arbol,
): string[] {
  if (m.formato !== "planlang-paquete/v1")
    return [`el manifiesto no es planlang-paquete/v1 (${String(m.formato)})`];
  const problemas: string[] = [];
  for (const [ruta, sha] of Object.entries(m.archivos)) {
    const real = arbol.sha256(ruta);
    if (real === null) problemas.push(`falta ${ruta}`);
    else if (real !== sha) problemas.push(`${ruta} no es el del manifiesto`);
  }
  const carpeta = `public${m.base}/`;
  for (const ruta of arbol.listar(carpeta))
    if (!Object.hasOwn(m.archivos, ruta))
      problemas.push(
        `${ruta} sobra: no está en el manifiesto (¿una entrega vieja? borra ${carpeta} antes de copiar)`,
      );
  return problemas;
}
