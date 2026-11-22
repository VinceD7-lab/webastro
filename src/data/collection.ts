/**
 * Les 22 cours de la collection « Lumières sur l’Univers » (Observatoire de Paris).
 *
 * - Titres, liens et parties : relevés sur le site d’origine par `node scripts/releve-collection.mjs`
 *   (fichier `collection-parties.json`, ne pas éditer à la main).
 * - Regroupement en thèmes, descriptions d’une ligne, auteurs à corriger : à modifier ci-dessous.
 * - Un cours est « modernisé » quand il figure dans `LOCAUX` : ses parties sont alors rattachées aux
 *   chapitres de `chapitres.ts` (voir `src/lib/collection.ts`). Les autres cours s’ouvrent sur le site d’origine.
 *
 * Vocabulaire : le site d’origine appelle « chapitres » ces 22 ensembles ; l’interface les nomme « cours »
 * pour ne pas les confondre avec les chapitres de Mécanique céleste.
 */
import releve from './collection-parties.json';

export interface Partie { titre: string; href: string }

export type ThemeId = 'ciel' | 'soleil' | 'galaxies' | 'planetes' | 'outils';

export interface Theme { id: ThemeId; titre: string; cours: string[] }

export interface Cours {
  /** Numéro du cours sur le portail d’origine (1 à 22). */
  numero: number;
  /** Nom du dossier sur le site d’origine, par exemple `pages_mctc`. */
  dossier: string;
  titre: string;
  theme: ThemeId;
  auteurs: string;
  description: string;
  /** Page d’introduction sur le site d’origine. */
  entree: string;
  parties: Partie[];
  /** Adresse (sans le `base`) de la version modernisée, si elle existe. */
  local?: string;
}

/** Cours dont les chapitres (src/content/cours) sont migrés ici. */
export const COURS_MIGRE = 'pages_mctc';

/** Cours disponibles ici, avec l’adresse de leur page d’accueil. */
export const LOCAUX: Record<string, string> = {
  [COURS_MIGRE]: '/mctc/',
};

/** Thèmes, dans l’ordre d’affichage ; `cours` liste les dossiers dans l’ordre voulu. */
export const themes: Theme[] = [
  { id: 'ciel', titre: 'Le ciel, le temps et les mouvements', cours: ['pages_mctc', 'pages_stlp', 'pages_temps', 'pages_masse'] },
  { id: 'soleil', titre: 'Le Soleil, les étoiles et leur lumière', cours: ['pages_etoiles-planetes', 'pages_soleil', 'pages_temperature'] },
  { id: 'galaxies', titre: 'Galaxies et Univers', cours: ['pages_distances-temps', 'pages_pus7', 'pages_cosmologie', 'pages_extragal', 'pages_gravite'] },
  {
    id: 'planetes', titre: 'Sciences planétaires', cours: [
      'pages_planetologie-histoire', 'pages_planetologie-formation', 'pages_planetologie-petitscorps', 'pages_planetologie-surface',
      'pages_planetologie-thermique', 'pages_planetologie-dynamique', 'pages_planetologie-habitabilite',
    ],
  },
  { id: 'outils', titre: 'Outils, physique et pratique', cours: ['pages_physique', 'pages_instrumentation', 'pages_tps'] },
];

