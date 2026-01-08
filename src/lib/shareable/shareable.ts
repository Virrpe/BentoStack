import LZString from 'lz-string';
import type { FlowNode, FlowEdge } from '$lib/graph/graph-types';

/**
 * SharePayload structure with version for future compatibility.
 * Contains only nodes and edges - vibes are recomputed on load.
 */
export interface SharePayload {
	v: 1;
	graph: {
		nodes: FlowNode[];
		edges: FlowEdge[];
	};
}

/**
 * Serialization result with success flag and metadata
 */
export type SerializeResult =
	| {
			success: true;
			encoded: string;
			stats: {
				nodeCount: number;
				edgeCount: number;
				rawLength: number;
				encodedLength: number;
			};
	  }
	| {
			success: false;
			error: string;
	  };

/**
 * Deserialization result with success flag
 */
export type DeserializeResult =
	| {
			success: true;
			payload: SharePayload;
	  }
	| {
			success: false;
			error: string;
	  };

/**
 * URL generation result
 */
export type GenerateUrlResult =
	| {
			success: true;
			url: string;
			encoded: string;
	  }
	| {
			success: false;
			error: string;
	  };

// Validation limits
export const MAX_NODES = 100;
export const MAX_EDGES = 300;
export const MAX_ENCODED_LENGTH = 5000;

/**
 * Canonicalizes nodes by sorting them by ID using locale-aware comparison.
 * Ensures deterministic ordering for identical graphs.
 */
function canonicalizeNodes(nodes: FlowNode[]): FlowNode[] {
	return [...nodes].sort((a, b) => a.id.localeCompare(b.id, 'en'));
}

/**
 * Canonicalizes edges by sorting them by source → target → id.
 * Ensures deterministic ordering for identical graphs.
 */
function canonicalizeEdges(edges: FlowEdge[]): FlowEdge[] {
	return [...edges].sort((a, b) => {
		if (a.source !== b.source) {
			return a.source.localeCompare(b.source, 'en');
		}
		if (a.target !== b.target) {
			return a.target.localeCompare(b.target, 'en');
		}
		return a.id.localeCompare(b.id, 'en');
	});
}

/**
 * Validates a SharePayload structure.
 * Returns error message if invalid, undefined if valid.
 */
function validatePayload(payload: any): string | undefined {
	if (!payload || typeof payload !== 'object') {
		return 'Payload must be an object';
	}

	if (payload.v !== 1) {
		return 'Invalid or missing version field (expected v=1)';
	}

	if (!payload.graph || typeof payload.graph !== 'object') {
		return 'Missing or invalid graph field';
	}

	const { nodes, edges } = payload.graph;

	if (!Array.isArray(nodes)) {
		return 'Nodes must be an array';
	}

	if (!Array.isArray(edges)) {
		return 'Edges must be an array';
	}

	if (nodes.length > MAX_NODES) {
		return `Too many nodes (max ${MAX_NODES}, got ${nodes.length})`;
	}

	if (edges.length > MAX_EDGES) {
		return `Too many edges (max ${MAX_EDGES}, got ${edges.length})`;
	}

	// Validate node structure
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (!node.id || typeof node.id !== 'string') {
			return `Invalid node at index ${i}: missing or invalid id`;
		}
		if (!node.type || typeof node.type !== 'string') {
			return `Invalid node at index ${i}: missing or invalid type`;
		}
		if (!node.position || typeof node.position !== 'object') {
			return `Invalid node at index ${i}: missing or invalid position`;
		}
		if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
			return `Invalid node at index ${i}: position must have numeric x and y`;
		}
		if (!node.data || typeof node.data !== 'object') {
			return `Invalid node at index ${i}: missing or invalid data`;
		}
	}

	// Validate edge structure
	for (let i = 0; i < edges.length; i++) {
		const edge = edges[i];
		if (!edge.id || typeof edge.id !== 'string') {
			return `Invalid edge at index ${i}: missing or invalid id`;
		}
		if (!edge.source || typeof edge.source !== 'string') {
			return `Invalid edge at index ${i}: missing or invalid source`;
		}
		if (!edge.target || typeof edge.target !== 'string') {
			return `Invalid edge at index ${i}: missing or invalid target`;
		}
	}

	return undefined;
}

