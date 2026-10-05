/**
 * Vista de P6 Caso: un caso de punta a punta desde su traza (`planlang-trace/v1`, verificada con la corrida), su
 * caso sintético y el plan. El esqueleto es común a los dos demos (la cabecera, el recorrido con la tabla de aristas
 * de cada decisión, las cifras, la ficha, la pausa, la salida y las señales); lo que recibió, qué hizo cada nodo, el
 * relato, el documento adverso y el expediente los aporta el perfil del demo (`caso-a.ts`, `caso-b.ts`) con las
 * plantillas de `src/textos/`: nada de un caso se escribe a mano. Pura.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { Traza } from "@core/formatos/traza";
import { CasosEjemplaresSchema, leerParaVista } from "@/lib/datos/esquemas";
import type { DatosDemo } from "@/lib/datos/vitrina";
import type { IdDemo } from "@/lib/demos";
import { DEMO_TEXTO } from "@/textos/demo";
import { ruta } from "@/lib/ruta";
import {
  CABECERA,
  CIFRAS,
  EJEMPLAR,
  ENTREGA,
  FICHA,
  HACE,
  PAUSA,
  PORTADA,
  RECORRIDO,
  SALIDA,
  SENALES,
  SUBTIPO,
  PIE_CASO,
} from "@/textos/caso";
import { SUBTIPO_B } from "@/textos/demo-b/caso";
import { perfilCasoA } from "./caso-a";
import { perfilCasoB } from "./caso-b";
import { sinTipo, valorLeido, type PerfilCaso } from "./caso-comun";
import { decimal, entero } from "./formato";
import { categoriaDeRegla, textoDeCategoria } from "./motivo-pausa";
import { pausaUnica } from "./plan-comun";
import type { Fila } from "./agente";
import { casosConPagina } from "./paginas-caso";

export interface ChipCaso {
  id: string;
  descriptor: string;
  enlace: string;
}

export interface FilaRegla {
  n: number;
  senal: string;
  regla: string;
  observado: string;
  cumple: boolean;
  rama: string | null;
  funcion: boolean;
}

export interface PasoCaso {
  n: number;
  nodo: string;
  tipo: string;
  medida: string;
  hizo: string;
  dialogo: Array<{ pregunta: string; respuesta: string }>;
  tecnico: string;
  rama: string | null;
  reglas: FilaRegla[];
}

export interface VistaCaso {
  id: string;
  descriptor: string;
  ejemplar: string | null;
  aprobado: boolean;
  /** Aprobado en parte (una determinación adversa parcial): ni «cumple» ni «no cumple», se pinta como alerta. */
  parcial: boolean;
  veredicto: string;
  persona: boolean;
  personaTexto: string;
  coincide: boolean;
  coincideTexto: string;
  debia: string;
  paso: string;
  recibe: {
    /** Lo que el agente leyó como texto, cada uno partido para marcar la instrucción escondida (índices impares). */
    documentos: Array<{ titulo: string; partes: string[] }>;
    /** Lo que acompaña la solicitud (la orden, el afiliado, la solicitud), con su ícono. */
    datos: Array<{
      icono: "orden" | "persona";
      titulo: string;
      detalle: string;
    }>;
  };
  hace: {
    sub: string;
    nodos: Array<{ nombre: string; tipo: string }>;
    relato: string;
  };
  entrega: Array<{ titulo: string; detalle?: string }>;
  cifras: Array<{ cifra: string; texto: string }>;
  ficha: Fila[];
  pasos: PasoCaso[];
  pausa: {
    porQue: string;
    motivoTecnico: string;
    senal: string;
    evidencia: string[];
    contraevidencia: string[];
    leyo: string;
    /** M-8: el resto del caso que viajó en la pausa (vacío en las corridas anteriores a la v1.5). */
    caso: string[];
    respuesta: string;
    nota: string;
  } | null;
  salida: { respuesta: string; aviso: string; guardia: Fila[] };
  documento: {
    encabezado: string;
    filas: Array<Fila & { nota?: string }>;
    /** El aviso de IA del documento; `null` si el documento no lo trae (la vista no lo inventa). */
    aviso: string | null;
    completo: string;
  } | null;
  senales: Fila[];
  senalesTitulo: string;
  /** El expediente con la cita de cada conclusión (demo B, RF-04b.7); `null` si el demo no escribe expediente. */
  expediente: {
    titulo: string;
    chip: string;
    lectura: string;
    cabecera: string;
    encabezado: string;
    conclusiones: Array<{
      id: string;
      texto: string;
      cita: string;
      citada: boolean;
    }>;
    cuenta: string;
  } | null;
  /** Los rótulos de sección que dependen del dominio (quién revisa, a quién se responde, qué documento). */
  textos: {
    pausaTitulo: string;
    pausaLectura: string;
    pausaRespondio: string;
    salidaRecibe: string;
    documentoTitulo: string;
    documentoLectura: string;
    documentoCabecera: string;
  };
}

