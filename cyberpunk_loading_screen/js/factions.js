/* =====================================================================
   factions.js — présentation des factions en rotation.
   Les factions se règlent dans config/config.js (section factions).
   ===================================================================== */
(function () {
    "use strict";
    var CRP = window.CRP, F = CRP.cfg.factions || {};
    var list = [], idx = -1, body, dots, timer = null;

    function card(f) {
        var wrap = document.createElement("div"), img = document.createElement("img"),
            info = document.createElement("div"), name = document.createElement("div"),
            sub = document.createElement("div"), desc = document.createElement("p");
        wrap.className = "faction";
        img.className = "faction-img"; img.alt = "";
        img.onerror = function () { img.style.visibility = "hidden"; };
        img.src = f.image || "";
        info.className = "faction-info";
        name.className = "faction-name"; CRP.text(name, f.nom || "");
        sub.className = "faction-sub"; CRP.text(sub, f.sousTitre || "");
        desc.className = "faction-desc"; CRP.text(desc, f.description || "");
        if (f.couleur) {
            name.style.color = f.couleur;
            img.style.borderColor = f.couleur;
            wrap.style.borderLeftColor = f.couleur;
        }
        info.appendChild(sub); info.appendChild(name); info.appendChild(desc);
        wrap.appendChild(img); wrap.appendChild(info);
        return wrap;
    }

    function go(n) {
        if (!list.length) { return; }
        idx = (n + list.length) % list.length;
        var old = body.firstChild, c = card(list[idx]), i;
        CRP.addClass(c, "f-enter");
        body.appendChild(c);
        if (old) {
            CRP.addClass(old, "f-leave");
            window.setTimeout(function () { if (old.parentNode) { old.parentNode.removeChild(old); } }, CRP.reduced ? 0 : 700);
        }
        window.setTimeout(function () { CRP.removeClass(c, "f-enter"); }, 30);
        for (i = 0; i < dots.childNodes.length; i++) { dots.childNodes[i].className = i === idx ? "on" : ""; }
    }
    function restart() {
        if (timer) { window.clearInterval(timer); }
        if (list.length > 1) { timer = window.setInterval(function () { go(idx + 1); }, Math.max(4, F.dureeSecondes || 9) * 1000); }
    }

    CRP.on("boot", function () {
        body = CRP.$("faction-body"); dots = CRP.$("faction-dots");
        list = F.liste || [];
        if (!list.length) { CRP.$("faction-card").style.display = "none"; CRP.addClass(document.body, "no-factions"); return; }
        var i, b;
        for (i = 0; i < list.length; i++) {
            b = document.createElement("span");
            (function (n) { b.onclick = function () { go(n); restart(); }; })(i);
            b.title = list[i].nom || "";
            dots.appendChild(b);
        }
        go(0);
        restart();
    });
})();
