import { notFound } from "next/navigation";
import type { Idioma } from "@core/formatos/bilingue";
import { MiradaCaso, Oraculo, PortadaCaso } from "@/components/caso/cabecera";
import { Caso } from "@/components/caso/caso";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { datosDemo } from "@/lib/datos/vitrina";
import type { IdDemo } from "@/lib/demos";
import {
  chipsDeCasos,
  idsDeCasos,
  portadaCasos,
  vistaCaso,
} from "@/lib/vista/caso";

/** Los casos de la corrida del demo (uno por traza): las páginas de P6 que se generan. */
export async function idsDeCasosDe(demo: IdDemo): Promise<{ id: string }[]> {
  return idsDeCasos(await datosDemo(demo)).map((id) => ({ id }));
}

/** P6 Casos, índice: los casos de la corrida, cada uno abre su traza de punta a punta. */
export async function PaginaCasos({
  idioma,
  demo,
}: {
  idioma: Idioma;
  demo: IdDemo;
}) {
  const d = await datosDemo(demo);
  const portada = portadaCasos(d, idioma);
  return (
    <Marco idioma={idioma} pagina="caso" demo={demo} corrida={portada.pie}>
      <div className={`${CONT} pb-14`}>
        <PortadaCaso antetitulo={portada.antetituloIndice} idioma={idioma} />
        <Oraculo idioma={idioma} demo={demo} />
        <MiradaCaso
          chips={chipsDeCasos(d, idioma)}
          total={d.corrida.trazas.length}
          actual={null}
          idioma={idioma}
          demo={demo}
        />
      </div>
    </Marco>
  );
}

/** P6 Caso (maqueta `06-caso.html`): una traza real de punta a punta, armada desde la corrida. */
export async function PaginaCaso({
  idioma,
  demo,
  id,
}: {
  idioma: Idioma;
  demo: IdDemo;
  id: string;
}) {
  const d = await datosDemo(demo);
  if (!idsDeCasos(d).includes(id)) notFound();
  const portada = portadaCasos(d, idioma);
  return (
    <Marco
      idioma={idioma}
      pagina="caso"
      id={id}
      demo={demo}
      corrida={portada.pie}
    >
      <div className={CONT}>
        <PortadaCaso antetitulo={portada.antetitulo} idioma={idioma} />
        <Oraculo idioma={idioma} demo={demo} />
        <MiradaCaso
          chips={chipsDeCasos(d, idioma)}
          total={d.corrida.trazas.length}
          actual={id}
          idioma={idioma}
          demo={demo}
        />
        <Caso v={vistaCaso(d, id, idioma)} idioma={idioma} />
      </div>
    </Marco>
  );
}
