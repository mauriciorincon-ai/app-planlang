/** `/` — elige idioma. S2 fase 0: esqueleto; la fase 1 suma la memoria del idioma y la redirección. */
export default function Inicio() {
  return (
    <main>
      <h1>planlang</h1>
      <p>
        <a href="/es" hrefLang="es" lang="es">
          Español
        </a>
        {" · "}
        <a href="/en" hrefLang="en" lang="en">
          English
        </a>
      </p>
    </main>
  );
}
