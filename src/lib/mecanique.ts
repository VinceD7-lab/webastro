/**
 * Calculs du chapitre « mécanique céleste » : satellites, vitesse de libération, points de Lagrange.
 * Unités : km, s. Fonctions pures, utilisées au build (schémas) et dans le navigateur (simulateurs).
 */
import { RAYON_TERRE } from './distances';

export { RAYON_TERRE };
/** Paramètre gravitationnel de la Terre GM (km³/s²). */
export const GM_TERRE = 398_600.4418;
/** Jour sidéral (s) : période de rotation de la Terre. */
export const JOUR_SIDERAL = 86_164.1;
/** Limite de Routh : L4 et L5 sont stables si μ est inférieur à cette valeur (≈ 1/26). */
export const MU_ROUTH = (1 - Math.sqrt(23 / 27)) / 2;

/** 3ᵉ loi de Kepler : période (s) d’une orbite de demi-grand axe a (km). */
export const periode = (a: number, gm = GM_TERRE) => 2 * Math.PI * Math.sqrt(a ** 3 / gm);
/** Demi-grand axe (km) d’une orbite de période T (s). */
export const demiGrandAxe = (T: number, gm = GM_TERRE) => Math.cbrt((gm * T * T) / (4 * Math.PI * Math.PI));
/** Vitesse sur une orbite circulaire de rayon r (km/s). */
export const vitesseCirculaire = (r: number, gm = GM_TERRE) => Math.sqrt(gm / r);
/** Vitesse de libération à la distance r du centre (km/s). */
export const vitesseLiberation = (r: number, gm = GM_TERRE) => Math.sqrt((2 * gm) / r);

export type TypeOrbite = 'retombe' | 'circulaire' | 'ellipse' | 'parabole' | 'hyperbole';

/**
 * Tir horizontal à la distance r0 du centre, à la vitesse v.
 * La trajectoire est la conique r(θ) = p / (1 + e·cos θ), θ compté depuis le point de tir.
 * e est signé : négatif si le point de tir est l’apogée (vitesse inférieure à la vitesse circulaire).
 */
export function orbiteLancement(r0: number, v: number, gm = GM_TERRE, rayon = RAYON_TERRE) {
  const p = (r0 * v) ** 2 / gm, e = p / r0 - 1, ae = Math.abs(e);
  const perigee = e >= 0 ? r0 : p / (1 - e);
  const apogee = e >= 1 ? Infinity : e >= 0 ? p / (1 - e) : r0;
  const a = ae < 1 ? (perigee + apogee) / 2 : Infinity;
  const touche = perigee < rayon;
  let type: TypeOrbite;
  if (touche) type = 'retombe';
  else if (ae < 2e-3) type = 'circulaire';
  else if (Math.abs(e - 1) < 2e-3) type = 'parabole';
  else type = e > 1 ? 'hyperbole' : 'ellipse';
  /** Distance au centre dans la direction θ (radians), Infinity si la branche n’y passe pas. */
  const r = (theta: number) => { const d = 1 + e * Math.cos(theta); return d > 1e-9 ? p / d : Infinity; };
  /** Premier angle θ > 0 où la trajectoire rencontre le sol (null si jamais). */
  let impact: number | null = null;
  if (touche) {
    let lo = 0, hi = Math.PI; // r(θ) décroît de r0 (apogée) à la surface entre 0 et π
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (r(m) > rayon) lo = m; else hi = m; }
    impact = hi;
  }
  return { p, e, ae, a, perigee, apogee, type, r, impact, periode: a < Infinity ? periode(a, gm) : Infinity };
}

/* ---------- Problème restreint des trois corps (repère tournant, unités normalisées) ---------- */

