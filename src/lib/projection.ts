/**
 * Dessin de sphères en perspective (projection orthographique) pour les figures SVG.
 * Utilisé à la construction par les schémas du chapitre « repères » et dans le navigateur
 * par les simulateurs. Repère du monde : X vers l’observateur quand az = el = 0, Y à droite, Z en haut.
 * Les arcs situés à l’arrière de la sphère sont tracés en tirets.
 */
export type V3 = [number, number, number];
export type P2 = [number, number];
const RAD = Math.PI / 180;

export const sph = (lon: number, lat: number, r = 1): V3 => {
  const l = lon * RAD, b = lat * RAD;
  return [r * Math.cos(b) * Math.cos(l), r * Math.cos(b) * Math.sin(l), r * Math.sin(b)];
};
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const unit = (a: V3): V3 => mul(a, 1 / Math.hypot(...a));
/** Combinaison linéaire Σ kᵢ·vᵢ. */
export const comb = (...t: [number, V3][]): V3 => t.reduce<V3>((s, [k, v]) => add(s, mul(v, k)), [0, 0, 0]);
/** Rotation d’angle a (degrés) autour de l’axe X, Y ou Z (sens direct). */
export const rotX = (v: V3, a: number): V3 => { const c = Math.cos(a * RAD), s = Math.sin(a * RAD); return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]]; };
export const rotY = (v: V3, a: number): V3 => { const c = Math.cos(a * RAD), s = Math.sin(a * RAD); return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]; };
export const rotZ = (v: V3, a: number): V3 => { const c = Math.cos(a * RAD), s = Math.sin(a * RAD); return [c * v[0] - s * v[1], s * v[0] + c * v[1], v[2]]; };
/** Interpolation sphérique entre deux directions (t de 0 à 1), éventuellement par le grand arc. */
export function slerp(a: V3, b: V3, t: number, long = false): V3 {
  const ua = unit(a), ub = unit(b);
  let om = Math.acos(Math.max(-1, Math.min(1, dot(ua, ub))));
  if (om < 1e-9) return ua;
  let perp = unit(add(ub, mul(ua, -Math.cos(om))));
  if (long) { om = 2 * Math.PI - om; perp = mul(perp, -1); }
  return add(mul(ua, Math.cos(om * t)), mul(perp, Math.sin(om * t)));
}

export interface Trait {
  couleur?: string; epaisseur?: number; tirets?: string;
  fleche?: 'fin' | 'debut' | 'deux';
  /** Partie cachée par la sphère : en tirets (défaut), masquée ou pleine. */
  arriere?: 'tirets' | 'masque' | 'plein';
  remplir?: string; opacite?: number;
}
export interface Etiquette { dx?: number; dy?: number; ancre?: 'start' | 'middle' | 'end'; taille?: number; couleur?: string; italique?: boolean; gras?: boolean; rotation?: number;
  /** Texte déjà balisé (indices <tspan>…) : pas d’échappement. */
  brut?: boolean }

