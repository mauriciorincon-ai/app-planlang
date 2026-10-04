/**
 * Validación en código del mapa (contrato del diagramador § 7, fase 2): las reglas que el esquema no puede
 * ver. La fase 1 (esquema JSON con Ajv) corre en las pruebas contra la copia fijada de `mapa.schema.json`.
 * Informe con la forma del contrato: `{ doc, fase, regla, ruta, id, idioma?, mensaje }`, ordenado por
 * `(doc, ruta, regla)`. Sin dato válido no hay dibujo (G14).
 */
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

export function validarMapa(
  mapa: Mapa,
  g: Gramatica,
  opciones: { cobertura?: Familia } = {},
): EntradaDeInforme[] {
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

  // V6: ids únicos por colección.
  for (const [col, lista] of [
    ["nodos", mapa.nodos],
    ["flujos", mapa.flujos],
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
    if (
      !n.fuentes.length ||
      n.fuentes.some((f) => !f.url.startsWith("https://"))
    )
      falla("V3", `${r}/fuentes`, n.id, "al menos una fuente https completa");
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