const X = (t: TextoBilingue, i: Idioma) => t[i];

/** Cómo se nombra cada subtipo de caso sintético en el selector, por demo. */
const SUBTIPOS: Readonly<Record<IdDemo, Record<string, TextoBilingue>>> = {
  "demo-a": SUBTIPO,
  "demo-b": SUBTIPO_B,
};

/** El nombre de un subtipo en su demo (el Caso y el Playground lo dicen igual); sin nombre, el id tal cual. */
export function nombreDeSubtipo(demo: IdDemo, subtipo: string): TextoBilingue {
  return SUBTIPOS[demo][subtipo] ?? { es: subtipo, en: subtipo };
}

/** El documento de decisión adversa como lo escribe el grafo (`planlang-documento-adverso/v1`). */
const OPERADOR: Record<string, string> = {
  menor_que: "<",
  menor_o_igual_que: "≤",
  mayor_que: ">",
  mayor_o_igual_que: "≥",
  igual_a: "=",
  distinto_de: "≠",
};

/** El valor como lo declara la regla (código: `true`, `urgencia`, `U1 = 0,75`). */
function valorDeclarado(
  declarado: unknown,
  aplicado: unknown,
  i: Idioma,
): string {
  if (typeof declarado === "string" && declarado.startsWith("umbral."))
    return `${declarado.slice("umbral.".length)} = ${
      typeof aplicado === "number" && !Number.isInteger(aplicado)
        ? decimal(aplicado, 2, i)
        : String(aplicado)
    }`;
  return String(declarado);
}

/** Los casos para el selector, en el orden de la corrida. */
export function chipsDeCasos(d: DatosDemo, i: Idioma): ChipCaso[] {
  const subtipos = new Map<string, string>(
    d.lote.casos.map((c) => [c.id, c.subtipo] as [string, string]),
  );
  const conPagina = casosConPagina(d);
  return d.corrida.trazas.filter((t) => conPagina.has(t.caso_id)).map((t) => {
    const subtipo = subtipos.get(t.caso_id)!;
    return {
      id: t.caso_id,
      descriptor: X(SUBTIPOS[d.id][subtipo] ?? { es: subtipo, en: subtipo }, i),
      enlace: ruta(i, "caso", t.caso_id, d.id),
    };
  });
}

/** Los casos que tienen página (`casosConPagina`): uno por traza en una corrida de 20, una selección en la de 200. */
export function idsDeCasos(d: DatosDemo): string[] {
  return [...casosConPagina(d)];
}

/** El pie de las páginas que leen la corrida (Casos, Plan): qué corrida, de qué sprint, cuántos casos y con qué modelo. */
export function pieDeCorrida(d: DatosDemo, i: Idioma): string {
  return X(
    PIE_CASO({
      corrida: d.corrida.manifiesto.corrida_id,
      sprint: d.manifiesto.corrida.sprint,
      fecha: d.corrida.manifiesto.fecha,
      n: d.corrida.trazas.length,
      repeticiones: 1 + d.manifiesto.repeticiones.length,
      base: d.manifiesto.linea_base !== null,
      modelo: d.corrida.manifiesto.modelo,
    }),
    i,
  );
}

