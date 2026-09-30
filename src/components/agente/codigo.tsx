import type { BloqueCodigo as Bloque } from "@/lib/vista/agente";

/**
 * Un bloque del código del repositorio, sin editar: título, archivo y líneas arriba; el código con su número de
 * línea (fuera de la selección) y los comentarios en tinta 2. Se desliza de lado y se enfoca con el teclado.
 */
export function BloqueCodigo({ bloque }: { bloque: Bloque }) {
  const archivo = bloque.archivo.split("/").pop() ?? bloque.archivo;
  const lineas = bloque.codigo.replace(/\n$/, "").split("\n");
  return (
    <figure className="m-0 grid min-w-0 gap-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-chico font-medium">
        <span>{bloque.titulo}</span>
        <span
          className="font-mono text-dato leading-[1.4] font-normal text-tinta-2"
          title={bloque.archivo}
        >
          {archivo} · {bloque.lineas}
        </span>
      </figcaption>
      <pre
        tabIndex={0}
        aria-label={`${archivo} · ${bloque.lineas}`}
        className="m-0 overflow-x-auto rounded-control border border-linea bg-sup-1 px-4 py-3.5 font-mono text-[12.5px] leading-[1.65] text-tinta-1"
      >
        {lineas.map((l, k) => (
          <span
            key={k}
            className={
              l.trimStart().startsWith("#")
                ? "block whitespace-pre text-tinta-2"
                : "block whitespace-pre"
            }
          >
            <span
              aria-hidden="true"
              className="mr-3.5 inline-block w-[3ch] text-right text-tinta-2 select-none"
            >
              {bloque.desde + k}
            </span>
            {l}
          </span>
        ))}
      </pre>
    </figure>
  );
}
