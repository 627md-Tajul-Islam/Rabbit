var Utl = {};
// true si valeur est entre deux autres valeurs
Utl.entre = function(valeur, min, max) {
    return (valeur - min) * (valeur - max) < 0;
};
Utl.aleatoire = function(min, max) {
    return min + Math.random() * (max - min);
};
// Distance entre deux points
Utl.distance = function(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}
Utl.lerp = function(value1, value2, amount) {
    return value1 + (value2 - value1) * amount;
};
// collision Point > Carre
Utl.pointCarre = function(x, y, carre) {
    return Calcul.entre(x, carre.pos.x, carre.pos.x + carre.taille) && Calcul.entre(y, carre.pos.y, carre.pos.y + carre.taille);
};
// Morceler un tableau de plusieurs lignes
Utl.morceler = function(tableau, largeur) {
    var resultat = [];
    for (var i = 0; i < tableau.length; i += largeur) resultat.push(tableau.slice(i, i + largeur))
    return resultat;
};

Math.linearTween = function(currentTime, debut, degreduChangement, duration) {
    return degreduChangement * currentTime / duration + debut;
};


class Entite {
    constructor(monde, sprite) {
        this.monde = monde;
        this.limite = monde.limite;
        this.ctx = monde.ctx;
        this.pos = {
            x: Utl.aleatoire(0, this.monde.L),
            y: Utl.aleatoire(0, this.monde.H)
        };
        this.couleur = Math.floor(Utl.aleatoire(0, 3));

        this.sprite = new Sprite(this.monde, this, sprite);
        this.transition = {
            etat: true,
            début: new Date(),
            // obj x,y
            depart: {
                x: this.pos.x,
                y: this.pos.y
            },
            cible: {
                x: Utl.aleatoire(0, this.monde.L),
                y: Utl.aleatoire(0, this.monde.H)
            },
            prochain: null,
        };
        this.transition.duration = Utl.distance(this.pos,this.transition.cible) / 0.04;
        if(this.transition.cible.x > this.pos.x){
            this.sprite.changerLigne((this.couleur*2)+1);
        }
        else{
            this.sprite.changerLigne((this.couleur*2));
        }
    }
    mouvement() {
        if (this.transition.etat) {
            let temps = new Date() - this.transition.début;
            if (temps < this.transition.duration) {
                this.pos.x = Math.linearTween(temps, this.transition.depart.x, this.transition.cible.x - this.transition.depart.x, this.transition.duration);
                this.pos.y = Math.linearTween(temps, this.transition.depart.y, this.transition.cible.y - this.transition.depart.y, this.transition.duration);
            } else {
                this.transition.depart.x = this.transition.cible.x;
                this.transition.depart.y = this.transition.cible.y;
                this.pos.x = this.transition.cible.x;
                this.pos.y = this.transition.cible.y;
                this.transition.etat = false;
                this.sprite.animation = false;
                this.sprite.frame = 2;
                // prochain mouvement
                setTimeout(() => {
                    this.transition.cible = {
                        x: Utl.aleatoire(0, this.monde.L),
                        y: Utl.aleatoire(0, this.monde.H)
                    };
                    let distance = Utl.distance(this.pos,this.transition.cible);
                    let duration = distance / 0.04;
                    this.transition.duration = duration;
                    this.transition.début = new Date();
                    this.transition.etat = true;
                    if(this.transition.cible.x > this.pos.x){
                        this.sprite.changerLigne((this.couleur*2)+1);
                    }
                    else{
                        this.sprite.changerLigne((this.couleur*2));
                    }
                    this.sprite.animation = true;
                }, Utl.aleatoire(500, 10000));
            }
        }
    }
    dessiner() {
        this.sprite.rendu();
    }
    rendu() {
        this.mouvement();
        this.dessiner();
    }
}
class Sprite {
    constructor(monde, parent, sprite) {
        this.ctx = monde.ctx;
        this.sprite = sprite;
        this.taille = monde.taille;
        this.l = Math.round(this.sprite.img.width / this.sprite.sep),
            this.h = this.sprite.img.height / this.sprite.ligne
        this.pos = parent.pos;
        this.longueur = this.sprite.sep;
        this.frame = 0;
        this.taille = monde.taille;
        this.selectLigne = 0;
        this.animation = true;
        this.allure = 0.25;
    }
    changerLigne(ligne){
        this.selectLigne = ligne * this.h;
    }
    dessiner() {
        this.ctx.drawImage(this.sprite.img, Math.floor(this.frame) * this.l, this.selectLigne, this.l, this.h, this.pos.x, this.pos.y, this.l, this.h);
    }
    animer() {
        if (this.animation) {
            this.frame += this.allure;
            if (this.frame >= this.longueur) {
                this.frame = 0;
            }
        }
    }
    rendu() {
        this.animer();
        this.dessiner();
    }
};
/*
   _____                      _
  / ____|                    (_)
 | |     ___   ___ _   _ _ __ _ ___
 | |    / _ \ / _ \ | | | '__| / __|
 | |___| (_) |  __/ |_| | |_ | \__ \
  \_____\___/ \___|\__,_|_(_)| |___/
                            _/ |
                           |__/
*/
class Monde {
    constructor(parametres,map) {
        // parametres
        this.alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ?!:',.()<>[]";
        this.taille = parametres.taille;
        this.touches = [];
        this.zoom = parametres.zoom || 4;
        this.remplissage = false;
        this.fond = "black";
        this.etat = "start";
        // niveaux
        this.terrain = map;
        this.niveauActuel = 0;
        // ressources
        this.prop = {
            compte: 0,
            nombreRessources: parametres.stockImages.length
        };
        this.ressources = {};
        // Chargement + lancement
        this.creerContexte();
        if (this.prop !== 0) {
            this.traitement(parametres.stockImages, parametres.clefs);
        };
        // fps
        this.fps = {
            frame: 0,
            nouvelle: 0,
            ancienne: (new Date()).getMilliseconds(),
            conteur: 1,
            rendu: function() {
                this.nouvelle = (new Date()).getMilliseconds();
                if (this.ancienne > this.nouvelle) {
                    this.frame = this.conteur;
                    this.conteur = 1;
                } else {
                    this.conteur += 1;
                }
                this.ancienne = this.nouvelle;
            },
        };
        // menu
        let bouttons = [{
            nom: "Start game",
            lien: "start"
        }, {
            nom: "How to play",
            lien: "regles"
        }, {
            nom: "About",
            lien: "info"
        }, ];
        let valeur = [];
        for (var i = 0; i < bouttons.length; i++) {
            valeur.push(bouttons[i].nom.length);
        };
        let self = this;
        this.menu = {
            monde: self,
            ctx: self.ctx,
            choix: bouttons,
            max: bouttons.length - 1,
            selection: 0,
            texteMax: Math.max(...valeur) * 6 + 60,
            pos: {
                x: self.L / 2,
                y: 100
            },
            curseur: self.ressources.curseur,
            rendu: function() {
                // dessiner le cadre
                this.monde.boite(this.pos.x - this.texteMax / 2, this.pos.y - 10, this.texteMax, 26 * this.choix.length);
                // on affiche le titre
                for (var i = 0; i < this.choix.length; i++) {
                    this.monde.ecrire(this.choix[i].nom, this.pos.x, this.pos.y + 25 * i, 1);
                }
                // on affiche la selection
                this.ctx.drawImage(this.curseur.img, 48, 0, 16, 16, this.pos.x - ((this.choix[this.selection].nom.length / 2) * 6) - 26, this.pos.y + 25 * (this.selection) - 4, 16, 16);
            },
            changement: function(keyCode) {
                if (keyCode === 38 && this.selection > 0) {
                    // haut
                    this.selection -= 1;
                    this.rendu();
                } else if (keyCode === 40 && this.selection < this.max) {
                    // bas
                    this.selection += 1;
                    this.rendu();
                } else if (keyCode === 88) {
                    // action
                    this.actif = false;
                    this.monde.phase(this.choix[this.selection].lien);
                }
            },
        };
    }
    creerContexte() {
        this.toile = document.createElement("canvas");
        this.ctx = this.toile.getContext('2d');
        this.L = this.toile.width = 16*8;
        this.H = this.toile.height = 16*8;
        this.limite = {
            x: this.L,
            y: this.H
        }
        this.toile.style.width = this.L * this.zoom + "px";
        this.toile.style.height = this.H * this.zoom + "px";
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
        document.body.appendChild(this.toile);
        console.log('%c Monde créé ', 'padding:2px; border-left:2px solid green; background: lightgreen; color: #000');
        //document.addEventListener("keydown", event => this.touchePresse(event), false);
        //document.addEventListener("keyup", event => this.toucheLache(event), false);
    }
    /*
       _____ _                                               _
      / ____| |                                             | |
     | |    | |__   __ _ _ __ __ _  ___ _ __ ___   ___ _ __ | |_
     | |    | '_ \ / _` | '__/ _` |/ _ \ '_ ` _ \ / _ \ '_ \| __|
     | |____| | | | (_| | | | (_| |  __/ | | | | |  __/ | | | |_
      \_____|_| |_|\__,_|_|  \__, |\___|_| |_| |_|\___|_| |_|\__|
                              __/ |
                             |___/
    */
    chargement() {
        this.prop.compte += 1;
        if (this.prop.compte === this.prop.nombreRessources) {
            console.log('%c les images sont chargées ' + this.prop.nombreRessources + " / " + this.prop.nombreRessources, 'padding:2px; border-left:2px solid green; background: lightgreen; color: #000');
            // Fin de chargement
            this.phase(this.etat);
        } else {
            // écran de chargement
            this.ctx.fillStyle = this.fond;
            this.ctx.fillRect(0, 0, this.L, this.H);
            this.ctx.fillStyle = "#fff";
            this.ctx.fillRect(0, this.H / 2 - 1, (this.prop.compte * this.L) / this.prop.nombreRessources, 1);
        }
    }
    chargerImages(url) {
        let img = new Image();
        img.onload = () =>{
            this.chargement();
        };
        img.src = url;
        return img;
    }

