#!/usr/bin/env node
// Regla 18 del kit (v1.32.0): ningún paquete queda POR DEBAJO de `main` al mergear dependencias.
// pnpm degrada en silencio al resolver un lockfile en conflicto y la CI pasa verde porque ninguna
// puerta compara el resultado contra la INTENCIÓN del PR. Este script es esa puerta: lee las versiones
// de pnpm-lock.yaml en el árbol actual y en origin/main y falla si alguna bajó.
// Uso: node scripts/verificar-dependencias.mjs [rama-base]   (default: origin/main)
// En CI corre solo en pull_request, tras `git fetch origin main --depth=1`.
// planlang (S2): una degradación A PROPÓSITO (p. ej. @types/node 26 → 22 para seguir al Node de la CI)
// se declara en scripts/degradaciones-permitidas.json con {nombre, de, a, razon}; solo pasa la
// coincidencia exacta de las tres primeras, y una entrada que ya no aplica se avisa para borrarla.
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const base = process.argv[2] ?? "origin/main";
const LOCK = "pnpm-lock.yaml";
if (!existsSync(LOCK)) { console.log(`verificar-dependencias: no hay ${LOCK}; nada que comparar`); process.exit(0); }

let lockBase;
try { lockBase = execSync(`git show ${base}:${LOCK}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
catch { console.log(`verificar-dependencias: ${base} no tiene ${LOCK} (repo nuevo o rama sin base); se omite`); process.exit(0); }
const lockPR = readFileSync(LOCK, "utf8");

/** Versiones por paquete en la sección `packages:` del lockfile (v6 y v9: claves `/nombre@ver` o `nombre@ver:`). */
function versiones(texto) {
  const out = new Map();
  let dentro = false;
  for (const linea of texto.split("\n")) {
    if (/^packages:\s*$/.test(linea)) { dentro = true; continue; }
    if (dentro && /^[A-Za-z]/.test(linea)) dentro = false; // otra sección de primer nivel
    if (!dentro) continue;
    const m = linea.match(/^  ['"]?\/?((?:@[^/@'"]+\/)?[^/@'"]+)@([0-9][^('":\s]*)/);
    if (!m) continue;
    const [, nombre, ver] = m;
    if (!out.has(nombre)) out.set(nombre, []);
    out.get(nombre).push(ver);
  }
  return out;
}
const num = (v) => v.split(/[-+]/)[0].split(".").map((x) => parseInt(x, 10) || 0);
const cmp = (a, b) => { const A = num(a), B = num(b); for (let i = 0; i < Math.max(A.length, B.length); i++) { const d = (A[i] ?? 0) - (B[i] ?? 0); if (d) return d; } return 0; };
const mayor = (vs) => vs.reduce((m, v) => (cmp(v, m) > 0 ? v : m));

const enBase = versiones(lockBase), enPR = versiones(lockPR);
const PERMITIDAS = "scripts/degradaciones-permitidas.json";
const permitidas = existsSync(PERMITIDAS) ? JSON.parse(readFileSync(PERMITIDAS, "utf8")) : [];
const usadas = new Set();
const degradados = [];
for (const [nombre, vsBase] of enBase) {
  const vsPR = enPR.get(nombre);
  if (!vsPR) continue; // quitado a propósito: no es degradación
  const a = mayor(vsBase), b = mayor(vsPR);
  if (cmp(b, a) >= 0) continue;
  const i = permitidas.findIndex((p) => p.nombre === nombre && p.de === a && p.a === b);
  if (i >= 0) { usadas.add(i); console.log(`· ${nombre}: ${a} → ${b} degradado a propósito (${permitidas[i].razon})`); continue; }
  degradados.push(`${nombre}: ${a} (${base}) → ${b} (este árbol)`);
}
permitidas.forEach((p, i) => { if (!usadas.has(i)) console.log(`aviso: ${PERMITIDAS} tiene una entrada que ya no aplica (${p.nombre} ${p.de} → ${p.a}); bórrala`); });
if (degradados.length) {
  console.error(`✗ ${degradados.length} paquete(s) quedaron POR DEBAJO de ${base} (regla 18 — el lockfile no se pelea):`);
  for (const d of degradados) console.error(`  - ${d}`);
  console.error("Resuelve partiendo del lado que trae los bumps y verifica dependencia por dependencia.");
  process.exit(1);
}
console.log(`✓ verificar-dependencias: ${enPR.size} paquetes, ninguno por debajo de ${base}`);
