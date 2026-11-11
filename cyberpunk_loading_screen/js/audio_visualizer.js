/* =====================================================================
   audio_visualizer.js — barres de fréquences du lecteur.
   - Si le navigateur le permet (Web Audio API, page servie en http/https),
     les barres suivent les vraies fréquences de la musique.
   - Sinon (ancien navigateur de GMod, fichier ouvert en local), une
     animation décorative est affichée pendant la lecture et le lecteur
     l'indique dans son infobulle.
   La musique n'est JAMAIS routée vers Web Audio tant que le contexte
   audio n'est pas actif : cela évite toute coupure du son.
   ===================================================================== */
(function () {
    "use strict";
    var CRP = window.CRP;
    var V = CRP.Viz = { real: false, playing: false };
    var cv, g, W, H, N = 22, levels = [], an = null, data = null, ctx = null, hooked = false, last = 0, t = 0, silent = 0;

    function init() {
        cv = CRP.$("pl-viz");
        if (!cv || !cv.getContext) { return; }
        g = cv.getContext("2d"); W = cv.width; H = cv.height;
        for (var i = 0; i < N; i++) { levels.push(0); }
        CRP.$("pl-viz-wrap").title = "Animation décorative (analyse audio indisponible ici)";
        CRP.raf(loop);
    }

    // Branche l'analyseur sur l'élément audio, une seule fois, uniquement si c'est sans risque.
    V.attach = function (audio) {
        if (hooked || !audio) { return; }
        var AC = window.AudioContext || window.webkitAudioContext;
        var proto = window.location.protocol;
        if (!AC || (proto !== "http:" && proto !== "https:")) { return; }
        try {
            ctx = ctx || new AC();
            var connect = function () {
                if (hooked || ctx.state !== "running") { return; }
                try {
                    var src = ctx.createMediaElementSource(audio);
                    an = ctx.createAnalyser();
                    an.fftSize = 128; an.smoothingTimeConstant = 0.78;
                    src.connect(an); an.connect(ctx.destination);
                    data = new Uint8Array(an.frequencyBinCount);
                    hooked = true; V.real = true;
                    CRP.$("pl-viz-wrap").title = "Fréquences de la musique en temps réel";
                } catch (e) { CRP.log("analyseur indisponible : " + e.message); }
            };
            if (ctx.state === "running") { connect(); }
            else if (ctx.resume) {
                var p = ctx.resume();
                if (p && p.then) { p.then(connect, function () { }); }
            }
        } catch (e) { CRP.log("Web Audio indisponible : " + e.message); }
    };
    V.setPlaying = function (on) { V.playing = !!on; };
    V.stop = function () { V.playing = false; try { if (ctx && ctx.close) { ctx.close(); } } catch (e) { } };

    function loop(ts) {
        CRP.raf(loop);
        ts = ts || CRP.now();
        if (ts < last) { last = 0; } // horloges différentes selon le navigateur
        if (ts - last < 33) { return; }
        last = ts; t += 0.033;
        var i, target, bw = W / N, h, grad;
        for (i = 0; i < N; i++) {
            if (!V.playing) { target = 0.04; }
            else if (V.real && an) {
                if (i === 0) {
                    an.getByteFrequencyData(data);
                    // Analyseur muet pendant 3 s alors que la musique joue : on repasse en animation décorative.
                    var sum = 0, q;
                    for (q = 0; q < data.length; q++) { sum += data[q]; }
                    silent = sum === 0 ? silent + 1 : 0;
                    if (silent > 90) { V.real = false; CRP.$("pl-viz-wrap").title = "Animation décorative (aucune donnée audio reçue)"; }
                }
                // bandes réparties de façon logarithmique sur le spectre
                var a = Math.floor(Math.pow(i / N, 1.6) * (data.length - 1)), b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / N, 1.6) * (data.length - 1))), s = 0, k;
                for (k = a; k < b; k++) { s += data[k]; }
                target = s / (b - a) / 255;
            } else if (CRP.reduced) { target = 0.3 + 0.1 * (i % 3); }
            else {
                // animation décorative (pas de données audio réelles)
                target = 0.25 + 0.35 * Math.abs(Math.sin(t * (1.3 + i * 0.17) + i)) * (0.6 + 0.4 * Math.sin(t * 0.7 + i * 0.5));
            }
            levels[i] += (target - levels[i]) * 0.35;
        }
        g.clearRect(0, 0, W, H);
        grad = g.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, "#00f0ff"); grad.addColorStop(1, "#ff2bd6");
        g.fillStyle = grad;
        for (i = 0; i < N; i++) {
            h = Math.max(2, levels[i] * (H - 4));
            g.globalAlpha = 0.9;
            g.fillRect(i * bw + 1, (H - h) / 2, bw - 2, h);
        }
        g.globalAlpha = 1;
    }

    CRP.on("boot", init);
    CRP.on("teardown", function () { V.stop(); });
})();
