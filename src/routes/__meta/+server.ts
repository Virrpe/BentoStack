import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import pkg from '../../../package.json';

export const GET: RequestHandler = async () => {
	const metadata = {
		version: pkg.version,
		name: pkg.name,
		sha:
			import.meta.env.VITE_GIT_SHA ||
			process.env.VERCEL_GIT_COMMIT_SHA ||
			process.env.GITHUB_SHA ||
			'dev',
		buildTimestamp: import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString(),
		environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
		deploymentUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
	};

	return json(metadata, {
		headers: {
			'Cache-Control': 'public, max-age=300'
		}
	});
};
