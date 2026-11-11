LOADING SCREEN CYBERPUNK RP — INSTALLATION ET HÉBERGEMENT
=========================================================

C'est un petit site web statique (HTML/CSS/JavaScript), PAS un addon Lua :
il ne va pas dans garrysmod/addons. Il doit être en ligne à une adresse HTTPS.
Il ne remplace pas le téléchargement normal des addons, modèles, textures et
sons : le jeu continue de les distribuer comme avant (Workshop, FastDL).


1. CONTENU
----------
index.html                 la page
config/config.js           TOUT ce qui se personnalise (textes, couleurs, images, musiques, factions, conseils)
css/style.css              mise en page, panneaux, barre de progression
css/animations.css         zoom du fond, balayage, glitch, néons, transitions
css/audio.css              lecteur de musique
css/responsive.css         adaptation 720p / 1080p / 1440p / 4K / ultrawide / petits écrans
js/loading.js              callbacks du jeu, progression, fonds en rotation, pluie, mode démo
js/server_info.js          logo, nom, slogan, infos du serveur
js/tips.js                 conseils en rotation
js/factions.js             factions en rotation
js/music.js                lecteur audio
js/audio_visualizer.js     barres de fréquences du lecteur
assets/backgrounds/        3 fonds de ville (1920x1080, jpg)
assets/fallback/           image de secours si un fond ne charge pas
assets/logos/              logo du serveur (svg)
assets/factions/           emblèmes des 6 factions (svg)
assets/icons/              icônes des catégories de conseils (svg)
assets/music/              3 musiques en .ogg et .mp3
assets/fonts/              police Poppins (licence SIL OFL, voir OFL.txt)
assets/images/             emplacement libre pour tes propres images (voir LISEZMOI.txt dedans)

Tous les visuels (fonds, logo, emblèmes, icônes) et les 3 musiques ont été créés
spécialement pour ce projet par génération procédurale : aucune image, musique ou
ressource de Cyberpunk 2077 ni d'un autre jeu. Tu peux les utiliser librement
sur ton serveur.

Musiques (boucles d'environ une minute, 44,1 kHz, OGG qualité 4 + MP3 128 kb/s) :
  Night City   92 BPM   électronique atmosphérique, nappes, arpèges, pluie
  Underground  126 BPM  techno industrielle, basse saturée, percussions métalliques
  Corporate    108 BPM  électronique froide, cloches FM, sub-basse


2. HÉBERGER LE SITE (HTTPS obligatoire)
---------------------------------------
N'importe quel hébergement de fichiers statiques en HTTPS convient. Deux exemples :

A) GitHub Pages (gratuit)
   1. Crée un compte GitHub, puis un dépôt public, par exemple « loading ».
   2. « Add file > Upload files » : glisse TOUT le contenu du dossier
      cyberpunk_loading_screen (index.html à la racine du dépôt, pas dans un sous-dossier).
   3. Settings > Pages > Source : « Deploy from a branch », branche main, dossier / (root).
   4. L'adresse s'affiche après une minute : https://TON-PSEUDO.github.io/loading/

