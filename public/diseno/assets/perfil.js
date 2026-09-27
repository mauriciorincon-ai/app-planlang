// Utilería de sala: «Leer como» líder o experto. Cambia html[data-perfil]; el CSS oculta lo que no
// corresponde (.solo-lider / .solo-experto) y marca con «Experto» los bloques propios de ese perfil.
// Al cambiar, lo que aparece entra con un fundido corto (apagado con movimiento reducido) y el aviso
// dice cuántos bloques son solo del experto. No guarda nada: cada visita empieza en líder.
(function () {
  var html = document.documentElement;
  var reloj = null;
  function cuenta() {
    var todos = document.querySelectorAll(".marcado"), n = 0;
    for (var k = 0; k < todos.length; k++) if (todos[k].getClientRects().length) n++;
    var ls = document.querySelectorAll("[data-cuenta-experto]");
    for (var i = 0; i < ls.length; i++)
      ls[i].innerHTML =
        '<span lang="es">' + n + " bloques de esta página son solo para este perfil: llevan el rótulo «Experto» y fondo gris.</span>" +
        '<span lang="en">' + n + " blocks on this page are for this profile only: they carry the “Expert” label and a grey background.</span>";
  }
  function poner(v, animar) {
    html.setAttribute("data-perfil", v);
    var bs = document.querySelectorAll("button[data-perfil-set]");
    for (var i = 0; i < bs.length; i++)
      bs[i].setAttribute("aria-pressed", bs[i].getAttribute("data-perfil-set") === v ? "true" : "false");
    if (v === "experto") cuenta();
    if (animar) {
      html.classList.remove("perfil-cambio");
      void html.offsetWidth;
      html.classList.add("perfil-cambio");
      clearTimeout(reloj);
      reloj = setTimeout(function () { html.classList.remove("perfil-cambio"); }, 600);
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-perfil-set]");
    if (b) poner(b.getAttribute("data-perfil-set"), true);
  });
  var p = new URLSearchParams(location.search).get("perfil");
  poner(p === "experto" ? "experto" : "lider", false);
  new MutationObserver(function () { if (html.getAttribute("data-perfil") === "experto") cuenta(); })
    .observe(html, { attributes: true, attributeFilter: ["data-estado", "data-lang"] });
})();
