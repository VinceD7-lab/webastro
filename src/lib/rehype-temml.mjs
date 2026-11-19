/**
 * Plugin rehype : convertit au build les formules repérées par remark-math en MathML, avec Temml.
 *
 * remark-math produit `<code class="language-math math-inline">` (formule dans le texte, `$…$`)
 * et `<pre><code class="language-math math-display">` (formule en bloc, `$$…$$`).
 * Temml produit un MathML conforme à MathML Core : espaces de TeX autour de \sin, \cos…,
 * moins unaire, accents. Le style et la police sont dans src/styles/maths.css.
 * `wrap: 'tex'` : une formule dans le texte peut passer à la ligne après = ou +, comme en TeX
 * (sans cela, une longue formule déborde de l’écran sur mobile).
 *
 * Une formule invalide n’interrompt pas le build : elle est affichée en rouge
 * (classe `temml-error`) et signalée dans la console.
 */
import temml from 'temml';
import { fromHtml } from 'hast-util-from-html';

/** @param {any} node */
const texte = (node) => (node.type === 'text' ? node.value : (node.children || []).map(texte).join(''));
/** @param {any} node */
const classes = (node) => (Array.isArray(node.properties?.className) ? node.properties.className : []);

/** @param {{ macros?: Record<string, string> }} [options] */
export function rehypeTemml(options = {}) {
  return (/** @type {any} */ tree, /** @type {any} */ file) => {
    /** @param {any} parent */
    const parcourir = (parent) => {
      if (!Array.isArray(parent.children)) return;
      parent.children = parent.children.flatMap((/** @type {any} */ node) => {
        if (node.type !== 'element') { parcourir(node); return [node]; }
        let cible = node, bloc = false;
        // Formule en bloc : <pre><code class="language-math math-display">
        if (node.tagName === 'pre' && node.children?.length === 1 && classes(node.children[0]).includes('language-math')) {
          cible = node.children[0]; bloc = true;
        } else if (node.tagName === 'code' && classes(node).includes('language-math')) {
          bloc = classes(node).includes('math-display');
        } else { parcourir(node); return [node]; }

        const tex = texte(cible).trim();
        let html;
        try {
          html = temml.renderToString(tex, { displayMode: bloc, throwOnError: true, annotate: false, wrap: 'tex', macros: { ...options.macros } });
        } catch (err) {
          file?.message?.(`Formule invalide pour Temml : ${tex}\n${/** @type {Error} */ (err).message}`, { place: node.position, source: 'rehype-temml' });
          console.warn(`[rehype-temml] ${file?.path ?? ''} : formule invalide « ${tex} » — ${/** @type {Error} */ (err).message}`);
          html = temml.renderToString(tex, { displayMode: bloc, throwOnError: false, annotate: false, wrap: 'tex' });
        }
        return fromHtml(html, { fragment: true }).children;
      });
    };
    parcourir(tree);
  };
}
