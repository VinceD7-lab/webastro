/**
 * Calculs du chapitre « éphémérides » : satellites galiléens (théorie simplifiée de Meeus), Lune simplifiée
 * (pour l’exercice d’interpolation), approximation de Tchebychev, lever et coucher d’un astre.
 */
import { RAD, mod360, eclVersEq, tempsSideralGreenwich, soleil, SIDERAL } from './reperes';

const sin = (d: number) => Math.sin(d * RAD), cos = (d: number) => Math.cos(d * RAD);

/* ---------- Satellites galiléens de Jupiter ---------- */
export interface Satellite { nom: string; X: number; Y: number; devant: boolean; cache: boolean }
export const NOMS_GALILEENS = ['Io', 'Europe', 'Ganymède', 'Callisto'];
/**
 * Positions apparentes des quatre satellites galiléens vues de la Terre, en rayons équatoriaux de Jupiter
 * (J. Meeus, Astronomical Algorithms, ch. 44, méthode de faible précision : quelques centièmes de rayon).
 * X > 0 vers l’ouest, Y > 0 vers le nord. Un satellite est « devant » Jupiter quand cos u > 0.
 */
export function galileens(jd: number): Satellite[] {
  const d = jd - 2_451_545;
  const V = 172.74 + 0.00111588 * d, M = 357.529 + 0.9856003 * d;
  const N = 20.02 + 0.0830853 * d + 0.329 * sin(V), J = 66.115 + 0.9025179 * d - 0.329 * sin(V);
  const A = 1.915 * sin(M) + 0.02 * sin(2 * M), B = 5.555 * sin(N) + 0.168 * sin(2 * N);
  const K = J + A - B;
  const R = 1.00014 - 0.01671 * cos(M) - 0.00014 * cos(2 * M), r = 5.20872 - 0.25208 * cos(N) - 0.00611 * cos(2 * N);
  const D = Math.sqrt(r * r + R * R - 2 * r * R * cos(K));
  const psi = Math.asin((R / D) * sin(K)) / RAD;
  const lam = 34.35 + 0.083091 * d + 0.329 * sin(V) + B;
  const DS = 3.12 * sin(lam + 42.8);
  const DE = DS - 2.22 * sin(psi) * cos(lam + 22) - 1.3 * ((r - D) / D) * sin(lam - 100.5);
  const t = d - D / 173; // temps de lumière
  let u1 = 163.8069 + 203.4058646 * t + psi - B, u2 = 358.414 + 101.2916335 * t + psi - B;
  let u3 = 5.7176 + 50.234518 * t + psi - B, u4 = 224.8092 + 21.48798 * t + psi - B;
  const G = 331.18 + 50.310482 * t, H = 87.45 + 21.569231 * t;
  const c1 = 0.473 * sin(2 * (u1 - u2)), c2 = 1.065 * sin(2 * (u2 - u3)), c3 = 0.165 * sin(G), c4 = 0.843 * sin(H);
  const r1 = 5.9057 - 0.0244 * cos(2 * (u1 - u2)), r2 = 9.3966 - 0.0882 * cos(2 * (u2 - u3));
  const r3 = 14.9883 - 0.0216 * cos(G), r4 = 26.3627 - 0.1939 * cos(H);
  u1 += c1; u2 += c2; u3 += c3; u4 += c4;
  return ([[u1, r1], [u2, r2], [u3, r3], [u4, r4]] as const).map(([u, rr], i) => {
    const X = rr * sin(u), Y = -rr * cos(u) * sin(DE), devant = cos(u) > 0;
    return { nom: NOMS_GALILEENS[i], X, Y, devant, cache: !devant && Math.abs(X) < 1 };
  });
}

/* ---------- Lune simplifiée (Astronomical Almanac, précision ≈ 0,3°) ---------- */
/** Ascension droite et déclinaison géocentriques approchées de la Lune (degrés). */
export function luneSimplifiee(jd: number) {
  const T = (jd - 2_451_545) / 36_525;
  const lambda = 218.32 + 481267.881 * T + 6.29 * sin(135 + 477198.87 * T) - 1.27 * sin(259.3 - 413335.36 * T)
    + 0.66 * sin(235.7 + 890534.22 * T) + 0.21 * sin(269.9 + 954397.74 * T) - 0.19 * sin(357.5 + 35999.05 * T) - 0.11 * sin(186.5 + 966404.03 * T);
  const beta = 5.13 * sin(93.3 + 483202.02 * T) + 0.28 * sin(228.2 + 960400.89 * T) - 0.28 * sin(318.3 + 6003.15 * T) - 0.17 * sin(217.6 - 407332.21 * T);
  return eclVersEq(mod360(lambda), beta, 23.439 - 0.013 * T);
}

/* ---------- Interpolation ---------- */
/** Interpolation linéaire et formule de Bessel entre f1 et f2 (f0, f3 : valeurs voisines), n ∈ [0, 1]. */
export function interpoler(f0: number, f1: number, f2: number, f3: number, n: number) {
  const d1 = f2 - f1, d20 = f2 - 2 * f1 + f0, d21 = f3 - 2 * f2 + f1;
  return { lineaire: f1 + n * d1, bessel: f1 + n * d1 - 0.25 * n * (1 - n) * (d20 + d21) };
}

