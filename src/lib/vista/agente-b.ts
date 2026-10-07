/**
 * El perfil del demo B (vinculación con debida diligencia) en P3 Agente: su ficha, la frase «En los N casos» de cada
 * nodo, sus tablas de trazas y la arista de la coincidencia de nombre. Lo común a los dos demos vive en `agente.ts`;
 * aquí, lo que solo el B sabe contar (las listas, la zona gris, el investigador, el puntaje y el expediente).
 */
import { mediana } from "@core/brecha/numeros";
import { minutosPorPersona } from "@core/playground/compactar";
import type { TextoBilingue } from "@core/formatos/bilingue";
import type { Traza } from "@core/formatos/traza";
import { esAristaTripleta } from "@core/plan/esquema";
import type { CasoB } from "@core/sintetico/demo-b/esquema";
import type { DatosDemoB } from "@/lib/datos/vitrina";
import {
  ARISTA_U1,
  CIFRAS_ACTIVIDAD,
  CIFRAS_PUEDE,
  EXPERTO,
  FICHA,
  PANEL,
  TIPO_DE_CASO,
  frasesDeCriterios,
} from "@/textos/agente";
import { CHIP_CORRIDA, FRACCION } from "@/textos/comun";
import {
  ACTIVIDADES_B,
  ARISTA_B,
  CIFRAS_ACTIVIDAD_B,
  CIFRAS_PUEDE_B,
  CRITERIOS_EN_LA_CORRIDA_B,
  CRITERIOS_NUNCA_B,
  EXPERTO_B,
  FICHA_B,
  MOTIVO_PAUSA_B,
  NODOS_B,
  NOTA_TRAZAS_B,
  PLAN_POR_NODO_B,
  PORTADA_B,
  PRODUCTO_B,
  PUEDE_B,
  TRAZAS_DE_NODO_B,
  VALORES_B,
  type CifrasDeNodoB,
  type ClaveActividadB,
  type ClavePuedeB,
} from "@/textos/demo-b/agente";
import type { Grupo, VistaAgente } from "./agente";
import {
  siNo,
  tiempoSalidaCosto,
  valorDeUmbral,
  visitas,
  type ContextoAgente,
  type PerfilAgente,
} from "./agente-comun";
import { decimal, decimalesDe, entero, enumerar } from "./formato";
import {
  CATEGORIAS,
  categoriaDeRegla,
  reglaDelPlan,
  textoDeCategoria,
  umbralDeCategoria,
  type CategoriaRegla,
} from "./motivo-pausa";
import { pausaDelPlan, pausaUnica } from "./plan-comun";
import { delVocabulario } from "./vocabulario";

const T_NODOS = "NODOS_B (src/textos/demo-b/agente.ts)";
const T_NODO = "TRAZAS_DE_NODO_B (src/textos/demo-b/agente.ts)";
const DEMO = "demo-b";

