(() => {
  "use strict";
  const C = window.CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Fill content from config ---------- */
  const date = new Date(C.date || "2027-05-15T16:00:00-03:00");
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const weekdays = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
  const tz = { timeZone: "America/Sao_Paulo" };
  const part = (o) => new Intl.DateTimeFormat("pt-BR", { ...tz, ...o }).format(date);
  const dd = part({ day: "2-digit" }), mm = part({ month: "2-digit" }), yyyy = part({ year: "numeric" });
  const hh = part({ hour: "2-digit", hour12: false }), mi = part({ minute: "2-digit" }).padStart(2, "0");
  const monthIdx = Number(mm) - 1;
  const wd = new Date(`${yyyy}-${mm}-${dd}T12:00:00`).getDay();

  const values = {
    name1: C.name1, name2: C.name2, monogram: C.monogram,
    names: `${C.name1} &amp; ${C.name2}`,
    dateShort: `${dd} · ${mm} · ${yyyy}`,
    day: dd, month: months[monthIdx], year: yyyy, weekday: weekdays[wd],
    time: `${hh}h${mi}`, city: C.city, venueName: C.venueName, venueAddress: C.venueAddress,
    rsvpDeadline: C.rsvpDeadline, pixKey: C.pixKey,
  };
  $$("[data-cfg]").forEach((el) => {
    const v = values[el.dataset.cfg];
    if (v != null && v !== "") el.innerHTML = String(v).replace(/&(?!amp;|lt;|gt;|nbsp;)/g, "&amp;");
  });
  document.title = `${C.name1} & ${C.name2} · Convite de Casamento`;

  // Links
  const ll = `${C.lat},${C.lng}`;
  const q = encodeURIComponent(C.mapsQuery || ll);
  $("#mapsLink").href = C.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${q}`;
  $("#wazeLink").href = `https://waze.com/ul?ll=${ll}&navigate=yes`;
  $("#giftListLink").href = C.giftListUrl || "#";
  const mapFrame = $("#mapFrame");
  // load map only when near viewport
  new IntersectionObserver((es, o) => {
    if (es[0].isIntersecting) { mapFrame.src = `https://www.google.com/maps?q=${q}&z=16&output=embed`; o.disconnect(); }
  }, { rootMargin: "400px" }).observe(mapFrame);

  /* ---------- 2. Split hero names into letters ---------- */
  $$(".split").forEach((el) => {
    const txt = el.textContent;
    el.setAttribute("aria-label", txt);
    el.innerHTML = [...txt].map((c, i) =>
      `<span class="ch" aria-hidden="true" style="transition-delay:${0.5 + i * 0.07}s">${c === " " ? "&nbsp;" : c}</span>`
    ).join("");
  });

  /* ---------- 3. Gold dust particles ---------- */
  function dust(canvas, count = 40) {
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    let w, h, dpr, parts = [], running = false, raf;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (init) => ({
      x: Math.random() * w, y: init ? Math.random() * h : h + 10,
      r: Math.random() * 1.6 + 0.4, s: Math.random() * 0.35 + 0.1,
      drift: (Math.random() - 0.5) * 0.3, a: Math.random() * 0.6 + 0.2, t: Math.random() * 6.28,
    });
    resize(); parts = Array.from({ length: count }, () => spawn(true));
    addEventListener("resize", resize);
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.s; p.x += p.drift + Math.sin((p.t += 0.01)) * 0.15;
        if (p.y < -10) Object.assign(p, spawn(false));
        const tw = 0.5 + Math.sin(p.t * 3) * 0.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(232,210,160,${p.a * (0.4 + tw * 0.6)})`;
        ctx.shadowColor = "rgba(232,210,160,.8)"; ctx.shadowBlur = 6;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; loop(); }
      else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
  }
  dust($("#dust-intro"), 55);
  dust($("#dust-hero"), 35);
  dust($("#dust-story"), 30);

  /* ---------- 4. Intro / open invitation ---------- */
  const intro = $("#intro");
  let audio = null;
  const musicBtn = $("#music");
  if (C.music) {
    audio = new Audio(C.music); audio.loop = true; audio.volume = 0.55;
    musicBtn.hidden = false;
    musicBtn.addEventListener("click", () => {
      if (audio.paused) { audio.play(); musicBtn.classList.remove("is-paused"); }
      else { audio.pause(); musicBtn.classList.add("is-paused"); }
    });
  }
  const openInvite = () => {
    if (intro.classList.contains("is-open")) return;
    intro.classList.add("is-open");
    if (audio) audio.play().catch(() => musicBtn.classList.add("is-paused"));
    scrollTo(0, 0);
    setTimeout(() => document.body.classList.add("is-ready"), 350);
    setTimeout(() => {
      document.body.classList.remove("is-locked");
      intro.classList.add("is-gone");
    }, 1600);
  };
  $("#openInvite").addEventListener("click", openInvite);
  // Always start at the top behind the envelope
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  // Skip intro when arriving via an anchor (e.g. link direto para #rsvp)
  if (!location.hash || location.hash === "#inicio") scrollTo(0, 0);
  else {
    intro.classList.add("is-open", "is-gone"); document.body.classList.remove("is-locked");
    document.body.classList.add("is-ready");
  }

  /* ---------- 5. Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .swatches, .tl, .arch--reveal").forEach((el) => io.observe(el));
  // clip-path hides the element itself, so watch its parent instead
  const ioClip = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target._clipChild.classList.add("is-in"); ioClip.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  $$(".reveal-clip").forEach((el) => {
    const p = el.parentElement; p._clipChild = el; ioClip.observe(p);
  });

  /* ---------- 6. Parallax + progress + topbar + timeline line ---------- */
  const speedEls = $$("[data-speed]");
  const topbar = $("#topbar"), progress = $("#progress");
  const timeline = $("#timeline"), tlLine = $(".timeline__line span");
  const hero = $(".hero");
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    topbar.classList.toggle("is-visible", y > hero.offsetHeight * 0.75);
    if (!reduce) {
      for (const el of speedEls) {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const center = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0,${(center * -parseFloat(el.dataset.speed)).toFixed(1)}px,0)`;
      }
    }
    const tr = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh * 0.7 - tr.top) / tr.height));
    tlLine.style.setProperty("--p", p.toFixed(3));
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- 7. Countdown ---------- */
  const tEls = { d: $('[data-t="d"]'), h: $('[data-t="h"]'), m: $('[data-t="m"]'), s: $('[data-t="s"]') };
  const set = (el, v) => {
    if (el.textContent === v) return;
    el.textContent = v; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
  };
  const tick = () => {
    let diff = Math.max(0, date - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    set(tEls.d, String(d)); set(tEls.h, String(h).padStart(2, "0"));
    set(tEls.m, String(m).padStart(2, "0")); set(tEls.s, String(s).padStart(2, "0"));
  };
  tick(); setInterval(tick, 1000);

  /* ---------- 8. Add to calendar (.ics) ---------- */
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(date.getTime() + (C.durationHours || 8) * 36e5);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Convite//PT-BR", "BEGIN:VEVENT",
    `UID:${fmt(date)}-casamento@convite`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(date)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:Casamento ${C.name1} & ${C.name2}`,
    `LOCATION:${(C.venueName + " - " + C.city).replace(/,/g, "\\,")}`,
    `GEO:${C.lat};${C.lng}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Amanhã é o casamento!", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  $("#addCalendar").href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));

  /* ---------- 9. Gallery marquee (duplicate for seamless loop) + lightbox ---------- */
  $$(".marquee__track").forEach((t) => {
    $$(".ph", t).forEach((ph) => { const c = ph.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.tabIndex = -1; t.appendChild(c); });
  });
  const lb = $("#lightbox"), lbImg = $("img", lb);
  const closeLb = () => { lb.classList.remove("is-open"); setTimeout(() => (lb.hidden = true), 400); };
  $$(".ph").forEach((ph) => ph.addEventListener("click", () => {
    lbImg.src = ph.dataset.full; lbImg.alt = $("img", ph).alt;
    lb.hidden = false; requestAnimationFrame(() => lb.classList.add("is-open"));
  }));
  lb.addEventListener("click", closeLb);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  // Touch: pause marquee while finger is on it
  $$(".marquee").forEach((m) => {
    const t = $(".marquee__track", m);
    m.addEventListener("touchstart", () => (t.style.animationPlayState = "paused"), { passive: true });
    m.addEventListener("touchend", () => (t.style.animationPlayState = ""), { passive: true });
  });

  /* ---------- 10. Toast + PIX copy ---------- */
  const toast = $("#toast");
  let toastT;
  const showToast = (msg) => {
    toast.textContent = msg; toast.classList.add("is-show");
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("is-show"), 2600);
  };
  $("#pixCopy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(C.pixKey); }
    catch {
      const ta = document.createElement("textarea"); ta.value = C.pixKey; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); ta.remove();
    }
    $("#pixLabel").textContent = "Chave copiada ✓";
    showToast("Chave PIX copiada. Obrigado pelo carinho!");
    setTimeout(() => ($("#pixLabel").textContent = "Copiar chave"), 3000);
  });

  /* ---------- 11. RSVP → WhatsApp ---------- */
  const form = $("#rsvpForm"), qtd = $("#qtd"), guestsRow = $("#guestsRow");
  let count = 1;
  $$(".stepper button").forEach((b) => b.addEventListener("click", () => {
    count = Math.min(10, Math.max(1, count + Number(b.dataset.step)));
    qtd.textContent = count;
  }));
  $$('input[name="vai"]').forEach((r) => r.addEventListener("change", () => {
    guestsRow.classList.toggle("is-hidden", form.vai.value === "nao");
  }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    const field = form.nome.closest(".field");
    if (nome.length < 2) {
      field.classList.add("is-invalid"); $("#formError").textContent = "Por favor, escreva seu nome.";
      form.nome.focus(); return;
    }
    field.classList.remove("is-invalid"); $("#formError").textContent = "";
    const vai = form.vai.value === "sim";
    const msg = form.msg.value.trim();
    let text = vai
      ? `Olá, ${C.name1} e ${C.name2}! 💍\nConfirmo minha presença no casamento.\n\n👤 Nome: ${nome}\n👥 Pessoas: ${count}`
      : `Olá, ${C.name1} e ${C.name2}!\nInfelizmente não poderei comparecer ao casamento. 💚\n\n👤 Nome: ${nome}`;
    if (msg) text += `\n\n💌 Recado: ${msg}`;
    window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
    showToast(vai ? "Que alegria! Finalize o envio no WhatsApp." : "Obrigado por avisar! Finalize no WhatsApp.");
  });
})();
