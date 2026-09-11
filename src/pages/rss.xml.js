import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { withBase } from '../utils/url';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		// The blog lives under `base`, so the feed points there, not at the domain root.
		site: new URL(import.meta.env.BASE_URL, context.site),
		items: posts
			.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
			.map((post) => ({
				...post.data,
				link: withBase(`/blog/${post.id}/`),
			})),
	});
}
