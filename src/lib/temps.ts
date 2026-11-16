/**
 * Calculs du chapitre « mesure du temps » : équation du temps (et ses deux composantes), jour sidéral,
 * secondes intercalaires. S’appuie sur la position approchée du Soleil de lib/reperes.ts.
 */
import { eclVersEq, mod180, mod360, RAD, jourJulien } from './reperes';

const sin = (d: number) => Math.sin(d * RAD);

/** Durée du jour solaire moyen (s). */
export const JOUR_SOLAIRE = 86_400;
/** Nombre de jours solaires moyens dans l’année sidérale. */
export const ANNEE_SIDERALE_J = 365.256_36;
/** Jour sidéral (retour d’une étoile au méridien), en secondes : N/(N+1) jour, N étant la durée de l’année en jours. */
export const jourSideral = (anneeJours = ANNEE_SIDERALE_J) => (JOUR_SOLAIRE * anneeJours) / (anneeJours + 1);

export interface EquationTemps {
  /** Équation du temps, en minutes : temps solaire vrai − temps solaire moyen. */
  total: number;
  /** Part due à l’excentricité de l’orbite (équation du centre), en minutes. */
  centre: number;
  /** Part due à l’obliquité de l’écliptique (réduction à l’équateur), en minutes. */
  reduction: number;
  /** Déclinaison du Soleil (degrés). */
  declinaison: number;
}
/**
 * Équation du temps à la date julienne jd. Les options permettent de « supprimer » l’excentricité
 * (orbite circulaire) ou l’obliquité (écliptique dans le plan de l’équateur) pour isoler chaque effet.
 * Formules de l’Astronomical Almanac (précision ≈ 20 s).
 */
export function equationDuTemps(jd: number, opt: { excentricite?: boolean; obliquite?: boolean } = {}): EquationTemps {
  const { excentricite = true, obliquite = true } = opt;
  const n = jd - 2_451_545;
  const L = mod360(280.46 + 0.9856474 * n), g = mod360(357.528 + 0.9856003 * n);
  const C = excentricite ? 1.915 * sin(g) + 0.02 * sin(2 * g) : 0;
  const lambda = mod360(L + C);
  const eps = obliquite ? 23.439 - 0.0000004 * n : 0;
  const { alpha, delta } = eclVersEq(lambda, 0, eps);
  return { total: 4 * mod180(L - alpha), centre: -4 * C, reduction: 4 * mod180(lambda - alpha), declinaison: delta };
}
/** Date julienne de midi (UT) du jour numéro `j` (1 = 1er janvier) d’une année donnée. */
export const jdDuJour = (annee: number, j: number) => jourJulien(new Date(Date.UTC(annee, 0, j, 12)));

/** TAI − UTC (secondes entières) : table de la source (secondes intercalaires depuis 1983). Date de début, valeur. */
export const TAI_MOINS_UTC: [string, number][] = [
  ['1983-07-01', 22], ['1985-07-01', 23], ['1988-01-01', 24], ['1990-01-01', 25], ['1991-01-01', 26],
  ['1992-07-01', 27], ['1993-07-01', 28], ['1994-07-01', 29], ['1996-01-01', 30], ['1997-07-01', 31],
  ['1999-01-01', 32], ['2006-01-01', 33], ['2009-01-01', 34], ['2012-07-01', 35], ['2015-07-01', 36], ['2017-01-01', 37],
];
/** Décalage entre TT et TAI (s) : TT = TAI + 32,184 s. */
export const TT_MOINS_TAI = 32.184;
/** TAI − UTC à une date « AAAA-MM-JJ », ou null avant le début du tableau. */
export function taiMoinsUtc(date: string): number | null {
  let v: number | null = null;
  for (const [d, s] of TAI_MOINS_UTC) if (date >= d) v = s;
  return v;
}
