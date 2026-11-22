# Lumières sur l’Univers

[![Déploiement](https://github.com/VinceD7-lab/webastro/actions/workflows/deploy.yml/badge.svg)](https://github.com/VinceD7-lab/webastro/actions/workflows/deploy.yml)
Site : <https://vinced7-lab.github.io/webastro/>

Portail de la collection de cours libres de l’Observatoire de Paris
(<https://media4.obspm.fr/public/ressources_lu/index.html>), construit avec [Astro](https://astro.build).
Il présente les 22 cours de la collection ; un menu « Cours » (touche `c`) permet d’atteindre
n’importe lequel depuis toute page. Les cours sont réécrits un à un : pour l’instant seul
**Mécanique céleste, Temps et Calendriers** (Jean-Eudes Arlot) l’est, les autres s’ouvrent
sur le site d’origine.

Vocabulaire : le site d’origine appelle « chapitres » les 22 ensembles ; l’interface les nomme
« cours », pour ne pas les confondre avec les chapitres de Mécanique céleste.

Les huit chapitres de Mécanique céleste sont migrés : **La notion de repère**, **La mesure des distances**,
**Les lois de Kepler**, **La mécanique céleste**, **La gravitation universelle et la relativité**,
**La mesure du temps**, **Les calendriers** et **Les éphémérides**.

## Démarrer

Il faut Node.js 22.12 ou plus récent (version LTS).

```bash
npm install
npm run dev        # http://localhost:4321, rechargement automatique
```

```bash
npm run build      # construit le site dans dist/ et indexe la recherche
npm run preview    # sert dist/ pour vérifier avant publication
```

La recherche (Pagefind) n’existe qu’après `npm run build` : en mode `dev`,
la boîte de recherche affiche un message d’explication.

## Organisation

```
src/
├─ content/cours/          un fichier .mdx par chapitre
├─ content.config.ts       champs obligatoires du frontmatter
├─ data/
│  ├─ collection.ts        les 22 cours : thèmes, descriptions, auteurs, cours modernisés
│  ├─ collection-parties.json  titres et liens des 117 parties (généré, voir plus bas)
│  ├─ chapitres.ts         plan complet de Mécanique céleste (8 chapitres)
│  ├─ glossaire.json       définitions des infobulles et de la page Glossaire
│  └─ redirections.mjs     anciennes adresses → nouvelles pages
├─ components/             encadrés, quiz, outils interactifs
├─ layouts/                BaseLayout (en-tête, thème, recherche), ChapterLayout (sommaire, progression)
├─ lib/
│  ├─ calendriers.ts       conversions entre calendriers (testées sur les dates de référence du cours)
│  ├─ collection.ts        plan de la collection prêt à afficher (menu, accueil)
│  └─ url.ts               préfixe les liens internes avec `base`
├─ pages/                  accueil (portail), mctc/ (page du cours), glossaire, 404, route des chapitres
├─ styles/global.css       couleurs, typographie, mode sombre
└─ assets/                 images des cours (optimisées automatiquement)
```

## La collection : menu, accueil, redirections

- **Menu « Cours »** (`components/MenuCours.astro`) : monté dans `BaseLayout`, donc sur toutes les pages.
  À droite, la fiche du cours survolé (auteurs, description, parties). À l’ouverture, le cours lu est
  sélectionné (« vous êtes ici ») ; le chapitre affiché est « page actuelle », les chapitres déjà
  réécrits « à lire ici ». Les pages passent `cours` (dossier d’origine) et `chapitre` (slug) à `BaseLayout`.
- **Accueil** (`pages/index.astro`) : les cours en cartes par thème, les cours modernisés en tête.
  La page du cours Mécanique céleste est `/mctc/`.
- **Thèmes, descriptions, auteurs** : à modifier dans `src/data/collection.ts`.
- **Titres et liens des parties** : relevés sur le sommaire général du site d’origine
  (`pages_r-ressources/sommaire.html`) ; le cours Gravitation, absent de ce sommaire, est lu sur sa
  propre page. Pour les relever à nouveau : `node scripts/releve-collection.mjs`
  (réécrit `src/data/collection-parties.json`).
- **Cours modernisé** : une partie passe en « à lire ici » toute seule dès que son chapitre a un `slug`
  dans `chapitres.ts` et un fichier dans `src/content/cours/`. Pour un nouveau cours entièrement migré,
  ajoutez son dossier dans `LOCAUX` (`collection.ts`) avec l’adresse de sa page d’accueil.
- **Anciennes adresses** : `src/data/redirections.mjs`, y compris l’entrée du site d’origine
  (`index.html`) et celle du cours (`pages_mctc/`).

## Ajouter un chapitre

1. Créez `src/content/cours/05-gravitation.mdx` :

   ```mdx
   ---
   title: La gravitation universelle et la relativité
   slug: gravitation
   numero: 5
   resume: De Newton à Einstein.
   source: https://media4.obspm.fr/public/ressources_lu/pages_gravitation/introduction-gravitation.html
   ---
   import Encadre from '../../components/Encadre.astro';

   ## Introduction

   Texte du chapitre…
   ```

2. Dans `src/data/chapitres.ts`, ajoutez `slug: 'gravitation'` au chapitre 5.
   Il passe alors en « à lire ici » sur la page du cours et dans le menu « Cours », et les boutons
   précédent/suivant suivent.
3. Ajoutez ses anciennes adresses dans `src/data/redirections.mjs`.

Chaque titre `##` devient une entrée du sommaire latéral et un résultat de recherche.

### Convertir le contenu d’origine

La page « impression » de chaque chapitre contient tout le texte. Avec
[pandoc](https://pandoc.org) :

```bash
curl -O https://media4.obspm.fr/public/ressources_lu/pages_gravitation/impression.html
pandoc -f html -t gfm --wrap=none impression.html -o brouillon.md
```

Puis : ajoutez le frontmatter, passez les titres en `##`, remplacez les blocs
« En savoir plus » et les corrections par les composants ci-dessous, écrivez les
formules en `$…$` ou `$$…$$`, et copiez les images dans `src/assets/`.

Pensez à vérifier les conditions de réutilisation du contenu auprès de
l’Observatoire de Paris avant toute mise en ligne publique.

## Composants disponibles dans les fichiers MDX

| Composant | Usage |
| --- | --- |
| `<Encadre type="def\|retenir\|hist\|plus" titre="…">` | encadré pédagogique |
| `<Terme id="foyer">foyers</Terme>` | terme avec infobulle (définition dans `glossaire.json`) |
| `<Personne id="newton">Newton</Personne>` | nom cliquable : ouvre un volet à droite avec la fiche de la personne (résumé Wikipédia, dates, portrait) ; un clic en dehors le ferme |
| `<Repli titre="…">` | bloc repliable ; sans titre : « Afficher la correction » |
| `<Quiz questions={[{ question, choix, reponse, explication }]} />` | quiz, `reponse` = index de la bonne réponse (à partir de 0), ou tableau d’index s’il y en a plusieurs (cases à cocher) ; `explication` facultative, affichée après vérification |
| `<Frise evenements={[{ date, titre, texte }]} />` | frise chronologique |
| `<Chiffres valeurs={[{ valeur, legende }]} />` | rangée de valeurs clés |
| `> phrase` | énoncé mis en valeur (lois, définitions) |
| `$$ … $$` | formule centrée, rendue en MathML |

Outils propres aux chapitres : `SimulateurKepler`, `SchemaEllipse`, `TableauKepler`,
`TableauDurees`, `EcartJulienGregorien`, `TesteurBissextile`, `ConvertisseurDates`,
`TableMois`, `VendredisTreize`, `Almanach`, `SimulateurSphereCeleste`, `SimulateurSoleil`,
`SimulateurParallaxe`, `SimulateurDeuxModeles`, `SimulateurCanonNewton`, `SimulateurPeriodes`,
`SimulateurLagrange`, `SimulateurEchellesTemps`, `SimulateurEquationTemps`, `SimulateurFuseaux`,
`SimulateurJourSideral`, `SimulateurLeverCoucher`, `SimulateurGeodesiques`, `SimulateurLentille`,
`SimulateurLorentz`, `SimulateurPerihelie`, `SimulateurInterpolation`, `SimulateurJupiter`,
`SimulateurTchebychev`.
Les tableaux et le graphique sont calculés pendant la construction et ne chargent
aucun JavaScript.

Les schémas du chapitre « repères » sont dans `src/components/reperes/`. Ils sont
dessinés en perspective par `src/lib/projection.ts` (la partie cachée des cercles est en
tirets) et calculés pendant la construction. Les calculs astronomiques (changements
de repère, temps sidéral, position du Soleil) sont dans `src/lib/reperes.ts`.
Ceux du chapitre « distances » (triangulation, parallaxe, Ératosthène) sont dans
`src/lib/distances.ts`, ses schémas dans `src/components/distances/`, et les petits dessins
partagés (observateur, Lune, Terre) dans `src/lib/dessin.ts`.
Ceux du chapitre « mécanique céleste » (périodes des satellites, coniques de lancement,
points de Lagrange, lignes de niveau) sont dans `src/lib/mecanique.ts`, ses schémas dans
`src/components/mecanique/`. La courbe d’excentricité de la Terre vient de la solution La2004
(Laskar et al., 2004, IMCCE), échantillonnée dans `src/data/excentricite-la2004.json`.

### Fiches des personnalités

Les fiches du volet sont dans `src/data/personnalites.json` et les portraits dans
`public/personnes/`. Pour ajouter une personne, complétez la liste en tête de
`scripts/wiki-personnes.mjs`, puis lancez :

```bash
node scripts/wiki-personnes.mjs
```

Le script récupère l’introduction de l’article de Wikipédia en français, les dates
(Wikidata) et le portrait (Wikimedia Commons, conservé seulement s’il est dans le domaine
public ou sous licence CC BY / CC BY-SA). Les extraits de Wikipédia sont sous licence
CC BY-SA 4.0 : chaque fiche cite l’article, la licence et l’auteur du portrait. Le volet
n’est ajouté qu’aux chapitres qui utilisent `<Personne>`.

## Publier

**GitHub Pages** (réglé pour ce dépôt) : `.github/workflows/deploy.yml` construit et publie le
site à chaque push sur `main`. Une seule fois, dans Settings › Pages, choisissez la source
« GitHub Actions ». Le site est alors servi sur <https://vinced7-lab.github.io/webastro/>.
`site` et `BASE` (`'/webastro/'`) sont définis dans `astro.config.mjs` : à modifier si vous
renommez le dépôt ou utilisez un domaine propre (alors `BASE = '/'`).

**Netlify ou Cloudflare Pages** : mettez `BASE = '/'`, connectez le dépôt, commande de
construction `npm run build`, dossier publié `dist`.

## Licence et droits

Le code n’est pas encore placé sous licence : tous droits réservés par défaut.
Le contenu du cours est de Jean-Eudes Arlot, © Observatoire de Paris (collection
« Lumières sur l’Univers ») ; ses conditions de réutilisation restent à vérifier.
Les fiches des personnalités reprennent des extraits de Wikipédia (CC BY-SA 4.0) et des
portraits de Wikimédia Commons sous leurs licences respectives ; la courbe d’excentricité
vient de la solution La2004 (Laskar et al., 2004, IMCCE).
