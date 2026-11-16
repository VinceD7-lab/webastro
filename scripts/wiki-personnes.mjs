// Prépare les fiches des personnalités affichées dans le volet latéral des chapitres.
// Usage : node scripts/wiki-personnes.mjs
// Pour chaque personne : introduction de l’article fr.wikipedia (paragraphes, coupés vers 900 caractères),
// description et lien (API REST « summary »), années de naissance
// et de mort (Wikidata), portrait de Wikimédia Commons s’il est dans le domaine public ou sous
// licence CC BY / CC BY-SA. Écrit src/data/personnalites.json et public/personnes/<id>.<ext>.
// Les extraits de Wikipédia sont sous licence CC BY-SA 4.0 : la fiche affiche la source et la licence.
import { mkdirSync, writeFileSync } from 'node:fs';

const PERSONNES = {
  galilee: ['Galilée', 'Galilée (savant)'],
  huygens: ['Christian Huygens', 'Christian Huygens'],
  descartes: ['René Descartes', 'René Descartes'],
  clairaut: ['Alexis Clairaut', 'Alexis Clairaut'],
  euler: ['Leonhard Euler', 'Leonhard Euler'],
  dalembert: ['Jean le Rond d’Alembert', "Jean Le Rond d'Alembert"],
  newton: ['Isaac Newton', 'Isaac Newton'],
  laplace: ['Pierre-Simon de Laplace', 'Pierre-Simon de Laplace'],
  lagrange: ['Joseph-Louis Lagrange', 'Joseph-Louis Lagrange'],
  kepler: ['Johannes Kepler', 'Johannes Kepler'],
  leverrier: ['Urbain Le Verrier', 'Urbain Le Verrier'],
  adams: ['John Couch Adams', 'John Couch Adams'],
  galle: ['Johann Gottfried Galle', 'Johann Gottfried Galle'],
  tombaugh: ['Clyde Tombaugh', 'Clyde Tombaugh'],
  lowell: ['Percival Lowell', 'Percival Lowell'],
  newcomb: ['Simon Newcomb', 'Simon Newcomb'],
  milankovitch: ['Milutin Milanković', 'Milutin Milanković'],
  colbert: ['Jean-Baptiste Colbert', 'Jean-Baptiste Colbert'],
  einstein: ['Albert Einstein', 'Albert Einstein'],
  cavendish: ['Henry Cavendish', 'Henry Cavendish'],
  maxwell: ['James Clerk Maxwell', 'James Clerk Maxwell'],
  michelson: ['Albert A. Michelson', 'Albert Abraham Michelson'],
  poincare: ['Henri Poincaré', 'Henri Poincaré'],
  lorentz: ['Hendrik Lorentz', 'Hendrik Lorentz'],
  foucault: ['Léon Foucault', 'Léon Foucault'],
  hubble: ['Edwin Hubble', 'Edwin Hubble'],
  kant: ['Emmanuel Kant', 'Emmanuel Kant'],
  lalande: ['Jérôme Lalande', 'Jérôme Lalande'],
  essen: ['Louis Essen', 'Louis Essen'],
  cohentannoudji: ['Claude Cohen-Tannoudji', 'Claude Cohen-Tannoudji'],
  planck: ['Max Planck', 'Max Planck'],
  alphonse: ['Alphonse X de Castille', 'Alphonse X'],
  regiomontanus: ['Regiomontanus', 'Regiomontanus'],
  reinhold: ['Erasmus Reinhold', 'Erasmus Reinhold'],
  copernic: ['Nicolas Copernic', 'Nicolas Copernic'],
  marius: ['Simon Marius', 'Simon Marius'],
  tycho: ['Tycho Brahe', 'Tycho Brahe'],
  tchebychev: ['Pafnouti Tchebychev', 'Pafnouti Tchebychev'],
  bessel: ['Friedrich Wilhelm Bessel', 'Friedrich Wilhelm Bessel'],
};