/** Description d’une ligne et, si le relevé ne les donne pas ou mal, auteurs. */
const fiches: Record<string, { description: string; auteurs?: string }> = {
  'pages_distances-temps': { description: 'De la Terre aux confins de l’Univers : mesurer les distances, c’est aussi remonter le temps.' },
  'pages_pus7': { description: 'Ce qu’est une onde gravitationnelle, d’où elle vient et comment on la détecte.' },
  'pages_cosmologie': { description: 'L’expansion de l’Univers, le fond diffus cosmologique et la naissance des grandes structures.' },
  'pages_etoiles-planetes': { description: 'Des étoiles aux exoplanètes, avec une introduction à la planétologie comparée.' },
  'pages_mctc': { description: 'Repères, lois de Kepler, gravitation, mesure du temps, calendriers et éphémérides.' },
  'pages_stlp': { description: 'Saisons, mouvements de la Terre et de la Lune, éclipses de Soleil et de Lune.' },
  'pages_extragal': { description: 'Les galaxies et les grandes structures de l’Univers.' },
  'pages_physique': { description: 'Optique géométrique et quatre forces fondamentales de la nature.' },
  'pages_soleil': { description: 'Le Soleil et son héliosphère : astrométrie, activité solaire, du rayonnement X à la radio.' },
  'pages_tps': { description: 'Mesurer, modéliser et observer, des phases de la Lune aux taches solaires.', auteurs: 'Plusieurs auteurs' },
  'pages_temps': { description: 'Outils de repérage et échelle des distances en astronomie.' },
  'pages_masse': { description: 'Gravitation, systèmes binaires et multiples, marées et problème à N corps.' },
  'pages_temperature': { description: 'Rayonnement, diagramme de Hertzsprung-Russell et évolution stellaire.', auteurs: 'Benoît Mosser, M. Gerbaldi, G. Theureau' },
  'pages_instrumentation': { description: 'Optique, chaîne de mesure, techniques et instruments de l’astronomie.', auteurs: 'B. Mosser' },
  'pages_planetologie-histoire': { description: 'Qu’est-ce qu’une planète ? Définitions des planètes et des exoplanètes.' },
  'pages_planetologie-formation': { description: 'Les scénarios de formation des planètes.' },
  'pages_planetologie-petitscorps': { description: 'Astéroïdes, comètes et autres petits corps du système solaire.' },
  'pages_planetologie-surface': { description: 'Les processus qui façonnent les surfaces planétaires.' },
  'pages_planetologie-thermique': { description: 'La structure en température des atmosphères planétaires.' },
  'pages_planetologie-dynamique': { description: 'La circulation des atmosphères planétaires.' },
  'pages_planetologie-habitabilite': { description: 'Zones habitables et habitabilité des planètes.' },
  'pages_gravite': { description: 'Électromagnétisme, gravité et ondes gravitationnelles.' },
};

/** Titres du site d’origine, mis en forme : apostrophes et espaces avant « : » typographiques. */
const typo = (s: string) => s.replace(/'/g, '’').replace(/\s*:\s*(?=\S)/g, ' : ').replace(/^Des Etoiles/, 'Des Étoiles').replace(/\s+/g, ' ').trim();

interface Releve { titre: string; entree: string; auteurs: string; parties: Partie[] }
const dossiers = Object.keys(releve as Record<string, Releve>);

const themeDe = new Map<string, ThemeId>(themes.flatMap((t) => t.cours.map((d) => [d, t.id] as const)));

export const cours: Cours[] = dossiers.map((dossier, i) => {
  const r = (releve as Record<string, Releve>)[dossier];
  const fiche = fiches[dossier];
  const theme = themeDe.get(dossier);
  if (!fiche || !theme) throw new Error(`collection.ts : le cours « ${dossier} » n’a pas de thème ou de description.`);
  return {
    numero: i + 1,
    dossier,
    titre: typo(r.titre),
    theme,
    auteurs: fiche.auteurs ?? r.auteurs,
    description: fiche.description,
    entree: r.entree,
    parties: r.parties.map((p) => ({ titre: typo(p.titre), href: p.href })),
    local: LOCAUX[dossier],
  };
});

export const coursParDossier = new Map(cours.map((c) => [c.dossier, c]));

/** Les cours d’un thème, dans l’ordre voulu. */
export const coursDuTheme = (t: Theme): Cours[] => t.cours.map((d) => coursParDossier.get(d)!);

export const themeDuCours = (c: Cours): Theme => themes.find((t) => t.id === c.theme)!;
