/**
 * Petits dessins réutilisables (SVG en chaîne) pour les schémas : observateur, arbre, Lune, Terre, Soleil.
 * Couleurs par variables CSS, pour suivre les thèmes clair et sombre.
 */
import { chemin, type P2 } from './projection';

const f = (x: number) => (Math.round(x * 10) / 10).toString();

/**
 * Observateur stylisé, debout en `pied`, regardant dans la direction `regard` (degrés, 0 = droite, 90 = haut).
 * `h` : hauteur totale en pixels. Renvoie aussi la position de l’œil, origine des visées.
 */
export function observateur(pied: P2, regard = 30, h = 60): { svg: string; oeil: P2 } {
  const [x, y] = pied, k = h / 60, sens = Math.cos((regard * Math.PI) / 180) >= 0 ? 1 : -1;
  const tete: P2 = [x + 2 * k * sens, y - 52 * k], oeil: P2 = [tete[0] + 3.5 * k * sens, tete[1] - 0.5 * k];
  const epaule: P2 = [x + 1 * k * sens, y - 42 * k], hanche: P2 = [x, y - 24 * k];
  const r = (regard * Math.PI) / 180, main: P2 = [epaule[0] + 13 * k * Math.cos(r), epaule[1] - 13 * k * Math.sin(r)];
  const trait = `fill="none" stroke="var(--ink)" stroke-width="${f(3.2 * k)}" stroke-linecap="round" stroke-linejoin="round"`;
  const svg = `<g>`
    + `<path d="${chemin([[x - 7 * k, y], hanche, [x + 7 * k, y]])}" ${trait}/>`
    + `<path d="${chemin([hanche, epaule])}" ${trait}/>`
    + `<path d="${chemin([epaule, [epaule[0] + 6 * k * Math.cos(r) - 2 * k * sens, epaule[1] - 6 * k * Math.sin(r) + 5 * k], main])}" ${trait}/>`
    + `<circle cx="${f(tete[0])}" cy="${f(tete[1])}" r="${f(6.5 * k)}" fill="var(--surface)" stroke="var(--ink)" stroke-width="${f(2 * k)}"/>`
    + `</g>`;
  return { svg, oeil };
}

/** Arbre stylisé posé en `pied`. */
export function arbre(pied: P2, h = 110): string {
  const [x, y] = pied;
  return `<rect x="${f(x - 3)}" y="${f(y - h * 0.3)}" width="6" height="${f(h * 0.3)}" fill="var(--brass)"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y - h * 0.62)}" rx="${f(h * 0.14)}" ry="${f(h * 0.38)}" fill="var(--ok)" fill-opacity=".85"/>`;
}

/** Croissant de Lune de rayon r centré en c. */
export function croissant(c: P2, r = 18): string {
  const [x, y] = c;
  return `<path d="M${f(x)},${f(y - r)} A${f(r)},${f(r)} 0 1 1 ${f(x)},${f(y + r)} A${f(r * 0.72)},${f(r)} 0 1 0 ${f(x)},${f(y - r)} Z" fill="var(--sun)" fill-opacity=".55" stroke="var(--ink)" stroke-width="1"/>`;
}

/** Disque plein (Lune, Soleil…) avec contour. */
export const disque = (c: P2, r: number, remplir: string, opacite = 1) =>
  `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${remplir}" fill-opacity="${opacite}" stroke="var(--ink)" stroke-width="1"/>`;

/** Terre vue de loin : disque et quelques parallèles stylisés. */
export function terre(c: P2, r: number): string {
  const [x, y] = c;
  let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="var(--orbit)" fill-opacity=".28" stroke="var(--ink)" stroke-width="1.4"/>`;
  for (const k of [-0.5, 0, 0.5]) s += `<ellipse cx="${f(x)}" cy="${f(y + k * r)}" rx="${f(r * Math.sqrt(1 - k * k))}" ry="${f(r * 0.12)}" fill="none" stroke="var(--orbit)" stroke-width=".8" opacity=".7"/>`;
  return s;
}

/** Arc d’angle de centre c, de rayon r, entre deux directions (degrés, sens trigonométrique, y vers le haut). */
export function arcAngle(c: P2, a0: number, a1: number, r: number, couleur = 'var(--ink)', epaisseur = 1.2): string {
  const pts: P2[] = [];
  for (let i = 0; i <= 30; i++) { const a = ((a0 + ((a1 - a0) * i) / 30) * Math.PI) / 180; pts.push([c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)]); }
  return `<path d="${chemin(pts)}" fill="none" stroke="${couleur}" stroke-width="${epaisseur}"/>`;
}
/** Direction (degrés, y vers le haut) de a vers b. */
export const direction = (a: P2, b: P2) => (Math.atan2(a[1] - b[1], b[0] - a[0]) * 180) / Math.PI;
