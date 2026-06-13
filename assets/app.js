/* =====================================================================
   X-Pecto Media — 2026 site interactions
   Vanilla JS, no dependencies. Safe to enqueue as a single file in WP.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Header: condensed state on scroll ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      header.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        links.classList.remove("open");
        header.classList.remove("menu-open");
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  function revealAll() { revealEls.forEach(function (el) { el.classList.add("in"); }); }
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
    // Fail-safe: some environments (zero-height viewport, background tabs, reduced
    // motion) never report an intersection. If nothing has revealed shortly after
    // load, show everything so content is never stuck invisible.
    window.setTimeout(function () {
      if (!document.querySelector(".reveal.in")) revealAll();
    }, 1100);
  } else {
    revealAll();
  }

  /* ---------- Footer year ---------- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ===================================================================
     Booking request calendar
     =================================================================== */
  var cal = document.querySelector("[data-calendar]");
  if (cal) {
    var MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    var DOW = ["Mo","Di","Mi","Do","Fr","Sa","So"];

    var monthEl = cal.querySelector(".month");
    var gridEl = cal.querySelector(".cal-grid");
    var prevBtn = cal.querySelector("[data-prev]");
    var nextBtn = cal.querySelector("[data-next]");
    var dateInput = document.querySelector("[data-date-input]");
    var datePill = document.querySelector("[data-date-pill]");
    var datePillText = document.querySelector("[data-date-pill-text]");

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var minView = new Date(today.getFullYear(), today.getMonth(), 1);
    var maxView = new Date(today.getFullYear() + 2, today.getMonth(), 1);
    var selected = null;

    var dowEl = cal.querySelector(".cal-dow");
    if (dowEl) {
      dowEl.innerHTML = DOW.map(function (d) { return "<span>" + d + "</span>"; }).join("");
    }

    function fmt(d) {
      var dd = String(d.getDate()).padStart(2, "0");
      var mm = String(d.getMonth() + 1).padStart(2, "0");
      return d.getFullYear() + "-" + mm + "-" + dd;
    }
    function fmtLong(d) {
      return d.getDate() + ". " + MONTHS[d.getMonth()] + " " + d.getFullYear();
    }

    function render() {
      monthEl.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
      prevBtn.disabled = view <= minView;
      nextBtn.disabled = view >= maxView;

      var year = view.getFullYear();
      var month = view.getMonth();
      var first = new Date(year, month, 1);
      // Monday-first offset
      var lead = (first.getDay() + 6) % 7;
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      var html = "";
      for (var i = 0; i < lead; i++) html += '<div class="cal-day empty"></div>';

      for (var day = 1; day <= daysInMonth; day++) {
        var d = new Date(year, month, day);
        var cls = "cal-day";
        var dow = d.getDay();
        if (dow === 0 || dow === 6) cls += " weekend";
        if (d < today) cls += " past";
        if (d.getTime() === today.getTime()) cls += " today";
        if (selected && d.getTime() === selected.getTime()) cls += " selected";
        var attr = d < today ? "" : ' data-day="' + fmt(d) + '"';
        html += '<button type="button" class="' + cls + '"' + attr + (d < today ? " disabled" : "") + ">" + day + "</button>";
      }
      gridEl.innerHTML = html;
    }

    function selectDate(iso) {
      var parts = iso.split("-");
      selected = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      selected.setHours(0, 0, 0, 0);
      if (dateInput) dateInput.value = iso;
      if (datePill && datePillText) {
        datePillText.textContent = fmtLong(selected);
        datePill.style.display = "inline-flex";
      }
      render();
    }

    gridEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-day]");
      if (btn) selectDate(btn.getAttribute("data-day"));
    });
    prevBtn.addEventListener("click", function () {
      if (view > minView) { view.setMonth(view.getMonth() - 1); render(); }
    });
    nextBtn.addEventListener("click", function () {
      if (view < maxView) { view.setMonth(view.getMonth() + 1); render(); }
    });

    // allow manual date entry to sync the calendar
    if (dateInput) {
      dateInput.addEventListener("change", function () {
        if (dateInput.value) {
          var d = new Date(dateInput.value);
          if (!isNaN(d)) { view = new Date(d.getFullYear(), d.getMonth(), 1); selectDate(dateInput.value); }
        }
      });
    }

    render();
  }

  /* ===================================================================
     Form handling — no-backend mailto fallback for the static preview.
     On WordPress: replace handleBookingForm() with a form-plugin submit
     (WPForms / Fluent Forms / Contact Form 7) — see README.md.
     =================================================================== */
  function buildBody(fd, fields) {
    return fields
      .filter(function (f) { return fd.get(f.name); })
      .map(function (f) { return f.label + ": " + fd.get(f.name); })
      .join("\n");
  }

  var booking = document.querySelector("[data-booking-form]");
  if (booking) {
    booking.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!booking.reportValidity()) return;
      var fd = new FormData(booking);
      var fields = [
        { name: "datum", label: "Veranstaltungsdatum" },
        { name: "leistung", label: "Gewünschte Leistung" },
        { name: "ort", label: "Veranstaltungsort" },
        { name: "umgebung", label: "Indoor / Outdoor" },
        { name: "gaeste", label: "Erwartete Gäste" },
        { name: "lautsprecher", label: "Lautsprecher benötigt" },
        { name: "licht", label: "Lichttechnik benötigt" },
        { name: "personal", label: "Personal vor Ort" },
        { name: "nachricht", label: "Nachricht" },
        { name: "name", label: "Name" },
        { name: "telefon", label: "Telefon" },
        { name: "email", label: "E-Mail" }
      ];
      var subject = "Buchungsanfrage" + (fd.get("datum") ? " – " + fd.get("datum") : "") + " (xpm-vt.de)";
      var body = "Neue Buchungsanfrage über die Website:\n\n" + buildBody(fd, fields);
      var mailto = "mailto:info@xpm-vt.de?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

      var panel = booking.closest(".panel");
      var success = panel.querySelector("[data-success]");
      booking.style.display = "none";
      if (success) {
        var dateOut = success.querySelector("[data-success-date]");
        if (dateOut && fd.get("datum")) dateOut.textContent = fd.get("datum");
        success.classList.add("show");
      }
      // Open the user's mail client with everything prefilled.
      window.setTimeout(function () { window.location.href = mailto; }, 350);
    });
  }

  /* simple contact + newsletter success states */
  document.querySelectorAll("[data-simple-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var fd = new FormData(form);
      var to = form.getAttribute("data-to") || "info@xpm-vt.de";
      var subj = form.getAttribute("data-subject") || "Nachricht über xpm-vt.de";
      var fields = [];
      form.querySelectorAll("input, textarea, select").forEach(function (el) {
        if (el.name && el.type !== "checkbox") fields.push({ name: el.name, label: el.getAttribute("data-label") || el.name });
      });
      var body = buildBody(fd, fields);
      var mailto = "mailto:" + to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
      var msg = form.getAttribute("data-success-msg") || "Vielen Dank! Deine Nachricht ist auf dem Weg.";
      form.innerHTML = '<p style="color:var(--teal-bright);font-family:var(--font-head);text-transform:uppercase;letter-spacing:0.05em;">✓ ' + msg + "</p>";
      window.setTimeout(function () { window.location.href = mailto; }, 300);
    });
  });
})();
