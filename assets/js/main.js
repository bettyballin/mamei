/* MAMEI Elektronik – main.js
   Kein Tracking, keine externen Dienste. Nur: Menü, Dark Mode, Öffnungsstatus, Formulare. */
(function () {
  "use strict";

  /* ---------- Theme (hell/dunkel) ----------
     Gespeichert wird ausschließlich die Wahl des Nutzers in localStorage ("mamei-theme").
     Ohne Wahl folgt die Seite der Systemeinstellung. */
  var root = document.documentElement;
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function applyTheme(t) { root.setAttribute("data-theme", t); }
  function storedTheme() { try { return localStorage.getItem("mamei-theme"); } catch (e) { return null; } }
  applyTheme(storedTheme() || (mq.matches ? "dark" : "light"));
  mq.addEventListener && mq.addEventListener("change", function (e) { if (!storedTheme()) applyTheme(e.matches ? "dark" : "light"); });

  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("mamei-theme", next); } catch (e) { /* privat/gesperrt: ignorieren */ }
    });
  });

  /* ---------- Header-Schatten beim Scrollen ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 8); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobiles Menü ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); } });
  }

  /* ---------- Öffnungszeiten ----------
     0 = Sonntag … 6 = Samstag. Zeiten in Minuten ab Mitternacht. */
  var HOURS = {
    1: [[600, 720], [900, 1080]],  // Montag 10–12, 15–18
    2: [[900, 1080]],              // Dienstag 15–18
    3: [],                         // Mittwoch geschlossen
    4: [[900, 1080]],              // Donnerstag 15–18
    5: [[600, 720], [900, 1080]],  // Freitag 10–12, 15–18
    6: [[600, 780]],               // Samstag 10–13
    0: []                          // Sonntag geschlossen
  };
  var DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  function fmt(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; }

  function openingStatus(now) {
    var day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var slots = HOURS[day] || [];
    for (var i = 0; i < slots.length; i++) {
      if (mins >= slots[i][0] && mins < slots[i][1]) return { open: true, text: "Jetzt geöffnet · bis " + fmt(slots[i][1]) + " Uhr" };
      if (mins < slots[i][0]) return { open: false, text: "Geschlossen · öffnet heute um " + fmt(slots[i][0]) + " Uhr" };
    }
    for (var d = 1; d <= 7; d++) {
      var nd = (day + d) % 7, ns = HOURS[nd] || [];
      if (ns.length) return { open: false, text: "Geschlossen · öffnet " + (d === 1 ? "morgen" : "am " + DAYS[nd]) + " um " + fmt(ns[0][0]) + " Uhr" };
    }
    return { open: false, text: "Geschlossen" };
  }

  var now = new Date();
  var st = openingStatus(now);
  document.querySelectorAll("[data-open-status]").forEach(function (el) {
    var dot = el.querySelector(".status-dot"), txt = el.querySelector("[data-open-text]");
    if (dot) dot.classList.add(st.open ? "open" : "closed");
    if (txt) txt.textContent = st.text;
  });
  document.querySelectorAll(".hours [data-day]").forEach(function (el) {
    if (parseInt(el.getAttribute("data-day"), 10) === now.getDay()) el.classList.add("today");
  });

  /* ---------- Formulare: Zeitstempel + einfache Prüfung ---------- */
  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    var ts = form.querySelector('input[name="ts"]');
    if (ts) ts.value = String(Date.now());
    form.addEventListener("submit", function (e) {
      var err = form.querySelector(".form-error");
      var consent = form.querySelector('input[name="consent"]');
      if (consent && !consent.checked) {
        e.preventDefault();
        if (err) { err.textContent = "Bitte bestätige den Datenschutzhinweis, damit wir deine Anfrage bearbeiten dürfen."; err.classList.add("is-visible"); }
        consent.focus();
        return;
      }
      var contact = form.querySelector('input[name="kontakt"]');
      if (contact && contact.value.trim().length < 5) {
        e.preventDefault();
        if (err) { err.textContent = "Bitte gib eine Telefonnummer oder E-Mail-Adresse an, damit wir dich erreichen können."; err.classList.add("is-visible"); }
        contact.focus();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Wird gesendet …"; }
    });
  });

  /* ---------- Fehlermeldung nach Rücksprung vom Server ---------- */
  if (/[?&]fehler=1/.test(location.search)) {
    var ferr = document.querySelector("form[data-validate] .form-error");
    if (ferr) { ferr.textContent = "Das hat leider nicht geklappt. Bitte prüfe deine Angaben oder ruf uns einfach an: 06654 9186 00."; ferr.classList.add("is-visible"); }
  }

  /* ---------- Aktuelles Jahr im Footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(now.getFullYear()); });
})();
