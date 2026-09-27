// Utilería de sala: «Leer como» líder o experto. Cambia html[data-perfil]; el CSS oculta lo que no
// corresponde (.solo-lider / .solo-experto) y marca con «Experto» los bloques propios de ese perfil.
// Al cambiar, lo que aparece entra con un fundido corto (apagado con movimiento reducido) y el aviso
// dice cuántos bloques son solo del experto. No guarda nada: cada visita empieza en líder.
(function () {
  var html = document.documentElement;
  var reloj = null;
  function cuenta() {
    // Lo que está tras «Ver N más» cuenta igual: se abre un instante (sin pintar) para medirlo.
    var cerrados = document.querySelectorAll(".mas-resto[hidden]");
    for (var j = 0; j < cerrados.length; j++) cerrados[j].hidden = false;
    var todos = document.querySelectorAll(".marcado"), n = 0;
    for (var k = 0; k < todos.length; k++) if (todos[k].getClientRects().length) n++;
    for (var j2 = 0; j2 < cerrados.length; j2++) cerrados[j2].hidden = true;
    var ls = document.querySelectorAll("[data-cuenta-experto]");
    // Concordancia con el número: «1 bloque … es», «3 bloques … son»; sin bloques, se dice.
    var es = n === 0 ? "Esta vista no tiene bloques solo para este perfil."
      : n === 1 ? "1 bloque de esta página es solo para este perfil: lleva el rótulo «Experto» y fondo gris."
      : n + " bloques de esta página son solo para este perfil: llevan el rótulo «Experto» y fondo gris.";
    var en = n === 0 ? "This view has no blocks for this profile only."
      : n === 1 ? "1 block on this page is for this profile only: it carries the “Expert” label and a grey background."
      : n + " blocks on this page are for this profile only: they carry the “Expert” label and a grey background.";
    for (var i = 0; i < ls.length; i++)
      ls[i].innerHTML = '<span lang="es">' + es + '</span><span lang="en">' + en + "</span>";
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
