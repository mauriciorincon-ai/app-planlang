/**
 * `pnpm trazas:verificar [--raiz runs]` — recorre toda corrida versionada (`runs/<demo>/<corrida>/`):
 * verifica huellas, esquema y referencias (RF-06.1), recalcula sus ramas en TypeScript contra lo que
 * registró el agente y contra la huella de Python (RF-09.2), y busca credenciales en los archivos.
 * Sale con código 1 si algo falla, nombrando la corrida y el motivo.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { rf092 } from "../core/brecha/contrato-grafo";
import { ErrorDeLectura, leerCorridaVerificada } from "../core/brecha/lector";
import { argumentos } from "./_io";
import { archivosDeCorrida, planDelLote } from "./_corridas";

/** Lo que jamás puede aparecer en una traza exportada (regla dura 6 y 8). */
export const PROHIBIDO_EN_TRAZAS = [
  /sk-ant-/,
  /lsv2_/,
  /ANTHROPIC_API_KEY/,
  /LANGSMITH_API_KEY/,
  /"session_id"/,
  /"uuid"/,
];

function corridas(raiz: string): string[] {
  if (!existsSync(raiz)) return [];
  const salida: string[] = [];
  for (const demo of readdirSync(raiz).sort()) {
    const d = join(raiz, demo);
    if (!statSync(d).isDirectory()) continue;
    for (const c of readdirSync(d).sort())
      if (existsSync(join(d, c, "corrida.json"))) salida.push(join(d, c));
  }
  return salida;
}

function jsonDe(dir: string): string[] {
  const salida: string[] = [];
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) salida.push(...jsonDe(p));
    else if (n.endsWith(".json")) salida.push(p);
  }
  return salida;
}

async function main(): Promise<number> {
  const a = argumentos(process.argv.slice(2));
  const raiz = typeof a.raiz === "string" ? a.raiz : "runs";
  let fallos = 0;
  for (const ruta of corridas(raiz)) {
    const archivos = archivosDeCorrida(ruta);
    const m = archivos.corrida as {
      plan: { archivo: string };
      casos: { archivo: string };
    };
    const problemas: string[] = [];
    try {
      const plan = JSON.parse(readFileSync(m.plan.archivo, "utf8")) as unknown;
      const casos = JSON.parse(
        readFileSync(m.casos.archivo, "utf8"),
      ) as unknown;
      const leida = await leerCorridaVerificada(
        archivos,
        plan,
        casos,
        planDelLote(m.plan.archivo, plan, casos),
      );
      const r = await rf092(leida);
      for (const h of r.hallazgos)
        problemas.push(`${h.codigo} ${h.caso_id ?? ""}: ${h.detalle.es}`);
    } catch (e) {
      if (!(e instanceof ErrorDeLectura)) throw e;
      for (const x of e.motivos)
        problemas.push(`${x.codigo} ${x.archivo}: ${x.detalle.es}`);
    }
    for (const f of jsonDe(ruta)) {
      const texto = readFileSync(f, "utf8");
      for (const p of PROHIBIDO_EN_TRAZAS)
        if (p.test(texto)) problemas.push(`CREDENCIAL ${f}: coincide con ${p}`);
    }
    if (problemas.length === 0) console.log(`✓ ${ruta}`);
    else {
      fallos++;
      console.error(`✗ ${ruta}`);
      for (const p of problemas) console.error(`  ${p}`);
    }
  }
  return fallos === 0 ? 0 : 1;
}

main().then((c) => process.exit(c));