export function perfilDemoB(d: DatosDemoB, ctx: ContextoAgente): PerfilAgente {
  const {
    i,
    X,
    XP,
    trazas,
    n,
    corrida,
    sprint,
    fecha,
    modelo,
    marca,
    cumple,
    estado,
    supuestoDeLineaBase,
    con,
    pasosDe,
    senal,
    pausas,
    motivoDe,
  } = ctx;
  const casoDe = new Map<string, CasoB>(d.lote.casos.map((c) => [c.id, c]));
  const decisionFinal = (t: Traza) => senal(t, "decision_final");
  // El plan B no declara minutos de oficial por caso: la ficha cuenta casos (como el playground), no minutos.
  const costoHumano = minutosPorPersona(d.plan);
  const uRiesgo = umbralDeCategoria(d.plan, "riesgo", DEMO);
  const uZonaGris = umbralDeCategoria(d.plan, "zonaGris", DEMO);

  // ── cifras por nodo ──────────────────────────────────────────────────────────────────────────────
  const dec = con("decision").flatMap((t) =>
    visitas(t, "decision").map((v) => ({ t, v })),
  );
  const porRegla = Object.fromEntries(
    CATEGORIAS[DEMO].map((c) => [c, 0]),
  ) as Record<CategoriaRegla, number>;
  for (const { v } of dec)
    if (v.regla) porRegla[categoriaDeRegla(v.regla, DEMO)]++;
  const conclusion = (c: string) =>
    con("investigador")
      .filter((t) => t.investigacion?.conclusion === c)
      .map((t) => t.caso_id);
  const cargas = trazas
    .filter((t) => senal(t, "carga_detectada") === true)
    .map((t) => t.caso_id);
  const documentos = trazas.filter(
    (t) =>
      t.documento_adverso &&
      t.documento_adverso.completo &&
      t.documento_adverso.idiomas.join() === "es,en",
  ).length;
  const cifras = (nodo: string, crit: string[]): CifrasDeNodoB => ({
    total: n,
    casos: con(nodo).length,
    visitas: pasosDe(nodo).length,
    criterios: frasesDeCriterios(crit, estado),
    cargas,
    reintentos: pasosDe(nodo).reduce((a, p) => a + p.reintentos_esquema, 0),
    faltantes: trazas
      .filter((t) => (t.extraccion?.campos_faltantes.length ?? 0) > 0)
      .map((t) => t.caso_id),
    exactas: trazas.filter((t) => t.coincidencias?.mejor?.exacta === true)
      .length,
    zonaGris: con("investigador").length,
    mismaPersona: conclusion("misma_persona"),
    homonimos: conclusion("homonimo"),
    umbralRiesgo: Number(uRiesgo.valor_en_plan),
    // Lo que evaluó el propio grafo (la regla «riesgo» cumplida), no una comparación rehecha aquí.
    riesgoAlto: trazas.filter((t) =>
      t.decisiones_de_arista.some(
        (x) => x.resultado && categoriaDeRegla(x, DEMO) === "riesgo",
      ),
    ).length,
    conInconsistencias: trazas.filter(
      (t) => Number(senal(t, "inconsistencias") ?? 0) > 0,
    ).length,
    proponeRechazar: trazas.filter((t) => senal(t, "propuesta") === "rechazar")
      .length,
    solos: dec.filter(({ v }) => v.rama !== "pausa_humana").length,
    aPersona: dec.filter(({ v }) => v.rama === "pausa_humana").length,
    porRegla,
    pausas: pausas.length,
    rechazo: pausas.filter(
      ({ p }) => p.respuesta_simulada.decision === "rechazar",
    ).length,
    aprobo: pausas.filter(
      ({ p }) => p.respuesta_simulada.decision === "aprobar",
    ).length,
    conclusiones: trazas.reduce(
      (a, t) => a + (t.expediente?.conclusiones.length ?? 0),
      0,
    ),
    sinCita: trazas.reduce(
      (a, t) => a + (t.expediente?.conclusiones_sin_cita ?? 0),
      0,
    ),
    documentos,
    hallazgos: trazas.reduce(
      (a, t) => a + (t.guardia_salida?.hallazgos.length ?? 0),
      0,
    ),
    severidadMax: Math.max(
      0,
      ...trazas.map((t) => t.guardia_salida?.severidad_accion ?? 0),
    ),
    neutralizadas: trazas
      .filter((t) => senal(t, "inyeccion_neutralizada") === true)
      .map((t) => t.caso_id),
    accion: [
      ...new Set(
        trazas.flatMap((t) => t.guardia_salida?.acciones_ejecutadas ?? []),
      ),
    ].join(", "),
  });
  const cifrasDe = Object.fromEntries(
    Object.keys(NODOS_B).map((k) => [
      k,
      cifras(k, CRITERIOS_EN_LA_CORRIDA_B[k] ?? []),
    ]),
  ) as Record<string, CifrasDeNodoB>;
  const cifrasDelNodo = (nodo: string) =>
    delVocabulario(
      cifrasDe,
      nodo,
      "las cifras por nodo (src/lib/vista/agente-b.ts)",
    );

  // ── ficha ───────────────────────────────────────────────────────────────────────────────────────
  const aprobadas = trazas.filter((t) => decisionFinal(t) === "aprobar").length;
  const rechazadas = trazas.filter(
    (t) => decisionFinal(t) === "rechazar",
  ).length;
  const campos = pausaDelPlan(d.plan.contrato_de_grafo.pausas_humanas)
    .payload_minimo.length;
  const aPersona = trazas.filter(
    (t) => senal(t, "pausa_humana") === true,
  ).length;
  const cE = cifrasDelNodo("pausa_humana");
  const cifrasActividad: Record<ClaveActividadB, TextoBilingue> = {
    revisaEntrada: CIFRAS_ACTIVIDAD_B.cargas({ n: cargas.length, de: n }),
    lee: CIFRAS_ACTIVIDAD.casos({ n: con("extractor").length }),
    cruza: CIFRAS_ACTIVIDAD.sinModelo(con("verificador_listas").length),
    investiga: CIFRAS_ACTIVIDAD_B.zonaGris(con("investigador").length),
    puntua: CIFRAS_ACTIVIDAD.sinModelo(con("puntaje").length),
    decide: CIFRAS_ACTIVIDAD.aPersona({ n: aPersona, de: n }),
    responde: CIFRAS_ACTIVIDAD_B.expedientes({
      n: con("redactor").length,
      documentos,
    }),
  };
  const corrioActividad: Record<ClaveActividadB, boolean> = {
    revisaEntrada: con("enrutador").length > 0,
    lee: con("extractor").length > 0,
    cruza: con("verificador_listas").length > 0,
    investiga: con("investigador").length > 0,
    puntua: con("puntaje").length > 0,
    decide: con("decision").length > 0 && pausas.length > 0,
    responde: con("redactor").length > 0 && con("guardia_salida").length > 0,
  };
  const latencias = trazas.map((t) => Number(senal(t, "latencia_total_s")));
  const tokens = trazas.map((t) => Number(senal(t, "tokens")));
  const masLargo = trazas[tokens.indexOf(Math.max(...tokens))]!;
  const costoTotal = trazas.reduce(
    (a, t) => a + t.pasos.reduce((b, p) => b + p.costo_nominal_usd, 0),
    0,
  );
  const coinciden = trazas.filter((t) => {
    const v = casoDe.get(t.caso_id)!.verdad_conocida;
    return (
      decisionFinal(t) === v.decision &&
      senal(t, "pausa_humana") === v.debe_escalar
    );
  }).length;
  const promedio = latencias.reduce((a, b) => a + b, 0) / n;
  const loteCompleto = d.plan.lotes.completo;
  const adversarios = cargas.length
    ? cargas
    : d.lote.casos
        .filter((c) => c.tipo === "adversario")
        .map((c) => c.id)
        .slice(0, 1);
  const cifrasPuede: Record<ClavePuedeB, TextoBilingue> = {
    lee: CIFRAS_PUEDE.lee({
      casos: con("extractor").length,
      reintentos: cifrasDelNodo("extractor").reintentos,
    }),
    investiga: CIFRAS_PUEDE_B.investiga({
      n: con("investigador").length,
      misma: conclusion("misma_persona").length,
      homonimos: conclusion("homonimo").length,
    }),
    listas: CIFRAS_PUEDE.cobertura(con("verificador_listas").length),
    pausas: CIFRAS_PUEDE.pausas(pausas.length),
    inyeccion: CIFRAS_PUEDE.inyeccion(enumerar(adversarios, i)),
  };
  const sinFondos = d.lote.casos.filter(
    (c) => c.entrada.documentos.fondos === null,
  ).length;
  const listas = d.listas.listas;

  const ficha: VistaAgente["ficha"] = {
    objetivo: X(FICHA_B.objetivo),
    recibe: [
      {
        titulo: X(FICHA_B.recibe.identidad.titulo),
        detalle: X(FICHA_B.recibe.identidad.detalle(n)),
        corrio: true,
      },
      {
        titulo: X(FICHA_B.recibe.actividad.titulo),
        detalle: X(FICHA_B.recibe.actividad.detalle),
        corrio: true,
      },
      {
        titulo: X(FICHA_B.recibe.fondos.titulo),
        detalle: X(FICHA_B.recibe.fondos.detalle({ sin: sinFondos, de: n })),
        corrio: true,
      },
      {
        titulo: X(FICHA_B.recibe.listas.titulo),
        detalle: X(
          FICHA_B.recibe.listas.detalle({
            vinculantes: listas.filter((l) => l.vinculante).length,
            consulta: listas.filter((l) => !l.vinculante).length,
            entradas: listas.reduce((a, l) => a + l.entradas.length, 0),
          }),
        ),
        corrio: true,
      },
    ],
    hace: {
      sub: X(FICHA.hace.sub(ACTIVIDADES_B.length)),
      items: ACTIVIDADES_B.map((a, k) => ({
        n: k + 1,
        titulo: XP(a.titulo),
        detalle: X(cifrasActividad[a.clave]),
        nodos: [...a.nodos],
        flecha: a.flecha === true,
        corrio: corrioActividad[a.clave],
      })),
    },
    entrega: [
      {
        titulo: X(FICHA_B.entrega.aprobacion.titulo),
        detalle: X(FICHA_B.entrega.aprobacion.detalle({ n: aprobadas, de: n })),
        corrio: aprobadas > 0,
      },
      {
        titulo: X(FICHA_B.entrega.escalamiento.titulo),
        detalle: X(
          FICHA_B.entrega.escalamiento.detalle({
            campos,
            pausas: pausas.length,
            aprobo: cE.aprobo,
            rechazo: cE.rechazo,
          }),
        ),
        corrio: pausas.length > 0,
      },
      {
        titulo: X(FICHA_B.entrega.rechazo.titulo),
        detalle: X(FICHA_B.entrega.rechazo.detalle({ n: rechazadas, de: n })),
        corrio: rechazadas > 0,
      },
      {
        titulo: X(FICHA_B.entrega.expediente.titulo),
        detalle: X(FICHA_B.entrega.expediente.detalle(n)),
        corrio: true,
      },
    ],
    leyenda: X(FICHA.leyenda({ n: ACTIVIDADES_B.length, casos: n, sprint })),
    puede: PUEDE_B.map((p) => ({
      titulo: X(p.titulo),
      detalle: X(cifrasPuede[p.clave]),
      corrio: true,
    })),
    nunca: {
      items: FICHA_B.nunca.map((x) => ({
        titulo: X(x.titulo),
        detalle: X(x.refs),
      })),
      nota: X(
        FICHA.nunca.nota({
          corrida,
          criterios: enumerar(CRITERIOS_NUNCA_B.filter(cumple), i),
          rotas: CRITERIOS_NUNCA_B.filter((c) => !cumple(c)).length,
        }),
      ),
    },
    participan: d.plan.actores.map((a) => ({
      id: a.id,
      titulo: a[i],
      detalle: X(
        delVocabulario(
          FICHA_B.papel,
          a.id,
          "FICHA_B.papel (src/textos/demo-b/agente.ts)",
        ),
      ),
    })),
    capacidad: [
      {
        cifra: decimal(mediana(latencias) ?? 0, 1, i),
        unidad: "s",
        texto: X(FICHA.capacidad.porCaso),
        detalle: X(
          FICHA_B.capacidad.rango({
            min: decimal(Math.min(...latencias), 1, i),
            max: decimal(Math.max(...latencias), 1, i),
          }),
        ),
      },
      {
        cifra: decimal(costoTotal / n, 3, i),
        unidad: "USD",
        texto: X(FICHA.capacidad.costoPorCaso),
        detalle: X(
          FICHA.capacidad.costoTotal({ total: decimal(costoTotal, 2, i), n }),
        ),
      },
      {
        cifra: entero(mediana(tokens) ?? 0, i),
        texto: X(FICHA.capacidad.tokens),
        detalle: X(
          FICHA_B.capacidad.tokensRango({
            min: entero(Math.min(...tokens), i),
            max: entero(Math.max(...tokens), i),
            caso: masLargo.caso_id,
            investigador: masLargo.nodos_visitados.includes("investigador"),
          }),
        ),
      },
      {
        cifra: X(FRACCION({ a: aPersona, b: n })),
        texto: X(FICHA.capacidad.aPersona),
        detalle:
          costoHumano === null
            ? X(FICHA_B.capacidad.sinMinutos)
            : X(
                FICHA.capacidad.minutos({
                  min: aPersona * costoHumano,
                  porCaso: costoHumano,
                }),
              ),
      },
      {
        cifra: X(FRACCION({ a: coinciden, b: n })),
        texto: X(FICHA.capacidad.caminos),
        detalle: X(FICHA.capacidad.caminosDetalle),
      },
      {
        cifra: `≈ ${Math.round((promedio * loteCompleto) / 60)} min`,
        texto: X(FICHA.capacidad.lote(loteCompleto)),
        detalle: X(
          FICHA.capacidad.loteDetalle({
            promedio: decimal(promedio, 1, i),
            usd: decimal((costoTotal / n) * loteCompleto, 1, i),
          }),
        ),
        estimacion: true,
      },
    ],
    fuente: X(
      FICHA_B.fuente({
        plan: corrida,
        corrida: d.corrida.manifiesto.corrida_id,
        sprint,
        fecha,
        n,
        modelo,
      }),
    ),
    chip: X(CHIP_CORRIDA(corrida)),
    marca,
  };

  // ── arquitectura (experto) ──────────────────────────────────────────────────────────────────────
  const lineaBase = supuestoDeLineaBase();
  const arquitectura: Grupo = {
    rotulo: X(EXPERTO.arquitectura.rotulo),
    filas: [
      { k: X(EXPERTO.arquitectura.patron[0]!), v: X(EXPERTO_B.patron) },
      { k: X(EXPERTO.arquitectura.decision[0]!), v: X(EXPERTO_B.decision) },
      {
        k: X(EXPERTO.arquitectura.lineaBase),
        v: X(EXPERTO_B.lineaBaseTexto(lineaBase.estado === "refutado")),
      },
      {
        k: X(EXPERTO.arquitectura.orquestacion[0]!),
        v: X(EXPERTO.arquitectura.orquestacion[1]!),
      },
    ],
  };

  // ── tablas de trazas ────────────────────────────────────────────────────────────────────────────
  const valor = (v: unknown) =>
    typeof v === "string" && VALORES_B[v] ? X(VALORES_B[v]!) : String(v ?? "—");
  /** El nodo que siguió a otro en el caso (para los nodos sin reglas, que no registran rama). */
  const siguiente = (t: Traza, nodo: string) =>
    t.nodos_visitados[t.nodos_visitados.indexOf(nodo) + 1] ?? "—";
  const documentosDe = (c: CasoB) =>
    [
      c.entrada.documentos.identidad,
      c.entrada.documentos.actividad,
      c.entrada.documentos.fondos,
    ]
      .filter((x) => x !== null)
      .map((x) => x[i])
      .join(" ");
  const filaTraza: PerfilAgente["filaTraza"] = (t, nodo) => {
    const caso = casoDe.get(t.caso_id)!;
    const vs = visitas(t, nodo);
    const ultima = vs[vs.length - 1];
    const mejor = t.coincidencias?.mejor ?? null;
    const similitud = mejor
      ? decimal(mejor.similitud, decimalesDe(mejor.similitud), i)
      : "—";
    const pausa = pausaUnica(t.pausas_humanas, `el caso ${t.caso_id}`);
    const et = delVocabulario(TRAZAS_DE_NODO_B, nodo, T_NODO).detalle.map((x) =>
      X(x),
    );
    let celdas: string[] = [];
    let pares: Array<{ k: string; v: string }> = [];
    let barra: { valor: number; umbral: number } | undefined;
    switch (nodo) {
      case "enrutador": {
        const carga = senal(t, "carga_detectada") === true;
        celdas = [siNo(carga, i), carga ? "RG-01" : "—", siguiente(t, nodo)];
        pares = [
          {
            k: et[0]!,
            v: X(
              delVocabulario(
                PRODUCTO_B,
                caso.entrada.solicitud.producto,
                "PRODUCTO_B (src/textos/demo-b/agente.ts)",
              ),
            ),
          },
        ];
        break;
      }
      case "extractor":
        celdas = [
          siNo(senal(t, "extraccion_correcta") === true, i),
          String(t.extraccion?.campos_faltantes.length ?? 0),
          tiempoSalidaCosto(t, nodo, i),
        ];
        pares = [
          {
            k: et[0]!,
            v: String(t.pasos.filter((p) => p.nodo === nodo).length),
          },
          {
            k: et[1]!,
            v: String(
              t.pasos
                .filter((p) => p.nodo === nodo)
                .reduce((a, p) => a + p.reintentos_esquema, 0),
            ),
          },
        ];
        break;
      case "verificador_listas":
        celdas = [similitud, mejor?.entrada_id ?? "—", ultima?.rama ?? "—"];
        pares = [
          {
            k: et[0]!,
            v: mejor
              ? `${mejor.lista_id} · ${X(mejor.vinculante ? VALORES_B.vinculante! : VALORES_B.consulta!)}`
              : "—",
          },
        ];
        if (mejor && typeof uZonaGris.valor_en_plan === "number")
          barra = { valor: mejor.similitud, umbral: uZonaGris.valor_en_plan };
        break;
      case "investigador":
        celdas = [
          valor(t.investigacion?.conclusion),
          t.investigacion?.entrada_id ?? "—",
          tiempoSalidaCosto(t, nodo, i),
        ];
        pares = [{ k: et[0]!, v: similitud }];
        break;
      case "puntaje": {
        const pt = t.puntaje;
        celdas = [
          String(pt?.total ?? "—"),
          String(pt?.inconsistencias.length ?? 0),
          valor(senal(t, "propuesta")),
        ];
        pares = [
          {
            k: et[0]!,
            v:
              [
                ...new Set([
                  ...(pt?.componentes.map((c) => c.regla) ?? []),
                  ...(pt?.inconsistencias.map((c) => c.regla) ?? []),
                  ...(pt?.reglas_propuesta ?? []),
                ]),
              ].join(", ") || "—",
          },
        ];
        break;
      }
      case "decision":
        celdas = [
          ultima?.regla
            ? (ultima.regla.senal ?? ultima.regla.funcion ?? "")
            : X(PANEL.trazas_.ninguna),
          valor(senal(t, "propuesta")),
          ultima?.rama ?? "—",
        ];
        pares = [
          {
            k: et[0]!,
            v: `${similitud} · ${String(senal(t, "puntaje_riesgo") ?? "—")}`,
          },
          { k: et[1]!, v: valor(decisionFinal(t)) },
        ];
        break;
      case "pausa_humana":
        celdas = [
          pausa
            ? X(
                textoDeCategoria(
                  MOTIVO_PAUSA_B,
                  motivoDe(t, pausa),
                  "MOTIVO_PAUSA_B (src/textos/demo-b/agente.ts)",
                ),
              )
            : "—",
          valor(pausa?.respuesta_simulada.decision),
          valor(decisionFinal(t)),
        ];
        pares = [{ k: et[0]!, v: String(pausa?.payload.senal ?? "—") }];
        break;
      case "redactor":
        celdas = [
          valor(decisionFinal(t)),
          siNo(t.documento_adverso !== null, i),
          `${t.expediente?.conclusiones.length ?? 0} · ${t.expediente?.conclusiones_sin_cita ?? 0}`,
        ];
        pares = [{ k: et[0]!, v: siNo(senal(t, "pausa_humana") === true, i) }];
        break;
      case "guardia_salida": {
        const g = t.guardia_salida;
        celdas = [
          g?.acciones_ejecutadas.join(", ") || "—",
          siNo(g?.carga_detectada_en_entrada === true, i),
          `${g?.hallazgos.length ?? 0} · ${g?.severidad_accion ?? 0}`,
        ];
        pares = [{ k: et[0]!, v: g?.acciones_intentadas.join(", ") || "—" }];
        break;
      }
      default:
        throw new Error(
          `vitrina: el nodo «${nodo}» no tiene sus columnas de trazas en src/lib/vista/agente-b.ts (filaTraza)`,
        );
    }
    return { celdas, barra, solicitud: documentosDe(caso), pares };
  };

  const primeros = (ids: string[]): TextoBilingue => ({
    es: enumerar(ids.slice(0, 2), "es"),
    en: enumerar(ids.slice(0, 2), "en"),
  });
  const notaTrazas = (nodo: string): string => {
    const N = NOTA_TRAZAS_B;
    switch (nodo) {
      case "verificador_listas":
        return X(
          N.verificador_listas(valorDeUmbral(uZonaGris.valor_en_plan, i)),
        );
      case "investigador":
        return X(
          N.investigador(
            con("investigador")
              .map((t) => t.caso_id)
              .sort()[0] ?? "—",
          ),
        );
      case "pausa_humana":
        return X(
          N.pausa_humana(primeros(pausas.map(({ t }) => t.caso_id).sort())),
        );
      case "redactor":
        return X(
          N.redactor(
            primeros(
              trazas
                .filter((t) => t.documento_adverso !== null)
                .map((t) => t.caso_id)
                .sort(),
            ),
          ),
        );
      case "guardia_salida":
        return X(
          N.guardia_salida({
            inyeccion:
              d.lote.casos.find((c) => c.adversario_detalle === "inyeccion")
                ?.id ?? "—",
            sinEfecto:
              cifrasDelNodo("guardia_salida").severidadMax === 0 &&
              cumple("C6"),
          }),
        );
      case "enrutador":
      case "extractor":
      case "puntaje":
      case "decision":
        return X(N[nodo]);
      default:
        throw new Error(
          `vitrina: el nodo «${nodo}» no tiene su nota de trazas en src/textos/demo-b/agente.ts (NOTA_TRAZAS_B)`,
        );
    }
  };

  // ── la arista de la coincidencia de nombre ───────────────────────────────────────────────────────
  // La regla que lleva a una persona toda coincidencia en listas (C1), por su categoría y no por su orden ni su id:
  // `similitud_max` decide en dos nodos (zona gris y coincidencia) y solo esta manda al oficial.
  const regla = d.plan.contrato_de_grafo.aristas_condicionales.find(
    (a) => categoriaDeRegla(reglaDelPlan(a), DEMO) === "coincidencia",
  );
  if (!regla || !esAristaTripleta(regla))
    throw new Error(
      "vitrina: el plan B no tiene la regla de coincidencia de nombre que P3 dibuja como arista seleccionable.",
    );
  const umbral = umbralDeCategoria(d.plan, "coincidencia", DEMO);
  const min = umbral.costo_humano_por_caso_min;

  return {
    portadaTitulo: PORTADA_B.titulo,
    nodos: NODOS_B,
    dondeNodos: T_NODOS,
    enLaCorrida: (nodo) =>
      delVocabulario(NODOS_B, nodo, T_NODOS).enLaCorrida(cifrasDelNodo(nodo)),
    camposExtra: () => [],
    trazasDeNodo: TRAZAS_DE_NODO_B,
    dondeTrazas: T_NODO,
    planPorNodo: PLAN_POR_NODO_B,
    ficha,
    arquitectura,
    regimen: EXPERTO_B.regimen,
    filaTraza,
    tipoDeCaso: (id) =>
      X(
        delVocabulario(
          TIPO_DE_CASO,
          casoDe.get(id)!.tipo,
          "TIPO_DE_CASO (src/textos/agente.ts)",
        ),
      ),
    notaTrazas,
    arista: {
      umbral,
      regla,
      valor: (t) => Number(senal(t, "similitud_max") ?? 0),
      titulo: X(
        ARISTA_B.titulo({
          umbral: umbral.id,
          nodo: regla.desde,
          orden: regla.orden,
        }),
      ),
      rol: X(ARISTA_B.rol(decimal(umbral.valor_en_plan as number, 2, i))),
      costo:
        min === undefined
          ? X(ARISTA_B.costoTexto)
          : X(ARISTA_U1.costoTexto(min)),
      enLaCorrida: (p) => X(ARISTA_B.enLaCorridaTexto(p)),
      nota: (p) => X(ARISTA_B.distribucion({ n: p.n, nodo: p.nodo })),
      etiqueta: X(ARISTA_B.etiqueta),
    },
  };
}
