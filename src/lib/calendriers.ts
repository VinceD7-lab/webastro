/**
 * Conversions entre calendriers, à partir de la date julienne (JD).
 * Les années sont en notation astronomique : 0 = 1 av. J.-C., −1 = 2 av. J.-C.
 * Algorithmes : Meeus (julien/grégorien), formes arithmétiques des calendriers
 * musulman, israélite et copte, table des débuts d’année pour le républicain.
 */
const F = Math.floor;
export type Date3 = [number, number, number]; // [année, mois, jour]

export const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
export const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
export const HIJRI = ['Mouharram','Safar','Rabi’-oul-Aououal','Rabi’-out-Tani','Djoumada-l-Oula','Djoumada-t-Tania','Radjab','Cha’ban','Ramadan','Chaououal','Dou-l-Qa’da','Dou-l-Hidjja'];
export const HEBREU = ['Nissan','Iyar','Sivan','Tamouz','Ab','Elloul','Tisseri','Hesvan','Kislev','Tébeth','Schébat','Adar','Véadar'];
export const COPTE = ['Tout','Bâbah','Hâtour','Keihak','Toubah','Amchîr','Barmahât','Barmoudah','Bachnas','Bou’nah','Abib','Masarî'];
export const REPUBLICAIN = ['vendémiaire','brumaire','frimaire','nivôse','pluviôse','ventôse','germinal','floréal','prairial','messidor','thermidor','fructidor'];
export const SANSCULOTTIDES = ['jour de la Vertu','jour du Génie','jour du Travail','jour de l’Opinion','jour des Récompenses','jour de la Révolution'];
export const DECADE = ['primidi','duodi','tridi','quartidi','quintidi','sextidi','septidi','octodi','nonidi','décadi'];
export const ROMAINS = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV'];
export const INDIEN = ['Chaitra','Vaisakha','Jyaistha','Asadha','Sravana','Bhadra','Asvina','Kartika','Agrahayana','Pausa','Magha','Phalguna'];

export const bissextileGregorien = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
export const bissextileJulien = (y: number) => ((y % 4) + 4) % 4 === 0;

/** Date julienne à 0 h TU d’une date grégorienne (greg = true) ou julienne. */
export function versJD(y: number, m: number, d: number, greg: boolean): number {
  if (m <= 2) { y -= 1; m += 12; }
  let B = 0;
  if (greg) { const A = F(y / 100); B = 2 - A + F(A / 4); }
  return F(365.25 * (y + 4716)) + F(30.6001 * (m + 1)) + d + B - 1524.5;
}

export function depuisJD(jd: number, greg: boolean): Date3 {
  const Z = F(jd + 0.5);
  let A = Z;
  if (greg) { const al = F((Z - 1867216.25) / 36524.25); A = Z + 1 + al - F(al / 4); }
  const B = A + 1524, C = F((B - 122.1) / 365.25), D = F(365.25 * C), E = F((B - D) / 30.6001);
  const d = B - D - F(30.6001 * E), m = E < 14 ? E - 1 : E - 13, y = m > 2 ? C - 4716 : C - 4715;
  return [y, m, d];
}

export const jourSemaine = (jd: number) => JOURS[F(jd + 1.5) % 7];
export const indexJourSemaine = (jd: number) => F(jd + 1.5) % 7;

/* Musulman (arithmétique, origine vendredi 16 juillet 622 julien) */
export const EPOQUE_HEGIRE = 1948439.5;
function hijriVersJD(y: number, m: number, d: number) {
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + F((3 + 11 * y) / 30) + EPOQUE_HEGIRE - 1;
}
export function versHijri(jd: number): Date3 {
  jd = F(jd) + 0.5;
  const y = F((30 * (jd - EPOQUE_HEGIRE) + 10646) / 10631);
  const m = Math.min(12, Math.ceil((jd - (29 + hijriVersJD(y, 1, 1))) / 29.5) + 1);
  return [y, m, jd - hijriVersJD(y, m, 1) + 1];
}
export const hijriAbondante = (y: number) => ((14 + 11 * y) % 30) < 11;

/* Copte (origine 29 août 284 julien) */
export const EPOQUE_COPTE = 1825029.5;
function copteVersJD(y: number, m: number, d: number) {
  return EPOQUE_COPTE - 1 + 365 * (y - 1) + F(y / 4) + 30 * (m - 1) + d;
}
export function versCopte(jd: number): Date3 {
  jd = F(jd) + 0.5;
  const y = F((4 * (jd - EPOQUE_COPTE) + 1463) / 1461);
  const m = F((jd - copteVersJD(y, 1, 1)) / 30) + 1;
  return [y, m, jd + 1 - copteVersJD(y, m, 1)];
}

