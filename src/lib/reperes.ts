/**
 * Repères astronomiques : unités angulaires, coordonnées polaires, changements de repère
 * (écliptique ↔ équatorial ↔ horizontal), temps sidéral et position approchée du Soleil.
 * Conventions du cours : azimut compté depuis le sud, positivement vers l’ouest ;
 * angle horaire compté vers l’ouest ; longitude terrestre positive vers l’est.
 * Tous les angles sont en degrés sauf mention contraire.
 */
export const RAD = Math.PI / 180;
const sin = (x: number) => Math.sin(x * RAD);
const cos = (x: number) => Math.cos(x * RAD);
const asin = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) / RAD;
const atan2 = (y: number, x: number) => Math.atan2(y, x) / RAD;

/** Ramène un angle dans [0, 360[. */
export const mod360 = (x: number) => ((x % 360) + 360) % 360;
/** Ramène un angle dans ]−180, 180]. */
export const mod180 = (x: number) => { const y = mod360(x); return y > 180 ? y - 360 : y; };

/* ---------- Unités angulaires : π rd = 180° = 12 h = 200 gr ---------- */
export const degVersRad = (d: number) => d * RAD;
export const radVersDeg = (r: number) => r / RAD;
export const degVersHeures = (d: number) => d / 15;
export const heuresVersDeg = (h: number) => h * 15;
export const degVersGrades = (d: number) => d * 200 / 180;
export const gradesVersDeg = (g: number) => g * 180 / 200;

/** Valeur sexagésimale (degrés ou heures) → [signe, unités, minutes, secondes]. */
export function sexagesimal(x: number, decimales = 0): [number, number, number, number] {
  const s = x < 0 ? -1 : 1, f = 10 ** decimales;
  let t = Math.round(Math.abs(x) * 3600 * f) / f;
  const u = Math.floor(t / 3600); t -= u * 3600;
  const m = Math.floor(t / 60);
  return [s, u, m, +(t - m * 60).toFixed(decimales)];
}
/** Valeur sexagésimale → nombre décimal. */
export const decimal = (u: number, m = 0, s = 0, signe = 1) => signe * (Math.abs(u) + m / 60 + s / 3600);

const nb = (x: number, d: number) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const deux = (x: number) => String(x).padStart(2, '0');
const sec = (s: number, d: number) => (d ? nb(s, d).padStart(3 + d, '0') : deux(s));

/** 23,4392 → « 23° 26′ 21″ » */
export function fmtDMS(deg: number, decimales = 0, signe = false): string {
  const [s, u, m, x] = sexagesimal(deg, decimales);
  return `${s < 0 ? '−' : signe ? '+' : ''}${u}° ${deux(m)}′ ${sec(x, decimales)}″`;
}
/** 6,75 → « 6 h 45 min 00 s » */
export function fmtHMS(h: number, decimales = 0): string {
  const [s, u, m, x] = sexagesimal(h, decimales);
  return `${s < 0 ? '−' : ''}${u} h ${deux(m)} min ${sec(x, decimales)} s`;
}
/** Grades centésimaux : 63,662 → « 63 gr 66′ 20″ » (minutes et secondes centésimales). */
export function fmtGrades(g: number, decimales = 0): string {
  const f = 10 ** decimales, t = Math.round(Math.abs(g) * 10000 * f) / f;
  const u = Math.floor(t / 10000), m = Math.floor((t - u * 10000) / 100), x = +(t - u * 10000 - m * 100).toFixed(decimales);
  return `${g < 0 ? '−' : ''}${u} gr ${deux(m)}′ ${sec(x, decimales)}″`;
}

/* ---------- Coordonnées polaires ---------- */
/** Plan : (x, y) → (r, θ), θ dans [0, 360[. */
export const polairePlan = (x: number, y: number) => ({ r: Math.hypot(x, y), theta: mod360(atan2(y, x)) });
export const cartesienPlan = (r: number, theta: number) => ({ x: r * cos(theta), y: r * sin(theta) });
/** Espace : (x, y, z) → (r, θ, φ) ; θ angle dans le plan Oxy depuis Ox, φ hauteur au-dessus du plan. */
export function polaireEspace(x: number, y: number, z: number) {
  const r = Math.hypot(x, y, z);
  return { r, theta: mod360(atan2(y, x)), phi: asin(z / r) };
}
export const cartesienEspace = (r: number, theta: number, phi: number) =>
  ({ x: r * cos(phi) * cos(theta), y: r * cos(phi) * sin(theta), z: r * sin(phi) });

/* ---------- Écliptique ↔ équatorial (systèmes (1) et (2) du cours) ---------- */
/** (λ, β) → (α, δ), α en degrés dans [0, 360[. */
export function eclVersEq(lambda: number, beta: number, eps: number) {
  const cdca = cos(beta) * cos(lambda);
  const sd = sin(beta) * cos(eps) + cos(beta) * sin(eps) * sin(lambda);
  const cdsa = -sin(beta) * sin(eps) + cos(beta) * cos(eps) * sin(lambda);
  return { alpha: mod360(atan2(cdsa, cdca)), delta: asin(sd) };
}
/** (α, δ) → (λ, β), α en degrés. */
export function eqVersEcl(alpha: number, delta: number, eps: number) {
  const cbcl = cos(alpha) * cos(delta);
  const sb = sin(delta) * cos(eps) - cos(delta) * sin(eps) * sin(alpha);
  const cbsl = sin(delta) * sin(eps) + cos(delta) * cos(eps) * sin(alpha);
  return { lambda: mod360(atan2(cbsl, cbcl)), beta: asin(sb) };
}