const UA = { 'User-Agent': 'cours-astronomie-build/1.0 (script de préparation de contenu)' };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
/** Requête polie : en cas de limite de débit (429) ou d’erreur serveur, on attend puis on réessaie. */
async function charger(u) {
  for (let essai = 0; ; essai++) {
    const r = await fetch(u, { headers: UA });
    if (r.ok) return r;
    if ((r.status === 429 || r.status >= 500) && essai < 6) { await pause((+r.headers.get('retry-after') || 2 ** essai * 2) * 1000); continue; }
    throw new Error(`${r.status} ${u}`);
  }
}
const json = async (u) => (await charger(u)).json();
const ENTITES = { '&amp;': '&', '&quot;': '"', '&#039;': '’', '&#39;': '’', '&nbsp;': ' ', '&lt;': '<', '&gt;': '>' };
/** Nom d’auteur lisible : sans balises ni entités, sans renvois [1], sans répétition (« UnknownUnknown »). */
function auteur(s = '') {
  let a = s.replace(/<[^>]+>/g, ' ').replace(/&[#\w]+;/g, (e) => ENTITES[e] ?? e).replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
  a = a.replace(/^(.+?)\s*\1$/, '$1');
  // « The original uploader was … » désigne la personne qui a versé le fichier, pas l’auteur.
  if (/^(unknown( author)?|anonymous|auteur inconnu)$/i.test(a) || /^the original uploader was/i.test(a)) a = 'auteur inconnu';
  return a || 'auteur inconnu';
}
/** Nettoie un extrait : retire les notes d’homonymie, les transcriptions phonétiques et les titres de section. */
function nettoyer(texte) {
  return texte.split(/\n+/)
    .filter((p) => !/^(Toutes les occurrences|Pour les articles homonymes|Ne doit pas être confondu|Cet article)/.test(p.trim()) && !/^=+.*=+$/.test(p.trim()))
    .map((p) => p.replace(/\s*\(\/[^/]*\/\)/g, '').replace(/\s*\[[^\]]*[ˈˌː][^\]]*\]\s*/g, ' ').replace(/\(\s*(en [a-z]+ :)\s*\)/g, '').replace(/\s+([,.)])/g, '$1').replace(/\(\s+/g, '(').replace(/\s{2,}/g, ' '))
    .join('\n');
}
const annee = (claims, p) => { const t = claims?.[p]?.[0]?.mainsnak?.datavalue?.value?.time; return t ? parseInt(t.slice(0, 5), 10) : null; };
const LICENCES_OK = /^(public domain|domaine public|pd\b|pd-|cc0|cc by(-sa)?\b)/i;

/** Garde les premiers paragraphes de l’introduction, jusqu’à environ `max` caractères, en coupant à la fin d’une phrase. */
function couper(texte, max = 900) {
  const paras = texte.split(/\n+/).map((p) => p.trim()).filter(Boolean), garde = [];
  let n = 0;
  for (const p of paras) {
    if (n + p.length <= max) { garde.push(p); n += p.length; continue; }
    const reste = max - n, fin = p.slice(0, reste).lastIndexOf('. ');
    if (fin > 80) garde.push(p.slice(0, fin + 1));
    else if (!garde.length) garde.push(p.slice(0, max).replace(/\s+\S*$/, '') + '…');
    break;
  }
  return garde;
}

mkdirSync('public/personnes', { recursive: true });
const sortie = {};
for (const [id, [nom, titre]] of Object.entries(PERSONNES)) {
  const s = await json(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titre.replace(/ /g, '_'))}`);
  if (s.type !== 'standard') throw new Error(`${id} : page ${s.type} (${titre})`);
  const ex = await json(`https://fr.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(s.titles.canonical)}`);
  let intro = nettoyer(Object.values(ex.query.pages)[0]?.extract ?? s.extract ?? '');
  if (intro.length < 350) {
    // Introduction très courte : on prend le début de l’article (en général la biographie).
    const tout = await json(`https://fr.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=extracts&explaintext=1&exsectionformat=wiki&exchars=1500&titles=${encodeURIComponent(s.titles.canonical)}`);
    const plus = nettoyer(Object.values(tout.query.pages)[0]?.extract ?? '');
    if (plus.length > intro.length) intro = plus.replace(/…$/, '');
  }
  const fiche = { nom, naissance: null, mort: null, description: (s.description ?? '').replace(/\s*\(\d{3,4}\s*[–-]\s*\d{3,4}\)\s*$/, ''), resume: couper(intro), wikipedia: s.content_urls.desktop.page, article: s.titles.normalized };
  if (s.wikibase_item) {
    const wd = await json(`https://www.wikidata.org/wiki/Special:EntityData/${s.wikibase_item}.json`);
    const c = wd.entities[s.wikibase_item].claims;
    fiche.naissance = annee(c, 'P569'); fiche.mort = annee(c, 'P570');
  }
  const vignette = s.thumbnail?.source ?? s.originalimage?.source;
  const m = vignette?.match(/\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/);
  if (m) {
    const fichier = decodeURIComponent(m[1]);
    const q = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=330&titles=${encodeURIComponent('File:' + fichier)}`);
    const info = Object.values(q.query.pages)[0]?.imageinfo?.[0];
    const licence = info?.extmetadata?.LicenseShortName?.value ?? '';
    if (info && LICENCES_OK.test(licence)) {
      const url = info.thumburl ?? info.url, ext = (url.match(/\.(jpe?g|png|gif|webp)(?:\?|$)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
      const img = await charger(url);
      {
        writeFileSync(`public/personnes/${id}.${ext}`, Buffer.from(await img.arrayBuffer()));
        fiche.portrait = { fichier: `personnes/${id}.${ext}`, auteur: auteur(info.extmetadata?.Artist?.value), licence, source: info.descriptionurl };
      }
    } else console.warn(`${id} : portrait écarté (licence « ${licence || 'inconnue'} »)`);
  } else console.warn(`${id} : pas de portrait sur Commons`);
  sortie[id] = fiche;
  await pause(1500);
  console.log(`${id.padEnd(13)} ${fiche.naissance}-${fiche.mort} ${fiche.portrait ? fiche.portrait.licence : 'sans portrait'} · ${fiche.resume.join(' ').length} car.`);
}
writeFileSync('src/data/personnalites.json', JSON.stringify(sortie, null, 2) + '\n');
