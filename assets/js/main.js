/* ICTDF — interações do site */
(function () {
  "use strict";

  var WHATSAPP = "556191678053";
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  var DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function waLink(msg) { return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg); }

  /* ---------- Tela de carregamento ----------
     Aparece na primeira página visitada na sessão; some quando a página termina de carregar
     (mínimo de 1,1s para completar um batimento, máximo de 4s). */
  var loader = $(".loader");
  if (loader && !document.documentElement.classList.contains("no-loader")) {
    var t0 = Date.now(), closed = false;
    var close = function () {
      if (closed) return; closed = true;
      setTimeout(function () {
        loader.classList.add("is-done");
        setTimeout(function () { loader.style.display = "none"; }, 700);
      }, Math.max(0, 1100 - (Date.now() - t0)));
    };
    if (document.readyState === "complete") close(); else window.addEventListener("load", close);
    setTimeout(close, 4000);
  }

  /* ---------- Menu ativo ---------- */
  var page = document.body.getAttribute("data-page");
  if (page) $$('[data-nav="' + page + '"]').forEach(function (a) { a.setAttribute("aria-current", "page"); });

  /* ---------- Header ---------- */
  var header = $(".header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.documentElement.classList.toggle("menu-open");
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open);
    });
    $$(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.documentElement.classList.remove("menu-open");
        document.body.classList.remove("menu-open");
      });
    });
  }

  /* ---------- Ano no rodapé ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Marquee: duplica o conteúdo para loop contínuo ---------- */
  $$(".marquee__track").forEach(function (t) { t.innerHTML += t.innerHTML; });

  /* ---------- Palavras que acendem com o scroll ---------- */
  $$(".reveal-words").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
  });
  var wordBlocks = $$(".reveal-words");
  function lightWords() {
    var vh = window.innerHeight;
    wordBlocks.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      var ws = el.querySelectorAll(".w");
      var n = Math.round(p * ws.length);
      for (var i = 0; i < ws.length; i++) ws[i].classList.toggle("on", i < n);
    });
  }
  if (wordBlocks.length) { window.addEventListener("scroll", lightWords, { passive: true }); lightWords(); }

  /* ---------- Revelar ao rolar + contadores ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    var dur = 1800, start = null;
    function fmt(v) { return v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(target * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("is-in");
        if (el.hasAttribute("data-count")) countUp(el);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    $$("[data-reveal], .circled, [data-count]").forEach(function (el) { io.observe(el); });
  } else {
    $$("[data-reveal], .circled").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* =========================================================
     Hero da home: vídeo controlado pelo scroll
     O vídeo foi convertido em quadros WebP (assets/video/hero) e é desenhado num canvas
     conforme a rolagem. Os textos [data-in]/[data-out] usam o progresso (0 a 1) da seção.
     ========================================================= */
  var scrolly = $(".scrolly");
  if (scrolly) {
    var canvas = $(".scrolly__canvas", scrolly);
    var ctx = canvas.getContext("2d");
    var total = +scrolly.getAttribute("data-count-frames");
    var pattern = scrolly.getAttribute("data-frames");
    var frames = new Array(total);
    var items = $$(".scrolly__item", scrolly).map(function (el) {
      return { el: el, a: +el.getAttribute("data-in"), b: +el.getAttribute("data-out"), left: el.classList.contains("scrolly__item--left") };
    });
    var shadeL = $(".scrolly__shade--left", scrolly), shadeR = $(".scrolly__shade--right", scrolly);
    var bar = $(".scrolly__progress", scrolly);
    var target = 0, current = 0, drawn = -1, ticking = false;

    function src(i) { var n = String(i + 1); while (n.length < 3) n = "0" + n; return pattern.replace("{n}", n); }

    // Carrega primeiro um quadro a cada 16, depois preenche os intervalos (8, 4, 2, 1),
    // assim a rolagem já funciona enquanto o restante baixa.
    var order = [], seen = {};
    [16, 8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < total; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); }
    });
    var next = 0;
    function loadNext() {
      if (next >= order.length) return;
      var i = order[next++], img = new Image();
      img.decoding = "async";
      img.onload = function () {
        frames[i] = img;
        if (i === 0) scrolly.classList.add("is-ready");
        if (Math.abs(i - current) < 20) { drawn = -1; draw(Math.round(current)); }
        loadNext();
      };
      img.onerror = loadNext;
      img.src = src(i);
    }
    for (var k = 0; k < 6; k++) loadNext();

    function nearest(i) {
      for (var d = 0; d < total; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    }

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      drawn = -1; draw(Math.round(current));
    }

    function draw(idx) {
      var img = nearest(idx);
      if (!img || (idx === drawn)) return;
      var cw = canvas.width, ch = canvas.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      var w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      drawn = frames[idx] ? idx : -1;
    }

    function progress() {
      var r = scrolly.getBoundingClientRect();
      // Enquanto a seção ainda não chegou ao topo, desloca os textos para a parte visível
      scrolly.style.setProperty("--top", Math.max(0, r.top).toFixed(0) + "px");
      var span = r.height - window.innerHeight;
      return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    }

    function updateText(p) {
      var l = 0, rr = 0, fade = 0.04;
      items.forEach(function (it) {
        var o = 0;
        if (p >= it.a && p <= it.b) o = Math.min(1, (p - it.a) / fade + (it.a === 0 ? 1 : 0), (it.b - p) / fade);
        o = Math.max(0, Math.min(1, o));
        var ty = p < it.a + fade ? (1 - o) * 40 : -(1 - o) * 40;
        it.el.style.opacity = o;
        it.el.style.visibility = o > 0.01 ? "visible" : "hidden";
        it.el.style.setProperty("--ty", ty.toFixed(1) + "px");
        if (it.left) l = Math.max(l, o); else rr = Math.max(rr, o);
      });
      shadeL.style.opacity = l;
      shadeR.style.opacity = rr;
      bar.style.setProperty("--p", p.toFixed(4));
      scrolly.classList.toggle("is-scrolled", p > 0.02);
    }

    function render() {
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.05) current = target;
      draw(Math.round(current));
      if (current !== target) requestAnimationFrame(render); else ticking = false;
    }

    function onScrolly() {
      var p = progress();
      updateText(p);
      target = p * (total - 1);
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }

    window.addEventListener("scroll", onScrolly, { passive: true });
    window.addEventListener("resize", size);
    size();
    onScrolly();
  }

  /* ---------- Lista numerada (acordeão) ---------- */
  $$(".numlist__head").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".numlist__item");
      var list = btn.closest(".numlist");
      var wasOpen = item.classList.contains("open");
      $$(".numlist__item", list).forEach(function (i) { i.classList.remove("open"); i.querySelector(".numlist__head").setAttribute("aria-expanded", "false"); });
      if (!wasOpen) { item.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- Abas ---------- */
  $$("[data-tabs]").forEach(function (wrap) {
    var btns = $$(".tabs button", wrap);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.toggle("active", x === b); x.setAttribute("aria-selected", x === b); });
        $$(".tab-panel", wrap).forEach(function (p) { p.classList.toggle("active", p.id === b.getAttribute("data-target")); });
      });
    });
  });

  /* ---------- Formulários → WhatsApp ----------
     Sem back-end: o formulário monta a mensagem e abre o WhatsApp da Central.
     Para usar um back-end, troque este trecho por um fetch() para a sua API. */
  $$("form[data-wa]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var title = form.getAttribute("data-wa");
      var lines = [title];
      $$("input, select, textarea", form).forEach(function (f) {
        if (!f.name || !f.value || f.type === "checkbox") return;
        var label = form.querySelector('label[for="' + f.id + '"]');
        lines.push((label ? label.textContent.replace("*", "").trim() : f.name) + ": " + f.value);
      });
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      form.classList.add("sent");
    });
  });

  /* =========================================================
     Páginas de venda: agenda de turmas
     data-agenda='{"curso":"ACLS","turmas":[["2026-11-07","2026-11-08"], ...]}'
     Para cada turma é possível informar o link do e-inscricao em "links".
     ========================================================= */
  var agenda = $("[data-agenda]");
  if (agenda) {
    var cfg = JSON.parse(agenda.getAttribute("data-agenda"));
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    var selected = null;

    function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
    function label(t) {
      var a = parse(t[0]), b = t[1] ? parse(t[1]) : null;
      var dias = b ? pad(a.getDate()) + " e " + pad(b.getDate()) : pad(a.getDate());
      return { dias: dias, mes: MESES[a.getMonth()], mesCurto: MESES_CURTO[a.getMonth()], ano: a.getFullYear(),
        semana: b ? DIAS[a.getDay()] + " e " + DIAS[b.getDay()] : DIAS[a.getDay()],
        texto: dias + " de " + MESES[a.getMonth()] + " de " + a.getFullYear() };
    }
    function pad(n) { return (n < 10 ? "0" : "") + n; }

    // Turmas já iniciadas saem da lista automaticamente
    var firstOpen = -1;
    agenda.innerHTML = cfg.turmas.map(function (t, i) {
      if (parse(t[0]) <= hoje) return "";
      if (firstOpen < 0) firstOpen = i;
      var l = label(t);
      var status = firstOpen === i ? "Próxima turma" : "Inscrições abertas";
      return '<button type="button" class="turma" data-i="' + i + '" aria-pressed="false">' +
        '<span class="turma__status' + (firstOpen === i ? " turma__status--next" : "") + '">' + status + "</span>" +
        '<span class="turma__month">' + l.mesCurto + " " + l.ano + "</span>" +
        '<span class="turma__days">' + l.dias + "</span>" +
        '<span class="turma__wd">' + l.semana + "</span></button>";
    }).join("");

    function choose(i) {
      selected = i;
      $$(".turma", agenda).forEach(function (b) {
        var on = +b.getAttribute("data-i") === i;
        b.classList.toggle("selected", on);
        b.setAttribute("aria-pressed", on);
      });
      var l = label(cfg.turmas[i]);
      $$("[data-turma-label]").forEach(function (el) { el.textContent = l.texto; });
      var href = (cfg.links && cfg.links[cfg.turmas[i][0]]) ||
        waLink("Olá! Quero me inscrever no curso " + cfg.curso + " do ICTDF, turma de " + l.texto + ".");
      $$("[data-buy]").forEach(function (a) { a.setAttribute("href", href); a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); });
    }

    agenda.addEventListener("click", function (e) {
      var b = e.target.closest(".turma");
      if (b && !b.disabled) choose(+b.getAttribute("data-i"));
    });

    if (firstOpen >= 0) choose(firstOpen);
    else {
      agenda.innerHTML = '<p class="muted">As datas das próximas turmas serão divulgadas em breve. Fale com o Centro de Treinamento para entrar na lista de espera.</p>';
      $$("[data-turma-label]").forEach(function (el) { el.textContent = "novas turmas em breve"; });
      $$("[data-buy]").forEach(function (a) { a.setAttribute("href", waLink("Olá! Gostaria de saber sobre as próximas turmas do curso " + cfg.curso + " do ICTDF.")); });
    }
  }

  /* ---------- Barra fixa de compra ---------- */
  var sticky = $(".sticky-buy");
  if (sticky) {
    document.body.classList.add("has-sticky");
    var hero = $(".sales-hero");
    var price = $("#investimento");
    var heroGone = false, priceVisible = false;
    function upd() { sticky.classList.toggle("show", heroGone && !priceVisible); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting; upd(); }).observe(hero);
      if (price) new IntersectionObserver(function (e) { priceVisible = e[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe(price);
    }
  }
})();