/* Israélite (mois numérotés à partir de Nissan = 1, Tisseri = 7) */
const EPOQUE_HEBREU = 347995.5;
export const hebreuEmbolismique = (y: number) => ((7 * y + 1) % 19) < 7;
const moisDansAnnee = (y: number) => (hebreuEmbolismique(y) ? 13 : 12);
function delai1(y: number) {
  const mo = F((235 * y - 234) / 19), p = 12084 + 13753 * mo;
  let jour = mo * 29 + F(p / 25920);
  if ((3 * (jour + 1)) % 7 < 3) jour++;
  return jour;
}
function delai2(y: number) {
  const l = delai1(y - 1), p = delai1(y), n = delai1(y + 1);
  return n - p === 356 ? 2 : p - l === 382 ? 1 : 0;
}
export const joursAnneeHebraique = (y: number) => hebreuVersJD(y + 1, 7, 1) - hebreuVersJD(y, 7, 1);
function joursMois(y: number, m: number) {
  if ([2, 4, 6, 10, 13].includes(m)) return 29;
  if (m === 12 && !hebreuEmbolismique(y)) return 29;
  if (m === 8 && joursAnneeHebraique(y) % 10 !== 5) return 29;
  if (m === 9 && joursAnneeHebraique(y) % 10 === 3) return 29;
  return 30;
}
export function hebreuVersJD(y: number, m: number, d: number): number {
  let jd = EPOQUE_HEBREU + delai1(y) + delai2(y) + d + 1;
  if (m < 7) {
    for (let k = 7; k <= moisDansAnnee(y); k++) jd += joursMois(y, k);
    for (let k = 1; k < m; k++) jd += joursMois(y, k);
  } else {
    for (let k = 7; k < m; k++) jd += joursMois(y, k);
  }
  return jd;
}
export function versHebreu(jd: number): Date3 {
  jd = F(jd) + 0.5;
  const c = F(((jd - EPOQUE_HEBREU) * 98496) / 35975351);
  let y = c - 1;
  for (let i = c; jd >= hebreuVersJD(i, 7, 1); i++) y++;
  const premier = jd < hebreuVersJD(y, 1, 1) ? 7 : 1;
  let m = premier;
  for (let i = premier; jd > hebreuVersJD(y, i, joursMois(y, i)); i++) m++;
  return [y, m, jd - hebreuVersJD(y, m, 1) + 1];
}
export const ORIGINE_HEBRAIQUE = () => hebreuVersJD(1, 7, 1);

/* Républicain (an I à an XIV) : débuts d’année aux équinoxes vrais observés à Paris */
const DEBUTS_REPUBLICAINS: Date3[] = [[1792,9,22],[1793,9,22],[1794,9,22],[1795,9,23],[1796,9,22],[1797,9,22],[1798,9,22],[1799,9,23],[1800,9,23],[1801,9,23],[1802,9,23],[1803,9,24],[1804,9,23],[1805,9,23]];
export function versRepublicain(jd: number): Date3 | null {
  jd = F(jd) + 0.5;
  if (jd < versJD(1792, 9, 22, true) || jd > versJD(1805, 12, 31, true)) return null;
  let y = DEBUTS_REPUBLICAINS.length;
  while (y > 1 && jd < versJD(...DEBUTS_REPUBLICAINS[y - 1], true)) y--;
  const n = jd - versJD(...DEBUTS_REPUBLICAINS[y - 1], true);
  return [y, F(n / 30) + 1, (n % 30) + 1];
}

/* National indien (ère Saka) */
export function versIndien(jd: number): Date3 {
  const g = depuisJD(jd, true);
  const debut = (y: number) => versJD(y, 3, bissextileGregorien(y) ? 21 : 22, true);
  const an = jd < debut(g[0]) ? g[0] - 1 : g[0];
  let n = jd - debut(an), m = 0;
  const longueurs = [bissextileGregorien(an) ? 31 : 30, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
  while (n >= longueurs[m]) { n -= longueurs[m]; m++; }
  return [an - 78, m + 1, n + 1];
}

/* Mise en forme */
export const jourTexte = (d: number) => (d === 1 ? '1<sup>er</sup>' : String(d));
export const anneeTexte = (y: number) => (y > 0 ? String(y) : `${1 - y} av. J.-C.`);
export const dateTexte = (a: Date3) => `${jourTexte(a[2])} ${MOIS[a[1] - 1]} ${anneeTexte(a[0])}`;
