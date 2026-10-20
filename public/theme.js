/* Zentrix Flow — controle de tema (Auto / Claro / Escuro).
   Arquivo externo (sem JavaScript inline), carregado no <head> antes da pintura da página. */
(function () {
  var KEY = "zf-theme";
  var COR = { dark: "#011121", light: "#F4EFE3" }; // mesma cor do fundo do app em cada tema
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function lerPref() {
    try { var v = localStorage.getItem(KEY); return v === "light" || v === "dark" || v === "auto" ? v : "auto"; } catch (e) { return "auto"; }
  }
  function efetivo(pref) { return pref === "auto" ? (mq && mq.matches ? "dark" : "light") : pref; }

  function metaCor(tema) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m && document.head) { m = document.createElement("meta"); m.setAttribute("name", "theme-color"); document.head.appendChild(m); }
    if (m) m.setAttribute("content", COR[tema]);
  }

  function aplicar(pref) {
    var tema = efetivo(pref), el = document.documentElement;
    el.setAttribute("data-theme", tema);
    el.setAttribute("data-theme-pref", pref);
    metaCor(tema);
    try { window.dispatchEvent(new Event("zf-theme")); } catch (e) {}
  }

  window.zfTheme = {
    get: lerPref,
    effective: function () { return efetivo(lerPref()); },
    set: function (pref) {
      if (pref !== "light" && pref !== "dark") pref = "auto";
      try { localStorage.setItem(KEY, pref); } catch (e) {}
      aplicar(pref);
    },
  };

  aplicar(lerPref());
  // o <meta> do tema pode ainda não existir neste ponto do <head>; ajusta de novo ao terminar de carregar
  document.addEventListener("DOMContentLoaded", function () { metaCor(efetivo(lerPref())); });
  // no modo Auto, acompanha mudanças do sistema em tempo real
  var aoMudar = function () { if (lerPref() === "auto") aplicar("auto"); };
  if (mq) { if (mq.addEventListener) mq.addEventListener("change", aoMudar); else if (mq.addListener) mq.addListener(aoMudar); }
})();
