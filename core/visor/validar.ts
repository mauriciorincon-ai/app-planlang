/**
 * Validación en código del mapa (contrato del diagramador 0.5.0 § 7, fase 2): las reglas que el esquema no puede
 * ver. La fase 1 (esquema JSON con Ajv) corre contra la copia fijada de `mapa.schema.json` (pruebas y build).
 * Informe con la forma del contrato: `{ doc, fase, regla, ruta, id, idioma?, mensaje }`, ordenado por
 * `(doc, ruta, regla)`. Sin dato válido no hay dibujo (G14).
 *
 * Dos reglas chocan con la geometría aprobada de planlang y llegan como EXCEPCIÓN NOMBRADA desde quien llama (el
 * validador no las asume; desviación 6 del S3, enmiendas propuestas en el lock):
 * - `V5-papel`: el recorrido empieza y termina en `desde_bandas`/`hasta_bandas` (`entrada`/`salida`), y planlang no
 *   pone nodos ahí; con la excepción, también vale el nodo con `papel` inicio/fin.
 * - `V7`: el mapa de un agente no tiene bloques (`bloques_min: 1`); con la excepción, V7 es alerta.
 */
import { esPorDefecto } from "./condicion";
import type { Familia } from "./estilos";
import { PATRON_ID } from "./ids";
import { fueraDeCobertura } from "./medida";
import type { Gramatica, Mapa, TextoIdioma } from "./tipos";

