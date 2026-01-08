<script lang="ts">
	import { goto } from '$app/navigation';
	import BentoGrid from '$lib/components/builder/BentoGrid.svelte';
	import { DEFAULT_SLOTS } from '$lib/builder/default-slots';
	import BackgroundBeams from '$lib/components/ui/BackgroundBeams.svelte';
	import AmbientDrift from '$lib/components/ui/AmbientDrift.svelte';

	let selectedTools = $state<Record<string, string>>({
		frontend: 'sveltekit',
		auth: 'lucia',
		database: 'turso',
		orm: 'drizzle'
	});
</script>

<div class="builder-page">
	<AmbientDrift />
	<BackgroundBeams />

	<div class="builder-content">
		<header class="builder-header">
			<h1 class="builder-title">Build Your Stack</h1>
			<p class="builder-description">
				Select tools for each category to see instant compatibility analysis
			</p>
		</header>

		<BentoGrid slotsConfig={DEFAULT_SLOTS} bind:selectedTools />

		<div class="builder-actions">
			<button class="action-button action-button--secondary" onclick={() => goto('/demos')}>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 10h16M4 14h16"
					/>
				</svg>
				View Demos
			</button>
			<button class="action-button action-button--primary" onclick={() => goto('/canvas')}>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Advanced Mode
			</button>
		</div>
	</div>
</div>

<style>
	.builder-page {
		position: relative;
		min-height: 100vh;
		width: 100%;
		overflow-x: hidden;
		background: var(--bg-page);
	}

	.builder-content {
		position: relative;
		z-index: 1;
		padding-top: 4rem;
	}

	.builder-header {
		text-align: center;
		margin-bottom: 3rem;
		padding: 0 2rem;
	}

	.builder-title {
		font-size: 3rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
		background: linear-gradient(135deg, #fff 0%, #999 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.builder-description {
		font-size: 1.25rem;
		color: var(--text-secondary);
		margin: 0;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.builder-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		margin-top: 2rem;
	}

	.action-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		background: rgba(255, 255, 255, 0.03);
		color: var(--text-secondary);
	}

	.action-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.action-button--primary {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		color: var(--text-primary);
	}

	.action-button--primary:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.action-button--secondary:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.15);
		color: var(--text-primary);
	}

	.action-button svg {
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.builder-content {
			padding-top: 2rem;
		}

		.builder-title {
			font-size: 2rem;
		}

		.builder-description {
			font-size: 1rem;
		}

		.builder-actions {
			flex-direction: column;
			padding: 1rem;
		}

		.action-button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
