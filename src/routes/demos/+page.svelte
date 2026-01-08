<script lang="ts">
	import DemoGallery from '$lib/components/DemoGallery.svelte';
</script>

<div class="demos-page">
	<header class="demos-header">
		<h1>Demo Gallery</h1>
		<p>Explore curated stack configurations showcasing various finding types</p>
		<a href="/" class="back-link">← Back to Builder</a>
	</header>

	<DemoGallery />
</div>

<style>
	.demos-page {
		min-height: 100vh;
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.demos-header {
		margin-bottom: 3rem;
		text-align: center;
	}

	.demos-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}

	.demos-header p {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin: 0 0 1.5rem 0;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.back-link:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		color: var(--text-primary);
	}

	@media (max-width: 768px) {
		.demos-page {
			padding: 1.5rem;
		}

		.demos-header h1 {
			font-size: 2rem;
		}

		.demos-header p {
			font-size: 1rem;
		}
	}
</style>
