/* =====================================================================
   loading.js — cœur de la page :
   - utilitaires partagés (window.CRP) et bus d'événements
   - callbacks officiels de Garry's Mod (GameDetails, SetFilesTotal,
     SetFilesNeeded, DownloadingFile, SetStatusChanged)
   - barre de progression (mesurée / estimée / attente), étapes, statut
   - arrière-plans en rotation, pluie et particules, mode performances
   - mode démo (?demo=1) pour prévisualiser dans un navigateur
   JavaScript ES5 uniquement (compatible avec l'ancien navigateur de GMod).
   ===================================================================== */
(function () {
    "use strict";

    var CFG = window.LS_CONFIG || {};
    var CRP = window.CRP = window.CRP || {};
    CRP.cfg = CFG;

    /* ---------------------------------------------------------------- utilitaires */
    CRP.$ = function (id) { return document.getElementById(id); };
    CRP.text = function (el, s) {
        if (!el) { return; }
        if ("textContent" in el) { el.textContent = s; } else { el.innerText = s; }
    };
    CRP.hasClass = function (el, c) { return (" " + el.className + " ").indexOf(" " + c + " ") > -1; };
    CRP.addClass = function (el, c) { if (el && !CRP.hasClass(el, c)) { el.className = (el.className ? el.className + " " : "") + c; } };
    CRP.removeClass = function (el, c) {
        if (!el) { return; }
        el.className = (" " + el.className + " ").replace(" " + c + " ", " ").replace(/^\s+|\s+$/g, "");
    };
    CRP.toggleClass = function (el, c, on) { if (on) { CRP.addClass(el, c); } else { CRP.removeClass(el, c); } };
    CRP.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
    CRP.now = function () { return new Date().getTime(); };
    CRP.shuffle = function (arr) {
        var a = arr.slice(0), i, j, t;
        for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    };
    CRP.store = {
        get: function (k) { try { return window.localStorage ? window.localStorage.getItem("crp_ls_" + k) : null; } catch (e) { return null; } },
        set: function (k, v) { try { if (window.localStorage) { window.localStorage.setItem("crp_ls_" + k, String(v)); } } catch (e) { } }
    };
    CRP.param = function (name) {
        var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(window.location.search || "");
        if (!m) { return null; }
        try { return decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) { return m[1]; }
    };
    var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
        function (fn) { return window.setTimeout(function () { fn(CRP.now()); }, 33); };
    CRP.raf = function (fn) { return raf.call(window, fn); };

    /* --------------------------------------------------- bus d'événements (rejouables) */
    var listeners = {}, sticky = {};
    CRP.on = function (evt, fn) {
        (listeners[evt] = listeners[evt] || []).push(fn);
        if (sticky.hasOwnProperty(evt)) { try { fn(sticky[evt]); } catch (e) { CRP.log(e); } }
    };
    CRP.emit = function (evt, data, keep) {
        var l = listeners[evt] || [], i;
        if (keep) { sticky[evt] = data; }
        for (i = 0; i < l.length; i++) { try { l[i](data); } catch (e) { CRP.log(e); } }
    };
    CRP.log = function (e) { if (window.console && console.log) { console.log("[loading] " + (e && e.message ? e.message : e)); } };

    /* --------------------------------------------------------------- mode performances */
    function detectReduced() {
        var a = CFG.animations || {}, mode = (CRP.param("perf") === "low") ? "reduit" : (a.mode || "auto");
        if (mode === "reduit") { return true; }
        if (mode === "complet") { return false; }
        try { if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { return true; } } catch (e) { }
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) { return true; }
        return false;
    }
    CRP.reduced = detectReduced();
    CRP.demo = CRP.param("demo") === "1";

    /* ----------------------------------------------------------- couleurs de la config */
    function applyColors() {
        var c = CFG.couleurs || {}, root = document.documentElement, k;
        if (!root.style || !root.style.setProperty) { return; }
        for (k in c) { if (c.hasOwnProperty(k)) { root.style.setProperty("--" + k, c[k]); } }
    }

    /* ================================================================ PROGRESSION */
    var P = {
        total: null, needed: null, file: "", statusRaw: "", step: 0, gotData: false,
        lastEvent: 0, shown: 0, target: 0, kind: "wait"
    };
    var steps = CFG.etapes || ["CONNEXION", "SERVEUR", "WORKSHOP", "FICHIERS", "SCRIPTS", "ENTRÉE EN VILLE"];
    var pending = [], domReady = false;

    function touch() {
        P.lastEvent = CRP.now();
        if (!P.gotData) { P.gotData = true; CRP.emit("firstdata", true, true); }
    }
    function reach(stepIdx) { if (stepIdx > P.step) { P.step = Math.min(stepIdx, steps.length - 1); } }

    function translateStatus(raw) {
        var list = CFG.statuts || [], low = String(raw || "").toLowerCase(), i;
        for (i = 0; i < list.length; i++) {
            if (low.indexOf(list[i].contient) > -1) { return list[i]; }
        }
        return null;
    }
    function shortFile(f) {
        f = String(f || "").replace(/\\/g, "/");
        return f.length > 64 ? "…" + f.substr(f.length - 63) : f;
    }

    // Les callbacks peuvent arriver avant que la page soit prête : on les met en file d'attente.
    function queue(fn) {
        return function () {
            var args = arguments;
            if (!domReady) { pending.push(function () { fn.apply(null, args); }); return; }
            try { fn.apply(null, args); } catch (e) { CRP.log(e); }
        };
    }

    /* ---- callbacks officiels de Garry's Mod (noms imposés par le jeu) ---- */
    window.GameDetails = queue(function (servername, serverurl, mapname, maxplayers, steamid, gamemode, volume, language) {
        touch(); reach(1);
        CRP.emit("details", {
            servername: servername, serverurl: serverurl, mapname: mapname, maxplayers: maxplayers,
            steamid: steamid, gamemode: gamemode, volume: volume, language: language
        }, true);
        render();
    });
    window.SetFilesTotal = queue(function (total) {
        touch();
        P.total = Math.max(0, parseInt(total, 10) || 0);
        if (P.needed === null) { P.needed = P.total; }
        render();
    });
    window.SetFilesNeeded = queue(function (needed) {
        touch();
        P.needed = Math.max(0, parseInt(needed, 10) || 0);
        if (P.total !== null && P.needed > P.total) { P.total = P.needed; }
        if (P.needed > 0) { reach(3); }
        render();
    });
    window.DownloadingFile = queue(function (fileName) {
        touch(); reach(3);
        P.file = String(fileName || "");
        render();
    });
    window.SetStatusChanged = queue(function (status) {
        touch();
        P.statusRaw = String(status || "");
        var t = translateStatus(P.statusRaw);
        if (t && typeof t.etape === "number") { reach(t.etape); }
        render();
    });

    /* ---- calcul et affichage ---- */
    function compute() {
        if (P.total !== null && P.total > 0 && P.needed !== null) {
            P.kind = "measured";
            P.target = CRP.clamp((P.total - P.needed) / P.total * 100, 0, 100);
        } else if (P.gotData && P.step > 0) {
            // Pas de compteur de fichiers fourni : estimation d'après l'étape réellement atteinte.
            P.kind = "estimated";
            P.target = CRP.clamp(P.step / steps.length * 100, 5, 95);
        } else {
            P.kind = "wait";
            P.target = 0;
        }
    }

    var el = {};
    function render() {
        if (!domReady) { return; }
        compute();
        var t = translateStatus(P.statusRaw), done, left;
        // statut
        if (P.statusRaw) {
            CRP.text(el.status, (t ? t.texte : P.statusRaw).toUpperCase());
            CRP.text(el.sub, t ? P.statusRaw : "Message du jeu");
        } else if (P.gotData) {
            CRP.text(el.status, "CONNEXION AU SERVEUR");
            CRP.text(el.sub, "Informations du serveur reçues.");
        }
        // fichiers
        if (P.total !== null) {
            done = Math.max(0, P.total - (P.needed === null ? P.total : P.needed));
            left = P.needed === null ? P.total : P.needed;
            CRP.text(el.total, String(P.total));
            CRP.text(el.done, String(done));
            CRP.text(el.left, String(left));
        }
        if (P.file) { CRP.text(el.file, shortFile(P.file)); el.file.title = P.file; }
        if (P.total === 0) { CRP.text(el.file, "aucun fichier à télécharger"); }
        else if (P.total !== null && P.needed === 0) { CRP.text(el.file, "tous les fichiers sont reçus"); }
        // type de progression
        CRP.toggleClass(el.bar, "is-waiting", P.kind === "wait");
        CRP.toggleClass(el.bar, "is-estimated", P.kind === "estimated");
        CRP.toggleClass(el.bar, "is-measured", P.kind === "measured");
        CRP.text(el.kind, P.kind === "measured" ? "FICHIERS" : (P.kind === "estimated" ? "ESTIMÉ" : "ATTENTE"));
        el.kind.title = P.kind === "measured" ? "Pourcentage calculé sur les fichiers envoyés par le serveur" :
            (P.kind === "estimated" ? "Estimation d'après l'étape de chargement atteinte : le jeu ne fournit pas de compteur pour cette phase" :
                "Aucune donnée de progression reçue pour l'instant");
        // étapes
        var i, li;
        for (i = 0; i < el.stepItems.length; i++) {
            li = el.stepItems[i];
            CRP.toggleClass(li, "done", i < P.step);
            CRP.toggleClass(li, "active", i === P.step && P.gotData);
        }
        linkUpdate();
        CRP.emit("progress", P);
    }

    // Animation fluide du pourcentage affiché vers la valeur cible.
    function animateBar() {
        if (P.kind === "wait") {
            P.shown = 0;
            CRP.text(el.pct, "--");
            el.fill.style.width = "0%";
        } else {
            var diff = P.target - P.shown;
            P.shown = Math.abs(diff) < 0.05 ? P.target : P.shown + diff * (CRP.reduced ? 0.5 : 0.12);
            el.fill.style.width = P.shown.toFixed(2) + "%";
            CRP.text(el.pct, (P.kind === "estimated" ? "~" : "") + Math.floor(P.shown + 0.0001) + "%");
            el.bar.setAttribute("aria-valuenow", String(Math.round(P.shown)));
        }
        window.setTimeout(animateBar, 50);
    }

    // État de la liaison (indicateur en haut à droite)
    function linkWatch() {
        linkUpdate();
        window.setTimeout(linkWatch, 1000);
    }
    function linkUpdate() {
        if (!el.linkLabel) { return; }
        var since = CRP.now() - bootTime, idle = P.lastEvent ? CRP.now() - P.lastEvent : 0;
        if (!P.gotData) {
            if (since > 8000) {
                CRP.text(el.linkLabel, "AUCUNE DONNÉE DU JEU");
                CRP.text(el.linkDetail, "page ouverte hors de Garry's Mod ?");
                el.linkDot.className = "dot dot-alert";
            }
        } else {
            CRP.text(el.linkLabel, (P.total !== null && P.needed === 0) ? "FICHIERS PRÊTS" : "CONNEXION EN COURS");
            el.linkDot.className = "dot dot-live";
            CRP.text(el.linkDetail, idle > 45000 ? ("aucune nouvelle donnée depuis " + Math.round(idle / 1000) + " s") : "liaison active");
        }
    }

    /* ============================================================ ARRIÈRE-PLANS */
    var BG = { list: [], idx: -1, front: null, back: null, failed: {} };
    function bgInit() {
        var c = CFG.arrierePlans || {};
        BG.list = (c.images || []).slice(0);
        BG.front = CRP.$("bg-a"); BG.back = CRP.$("bg-b");
        BG.dur = Math.max(4, c.dureeSecondes || 14) * 1000;
        BG.fade = Math.max(0.3, c.fonduSecondes || 2.5);
        BG.front.style.webkitTransitionDuration = BG.front.style.transitionDuration = BG.fade + "s";
        BG.back.style.webkitTransitionDuration = BG.back.style.transitionDuration = BG.fade + "s";
        bgNext(true);
    }
    function bgShow(url) {
        var nf = BG.back, of = BG.front;
        nf.style.backgroundImage = "url('" + url + "')";
        CRP.removeClass(nf, "kb"); void nf.offsetWidth; // relance l'animation de zoom
        if (!CRP.reduced && (CFG.animations || {}).zoomFond !== false) { CRP.addClass(nf, "kb"); }
        CRP.addClass(nf, "on"); CRP.removeClass(of, "on");
        BG.front = nf; BG.back = of;
    }
    function bgNext(first) {
        var c = CFG.arrierePlans || {}, tries = 0, url, img;
        if (!BG.list.length) { bgFallback(); return; }
        do { BG.idx = (BG.idx + 1) % BG.list.length; url = BG.list[BG.idx]; tries++; }
        while (BG.failed[url] && tries <= BG.list.length);
        if (BG.failed[url]) { bgFallback(); return; }
        img = new Image();
        img.onload = function () {
            bgShow(url);
            if (BG.list.length > 1) { window.setTimeout(function () { bgNext(false); }, BG.dur); }
        };
        img.onerror = function () { BG.failed[url] = true; CRP.log("image introuvable : " + url); bgNext(first); };
        img.src = url;
    }
    function bgFallback() {
        var f = (CFG.arrierePlans || {}).secours, img;
        if (!f) { return; }
        img = new Image();
        img.onload = function () { bgShow(f); };
        img.onerror = function () { CRP.addClass(document.body, "no-bg"); }; // dégradé CSS de secours
        img.src = f;
    }

    /* ======================================================= PLUIE + PARTICULES */
    var FX = { c: null, g: null, w: 0, h: 0, drops: [], parts: [], last: 0, running: false };
    function fxInit() {
        var a = CFG.animations || {};
        FX.c = CRP.$("fx");
        if (CRP.reduced || (!a.pluie && !a.particules) || !FX.c.getContext) { FX.c.style.display = "none"; return; }
        FX.g = FX.c.getContext("2d");
        FX.rain = a.pluie !== false; FX.dust = a.particules !== false;
        fxResize();
        window.addEventListener("resize", fxResize, false);
        FX.running = true;
        CRP.raf(fxLoop);
    }
    function fxResize() {
        var dpr = 1; // volontairement 1 : économise le GPU, la pluie reste nette
        FX.w = FX.c.width = Math.floor((window.innerWidth || 1280) * dpr);
        FX.h = FX.c.height = Math.floor((window.innerHeight || 720) * dpr);
        var area = FX.w * FX.h / (1920 * 1080), i;
        FX.drops = []; FX.parts = [];
        if (FX.rain) { for (i = 0; i < Math.round(260 * area); i++) { FX.drops.push(newDrop(true)); } }
        if (FX.dust) { for (i = 0; i < Math.round(40 * area); i++) { FX.parts.push(newPart(true)); } }
    }
    function newDrop(any) {
        var z = Math.random();
        return { x: Math.random() * (FX.w + 200), y: any ? Math.random() * FX.h : -30, l: 10 + z * 22, v: 9 + z * 14, a: 0.06 + z * 0.22 };
    }
    function newPart(any) {
        var cols = ["0,240,255", "255,43,214", "178,107,255"];
        return { x: Math.random() * FX.w, y: any ? Math.random() * FX.h : FX.h + 10, r: 0.6 + Math.random() * 1.8,
            vy: 0.15 + Math.random() * 0.45, vx: (Math.random() - 0.5) * 0.25, c: cols[Math.floor(Math.random() * cols.length)],
            a: 0.15 + Math.random() * 0.5, t: Math.random() * 6.28 };
    }
    function fxLoop(ts) {
        if (!FX.running) { return; }
        ts = ts || CRP.now();
        if (ts < FX.last) { FX.last = 0; }
        if (ts - FX.last < 32 || document.hidden) { CRP.raf(fxLoop); return; } // ~30 i/s maximum
        FX.last = ts;
        var g = FX.g, i, d, p;
        g.clearRect(0, 0, FX.w, FX.h);
        g.lineWidth = 1;
        for (i = 0; i < FX.drops.length; i++) {
            d = FX.drops[i];
            g.strokeStyle = "rgba(170,210,255," + d.a + ")";
            g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - d.l * 0.2, d.y + d.l); g.stroke();
            d.y += d.v; d.x -= d.v * 0.2;
            if (d.y > FX.h) { FX.drops[i] = newDrop(false); }
        }
        for (i = 0; i < FX.parts.length; i++) {
            p = FX.parts[i];
            p.t += 0.03;
            g.fillStyle = "rgba(" + p.c + "," + (p.a * (0.6 + 0.4 * Math.sin(p.t))).toFixed(3) + ")";
            g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.2832); g.fill();
            p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * 0.15;
            if (p.y < -10) { FX.parts[i] = newPart(false); }
        }
        CRP.raf(fxLoop);
    }
    CRP.stopFx = function () { FX.running = false; };

    /* ================================================================ GLITCH */
    function glitchLoop() {
        var h = CRP.$("brand-name");
        CRP.addClass(h, "glitching");
        window.setTimeout(function () { CRP.removeClass(h, "glitching"); }, 450);
        window.setTimeout(glitchLoop, 9000 + Math.random() * 9000);
    }

    /* ================================================================ DÉMO */
    // ?demo=1 : simule les appels du jeu pour prévisualiser la page dans un navigateur ordinaire.
    function runDemo() {
        CRP.addClass(document.body, "is-demo");
        var files = ["materials/models/cyber_assets_vehicles/kaido_m20/kaido_carrosserie.vtf", "sound/cyber_assets_audio/neon_hum.wav",
            "models/cyber_assets_vehicles/kaido_m20.mdl", "materials/cyber_assets_signage/holo_koi.vtf", "resource/fonts/interface.ttf"];
        var total = 42, needed = total, t = 600;
        function at(ms, fn) { window.setTimeout(fn, ms); }
        at(t, function () { window.GameDetails("Night City | Cyberpunk RP | Démo", "", CRP.param("map") || "rp_evocity_v33x", 64, CRP.param("steamid") || "76561198000000000", "darkrp", 0.8, "fr"); });
        at(t += 1500, function () { window.SetStatusChanged("Retrieving server info..."); });
        at(t += 2000, function () { window.SetStatusChanged("Workshop Complete"); });
        at(t += 1500, function () { window.SetFilesTotal(total); window.SetStatusChanged("Downloading files..."); });
        var k;
        for (k = 0; k < total; k++) {
            (function (n) {
                at(t + 450 * n, function () { window.DownloadingFile(files[n % files.length]); window.SetFilesNeeded(total - n - 1); });
            })(k);
        }
        t += 450 * total + 800;
        at(t, function () { window.SetStatusChanged("Sending client info..."); });
        at(t += 1800, function () { window.SetStatusChanged("Client info sent!"); });
        at(t += 1500, function () { window.SetStatusChanged("Starting Lua..."); });
        at(t += 2500, function () { window.SetStatusChanged("Loading..."); });
    }

    /* ================================================================ DÉMARRAGE */
    var bootTime = CRP.now();
    function boot() {
        if (domReady) { return; }
        domReady = true;
        applyColors();
        CRP.toggleClass(document.body, "reduced", CRP.reduced);
        el.status = CRP.$("prog-status"); el.sub = CRP.$("prog-sub"); el.pct = CRP.$("prog-pct"); el.kind = CRP.$("prog-kind");
        el.bar = CRP.$("bar"); el.fill = CRP.$("bar-fill"); el.total = CRP.$("files-total"); el.done = CRP.$("files-done");
        el.left = CRP.$("files-left"); el.file = CRP.$("file-now");
        el.linkDot = CRP.$("link-dot"); el.linkLabel = CRP.$("link-label"); el.linkDetail = CRP.$("link-detail");
        var ol = CRP.$("steps"), i, li;
        el.stepItems = [];
        for (i = 0; i < steps.length; i++) {
            li = document.createElement("li"); CRP.text(li, steps[i]); ol.appendChild(li); el.stepItems.push(li);
        }
        bgInit();
        fxInit();
        if (!CRP.reduced && (CFG.animations || {}).glitch !== false) { window.setTimeout(glitchLoop, 4000); }
        render();
        animateBar();
        linkWatch();
        CRP.emit("boot", true, true);
        while (pending.length) { try { pending.shift()(); } catch (e) { CRP.log(e); } }
        window.setTimeout(function () { CRP.removeClass(document.body, "is-booting"); }, 30);
        if (CRP.demo) { runDemo(); }
    }
    // Les scripts sont en bas de page : le DOM existe déjà, mais on attend la fin du chargement
    // des autres scripts (server_info, tips…) pour que leurs écouteurs reçoivent les données.
    if (document.readyState === "complete" || document.readyState === "interactive") { window.setTimeout(boot, 0); }
    else { document.addEventListener("DOMContentLoaded", boot, false); }

    // Arrêt propre quand GMod détruit la page (fin du chargement)
    function teardown() { CRP.stopFx(); CRP.emit("teardown", true); }
    window.addEventListener("pagehide", teardown, false);
    window.addEventListener("beforeunload", teardown, false);
    window.addEventListener("unload", teardown, false);
})();
