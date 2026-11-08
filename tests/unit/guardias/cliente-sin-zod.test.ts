/**
 * Guardia del paquete (P14, S10): ningún componente de cliente alcanza `zod` por un import de valor. Zod trae su emisor
 * de JSON Schema, que nombra `json-schema.org` en el JavaScript del navegador, y el barrido de hosts del paquete de la
 * vitrina (`pnpm paquete:vitrina`) rechaza el paquete entero. Un `import { f } from "@/lib/vista/…"` en un componente
 * de cliente basta para arrastrarlo (así pasó con `porcentajeDelRango`); los imports de tipo se borran y no cuentan.
 * Lo puro que el cliente necesita vive en `src/lib/vista/formato.ts`, que no lee esquemas.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(__dirname, "../../..");

const archivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return archivos(p);
    return /\.tsx?$/.test(n) ? [p] : [];
  });

function resolver(desde: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@core/")) base = join(RAIZ, "core", spec.slice(6));
  else if (spec.startsWith("@/")) base = join(RAIZ, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(desde), spec);
  else return null;
  for (const e of [".ts", ".tsx", "/index.ts", "/index.tsx"])
    if (existsSync(base + e) && statSync(base + e).isFile()) return base + e;
  return null;
}

const IMPORTA_VALOR =
  /^(?:import\s+(?!type\b)[^;]*?from|export\s+(?!type\b)[^;]*?from)\s+"([^"]+)"/gm;

/** La cadena de imports de valor desde `inicio` hasta el primer archivo que importa `zod`, o `null`. */
export function cadenaHastaZod(inicio: string): string[] | null {
  const previo = new Map<string, string | null>([[inicio, null]]);
  const cola = [inicio];
  while (cola.length) {
    const f = cola.shift() as string;
    const fuente = readFileSync(f, "utf8");
    if (f !== inicio && /from "zod/.test(fuente)) {
      const cadena: string[] = [];
      for (let x: string | null | undefined = f; x; x = previo.get(x))
        cadena.unshift(relative(RAIZ, x));
      return cadena;
    }
    for (const m of fuente.matchAll(IMPORTA_VALOR)) {
      const r = resolver(f, m[1] as string);
      if (r && !previo.has(r)) {
        previo.set(r, f);
        cola.push(r);
      }
    }
  }
  return null;
}

describe("ningún componente de cliente arrastra zod al navegador", () => {
  const clientes = archivos(join(RAIZ, "src")).filter((f) =>
    /^\s*["']use client["']/m.test(readFileSync(f, "utf8").slice(0, 400)),
  );

  it("hay componentes de cliente que revisar", () => {
    expect(clientes.length).toBeGreaterThan(10);
  });

  it.each(clientes.map((f) => [relative(RAIZ, f), f]))(
    "%s no llega a zod",
    (_nombre, f) => {
      const cadena = cadenaHastaZod(f as string);
      expect(cadena && cadena.join("\n  -> ")).toBeNull();
    },
  );

  it("rojo: un archivo de servidor que lee esquemas sí llega a zod, y la cadena lo dice", () => {
    const cadena = cadenaHastaZod(join(RAIZ, "src/lib/vista/playground.ts"));
    expect(cadena).not.toBeNull();
    expect(cadena!.at(0)).toBe("src/lib/vista/playground.ts");
  });
});