/* ---------- Équatorial horaire ↔ horizontal (formulaire du repère local) ---------- */
/** (H, δ, φ) → azimut a (depuis le sud, vers l’ouest) et hauteur h. */
export function eqVersHoriz(H: number, delta: number, phi: number) {
  const cz = sin(phi) * sin(delta) + cos(phi) * cos(delta) * cos(H);
  const szsa = cos(delta) * sin(H);
  const szca = -cos(phi) * sin(delta) + sin(phi) * cos(delta) * cos(H);
  return { a: mod360(atan2(szsa, szca)), h: 90 - Math.acos(Math.max(-1, Math.min(1, cz))) / RAD };
}
/** (a, h, φ) → angle horaire H dans [0, 360[ et déclinaison δ. */
export function horizVersEq(a: number, h: number, phi: number) {
  const z = 90 - h;
  const sd = sin(phi) * cos(z) - cos(phi) * sin(z) * cos(a);
  const cdsh = sin(z) * sin(a);
  const cdch = cos(phi) * cos(z) + sin(phi) * sin(z) * cos(a);
  return { H: mod360(atan2(cdsh, cdch)), delta: asin(sd) };
}

/* ---------- Passages au méridien (équations (1) à (4)) ---------- */
/** Hauteur et azimut au passage au méridien supérieur (H = 0) ou inférieur (H = 12 h). */
export function passageMeridien(phi: number, delta: number, superieur = true) {
  if (superieur) {
    const h1 = 90 - phi + delta, h2 = 90 + phi - delta;
    return h1 <= 90 ? { a: 0, h: h1 } : { a: 180, h: h2 };
  }
  const h3 = -90 - phi - delta, h4 = -90 + phi + delta;
  return h3 >= -90 ? { a: 0, h: h3 } : { a: 180, h: h4 };
}
/** Classement d’un astre pour un lieu : circumpolaire, jamais levé ou se lève et se couche. */
export function visibilite(phi: number, delta: number): 'circumpolaire' | 'invisible' | 'lever-coucher' {
  if (passageMeridien(phi, delta, false).h >= 0) return 'circumpolaire';
  if (passageMeridien(phi, delta, true).h <= 0) return 'invisible';
  return 'lever-coucher';
}
/** Vrai si l’astre présente une plus grande digression (il passe au méridien supérieur entre le zénith et le pôle). */
export const aDigression = (phi: number, delta: number) => (phi >= 0 ? delta > phi : delta < phi);

/* ---------- Coordonnées géocentriques d’un lieu ---------- */
/** φ latitude géographique, altitude en mètres, ellipsoïde (a en mètres, aplatissement f). */
export function geocentrique(phi: number, altitude: number, a = 6378137, f = 1 / 298.257222101) {
  const u = Math.atan((1 - f) * Math.tan(phi * RAD)) / RAD;
  const rhoCos = cos(u) + (altitude / a) * cos(phi);
  const rhoSin = (1 - f) * sin(u) + (altitude / a) * sin(phi);
  return { u, rhoCos, rhoSin, rho: Math.hypot(rhoCos, rhoSin), phiPrime: atan2(rhoSin, rhoCos) };
}

/* ---------- Temps ---------- */
/** Date julienne d’un instant (objet Date, interprété en TU). */
export const jourJulien = (d: Date) => d.getTime() / 86400000 + 2440587.5;
/** Rapport entre durée sidérale et durée solaire moyenne : ΔT = 1,0027379 Δt. */
export const SIDERAL = 1.00273790935;
/** Temps sidéral moyen de Greenwich, en degrés (expression de l’UAI 1982). */
export function tempsSideralGreenwich(jd: number): number {
  const d = jd - 2451545, T = d / 36525;
  return mod360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000);
}
/** Temps sidéral local, en degrés ; longitude positive vers l’est : T_L = T_G + L. */
export const tempsSideralLocal = (jd: number, longitude: number) => mod360(tempsSideralGreenwich(jd) + longitude);
/** Angle horaire H = T_L − α (tous en degrés). */
export const angleHoraire = (tsl: number, alpha: number) => mod360(tsl - alpha);

/* ---------- Soleil ---------- */
/** Obliquité moyenne de l’écliptique, en degrés. */
export const obliquite = (jd: number) => { const T = (jd - 2451545) / 36525; return 23.43929111 - 0.0130041667 * T - 1.639e-7 * T * T + 5.036e-7 * T * T * T; };
/**
 * Position approchée du Soleil (formules de l’Astronomical Almanac, précision ≈ 0,01°).
 * Latitude écliptique supposée nulle, comme dans la simulation d’origine.
 */
export function soleil(jd: number) {
  const n = jd - 2451545;
  const L = mod360(280.460 + 0.9856474 * n), g = mod360(357.528 + 0.9856003 * n);
  const lambda = mod360(L + 1.915 * sin(g) + 0.020 * sin(2 * g));
  const eps = 23.439 - 0.0000004 * n;
  return { lambda, eps, ...eclVersEq(lambda, 0, eps) };
}
