/* =====================================================================
   server_info.js — en-tête (logo, nom, slogan) et carte du serveur.
   Les informations du serveur viennent UNIQUEMENT de GameDetails() ou
   des paramètres de l'URL (steamid, map) : rien n'est inventé.
   ===================================================================== */
(function () {
    "use strict";
    var CRP = window.CRP, CFG = CRP.cfg, S = CFG.serveur || {};

    function set(id, value) {
        var e = CRP.$(id);
        if (!e) { return; }
        if (value === null || value === undefined || value === "") { return; }
        CRP.text(e, String(value));
        CRP.removeClass(e, "pending");
    }
    function hideRow(id) { var r = CRP.$(id); if (r) { r.style.display = "none"; } }

    function header() {
        var name = S.nom || "", h = CRP.$("brand-name"), logo = CRP.$("brand-logo");
        CRP.text(h, name || " ");
        h.setAttribute("data-text", name);
        CRP.text(CRP.$("brand-sub"), S.sousTitre || "");
        CRP.text(CRP.$("brand-slogan"), S.slogan || "");
        CRP.text(CRP.$("srv-network"), S.reseau || "");
        CRP.text(CRP.$("srv-welcome"), S.accueil || "");
        if (S.logo) {
            logo.onerror = function () { logo.style.display = "none"; }; // pas de logo cassé à l'écran
            logo.src = S.logo;
        } else { logo.style.display = "none"; }
        if (name) { document.title = name + " — chargement"; }
        // lignes libres
        var ul = CRP.$("srv-extra"), list = S.infosSupplementaires || [], i, li;
        for (i = 0; i < list.length; i++) { li = document.createElement("li"); CRP.text(li, list[i]); ul.appendChild(li); }
        if (!list.length) { ul.style.display = "none"; }
        if (S.afficherSteamId === false) { hideRow("srv-id-row"); }
    }

    function gamemodeLabel(gm) {
        if (!gm) { return ""; }
        var alias = (S.aliasGamemode || {})[String(gm).toLowerCase()];
        return alias && alias.toLowerCase() !== String(gm).toLowerCase() ? alias + " (" + gm + ")" : (alias || gm);
    }

    // Paramètres de l'URL (sv_loadingurl "...?steamid=%s&map=%m") : disponibles avant GameDetails.
    function fromUrl() {
        var map = CRP.param("map"), sid = CRP.param("steamid");
        if (map && map.indexOf("%") === -1) { set("srv-map", map); }
        if (sid && /^\d{15,20}$/.test(sid) && S.afficherSteamId !== false) { set("srv-id", sid); }
    }

    CRP.on("boot", function () {
        header();
        fromUrl();
    });

    CRP.on("details", function (d) {
        set("srv-name", d.servername);
        set("srv-map", d.mapname);
        set("srv-gm", gamemodeLabel(d.gamemode));
        var max = parseInt(d.maxplayers, 10);
        if (max > 0) { set("srv-max", String(max)); } else { hideRow("srv-max-row"); }
        if (S.afficherSteamId !== false && d.steamid && /^\d{15,20}$/.test(String(d.steamid))) { set("srv-id", d.steamid); }
        else if (!CRP.param("steamid")) { hideRow("srv-id-row"); }
    });

    // Sans données du jeu après un délai : on l'indique au lieu de laisser « en attente » indéfiniment.
    window.setTimeout(function () {
        var ids = ["srv-name", "srv-map", "srv-gm", "srv-max", "srv-id"], i, e;
        for (i = 0; i < ids.length; i++) {
            e = CRP.$(ids[i]);
            if (e && CRP.hasClass(e, "pending")) { CRP.text(e, "non fourni"); }
        }
    }, 12000);
})();
