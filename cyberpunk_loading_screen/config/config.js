/* =====================================================================
   CONFIGURATION DU LOADING SCREEN — modifie uniquement ce fichier.
   Syntaxe JavaScript simple : garde les guillemets, les virgules et les
   accolades. Les chemins sont relatifs au dossier du site.
   ===================================================================== */
window.LS_CONFIG = {

    /* ---------- Identité du serveur ---------- */
    serveur: {
        nom: "NIGHT CITY",
        sousTitre: "CYBERPUNK ROLEPLAY",
        slogan: "La ville ne dort jamais. Toi non plus.",
        reseau: "NIGHT CITY NETWORK",          // petite ligne au-dessus du message d'accueil
        accueil: "BIENVENUE À NIGHT CITY",
        logo: "assets/logos/logo.svg",          // remplace par ton logo (svg, png)
        // Libellés plus lisibles pour le gamemode envoyé par le jeu (clé = valeur réelle, en minuscules).
        // La valeur réelle reste affichée entre parenthèses : rien n'est inventé.
        aliasGamemode: { "darkrp": "DarkRP" },
        afficherSteamId: true,                   // affiche le SteamID64 du joueur (le sien uniquement)
        // Lignes libres affichées sous les infos du serveur. Exemple :
        //   infosSupplementaires: [ "Discord : discord.gg/xxxx", "Site : mon-serveur.fr" ]
        infosSupplementaires: []
    },

    /* ---------- Couleurs (format #rrggbb) ---------- */
    couleurs: {
        fond: "#05050b",
        cyan: "#00f0ff",
        magenta: "#ff2bd6",
        violet: "#b26bff",
        alerte: "#ff2a4a",
        texte: "#e6f0ff"
    },

    /* ---------- Arrière-plans (rotation automatique) ---------- */
    arrierePlans: {
        images: [
            "assets/backgrounds/night_city.jpg",
            "assets/backgrounds/underground.jpg",
            "assets/backgrounds/corporate.jpg"
        ],
        secours: "assets/fallback/fallback.jpg", // utilisée si une image ne charge pas
        dureeSecondes: 14,                       // temps d'affichage de chaque image
        fonduSecondes: 2.5
    },

    /* ---------- Animations ---------- */
    animations: {
        // "auto" : complet, sauf si le système demande moins d'animations ou si la machine est faible
        // "complet" : tout activé     "reduit" : pas de pluie, de particules, de zoom ni de glitch
        mode: "auto",
        pluie: true,
        particules: true,
        glitch: true,
        zoomFond: true
    },

    /* ---------- Musique ---------- */
    musique: {
        active: true,
        volumeInitial: 40,          // 0 à 100
        suivreVolumeDuJeu: true,    // multiplie par le volume général du joueur si le jeu le fournit
        aleatoire: true,            // premier morceau tiré au hasard, puis lecture dans l'ordre
        boucle: "liste",            // "liste" : enchaîne les morceaux en boucle   "morceau" : répète le même
        fonduMs: 3000,              // fondu d'ouverture
        // Pour chaque morceau : ogg et/ou mp3 (le navigateur choisit le format qu'il sait lire).
        morceaux: [
            { titre: "Night City", ambiance: "Électronique atmosphérique", ogg: "assets/music/night_city.ogg", mp3: "assets/music/night_city.mp3" },
            { titre: "Underground", ambiance: "Techno industrielle", ogg: "assets/music/underground.ogg", mp3: "assets/music/underground.mp3" },
            { titre: "Corporate", ambiance: "Électronique froide", ogg: "assets/music/corporate.ogg", mp3: "assets/music/corporate.mp3" }
        ]
    },

    /* ---------- Conseils (rotation automatique) ----------
       categorie : ambiance, touches, commandes, smartphone, piratage, metiers, factions, economie
       (le nom de l'icône assets/icons/<categorie>.svg)                                          */
    conseils: {
        dureeSecondes: 8,
        aleatoire: true,
        liste: [
            { categorie: "ambiance", texte: "Night City ne pardonne pas les erreurs." },
            { categorie: "ambiance", texte: "Votre identité numérique vous suit partout." },
            { categorie: "ambiance", texte: "Les corporations contrôlent bien plus que vous ne le pensez." },
            { categorie: "ambiance", texte: "Un bon mercenaire sait quand accepter un contrat." },
            { categorie: "ambiance", texte: "Les Eddies font tourner la ville." },
            { categorie: "ambiance", texte: "Méfiez-vous des réseaux clandestins." },
            { categorie: "ambiance", texte: "Les rues appartiennent à ceux qui savent les contrôler." },
            { categorie: "touches", texte: "F4 ouvre le terminal : métiers, boutique, contrats." },
            { categorie: "touches", texte: "F6 ouvre directement l'onglet Progression du terminal." },
            { categorie: "touches", texte: "Maintiens B pour la roue des armes, vise à la souris, relâche pour choisir." },
            { categorie: "touches", texte: "Q ouvre le menu Cyberpunk RP : objets, véhicules, enseignes." },
            { categorie: "smartphone", texte: "Flèche haut : sortir ou ranger ton smartphone." },
            { categorie: "piratage", texte: "G sur une cible visée : menu d'interaction et de piratage." },
            { categorie: "piratage", texte: "Les netrunners ouvrent serrures et terminaux avec un Neuro-Deck." },
            { categorie: "commandes", texte: "/concession pour trouver un véhicule, /garage pour sortir le tien." },
            { categorie: "commandes", texte: "/dropmoney 500 (ou touche H) pour jeter des Eddies au sol." },
            { categorie: "metiers", texte: "Les ripperdocs posent les implants achetés au marché noir." },
            { categorie: "metiers", texte: "Les fixers publient des contrats au terminal : F4 > Contrats." },
            { categorie: "factions", texte: "L'ASU patrouille, arrête et déjoue les braquages." },
            { categorie: "factions", texte: "Les Néons Morts tiennent les bas-fonds : racket, territoires, braquages." },
            { categorie: "economie", texte: "Les Eddies sont l'argent de la ville : salaire, contrats, commerce." }
        ]
    },

    /* ---------- Factions (rotation automatique) ----------
       N'indique que des factions qui existent sur ton serveur.        */
    factions: {
        dureeSecondes: 9,
        liste: [
            { nom: "ASU", sousTitre: "Autorité de Sécurité Urbaine", couleur: "#3c78ff", image: "assets/factions/asu.svg",
              description: "Agents, commandant et Directeur de Zone : patrouilles, arrestations, lois et couvre-feu." },
            { nom: "HELIX Dynamics", sousTitre: "Corporation", couleur: "#00c8ff", image: "assets/factions/helix.svg",
              description: "Cadres, sécurité et PDG : contrats, influence et espionnage industriel." },
            { nom: "Néons Morts", sousTitre: "Gang", couleur: "#aa00ff", image: "assets/factions/neons_morts.svg",
              description: "Ils tiennent les bas-fonds. Racket, territoires et braquages, sous les ordres du chef de syndicat." },
            { nom: "Mercenaires", sousTitre: "Fixers · Netrunners · Chasseurs", couleur: "#ff2a4a", image: "assets/factions/mercenaires.svg",
              description: "Les fixers publient les contrats, les mercenaires les exécutent, les netrunners ouvrent les portes." },
            { nom: "MedEvac & Ripperdocs", sousTitre: "Services médicaux", couleur: "#ff7800", image: "assets/factions/medical.svg",
              description: "Urgentistes officiels et chirurgiens du chrome : soins, interventions et pose d'implants." },
            { nom: "Résidents", sousTitre: "Civils", couleur: "#96a0af", image: "assets/factions/residents.svg",
              description: "Habitants, barmans, journalistes, videurs : la vie de la ville passe par eux." }
        ]
    },

    /* ---------- Textes de statut ----------
       Traductions des messages envoyés par le jeu (recherche d'un morceau de texte, en minuscules). */
    statuts: [
        { contient: "retrieving server info", texte: "Récupération des infos du serveur", etape: 1 },
        { contient: "sending client info", texte: "Envoi des infos du client", etape: 1 },
        { contient: "client info sent", texte: "Infos du client envoyées", etape: 1 },
        { contient: "workshop", texte: "Contenu Workshop", etape: 2 },
        { contient: "mounting", texte: "Montage des addons", etape: 2 },
        { contient: "downloading", texte: "Téléchargement des ressources", etape: 3 },
        { contient: "lua", texte: "Chargement des scripts", etape: 4 },
        { contient: "sending", texte: "Synchronisation", etape: 4 },
        { contient: "parsing game info", texte: "Lecture des données de jeu", etape: 4 },
        { contient: "loading", texte: "Chargement de la ville", etape: 5 },
        { contient: "starting", texte: "Démarrage", etape: 5 }
    ],
    etapes: ["CONNEXION", "SERVEUR", "WORKSHOP", "FICHIERS", "SCRIPTS", "ENTRÉE EN VILLE"]
};
