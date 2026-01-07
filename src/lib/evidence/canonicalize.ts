/**
 * Deterministic URL canonicalization for stable evidence sorting.
 *
 * Rules:
 * - Force HTTPS
 * - Lowercase hostname
 * - Strip query parameters
 * - Strip trailing slash (except root)
 * - Strip fragment identifier
 * - Preserve path
 */
export function canonicalizeUrl(url: string): string {
	try {
		// Handle relative URLs or malformed input
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			url = 'https://' + url;
		}

		const parsed = new URL(url);

		// Force https
		parsed.protocol = 'https:';

		// Lowercase hostname
		parsed.hostname = parsed.hostname.toLowerCase();

		// Strip query params
		parsed.search = '';

		// Strip fragment
		parsed.hash = '';

		// Strip trailing slash (except root)
		let pathname = parsed.pathname;
		if (pathname !== '/' && pathname.endsWith('/')) {
			pathname = pathname.slice(0, -1);
		}
		parsed.pathname = pathname;

		return parsed.toString();
	} catch {
		// If URL parsing fails, return lowercase version with https
		return url.toLowerCase().replace(/^http:/, 'https:');
	}
}
