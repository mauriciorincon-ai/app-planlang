// Copia la maqueta de la Etapa de Diseño (docs/diseno/) a public/diseno/ antes de `next build`,
// para que el export estático la sirva en /diseno/… (preview de Vercel protegido, `pnpm start`).
// La fuente de verdad es docs/diseno/; public/diseno/ es DERIVADO: vive en .gitignore y en los
// globalIgnores de ESLint y se regenera entero en cada build.
//
// Regla 17-bis (b) de la constitución: declara el árbol que lee y aborta si el destino sale de
// public/. No lee nada fuera del repo.
import { cpSync, existsSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origen = join(raiz, "docs", "diseno");
const destino = join(raiz, "public", "diseno");

if (!existsSync(origen) || !statSync(origen).isDirectory()) {
  console.error(`copiar-maqueta: no existe ${origen}; nada que copiar.`);
  process.exit(0);
}
if (!destino.startsWith(join(raiz, "public") + "/")) {
  console.error(`copiar-maqueta: destino fuera de public/ (${destino}); aborto.`);
  process.exit(1);
}

rmSync(destino, { recursive: true, force: true });
cpSync(origen, destino, {
  recursive: true,
  // Solo lo que la maqueta sirve. Los .md (README, MIRADAS) se leen en el repo, no en el sitio.
  filter: (ruta) => statSync(ruta).isDirectory() || /\.(html|css|js|woff2|svg|txt|json)$/.test(ruta),
});
console.log(`copiar-maqueta: ${origen} → ${destino}`);
