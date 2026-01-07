/**
 * Evidence system types for grounding findings with committed sources.
 */

export type SourceType =
	| 'official_docs'
	| 'vendor_docs'
	| 'github_maintainer'
	| 'release_notes'
	| 'user_report'
	| 'community';

export type EvidenceItem = {
	url: string;
	canonicalUrl?: string;
	sourceType: SourceType;
	excerpt: string;
	note?: string;
	retrievedDate?: string;
};

export type EvidencePack = {
	ruleId: string;
	kind: 'risk' | 'fix' | 'positive';
	claim: string;
	scope: string;
	severity: 'high' | 'medium' | 'low' | 'info';
	confidence: 'high' | 'medium' | 'low';
	tags?: string[];
	evidence: EvidenceItem[];
	counterEvidence: EvidenceItem[];
	fixRuleIds?: string[];
	needsVerification?: boolean;
};

export type EvidenceIndex = Record<string, EvidencePack>;