    chargerSon(url) {
        let audio = new Audio(url);
        audio.addEventListener('canplaythrough', this.chargement(), false);
        return audio;
    }


    traitement(stockImages, clefs) {
        // traitement images
        let IM = {};
        for (let i = 0; i < stockImages.length; i++) {
            let sujet = stockImages[i];
            let nom = sujet.nom;
            sujet.img = this.chargerImages(stockImages[i].img);
            IM[nom] = stockImages[i];
        }
        this.ressources = IM;
        // traitement Son
        if (clefs) {
            //  traitement clefs
            this.nettoyer = new Array(clefs.length).fill(false)
            let CM = {};
            for (let i = 0; i < clefs.length; i++) {
                let sujet = clefs[i];
                let nom = sujet.id;
                if (sujet.type === "sprite") {
                    sujet.frame = 0;
                    sujet.sprite = this.ressources[sujet.apparence];
                    sujet.memoireBoucle = false;
                    sujet.peutAnimer = true;
                    sujet.boucle = true;
                }
                CM[nom] = clefs[i];
            }
            this.clefs = CM;
        }
    }
    touchePresse(event) {
        this.touches[event.keyCode] = true;
        if (this.touches[70]) {
            this.activeRemplissage();
        }
        switch (this.etat) {
            case "menu":
                this.menu.changement(event.keyCode);
                break;
            case "start":
                if (this.touches[69]) {
                    this.phase("menu")
                }
                break;
            case "mort":
                if (this.touches[67]) {
                    this.phase("menu")
                }
                break;
            case "regles":
                if (this.touches[67]) {
                    this.phase("menu")
                }
                break;
            case "info":
                if (this.touches[67]) {
                    this.phase("menu")
                }
                break;
            default:
                console.log("aucune touche reconnue");
        }
    }
    toucheLache(event) {
        this.touches[event.keyCode] = false;
    }
    activeRemplissage() {
        if (!this.remplissage) {
            this.toile.webkitRequestFullScreen()
            this.remplissage = true;
            this.toile.style.width = "100vmin";
            this.toile.style.height = "100vmin";
        } else {
            document.webkitCancelFullScreen()
            this.remplissage = false;
            this.toile.style.width = this.L * this.zoom + "px";
            this.toile.style.height = this.H * this.zoom + "px";
        }
    }