/* ---------- Tchebychev ---------- */
/** Coefficients de Tchebychev a0…a(m−1) de f sur [−1, 1] (m nœuds de Tchebychev). a0 est déjà divisé par 2. */
export function coefficientsTchebychev(f: (x: number) => number, m = 32): number[] {
  const fx = Array.from({ length: m }, (_, j) => f(Math.cos((Math.PI * (j + 0.5)) / m)));
  return Array.from({ length: m }, (_, k) => {
    let s = 0;
    for (let j = 0; j < m; j++) s += fx[j] * Math.cos((Math.PI * k * (j + 0.5)) / m);
    return ((k === 0 ? 1 : 2) / m) * s;
  });
}
/** Valeur de Σ aₖ Tₖ(x), k = 0…n, par la récurrence Tₖ₊₁ = 2x Tₖ − Tₖ₋₁. */
export function sommeTchebychev(a: number[], x: number, n = a.length - 1): number {
  let t0 = 1, t1 = x, s = a[0] + (n >= 1 ? a[1] * x : 0);
  for (let k = 2; k <= n; k++) { const t2 = 2 * x * t1 - t0; s += a[k] * t2; t0 = t1; t1 = t2; }
  return s;
}
/** Polynôme d’interpolation de Lagrange passant par n+1 points équidistants de [−1, 1], évalué en x. */
export function lagrangeEquidistant(f: (x: number) => number, n: number, x: number): number {
  if (n === 0) return f(0);
  const xs = Array.from({ length: n + 1 }, (_, i) => -1 + (2 * i) / n), ys = xs.map(f);
  let s = 0;
  for (let i = 0; i <= n; i++) {
    let p = ys[i];
    for (let j = 0; j <= n; j++) if (j !== i) p *= (x - xs[j]) / (xs[i] - xs[j]);
    s += p;
  }
  return s;
}
/** Rayon vecteur héliocentrique de Mars (ua) par un mouvement képlérien moyen (éléments J2000, précision ≈ 0,002 ua). */
export function rayonMars(jd: number): number {
  const d = jd - 2_451_545, a = 1.523679, e = 0.0934;
  const M = mod360(19.373 + 0.5240207766 * d) * RAD;
  let E = M;
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return a * (1 - e * Math.cos(E));
}

/* ---------- Lever et coucher ---------- */
/** Rayon équatorial terrestre adopté par la source (m). */
export const RAYON_TERRE_M = 6_378_140;
export interface TermesH0 { refraction: number; demiDiametre: number; parallaxe: number; altitude: number; reliefD: number; reliefL: number }
/** h₀ = P − R − d/2 − η₁ + η₂ (degrés). Réfraction, demi-diamètre et parallaxe en minutes d’arc ; altitude et D en mètres, l en mètres. */
export function h0(t: TermesH0) {
  const eta1 = t.altitude > 0 ? Math.acos(RAYON_TERRE_M / (RAYON_TERRE_M + t.altitude)) / RAD : 0;
  const eta2 = t.reliefD > 0 && t.reliefL > 0 ? Math.atan(t.reliefD / t.reliefL) / RAD : 0;
  return { h0: (t.parallaxe - t.refraction - t.demiDiametre) / 60 - eta1 + eta2, eta1, eta2 };
}
export interface Evenement { etat: 'ok' | 'circumpolaire' | 'invisible'; H: number; cosH: number; T: number; ut: number }
/**
 * Instant (UT, en heures) du lever ou du coucher d’un astre de coordonnées α, δ (degrés) au jour jd0 (0 h UT),
 * pour un lieu de latitude φ et de longitude L (degrés, positive vers l’est). Méthode de la source :
 * cos H = (sin h₀ − sin φ sin δ) / (cos φ cos δ) ; T = α ∓ H ; intervalle sidéral converti en temps moyen.
 */
export function leverCoucher(jd0: number, alpha: number, delta: number, phi: number, L: number, hz: number, lever: boolean): Evenement {
  const cosH = (sin(hz) - sin(phi) * sin(delta)) / (cos(phi) * cos(delta));
  if (cosH < -1) return { etat: 'circumpolaire', H: 180, cosH, T: 0, ut: NaN };
  if (cosH > 1) return { etat: 'invisible', H: 0, cosH, T: 0, ut: NaN };
  const H = Math.acos(cosH) / RAD, T = mod360(lever ? alpha - H : alpha + H);
  const Tt = mod360(T - L - tempsSideralGreenwich(jd0)); // intervalle sidéral depuis 0 h UT
  return { etat: 'ok', H, cosH, T, ut: Tt / 15 / SIDERAL };
}
/** Même calcul pour le Soleil, avec deux itérations sur sa position (α, δ recalculés à l’instant trouvé). */
export function leverCoucherSoleil(jd0: number, phi: number, L: number, hz: number, lever: boolean): Evenement & { alpha: number; delta: number } {
  let s = soleil(jd0 + 0.5), ev = leverCoucher(jd0, s.alpha, s.delta, phi, L, hz, lever);
  for (let i = 0; i < 3 && ev.etat === 'ok'; i++) { s = soleil(jd0 + ev.ut / 24); ev = leverCoucher(jd0, s.alpha, s.delta, phi, L, hz, lever); }
  return { ...ev, alpha: s.alpha, delta: s.delta };
}
