/**
 * Planes SEMBRADOS con errores (RF-09.4): a partir del plan migrado del demo A se producen variantes
 * que el validador DEBE rechazar, cada una con el código de motivo esperado. Se escriben como datos en
 * `tests/fixtures/planes-sembrados/` con un manifiesto; `planes-sembrados.test.ts` los carga.
 *
 * Uso: `pnpm tsx scripts/sembrar-planes.ts --base plans/demo-a/v0-migrado.json --salida tests/fixtures/planes-sembrados`
 */
import { join } from "node:path";
import { argumentos, escribirJson, leerJson } from "./_io";

type Obj = Record<string, unknown>;
type Semilla = {
  archivo: string;
  codigo: string;
  elemento: string;
  descripcion: string;
  mutar: (p: Obj) => void;
};

const clon = (p: Obj): Obj => JSON.parse(JSON.stringify(p)) as Obj;
const arr = (p: Obj, clave: string): Obj[] => p[clave] as Obj[];
const contrato = (p: Obj): Obj => p.contrato_de_grafo as Obj;

export const SEMILLAS: Semilla[] = [
  {
    archivo: "01-criterio-sin-regla.json",
    codigo: "CRITERIO_SIN_REGLA",
    elemento: "C1",
    descripcion: "C1 pierde su condición de medición",
    mutar: (p) => {
      const c = arr(p, "criterios_aceptacion")[0] as Obj;
      delete (c.regla_de_medicion as Obj).condicion;
    },
  },
  {
    archivo: "02-umbral-sin-senal.json",
    codigo: "UMBRAL_SIN_SENAL",
    elemento: "U1",
    descripcion: "U1 apunta a una señal que la traza no registra",
    mutar: (p) => {
      (arr(p, "umbrales")[0] as Obj).senal = "senal_fantasma";
    },
  },
  {
    archivo: "03-riesgo-sin-detector.json",
    codigo: "RIESGO_SIN_DETECTOR",
    elemento: "R3",
    descripcion:
      "R3 (inyección, severidad 9) queda sin detector ni marca «no detectable»",
    mutar: (p) => {
      const r = arr(p, "riesgos").find((x) => x.id === "R3") as Obj;
      r.detector_en_trazas = null;
    },
  },
  {
    archivo: "04-sin-pausa-humana.json",
    codigo: "SIN_PAUSA_HUMANA",
    elemento: "contrato_de_grafo.pausas_humanas",
    descripcion: "el contrato de grafo no declara ninguna pausa humana",
    mutar: (p) => {
      contrato(p).pausas_humanas = [];
    },
  },
  {
    archivo: "05-prioridad-alta-sin-mitigacion.json",
    codigo: "PRIORIDAD_ALTA_SIN_MITIGACION",
    elemento: "R2",
    descripcion: "R2 (fuga de datos, prioridad alta) pierde sus mitigaciones",
    mutar: (p) => {
      (arr(p, "riesgos").find((x) => x.id === "R2") as Obj).mitigaciones = [];
    },
  },
  {
    archivo: "06-ciclo-entre-decisiones.json",
    codigo: "CICLO",
    elemento: "D2 → D3 → D2",
    descripcion: "D2 pasa a depender de D3, que ya depende de D2",
    mutar: (p) => {
      (arr(p, "decisiones").find((x) => x.id === "D2") as Obj).depende_de = [
        "D3",
      ];
    },
  },
  {
    archivo: "07-condicion-no-interpretable.json",
    codigo: "CONDICION_NO_INTERPRETABLE",
    elemento: "C2.condicion",
    descripcion: "C2 lleva una condición con paréntesis sin cerrar",
    mutar: (p) => {
      const c = arr(p, "criterios_aceptacion").find(
        (x) => x.id === "C2",
      ) as Obj;
      (c.regla_de_medicion as Obj).condicion =
        "NOT (salida_final CONTIENE identificador_sintetico(caso)";
    },
  },
  {
    archivo: "08-referencia-rota.json",
    codigo: "REFERENCIA_ROTA",
    elemento: "C3.poblacion",
    descripcion: "C3 referencia umbral.U9, que no existe",
    mutar: (p) => {
      const c = arr(p, "criterios_aceptacion").find(
        (x) => x.id === "C3",
      ) as Obj;
      (c.regla_de_medicion as Obj).poblacion =
        "extraccion.costo_estimado > umbral.U9";
    },
  },
  {
    archivo: "09-operador-inclusivo-incoherente.json",
    codigo: "OPERADOR_INCLUSIVO_INCOHERENTE",
    elemento: "U3",
    descripcion: "U3 usa mayor_o_igual_que con inclusivo: false",
    mutar: (p) => {
      (arr(p, "umbrales").find((x) => x.id === "U3") as Obj).inclusivo = false;
    },
  },
  {
    archivo: "10-nodo-escritor-sin-rama-por-defecto.json",
    codigo: "NODO_ESCRITOR_SIN_RAMA_POR_DEFECTO",
    elemento: "decision",
    descripcion: "el nodo decision pierde su rama por defecto",
    mutar: (p) => {
      contrato(p).ramas_por_defecto = {};
    },
  },
  {
    archivo: "11-esquema-clave-desconocida.json",
    codigo: "ESQUEMA",
    elemento: "$",
    descripcion: "una clave desconocida en la raíz (el esquema es estricto)",
    mutar: (p) => {
      p.campo_inventado = true;
    },
  },
  {
    archivo: "12-supuesto-critico-sin-prueba.json",
    codigo: "SUPUESTO_CRITICO_SIN_PRUEBA",
    elemento: "S1",
    descripcion: "S1 (criticidad alta) queda con prueba barata vacía en inglés",
    mutar: (p) => {
      const s = arr(p, "supuestos").find((x) => x.id === "S1") as Obj;
      s.prueba_barata = { es: "ECE y AUROC sobre el lote", en: " " };
    },
  },
];

const args = argumentos(process.argv.slice(2));
if (typeof args.base !== "string" || typeof args.salida !== "string") {
  console.error("uso: sembrar-planes --base <plan.json> --salida <directorio>");
  process.exit(2);
}
const base = leerJson(args.base) as Obj;
const manifiesto: Omit<Semilla, "mutar">[] = [];
for (const s of SEMILLAS) {
  const p = clon(base);
  s.mutar(p);
  escribirJson(join(args.salida, s.archivo), p as never);
  manifiesto.push({
    archivo: s.archivo,
    codigo: s.codigo,
    elemento: s.elemento,
    descripcion: s.descripcion,
  });
}
escribirJson(join(args.salida, "manifiesto.json"), {
  base: args.base,
  semillas: manifiesto,
} as never);
console.log(`${SEMILLAS.length} planes sembrados → ${args.salida}`);
