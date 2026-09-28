/** `/es` y `/en` — S2 fase 0: esqueleto para que el preview responda el primer día; P1 llega en la fase 1. */
const TEXTO = {
  es: {
    rotulo: "Simulación · no operativo · datos sintéticos",
    titulo: "planlang — la vitrina está en construcción",
    otro: { href: "/en", nombre: "English" },
  },
  en: {
    rotulo: "Simulation · not operational · synthetic data",
    titulo: "planlang — the showcase is under construction",
    otro: { href: "/es", nombre: "Español" },
  },
} as const;

export default async function Entrada({
  params,
}: {
  params: Promise<{ idioma: string }>;
}) {
  const { idioma } = await params;
  const t = TEXTO[idioma === "en" ? "en" : "es"];
  return (
    <main>
      <p>{t.rotulo}</p>
      <h1>{t.titulo}</h1>
      <p>
        <a href={t.otro.href}>{t.otro.nombre}</a>
      </p>
    </main>
  );
}
