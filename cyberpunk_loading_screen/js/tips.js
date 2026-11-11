/* =====================================================================
   tips.js — conseils RP et informations pratiques en rotation.
   Les textes se règlent dans config/config.js (section conseils).
   ===================================================================== */
(function () {
    "use strict";
    var CRP = window.CRP, C = CRP.cfg.conseils || {};
    var LABELS = {
        ambiance: "NIGHT CITY", touches: "TOUCHES", commandes: "COMMANDES", smartphone: "SMARTPHONE",
        piratage: "PIRATAGE", metiers: "MÉTIERS", factions: "FACTIONS", economie: "ÉCONOMIE"
    };
    var list = [], idx = -1, box, icon, cat, txt;

    function show() {
        if (!list.length) { return; }
        idx = (idx + 1) % list.length;
        var t = list[idx], key = t.categorie || "ambiance";
        CRP.removeClass(box, "tip-in");
        CRP.addClass(box, "tip-out");
        window.setTimeout(function () {
            icon.onerror = function () { icon.style.visibility = "hidden"; };
            icon.style.visibility = "visible";
            icon.src = "assets/icons/" + key + ".svg";
            CRP.text(cat, LABELS[key] || key.toUpperCase());
            CRP.text(txt, t.texte || "");
            CRP.removeClass(box, "tip-out");
            CRP.addClass(box, "tip-in");
        }, CRP.reduced ? 0 : 450);
    }

    CRP.on("boot", function () {
        box = CRP.$("tip"); icon = CRP.$("tip-icon"); cat = CRP.$("tip-cat"); txt = CRP.$("tip-text");
        list = (C.liste || []).slice(0);
        if (!list.length) { box.style.display = "none"; return; }
        if (C.aleatoire !== false) { list = CRP.shuffle(list); }
        show();
        if (list.length > 1) {
            window.setInterval(show, Math.max(3, C.dureeSecondes || 8) * 1000);
        }
    });
})();
