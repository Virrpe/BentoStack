<script lang="ts">
	import { VibeEngine, vibeEngine } from '$lib/vibe/vibe-engine.svelte';
	import type { VibeSnapshot } from '$lib/vibe/snapshot';
	import { buildReportData, buildInstallCommand, buildReadmeSnippet, buildReportMarkdown } from '$lib/blueprint/builders';
	import { loadEvidenceIndex } from '$lib/evidence/load';
	import { loadGraph } from '$lib/utils/storage';
	import { generateShareUrl } from '$lib/shareable/shareable';
	import VibeBadge from '$lib/components/vibe/VibeBadge.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let reportData = $state<ReturnType<typeof buildReportData> | null>(null);
	let copyFeedback = $state<string | null>(null);
	let isEmpty = $state(false);
	let expandedEvidence = $state<Record<string, boolean>>({});
	let shareUrl = $state<string>('');

	// Computed: separate findings by type using $derived
	let topFindings = $derived(reportData?.findings.filter(f => f.type === 'collision' || f.type === 'low-score') ?? []);
	let risks = $derived(reportData?.findings.filter(f => f.type === 'risk') ?? []);
	let fixes = $derived(reportData?.findings.filter(f => f.type === 'fix') ?? []);
	let positives = $derived(reportData?.findings.filter(f => f.type === 'positive') ?? []);

	// Seed graph (same as canvas page for empty state)
	const seedNodes = [
		{ id: 'frontend', type: 'stack', position: { x: 40, y: 120 }, data: { label: 'Frontend', toolId: 'sveltekit', category: 'Frontend' } },
		{ id: 'auth', type: 'stack', position: { x: 360, y: 40 }, data: { label: 'Auth', toolId: 'lucia', category: 'Auth' } },
		{ id: 'db', type: 'stack', position: { x: 360, y: 220 }, data: { label: 'Database', toolId: 'turso', category: 'Database' } },
		{ id: 'orm', type: 'stack', position: { x: 680, y: 140 }, data: { label: 'ORM', toolId: 'drizzle', category: 'ORM' } }
	];

	const seedEdges = [
		{ id: 'e1', source: 'frontend', target: 'auth', type: 'stack' },
		{ id: 'e2', source: 'auth', target: 'db', type: 'stack' },
		{ id: 'e3', source: 'frontend', target: 'orm', type: 'stack' },
		{ id: 'e4', source: 'orm', target: 'db', type: 'stack' }
	];

	// Generate report on mount (client-side only, SSR-safe)
	onMount(() => {
		if (!browser) return;

		// Load graph from localStorage or use seed
		const saved = loadGraph();
		const nodes = saved?.nodes ?? seedNodes;
		const edges = saved?.edges ?? seedEdges;

		// Check if graph is truly empty (no nodes)
		isEmpty = nodes.length === 0;

		// Create a temporary engine instance to compute vibes
		const tempEngine = new VibeEngine();
		tempEngine.init(nodes, edges);

		// Build snapshot from the loaded data
		// Use JSON round-trip to remove Svelte proxies from $state
		const snapshot: VibeSnapshot = {
			nodes: JSON.parse(JSON.stringify(tempEngine.nodes)),
			edges: JSON.parse(JSON.stringify(tempEngine.edges)),
			nodeVibes: JSON.parse(JSON.stringify(tempEngine.nodeVibes)),
			edgeVibes: JSON.parse(JSON.stringify(tempEngine.edgeVibes)),
			globalVibe: tempEngine.globalVibe
		};

		// Load evidence index
		const evidenceIndex = loadEvidenceIndex();

		reportData = buildReportData(snapshot, vibeEngine.registry, undefined, evidenceIndex);

		// Generate share URL if graph has nodes
		if (nodes.length > 0) {
			const result = generateShareUrl(nodes, edges, window.location.origin);
			if (result.success) {
				shareUrl = result.url;
			}
		}
	});

	async function copyToClipboard(text: string, label: string) {
		if (typeof navigator === 'undefined' || !navigator.clipboard) {
			alert('Clipboard not available');
			return;
		}

		try {
			await navigator.clipboard.writeText(text);
			copyFeedback = `${label} copied!`;
			setTimeout(() => {
				copyFeedback = null;
			}, 2000);
		} catch (err) {
			alert('Failed to copy');
		}
	}

	function downloadFile(content: string, filename: string) {
		const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	function handleCopyManifest() {
		if (!reportData) return;
		const json = JSON.stringify(reportData.manifest, null, 2);
		copyToClipboard(json, 'Manifest');
	}

	function handleCopyReadme() {
		if (!reportData) return;
		const readme = buildReadmeSnippet(reportData.manifest);
		copyToClipboard(readme, 'README snippet');
	}

	function handleCopyInstall() {
		if (!reportData) return;
		const cmd = buildInstallCommand(reportData.manifest);
		copyToClipboard(cmd, 'Install command');
	}

	function handleDownloadManifest() {
		if (!reportData) return;
		const json = JSON.stringify(reportData.manifest, null, 2);
		downloadFile(json, 'bentostack.json');
	}

	function handleDownloadReport() {
		if (!reportData) return;
		const md = buildReportMarkdown(reportData);
		downloadFile(md, 'REPORT.md');
	}

	function handleDownloadBlueprint() {
		if (!reportData) return;
		const readme = buildReadmeSnippet(reportData.manifest);
		const install = buildInstallCommand(reportData.manifest);
		const blueprint = `${readme}\n## Installation\n\n\`\`\`bash\n${install}\n\`\`\`\n`;
		downloadFile(blueprint, 'BLUEPRINT.md');
	}

	function toggleEvidence(key: string) {
		expandedEvidence[key] = !expandedEvidence[key];
	}

	function handleCopyShareLink() {
		if (!shareUrl) return;
		copyToClipboard(shareUrl, 'Share link');
	}
</script>

<div class="report-page">
	<header class="report-header">
		<div class="report-header__back">
			<a href="/">← Back to Canvas</a>
		</div>
		<h1 class="report-header__title">Vibe Report</h1>
		{#if reportData}
			<div class="report-header__vibe">
				<VibeBadge score={reportData.globalVibe} />
				<span class="report-header__tier">{reportData.tier}</span>
			</div>
			<div class="report-header__timestamp">
				Generated: {new Date(reportData.timestamp).toLocaleString()}
			</div>
		{/if}
	</header>

	{#if !reportData}
		<div class="report-loading">Loading report data...</div>
	{:else if isEmpty}
		<div class="report-empty-state">
			<h2>No Stack Data</h2>
			<p>Your canvas is empty. Head back to the canvas to start building your stack!</p>
			<a href="/" class="cta-button">Go to Canvas</a>
		</div>
	{:else}
		<main class="report-main">
			<!-- Top Findings (collisions + low-score) -->
			<section class="report-section">
				<h2 class="report-section__title">Top Findings</h2>
				{#if topFindings.length === 0}
					<p class="report-empty">No major issues detected. Your stack is looking good!</p>
				{:else}
					<div class="findings-list">
						{#each topFindings as finding, i}
							{@const key = `top-${i}`}
							<div class="finding-card" data-severity={finding.severity}>
								<div class="finding-card__header">
									<span class="finding-card__number">{i + 1}</span>
									<span class="finding-card__severity">
										{finding.severity === 'high' ? '🔴' : finding.severity === 'medium' ? '🟡' : '🟢'}
									</span>
									<h3 class="finding-card__what">{finding.what}</h3>
									{#if finding.evidencePack}
										<button
											class="evidence-toggle"
											onclick={() => toggleEvidence(key)}
											aria-label="Toggle evidence details"
										>
											{expandedEvidence[key] ? '▼' : '▶'} Proof
										</button>
									{/if}
								</div>
								<div class="finding-card__body">
									<div class="finding-card__row">
										<strong>Why:</strong> {finding.why}
									</div>
									<div class="finding-card__row">
										<strong>Evidence:</strong> {finding.evidence}
									</div>
									<div class="finding-card__row">
										<strong>Suggested Fix:</strong> {finding.suggestedFix}
									</div>

									{#if finding.evidencePack && expandedEvidence[key]}
										<div class="evidence-details">
											{#if finding.evidencePack.needsVerification}
												<div class="evidence-warning">
													⚠️ This claim requires verification - insufficient primary evidence.
												</div>
											{/if}

											<div class="evidence-meta">
												<div><strong>Confidence:</strong> {finding.evidencePack.confidence}</div>
												<div><strong>Scope:</strong> {finding.evidencePack.scope}</div>
											</div>

											{#if finding.evidencePack.evidence.length > 0}
												<div class="evidence-section">
													<strong>Supporting Evidence:</strong>
													<ul class="evidence-list">
														{#each finding.evidencePack.evidence as item}
															<li>
																<span class="evidence-source-type">[{item.sourceType}]</span>
																{item.excerpt}
																<div class="evidence-url">
																	<a href={item.url} target="_blank" rel="noopener noreferrer">
																		{item.url}
																	</a>
																</div>
																{#if item.note}
																	<div class="evidence-note">Note: {item.note}</div>
																{/if}
															</li>
														{/each}
													</ul>
												</div>
											{/if}

											{#if finding.evidencePack.counterEvidence.length > 0}
												<div class="evidence-section">
													<strong>Counter-Evidence:</strong>
													<ul class="evidence-list">
														{#each finding.evidencePack.counterEvidence as item}
															<li>
																<span class="evidence-source-type">[{item.sourceType}]</span>
																{item.excerpt}
																<div class="evidence-url">
																	<a href={item.url} target="_blank" rel="noopener noreferrer">
																		{item.url}
																	</a>
																</div>
																{#if item.note}
																	<div class="evidence-note">Note: {item.note}</div>
																{/if}
															</li>
														{/each}
													</ul>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Risks -->
			{#if risks.length > 0}
				<section class="report-section">
					<h2 class="report-section__title">Risks</h2>
					<div class="findings-list">
						{#each risks as finding, i}
							{@const key = `risk-${i}`}
							<div class="finding-card finding-card--risk" data-severity={finding.severity}>
								<div class="finding-card__header">
									<span class="finding-card__number">{i + 1}</span>
									<span class="finding-card__severity">
										{finding.severity === 'high' ? '🔴' : finding.severity === 'medium' ? '🟡' : '🟢'}
									</span>
									<h3 class="finding-card__what">{finding.what}</h3>
									{#if finding.evidencePack}
										<button
											class="evidence-toggle"
											onclick={() => toggleEvidence(key)}
											aria-label="Toggle evidence details"
										>
											{expandedEvidence[key] ? '▼' : '▶'} Proof
										</button>
									{/if}
								</div>
								<div class="finding-card__body">
									<div class="finding-card__row">
										<strong>Why:</strong> {finding.why}
									</div>
									<div class="finding-card__row">
										<strong>Evidence:</strong> {finding.evidence}
									</div>
									<div class="finding-card__row">
										<strong>Suggested Fix:</strong> {finding.suggestedFix}
									</div>

									{#if finding.evidencePack && expandedEvidence[key]}
										<div class="evidence-details">
											{#if finding.evidencePack.needsVerification}
												<div class="evidence-warning">
													⚠️ This claim requires verification - insufficient primary evidence.
												</div>
											{/if}

											<div class="evidence-meta">
												<div><strong>Confidence:</strong> {finding.evidencePack.confidence}</div>
												<div><strong>Scope:</strong> {finding.evidencePack.scope}</div>
											</div>

											{#if finding.evidencePack.evidence.length > 0}
												<div class="evidence-section">
													<strong>Supporting Evidence:</strong>
													<ul class="evidence-list">
														{#each finding.evidencePack.evidence as item}
															<li>
																<span class="evidence-source-type">[{item.sourceType}]</span>
																{item.excerpt}
																<div class="evidence-url">
																	<a href={item.url} target="_blank" rel="noopener noreferrer">
																		{item.url}
																	</a>
																</div>
																{#if item.note}
																	<div class="evidence-note">Note: {item.note}</div>
																{/if}
															</li>
														{/each}
													</ul>
												</div>
											{/if}

											{#if finding.evidencePack.counterEvidence.length > 0}
												<div class="evidence-section">
													<strong>Counter-Evidence:</strong>
													<ul class="evidence-list">
														{#each finding.evidencePack.counterEvidence as item}
															<li>
																<span class="evidence-source-type">[{item.sourceType}]</span>
																{item.excerpt}
																<div class="evidence-url">
																	<a href={item.url} target="_blank" rel="noopener noreferrer">
																		{item.url}
																	</a>
																</div>
																{#if item.note}
																	<div class="evidence-note">Note: {item.note}</div>
																{/if}
															</li>
														{/each}
													</ul>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Fixes -->
			{#if fixes.length > 0}
				<section class="report-section">
					<h2 class="report-section__title">Fixes</h2>
					<div class="findings-list">
						{#each fixes as finding, i}
							{@const key = `fix-${i}`}
							<div class="finding-card finding-card--fix">
								<div class="finding-card__header">
									<span class="finding-card__number">{i + 1}</span>
									<span class="finding-card__severity">ℹ️</span>
									<h3 class="finding-card__what">{finding.what}</h3>
									{#if finding.evidencePack}
										<button
											class="evidence-toggle"
											onclick={() => toggleEvidence(key)}
											aria-label="Toggle evidence details"
										>
											{expandedEvidence[key] ? '▼' : '▶'} Proof
										</button>
									{/if}
								</div>
								<div class="finding-card__body">
									<div class="finding-card__row">
										<strong>What:</strong> {finding.why}
									</div>
									<div class="finding-card__row">
										<strong>Evidence:</strong> {finding.evidence}
									</div>
									<div class="finding-card__row">
										<strong>Scope:</strong> {finding.suggestedFix}
									</div>

									{#if finding.evidencePack && expandedEvidence[key]}
										<div class="evidence-details">
											<div class="evidence-meta">
												<div><strong>Confidence:</strong> {finding.evidencePack.confidence}</div>
												<div><strong>Scope:</strong> {finding.evidencePack.scope}</div>
											</div>

											{#if finding.evidencePack.evidence.length > 0}
												<div class="evidence-section">
													<strong>Supporting Evidence:</strong>
													<ul class="evidence-list">
														{#each finding.evidencePack.evidence as item}
															<li>
																<span class="evidence-source-type">[{item.sourceType}]</span>
																{item.excerpt}
																<div class="evidence-url">
																	<a href={item.url} target="_blank" rel="noopener noreferrer">
																		{item.url}
																	</a>
																</div>
																{#if item.note}
																	<div class="evidence-note">Note: {item.note}</div>
																{/if}
															</li>
														{/each}
													</ul>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Greenlights -->
			{#if positives.length > 0}
				<section class="report-section">
					<h2 class="report-section__title">Greenlights</h2>
					<div class="findings-list">
						{#each positives as finding, i}
							{@const key = `positive-${i}`}
							<div class="finding-card finding-card--positive">
								<div class="finding-card__header">
									<span class="finding-card__number">{i + 1}</span>
									<span class="finding-card__severity">✅</span>
									<h3 class="finding-card__what">{finding.what}</h3>
									{#if finding.evidencePack}
										<button
											class="evidence-toggle"
											onclick={() => toggleEvidence(key)}
											aria-label="Toggle evidence details"
										>
											{expandedEvidence[key] ? '▼' : '▶'} Proof
										</button>
									{/if}
								</div>
								<div class="finding-card__body">
									<div class="finding-card__row">
										<strong>What:</strong> {finding.why}
									</div>
									<div class="finding-card__row">
										<strong>Evidence:</strong> {finding.evidence}
									</div>
									<div class="finding-card__row">
										<strong>Scope:</strong> {finding.suggestedFix}
									</div>

									{#if finding.evidencePack && expandedEvidence[key]}
										<div class="evidence-details">
											<div class="evidence-meta">
												<div><strong>Confidence:</strong> {finding.evidencePack.confidence}</div>
												<div><strong>Scope:</strong> {finding.evidencePack.scope}</div>
											</div>

											{#if finding.evidencePack.evidence.length > 0}
												<div class="evidence-section">
													<strong>Supporting Evidence:</strong>
													<ul class="evidence-list">
														{#each finding.evidencePack.evidence as item}
															<li>
																<span class="evidence-source-type">[{item.sourceType}]</span>
																{item.excerpt}
																<div class="evidence-url">
																	<a href={item.url} target="_blank" rel="noopener noreferrer">
																		{item.url}
																	</a>
																</div>
																{#if item.note}
																	<div class="evidence-note">Note: {item.note}</div>
																{/if}
															</li>
														{/each}
													</ul>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Recommended Swaps -->
			<section class="report-section">
				<h2 class="report-section__title">Recommended Swaps</h2>
				{#if reportData.swaps.length === 0}
					<p class="report-empty">No collisions detected. No swaps needed.</p>
				{:else}
					<div class="swaps-list">
						{#each reportData.swaps as swap}
							<div class="swap-card">
								<h3 class="swap-card__title">{swap.sourceTool} ↔ {swap.targetTool}</h3>
								{#if swap.alternatives.length === 0}
									<p class="swap-card__empty">No compatible alternatives found in registry.</p>
								{:else}
									<div class="swap-card__alternatives">
										<strong>Consider:</strong>
										<ul class="swap-card__list">
											{#each swap.alternatives as alt}
												<li>
													<strong>{alt.toolName}:</strong> {alt.reason}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Manifest -->
			<section class="report-section">
				<h2 class="report-section__title">Manifest</h2>
				<div class="export-card">
					<p class="export-card__description">
						JSON manifest containing your stack configuration (tools, nodes, edges, vibe score).
					</p>
					<div class="export-card__actions">
						<button class="export-button" onclick={handleCopyManifest}>
							Copy JSON
						</button>
						<button class="export-button" onclick={handleDownloadManifest}>
							Download bentostack.json
						</button>
					</div>
				</div>
			</section>

			<!-- Blueprint -->
			<section class="report-section">
				<h2 class="report-section__title">Blueprint</h2>
				<div class="export-card">
					<p class="export-card__description">
						Shareable blueprint with README snippet and install command.
					</p>
					<div class="export-card__actions">
						<button class="export-button" onclick={handleCopyReadme}>
							Copy README Snippet
						</button>
						<button class="export-button" onclick={handleCopyInstall}>
							Copy Install Command
						</button>
						<button class="export-button" onclick={handleDownloadBlueprint}>
							Download BLUEPRINT.md
						</button>
					</div>
				</div>
			</section>

			<!-- Full Report Export -->
			<section class="report-section">
				<h2 class="report-section__title">Export Full Report</h2>
				<div class="export-card">
					<p class="export-card__description">
						Download the complete report in markdown format.
					</p>
					<div class="export-card__actions">
						<button class="export-button export-button--primary" onclick={handleDownloadReport}>
							Download REPORT.md
						</button>
					</div>
				</div>
			</section>

			<!-- Share Link -->
			{#if shareUrl}
				<section class="report-section">
					<h2 class="report-section__title">Share This Analysis</h2>
					<div class="export-card">
						<p class="export-card__description">
							Generate a shareable link that contains the full stack configuration. Anyone with this URL can view this analysis.
						</p>
						<div class="export-card__actions">
							<button class="export-button export-button--primary" onclick={handleCopyShareLink}>
								Copy Share Link
							</button>
						</div>
					</div>
				</section>
			{/if}
		</main>
	{/if}

	{#if copyFeedback}
		<div class="copy-feedback">
			{copyFeedback}
		</div>
	{/if}
</div>

<style>
	.report-page {
		min-height: 100vh;
		background: var(--bg-canvas, #0a0a0a);
		color: var(--text-primary, #ffffff);
		padding: 2rem;
	}

	.report-header {
		max-width: 900px;
		margin: 0 auto 3rem;
		text-align: center;
	}

	.report-header__back {
		margin-bottom: 1rem;
	}

	.report-header__back a {
		color: var(--text-secondary, #a0a0a0);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.report-header__back a:hover {
		color: var(--text-primary, #ffffff);
	}

	.report-header__title {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.report-header__vibe {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.report-header__tier {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-accent-400, #818cf8);
	}

	.report-header__timestamp {
		font-size: 0.875rem;
		color: var(--text-muted, #666);
	}

	.report-loading {
		text-align: center;
		padding: 3rem;
		color: var(--text-muted, #666);
	}

	.report-empty-state {
		max-width: 600px;
		margin: 3rem auto;
		text-align: center;
		padding: 3rem 2rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
	}

	.report-empty-state h2 {
		font-size: 1.75rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary, #ffffff);
	}

	.report-empty-state p {
		font-size: 1rem;
		color: var(--text-secondary, #a0a0a0);
		margin: 0 0 2rem 0;
		line-height: 1.6;
	}

	.cta-button {
		display: inline-block;
		padding: 0.875rem 2rem;
		background: var(--color-accent-500, #6366f1);
		border: 1px solid var(--color-accent-500, #6366f1);
		border-radius: 0.5rem;
		color: white;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s;
	}

	.cta-button:hover {
		background: var(--color-accent-400, #818cf8);
		border-color: var(--color-accent-400, #818cf8);
		transform: translateY(-2px);
	}

	.report-main {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.report-section {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1.5rem;
	}

	.report-section__title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary, #ffffff);
	}

	.report-empty {
		color: var(--text-secondary, #a0a0a0);
		font-style: italic;
	}

	.findings-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.finding-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.finding-card[data-severity="high"] {
		border-left: 3px solid #ef4444;
	}

	.finding-card[data-severity="medium"] {
		border-left: 3px solid #f59e0b;
	}

	.finding-card[data-severity="low"] {
		border-left: 3px solid #10b981;
	}

	.finding-card--fix {
		border-left: 3px solid #818cf8;
	}

	.finding-card--positive {
		border-left: 3px solid #10b981;
		background: rgba(16, 185, 129, 0.03);
	}

	.finding-card__header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.finding-card__number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.finding-card__severity {
		font-size: 1.25rem;
	}

	.finding-card__what {
		flex: 1;
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.finding-card__body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary, #a0a0a0);
	}

	.finding-card__row {
		line-height: 1.5;
	}

	.evidence-toggle {
		margin-left: auto;
		padding: 0.375rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.375rem;
		color: var(--text-primary, #ffffff);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.evidence-toggle:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.evidence-details {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.evidence-warning {
		padding: 0.5rem 0.75rem;
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 0.375rem;
		color: #fbbf24;
		margin-bottom: 0.75rem;
		font-size: 0.8125rem;
	}

	.evidence-meta {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 0.75rem;
		color: var(--text-secondary, #a0a0a0);
		font-size: 0.8125rem;
	}

	.evidence-section {
		margin-top: 0.75rem;
	}

	.evidence-section strong {
		color: var(--text-primary, #ffffff);
		display: block;
		margin-bottom: 0.5rem;
	}

	.evidence-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.evidence-list li {
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border-left: 2px solid rgba(99, 102, 241, 0.5);
		border-radius: 0.25rem;
		color: var(--text-secondary, #a0a0a0);
		line-height: 1.5;
	}

	.evidence-source-type {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background: rgba(99, 102, 241, 0.2);
		border-radius: 0.25rem;
		color: var(--color-accent-400, #818cf8);
		font-size: 0.75rem;
		font-weight: 600;
		margin-right: 0.5rem;
	}

	.evidence-url {
		margin-top: 0.375rem;
		font-size: 0.75rem;
	}

	.evidence-url a {
		color: var(--color-accent-400, #818cf8);
		text-decoration: none;
		word-break: break-all;
	}

	.evidence-url a:hover {
		text-decoration: underline;
	}

	.evidence-note {
		margin-top: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.25rem;
		color: var(--text-muted, #666);
		font-size: 0.75rem;
		font-style: italic;
	}

	.swaps-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.swap-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.swap-card__title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		color: var(--color-collision-400, #ef4444);
	}

	.swap-card__empty {
		font-size: 0.875rem;
		color: var(--text-muted, #666);
		font-style: italic;
	}

	.swap-card__alternatives {
		font-size: 0.875rem;
		color: var(--text-secondary, #a0a0a0);
	}

	.swap-card__list {
		margin: 0.5rem 0 0 0;
		padding-left: 1.5rem;
	}

	.swap-card__list li {
		margin-bottom: 0.25rem;
		line-height: 1.5;
	}

	.export-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.export-card__description {
		font-size: 0.875rem;
		color: var(--text-secondary, #a0a0a0);
		margin: 0;
	}

	.export-card__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.export-button {
		padding: 0.625rem 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: var(--text-primary, #ffffff);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.export-button:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.export-button--primary {
		background: var(--color-accent-500, #6366f1);
		border-color: var(--color-accent-500, #6366f1);
	}

	.export-button--primary:hover {
		background: var(--color-accent-400, #818cf8);
		border-color: var(--color-accent-400, #818cf8);
	}

	.copy-feedback {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		background: var(--color-accent-500, #6366f1);
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
