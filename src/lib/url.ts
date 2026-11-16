/** Préfixe un chemin interne avec le `base` défini dans astro.config.mjs. */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
}
