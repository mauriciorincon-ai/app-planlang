// Setup del proyecto `core-jsdom` (planlang S1, K8).
// jsdom 30 implementa `crypto.getRandomValues` pero NO `crypto.subtle`; el núcleo solo usa
// `globalThis.crypto.subtle.digest` (regla dura 1) y en el navegador real existe. Aquí, y SOLO
// aquí (arnés de test), se toma la Web Crypto de Node para que el mismo código corra bajo los
// globals de jsdom (TextEncoder, JSON, Array.prototype.sort del entorno DOM).
import { webcrypto } from "node:crypto";

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
