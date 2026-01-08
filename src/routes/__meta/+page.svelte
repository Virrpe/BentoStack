<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let metadata = $state<any>(null);
	let copyFeedback = $state<string | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (!browser) return;

		try {
			const response = await fetch('/__meta');
			if (!response.ok) {
				throw new Error(`Failed to fetch metadata: ${response.statusText}`);
			}
			metadata = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			loading = false;
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
</script>

<svelte:head>
	<title>BentoStack - Build Metadata</title>
	<meta name="description" content="Build and deployment metadata for BentoStack" />
</svelte:head>

<div class="meta-page">
	<header class="meta-header">
		<div class="meta-header__back">
			<a href="/">← Back to Home</a>
		</div>
		<h1 class="meta-header__title">Build Metadata</h1>
		<p class="meta-header__description">
			Build and deployment information for debugging and support.
		</p>
	</header>

	<main class="meta-main">
		{#if loading}
			<div class="meta-loading">Loading metadata...</div>
		{:else if error}
			<div class="meta-error">
				<h2>Error</h2>
				<p>{error}</p>
			</div>
		{:else if metadata}
			<div class="metadata-card">
				<div class="metadata-grid">
					<div class="metadata-item">
						<div class="metadata-item__label">Name</div>
						<div class="metadata-item__value">{metadata.name}</div>
					</div>

					<div class="metadata-item">
						<div class="metadata-item__label">Version</div>
						<div class="metadata-item__value">
							{metadata.version}
							<button
								class="copy-btn"
								onclick={() => copyToClipboard(metadata.version, 'Version')}
								title="Copy version"
							>
								📋
							</button>
						</div>
					</div>

					<div class="metadata-item">
						<div class="metadata-item__label">Git SHA</div>
						<div class="metadata-item__value metadata-item__value--code">
							<code>{metadata.sha}</code>
							<button
								class="copy-btn"
								onclick={() => copyToClipboard(metadata.sha, 'Git SHA')}
								title="Copy SHA"
							>
								📋
							</button>
						</div>
					</div>

					<div class="metadata-item">
						<div class="metadata-item__label">Build Timestamp</div>
						<div class="metadata-item__value">
							{new Date(metadata.buildTimestamp).toLocaleString()}
							<button
								class="copy-btn"
								onclick={() =>
									copyToClipboard(metadata.buildTimestamp, 'Build timestamp')}
								title="Copy timestamp"
							>
								📋
							</button>
						</div>
					</div>

					<div class="metadata-item">
						<div class="metadata-item__label">Environment</div>
						<div class="metadata-item__value">
							<span class="env-badge" class:env-badge--prod={metadata.environment === 'production'}>
								{metadata.environment}
							</span>
						</div>
					</div>

					{#if metadata.deploymentUrl}
						<div class="metadata-item">
							<div class="metadata-item__label">Deployment URL</div>
							<div class="metadata-item__value metadata-item__value--link">
								<a href={metadata.deploymentUrl} target="_blank" rel="noopener noreferrer">
									{metadata.deploymentUrl}
								</a>
								<button
									class="copy-btn"
									onclick={() => copyToClipboard(metadata.deploymentUrl, 'Deployment URL')}
									title="Copy URL"
								>
									📋
								</button>
							</div>
						</div>
					{/if}
				</div>

				<div class="metadata-raw">
					<h3>Raw JSON</h3>
					<pre><code>{JSON.stringify(metadata, null, 2)}</code></pre>
					<button
						class="copy-btn-large"
						onclick={() => copyToClipboard(JSON.stringify(metadata, null, 2), 'Metadata JSON')}
					>
						Copy JSON
					</button>
				</div>
			</div>
		{/if}
	</main>

	{#if copyFeedback}
		<div class="copy-feedback">
			{copyFeedback}
		</div>
	{/if}
</div>

<style>
	.meta-page {
		min-height: 100vh;
		background: var(--bg-canvas, #0a0a0a);
		color: var(--text-primary, #ffffff);
		padding: 2rem;
	}

	.meta-header {
		max-width: 900px;
		margin: 0 auto 3rem;
		text-align: center;
	}

	.meta-header__back {
		margin-bottom: 1rem;
	}

	.meta-header__back a {
		color: var(--text-secondary, #a0a0a0);
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s;
	}

	.meta-header__back a:hover {
		color: var(--text-primary, #ffffff);
	}

	.meta-header__title {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.meta-header__description {
		font-size: 1rem;
		color: var(--text-secondary, #a0a0a0);
		margin: 0;
	}

	.meta-main {
		max-width: 900px;
		margin: 0 auto;
	}

	.meta-loading,
	.meta-error {
		text-align: center;
		padding: 3rem;
		color: var(--text-muted, #666);
	}

	.meta-error h2 {
		color: #ef4444;
		margin-bottom: 1rem;
	}

	.metadata-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
	}

	.metadata-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 640px) {
		.metadata-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.metadata-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.metadata-item__label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted, #666);
	}

	.metadata-item__value {
		font-size: 1rem;
		color: var(--text-primary, #ffffff);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.metadata-item__value--code code {
		background: rgba(0, 0, 0, 0.3);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
	}

	.metadata-item__value--link a {
		color: var(--color-accent-400, #818cf8);
		text-decoration: none;
		word-break: break-all;
	}

	.metadata-item__value--link a:hover {
		text-decoration: underline;
	}

	.env-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.env-badge--prod {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.3);
		color: #10b981;
	}

	.copy-btn {
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.metadata-raw {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: 2rem;
	}

	.metadata-raw h3 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary, #ffffff);
	}

	.metadata-raw pre {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 1rem;
		overflow-x: auto;
		margin: 0 0 1rem 0;
	}

	.metadata-raw code {
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		color: var(--text-secondary, #a0a0a0);
		line-height: 1.5;
	}

	.copy-btn-large {
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

	.copy-btn-large:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
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
