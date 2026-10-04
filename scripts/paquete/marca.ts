/**
 * La marca que solo `pnpm paquete:vitrina` pone junto a `PLANLANG_PAQUETE=1`. Sin ella `next.config.ts` rechaza el
 * modo paquete: si la variable quedara en el entorno, `pnpm build` exportaría a `.next-paquete/` y `pnpm start` y el
 * e2e servirían un `out/` viejo, en verde (AU-S2-B36).
 */
export const MARCA_PAQUETE = "paquete-vitrina";
