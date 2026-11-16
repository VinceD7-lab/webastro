import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Un fichier .mdx par chapitre dans src/content/cours/.
 * Le champ `slug` du frontmatter donne l’adresse : /cours/<slug>/.
 */
const cours = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/cours' }),
  schema: z.object({
    title: z.string(),
    numero: z.number().int().min(1),
    resume: z.string(),
    auteur: z.string().default('Jean-Eudes Arlot'),
    source: z.string().url().optional(),
  }),
});

export const collections = { cours };
