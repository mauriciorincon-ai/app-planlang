/**
 * El perfil del demo A (autorización previa) en P3 Agente: su ficha, la frase «En los N casos» de cada nodo, sus
 * tablas de trazas y la arista de la señal de confianza. Lo común a los dos demos vive en `agente.ts`; aquí, lo que
 * solo el A sabe contar (la cobertura, las aclaraciones, el plan de beneficios, los minutos de auditor).
 */
import { SENAL_DE_CONFIANZA } from "@core/brecha/contexto";
import { mediana } from "@core/brecha/numeros";
import { minutosPorPersona } from "@core/playground/compactar";
import type { TextoBilingue } from "@core/formatos/bilingue";
import { extraccionA, type Traza } from "@core/formatos/traza";
import { esAristaTripleta } from "@core/plan/esquema";
import type { Caso } from "@core/sintetico/esquema";
import type { DatosDemoA } from "@/lib/datos/vitrina";
import {
  ACTIVIDADES,
  ARISTA_U1,
  CIFRAS_ACTIVIDAD,
  CIFRAS_PUEDE,
  CRITERIOS_EN_LA_CORRIDA,
  CRITERIOS_NUNCA,
  EXPERTO,
  EXTRACTOR_S1,
  FICHA,
  MOTIVO_PAUSA,
  NODOS,
  NOTA_TRAZAS,
  PANEL,
  PLAN_POR_NODO,
  PORTADA,
  PUEDE,
  TIPO_DE_CASO,
  TRAZAS_DE_NODO,
  VALORES,
  frasesDeCriterios,
  type CifrasDeNodo,
  type ClaveActividad,
  type ClavePuede,
} from "@/textos/agente";
import { CHIP_CORRIDA, FRACCION } from "@/textos/comun";
import type { Campo, Grupo, VistaAgente } from "./agente";
import {
  siNo,
  tiempoSalidaCosto,
  valorDeUmbral,
  visitas,
  type ContextoAgente,
  type PerfilAgente,
} from "./agente-comun";
import { decimal, entero, enumerar } from "./formato";
import {
  CATEGORIAS,
  categoriaDeRegla,
  textoDeCategoria,
  umbralDeCategoria,
  type CategoriaRegla,
} from "./motivo-pausa";
import { estadoDeSupuesto, pausaDelPlan, pausaUnica } from "./plan-comun";
import { delVocabulario } from "./vocabulario";

const T_NODOS = "NODOS (src/textos/agente.ts)";
const T_NODO = "TRAZAS_DE_NODO (src/textos/agente.ts)";

