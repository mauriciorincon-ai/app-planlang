/**
 * Texto con código en línea: lo que va entre acentos graves (`así`) se pinta en la mono sobre la superficie 2,
 * como los nombres de señal, de clase o de archivo en la maqueta. El dato nace escrito así en los textos.
 */
export const CODIGO_EN_LINEA =
  "rounded-mini bg-sup-2 px-0.75 font-mono text-[0.92em] [overflow-wrap:anywhere]";

export function ConCodigo({ texto }: { texto: string }) {
  const partes = texto.split(/`([^`]*)`/);
  return (
    <>
      {partes.map((p, k) =>
        k % 2 === 1 ? (
          <code key={k} className={CODIGO_EN_LINEA}>
            {p}
          </code>
        ) : (
          p
        ),
      )}
    </>
  );
}
