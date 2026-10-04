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
  // Dentro de un teléfono de sala (iframe): solo producto; jamás carga otros teléfonos (sin recursión).
  var enTelefono = params.get("marco") === "telefono";
  if (enTelefono) html.setAttribute("data-marco", "telefono");

  // Teléfonos de sala: cargan la misma página a 390 px con el tema y el idioma de la página madre.
  var listo = false;
  function telefonos() {
    if (!listo || enTelefono || !window.matchMedia("(min-width: 900px)").matches) return;
    var marcos = document.querySelectorAll("iframe[data-src]");
    for (var i = 0; i < marcos.length; i++) {
      var partes = marcos[i].getAttribute("data-src").split("#");
      var ruta = partes[0];
      var url =
        ruta +
        (ruta.indexOf("?") >= 0 ? "&" : "?") +
        "tema=" +
        html.getAttribute("data-theme") +
        "&lang=" +
        html.getAttribute("data-lang") +
        (partes[1] ? "#" + partes[1] : "");
      if (marcos[i].getAttribute("src") !== url) marcos[i].setAttribute("src", url);
    }
  }

  function marcar(selector, attr, valor) {
    var botones = document.querySelectorAll("button[" + selector + "]");
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
    if (!enTelefono) guardar("tema", v);
    telefonos();
  }
  function idioma(v) {
    html.setAttribute("data-lang", v);
    html.lang = v;
    marcar("data-lang-set", "data-lang", v);
    var t = document.querySelector("title");
    if (t && t.getAttribute("data-" + v))
      t.textContent = t.getAttribute("data-" + v);
    if (!enTelefono) guardar("lang", v);
    telefonos();
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
    var b = e.target.closest(
      "button[data-theme-set],button[data-lang-set],button[data-estado]",
    );
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
  var primero = document.querySelector("button[data-estado]");
  var e0 =
    params.get("estado") || (primero && primero.getAttribute("data-estado"));
  if (e0) estado(e0);
  listo = true;
  telefonos();
})();
