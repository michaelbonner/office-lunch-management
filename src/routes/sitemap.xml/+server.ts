import type { RequestHandler } from '@sveltejs/kit';

const BASE_URL = 'https://officelunch.app';

const publicRoutes = ['/', '/sign-in', '/pricing'];

export const GET: RequestHandler = () => {
	const urls = publicRoutes
		.map(
			(path) => `
	<url>
		<loc>${BASE_URL}${path}</loc>
	</url>`
		)
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