    chercheClef(recherche) {
        let blockRecherche = [];
        for (var j = 0; j < this.terrain.dimension.y; j++) {
            for (var i = 0; i < this.terrain.dimension.x; i++) {
                let id = this.terrain.geometrie[j][i];
                if (this.clefs[id].nom === recherche) {
                    let info = {
                        pos: {
                            x: i,
                            y: j
                        }
                    }
                    blockRecherche.push(info);
                }
            }
        }
        return blockRecherche;
    }
    infoClef(x, y) {
        if (x > -1 && x < this.terrain.dimension.x && y > -1 && y < this.terrain.dimension.y) {
            return this.clefs[this.terrain.geometrie[y][x]];
        } else {
            return false;
        }
    }
    ecrire(texte, x, y, couleur) {
        let largeur = 6,
            hauteur = 9;
        let mult = couleur || 0;
        let centre = (texte.length * largeur) / 2;
        for (let i = 0; i < texte.length; i++) {
            let index = this.alphabet.indexOf(texte.charAt(i)),
                clipX = largeur * index,
                posX = (x - centre) + (i * largeur);
            this.ctx.drawImage(this.ressources.pixelFont.img, clipX, (mult * hauteur), largeur, hauteur, posX, y, largeur, hauteur);
        }
    }
    boite(x, y, l, h) {
        this.ctx.fillStyle = "white";
        // dessiner le fond
        this.ctx.fillRect(x + 1, y + 1, l - 2, h - 2);
        // dessiner les bords
        //haut Gauche
        this.ctx.drawImage(this.ressources.curseur.img, 32, 16, 16, 16, x, y, 16, 16);
        //haut Droit
        this.ctx.drawImage(this.ressources.curseur.img, 32 + 8, 16, 16, 16, x + l - 16, y, 16, 16);
        //bas Gauche
        this.ctx.drawImage(this.ressources.curseur.img, 32, 16 + 8, 16, 16, x, y + h - 16, 16, 16);
        //bas Gauche
        this.ctx.drawImage(this.ressources.curseur.img, 32 + 8, 16 + 8, 16, 16, x + l - 16, y + h - 16, 16, 16);
        // haut
        this.ctx.drawImage(this.ressources.curseur.img, 32 + 4, 16, 16, 16, x + 16, y, l - 32, 16);
        // bas
        this.ctx.drawImage(this.ressources.curseur.img, 32 + 4, 16 + 8, 16, 16, x + 16, y + h - 16, l - 32, 16);
        // gauche
        this.ctx.drawImage(this.ressources.curseur.img, 32, 16 + 4, 16, 16, x, y + 16, 16, h - 32);
        // droit
        this.ctx.drawImage(this.ressources.curseur.img, 32 + 8, 16 + 4, 16, 16, x + l - 16, y + 16, 16, h - 32);
    }
    bitMasking() {
        let tuileBitMask = [];
        let compte = 0;
        this.terrain.apparence = [];
        for (var j = 0; j < this.terrain.dimension.y; j++) {
            for (var i = 0; i < this.terrain.dimension.x; i++) {
                let id = this.terrain.geometrie[j][i];
                // haut gauche droit bas
                let voisine = [0, 0, 0, 0];
                compte += 1;
                if (j - 1 > -1) {
                    if (id === this.terrain.geometrie[j - 1][i]) {
                        //haut
                        voisine[0] = 1;
                    }
                } else {
                    voisine[0] = 1;
                }
                if (i - 1 > -1) {
                    if (id === this.terrain.geometrie[j][i - 1]) {
                        // gauche
                        voisine[1] = 1;
                    }
                } else {
                    voisine[1] = 1;
                }
                if (i + 1 < this.terrain.dimension.x) {
                    if (id === this.terrain.geometrie[j][i + 1]) {
                        // droite
                        voisine[2] = 1;
                    }
                } else {
                    voisine[2] = 1;
                }
                if (j + 1 < this.terrain.dimension.y) {
                    if (id === this.terrain.geometrie[j + 1][i]) {
                        //bas
                        voisine[3] = 1;
                    }
                } else {
                    voisine[3] = 1;
                }
                id = 1 * voisine[0] + 2 * voisine[1] + 4 * voisine[2] + 8 * voisine[3];
                this.terrain.apparence.push(id);
            }
        }
        this.terrain.apparence = Utl.morceler(this.terrain.apparence, this.terrain.dimension.x);
    }
    renduTerrain() {
        for (let j = 0; j < this.terrain.dimension.y; j++) {
            for (let i = 0; i < this.terrain.dimension.x; i++) {
                let id = this.terrain.geometrie[j][i];
                if (this.clefs[id].apparence === "auto") {
                    var sourceX = Math.floor(this.terrain.apparence[j][i]) * this.taille;
                    var sourceY = Math.floor(this.terrain.apparence[j][i]) * this.taille;
                    this.ctx.drawImage(this.ressources.feuille.img, sourceX, this.clefs[id].ligne * this.taille, this.taille, this.taille, i * this.taille, j * this.taille, this.taille, this.taille);
                } else if (this.clefs[id].type === "sprite") {
                    if (!this.clefs[id].memoireBoucle) {
                        if (this.clefs[id].peutAnimer) {
                            this.clefs[id].frame += this.clefs[id].allure;
                        }
                        if (this.clefs[id].frame >= this.clefs[id].sprite.sep) {
                            if (!this.clefs[id].boucle) {
                                this.clefs[id].peutAnimer = false;
                            }
                            this.clefs[id].frame = 0;
                        }
                        this.clefs[id].memoireBoucle = true;
                        // on sait quel id est déjà passé :^)
                        this.nettoyer[id] = true;
                    }
                    this.ctx.drawImage(this.clefs[id].sprite.img, Math.floor(this.clefs[id].frame) * this.taille, 0, this.taille, this.taille, i * this.taille, j * this.taille, this.taille, this.taille);
                } else {
                    var sourceX = Math.floor(this.clefs[id].apparence % 16) * this.taille;
                    var sourceY = Math.floor(this.clefs[id].apparence / 16) * this.taille;
                    this.ctx.drawImage(this.ressources.feuille.img, sourceX, sourceY, this.taille, this.taille, i * this.taille, j * this.taille, this.taille, this.taille);
                }
            }
        }
        for (var i = 0; i < this.nettoyer.length; i++) {
            if (this.nettoyer[i]) {
                this.clefs[i].memoireBoucle = false;
            }
        }
    }
    initialiserMap(){
        this.terrain.dimension = {
            x: this.terrain.geometrie[0].length,
            y: this.terrain.geometrie.length
        };
        this.terrain.apparence = [];
        this.bitMasking();
    }