export function perfilDemoA(d: DatosDemoA, ctx: ContextoAgente): PerfilAgente {
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
    criterio,
    cumple,
    estado,
    con,
    pasosDe,
    senal,
    pausas,
    motivoDe,
  } = ctx;
  const informe = d.informe;
  const casoDe = new Map<string, Caso>(d.lote.casos.map((c) => [c.id, c]));
  const cobertura = (t: Traza) =>
    (t.cobertura ?? {}) as Record<string, unknown>;
  // Una sola política para el costo humano: la del playground, que falla si el plan declara varios (AU-S2-17).
  const costoHumano = minutosPorPersona(d.plan);
  if (costoHumano === null)
    throw new Error(
      "vitrina: el plan del demo A no declara el costo humano por caso que P3 cita (minutos de auditor).",
    );

  // ── cifras por nodo ──────────────────────────────────────────────────────────────────────────────
  const enr = con("enrutador").map((t) => visitas(t, "enrutador")[0]!);
  const dec = con("decision").flatMap((t) =>
    visitas(t, "decision").map((v) => ({ t, v })),
  );
  const acl = con("aclaracion");
  const porRegla = Object.fromEntries(
    CATEGORIAS["demo-a"].map((c) => [c, 0]),
  ) as Record<CategoriaRegla, number>;
  for (const { v } of dec)
    if (v.regla) porRegla[categoriaDeRegla(v.regla, "demo-a")]++;
  const pausaPor = (c: CategoriaRegla) =>
    pausas.filter(({ t, p }) => motivoDe(t, p) === c);
  const aclaracionPor = (c: CategoriaRegla) =>
    acl
      .filter((t) =>
        visitas(t, "aclaracion").some(
          (v) =>
            v.rama === "pausa_humana" &&
            v.regla !== undefined &&
            categoriaDeRegla(v.regla, "demo-a") === c,
        ),
      )
      .map((t) => t.caso_id);
  const documentados = trazas.filter(
    (t) =>
      t.documento_adverso &&
      t.documento_adverso.completo &&
      t.documento_adverso.idiomas.join() === "es,en",
  );
  const cargas = trazas
    .filter((t) => t.guardia_salida?.carga_detectada_en_entrada)
    .map((t) => t.caso_id);
  const s1 = informe.supuestos.find((s) => s.id === "S1");
  const s2 = informe.supuestos.find((s) => s.id === "S2");
  const medidosS1 =
    (s1 as { curva?: Array<{ aceptados: number }> } | undefined)?.curva?.[0]
      ?.aceptados ?? 0;
  const cifras = (nodo: string, crit: string[]): CifrasDeNodo => ({
    total: n,
    casos: con(nodo).length,
    visitas: pasosDe(nodo).length,
    criterios: frasesDeCriterios(crit, estado),
    aExtractor: enr.filter((v) => v.rama === "extractor").length,
    urgencias: enr.filter((v) => v.regla?.senal === "tipo_atencion").length,
    exentos: enr.filter((v) => v.regla?.senal === "servicio_exento").length,
    reintentos: pasosDe(nodo).reduce((a, p) => a + p.reintentos_esquema, 0),
    preguntas: acl.reduce((a, t) => a + t.aclaraciones.length, 0),
    resueltos: acl
      .filter((t) =>
        visitas(t, "aclaracion").every((v) => v.rama !== "pausa_humana"),
      )
      .map((t) => t.caso_id),
    tope: aclaracionPor("tope"),
    topeAclaraciones: Number(
      umbralDeCategoria(d.plan, "tope", "demo-a").valor_en_plan,
    ),
    sinModeloAcl: aclaracionPor("proveedor"),
    excluidos: con("verificador_cobertura").filter(
      (t) => cobertura(t).estado_servicio === "excluido",
    ).length,
    altoCosto: con("verificador_cobertura").filter(
      (t) => cobertura(t).alto_costo === true,
    ).length,
    contradicciones: con("verificador_cobertura").filter(
      (t) => cobertura(t).contradiccion === true,
    ).length,
    solos: dec.filter(({ v }) => v.rama !== "pausa_humana").length,
    aPersona: dec.filter(({ v }) => v.rama === "pausa_humana").length,
    porRegla,
    pausas: pausas.length,
    desdeDecision: pausas.filter(
      ({ p }) =>
        (p.payload.motivo as { desde?: string } | undefined)?.desde ===
        "decision",
    ).length,
    porTope: pausaPor("tope").length,
    porProveedor: pausaPor("proveedor").length,
    nego: pausas.filter(({ p }) => p.respuesta_simulada.decision === "negar")
      .length,
    aprobo: pausas.filter(
      ({ p }) => p.respuesta_simulada.decision === "aprobar",
    ).length,
    minutos: pausas.length * costoHumano,
    minutosPorCaso: costoHumano,
    negaciones: documentados.length,
    parciales: documentados.filter(
      (t) => t.senales.decision_final === "aprobar_parcial",
    ).length,
    hallazgos: trazas.reduce(
      (a, t) => a + (t.guardia_salida?.hallazgos.length ?? 0),
      0,
    ),
    severidadMax: Math.max(
      0,
      ...trazas.map((t) => t.guardia_salida?.severidad_accion ?? 0),
    ),
    cargas,
    accion: [
      ...new Set(
        trazas.flatMap((t) => t.guardia_salida?.acciones_ejecutadas ?? []),
      ),
    ].join(", "),
    s1: {
      medidos: medidosS1,
      aciertos: medidosS1,
      sinProbar: s1?.estado === "sin_probar",
    },
    s2: estadoDeSupuesto(s2?.estado, i).texto.toLowerCase(),
  });
  const cifrasDe = Object.fromEntries(
    Object.keys(NODOS).map((k) => [
      k,
      cifras(k, CRITERIOS_EN_LA_CORRIDA[k] ?? []),
    ]),
  ) as Record<string, CifrasDeNodo>;
  const cifrasDelNodo = (nodo: string) =>
    delVocabulario(
      cifrasDe,
      nodo,
      "las cifras por nodo (src/lib/vista/agente-a.ts)",
    );

  // ── ficha ───────────────────────────────────────────────────────────────────────────────────────
  const contradicen = trazas
    .filter((t) => cobertura(t).contradiccion === true)
    .map((t) => t.caso_id);
  const pb = d.planBeneficios.procedimientos;
  const cE = cifrasDe.enrutador!;
  const decisionFinal = (t: Traza) => senal(t, "decision_final");
  const aprobadas = trazas.filter((t) => decisionFinal(t) === "aprobar").length;
  const negadas = trazas.filter((t) => decisionFinal(t) === "negar").length;
  const campos = pausaDelPlan(d.plan.contrato_de_grafo.pausas_humanas)
    .payload_minimo.length;
  // Cifra y «corrió» por clave de actividad, no por posición (C-3): el tipo exige una por cada clave.
  const cifrasActividad: Record<ClaveActividad, TextoBilingue> = {
    clasifica: CIFRAS_ACTIVIDAD.casos({ n: con("enrutador").length, de: n }),
    autorizaUrgencia: CIFRAS_ACTIVIDAD.urgenciasExentos({
      u: cE.urgencias,
      e: cE.exentos,
    }),
    lee: CIFRAS_ACTIVIDAD.casos({ n: con("extractor").length }),
    pregunta: CIFRAS_ACTIVIDAD.preguntas({
      casos: acl.length,
      preguntas: cE.preguntas,
    }),
    revisaCobertura: CIFRAS_ACTIVIDAD.sinModelo(
      con("verificador_cobertura").length,
    ),
    decide: CIFRAS_ACTIVIDAD.aPersona({
      n: trazas.filter((t) => senal(t, "pausa_humana") === true).length,
      de: n,
    }),
    responde: CIFRAS_ACTIVIDAD.documentos(cE.negaciones),
  };
  const corrioActividad: Record<ClaveActividad, boolean> = {
    clasifica: con("enrutador").length > 0,
    autorizaUrgencia: cE.urgencias + cE.exentos > 0,
    lee: con("extractor").length > 0,
    pregunta: acl.length > 0,
    revisaCobertura: con("verificador_cobertura").length > 0,
    decide: con("decision").length > 0 && pausas.length > 0,
    responde: cE.negaciones > 0 && con("guardia_salida").length > 0,
  };
  const latencias = trazas.map((t) => Number(senal(t, "latencia_total_s")));
  const tokens = trazas.map((t) => Number(senal(t, "tokens")));
  const costos = trazas.map((t) =>
    t.pasos.reduce((a, p) => a + p.costo_nominal_usd, 0),
  );
  const costoTotal = costos.reduce((a, b) => a + b, 0);
  const masLargo = trazas[tokens.indexOf(Math.max(...tokens))]!;
  const coinciden = trazas.filter((t) => {
    const v = casoDe.get(t.caso_id)!.verdad_conocida;
    return (
      decisionFinal(t) === v.decision &&
      senal(t, "pausa_humana") === v.debe_escalar
    );
  }).length;
  const promedio = latencias.reduce((a, b) => a + b, 0) / n;
  // El lote completo es el que declara el plan (`lotes.completo`), no un número de la página (AU-S2-2).
  const loteCompleto = d.plan.lotes.completo;
  const c7 = criterio("C7") as
    { objetivo?: number; estado: string } | undefined;
  const aPersona = trazas.filter(
    (t) => senal(t, "pausa_humana") === true,
  ).length;
  const adversarios = cargas.length
    ? cargas
    : d.lote.casos
        .filter((c) => c.tipo === "adversario")
        .map((c) => c.id)
        .slice(0, 1);
  const cifrasPuede: Record<ClavePuede, TextoBilingue> = {
    lee: CIFRAS_PUEDE.lee({
      casos: con("extractor").length,
      reintentos: delVocabulario(cifrasDe, "extractor", "las cifras por nodo")
        .reintentos,
    }),
    pregunta: CIFRAS_PUEDE.pregunta({
      preguntas: cE.preguntas,
      casos: acl.length,
    }),
    cobertura: CIFRAS_PUEDE.cobertura(con("verificador_cobertura").length),
    pausas: CIFRAS_PUEDE.pausas(pausas.length),
    inyeccion: CIFRAS_PUEDE.inyeccion(enumerar(adversarios, i)),
  };

  const ficha: VistaAgente["ficha"] = {
    objetivo: X(FICHA.objetivo.texto),
    recibe: [
      {
        titulo: X(FICHA.recibe.texto.titulo),
        detalle: X(FICHA.recibe.texto.detalle(n)),
        corrio: true,
      },
      {
        titulo: X(FICHA.recibe.orden.titulo),
        detalle: contradicen.length
          ? X(FICHA.recibe.orden.detalle(enumerar(contradicen, i)))
          : X(FICHA.recibe.orden.sinContradiccion),
        corrio: true,
      },
      {
        titulo: X(FICHA.recibe.afiliado.titulo),
        detalle: X(FICHA.recibe.afiliado.detalle),
        corrio: true,
      },
      {
        titulo: X(FICHA.recibe.plan.titulo),
        detalle: X(
          FICHA.recibe.plan.detalle({
            total: pb.length,
            exentos: pb.filter((p) => p.estado === "exento").length,
            excluidos: pb.filter((p) => p.estado === "excluido").length,
          }),
        ),
        corrio: true,
      },
    ],
    hace: {
      sub: X(FICHA.hace.sub(ACTIVIDADES.length)),
      items: ACTIVIDADES.map((a, k) => ({
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
        titulo: X(FICHA.entrega.aprobacion.titulo),
        detalle: X(FICHA.entrega.aprobacion.detalle({ n: aprobadas, de: n })),
        corrio: aprobadas > 0,
      },
      {
        titulo: X(FICHA.entrega.escalamiento.titulo),
        detalle: X(
          FICHA.entrega.escalamiento.detalle({
            campos,
            pausas: pausas.length,
            aprobo: cE.aprobo,
            nego: cE.nego,
          }),
        ),
        corrio: pausas.length > 0,
      },
      {
        titulo: X(FICHA.entrega.negacion.titulo),
        detalle: X(FICHA.entrega.negacion.detalle({ n: negadas, de: n })),
        corrio: negadas > 0,
      },
      {
        titulo: X(FICHA.entrega.traza.titulo),
        detalle: X(FICHA.entrega.traza.detalle(n)),
        corrio: true,
      },
    ],
    leyenda: X(FICHA.leyenda({ n: ACTIVIDADES.length, casos: n, sprint })),
    puede: PUEDE.map((p) => ({
      titulo: X(p.titulo),
      detalle: X(cifrasPuede[p.clave]),
      corrio: true,
    })),
    nunca: {
      items: FICHA.nunca.items.map((x) => ({
        titulo: X(x.titulo),
        detalle: X(x.refs),
      })),
      nota: X(
        FICHA.nunca.nota({
          corrida,
          criterios: enumerar(CRITERIOS_NUNCA.filter(cumple), i),
          rotas: CRITERIOS_NUNCA.filter((c) => !cumple(c)).length,
        }),
      ),
    },
    participan: d.plan.actores.map((a) => ({
      id: a.id,
      titulo: a[i],
      detalle: X(
        delVocabulario(
          FICHA.participan.papel,
          a.id,
          "FICHA.participan.papel (src/textos/agente.ts)",
        ),
      ),
    })),
    capacidad: [
      {
        cifra: decimal(mediana(latencias) ?? 0, 1, i),
        unidad: "s",
        texto: X(FICHA.capacidad.porCaso),
        detalle: `${X(FICHA.capacidad.rango({ min: decimal(Math.min(...latencias), 1, i), max: decimal(Math.max(...latencias), 1, i) }))} · ${X(
          FICHA.capacidad.latenciaC7({
            objetivo: String(c7?.objetivo ?? ""),
            cumple: c7?.estado === "cumple",
          }),
        )}`,
        barra:
          typeof c7?.objetivo === "number" && c7.objetivo > 0
            ? Math.min(1, (mediana(latencias) ?? 0) / c7.objetivo)
            : undefined,
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
          FICHA.capacidad.tokensRango({
            min: entero(Math.min(...tokens), i),
            max: entero(Math.max(...tokens), i),
            aclaraciones: masLargo.aclaraciones.length,
          }),
        ),
      },
      {
        cifra: X(FRACCION({ a: aPersona, b: n })),
        texto: X(FICHA.capacidad.aPersona),
        detalle: X(
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
      FICHA.fuente({
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
  const lineaBase = ctx.supuestoDeLineaBase();
  const arquitectura: Grupo = {
    rotulo: X(EXPERTO.arquitectura.rotulo),
    filas: [
      {
        k: X(EXPERTO.arquitectura.patron[0]!),
        v: X(EXPERTO.arquitectura.patron[1]!),
      },
      {
        k: X(EXPERTO.arquitectura.decision[0]!),
        v: X(EXPERTO.arquitectura.decision[1]!),
      },
      {
        k: X(EXPERTO.arquitectura.lineaBase),
        v: X(
          EXPERTO.arquitectura.lineaBaseTexto(lineaBase.estado === "refutado"),
        ),
      },
      {
        k: X(EXPERTO.arquitectura.orquestacion[0]!),
        v: X(EXPERTO.arquitectura.orquestacion[1]!),
      },
    ],
  };

  // ── tablas de trazas ────────────────────────────────────────────────────────────────────────────
  const valor = (v: unknown) =>
    typeof v === "string" && VALORES[v] ? X(VALORES[v]!) : String(v ?? "—");
  const u1 = d.plan.umbrales.find((u) => u.senal === SENAL_DE_CONFIANZA);
  const filaTraza: PerfilAgente["filaTraza"] = (t, nodo) => {
    const caso = casoDe.get(t.caso_id)!;
    const vs = visitas(t, nodo);
    const ultima = vs[vs.length - 1];
    const reglaTexto = (v?: {
      regla?: { senal: string | null; funcion: string | null };
    }) =>
      v?.regla
        ? (v.regla.senal ?? v.regla.funcion ?? "")
        : X(PANEL.trazas_.porDefecto);
    const cob = cobertura(t);
    const ext = extraccionA(t);
    const pausa = pausaUnica(t.pausas_humanas, `el caso ${t.caso_id}`);
    const motivoPausa = () =>
      pausa
        ? X(
            textoDeCategoria(
              MOTIVO_PAUSA,
              motivoDe(t, pausa),
              "MOTIVO_PAUSA (src/textos/agente.ts)",
            ),
          )
        : "—";
    let celdas: string[] = [];
    let pares: Array<{ k: string; v: string }> = [];
    const et = delVocabulario(TRAZAS_DE_NODO, nodo, T_NODO).detalle.map((x) =>
      X(x),
    );
    switch (nodo) {
      case "enrutador":
        celdas = [
          valor(senal(t, "tipo_atencion")),
          siNo(senal(t, "servicio_exento") === true, i),
          ultima?.rama ?? "—",
        ];
        pares = [
          {
            k: et[0]!,
            v: ultima?.regla ? reglaTexto(ultima) : X(PANEL.trazas_.porDefecto),
          },
        ];
        break;
      case "extractor":
        celdas = [
          ext ? decimal(ext.confianza, 2, i) : "—",
          String(ext?.campos_faltantes.length ?? 0),
          tiempoSalidaCosto(t, nodo, i),
        ];
        pares = [
          {
            k: et[0]!,
            v: String(t.pasos.filter((p) => p.nodo === nodo).length),
          },
          { k: et[1]!, v: vs.map((v) => v.rama).join(" → ") },
          {
            k: et[2]!,
            v: String(
              t.pasos
                .filter((p) => p.nodo === nodo)
                .reduce((a, p) => a + p.reintentos_esquema, 0),
            ),
          },
        ];
        break;
      case "aclaracion":
        celdas = [
          String(t.aclaraciones.length),
          ultima?.rama ?? "—",
          tiempoSalidaCosto(t, nodo, i),
        ];
        pares = [
          {
            k: et[0]!,
            v: String(t.pasos.filter((p) => p.nodo === nodo).length),
          },
          { k: et[1]!, v: valor(decisionFinal(t)) },
        ];
        break;
      case "verificador_cobertura":
        celdas = [
          `${valor(cob.estado_servicio)}${cob.causal ? ` · ${X(VALORES.causal!)} ${String(cob.causal)}` : ""}`,
          valor(cob.propuesta),
          (Array.isArray(cob.reglas_disparadas)
            ? (cob.reglas_disparadas as unknown[]).map(String)
            : []
          ).join(", ") || "—",
        ];
        pares = [
          {
            k: et[0]!,
            v: `${String(cob.codigo_extraido ?? "—")} · ${String(cob.codigo_orden ?? "—")}`,
          },
        ];
        break;
      case "decision":
        celdas = [
          ultima?.regla ? reglaTexto(ultima) : X(PANEL.trazas_.ninguna),
          valor(senal(t, "propuesta")),
          ultima?.rama ?? "—",
        ];
        pares = [
          {
            k: et[0]!,
            v: `${ext ? decimal(ext.confianza, 2, i) : "—"} · ${String(senal(t, "costo_estimado") ?? "—")}`,
          },
          { k: et[1]!, v: valor(decisionFinal(t)) },
        ];
        break;
      case "pausa_humana":
        celdas = [
          motivoPausa(),
          valor(pausa?.respuesta_simulada.decision),
          valor(decisionFinal(t)),
        ];
        pares = [{ k: et[0]!, v: String(pausa?.payload.senal ?? "—") }];
        break;
      case "redactor":
        celdas = [
          valor(decisionFinal(t)),
          siNo(t.documento_adverso !== null, i),
          tiempoSalidaCosto(t, nodo, i),
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
          `vitrina: el nodo «${nodo}» no tiene sus columnas de trazas en src/lib/vista/agente-a.ts (filaTraza)`,
        );
    }
    return {
      celdas,
      barra:
        nodo === "extractor" && ext && typeof u1?.valor_en_plan === "number"
          ? { valor: ext.confianza, umbral: u1.valor_en_plan }
          : undefined,
      solicitud: caso.entrada.texto_medico[i],
      pares,
    };
  };

  const primeros = (ids: string[]): TextoBilingue => ({
    es: enumerar(ids.slice(0, 2), "es"),
    en: enumerar(ids.slice(0, 2), "en"),
  });
  const adversario = (detalle: string) =>
    d.lote.casos.find((c) => c.adversario_detalle === detalle)?.id ?? "—";
  const notaTrazas = (nodo: string): string => {
    const N = NOTA_TRAZAS;
    switch (nodo) {
      case "extractor":
        return X(N.extractor(valorDeUmbral(u1?.valor_en_plan, i)));
      case "aclaracion": {
        const mas = [...acl].sort(
          (a, b) =>
            b.aclaraciones.length - a.aclaraciones.length ||
            (a.caso_id < b.caso_id ? -1 : 1),
        )[0];
        return X(N.aclaracion(mas?.caso_id ?? "—"));
      }
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
            inyeccion: adversario("inyeccion"),
            dato: adversario("dato_sensible"),
            sinEfecto:
              cifrasDe.guardia_salida!.severidadMax === 0 && cumple("C6"),
          }),
        );
      case "enrutador":
      case "verificador_cobertura":
      case "decision":
        return X(N[nodo]);
      default:
        throw new Error(
          `vitrina: el nodo «${nodo}» no tiene su nota de trazas en src/textos/agente.ts (NOTA_TRAZAS)`,
        );
    }
  };

  // ── la arista de la señal de confianza ──────────────────────────────────────────────────────────
  // El umbral de la señal de confianza y la regla que lo lee, por la señal y no por su id (AU-S2-2): su línea es la
  // seleccionable del lienzo y su panel es el de la arista (RF-08.4 por arista condicional queda en el roadmap, C-1).
  if (!u1)
    throw new Error(
      "vitrina: el plan no declara el umbral de la señal de confianza (panel de arista de P3)",
    );
  const reglaU1 = d.plan.contrato_de_grafo.aristas_condicionales.find(
    (a) => esAristaTripleta(a) && a.valor === `umbral.${u1.id}`,
  );
  if (!reglaU1 || !esAristaTripleta(reglaU1))
    throw new Error(
      `vitrina: ninguna regla del plan lee umbral.${u1.id} (panel de arista de P3)`,
    );
  const minU1 = u1.costo_humano_por_caso_min ?? 0;

  return {
    portadaTitulo: PORTADA.titulo,
    nodos: NODOS,
    dondeNodos: T_NODOS,
    enLaCorrida: (nodo) =>
      delVocabulario(NODOS, nodo, T_NODOS).enLaCorrida(cifrasDelNodo(nodo)),
    camposExtra: (nodo): Campo[] =>
      nodo === "extractor" && cifrasDelNodo(nodo).s1.sinProbar
        ? [
            {
              clave: "falta",
              rotulo: X(EXTRACTOR_S1.rotulo),
              texto: X(
                EXTRACTOR_S1.texto({ medidos: cifrasDelNodo(nodo).s1.medidos }),
              ),
            },
          ]
        : [],
    trazasDeNodo: TRAZAS_DE_NODO,
    dondeTrazas: T_NODO,
    planPorNodo: PLAN_POR_NODO,
    ficha,
    arquitectura,
    regimen: EXPERTO.modelo.regimen[1]!,
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
      umbral: u1,
      regla: reglaU1,
      valor: (t) =>
        Number(extraccionA(t)?.confianza ?? senal(t, SENAL_DE_CONFIANZA)),
      titulo: X(ARISTA_U1.titulo({ umbral: u1.id, nodo: reglaU1.desde })),
      rol: X(
        ARISTA_U1.rol({
          valor: decimal(u1.valor_en_plan as number, 2, i),
          min: minU1,
        }),
      ),
      costo: X(ARISTA_U1.costoTexto(minU1)),
      enLaCorrida: (p) =>
        X(ARISTA_U1.enLaCorridaTexto({ bajo: p.n, de: p.de, casos: p.casos })),
      nota: (p) => X(ARISTA_U1.distribucion(p)),
      etiqueta: X(ARISTA_U1.etiqueta),
    },
  };
}
