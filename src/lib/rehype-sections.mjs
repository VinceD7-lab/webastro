/**
 * Plugin rehype : découpe le contenu d’un chapitre en <section> selon les titres h2, h3 et h4,
 * puis repère deux types de sections d’après leur titre (aucune modification des fichiers MDX) :
 *
 * - **exercice** : titre h3 ou h4 commençant par « Exercice » → <section class="exercice">,
 *   présentée comme un encadré (global.css) ;
 * - **approfondissement** : titre commençant par « En savoir plus » ou « Histoire »,
 *   ou section dont le premier paragraphe est une pastille <span class="tag plus|hist">.
 *   Le titre reste visible (sommaire, ancres) ; le reste de la section est replié dans
 *   <details class="approfondissement">, avec l’étiquette de niveau tirée de la pastille.
 *
 * Chaque titre h2/h3 reçoit aussi un lien d’ancre vide (le « # » est dessiné en CSS),
 * pour ne pas modifier le texte des titres ni leurs identifiants.
 *
 * À placer après rehypeHeadingIds (les identifiants doivent exister).
 */

const NIVEAUX = { h2: 2, h3: 3, h4: 4 };
const RE_EXERCICE = /^Exercices?\b/;
const RE_APPROF = /^(En savoir plus|Histoire)\s*:/;

/** @param {any} node */
const texte = (node) => (node.type === 'text' ? node.value : (node.children || []).map(texte).join(''));
/** @param {any} node */
const estBlanc = (node) => node.type === 'text' && !node.value.trim();

/** Classe d’un élément hast ou d’un élément JSX MDX (`<span class="…">` écrit dans le .mdx). */
function classeDe(/** @type {any} */ node) {
  if (node.type === 'element') return [].concat(node.properties?.className || []).join(' ');
  if (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') {
    const a = (node.attributes || []).find((/** @type {any} */ x) => x.name === 'class' || x.name === 'className');
    return typeof a?.value === 'string' ? a.value : '';
  }
  return '';
}

/**
 * Si `node` est une pastille de niveau, renvoie { genre, etiquette }.
 * Écrite seule sur sa ligne dans le MDX, `<span class="tag plus">…</span>` devient un élément JSX
 * de bloc ; elle peut aussi arriver enveloppée dans un paragraphe.
 */
function pastille(/** @type {any} */ node) {
  let cible = node;
  if (node.type === 'element' && node.tagName === 'p') {
    const utiles = (node.children || []).filter((/** @type {any} */ c) => !estBlanc(c));
    if (utiles.length !== 1) return null;
    cible = utiles[0];
  }
  const cls = classeDe(cible).split(/\s+/);
  if (!cls.includes('tag')) return null;
  return { genre: cls.includes('hist') ? 'hist' : 'plus', etiquette: texte(cible).trim() };
}

function ancre(/** @type {any} */ titre) {
  const id = titre.properties?.id;
  if (!id || titre.tagName === 'h4') return;
  titre.children.push({
    type: 'element', tagName: 'a',
    properties: { className: ['ancre'], href: `#${id}`, ariaLabel: `Lien vers la section « ${texte(titre).trim()} »` },
    children: [],
  });
}

/** Termine une section : classes, repli des approfondissements. */
function finaliser(/** @type {any} */ section) {
  const [titre, ...reste] = section.children;
  const intitule = texte(titre).trim();
  const classes = [];
  if (RE_EXERCICE.test(intitule) && section.niveau >= 3) classes.push('exercice');

  const iPastille = reste.findIndex((n) => !estBlanc(n));
  const p = iPastille >= 0 ? pastille(reste[iPastille]) : null;
  const parTitre = RE_APPROF.exec(intitule);
  if (p || parTitre) {
    const genre = p?.genre ?? (parTitre?.[1] === 'Histoire' ? 'hist' : 'plus');
    const etiquette = p?.etiquette || (genre === 'hist' ? 'Histoire' : 'En savoir plus');
    if (p) reste.splice(iPastille, 1);
    classes.push('approfondissement', `approf-${genre}`);
    section.children = [titre, {
      type: 'element', tagName: 'details', properties: { className: ['approf-repli'] },
      children: [
        { type: 'element', tagName: 'summary', properties: {}, children: [
          { type: 'element', tagName: 'span', properties: { className: ['approf-etiquette'] }, children: [{ type: 'text', value: etiquette }] },
          { type: 'element', tagName: 'span', properties: { className: ['approf-action'] }, children: [{ type: 'text', value: genre === 'hist' ? 'Lire l’encadré historique' : 'Lire l’approfondissement' }] },
        ] },
        { type: 'element', tagName: 'div', properties: { className: ['approf-corps'] }, children: reste },
      ],
    }];
  }
  if (classes.length) section.properties.className = classes;
  delete section.niveau;
}

export function rehypeSections() {
  return (/** @type {any} */ tree) => {
    /** @type {any[]} */
    const racine = [];
    /** @type {any[]} pile des sections ouvertes, de la moins à la plus profonde */
    const pile = [];
    const fermerJusqua = (/** @type {number} */ niveau) => {
      while (pile.length && pile[pile.length - 1].niveau >= niveau) finaliser(pile.pop());
    };
    const ajouter = (/** @type {any} */ n) => (pile.length ? pile[pile.length - 1].children : racine).push(n);

    for (const node of tree.children) {
      // Les imports/exports MDX restent à la racine.
      if (node.type === 'mdxjsEsm') { racine.push(node); continue; }
      const niveau = node.type === 'element' ? NIVEAUX[/** @type {'h2'|'h3'|'h4'} */ (node.tagName)] : undefined;
      if (!niveau) { ajouter(node); continue; }
      fermerJusqua(niveau);
      ancre(node);
      const section = {
        type: 'element', tagName: 'section', niveau,
        properties: node.properties?.id ? { ariaLabelledby: node.properties.id } : {},
        children: [node],
      };
      ajouter(section);
      pile.push(section);
    }
    fermerJusqua(0);
    tree.children = racine;
  };
}
