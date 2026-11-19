/**
 * Typographie française (règles de l’Imprimerie nationale) :
 * - espace insécable (U+00A0) avant « : » et à l’intérieur des guillemets « » ;
 * - espace fine insécable (U+202F) avant « ; ? ! ».
 * L’espace déjà présente est remplacée ; on n’en ajoute jamais là où il n’y en a pas,
 * pour ne pas toucher aux notations (heures « 12:30 », URL, factorielle « n! »…).
 */
const INSECABLE = ' ';
const FINE = ' ';
const AVANT_FINE = /[   ]+([;?!])/g;
const AVANT_INSECABLE = /[   ]+([:»])/g;
const APRES_GUILLEMET = /«[   ]+/g;

/** @param {string} s */
export function espacesFines(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(AVANT_FINE, FINE + '$1')
    .replace(AVANT_INSECABLE, INSECABLE + '$1')
    .replace(APRES_GUILLEMET, '«' + INSECABLE);
}

/** Éléments dont le texte ne doit pas être retouché. */
const EXCLUS = new Set(['code', 'pre', 'kbd', 'samp', 'math', 'script', 'style', 'textarea', 'svg']);

/**
 * Plugin rehype : applique `espacesFines` aux nœuds texte du contenu.
 * À placer après le calcul des identifiants de titres (rehypeHeadingIds),
 * pour que les ancres existantes ne changent pas.
 */
export function rehypeEspacesFines() {
  /** @param {any} node */
  const parcourir = (node) => {
    if (node.type === 'text') { node.value = espacesFines(node.value); return; }
    if (node.type === 'element' && EXCLUS.has(node.tagName)) return;
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (node.name && EXCLUS.has(node.name)) return;
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(parcourir);
      node.children = lierElisions(node.children);
    }
  };
  return (/** @type {any} */ tree) => parcourir(tree);
}

/** Composants rendus en bouton (donc en bloc en ligne) : le navigateur peut couper la ligne juste avant eux. */
const BOUTONS = new Set(['Terme', 'Personne']);
const ELISION = /(\S*[’'])$/;

/**
 * « l’<Terme>excentricité</Terme> » : sans précaution, « l’ » peut rester seul en fin de ligne.
 * On regroupe le mot élidé et le composant dans un <span class="insec"> (white-space: nowrap, global.css).
 * @param {any[]} enfants
 */
function lierElisions(enfants) {
  const sortie = [];
  for (let i = 0; i < enfants.length; i++) {
    const n = enfants[i], suivant = enfants[i + 1];
    const m = n.type === 'text' && suivant?.type === 'mdxJsxTextElement' && BOUTONS.has(suivant.name) ? ELISION.exec(n.value) : null;
    if (!m) { sortie.push(n); continue; }
    const avant = n.value.slice(0, n.value.length - m[1].length);
    if (avant) sortie.push({ type: 'text', value: avant });
    sortie.push({ type: 'element', tagName: 'span', properties: { className: ['insec'] }, children: [{ type: 'text', value: m[1] }, suivant] });
    i++;
  }
  return sortie;
}
