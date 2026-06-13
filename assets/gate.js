/* =====================================================================
   Password gate for the X-Pecto Media preview (GitHub Pages).
   Soft client-side gate: keeps the preview out of search engines and
   away from casual visitors who only have the link. Loaded as a
   render-blocking <script> in <head> so no content paints before it.
   Password is stored only as a SHA-256 hash (no plaintext in source).
   To change the password: printf 'NEWPASS' | shasum -a 256  -> paste below.
   ===================================================================== */
(function () {
  "use strict";
  var KEY = "xpm_preview_unlocked";
  var HASH = "5687b63c261220e6b743bd68bf340db4b5b85236c3a9b5fc4fdf112bd0355437"; // "xpm2026"

  // Already unlocked this session → do nothing.
  try { if (sessionStorage.getItem(KEY) === HASH) return; } catch (e) {}

  // Hide page content immediately (this runs in <head>, before <body> parses).
  var hideStyle = document.createElement("style");
  hideStyle.id = "xpm-gate-hide";
  hideStyle.textContent =
    "body>*:not(#xpm-gate){visibility:hidden!important}" +
    "html,body{overflow:hidden!important}" +
    "#xpm-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;" +
    "background:radial-gradient(1100px 700px at 78% -8%,rgba(32,164,194,.22),transparent 60%)," +
    "radial-gradient(900px 650px at 6% 12%,rgba(76,83,126,.25),transparent 55%),#0a0c11;" +
    "font-family:'Fira Sans',system-ui,-apple-system,'Segoe UI',sans-serif}" +
    "#xpm-gate .card{width:min(420px,100%);text-align:center;border:1px solid rgba(255,255,255,.1);" +
    "border-radius:24px;background:rgba(255,255,255,.045);backdrop-filter:blur(12px);" +
    "padding:40px 32px;box-shadow:0 30px 70px -20px rgba(0,0,0,.7)}" +
    "#xpm-gate img{height:64px;width:auto;margin:0 auto 22px;display:block}" +
    "#xpm-gate .ey{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.28em;" +
    "font-size:.72rem;color:#38c9e8;margin-bottom:10px}" +
    "#xpm-gate h1{font-family:'Oswald',sans-serif;text-transform:uppercase;color:#fff;font-size:1.7rem;" +
    "line-height:1.1;margin:0 0 10px}" +
    "#xpm-gate p{color:#9aa4b4;font-size:.95rem;margin:0 0 24px}" +
    "#xpm-gate input{width:100%;background:#12161f;border:1px solid rgba(255,255,255,.16);border-radius:12px;" +
    "color:#e8ecf2;font-size:1rem;padding:14px 16px;text-align:center;letter-spacing:.06em;outline:none;" +
    "transition:border-color .2s,box-shadow .2s}" +
    "#xpm-gate input:focus{border-color:#20a4c2;box-shadow:0 0 0 3px rgba(32,164,194,.2)}" +
    "#xpm-gate button{width:100%;margin-top:14px;cursor:pointer;border:0;border-radius:100px;" +
    "font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:.95rem;" +
    "color:#fff;padding:15px;background:linear-gradient(135deg,#20a4c2,#4c537e);" +
    "box-shadow:0 10px 30px -10px rgba(32,164,194,.6);transition:transform .25s}" +
    "#xpm-gate button:hover{transform:translateY(-2px)}" +
    "#xpm-gate .err{color:#ff6b6b;font-size:.86rem;margin-top:14px;min-height:1.1em;opacity:0;transition:opacity .2s}" +
    "#xpm-gate .err.show{opacity:1}" +
    "#xpm-gate .foot{margin-top:26px;color:#6b7589;font-size:.74rem;letter-spacing:.04em}" +
    "#xpm-gate .shake{animation:xpmShake .45s}" +
    "@keyframes xpmShake{10%,90%{transform:translateX(-2px)}30%,70%{transform:translateX(5px)}50%{transform:translateX(-7px)}}";
  (document.head || document.documentElement).appendChild(hideStyle);

  function sha256hex(str) {
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.prototype.map
        .call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); })
        .join("");
    });
  }

  function unlock() {
    try { sessionStorage.setItem(KEY, HASH); } catch (e) {}
    var ov = document.getElementById("xpm-gate");
    var st = document.getElementById("xpm-gate-hide");
    if (ov) ov.remove();
    if (st) st.remove();
  }

  function build() {
    var ov = document.createElement("div");
    ov.id = "xpm-gate";
    ov.innerHTML =
      '<div class="card">' +
      '<img src="https://i0.wp.com/xpm-vt.de/wp-content/uploads/2024/11/Logo-2018-v3-Quadrat-transparent-scaled.png?fit=200%2C149&ssl=1" alt="X-Pecto Media" />' +
      '<div class="ey">Vorschau · Preview</div>' +
      '<h1>Passwort erforderlich</h1>' +
      '<p>Diese Website-Vorschau ist noch nicht öffentlich. Bitte gib das Passwort ein.</p>' +
      '<form autocomplete="off">' +
      '<input type="password" id="xpm-pw" placeholder="Passwort" aria-label="Passwort" autofocus />' +
      '<button type="submit">Vorschau ansehen</button>' +
      '<div class="err" role="alert">Falsches Passwort – bitte erneut versuchen.</div>' +
      "</form>" +
      '<div class="foot">X-Pecto Media · Vorschau erstellt von Dr.Bror</div>' +
      "</div>";
    document.body.appendChild(ov);

    var form = ov.querySelector("form");
    var input = ov.querySelector("#xpm-pw");
    var err = ov.querySelector(".err");
    var card = ov.querySelector(".card");
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 50);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      sha256hex(input.value.trim()).then(function (h) {
        if (h === HASH) {
          unlock();
        } else {
          err.classList.add("show");
          card.classList.add("shake");
          input.value = "";
          input.focus();
          setTimeout(function () { card.classList.remove("shake"); }, 500);
        }
      });
    });
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
