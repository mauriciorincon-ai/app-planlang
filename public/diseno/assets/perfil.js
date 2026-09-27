// Utilería de sala: «Leer como» líder o experto. Cambia html[data-perfil]; el CSS oculta lo que no
// corresponde (.solo-lider / .solo-experto). No guarda nada: cada visita empieza en líder.
(function () {
  var html = document.documentElement;
  function poner(v) {
    html.setAttribute("data-perfil", v);
    var bs = document.querySelectorAll("button[data-perfil-set]");
    for (var i = 0; i < bs.length; i++)
      bs[i].setAttribute("aria-pressed", bs[i].getAttribute("data-perfil-set") === v ? "true" : "false");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-perfil-set]");
    if (b) poner(b.getAttribute("data-perfil-set"));
  });
  var p = new URLSearchParams(location.search).get("perfil");
  poner(p === "experto" ? "experto" : "lider");
})();