export interface EntradaDeInforme {
  doc: "mapa";
  fase: 2;
  regla: string;
  ruta: string;
  id: string;
  idioma?: string;
  mensaje: string;
  alerta?: true;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Cuenta frases: puntos, signos de cierre y de exclamación seguidos de espacio o fin. */
function frases(texto: string): number {
  return texto.split(/[.!?](?:\s|$)/).filter((f) => f.trim().length > 0).length;
}

export interface ExcepcionesDeValidacion {
  /** Acepta el `papel` inicio/fin como comienzo y llegada de un recorrido (V5); el texto dice por qué. */
  "V5-papel"?: string;
  /** V7 pasa a alerta (mapa sin bloques); el texto dice por qué. */
  V7?: string;
}

/**
 * Las de planlang (desviación 6 del S3, enmiendas propuestas en `packages/diagramador/CONTRATO.lock`): se aceptan
 * con su razón escrita, nunca en silencio. Las pasa quien valida el mapa publicado (vitrina, pruebas, gate).
 */
export const EXCEPCIONES_PLANLANG: ExcepcionesDeValidacion = {
  "V5-papel":
    "planlang no pone nodos en las bandas entrada/salida; el recorrido empieza y termina en los nodos con papel inicio/fin (desviación 6 del S3)",
  V7: "el mapa de un agente no tiene bloques: la vista general son las bandas (desviación 6 del S3)",
};

export function validarMapa(
  mapa: Mapa,
  g: Gramatica,
  opciones: { cobertura?: Familia; excepciones?: ExcepcionesDeValidacion } = {},
): EntradaDeInforme[] {
  const exc = opciones.excepciones ?? {};
  const out: EntradaDeInforme[] = [];
  const falla = (
    regla: string,
    ruta: string,
    id: string,
    mensaje: string,
    idioma?: string,
    alerta?: true,
  ) =>
    out.push({
      doc: "mapa",
      fase: 2,
      regla,
      ruta,
      id,
      mensaje,
      ...(idioma ? { idioma } : {}),
      ...(alerta ? { alerta } : {}),
    });

  const bandas = new Set(g.bandas.map((b) => b.id));
  const tipos = new Set(g.tipos_de_nodo.map((t) => t.id));
  const modos = new Map(g.modos_de_flujo.map((m) => [m.id, m] as const));
  const madurez = new Set(g.escala_madurez.map((m) => m.id));
  const idiomas = [...g.idiomas].sort(cmp);

  const textos = (valor: TextoIdioma | undefined, ruta: string, id: string) => {
    if (!valor) return;
    const presentes = Object.keys(valor).sort(cmp);
    if (presentes.join(",") !== idiomas.join(","))
      falla(
        "V14",
        ruta,
        id,
        `trae ${presentes.join(", ") || "ningún idioma"}; la gramática declara ${idiomas.join(", ")}`,
      );
    if (opciones.cobertura)
      for (const idioma of idiomas) {
        const fuera = fueraDeCobertura(
          valor[idioma as keyof TextoIdioma] ?? "",
          opciones.cobertura,
        );
        if (fuera.length)
          falla(
            "V15",
            ruta,
            id,
            `caracteres fuera de la tabla: ${fuera.join(" ")}`,
            idioma,
          );
      }
  };

  // V7: número de bloques (excepción nombrada: el mapa de un agente no los tiene).
  const nb = mapa.bloques.length;
  if (nb < g.limites.bloques_min || nb > g.limites.bloques_max)
    falla(
      "V7",
      "/bloques",
      mapa.sujeto_id,
      `${nb} bloques; la gramática pide entre ${g.limites.bloques_min} y ${g.limites.bloques_max}${exc.V7 ? ` (excepción: ${exc.V7})` : ""}`,
      undefined,
      exc.V7 ? true : undefined,
    );

  // V6: ids únicos por colección (nodos, flujos, recorridos y los pasos de cada recorrido).
  for (const [col, lista] of [
    ["nodos", mapa.nodos],
    ["flujos", mapa.flujos],
    ["recorridos", mapa.recorridos],
    ...mapa.recorridos.map(
      (r, k) => [`recorridos/${k}/pasos`, r.pasos] as const,
    ),
  ] as const) {
    const vistos = new Set<string>();
    lista.forEach((x, i) => {
      if (!PATRON_ID.test(x.id))
        falla(
          "V6",
          `/${col}/${i}/id`,
          x.id,
          "id fuera del patrón del contrato",
        );
      if (vistos.has(x.id)) falla("V6", `/${col}/${i}/id`, x.id, "id repetido");
      vistos.add(x.id);
    });
  }

  const nodos = new Set(mapa.nodos.map((n) => n.id));
  const porBanda = new Map<string, number>();
  mapa.nodos.forEach((n, i) => {
    const r = `/nodos/${i}`;
    if (!bandas.has(n.banda_id))
      falla(
        "V2",
        `${r}/banda_id`,
        n.id,
        `banda «${n.banda_id}» no está en la gramática`,
      );
    if (!tipos.has(n.tipo_id))
      falla(
        "V2",
        `${r}/tipo_id`,
        n.id,
        `tipo «${n.tipo_id}» no está en la gramática`,
      );
    if (!madurez.has(n.madurez))
      falla(
        "V2",
        `${r}/madurez`,
        n.id,
        `madurez «${n.madurez}» no está en la gramática`,
      );
    // V3: al menos una fuente https completa; las de código (0.5.0) citan ruta (y líneas) sin URL.
    if (
      !n.fuentes.some(
        (f) => f.tipo !== "codigo" && f.url.startsWith("https://"),
      )
    )
      falla("V3", `${r}/fuentes`, n.id, "al menos una fuente https completa");
    n.fuentes.forEach((f, k) => {
      if (f.tipo === "codigo" && !f.ruta)
        falla("V3", `${r}/fuentes/${k}`, n.id, "fuente de código sin ruta");
    });
    for (const k of ["nombre", "lider", "experto", "por_que_importa"] as const)
      textos(n[k], `${r}/${k}`, n.id);
    n.fuentes.forEach((f, k) =>
      textos(f.titulo, `${r}/fuentes/${k}/titulo`, n.id),
    );
    for (const idioma of idiomas)
      if (
        frases(n.lider[idioma as keyof TextoIdioma] ?? "") >
        g.limites.frases_lider_max
      )
        falla(
          "V10",
          `${r}/lider`,
          n.id,
          `más de ${g.limites.frases_lider_max} frases`,
          idioma,
          true,
        );
    porBanda.set(n.banda_id, (porBanda.get(n.banda_id) ?? 0) + 1);
  });
  for (const [banda, k] of [...porBanda].sort((a, b) => cmp(a[0], b[0])))
    if (k > g.limites.nodos_por_banda_max)
      falla(
        "V11",
        "/nodos",
        banda,
        `${k} nodos en la banda; el máximo es ${g.limites.nodos_por_banda_max}`,
      );

  mapa.flujos.forEach((f, i) => {
    const r = `/flujos/${i}`;
    if (!nodos.has(f.origen))
      falla(
        "V4",
        `${r}/origen`,
        f.id,
        `origen «${f.origen}» no es un nodo del mapa`,
      );
    if (!nodos.has(f.destino))
      falla(
        "V4",
        `${r}/destino`,
        f.id,
        `destino «${f.destino}» no es un nodo del mapa`,
      );
    if (f.origen === f.destino)
      falla("V4", r, f.id, "un flujo de un nodo hacia sí mismo (F-024)");
    const modo = modos.get(f.modo_id);
    if (!modo)
      falla(
        "V2",
        `${r}/modo_id`,
        f.id,
        `modo «${f.modo_id}» no está en la gramática`,
      );
    else if (modo.exige_condicion && !f.condicion)
      falla(
        "V13",
        `${r}/condicion`,
        f.id,
        `el modo «${f.modo_id}» exige condición`,
      );
    textos(f.que_viaja, `${r}/que_viaja`, f.id);
    textos(f.lider, `${r}/lider`, f.id);
  });
  // V17: a lo sumo una rama por defecto por nodo de origen.
  const defectos = new Map<string, number>();
  for (const f of mapa.flujos)
    if (esPorDefecto(f.condicion))
      defectos.set(f.origen, (defectos.get(f.origen) ?? 0) + 1);
  for (const [origen, k] of [...defectos].sort((a, b) => cmp(a[0], b[0])))
    if (k > 1)
      falla(
        "V17",
        "/flujos",
        origen,
        `${k} ramas por defecto desde el mismo origen; a lo sumo una`,
      );

  // V5 y V12: los recorridos.
  const nodoDe = new Map(mapa.nodos.map((n) => [n.id, n] as const));
  const hayFlujo = new Set(mapa.flujos.map((f) => `${f.origen}>${f.destino}`));
  const ref = g.recorrido_referencia;
  const empieza = (id: string) => {
    const n = nodoDe.get(id);
    return (
      !!n &&
      (ref.desde_bandas.includes(n.banda_id) ||
        (!!exc["V5-papel"] && n.papel === "inicio"))
    );
  };
  const llega = (id: string) => {
    const n = nodoDe.get(id);
    return (
      !!n &&
      (ref.hasta_bandas.includes(n.banda_id) ||
        (!!exc["V5-papel"] && n.papel === "fin"))
    );
  };
  mapa.recorridos.forEach((rec, k) => {
    const r = `/recorridos/${k}`;
    textos(rec.titulo, `${r}/titulo`, rec.id);
    const posicion = new Map(rec.pasos.map((p, j) => [p.id, j] as const));
    const siguen = new Map<string, number>();
    rec.pasos.forEach((p, j) => {
      const rp = `${r}/pasos/${j}`;
      for (const c of ["que_pasa", "lider", "experto"] as const)
        textos(p[c], `${rp}/${c}`, p.id);
      if (!nodos.has(p.nodo_id))
        falla(
          "V5",
          `${rp}/nodo_id`,
          p.id,
          `«${p.nodo_id}» no es un nodo del mapa`,
        );
      const previo = p.sigue_de ?? (j > 0 ? rec.pasos[j - 1]!.id : undefined);
      if (previo === undefined) return;
      const jp = posicion.get(previo);
      if (jp === undefined || jp >= j) {
        falla(
          "V5",
          `${rp}/sigue_de`,
          p.id,
          `sigue a «${previo}», que no es un paso anterior de la lista (F-018)`,
        );
        return;
      }
      siguen.set(previo, (siguen.get(previo) ?? 0) + 1);
      const de = rec.pasos[jp]!.nodo_id;
      if (!hayFlujo.has(`${de}>${p.nodo_id}`))
        falla(
          "V5",
          rp,
          p.id,
          `ningún flujo declarado une «${de}» con «${p.nodo_id}»`,
        );
    });
    const primero = rec.pasos[0];
    if (primero && !empieza(primero.nodo_id))
      falla(
        "V5",
        `${r}/pasos/0`,
        rec.id,
        `empieza en «${primero.nodo_id}», fuera de ${ref.desde_bandas.join(", ")}`,
      );
    const hojas = rec.pasos.filter((p) => !siguen.has(p.id));
    const llegan = hojas.filter((p) => llega(p.nodo_id)).length;
    if (ref.llegadas === "todas" ? llegan < hojas.length : llegan === 0)
      falla(
        "V5",
        r,
        rec.id,
        `${ref.llegadas === "todas" ? "alguna rama no termina" : "ninguna rama termina"} en ${ref.hasta_bandas.join(", ")}`,
      );
    rec.pasos.forEach((p, j) => {
      const k2 = siguen.get(p.id) ?? 0;
      if (k2 >= 2 && !p.bifurca)
        falla(
          "V12",
          `${r}/pasos/${j}/bifurca`,
          p.id,
          `de este paso salen ${k2} y no declara si es paralela o alternativa`,
        );
      if (k2 < 2 && p.bifurca)
        falla(
          "V12",
          `${r}/pasos/${j}/bifurca`,
          p.id,
          "declara una bifurcación que no tiene",
        );
    });
  });

  textos(mapa.sujeto_nombre, "/sujeto_nombre", mapa.sujeto_id);

  return out.sort(
    (a, b) => cmp(a.doc, b.doc) || cmp(a.ruta, b.ruta) || cmp(a.regla, b.regla),
  );
}

/** Errores (no alertas). Un mapa con errores no se dibuja (G14). */
export function erroresDe(
  informe: readonly EntradaDeInforme[],
): EntradaDeInforme[] {
  return informe.filter((e) => !e.alerta);
}
