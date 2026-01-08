<script lang="ts">
	import type { SlotConfig } from '$lib/builder/types';
	import { registry } from '$lib/registry';
	import VibeBadge from '$lib/components/vibe/VibeBadge.svelte';

	interface Props {
		slot: SlotConfig;
		selectedTool?: string;
		onToolSelect: (toolId: string) => void;
	}

	let { slot, selectedTool = $bindable(), onToolSelect }: Props = $props();

	const categoryTools = $derived(
		registry.filter((tool) => tool.category === slot.category)
	);

	let isOpen = $state(false);

	function selectTool(toolId: string) {
		selectedTool = toolId;
		onToolSelect(toolId);
		isOpen = false;
	}

	const selectedToolData = $derived(
		selectedTool ? registry.find((t) => t.id === selectedTool) : null
	);
</script>

<div class="bento-card">
	<div class="bento-card__header">
		<div class="bento-card__title-group">
			<h3 class="bento-card__title">{slot.label}</h3>
			<p class="bento-card__description">{slot.description}</p>
		</div>
		{#if selectedToolData}
			<VibeBadge score={selectedToolData.vibe_score} />
		{/if}
	</div>

	<div class="bento-card__dropdown">
		<button
			class="dropdown-trigger"
			onclick={() => (isOpen = !isOpen)}
			aria-expanded={isOpen}
			aria-haspopup="listbox"
		>
			<span class="dropdown-trigger__text">
				{selectedToolData?.name || 'Select a tool...'}
			</span>
			<svg
				class="dropdown-trigger__icon"
				class:dropdown-trigger__icon--open={isOpen}
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="none"
			>
				<path
					d="M4 6L8 10L12 6"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>

		{#if isOpen}
			<div class="dropdown-menu" role="listbox">
				{#each categoryTools as tool (tool.id)}
					<button
						class="dropdown-item"
						class:dropdown-item--selected={selectedTool === tool.id}
						onclick={() => selectTool(tool.id)}
						role="option"
						aria-selected={selectedTool === tool.id}
					>
						<span class="dropdown-item__label">{tool.name}</span>
						<VibeBadge score={tool.vibe_score} />
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if selectedToolData}
		<div class="bento-card__footer">
			<p class="bento-card__footer-text">
				<strong>{selectedToolData.name}</strong>
				— vibe score: {selectedToolData.vibe_score}
			</p>
		</div>
	{/if}
</div>

<style>
	.bento-card {
		position: relative;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1.5rem;
		transition: all 0.2s ease;
	}

	.bento-card:hover {
		transform: translateY(-2px);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.bento-card__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.bento-card__title-group {
		flex: 1;
	}

	.bento-card__title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
	}

	.bento-card__description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.bento-card__dropdown {
		position: relative;
		margin-bottom: 1rem;
	}

	.dropdown-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--text-primary);
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.dropdown-trigger:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.dropdown-trigger__text {
		flex: 1;
		text-align: left;
	}

	.dropdown-trigger__icon {
		transition: transform 0.2s ease;
	}

	.dropdown-trigger__icon--open {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		z-index: 10;
		background: rgba(0, 0, 0, 0.95);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
	}

	.dropdown-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: var(--text-secondary);
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.dropdown-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-primary);
	}

	.dropdown-item--selected {
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-primary);
	}

	.dropdown-item__label {
		flex: 1;
	}

	.bento-card__footer {
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.bento-card__footer-text {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.bento-card__footer-text strong {
		color: var(--text-primary);
	}
</style>
