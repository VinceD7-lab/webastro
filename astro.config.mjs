// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { redirections } from './src/data/redirections.mjs';

// Sous-dossier éventuel (GitHub Pages sans domaine propre) : par exemple '/webastro'.
// Tous les liens internes passent par src/lib/url.ts et suivent ce réglage.
const BASE = '/webastro/';

/** Écrit une page de redirection pour chaque ancienne adresse, en conservant le nom de fichier .html. */
function anciennesAdresses() {
  return {
    name: 'anciennes-adresses',
    hooks: {
      /** @param {{ dir: URL }} options */
      'astro:build:done': ({ dir }) => {
        for (const [ancienne, nouvelle] of Object.entries(redirections)) {
          const cible = BASE.replace(/\/$/, '') + encodeURI(nouvelle);
          const fichier = fileURLToPath(new URL('.' + ancienne, dir));
          mkdirSync(dirname(fichier), { recursive: true });
          writeFileSync(fichier, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Page déplacée</title><meta http-equiv="refresh" content="0; url=${cible}"><link rel="canonical" href="${cible}"><meta name="robots" content="noindex"></head><body><p>Cette page a déménagé : <a href="${cible}">${cible}</a>.</p></body></html>`);
        }
      },
    },
  };
}

export default defineConfig({
  // Adresse publique du site : à adapter avant le déploiement.
  site: 'https://vinced7-lab.github.io',
  base: BASE,
  trailingSlash: 'always',
  integrations: [mdx(), anciennesAdresses()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      // Formules rendues en MathML natif : aucune feuille de style ni police à charger.
      rehypePlugins: [[rehypeKatex, { output: 'mathml' }]],
    }),
  },
});
