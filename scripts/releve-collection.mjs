// Relève la structure de la collection « Lumières sur l’Univers » sur le site de l’Observatoire de Paris.
// Usage : node scripts/releve-collection.mjs
// - portail (index.html) : les 22 cours, avec le lien de leur page d’introduction ;
// - sommaire général (pages_r-ressources/sommaire.html) : titre et lien de chaque partie ;
//   le cours Gravitation n’y figure pas, ses parties sont lues sur sa propre page ;
// - page d’introduction de chaque cours : auteurs.
// Écrit src/data/collection-parties.json. Les thèmes et les descriptions se règlent à la main
// dans src/data/collection.ts.
import { writeFileSync } from 'node:fs';
import { fromHtml } from 'hast-util-from-html';

const RACINE = 'https://media4.obspm.fr/public/ressources_lu/';

async function page(chemin) {
  const rep = await fetch(new URL(chemin, RACINE));
  if (!rep.ok) throw new Error(`${chemin} : ${rep.status}`);
  return fromHtml(await rep.text());
}

const enfants = (n) => (n.children ?? []).filter((c) => c.type === 'element');
const texte = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(texte).join(''));
const net = (s) => s.replace(/\s+/g, ' ').trim();
function trouver(n, ok, sortie = []) {
  if (n.type === 'element' && ok(n)) sortie.push(n);
  for (const c of n.children ?? []) trouver(c, ok, sortie);
  return sortie;
}
const classes = (n) => [n.properties?.className ?? []].flat();
const dossierDe = (href) => new URL(href, RACINE + 'pages_r-ressources/').pathname.split('/').at(-2);
const absolu = (href, base) => new URL(href, new URL(base, RACINE)).href;

// 1. Portail
const portail = await page('index.html');
const cours = trouver(portail, (n) => n.tagName === 'a' && classes(n).includes('lien') && /^pages_/.test(String(n.properties.href)))
  .map((a) => ({ titre: net(texte(a)), entree: absolu(String(a.properties.href), 'index.html') }));
if (cours.length !== 22) throw new Error(`22 cours attendus, ${cours.length} trouvés`);

// 2. Sommaire général : ul > li (cours) > a + ul > li (parties de premier niveau)
const sommaire = await page('pages_r-ressources/sommaire.html');
const ulRacine = trouver(sommaire, (n) => n.tagName === 'div' && classes(n).includes('zone_texte'))[0];
const liCours = enfants(enfants(ulRacine).find((e) => e.tagName === 'ul'));
const partiesParDossier = new Map();
for (const li of liCours) {
  const a = enfants(li).find((e) => e.tagName === 'a');
  const ul = enfants(li).find((e) => e.tagName === 'ul');
  const parties = enfants(ul ?? { children: [] }).map((p) => {
    const lien = enfants(p).find((e) => e.tagName === 'a');
    return { titre: net(texte(lien)), href: absolu(String(lien.properties.href), 'pages_r-ressources/sommaire.html') };
  });
  partiesParDossier.set(dossierDe(String(a.properties.href)), parties);
}

// 3. Gravitation : ses parties sont les liens « sommaire3 » de sa page
const gravite = await page('pages_gravite/index.html');
partiesParDossier.set('pages_gravite', trouver(gravite, (n) => n.tagName === 'a' && classes(n).includes('sommaire3'))
  .map((a) => ({ titre: net(texte(a)), href: absolu(String(a.properties.href), 'pages_gravite/index.html') })));

// 4. Auteurs et assemblage
const auteursDe = (arbre) => {
  const bloc = trouver(arbre, (n) => classes(n).includes('auteurs'))[0];
  return bloc ? net(texte(bloc).replace(/^\s*Auteurs?\s*:/i, '')) : '';
};
const sortie = {};
let total = 0;
for (const c of cours) {
  const dossier = dossierDe(c.entree.replace(RACINE, '../'));
  const parties = partiesParDossier.get(dossier);
  if (!parties?.length) throw new Error(`Pas de parties pour ${dossier} (${c.titre})`);
  const intro = await page(c.entree);
  let auteurs = auteursDe(intro);
  // Certains cours n’indiquent pas leurs auteurs sur l’introduction : on les cherche dans leurs parties.
  if (!auteurs) {
    const noms = new Set();
    for (const p of parties) {
      try { auteursDe(await page(p.href)).split(/,\s*|\s+et\s+/).filter(Boolean).forEach((n) => noms.add(n)); } catch { /* page absente : on passe */ }
    }
    auteurs = [...noms].join(', ');
  }
  sortie[dossier] = { titre: c.titre, entree: c.entree, auteurs, parties };
  total += parties.length;
  console.log(`${dossier.padEnd(32)} ${String(parties.length).padStart(3)} parties · ${auteurs || '(auteurs non trouvés)'}`);
}
console.log(`${cours.length} cours, ${total} parties`);
writeFileSync(new URL('../src/data/collection-parties.json', import.meta.url), JSON.stringify(sortie, null, 2) + '\n');
