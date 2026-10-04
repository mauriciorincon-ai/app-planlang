import type { LucideIcon } from "lucide-react";
import type { Cifra } from "@/lib/vista/agente";
import { Baldosa } from "../baldosa";
import { ConCodigo } from "../con-codigo";

/**
 * Tres cifras del contrato de grafo frente al grafo que corrió (P3: «Lo que corrió, frente a su plan»; y el
 * spike, frente al mismo contrato): baldosa, cifra, qué cuenta y su detalle.
 */
export function CifrasContrato({
  cifras,
  iconos,
  rotulo,
}: {
  cifras: readonly Cifra[];
  iconos: readonly LucideIcon[];
  rotulo: string;
}) {
  return (
    <div
      role="list"
      aria-label={rotulo}
      className="grid grid-cols-1 gap-3 escritorio:grid-cols-3 escritorio:gap-6"
    >
      {cifras.map((c, k) => (
        <div
          key={c.texto}
          role="listitem"
          className="grid grid-cols-[36px_minmax(0,1fr)] content-start gap-x-3.5 gap-y-1 border-t border-linea pt-3.5"
        >
          <span className="row-span-3">
            <Baldosa icono={iconos[k]!} />
          </span>
          <b className="text-cifra font-semibold tracking-cifra tabular-nums">
            {c.cifra}
          </b>
          <span className="text-apoyo leading-normal">{c.texto}</span>
          <small className="text-chico leading-normal text-tinta-2">
            <ConCodigo texto={c.detalle} />
          </small>
        </div>
      ))}
    </div>
  );
}
