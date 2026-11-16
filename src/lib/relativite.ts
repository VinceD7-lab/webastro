/**
 * Calculs du chapitre « gravitation et relativité » : facteur de Lorentz, composition des vitesses,
 * avance relativiste du périhélie, équation de lentille gravitationnelle.
 * Utilisé à la construction (figures) et dans le navigateur (simulateurs).
 */

/** Vitesse de la lumière dans le vide (km/s, valeur exacte). */
export const C_KM_S = 299_792.458;
/** Constante de la gravitation, CODATA 2018 (m³ kg⁻¹ s⁻²). */
export const G_SI = 6.674_30e-11;
/** Paramètre gravitationnel du Soleil GM☉ (km³/s²). */
export const GM_SOLEIL = 1.327_124_400_18e11;
/** Secondes d’arc par radian. */
export const ARCSEC = (180 / Math.PI) * 3600;

/** Facteur de Lorentz γ = 1/√(1 − β²), avec β = v/c. */
export const gamma = (beta: number) => 1 / Math.sqrt(1 - beta * beta);
/** β à partir de γ − 1 (évite la perte de précision aux faibles vitesses). */
export const betaDepuisGammaMoins1 = (g1: number) => Math.sqrt(g1 * (g1 + 2)) / (1 + g1);
/** Composition relativiste de deux vitesses colinéaires (en unités de c). */
export const compositionEinstein = (u: number, v: number) => (u + v) / (1 + u * v);

/** Mercure : demi-grand axe (km), excentricité, période sidérale (jours). */
export const MERCURE = { a: 57_909_050, e: 0.205_63, periode: 87.969 };
/** Avance du périhélie de Mercure par siècle (″) : observée (repère héliocentrique), due aux planètes, excès relativiste. */
export const AVANCE_MERCURE = { observee: 574.1, planetes: 531.6, relativite: 43.0 };

/** Avance relativiste du périhélie par révolution (radians) : Δφ = 6πGM / (a(1 − e²)c²). */
export const avanceRelativiste = (a: number, e: number, gm = GM_SOLEIL) => (6 * Math.PI * gm) / (a * (1 - e * e) * C_KM_S * C_KM_S);
/** Nombre de révolutions par siècle julien pour une période donnée en jours. */
export const revolutionsParSiecle = (periodeJours: number) => 36_525 / periodeJours;

/** Déviation d’un rayon lumineux passant à la distance b (km) d’une masse : α = 4GM / (b c²), en radians. */
export const deviationLumiere = (b: number, gm = GM_SOLEIL) => (4 * gm) / (b * C_KM_S * C_KM_S);

/**
 * Lentille ponctuelle, angles en unités du rayon d’Einstein θ_E.
 * Une source à la position β (vecteur) donne deux images, alignées avec la lentille :
 * θ± = β (1 ± √(1 + 4/β²)) / 2, l’image « − » étant de l’autre côté de la lentille.
 */
export function imagesLentille(bx: number, by: number): [[number, number], [number, number]] {
  const b = Math.hypot(bx, by);
  if (b < 1e-9) return [[1, 0], [-1, 0]];
  const kp = (1 + Math.sqrt(1 + 4 / (b * b))) / 2, km = (1 - Math.sqrt(1 + 4 / (b * b))) / 2;
  return [[bx * kp, by * kp], [bx * km, by * km]];
}
/** Amplification totale d’une source ponctuelle à la distance u (en θ_E) de la lentille. */
export const amplification = (u: number) => (u * u + 2) / (u * Math.sqrt(u * u + 4));

/**
 * Nombre à la française avec d décimales. L’espace fine insécable (U+202F) des milliers est remplacée par
 * une espace insécable ordinaire : la police Literata ne l’affiche pas (« 20000 » au lieu de « 20 000 »).
 */
export const nbFr = (x: number, d = 0) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, ' ');
/** Nombre en notation scientifique française : 7,69 × 10⁵. */
export function fmtSci(x: number, d = 2): string {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 5) return nbFr(x, Math.max(0, d - e));
  const sup = String(e).replace(/-/g, '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);
  return `${nbFr(x / 10 ** e, d)} × 10${sup}`;
}
