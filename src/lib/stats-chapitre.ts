/**
 * Chiffres d’un chapitre tirés de son source MDX : durée de lecture, simulations, exercices, quiz.
 * Utilisé par l’en-tête des chapitres (ChapterLayout) et par les cartes du plan (page d’accueil).
 */
import { readFileSync } from 'node:fs';
import type { CollectionEntry } from 'astro:content';

/** `entry.body` n’est pas toujours fourni pour les fichiers MDX : on lit alors le fichier source. */
export function sourceDe(entry: CollectionEntry<'cours'>): string {
  return entry.body || (entry.filePath ? readFileSync(entry.filePath, 'utf8') : '');
}

/** Composants interactifs (simulateurs, convertisseurs, testeurs). */
const INTERACTIFS = /<(Simulateur\w*|ConvertisseurDates|TesteurBissextile|VendredisTreize)\b/g;
const MOTS_PAR_MINUTE = 200;

export interface StatsChapitre { minutes: number; simulations: number; exercices: number; quiz: boolean }

export function statsChapitre(source: string): StatsChapitre {
  const corps = source
    .replace(/^---[\s\S]*?---/, '')            // frontmatter
    .replace(/^import .*$/gm, '')              // imports
    .replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g, ' ') // formules
    .replace(/<[^>]+>/g, ' ')                  // balises JSX/HTML
    .replace(/[#*_>|`-]/g, ' ');
  const mots = corps.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;
  return {
    minutes: Math.max(5, Math.round(mots / MOTS_PAR_MINUTE / 5) * 5),
    simulations: (source.match(INTERACTIFS) || []).length,
    // Un exercice = une correction : <Repli> sans titre (libellé par défaut « Afficher la correction »).
    exercices: (source.match(/<Repli>/g) || []).length,
    quiz: /<Quiz\b/.test(source),
  };
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** « ≈ 45 min de lecture », « 4 modules interactifs », « 19 exercices corrigés », « quiz » */
export function libellesStats(s: StatsChapitre): string[] {
  return [
    `≈ ${s.minutes} min de lecture`,
    s.simulations ? `${pluriel(s.simulations, 'module')} interactif${s.simulations > 1 ? 's' : ''}` : '',
    s.exercices ? `${pluriel(s.exercices, 'exercice')} corrigé${s.exercices > 1 ? 's' : ''}` : '',
    s.quiz ? 'quiz' : '',
  ].filter(Boolean);
}