const f = (x: number) => (Math.round(x * 10) / 10).toString();
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const chemin = (pts: P2[], ferme = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])},${f(p[1])}`).join(' ') + (ferme ? ' Z' : '');

/** Pointe de flèche pleine en `b`, orientée de `a` vers `b`. */
export function pointe(a: P2, b: P2, couleur: string, taille = 10): string {
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, l = taille * 0.42;
  const base: P2 = [b[0] - ux * taille, b[1] - uy * taille];
  return `<path d="${chemin([b, [base[0] - uy * l, base[1] + ux * l], [base[0] + uy * l, base[1] - ux * l]], true)}" fill="${couleur}"/>`;
}
/** Segment 2D, avec flèche éventuelle. */
export function trait2D(a: P2, b: P2, t: Trait = {}): string {
  const c = t.couleur ?? 'var(--ink)', w = t.epaisseur ?? 1.4;
  let s = `<path d="${chemin([a, b])}" fill="none" stroke="${c}" stroke-width="${w}"${t.tirets ? ` stroke-dasharray="${t.tirets}"` : ''}/>`;
  if (t.fleche === 'fin' || t.fleche === 'deux') s += pointe(a, b, c);
  if (t.fleche === 'debut' || t.fleche === 'deux') s += pointe(b, a, c);
  return s;
}
/** Texte 2D. */
export function texte2D(p: P2, s: string, e: Etiquette = {}): string {
  const x = p[0] + (e.dx ?? 0), y = p[1] + (e.dy ?? 0);
  return `<text x="${f(x)}" y="${f(y)}" font-size="${e.taille ?? 15}" fill="${e.couleur ?? 'var(--ink)'}"${e.ancre ? ` text-anchor="${e.ancre}"` : ''}${e.italique ? ' font-style="italic"' : ''}${e.gras ? ' font-weight="600"' : ''}${e.rotation ? ` transform="rotate(${e.rotation} ${f(x)} ${f(y)})"` : ''}>${e.brut ? s : esc(s)}</text>`;
}
/** Indice (à placer en fin d’étiquette, avec `brut: true`). */
export const ind = (s: string) => `<tspan dy="4" font-size="0.72em">${s}</tspan>`;
/** Portions contiguës d’une courbe fermée qui vérifient `garder` (pour ne tracer, par exemple, que la partie au-dessus de l’horizon). */
export function portions(pts: V3[], garder: (v: V3) => boolean): V3[][] {
  const n = pts.length, ok = pts.map(garder);
  if (ok.every(Boolean)) return [pts];
  const debut = ok.findIndex((x) => !x), res: V3[][] = [];
  let cur: V3[] = [];
  for (let k = 1; k <= n; k++) {
    const i = (debut + k) % n;
    if (ok[i]) cur.push(pts[i]); else if (cur.length) { res.push(cur); cur = []; }
  }
  if (cur.length) res.push(cur);
  return res.filter((r) => r.length > 1);
}
/** Étoile à cinq branches. */
export function etoile(p: P2, r = 7, couleur = 'var(--sun)'): string {
  const pts: P2[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push([p[0] + rr * Math.cos(a), p[1] + rr * Math.sin(a)]); }
  return `<path d="${chemin(pts, true)}" fill="${couleur}" stroke="var(--ink)" stroke-width=".6"/>`;
}
/** Annotation sur plusieurs lignes, reliée à `cible` par un trait fléché partant de `depart`. */
export function renvoi(lignes: string[], pos: P2, depart: P2, cible: P2, e: Etiquette = {}): string {
  const c = e.couleur ?? 'var(--ink)';
  return lignes.map((l, i) => texte2D([pos[0], pos[1] + i * 17], l, { taille: 14, ...e, couleur: c })).join('') + trait2D(depart, cible, { couleur: c, epaisseur: 1, fleche: 'fin' });
}
/** Direction tangente en V (point de la sphère unité) vers le point U, le long du grand cercle VU. */
export const tangente = (V: V3, U: V3): V3 => unit(add(U, mul(V, -dot(U, V))));
export const point2D = (p: P2, r = 3.5, couleur = 'var(--ink)') => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r}" fill="${couleur}"/>`;