/**
 * Serializes a graph (nodes + edges) into a URL-safe compressed string.
 * Applies canonicalization for deterministic output.
 *
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @returns SerializeResult with encoded string or error
 */
export function serializeGraph(nodes: FlowNode[], edges: FlowEdge[]): SerializeResult {
	try {
		// Validate input
		if (!Array.isArray(nodes)) {
			return { success: false, error: 'Nodes must be an array' };
		}
		if (!Array.isArray(edges)) {
			return { success: false, error: 'Edges must be an array' };
		}

		if (nodes.length > MAX_NODES) {
			return {
				success: false,
				error: `Too many nodes (max ${MAX_NODES}, got ${nodes.length})`
			};
		}

		if (edges.length > MAX_EDGES) {
			return {
				success: false,
				error: `Too many edges (max ${MAX_EDGES}, got ${edges.length})`
			};
		}

		// Canonicalize for deterministic ordering
		const sortedNodes = canonicalizeNodes(nodes);
		const sortedEdges = canonicalizeEdges(edges);

		// Build payload
		const payload: SharePayload = {
			v: 1,
			graph: {
				nodes: sortedNodes,
				edges: sortedEdges
			}
		};

		// Serialize to JSON
		const jsonString = JSON.stringify(payload);
		const rawLength = jsonString.length;

		// Compress using LZ-string
		const encoded = LZString.compressToEncodedURIComponent(jsonString);
		const encodedLength = encoded.length;

		// Validate encoded length
		if (encodedLength > MAX_ENCODED_LENGTH) {
			return {
				success: false,
				error: `Encoded payload too large (max ${MAX_ENCODED_LENGTH} chars, got ${encodedLength})`
			};
		}

		return {
			success: true,
			encoded,
			stats: {
				nodeCount: nodes.length,
				edgeCount: edges.length,
				rawLength,
				encodedLength
			}
		};
	} catch (error) {
		return {
			success: false,
			error: `Serialization failed: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}

/**
 * Deserializes a compressed string back into a SharePayload.
 * Validates the payload structure and content.
 *
 * @param encoded - URL-safe compressed string
 * @returns DeserializeResult with payload or error
 */
export function deserializeGraph(encoded: string): DeserializeResult {
	try {
		// Validate input
		if (!encoded || typeof encoded !== 'string') {
			return { success: false, error: 'Encoded string is required' };
		}

		if (encoded.length > MAX_ENCODED_LENGTH) {
			return {
				success: false,
				error: `Encoded string too long (max ${MAX_ENCODED_LENGTH} chars, got ${encoded.length})`
			};
		}

		// Decompress
		const jsonString = LZString.decompressFromEncodedURIComponent(encoded);

		if (!jsonString) {
			return {
				success: false,
				error: 'Failed to decompress data (corrupted or invalid encoding)'
			};
		}

		// Parse JSON
		let payload: any;
		try {
			payload = JSON.parse(jsonString);
		} catch (parseError) {
			return {
				success: false,
				error: `Invalid JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
			};
		}

		// Validate payload structure
		const validationError = validatePayload(payload);
		if (validationError) {
			return { success: false, error: validationError };
		}

		return {
			success: true,
			payload: payload as SharePayload
		};
	} catch (error) {
		return {
			success: false,
			error: `Deserialization failed: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}

/**
 * Generates a complete shareable URL for the /demo page.
 *
 * @param nodes - Array of graph nodes
 * @param edges - Array of graph edges
 * @param baseUrl - Base URL (e.g., window.location.origin)
 * @returns GenerateUrlResult with full URL or error
 */
export function generateShareUrl(
	nodes: FlowNode[],
	edges: FlowEdge[],
	baseUrl: string
): GenerateUrlResult {
	const result = serializeGraph(nodes, edges);

	if (!result.success) {
		return { success: false, error: result.error };
	}

	const url = `${baseUrl}/demo?data=${result.encoded}`;

	return {
		success: true,
		url,
		encoded: result.encoded
	};
}
