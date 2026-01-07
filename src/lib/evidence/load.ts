/**
 * Evidence pack loader with quality gate and deterministic canonicalization.
 */
import type { EvidencePack, EvidenceIndex, EvidenceItem, SourceType } from './types';
import { canonicalizeUrl } from './canonicalize';

/**
 * Valid source types for validation
 */
const VALID_SOURCE_TYPES: SourceType[] = [
	'official_docs',
	'vendor_docs',
	'github_maintainer',
	'release_notes',
	'user_report',
	'community'
];

/**
 * Count words in a string (simple whitespace-based).
 */
function countWords(text: string): number {
	return text.trim().split(/\s+/).length;
}

/**
 * Validate and canonicalize evidence items.
 * Marks items as invalid if excerpt > 25 words or sourceType is invalid.
 */
function processEvidenceItems(items: EvidenceItem[]): EvidenceItem[] {
	return items
		.map(item => {
			let note = item.note || '';
			const wordCount = countWords(item.excerpt);

			// Validate excerpt length
			if (wordCount > 25) {
				note = (note ? note + ' | ' : '') + 'INVALID: Excerpt exceeds 25 words';
			}

			// Validate sourceType
			if (!VALID_SOURCE_TYPES.includes(item.sourceType)) {
				note = (note ? note + ' | ' : '') + `INVALID_SOURCE_TYPE: ${item.sourceType}`;
			}

			// Use canonicalUrl if present, otherwise canonicalize url
			const canonicalizedUrl = item.canonicalUrl || canonicalizeUrl(item.url);

			return {
				...item,
				url: canonicalizeUrl(item.url), // Always canonicalize the url field
				canonicalUrl: canonicalizedUrl, // Preserve or set canonicalUrl
				note: note || undefined
			};
		})
		.sort((a, b) => {
			// Sort by canonicalUrl if present, otherwise by canonicalized url
			const keyA = a.canonicalUrl || a.url;
			const keyB = b.canonicalUrl || b.url;
			return keyA.localeCompare(keyB);
		});
}

/**
 * Apply quality gate: check for primary evidence and downgrade confidence if needed.
 */
function applyQualityGate(pack: EvidencePack): EvidencePack {
	const hasPrimaryEvidence =
		pack.evidence.length > 0 &&
		pack.evidence.some(e => e.excerpt.trim().length > 0 && !e.note?.includes('INVALID'));

	if (!hasPrimaryEvidence) {
		return {
			...pack,
			confidence: 'low',
			needsVerification: true
		};
	}

	// Check if all valid evidence is community-only (downgrade confidence)
	const validEvidence = pack.evidence.filter(e => !e.note?.includes('INVALID'));
	const hasNonCommunityEvidence = validEvidence.some(e => e.sourceType !== 'community');

	if (validEvidence.length > 0 && !hasNonCommunityEvidence && pack.confidence === 'high') {
		// Downgrade from high to medium if only community sources
		return {
			...pack,
			confidence: 'medium'
		};
	}

	return pack;
}

/**
 * Load all evidence packs from the packs directory.
 * Returns a deterministic index keyed by ruleId.
 */
export function loadEvidenceIndex(): EvidenceIndex {
	// Use import.meta.glob to eagerly load all JSON files
	const packFiles = import.meta.glob<EvidencePack>('./packs/*.json', { eager: true, import: 'default' });

	const index: EvidenceIndex = {};

	for (const [path, pack] of Object.entries(packFiles)) {
		// Process evidence and counterEvidence
		const processed: EvidencePack = {
			...pack,
			evidence: processEvidenceItems(pack.evidence),
			counterEvidence: processEvidenceItems(pack.counterEvidence)
		};

		// Apply quality gate
		const validated = applyQualityGate(processed);

		index[validated.ruleId] = validated;
	}

	return index;
}
