import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';

const getSha = () => {
	try {
		return execSync('git rev-parse HEAD').toString().trim();
	} catch {
		return 'unknown';
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		'import.meta.env.VITE_GIT_SHA': JSON.stringify(
			process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || getSha()
		),
		'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(new Date().toISOString())
	}
});