B) Ton hébergeur web (o2switch, OVH, Hostinger, l'hébergement web de ton panel…)
   1. Ouvre le gestionnaire de fichiers ou un client FTP (FileZilla).
   2. Crée un dossier « loading » dans le dossier public (souvent public_html ou www).
   3. Envoie dedans tout le contenu de cyberpunk_loading_screen (en gardant les sous-dossiers).
   4. Active le certificat HTTPS (Let's Encrypt, souvent un simple bouton).
   5. Adresse : https://TON-DOMAINE/loading/

Vérification : ouvre l'adresse dans ton navigateur. La page doit s'afficher avec
« AUCUNE DONNÉE DU JEU » après quelques secondes : c'est normal hors du jeu.
Pour voir la page fonctionner comme en jeu, ajoute ?demo=1 à l'adresse :
  https://TON-DOMAINE/loading/?demo=1
(un bandeau rose « APERÇU NAVIGATEUR — données simulées » le signale).


3. BRANCHER LE SERVEUR
----------------------
Dans garrysmod/cfg/server.cfg, ajoute (ou remplace) cette ligne :

  sv_loadingurl "https://TON-DOMAINE/loading/?steamid=%s&map=%m"

Le jeu remplace %s par le SteamID64 du joueur et %m par le nom de la map.
Garde les guillemets. Mets bien la barre / avant le « ? ».

Redémarre le serveur, puis vérifie dans la console du serveur :
  sv_loadingurl
La réponse doit afficher ton adresse. Connecte-toi ensuite au serveur : l'écran de
chargement doit apparaître pendant la connexion.

Si la page reste celle de Garry's Mod :
  - l'adresse n'est pas en HTTPS, ou mal recopiée (teste-la dans ton navigateur) ;
  - la ligne est dans un autre fichier que celui que charge ton serveur ;
  - un autre addon ou fichier .cfg redéfinit sv_loadingurl après le tien.


4. METTRE À JOUR
----------------
- Change les textes, couleurs, musiques, factions ou conseils dans config/config.js,
  puis renvoie ce seul fichier sur l'hébergement. Aucun autre fichier à modifier.
- Pour remplacer une image ou un morceau : garde le même nom de fichier, ou indique le
  nouveau chemin dans config/config.js.
- Le jeu peut garder l'ancienne version en cache : ajoute un numéro de version à
  l'adresse quand tu fais une grosse mise à jour, par exemple
    sv_loadingurl "https://TON-DOMAINE/loading/?v=2&steamid=%s&map=%m"

Réglages utiles (config/config.js) :
  serveur.nom / sousTitre / slogan / logo      identité
  couleurs                                      couleurs principales (*)
  arrierePlans.images                           liste des fonds (rotation), durée, fondu
  animations.mode                               "auto", "complet" ou "reduit"
  musique.volumeInitial / aleatoire / boucle    lecteur
  musique.morceaux                              titre, ambiance, fichier ogg et/ou mp3
  conseils.liste                                conseils RP et infos pratiques
  factions.liste                                factions (n'y mets que celles qui existent)
  statuts                                       traduction des messages du jeu
(*) Les couleurs de la config s'appliquent dans les navigateurs récents. L'ancien
    moteur de certaines versions de GMod garde les couleurs par défaut (cyan/magenta).

Les conseils et factions livrés reprennent le contenu réel de tes addons :
touches F4, F6, B, G, H, Q, flèche haut ; commandes /concession, /garage, /dropmoney ;
factions ASU, HELIX Dynamics, Néons Morts, Mercenaires/Fixers/Netrunners,
MedEvac & Ripperdocs, Résidents. Si tu changes tes métiers, mets la config à jour.


5. FONCTIONNEMENT
-----------------
Progression
  Le jeu appelle GameDetails, SetFilesTotal, SetFilesNeeded, DownloadingFile et
  SetStatusChanged. La page distingue trois états :
    ATTENTE   aucune donnée encore : animation de balayage, pourcentage « -- »
    FICHIERS  pourcentage MESURÉ = fichiers reçus / fichiers à recevoir
    ESTIMÉ    pas de compteur de fichiers pour cette phase (Workshop, scripts…) :
              « ~ » devant le pourcentage, barre hachurée, calculé d'après l'étape
              de chargement réellement atteinte (6 étapes affichées sous la barre)
  Le jeu ne fournit pas de pourcentage global exact : la page ne prétend pas en avoir.
  Les fichiers du Workshop ne passent pas toujours par ces compteurs.

Informations du serveur
  Uniquement ce que le jeu envoie (nom, map, gamemode, joueurs max, SteamID64) ou
  ce que contient l'adresse (map, steamid). Sinon : « en attente », puis « non fourni ».

Musique
  - Démarre seule si le navigateur l'autorise (fondu d'ouverture), sinon un bouton
    « ACTIVER LA MUSIQUE » apparaît ; un clic n'importe où suffit aussi.
  - Lecture/pause, piste précédente/suivante, liste des pistes, muet, volume 0-100 %
    (souris, molette, flèches du clavier). Volume et muet sont mémorisés.
  - Un seul morceau est téléchargé à la fois. Un fichier illisible est sauté avec un
    message discret ; si aucun ne marche, la page continue sans musique.
  - Le volume suit le volume général du joueur (option suivreVolumeDuJeu).
  - La musique n'a aucun lien avec la progression et s'arrête proprement quand le
    jeu ferme la page.
  - Les barres du lecteur suivent les vraies fréquences quand le navigateur le
    permet (page en https). Sinon, c'est une animation décorative, signalée dans
    l'infobulle des barres.

Performances
  Mode réduit automatique si le système demande moins d'animations ou si la machine
  est faible : plus de pluie, particules, zoom ni glitch. Forçable avec
  animations.mode = "reduit" ou en ajoutant &perf=low à l'adresse.


6. TESTS RÉALISÉS (honnêtement)
-------------------------------
Faits dans Chromium (navigateur classique, automatisé), page servie en local avec
un serveur web qui gère les requêtes partielles, comme un vrai hébergeur :
67 vérifications réussies sur 67 —
  ouverture sans le jeu, paramètres steamid/map, callbacks (y compris reçus avant la
  fin du chargement de la page, SetFilesNeeded avant SetFilesTotal, zéro fichier,
  statut inconnu), pourcentage mesuré et estimé, étapes, fichier en cours ;
  musique : lecture auto, autoplay bloqué + bouton + clic n'importe où, pause,
  muet, volume clavier/souris, pistes suivante/précédente/liste, enchaînement en fin
  de morceau, boucle d'un morceau, fichiers manquants, aucune piste, arrêt propre ;
  visualiseur réel et décoratif ; image de secours, absence totale d'images, logo
  manquant ; rotation des fonds/conseils/factions ; mode réduit et préférence système ;
  affichage sans chevauchement en 800x600, 1024x768, 1280x720, 1366x768, 1920x1080,
  2560x1440, 3440x1440 (ultrawide) et 3840x2160.
Le JavaScript a été vérifié comme du JavaScript ES5 (syntaxe acceptée par l'ancien
moteur de GMod).

NON testé : dans Garry's Mod lui-même (je n'ai pas accès au jeu), donc ni le
navigateur intégré, ni l'hébergement HTTPS réel, ni la lecture automatique dans le jeu.
Teste en te connectant à ton serveur et regarde : musique, barre, infos du serveur.