/** Pseudo-potentiel Ω(x, y) : grand corps (1 − μ) en x = −μ, petit corps (μ) en x = 1 − μ. */
export function omega(x: number, y: number, mu: number) {
  const r1 = Math.hypot(x + mu, y), r2 = Math.hypot(x - 1 + mu, y);
  return (x * x + y * y) / 2 + (1 - mu) / r1 + mu / r2;
}
const dOmegaX = (x: number, mu: number) => {
  const a = x + mu, b = x - 1 + mu;
  return x - ((1 - mu) * a) / Math.abs(a) ** 3 - (mu * b) / Math.abs(b) ** 3;
};
function bissection(f: (x: number) => number, lo: number, hi: number) {
  let flo = f(lo);
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2, fm = f(m);
    if (Math.sign(fm) === Math.sign(flo)) { lo = m; flo = fm; } else hi = m;
  }
  return (lo + hi) / 2;
}
/** Positions des cinq points de Lagrange (abscisses mesurées depuis le barycentre ; distance des deux corps = 1). */
export function lagrange(mu: number) {
  const f = (x: number) => dOmegaX(x, mu), eps = 1e-9;
  const L1: [number, number] = [bissection(f, -mu + eps, 1 - mu - eps), 0];
  const L2: [number, number] = [bissection(f, 1 - mu + eps, 3), 0];
  const L3: [number, number] = [bissection(f, -3, -mu - eps), 0];
  const L4: [number, number] = [0.5 - mu, Math.sqrt(3) / 2];
  const L5: [number, number] = [0.5 - mu, -Math.sqrt(3) / 2];
  return { L1, L2, L3, L4, L5, stable45: mu < MU_ROUTH };
}

/**
 * Lignes de niveau de f sur [x0, x1] × [y0, y1] (algorithme des carrés marchants).
 * Renvoie des segments [[xa, ya], [xb, yb]] en coordonnées du plan.
 */
export function isolignes(f: (x: number, y: number) => number, niveau: number, x0: number, x1: number, y0: number, y1: number, n = 160) {
  const dx = (x1 - x0) / n, dy = (y1 - y0) / n, v: number[][] = [];
  for (let j = 0; j <= n; j++) { v.push([]); for (let i = 0; i <= n; i++) v[j].push(Math.min(f(x0 + i * dx, y0 + j * dy), 1e6) - niveau); }
  const segs: [[number, number], [number, number]][] = [];
  const interp = (xa: number, ya: number, va: number, xb: number, yb: number, vb: number): [number, number] => {
    const t = va / (va - vb); return [xa + t * (xb - xa), ya + t * (yb - ya)];
  };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const xa = x0 + i * dx, ya = y0 + j * dy, xb = xa + dx, yb = ya + dy;
    const a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], d = v[j + 1][i];
    const pts: [number, number][] = [];
    if ((a > 0) !== (b > 0)) pts.push(interp(xa, ya, a, xb, ya, b));
    if ((b > 0) !== (c > 0)) pts.push(interp(xb, ya, b, xb, yb, c));
    if ((c > 0) !== (d > 0)) pts.push(interp(xb, yb, c, xa, yb, d));
    if ((d > 0) !== (a > 0)) pts.push(interp(xa, yb, d, xa, ya, a));
    if (pts.length === 2) segs.push([pts[0], pts[1]]);
    else if (pts.length === 4) { segs.push([pts[0], pts[1]]); segs.push([pts[2], pts[3]]); }
  }
  return segs;
}

/* ---------- Mise en forme ---------- */

const nb = (x: number, d = 0) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
/** Durée lisible : minutes, heures et minutes, ou jours. */
export function fmtDuree(s: number): string {
  if (!Number.isFinite(s)) return '—';
  if (s < 3600) return `${nb(s / 60)} min`;
  if (s < 2 * 86400) { const h = Math.floor(s / 3600), m = Math.round((s - h * 3600) / 60); return m === 60 ? `${h + 1} h` : `${h} h ${String(m).padStart(2, '0')}`; }
  return `${nb(s / 86400, s < 10 * 86400 ? 2 : 1)} jours`;
}
/** Vitesse en km/s avec deux décimales. */
export const fmtVitesse = (v: number) => `${nb(v, 2)} km/s`;
/** Distance en km arrondie. */
export const fmtKm = (km: number) => (Number.isFinite(km) ? `${nb(km)} km` : 'infinie');
