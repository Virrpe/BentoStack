<script lang="ts">
	import type { SlotConfig } from '$lib/builder/types';
	import BentoCard from './BentoCard.svelte';

	interface Props {
		slotsConfig: SlotConfig[];
		selectedTools?: Record<string, string>;
	}

	let { slotsConfig, selectedTools = $bindable({}) }: Props = $props();

	function handleToolSelect(slotId: string, toolId: string) {
		selectedTools[slotId] = toolId;
	}
</script>

<div class="bento-grid-container">
	<div class="bento-grid" class:bento-grid--four={slotsConfig.length === 4}>
		{#each slotsConfig as slot (slot.id)}
			<BentoCard
				{slot}
				bind:selectedTool={selectedTools[slot.id]}
				onToolSelect={(toolId) => handleToolSelect(slot.id, toolId)}
			/>
		{/each}
	</div>

	{#if Object.keys(selectedTools).length > 0}
		<div class="bento-grid__summary">
			<div class="summary-content">
				<div class="summary-text">
					<h3 class="summary-title">Stack Analysis</h3>
					<p class="summary-description">
						{Object.keys(selectedTools).length} tools selected
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.bento-grid-container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.bento-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 640px) {
		.bento-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.bento-grid--four {
			grid-template-columns: repeat(2, 1fr);
			grid-auto-rows: 1fr;
		}
	}

	.bento-grid__summary {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-top: 2rem;
	}

	.summary-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.summary-text {
		flex: 1;
	}

	.summary-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
	}

	.summary-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}
</style>
