/* =====================================================================
   music.js — lecteur audio HTML5 (indépendant de la progression).
   - lecture automatique si le navigateur l'autorise, sinon bouton
     « ACTIVER LA MUSIQUE » (ou n'importe quel clic dans la page)
   - un seul morceau chargé à la fois (pas de téléchargement groupé)
   - piste illisible : message discret puis piste suivante
   - arrêt propre quand la page est détruite
   ===================================================================== */
(function () {
    "use strict";
    var CRP = window.CRP, M = CRP.cfg.musique || {};
    var audio = null, tracks = [], idx = -1, failed = {}, failCount = 0;
    var vol = 40, gameMul = 1, fade = 1, fadeTimer = null;
    var blocked = false, userPaused = false, started = false, dead = false;
    var el = {};

    /* ---------- choix du format lisible ---------- */
    function pickSource(t) {
        var a = document.createElement("audio"), ogg = "", mp3 = "";
        if (!a.canPlayType) { return null; }
        ogg = t.ogg ? a.canPlayType('audio/ogg; codecs="vorbis"') : "";
        mp3 = t.mp3 ? a.canPlayType("audio/mpeg") : "";
        if (ogg === "probably") { return t.ogg; }
        if (mp3 === "probably") { return t.mp3; }
        if (ogg) { return t.ogg; }
        if (mp3) { return t.mp3; }
        return null;
    }

    /* ---------- affichage ---------- */
    function msg(s, keep) {
        CRP.text(el.msg, s || "");
        CRP.toggleClass(el.msg, "show", !!s);
        if (s && !keep) { window.setTimeout(function () { if (el.msg.textContent === s) { msg(""); } }, 4000); }
    }
    function ui() {
        var playing = audio && !audio.paused && !blocked;
        CRP.toggleClass(el.root, "is-playing", playing);
        CRP.toggleClass(el.root, "is-muted", audio && audio.muted);
        CRP.toggleClass(el.root, "is-blocked", blocked);
        CRP.removeClass(el.root, "is-idle");
        el.play.title = playing ? "Pause" : "Lecture";
        el.mute.title = audio && audio.muted ? "Rétablir le son" : "Couper le son";
        CRP.Viz.setPlaying(playing && !(audio && audio.muted));
        var i, items = el.list.childNodes;
        for (i = 0; i < items.length; i++) { items[i].className = (i === idx ? "on" : "") + (failed[i] ? " ko" : ""); }
    }
    function drawVolume() {
        el.volFill.style.width = vol + "%";
        el.volKnob.style.left = vol + "%";
        CRP.text(el.volVal, (audio && audio.muted) ? "MUET" : vol + "%");
        el.vol.setAttribute("aria-valuenow", String(vol));
    }
    function applyVolume() {
        if (!audio) { return; }
        audio.volume = CRP.clamp(vol / 100 * gameMul * fade, 0, 1);
    }

    /* ---------- fondu d'ouverture ---------- */
    function fadeIn(ms) {
        if (fadeTimer) { window.clearInterval(fadeTimer); }
        var t0 = CRP.now();
        fade = 0; applyVolume();
        fadeTimer = window.setInterval(function () {
            var k = ms > 0 ? (CRP.now() - t0) / ms : 1;
            fade = CRP.clamp(k, 0, 1);
            applyVolume();
            if (k >= 1) { window.clearInterval(fadeTimer); fadeTimer = null; }
        }, 50);
    }

    /* ---------- pistes ---------- */
    function load(i) {
        idx = (i + tracks.length) % tracks.length;
        var t = tracks[idx];
        CRP.text(el.title, t.titre || ("Piste " + (idx + 1)));
        CRP.text(el.mood, t.ambiance || "");
        audio.loop = (M.boucle === "morceau") || tracks.length === 1;
        audio.src = t.src;      // seul le morceau courant est téléchargé
        try { audio.load(); } catch (e) { }
        ui();
    }
    function nextPlayable(from, dir) {
        var i, n;
        for (i = 1; i <= tracks.length; i++) {
            n = (from + dir * i + tracks.length * 2) % tracks.length;
            if (!failed[n]) { return n; }
        }
        return -1;
    }
    function play(withFade) {
        if (!audio || dead) { return; }
        userPaused = false;
        if (withFade) { fadeIn(M.fonduMs === undefined ? 3000 : M.fonduMs); } else { applyVolume(); }
        var p;
        try { p = audio.play(); } catch (e) { p = null; }
        if (p && p.then) {
            p.then(function () { blocked = false; started = true; ui(); }, function (err) {
                if (err && err.name === "NotAllowedError") { setBlocked(); }
                else if (err && err.name !== "AbortError") { CRP.log("lecture impossible : " + err.message); }
                ui();
            });
        } else {
            // ancien navigateur : play() ne renvoie rien, on vérifie un peu plus tard
            window.setTimeout(function () { if (audio.paused && !userPaused && !failed[idx]) { setBlocked(); ui(); } }, 1500);
        }
    }
    function setBlocked() {
        blocked = true;
        msg("");
    }
    function pause() { userPaused = true; if (audio) { audio.pause(); } ui(); }
    function go(dir, force) {
        var n = nextPlayable(idx, dir);
        if (n < 0) { return; }
        var wasPlaying = force || !audio.paused || blocked || !started;
        load(n);
        if (wasPlaying && !userPaused) { play(true); }
    }

    /* ---------- événements de l'élément audio ---------- */
    function bindAudio() {
        audio.addEventListener("playing", function () {
            blocked = false; started = true; ui();
            CRP.Viz.attach(audio);
        }, false);
        audio.addEventListener("pause", ui, false);
        audio.addEventListener("ended", function () { if (!audio.loop) { go(1, true); } }, false);
        audio.addEventListener("error", function () {
            if (dead || !audio.getAttribute("src")) { return; }
            failed[idx] = true; failCount++;
            var name = tracks[idx] ? tracks[idx].titre : "";
            ui();
            if (failCount >= tracks.length) {
                msg("Musique indisponible pour le moment.", true);
                CRP.addClass(el.root, "is-dead");
                blocked = false; ui();
                return;
            }
            msg("Piste indisponible : " + name + " — piste suivante");
            window.setTimeout(function () { go(1, !userPaused); }, 800);
        }, false);
    }

    /* ---------- volume (curseur personnalisé) ---------- */
    function setVol(v, save) {
        vol = Math.round(CRP.clamp(v, 0, 100));
        if (audio && audio.muted && vol > 0 && save) { audio.muted = false; }
        applyVolume(); drawVolume(); ui();
        if (save) { CRP.store.set("vol", vol); }
    }
    function bindVolume() {
        var dragging = false;
        function fromEvent(e) {
            var r = el.vol.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX);
            setVol((x - r.left) / Math.max(1, r.width) * 100, true);
        }
        el.vol.addEventListener("mousedown", function (e) { dragging = true; fromEvent(e); e.preventDefault(); }, false);
        document.addEventListener("mousemove", function (e) { if (dragging) { fromEvent(e); } }, false);
        document.addEventListener("mouseup", function () { dragging = false; }, false);
        el.vol.addEventListener("touchstart", function (e) { fromEvent(e); }, false);
        el.vol.addEventListener("touchmove", function (e) { fromEvent(e); e.preventDefault(); }, false);
        el.vol.addEventListener("keydown", function (e) {
            var k = e.keyCode;
            if (k === 37 || k === 40) { setVol(vol - 5, true); e.preventDefault(); }
            if (k === 39 || k === 38) { setVol(vol + 5, true); e.preventDefault(); }
        }, false);
        el.vol.addEventListener("mousewheel", function (e) { setVol(vol + (e.wheelDelta > 0 ? 5 : -5), true); e.preventDefault(); }, false);
        el.vol.addEventListener("wheel", function (e) { setVol(vol + (e.deltaY < 0 ? 5 : -5), true); e.preventDefault(); }, false);
    }

    /* ---------- liste des pistes ---------- */
    function buildList() {
        var i, li;
        for (i = 0; i < tracks.length; i++) {
            li = document.createElement("li");
            CRP.text(li, (tracks[i].titre || "Piste " + (i + 1)) + (tracks[i].ambiance ? "  ·  " + tracks[i].ambiance : ""));
            (function (n) {
                li.onclick = function (e) {
                    if (failed[n]) { return; }
                    load(n); play(true);
                    CRP.removeClass(el.root, "list-open");
                    if (e && e.stopPropagation) { e.stopPropagation(); }
                };
            })(i);
            el.list.appendChild(li);
        }
    }

    /* ---------- démarrage ---------- */
    function start() {
        el.root = CRP.$("player"); el.title = CRP.$("pl-title"); el.mood = CRP.$("pl-mood");
        el.play = CRP.$("pl-play"); el.prev = CRP.$("pl-prev"); el.next = CRP.$("pl-next");
        el.mute = CRP.$("pl-mute"); el.listBtn = CRP.$("pl-list-btn"); el.list = CRP.$("pl-list");
        el.vol = CRP.$("pl-vol"); el.volFill = CRP.$("pl-vol-fill"); el.volKnob = CRP.$("pl-vol-knob");
        el.volVal = CRP.$("pl-vol-val"); el.msg = CRP.$("pl-msg"); el.unlock = CRP.$("pl-unlock");

        var all = M.morceaux || [], i, src;
        for (i = 0; i < all.length; i++) {
            src = pickSource(all[i]);
            if (src) { tracks.push({ titre: all[i].titre, ambiance: all[i].ambiance, src: src }); }
        }
        if (M.active === false || !tracks.length || !window.Audio) {
            CRP.addClass(el.root, "is-off");
            CRP.text(el.title, M.active === false ? "Musique désactivée" : "Musique indisponible");
            CRP.text(el.mood, M.active === false ? "" : "aucun format audio lisible par ce navigateur");
            CRP.removeClass(el.root, "is-idle");
            return;
        }
        var saved = parseInt(CRP.store.get("vol"), 10);
        vol = isNaN(saved) ? CRP.clamp(M.volumeInitial === undefined ? 40 : M.volumeInitial, 0, 100) : saved;
        audio = new Audio();
        audio.preload = "auto";
        audio.muted = CRP.store.get("muted") === "1";
        bindAudio(); bindVolume(); buildList();

        el.play.onclick = function () { if (blocked || audio.paused) { blocked = false; play(!started); } else { pause(); } };
        el.next.onclick = function () { go(1); };
        el.prev.onclick = function () { go(-1); };
        el.mute.onclick = function () { audio.muted = !audio.muted; CRP.store.set("muted", audio.muted ? "1" : "0"); drawVolume(); ui(); };
        el.listBtn.onclick = function (e) { CRP.toggleClass(el.root, "list-open", !CRP.hasClass(el.root, "list-open")); if (e && e.stopPropagation) { e.stopPropagation(); } };
        el.unlock.onclick = function (e) { blocked = false; play(true); if (e && e.stopPropagation) { e.stopPropagation(); } };
        // Premier clic n'importe où : débloque la musique si le navigateur l'avait empêchée.
        document.addEventListener("mousedown", function (e) {
            if (blocked && !userPaused) { blocked = false; play(true); }
            var n = e && e.target, inside = false;
            while (n) { if (n === el.list || n === el.listBtn) { inside = true; break; } n = n.parentNode; }
            if (!inside) { CRP.removeClass(el.root, "list-open"); }
        }, false);

        load(M.aleatoire === false ? 0 : Math.floor(Math.random() * tracks.length));
        drawVolume();
        play(true);
    }

    // Accès en lecture pour le diagnostic (console du navigateur) et les tests.
    CRP.Music = {
        audio: function () { return audio; },
        track: function () { return idx; },
        tracks: function () { return tracks; },
        blocked: function () { return blocked; },
        volume: function () { return vol; }
    };
    CRP.on("boot", start);
    // Volume général du joueur transmis par GameDetails (0 à 1)
    CRP.on("details", function (d) {
        var v = parseFloat(d.volume);
        if (M.suivreVolumeDuJeu !== false && !isNaN(v) && v >= 0 && v <= 1) { gameMul = v; applyVolume(); }
    });
    CRP.on("teardown", function () {
        dead = true;
        if (fadeTimer) { window.clearInterval(fadeTimer); }
        if (audio) { try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch (e) { } }
    });
})();