export class Vue {
  private r: V3; private u: V3; private w: V3;
  /** cx, cy, R : centre et rayon de la sphère à l’écran ; az, el : direction de l’observateur (degrés). */
  constructor(public cx: number, public cy: number, public R: number, az = 0, el = 0) {
    const a = az * RAD, e = el * RAD;
    this.r = [-Math.sin(a), Math.cos(a), 0];
    this.u = [-Math.sin(e) * Math.cos(a), -Math.sin(e) * Math.sin(a), Math.cos(e)];
    this.w = [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)];
  }
  /** Position à l’écran d’un point de l’espace (rayon de la sphère = 1). */
  xy(v: V3): P2 { return [this.cx + this.R * dot(v, this.r), this.cy - this.R * dot(v, this.u)]; }
  /** Les deux points d’un grand cercle (de normale n) situés sur le contour apparent de la sphère. */
  limbe(n: V3): [V3, V3] { const e = unit(cross(n, this.w)); return [mul(e, -1), e].sort((p, q) => this.xy(p)[0] - this.xy(q)[0]) as [V3, V3]; }
  /** Vrai si le point est sur la face visible. */
  devant(v: V3) { return dot(v, this.w) >= -1e-6; }

  /** Polyligne de l’espace ; si `surface`, la partie arrière suit `t.arriere`. */
  courbe(pts: V3[], t: Trait = {}, surface = true): string {
    const c = t.couleur ?? 'var(--ink)', w = t.epaisseur ?? 1.4;
    const morceaux: { av: boolean; p: P2[] }[] = [];
    for (const v of pts) {
      const av = !surface || this.devant(v), p = this.xy(v), der = morceaux[morceaux.length - 1];
      if (der && der.av === av) der.p.push(p);
      else { if (der) der.p.push(p); morceaux.push({ av, p: [p] }); }
    }
    let s = '';
    for (const m of morceaux) {
      if (m.p.length < 2) continue;
      if (!m.av && t.arriere === 'masque') continue;
      const tir = m.av || t.arriere === 'plein' ? t.tirets : '5 5';
      s += `<path d="${chemin(m.p)}" fill="none" stroke="${c}" stroke-width="${m.av || t.arriere === 'plein' ? w : Math.min(w, 1.2)}"${tir ? ` stroke-dasharray="${tir}"` : ''}${!m.av && t.arriere !== 'plein' ? ' opacity=".75"' : ''} stroke-linecap="round"/>`;
    }
    const P = pts.map((v) => this.xy(v)), k = Math.max(1, Math.min(4, P.length - 1));
    if (t.fleche === 'fin' || t.fleche === 'deux') s += pointe(P[P.length - 1 - k], P[P.length - 1], c);
    if (t.fleche === 'debut' || t.fleche === 'deux') s += pointe(P[k], P[0], c);
    return s;
  }
  /** Cercle de la sphère unité : points p tels que p·n = d (grand cercle si d = 0). */
  cercle(n: V3, d = 0, t: Trait = {}, nb = 240): string {
    return this.courbe(this.pointsCercle(n, d, 0, 360, nb), t);
  }
  /** Points d’un cercle de normale n, de t0 à t1 (degrés) ; origine des angles : `origine` projetée sur le plan du cercle. */
  pointsCercle(n: V3, d = 0, t0 = 0, t1 = 360, nb = 240, origine?: V3): V3[] {
    const nn = unit(n), ref: V3 = origine ?? (Math.abs(nn[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]);
    const e1 = unit(add(ref, mul(nn, -dot(ref, nn)))), e2 = cross(nn, e1), rho = Math.sqrt(Math.max(0, 1 - d * d));
    const pts: V3[] = [];
    for (let i = 0; i <= nb; i++) { const a = (t0 + (t1 - t0) * i / nb) * RAD; pts.push(comb([d, nn], [rho * Math.cos(a), e1], [rho * Math.sin(a), e2])); }
    return pts;
  }
  /** Arc de grand cercle de la direction a à la direction b, au rayon r autour de `centre`. */
  arc(a: V3, b: V3, t: Trait = {}, r = 1, long = false, centre: V3 = [0, 0, 0]): string {
    const pts: V3[] = [];
    for (let i = 0; i <= 80; i++) pts.push(add(centre, mul(slerp(a, b, i / 80, long), r)));
    return this.courbe(pts, t, r === 1 && centre.every((x) => x === 0));
  }
  /** Secteur angulaire plein de sommet o, entre les directions a et b, de rayon r. */
  secteur(o: V3, a: V3, b: V3, r: number, remplir: string, opacite = 0.35): string {
    const pts: P2[] = [this.xy(o)];
    for (let i = 0; i <= 40; i++) pts.push(this.xy(add(o, mul(slerp(a, b, i / 40), r))));
    return `<path d="${chemin(pts, true)}" fill="${remplir}" fill-opacity="${opacite}" stroke="none"/>`;
  }
  /** Marque d’angle au sommet V (sphère unité) entre les grands cercles VU et VW. */
  angle(V: V3, U: V3, W: V3, r = 0.12, t: Trait = {}): string {
    const a = tangente(V, U), b = tangente(V, W), pts: V3[] = [];
    for (let i = 0; i <= 30; i++) pts.push(add(V, mul(slerp(a, b, i / 30), r)));
    return this.courbe(pts, { epaisseur: 1, ...t }, false);
  }
  /** Point de l’écran situé à la distance r de V dans la direction moyenne des grands cercles VU et VW (pour étiqueter un angle). */
  dansAngle(V: V3, U: V3, W: V3, r = 0.2): P2 { return this.xy(add(V, mul(slerp(tangente(V, U), tangente(V, W), 0.5), r))); }
  ligne(a: V3, b: V3, t: Trait = {}): string { return trait2D(this.xy(a), this.xy(b), t); }
  /** Polygone plein (plan, cône…). */
  polygone(pts: V3[], remplir: string, opacite = 0.3, contour?: string): string {
    return `<path d="${chemin(pts.map((v) => this.xy(v)), true)}" fill="${remplir}" fill-opacity="${opacite}"${contour ? ` stroke="${contour}" stroke-width="1"` : ' stroke="none"'}/>`;
  }
  point(v: V3, r = 3.5, couleur = 'var(--ink)'): string { return point2D(this.xy(v), r, couleur); }
  etoile(v: V3, r = 7, couleur = 'var(--sun)'): string { return etoile(this.xy(v), r, couleur); }
  /** Étiquette en un point de l’espace (V3) ou directement de l’écran (P2). */
  texte(v: V3 | P2, s: string, e: Etiquette = {}): string { return texte2D(v.length === 2 ? (v as P2) : this.xy(v as V3), s, e); }
  /** Contour apparent de la sphère. */
  contour(t: Trait = {}): string {
    return `<circle cx="${f(this.cx)}" cy="${f(this.cy)}" r="${f(this.R)}" fill="${t.remplir ?? 'none'}" stroke="${t.couleur ?? 'var(--ink)'}" stroke-width="${t.epaisseur ?? 1.4}"/>`;
  }
}
