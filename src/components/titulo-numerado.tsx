/** Título de sección con su número en mono delante (P2 Plan, P4 Brecha, P7 Fichas). */
export function TituloNumerado({
  n,
  titulo,
}: {
  n: number | string;
  titulo: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-2.5">
      <span className="font-mono text-dato leading-none font-medium text-tinta-2">
        {n}
      </span>
      {titulo}
    </span>
  );
}