export function portadaCasos(d: DatosDemo, i: Idioma) {
  return {
    antetitulo: X(
      PORTADA.antetitulo({
        demo: DEMO_TEXTO[d.id].corto,
        corrida: d.corrida.manifiesto.corrida_id,
      }),
      i,
    ),
    antetituloIndice: X(
      PORTADA.antetituloIndice({
        demo: DEMO_TEXTO[d.id].corto,
        corrida: d.corrida.manifiesto.corrida_id,
        n: d.corrida.trazas.length,
      }),
      i,
    ),
    pie: pieDeCorrida(d, i),
  };
}

/** Lo que el esqueleto lee del caso sintético, igual en los dos demos. */
interface CasoComun {
  tipo: string;
  subtipo: string;
  semilla: string;
  esperado: TextoBilingue;
  verdad_conocida: { decision: string; debe_escalar: boolean };
}

/** El perfil del demo para un caso, o el error que nombra el caso si la corrida o el lote no lo traen. */
function perfilDe(
  d: DatosDemo,
  t: Traza | undefined,
  id: string,
  i: Idioma,
): { perfil: PerfilCaso; caso: CasoComun; t: Traza } {
  const falta = () => new Error(`vitrina: la corrida no trae el caso «${id}»`);
  // Un `switch` sin `default`: un demo nuevo no compila hasta tener su perfil.
  switch (d.id) {
    case "demo-a": {
      const c = d.lote.casos.find((x) => x.id === id);
      if (!t || !c) throw falta();
      return { perfil: perfilCasoA(d, t, c, i), caso: c, t };
    }
    case "demo-b": {
      const c = d.lote.casos.find((x) => x.id === id);
      if (!t || !c) throw falta();
      return { perfil: perfilCasoB(d, t, c, i), caso: c, t };
    }
  }
}

