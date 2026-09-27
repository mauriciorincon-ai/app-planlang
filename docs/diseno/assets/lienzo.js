// Lienzo del diagrama (utilería de maqueta): desplazamiento lateral con índice de capas, sombras de
// borde, flechas del teclado y conmutador «lienzo · lista». Con movimiento reducido el salto es
// instantáneo (lo decide el CSS: scroll-behavior auto). El SVG no cambia; solo se desplaza.
(function () {
  function iniciar(marco) {
    var scroll = marco.querySelector(".lienzo-scroll");
    if (!scroll) return;
    var indice = marco.querySelector(".lienzo-indice");
    var columnas = marco.querySelectorAll("[data-columna]");
    function sombras() {
      marco.setAttribute(
        "data-cabe",
        scroll.scrollWidth <= scroll.clientWidth + 2 ? "true" : "false",
      );
      marco.setAttribute(
        "data-mas-izq",
        scroll.scrollLeft > 4 ? "true" : "false",
      );
      marco.setAttribute(
        "data-mas-der",
        scroll.scrollLeft + scroll.clientWidth < scroll.scrollWidth - 4
          ? "true"
          : "false",
      );
      if (!indice) return;
      var botones = indice.querySelectorAll("button");
      var activa = -1;
      for (var i = 0; i < columnas.length; i++) {
        var x = Number(columnas[i].getAttribute("data-columna")) - 8;
        if (x <= scroll.scrollLeft + 24) activa = i;
      }
      for (var j = 0; j < botones.length; j++)
        botones[j].setAttribute(
          "aria-current",
          j === activa ? "true" : "false",
        );
    }
    scroll.addEventListener("scroll", sombras, { passive: true });
    window.addEventListener("resize", sombras);
    if (indice) {
      indice.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-ir]");
        if (!b) return;
        var col = marco.querySelector(
          '[data-columna="' + b.getAttribute("data-ir") + '"]',
        );
        var x = col ? Number(col.getAttribute("data-columna")) - 8 : 0;
        scroll.scrollTo({ left: x, behavior: "auto" });
      });
    }
    scroll.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        scroll.scrollBy({ left: 202, behavior: "auto" });
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") {
        scroll.scrollBy({ left: -202, behavior: "auto" });
        e.preventDefault();
      }
    });
    sombras();
  }
  var marcos = document.querySelectorAll(".lienzo-marco");
  for (var i = 0; i < marcos.length; i++) iniciar(marcos[i]);

  document.addEventListener("click", function (e) {
    var b = e.target.closest(".vista-alterna button[data-vista]");
    if (!b) return;
    var grupo = b.closest("[data-vistas]");
    var botones = grupo.querySelectorAll(".vista-alterna button[data-vista]");
    for (var k = 0; k < botones.length; k++)
      botones[k].setAttribute(
        "aria-pressed",
        botones[k] === b ? "true" : "false",
      );
    var paneles = grupo.querySelectorAll("[data-panel]");
    for (var m = 0; m < paneles.length; m++)
      paneles[m].hidden =
        paneles[m].getAttribute("data-panel") !== b.getAttribute("data-vista");
  });
})();
