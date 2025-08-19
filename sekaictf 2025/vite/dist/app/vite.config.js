import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	preview: {
		host: '0.0.0.0',
		port: 1337,
		allowedHosts: ['.chals.sekai.team'],
	}
});
