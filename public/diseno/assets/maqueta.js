// Utilería de la SALA DE DISEÑO (no es producto): tema, idioma y estado de cada página.
// - html[data-theme]  oscuro | claro     (botones [data-theme-set]; ?tema=)
// - html[data-lang]   es | en            (botones [data-lang-set]; ?lang=)
// - html[data-estado] <estado>           (botones [data-estado]; ?estado=) → muestra [data-si]
// Persistencia por visitante en localStorage, envuelta en try/catch (puede no existir).
(function () {
  var html = document.documentElement;
  var guardar = function (k, v) {
    try {
      localStorage.setItem("planlang-sala." + k, v);
    } catch (e) {}
  };
  var leer = function (k) {
    try {
      return localStorage.getItem("planlang-sala." + k);
    } catch (e) {
      return null;
    }
  };
  var params = new URLSearchParams(location.search);

  function marcar(selector, attr, valor) {
    var botones = document.querySelectorAll("[" + selector + "]");
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute(
        "aria-pressed",
        botones[i].getAttribute(selector) === valor ? "true" : "false",
      );
    }
  }
  function tema(v) {
    html.setAttribute("data-theme", v);
    marcar("data-theme-set", "data-theme", v);
    guardar("tema", v);
  }
  function idioma(v) {
    html.setAttribute("data-lang", v);
    html.lang = v;
    marcar("data-lang-set", "data-lang", v);
    var t = document.querySelector("title");
    if (t && t.getAttribute("data-" + v))
      t.textContent = t.getAttribute("data-" + v);
    guardar("lang", v);
  }
  function estado(v) {
    html.setAttribute("data-estado", v);
    marcar("data-estado", "data-estado", v);
    var bloques = document.querySelectorAll("[data-si]");
    for (var i = 0; i < bloques.length; i++) {
      var lista = bloques[i]
        .getAttribute("data-si")
        .replace(/^vista:/, "")
        .split("|");
      bloques[i].classList.toggle("mq-visible", lista.indexOf(v) >= 0);
    }
    var notas = document.querySelectorAll(".mq-nota p[data-para]");
    for (var j = 0; j < notas.length; j++)
      notas[j].hidden = notas[j].getAttribute("data-para") !== v;
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-theme-set],[data-lang-set],[data-estado]");
    if (!b) return;
    if (b.hasAttribute("data-theme-set"))
      tema(b.getAttribute("data-theme-set"));
    else if (b.hasAttribute("data-lang-set"))
      idioma(b.getAttribute("data-lang-set"));
    else estado(b.getAttribute("data-estado"));
  });

  tema(
    params.get("tema") ||
      leer("tema") ||
      html.getAttribute("data-theme") ||
      "oscuro",
  );
  idioma(
    params.get("lang") ||
      leer("lang") ||
      html.getAttribute("data-lang") ||
      "es",
  );
  var primero = document.querySelector("[data-estado]");
  var e0 =
    params.get("estado") || (primero && primero.getAttribute("data-estado"));
  if (e0) estado(e0);
})();
