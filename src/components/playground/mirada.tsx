/**
 * «El playground en una mirada» y «Lo que el playground no puede saber» de P5 Playground (maqueta
 * `05-playground.html`): el perfil de lectura, el objetivo, recibe → hace → entrega, el ejemplo llano medido (líder),
 * la ficha técnica (experto) y los límites con el aparte del núcleo. Sin lógica: pinta `src/lib/vista/playground.ts`.
 * Las dos lecturas están siempre en el árbol; el perfil las oculta por atributo (regla 5-a).
 */
import {
  Ban,
  Cpu,
  EyeOff,
  Inbox,
  Info,
  Send,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import type { VistaPlayground } from "@/lib/vista/playground";
import { PERFIL } from "@/textos/comun";
import {
  EJEMPLO,
  FICHA_TECNICA,
  IPO,
  LIMITES,
  MIRADA,
} from "@/textos/playground";
import {
  ColumnaIpo,
  Definiciones,
  FlechaIpo,
  GrupoT,
  ItemEst,
  ListaEst,
  MarcaCorrio,
} from "../agente/piezas";
import { Baldosa } from "../baldosa";
import { Icono } from "../icono";
import { AvisoPerfil } from "../perfil/aviso-perfil";
import { BloqueExperto } from "../perfil/bloque-experto";
import { LeerComo } from "../perfil/leer-como";
import { Seccion } from "../seccion";

export function MiradaPlayground({
  v,
  idioma,
}: {
  v: VistaPlayground;
  idioma: Idioma;
}) {
  const hecho = IPO.hecho[idioma];
  return (
    <section
      id="s-ficha"
      aria-labelledby="s-ficha-t"
      className="border-t border-linea pt-8 pb-10"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 id="s-ficha-t" className="text-seccion">
          {MIRADA.titulo[idioma]}
        </h2>
        <LeerComo
          rotulo={PERFIL.leerComo[idioma]}
          lider={PERFIL.lider[idioma]}
          experto={PERFIL.experto[idioma]}
        />
      </div>
      <AvisoPerfil
        lider={{
          titulo: PERFIL.leesComoLider[idioma],
          texto: MIRADA.avisoLider[idioma],
          boton: PERFIL.verComoExperto[idioma],
        }}
        experto={{
          titulo: PERFIL.leesComoExperto[idioma],
          texto: MIRADA.avisoExperto[idioma],
          boton: PERFIL.volverALider[idioma],
        }}
      />

      <div className="mt-6 grid grid-cols-[36px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-0.5">
        <span className="row-span-2">
          <Baldosa icono={Target} />
        </span>
        <span className="text-chico text-tinta-2">
          {MIRADA.objetivo[idioma]}
        </span>
        <p className="max-w-objetivo text-texto leading-[1.6]">
          {MIRADA.objetivoTexto[idioma]}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 amplio:grid-cols-[minmax(0,4fr)_28px_minmax(0,5fr)_28px_minmax(0,4fr)]">
        <ColumnaIpo icono={Inbox} titulo={IPO.recibe[idioma]} sub={v.recibeSub}>
          <ListaEst>
            {v.recibe.map((x) => (
              <ItemEst
                key={x.titulo}
                inicio={<MarcaCorrio texto={hecho} />}
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
        <FlechaIpo />
        <ColumnaIpo
          icono={SlidersHorizontal}
          titulo={IPO.hace[idioma]}
          sub={IPO.haceSub[idioma]}
        >
          <ListaEst numerada>
            {v.hace.map((paso, k) => (
              <ItemEst
                key={paso}
                inicio={
                  <span className="font-mono text-dato leading-[1.9] font-medium text-tinta-2">
                    {k + 1}
                  </span>
                }
                fin={<MarcaCorrio texto={hecho} />}
                titulo={paso}
              />
            ))}
          </ListaEst>
        </ColumnaIpo>
        <FlechaIpo />
        <ColumnaIpo
          icono={Send}
          titulo={IPO.entrega[idioma]}
          sub={IPO.entregaSub[idioma]}
        >
          <ListaEst>
            {v.entrega.map((x) => (
              <ItemEst
                key={x.titulo}
                inicio={<MarcaCorrio texto={hecho} />}
                titulo={x.titulo}
                detalle={x.detalle}
              />
            ))}
            <ItemEst
              inicio={
                <Icono de={Ban} tam={15} className="mt-0.5 text-tinta-2" />
              }
              titulo={IPO.nunca[idioma]}
              detalle={IPO.nuncaDetalle[idioma]}
            />
          </ListaEst>
        </ColumnaIpo>
      </div>

      {v.ejemplo ? (
        <div className="solo-lider mt-6 grid grid-cols-[18px_minmax(0,1fr)] gap-3 rounded-control border border-linea px-3.5 py-3 text-chico leading-[1.55] text-tinta-2">
          <Icono de={Info} tam={18} className="text-tinta-1" />
          <p>
            <b className="font-medium text-tinta-1">{EJEMPLO.titulo[idioma]}</b>{" "}
            {v.ejemplo}
          </p>
        </div>
      ) : null}

      <BloqueExperto rotulo={PERFIL.experto[idioma]} className="mt-6">
        <GrupoT icono={Cpu} titulo={FICHA_TECNICA.titulo[idioma]}>
          <Definiciones filas={v.ficha} />
        </GrupoT>
      </BloqueExperto>
    </section>
  );
}

export function Limites({ v, idioma }: { v: VistaPlayground; idioma: Idioma }) {
  return (
    <Seccion id="s-limites-t" titulo={LIMITES.titulo[idioma]}>
      <div className="grid grid-cols-1 items-start gap-x-12 gap-y-6 amplio:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ListaEst>
          {v.limites.map((l) => (
            <ItemEst
              key={l}
              inicio={
                <Icono de={EyeOff} tam={15} className="mt-0.5 text-tinta-2" />
              }
              titulo={l}
            />
          ))}
        </ListaEst>
        <div className="grid grid-cols-[18px_minmax(0,1fr)] gap-3 rounded-control border border-linea bg-sup-1 px-4 py-3 text-chico leading-normal text-tinta-2">
          <Icono de={Cpu} tam={16} className="mt-0.5 text-tinta-1" />
          <p>
            <b className="font-medium text-tinta-1">{LIMITES.nucleo[idioma]}</b>{" "}
            {v.nucleoDetalle}
          </p>
        </div>
      </div>
    </Seccion>
  );
}