    initialiser() {
        this.lapinStock = [];
        for (var i = 0; i < 10; i++) {
            this.lapinStock.push(new Entite(this, this.ressources.lapin));
        }
        this.initialiserMap();
        this.boucle();
    }
    rendu(){
        this.renduTerrain();
        for (var i = this.lapinStock.length - 1; i >= 0; i--) {
            this.lapinStock[i].rendu();
        }
    }
    boucle() {
        this.ctx.fillStyle = this.fond;
        this.ctx.fillRect(0, 0, this.L, this.H);
        this.rendu();
        this.animation = requestAnimationFrame(() => this.boucle());
    }
    phase(phase) {
        this.etat = phase;
        cancelAnimationFrame(this.animation);
        this.ctx.fillStyle = this.fond;
        this.ctx.fillRect(0, 0, this.L, this.H);
        switch (phase) {
            case "menu":
                // affiche le menu du jeu
                this.ctx.drawImage(this.ressources.titre.img, 0, 0);
                this.menu.rendu();
                this.ecrire("[arrow keys] to select [x] to confirm", this.L / 2, this.H - 25);
                break;
            case "start":
                this.initialiser();
                break;
            case "mort":
                // affiche le tableau de mort du joueur
                this.ecrire("vous etes mort", this.L / 2, 15);
                this.ecrire("appuyez sur 'c' pour retourner au menu", this.L / 2, this.H - 25);
                break;
            case "regles":
                // affiche les regles
                this.ecrire("controles : ", this.L / 2, 15);
                this.ecrire("arrow keys to move", this.L / 2, 35);
                this.ecrire("'x' and 'c' for actions", this.L / 2, 45);
                this.ecrire("'f' to toggle fullscreen", this.L / 2, 55);
                this.ecrire("'e' to exit the game", this.L / 2, 65);
                this.ecrire("rules : ", this.L / 2, 90);
                this.ecrire("il me faut des regles :)", this.L / 2, 110);
                this.ecrire("appuyez sur 'c' pour retourner au menu", this.L / 2, this.H - 25);
                break;
            case "info":
                // Affiche les infos
                this.ecrire("About : ", this.L / 2, 15);
                this.ecrire("made with html5 canvas", this.L / 2, 40);
                this.ecrire("by g.tibo on codepen", this.L / 2, 55);
                this.ecrire("appuyez sur 'c' pour retourner au menu", this.L / 2, this.H - 25);
                break;
            default:
                console.log("aucune action reconnue");
        }
    }
};
let parametres = {
    taille:16,
    zoom:3,


    stockImages: [
        {img:"https://image.ibb.co/kb2eRU/feuille.png",nom:"feuille"},
        {img:"https://image.ibb.co/eEfjNa/lapin_Sprite.png",nom:"lapin",sep:6,ligne:6},
    ],

    clefs:[
        {type:"tuile",nom:"herbe",id:0,collision:false,apparence:0},
        {type:"tuile",nom:"herbe2",id:1,collision:false,apparence:1},
        {type:"tuile",nom:"herbe3",id:2,collision:false,apparence:2},
        {type:"tuile",nom:"caillou",id:3,collision:false,apparence:3},
        {type:"tuile",nom:"caillou2",id:4,collision:false,apparence:4},
        {type:"tuile",nom:"terre",id:5,collision:false,apparence:5},
    ],
}

let map = {"titre":"carte","geometrie":[[0,0,0,0,0,1,0,0,0,1,1,0,1,0,0,0],[0,1,1,1,0,1,0,1,0,0,1,1,1,2,1,0],[1,0,0,1,1,1,1,1,0,0,1,0,2,2,1,1],[0,4,1,1,0,1,1,1,1,0,0,0,0,1,1,2],[1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2],[0,0,1,2,0,0,0,0,0,0,0,1,1,1,3,0],[0,0,1,1,3,2,1,0,0,0,0,1,1,0,2,2],[0,0,0,1,2,2,1,0,0,0,0,1,0,0,0,2],[0,1,1,2,2,1,1,0,0,4,0,0,1,1,0,2],[0,1,1,1,1,1,0,0,0,0,1,1,1,1,0,2],[0,0,0,0,1,1,1,1,1,1,1,0,2,2,2,2],[1,1,3,1,0,1,1,0,0,0,0,0,0,0,2,0],[1,1,1,0,0,0,0,0,0,0,1,2,0,0,0,0],[1,0,0,1,0,1,1,1,1,4,1,1,0,0,0,0],[0,1,1,0,1,1,0,0,0,0,0,0,1,2,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]]}


let demo = new Monde(parametres,map);