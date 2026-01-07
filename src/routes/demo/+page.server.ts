import type { PageServerLoad } from './$types';
import { deserializeGraph } from '$lib/shareable/shareable';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const encoded = url.searchParams.get('data');

	if (!encoded) {
		throw error(400, 'Missing data parameter. Share links must include ?data=<encoded-graph>');
	}

	const result = deserializeGraph(encoded);

	if (!result.success) {
		throw error(400, `Invalid share data: ${result.error}`);
	}

	return {
		sharePayload: result.payload,
		isSharedDemo: true
	};
};
