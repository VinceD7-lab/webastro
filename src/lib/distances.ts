/**
 * Mesure des distances : triangulation, parallaxe, Ératosthène, Anaxagore, Thalès.
 * Angles en degrés, longueurs dans l’unité choisie par l’appelant (sauf mention).
 */
const RAD = Math.PI / 180;

/** Unités et constantes (km). */
export const UA = 149_597_870.7;
export const ANNEE_LUMIERE = 9_460_730_472_580.8;
export const RAYON_TERRE = 6_378.137;

/**
 * Triangulation le long d’une base AB alignée avec la direction de référence :
 * angles mesurés en A puis en B (B plus proche du pied H), entre la base et la visée de l’objet C.
 * Renvoie AC, BC et la distance CH de l’objet à la droite de la base.
 */
export function triangulation(base: number, angleA: number, angleB: number) {
  if (angleB <= angleA) throw new RangeError('L’angle en B doit dépasser l’angle en A.');
  const C = angleB - angleA; // angle au sommet C
  const BC = (base * Math.sin(angleA * RAD)) / Math.sin(C * RAD);
  const AC = (base * Math.sin((180 - angleB) * RAD)) / Math.sin(C * RAD);
  return { angleC: C, AC, BC, CH: BC * Math.sin(angleB * RAD), BH: BC * Math.cos(angleB * RAD) };
}

/** Parallaxe (degrés) sous laquelle on voit la base depuis un objet à la distance donnée (base perpendiculaire). */
export const parallaxe = (base: number, distance: number) => Math.atan(base / distance) / RAD;
/** Distance d’un objet vu sous la parallaxe donnée (degrés) depuis la base. */
export const distanceParallaxe = (base: number, angle: number) => base / Math.tan(angle * RAD);

/** Ératosthène : un écart d’angle (degrés) entre deux lieux distants de `arc` donne le tour et le rayon de la Terre. */
export function eratosthene(angle: number, arc: number) {
  const tour = (arc * 360) / angle;
  return { tour, rayon: tour / (2 * Math.PI) };
}

/**
 * Anaxagore : même mesure, interprétée avec une Terre plate. Le Soleil est au zénith du second lieu,
 * vu sous `angle` du zénith au premier : distance = base / tan(angle) ; diamètre = distance × tan(diamètre apparent).
 */
export function anaxagore(angle: number, base: number, diametreApparent = 0.5) {
  const distance = base / Math.tan(angle * RAD);
  return { distance, diametre: 2 * distance * Math.tan((diametreApparent / 2) * RAD) };
}

/** Thalès : deux objets vus sous le même angle ont des tailles proportionnelles à leurs distances. */
export const thales = (taille: number, distance: number, distanceCible: number) => (taille * distanceCible) / distance;

/**
 * Méthode des éclipses (Aristarque) : si l’ombre de la Terre au niveau de la Lune vaut `ombre` diamètres lunaires,
 * la Terre en vaut ombre + 1 ; avec le diamètre apparent de la Lune (1/110 radian, environ 0,52°), on obtient la distance.
 */
export function eclipses(ombre = 2.5, diametreApparent = 1 / 110 / RAD, rayonTerre = RAYON_TERRE) {
  const terreEnLunes = ombre + 1;
  const diametreLune = (2 * rayonTerre) / terreEnLunes;
  const distance = diametreLune / (diametreApparent * RAD);
  return { terreEnLunes, diametreLune, distance, enRayonsTerrestres: distance / rayonTerre, enDiametresLunaires: distance / diametreLune };
}

/** Formatage d’un angle très variable : degrés, minutes ou secondes d’arc selon sa taille. */
export function fmtAngle(deg: number): string {
  const nb = (x: number, d: number) => x.toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  if (deg >= 1) return `${nb(deg, 2)}°`;
  if (deg * 60 >= 1) return `${nb(deg * 60, 2)}′`;
  const s = deg * 3600;
  return `${nb(s, Math.min(8, Math.max(3, 2 - Math.floor(Math.log10(s)))))}″`;
}

/** Formatage d’une longueur en km, avec l’unité la plus parlante. */
export function fmtDistance(km: number): string {
  const nb = (x: number, d: number) => x.toLocaleString('fr-FR', { maximumFractionDigits: d });
  if (km < 1) return `${nb(km * 1000, 0)} m`;
  if (km < 1e7) return `${nb(km, km < 100 ? 1 : 0)} km`;
  if (km < 0.1 * ANNEE_LUMIERE) return `${nb(km / UA, 3)} ua`;
  return `${nb(km / ANNEE_LUMIERE, 3)} année(s)-lumière`;
}
