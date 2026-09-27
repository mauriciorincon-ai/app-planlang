/**
 * `tsx scripts/sellar.ts --sellar <archivo.json>` recalcula la huella (JCS + SHA-256, sin la clave
 * `huella`) y reescribe el archivo «bonito». `--verificar <archivo.json>` sale 1 si no coincide.
 * Para datos escritos a mano (plan de beneficios); los artefactos generados se sellan en su script.
 */
import { conHuella, verificarHuella } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import { argumentos, escribirJson, leerJson } from "./_io";

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  if (typeof args.sellar === "string") {
    const sellado = await conHuella(
      leerJson(args.sellar) as Record<string, JsonValor>,
    );
    escribirJson(args.sellar, sellado);
    console.log(`sellado ${args.sellar} · huella ${sellado.huella}`);
    return 0;
  }
  if (typeof args.verificar === "string") {
    const v = await verificarHuella(
      leerJson(args.verificar) as Record<string, JsonValor>,
    );
    if (!v.ok) {
      console.error(
        `HUELLA ${v.motivo} en ${args.verificar}: declarada ${v.declarada} · calculada ${v.calculada}`,
      );
      return 1;
    }
    console.log(`OK ${args.verificar} · huella ${v.huella}`);
    return 0;
  }
  console.error(
    "uso: sellar --sellar <archivo.json> | --verificar <archivo.json>",
  );
  return 2;
}

main().then((codigo) => process.exit(codigo));
