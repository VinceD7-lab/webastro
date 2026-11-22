/**
 * Pont entre le plan de la collection (src/data/collection.ts) et le contenu réellement migré :
 * un chapitre est « à lire ici » dès qu’il a un `slug` dans chapitres.ts ET un fichier dans
 * src/content/cours/. Rien d’autre à déclarer quand un chapitre est migré.
 */
import { getCollection } from 'astro:content';
import { chapitres } from '../data/chapitres';
import { cours, coursDuTheme, themes, type Cours, type Theme } from '../data/collection';
import { url } from './url';

/** Dossier du site d’origine d’une adresse : `…/pages_kepler/index.html` → `pages_kepler`. */
const dossierDe = (href: string) => href.split('/').at(-2) ?? '';

export interface PartieAffichee {
  numero: number;
  titre: string;
  href: string;
  /** Vrai si le lien quitte le site pour celui de l’Observatoire. */
  externe: boolean;
  /** Chapitre disponible ici (« à lire ici »). */
  migre: boolean;
  /** Chapitre actuellement affiché (« page actuelle »). */
  actuelle: boolean;
}

export interface CoursAffiche extends Cours {
  /** Lien d’ouverture du cours : sa page ici s’il est modernisé, sinon le site d’origine. */
  href: string;
  externe: boolean;
  moderne: boolean;
  affichees: PartieAffichee[];
}

export interface ThemeAffiche extends Omit<Theme, 'cours'> { cours: CoursAffiche[] }

let migres: Promise<Set<string>> | undefined;
/** Slugs des chapitres dont le fichier existe dans le contenu. */
function slugsMigres() {
  migres ??= getCollection('cours').then((entrees) => new Set(entrees.map((e) => e.id)));
  return migres;
}

/**
 * Plan complet de la collection, prêt à afficher.
 * @param actuel cours (dossier d’origine) et chapitre (slug) de la page en cours, s’il y en a.
 */
export async function planCollection(actuel: { cours?: string; chapitre?: string } = {}): Promise<ThemeAffiche[]> {
  const presents = await slugsMigres();
  // Chapitre migré → slug, indexé par dossier d’origine (pages_kepler → kepler).
  const parDossier = new Map(chapitres.filter((c) => c.slug && presents.has(c.slug)).map((c) => [dossierDe(c.source), c.slug!]));

  return themes.map((t) => ({
    id: t.id,
    titre: t.titre,
    cours: coursDuTheme(t).map((c): CoursAffiche => {
      const affichees = c.parties.map((p, i): PartieAffichee => {
        // Seul un cours modernisé rattache ses parties à des chapitres locaux.
        const slug = c.local ? parDossier.get(dossierDe(p.href)) : undefined;
        return {
          numero: i + 1,
          titre: p.titre,
          href: slug ? url(`/cours/${slug}/`) : p.href,
          externe: !slug,
          migre: !!slug,
          actuelle: !!slug && slug === actuel.chapitre,
        };
      });
      return { ...c, href: c.local ? url(c.local) : c.entree, externe: !c.local, moderne: !!c.local, affichees };
    }),
  }));
}

export const nombreDeCours = cours.length;
export const nombreDeParties = cours.reduce((n, c) => n + c.parties.length, 0);
