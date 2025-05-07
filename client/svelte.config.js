import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from "path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// paths: { // Uncomment for build pipeline
		// 	base: '/portalv2',
		// 	relative: false,
		// },
		adapter: adapter({
			fallback: 'index.html',
			pages: 'build',
			assets: 'build',
		}),
		alias: {
			'client': path.resolve("src/client"), // './src/client',
			'config': path.resolve("src/config.ts"), // './src/config.ts',
			'auth': path.resolve("src/auth.ts"), // './src/auth.ts',
			'tsconfig': path.resolve("openapi-ts.config.ts"), //'./openapi-ts.config.ts'
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
	},
};

export default config;
