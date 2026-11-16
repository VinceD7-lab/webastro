/**
 * Plan complet du cours. Les chapitres déjà migrés ont un `slug` qui correspond
 * au frontmatter de leur fichier MDX ; les autres renvoient vers le site d’origine.
 */
export interface Chapitre { numero: number; titre: string; resume: string; slug?: string; source: string }

const O = 'https://media4.obspm.fr/public/ressources_lu';

export const chapitres: Chapitre[] = [
  { numero: 1, titre: 'Introduction à la notion de repère', resume: 'La sphère céleste et les systèmes de coordonnées pour situer un astre.', slug: 'reperes', source: `${O}/pages_defrepere/introduction-sphere-celeste.html` },
  { numero: 2, titre: 'La mesure des distances', resume: 'De la triangulation à la distance Terre–Lune.', slug: 'distances', source: `${O}/pages_mesure-distances/introduction-mesure-distances.html` },
  { numero: 3, titre: 'Les lois de Kepler', resume: 'Héliocentrisme, orbites elliptiques, loi des aires et loi des périodes.', slug: 'kepler', source: `${O}/pages_kepler/introduction-kepler.html` },
  { numero: 4, titre: 'La mécanique céleste', resume: 'Le problème des deux corps et ses perturbations.', slug: 'mecanique-celeste', source: `${O}/pages_mecanique-celeste/introduction-mecanique-celeste.html` },
  { numero: 5, titre: 'La gravitation universelle et la relativité', resume: 'De Newton à Einstein : limites de la gravitation universelle, relativité restreinte et générale.', slug: 'gravitation', source: `${O}/pages_gravitation/introduction-gravitation.html` },
  { numero: 6, titre: 'La mesure du temps', resume: 'Temps solaire, temps sidéral, temps atomique.', slug: 'mesure-temps', source: `${O}/pages_mesure-temps/introduction-mesure-temps.html` },
  { numero: 7, titre: 'Les calendriers', resume: 'Chronologie, ères, réforme grégorienne et calendriers du monde, avec un convertisseur de dates.', slug: 'calendriers', source: `${O}/pages_calendriers/introduction-calendriers.html` },
  { numero: 8, titre: 'Les éphémérides', resume: 'Prédire la position des astres.', slug: 'ephemerides', source: `${O}/pages_ephemerides/introduction-ephemerides.html` },
];
