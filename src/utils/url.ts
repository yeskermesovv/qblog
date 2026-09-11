// GitHub Pages serves this site from a subfolder, so every internal link has to
// carry the configured `base`. Import these helpers instead of hardcoding "/".
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Turn a site-absolute path like `/blog` into a link that works under `base`. */
export function withBase(path = '/'): string {
	return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Drop the `base` prefix from a pathname, for comparing against plain paths. */
export function stripBase(pathname: string): string {
	const stripped = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
	return stripped.startsWith('/') ? stripped : `/${stripped}`;
}