export function vistaCaso(d: DatosDemo, id: string, i: Idioma): VistaCaso {
  const {
    perfil,
    caso: c,
    t,
  } = perfilDe(
    d,
    d.corrida.trazas.find((x) => x.caso_id === id),
    id,
    i,
  );
  const s = t.senales;
  const final = String(s.decision_final);
  const aprobado = final === "aprobar";
  const parcial = perfil.parcial !== undefined && final === perfil.parcial.valor;
  const persona = s.pausa_humana === true;
  const v = c.verdad_conocida;
  const coincide = final === v.decision && persona === v.debe_escalar;
  const tipoDe = new Map(
    d.plan.contrato_de_grafo.nodos_esperados.map(
      (n) => [n.id, n.tipo] as const,
    ),
  );

  // ── ejemplar del informe ──────────────────────────────────────────────────────────────────────────
  const ejemplares =
    leerParaVista(
      CasosEjemplaresSchema,
      (d.informe as { casos_ejemplares?: unknown }).casos_ejemplares,
      "casos_ejemplares del informe",
    ) ?? {};
  const ejemplar = Object.entries(ejemplares).find(
    ([, x]) => x?.caso_id === id,
  )?.[0];

  // ── los pasos ────────────────────────────────────────────────────────────────────────────────────
  const pasos: PasoCaso[] = t.pasos.map((p) => {
    const tokens = p.tokens.entrada + p.tokens.salida;
    const dec = t.decisiones_de_arista
      .filter((x) => x.paso === p.orden)
      .sort((a, b) => a.orden_arista - b.orden_arista);
    const decisora = dec.find((x) => x.resultado);
    const reglas: FilaRegla[] = dec.map((x, k) => ({
      n: x.orden_arista,
      senal:
        x.tipo === "funcion"
          ? `${x.funcion}(${Object.keys(x.entradas ?? {}).join(", ")})`
          : String(x.senal),
      regla:
        x.tipo === "funcion"
          ? X(RECORRIDO.funcion, i)
          : `${OPERADOR[String(x.operador)] ?? x.operador} ${valorDeclarado(x.valor_declarado, x.umbral_aplicado, i)}`,
      observado:
        x.tipo === "funcion"
          ? Object.entries(x.entradas ?? {})
              .map(([kk, vv]) => `${kk} = ${String(vv)}`)
              .join(", ")
          : valorLeido(x.valor_observado, i),
      cumple: x.resultado === true,
      rama:
        x === decisora || (!decisora && k === dec.length - 1)
          ? x.rama_tomada
          : null,
      funcion: x.tipo === "funcion",
    }));
    const nodo = p.nodo;
    const { hizo, dialogo } = perfil.hizo(p);
    let rama: string | null = null;
    if (dec.length) {
      const r = perfil.ramas[nodo];
      if (r)
        rama = X(
          textoDeCategoria(
            r,
            decisora ? categoriaDeRegla(decisora, d.id) : "defecto",
            `RAMA.${nodo} (${perfil.dondeRamas})`,
          ),
          i,
        );
    }
    return {
      n: p.orden,
      nodo,
      tipo: tipoDe.get(nodo) ?? p.tipo_nodo ?? sinTipo(nodo),
      medida:
        tokens > 0
          ? X(
              RECORRIDO.medida({
                s: decimal(p.duracion_ms / 1000, 1, i),
                tokens: entero(tokens, i),
              }),
              i,
            )
          : X(RECORRIDO.sinModelo, i),
      hizo,
      dialogo,
      tecnico: X(
        RECORRIDO.tecnico({
          tipo: p.tipo_nodo ?? "—",
          entrada: p.tokens.entrada,
          salida: p.tokens.salida,
          ms: p.duracion_ms,
          usd: p.costo_nominal_usd.toFixed(6),
          reintentos: p.reintentos_esquema,
        }),
        i,
      ),
      rama,
      reglas,
    };
  });

  // ── cifras y ficha ───────────────────────────────────────────────────────────────────────────────
  const conModelo = t.pasos.filter(
    (p) => p.tokens.entrada + p.tokens.salida > 0,
  ).length;
  const usd = t.pasos.reduce((a, p) => a + p.costo_nominal_usd, 0);
  const cifras = [
    {
      cifra: `${decimal(Number(s.latencia_total_s), 1, i)} s`,
      texto: X(CIFRAS.puntaAPunta, i),
    },
    { cifra: String(t.pasos.length), texto: X(CIFRAS.pasos, i) },
    { cifra: String(conModelo), texto: X(CIFRAS.llamadas, i) },
    { cifra: entero(Number(s.tokens), i), texto: X(CIFRAS.tokens, i) },
    { cifra: decimal(usd, 4, i), texto: X(CIFRAS.usd, i) },
  ];
  const ficha: Fila[] = [
    { k: X(FICHA.traza, i), v: `${t.formato} · \`${t.huella}\`` },
    {
      k: X(FICHA.corrida, i),
      v: X(
        FICHA.corridaTexto({
          corrida: t.corrida_id,
          variante: t.variante,
          resultado: t.resultado,
        }),
        i,
      ),
    },
    {
      k: X(FICHA.errores, i),
      v: X(
        FICHA.erroresTexto({
          proveedor: t.error_proveedor ? String(t.error_proveedor) : null,
          esquema: t.error_de_esquema_en_traspaso === true,
        }),
        i,
      ),
    },
    { k: X(FICHA.verdad, i), v: perfil.verdad },
    {
      k: X(FICHA.caso, i),
      v: X(
        FICHA.casoTexto({
          tipo: c.tipo,
          subtipo: c.subtipo,
          semilla: c.semilla,
        }),
        i,
      ),
    },
  ];

  // ── pausa y salida ───────────────────────────────────────────────────────────────────────────────
  const pausa = pausaUnica(t.pausas_humanas, `el caso ${t.caso_id}`);
  const pl = perfil.pausa;
  const g = t.guardia_salida;
  const vista: VistaCaso = {
    id,
    descriptor: X(
      SUBTIPOS[d.id][c.subtipo] ?? { es: c.subtipo, en: c.subtipo },
      i,
    ),
    ejemplar: ejemplar && EJEMPLAR[ejemplar] ? X(EJEMPLAR[ejemplar]!, i) : null,
    aprobado,
    parcial,
    veredicto: X(
      aprobado
        ? CABECERA.aprobado
        : parcial
          ? perfil.parcial!.veredicto
          : perfil.noAprobado,
      i,
    ),
    persona,
    personaTexto: X(persona ? CABECERA.conPersona : CABECERA.sinPersona, i),
    coincide,
    coincideTexto: X(coincide ? CABECERA.coincide : CABECERA.noCoincide, i),
    debia: X(c.esperado, i),
    paso: X(
      CABECERA.pasoTexto({ decision: perfil.decision(final), persona }),
      i,
    ),
    recibe: perfil.recibe,
    hace: {
      sub: X(HACE.pasos(t.pasos.length), i),
      nodos: t.nodos_visitados.map((n) => ({
        nombre: n,
        tipo: tipoDe.get(n) ?? sinTipo(n),
      })),
      relato: perfil.relato.join(" "),
    },
    entrega: [
      ...perfil.entrega,
      { titulo: X(ENTREGA.traza, i), detalle: `${t.huella.slice(0, 12)}…` },
    ],
    cifras,
    ficha,
    pasos,
    pausa:
      pausa && pl
        ? {
            porQue: (() => {
              const m = X(pl.motivo, i);
              return `${m.charAt(0).toUpperCase()}${m.slice(1)}.`;
            })(),
            motivoTecnico: X(pl.motivoTecnico, i),
            senal: X(
              PAUSA.senal({
                senal: pl.senal,
                declarado: String(pl.umbral?.declarado ?? "—"),
                aplicado: String(pl.umbral?.aplicado ?? "—"),
                nodo: pausa.nodo,
                paso: pausa.paso,
                rol: pausa.rol,
              }),
              i,
            ),
            evidencia: pl.evidencia.map((x) => X(x, i)),
            contraevidencia: pl.contraevidencia.map((x) => X(x, i)),
            leyo: pl.leyo,
            caso: pl.caso,
            respuesta: valorLeido(pausa.respuesta_simulada.decision, i),
            nota: pl.nota,
          }
        : null,
    salida: {
      respuesta: t.salida_final ? X(t.salida_final, i) : "—",
      aviso: t.salida_final ? X(t.salida_final.aviso_ia, i) : "",
      guardia: [
        {
          k: X(SALIDA.intentadas, i),
          v: "",
          codigos: g?.acciones_intentadas ?? [],
        },
        {
          k: X(SALIDA.ejecutadas, i),
          v: "",
          codigos: g?.acciones_ejecutadas ?? [],
        },
        {
          k: X(SALIDA.instruccion, i),
          v: X(
            g?.carga_detectada_en_entrada ? SALIDA.detectada : SALIDA.ninguna,
            i,
          ),
        },
        { k: X(SALIDA.hallazgos, i), v: String(g?.hallazgos.length ?? 0) },
        { k: X(SALIDA.severidad, i), v: String(g?.severidad_accion ?? 0) },
      ],
    },
    documento: perfil.documento,
    senales: Object.keys(s)
      .sort()
      .map((k) => ({
        k,
        v:
          k === "latencia_total_s"
            ? decimal(Number(s[k]), 2, i)
            : k === "tokens"
              ? String(s[k])
              : valorLeido(s[k], i),
      })),
    senalesTitulo: X(SENALES.titulo(Object.keys(s).length), i),
    expediente: perfil.expediente,
    textos: perfil.textos,
  };
  return vista;
}
