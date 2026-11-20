/* Sky Relojes: lógica compartida (header, carrito lateral, pedido por WhatsApp, tarjetas). */
(function () {
  "use strict";

  var WHATSAPP = "573182258333";
  var CLAVE_CARRITO = "skyrelojes_carrito_v1";
  var BASE = "/relojes";
  var RELOJES = window.RELOJES || [];

  var COLORES = {
    "Negro": "#1d1d1b", "Negro Total": "#000000", "Blanco": "#f4f3ef", "Azul": "#22426b",
    "Plateado": "#c7c9cc", "Rosado": "#e3b7b2", "Dorado": "#c9a24c", "Verde": "#4b5a33",
    "Café": "#6b4a2f", "Gris": "#8a8c8f",
    "Negro y azul": "linear-gradient(135deg, #1d1d1b 50%, #22426b 50%)",
    "Azul y rojo": "linear-gradient(135deg, #22426b 50%, #a8283a 50%)"
  };

  var WR = {
    diario: {
      corto: "Uso diario",
      largo: "Resistente al agua de uso diario",
      si: "Lluvia, salpicaduras y lavarte las manos",
      no: "Nadar, ducharte o sumergirlo"
    },
    "50": {
      corto: "50 m",
      largo: "Resistente al agua 50 metros (5 bar)",
      si: "Lluvia, lavarte las manos y nadar en piscina de forma ocasional",
      no: "Bucear, ducha caliente o sauna"
    },
    "100": {
      corto: "100 m",
      largo: "Resistente al agua 100 metros (10 bar)",
      si: "Nadar en piscina o mar y hacer snorkel",
      no: "Buceo con tanque, ducha caliente o sauna"
    },
    "200": {
      corto: "200 m",
      largo: "Resistente al agua 200 metros (20 bar)",
      si: "Nadar, snorkel y deportes acuáticos",
      no: "Buceo con tanque, ducha caliente o sauna"
    }
  };

  /* ---------- utilidades ---------- */
  function precio(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function porId(id) { for (var i = 0; i < RELOJES.length; i++) if (RELOJES[i].id === id) return RELOJES[i]; return null; }
  function variante(m, code) {
    for (var i = 0; i < m.variantes.length; i++) if (m.variantes[i].code === code) return m.variantes[i];
    return m.variantes[0];
  }
  function precioMin(m) { return Math.min.apply(null, m.variantes.map(function (v) { return v.precio; })); }
  function precioMax(m) { return Math.max.apply(null, m.variantes.map(function (v) { return v.precio; })); }
  function colores(m) {
    var vistos = {}; return m.variantes.map(function (v) { return v.color; }).filter(function (c) { return vistos[c] ? false : (vistos[c] = true); });
  }
  /* Primera foto del reloj puesto o en ambiente (prioriza el primer color) */
  function vida(m) {
    for (var i = 0; i < m.variantes.length; i++) if (m.variantes[i].fotos && m.variantes[i].fotos.length) return m.variantes[i].fotos[0];
    return "";
  }
  function urlProducto(m, code) { return BASE + "/producto?id=" + m.id + (code ? "&color=" + encodeURIComponent(code) : ""); }
  function fmtMm(n) { return String(n).replace(".", ","); }

  /* ---------- almacenamiento seguro ---------- */
  function leer() {
    try { var d = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || "[]"); return Array.isArray(d) ? d : []; }
    catch (e) { return memoria; }
  }
  var memoria = [];
  function guardar(items) {
    memoria = items;
    try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items)); } catch (e) { /* modo privado */ }
  }

  /* ---------- íconos ---------- */
  var ICO = {
    buscar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bolsa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5l14 14M19 5 5 19"/></svg>',
    basura: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>'
  };

  /* ---------- header, menú, buscador, footer ---------- */
  var LOGO = '<a class="logo" href="' + BASE + '" aria-label="Sky Relojes, inicio"><span class="logo-sky" aria-hidden="true"></span><span class="logo-sub">Relojes</span></a>';

  function montarMarco() {
    var actual = location.pathname.replace(/\/$/, "");
    function enlace(href, txt) {
      return '<a href="' + href + '"' + (actual === href.split("?")[0] && location.search === (href.split("?")[1] ? "?" + href.split("?")[1] : "") ? ' aria-current="page"' : "") + ">" + txt + "</a>";
    }
    var cab = document.getElementById("cabecera");
    if (cab) {
      cab.innerHTML =
        '<div class="anuncio">Relojes Casio <strong>originales</strong> · Pide fácil por WhatsApp</div>' +
        '<header class="header"><div class="contenedor header-in">' +
        '<button class="icono-btn menu-btn" id="abrirMenu" aria-label="Abrir menú">' + ICO.menu + "</button>" +
        LOGO +
        '<nav class="nav" aria-label="Principal">' +
        enlace(BASE + "/catalogo?g=Hombre", "Hombre") + enlace(BASE + "/catalogo?g=Mujer", "Mujer") +
        enlace(BASE + "/catalogo", "Todos los relojes") + '<a href="' + BASE + '#guia">Guía de tamaño</a></nav>' +
        '<div class="header-acciones">' +
        '<button class="icono-btn" id="abrirBusqueda" aria-label="Buscar" aria-expanded="false">' + ICO.buscar + "</button>" +
        '<button class="icono-btn" id="abrirCarrito" aria-label="Abrir carrito">' + ICO.bolsa + '<span class="contador" id="contador" hidden>0</span></button>' +
        "</div></div>" +
        '<div class="busqueda" id="busqueda" hidden><div class="contenedor"><form action="' + BASE + '/catalogo" role="search">' +
        '<label class="oculto-visual" for="q-header">Buscar relojes</label>' +
        '<input class="campo" id="q-header" name="q" type="search" placeholder="Busca por referencia, color o estilo: MTP-V002D, dorado, cuero..." autocomplete="off">' +
        '<button class="btn btn-verde" type="submit">Buscar</button></form></div></div></header>' +
        '<div class="menu-movil" id="menuMovil"><div class="velo" data-cerrar-menu></div><nav aria-label="Menú">' +
        '<button class="icono-btn" data-cerrar-menu aria-label="Cerrar menú" style="align-self:flex-end">' + ICO.cerrar + "</button>" +
        '<a href="' + BASE + '">Inicio</a><a href="' + BASE + '/catalogo?g=Hombre">Hombre</a><a href="' + BASE + '/catalogo?g=Mujer">Mujer</a>' +
        '<a href="' + BASE + '/catalogo">Todos los relojes</a><a href="' + BASE + '#guia">Guía de tamaño</a></nav></div>';
    }

    var pie = document.getElementById("pie");
    if (pie) {
      pie.innerHTML =
        '<footer class="footer"><div class="contenedor"><div class="footer-grid">' +
        "<div>" + LOGO +
        '<p style="max-width:340px;margin:18px 0 0;font-size:14.5px;color:var(--verde-300)">Relojes Casio originales, escogidos uno por uno. Tú eliges, nos escribes y te lo enviamos.</p></div>' +
        '<div><h3>Tienda</h3><ul><li><a href="' + BASE + '/catalogo?g=Hombre">Hombre</a></li><li><a href="' + BASE + '/catalogo?g=Mujer">Mujer</a></li><li><a href="' + BASE + '/catalogo?linea=Casio+Edifice">Edifice</a></li><li><a href="' + BASE + '/catalogo">Todos</a></li></ul></div>' +
        '<div><h3>Ayuda</h3><ul><li><a href="' + BASE + '#guia">Guía de tamaño</a></li><li><a href="' + BASE + '#preguntas">Preguntas frecuentes</a></li><li><a href="' + BASE + '#agua">Resistencia al agua</a></li></ul></div>' +
        '<div><h3>Contacto</h3><ul><li><a href="https://wa.me/' + WHATSAPP + '" target="_blank" rel="noopener">WhatsApp 318 225 8333</a></li></ul></div>' +
        '</div><div class="footer-legal"><span>© Sky Relojes</span><span>Casio, Edifice y sus logos son marcas de Casio Computer Co., Ltd.</span></div></div></footer>' +
        '<a class="wa-flotante" href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent("Hola Sky Relojes, tengo una pregunta sobre un reloj") + '" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">' + ICO.wa + "</a>";
    }

    var b = document.getElementById("abrirBusqueda");
    if (b) b.addEventListener("click", function () {
      var caja = document.getElementById("busqueda");
      caja.hidden = !caja.hidden;
      b.setAttribute("aria-expanded", String(!caja.hidden));
      if (!caja.hidden) document.getElementById("q-header").focus();
    });
    var m = document.getElementById("abrirMenu");
    var mm = document.getElementById("menuMovil");
    if (m) m.addEventListener("click", function () { mm.classList.add("abierto"); });
    document.querySelectorAll("[data-cerrar-menu]").forEach(function (el) { el.addEventListener("click", function () { mm.classList.remove("abierto"); }); });
    mm && mm.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { mm.classList.remove("abierto"); }); });
  }

  /* ---------- carrito ---------- */
  function montarCarrito() {
    var div = document.createElement("div");
    div.className = "carrito"; div.id = "carrito";
    div.setAttribute("aria-hidden", "true");
    div.innerHTML =
      '<div class="velo" data-cerrar-carrito></div>' +
      '<aside class="carrito-panel" role="dialog" aria-modal="true" aria-labelledby="tituloCarrito">' +
      '<div class="carrito-cabeza"><h2 id="tituloCarrito">Tu carrito</h2><button class="icono-btn" data-cerrar-carrito aria-label="Cerrar carrito">' + ICO.cerrar + "</button></div>" +
      '<div class="carrito-cols"><span>Producto</span><span>Total</span></div>' +
      '<div class="carrito-items" id="carritoItems"></div>' +
      '<div class="carrito-pie" id="carritoPie"></div></aside>';
    document.body.appendChild(div);
    var t = document.createElement("div"); t.className = "toast"; t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t);

    div.addEventListener("click", function (e) {
      var el = e.target.closest("[data-cerrar-carrito],[data-mas],[data-menos],[data-quitar],[data-pedir]");
      if (!el) return;
      if (el.hasAttribute("data-cerrar-carrito")) return cerrarCarrito();
      var items = leer();
      if (el.hasAttribute("data-mas")) items[+el.dataset.mas].qty = Math.min(items[+el.dataset.mas].qty + 1, 10);
      if (el.hasAttribute("data-menos")) { var i = +el.dataset.menos; items[i].qty -= 1; if (items[i].qty < 1) items.splice(i, 1); }
      if (el.hasAttribute("data-quitar")) items.splice(+el.dataset.quitar, 1);
      if (el.hasAttribute("data-pedir")) return pedirPorWhatsApp();
      guardar(items); pintarCarrito();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarCarrito(); });
    var ab = document.getElementById("abrirCarrito");
    if (ab) ab.addEventListener("click", abrirCarrito);
    pintarCarrito();
  }

  function lineas() {
    return leer().map(function (it) {
      var m = porId(it.id); if (!m) return null;
      var v = variante(m, it.code);
      return { m: m, v: v, qty: it.qty };
    }).filter(Boolean);
  }

  function pintarCarrito() {
    var ls = lineas();
    var cont = document.getElementById("contador");
    var n = ls.reduce(function (a, l) { return a + l.qty; }, 0);
    if (cont) { cont.textContent = n; cont.hidden = n === 0; }
    var caja = document.getElementById("carritoItems"), pie = document.getElementById("carritoPie");
    if (!caja) return;
    if (!ls.length) {
      caja.innerHTML = '<div class="carrito-vacio"><div class="titulo" style="font-size:26px;color:var(--tinta)">Tu carrito está vacío</div><p>Escoge tu reloj y aquí armamos el pedido.</p><a class="btn btn-verde" href="' + BASE + '/catalogo">Ver relojes</a></div>';
      pie.innerHTML = ""; return;
    }
    caja.innerHTML = ls.map(function (l, i) {
      return '<div class="item"><a class="item-img" href="' + urlProducto(l.m, l.v.code) + '"><img src="' + BASE + "/" + l.v.img + '" alt="Casio ' + esc(l.m.ref) + " " + esc(l.v.color) + '"></a>' +
        '<div><div class="item-nombre">Casio ' + esc(l.m.ref) + '</div><div class="item-det">Ref. ' + esc(l.v.code) + "<br>Color: " + esc(l.v.color) + "<br>" + precio(l.v.precio) + "</div>" +
        '<div class="cantidad"><button data-menos="' + i + '" aria-label="Quitar uno">−</button><span>' + l.qty + '</span><button data-mas="' + i + '" aria-label="Agregar uno">+</button></div>' +
        '<button class="quitar" data-quitar="' + i + '" aria-label="Eliminar del carrito">' + ICO.basura + "</button></div>" +
        '<div class="item-precio">' + precio(l.v.precio * l.qty) + "</div></div>";
    }).join("");
    var total = ls.reduce(function (a, l) { return a + l.v.precio * l.qty; }, 0);
    pie.innerHTML =
      '<div class="fila"><span>Subtotal</span><span>' + precio(total) + "</span></div>" +
      '<div class="fila"><span>Envío</span><span>Te lo confirmamos por WhatsApp</span></div>' +
      '<div class="fila total"><span>Total</span><span>' + precio(total) + " COP</span></div>" +
      '<button class="btn btn-wa btn-bloque" data-pedir style="margin-top:14px">' + ICO.wa.replace("<svg", '<svg width="20" height="20"') + " Terminar compra en WhatsApp</button>" +
      '<p class="nota">Te llega el resumen del pedido a nuestro WhatsApp y ahí confirmamos pago y envío.</p>';
  }

  function abrirCarrito() {
    var c = document.getElementById("carrito"); c.classList.add("abierto"); c.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var x = c.querySelector(".carrito-cabeza button"); x && x.focus();
  }
  function cerrarCarrito() {
    var c = document.getElementById("carrito"); if (!c) return;
    c.classList.remove("abierto"); c.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
  }

  function agregar(id, code, qty) {
    var items = leer();
    var ex = items.filter(function (it) { return it.id === id && it.code === code; })[0];
    if (ex) ex.qty = Math.min(ex.qty + (qty || 1), 10); else items.push({ id: id, code: code, qty: qty || 1 });
    guardar(items); pintarCarrito(); abrirCarrito();
  }

  function mensajePedido() {
    var ls = lineas();
    var total = ls.reduce(function (a, l) { return a + l.v.precio * l.qty; }, 0);
    var txt = "Hola Sky Relojes, quiero hacer este pedido:\n\n";
    ls.forEach(function (l, i) {
      txt += (i + 1) + ". Casio " + l.m.ref + "\n   Color: " + l.v.color + " (ref. " + l.v.code + ")\n   Cantidad: " + l.qty + " x " + precio(l.v.precio) + " = " + precio(l.v.precio * l.qty) + "\n\n";
    });
    txt += "Total: " + precio(total) + " COP\n\n¿Me confirman disponibilidad, envío y forma de pago?";
    return txt;
  }
  function pedirPorWhatsApp() {
    if (!lineas().length) return;
    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(mensajePedido()), "_blank", "noopener");
  }

  /* ---------- tarjeta de producto ---------- */
  function tarjeta(m, opts) {
    opts = opts || {};
    var v = m.variantes[0];
    var min = precioMin(m), max = precioMax(m);
    var cols = colores(m);
    var estrellas = m.rating ? '<span class="estrellas"><span class="e">★★★★★</span>' + String(m.rating.valor).replace(".", ",") + "</span>" : "";
    return '<a class="tarjeta" href="' + urlProducto(m) + '">' +
      (opts.tag ? '<span class="tarjeta-tag">' + esc(opts.tag) + "</span>" : "") +
      '<div class="tarjeta-img"><img loading="lazy" src="' + BASE + "/" + v.img + '" alt="Reloj Casio ' + esc(m.ref) + '">' +
      (vida(m) ? '<img class="alt" loading="lazy" src="' + BASE + "/" + vida(m) + '" alt="">' : "") + "</div>" +
      '<div class="tarjeta-cuerpo"><span class="tarjeta-linea">' + esc(m.linea) + " · " + esc(m.genero) + "</span>" +
      '<span class="tarjeta-nombre">Casio ' + esc(m.ref) + "</span>" + estrellas +
      '<span class="tarjeta-specs">' + fmtMm(m.ancho) + " mm · " + esc(m.correa) + " · " + WR[m.wr].corto + "</span>" +
      '<div class="tarjeta-pie"><span class="precio">' + (min !== max ? "<small>Desde</small>" : "") + precio(min) + "</span>" +
      '<span class="puntos" aria-label="' + cols.length + ' colores">' + cols.slice(0, 5).map(function (c) { return '<i class="punto" style="background:' + (COLORES[c] || "#ccc") + '" title="' + esc(c) + '"></i>'; }).join("") + "</span></div>" +
      "</div></a>";
  }

  function toast(msg) {
    var t = document.getElementById("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("visible");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("visible"); }, 2200);
  }

  /* Guía general de tamaño según el contorno de la muñeca (cm) */
  function rangoRecomendado(cm, genero) {
    var tabla = genero === "Mujer"
      ? [[14, 24, 28], [15.5, 26, 32], [17, 30, 36], [99, 34, 38]]
      : [[16, 34, 38], [17.5, 38, 41], [19, 40, 44], [99, 43, 48]];
    for (var i = 0; i < tabla.length; i++) if (cm < tabla[i][0]) return { min: tabla[i][1], max: tabla[i][2] };
    return { min: tabla[3][1], max: tabla[3][2] };
  }

  window.Tienda = {
    BASE: BASE, WHATSAPP: WHATSAPP, RELOJES: RELOJES, COLORES: COLORES, WR: WR, ICO: ICO,
    precio: precio, esc: esc, porId: porId, variante: variante, precioMin: precioMin, precioMax: precioMax,
    colores: colores, urlProducto: urlProducto, fmtMm: fmtMm, tarjeta: tarjeta, agregar: agregar,
    abrirCarrito: abrirCarrito, toast: toast, rangoRecomendado: rangoRecomendado
  };

  montarMarco();
  montarCarrito();
})();
