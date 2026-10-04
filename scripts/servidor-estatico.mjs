// Servidor estático de los arneses de capturas (regla 17-bis b; kit v1.37.0: las capturas se toman sobre la app y la
// maqueta SERVIDAS, nunca por file://). URL limpias como `serve` y `cleanUrls` de Vercel (/es → es.html); aborta si
// una petición sale de su árbol. Lo usan scripts/capturar-vitrina.mjs y scripts/capturar-maqueta.mjs.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".md": "text/plain; charset=utf-8",
};

/** Servidor estático con URL limpias (como `serve` y `cleanUrls` de Vercel): /es → es.html. */
export function servidor(base, arnes) {
  return createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const pedido = normalize(join(base, ruta));
    if (!pedido.startsWith(base)) {
      res.writeHead(403).end();
      console.error(`${arnes}: ${ruta} sale de ${base}. Aborto.`);
      process.exit(1);
    }
    const candidatos = [pedido, `${pedido}.html`, join(pedido, "index.html")];
    const archivo = candidatos.find(
      (c) => existsSync(c) && statSync(c).isFile(),
    );
    if (!archivo) {
      const nf = join(base, "404.html");
      res.writeHead(404, { "content-type": TIPOS[".html"] });
      return existsSync(nf) ? createReadStream(nf).pipe(res) : res.end("404");
    }
    res.writeHead(200, {
      "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream",
    });
    createReadStream(archivo).pipe(res);
  });
}
export const escuchar = (s) =>
  new Promise((ok) => s.listen(0, "127.0.0.1", () => ok(s.address().port)));
