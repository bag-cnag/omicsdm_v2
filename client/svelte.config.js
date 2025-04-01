import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: 'index.html',
			pages: 'build',
			assets: 'build',
		}),
		alias: {
			'client': './src/client',
			'auth': './src/auth.ts',
			'tsconfig': './openapi-ts.config.ts'
		},
		prerender: {
			entries: [
				'/',
				'/about',
				'/direct_json',
				'/docs',
				'/login',
				'/logout',
				'/project/[id]',
				'/dataset/[id]_[version]',
				'/[...404]'
			],
		},
	}
};

export default config;
