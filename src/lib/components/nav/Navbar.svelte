<script lang="ts">
	import { page } from '$app/stores';

	let mobileMenuOpen = $state(false);

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<nav class="navbar">
	<div class="navbar__container">
		<a href="/" class="navbar__logo" onclick={closeMobileMenu}>
			<span class="logo-text">BentoStack</span>
			<img draggable="false" class="logo-image" src="/brand/bentocut.png" alt="BentoStack" />
		</a>

		<button
			class="navbar__mobile-toggle"
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			aria-label="Toggle menu"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				{#if mobileMenuOpen}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				{:else}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				{/if}
			</svg>
		</button>

		<div class="navbar__links" class:navbar__links--open={mobileMenuOpen}>
			<a
				href="/"
				class="navbar__link"
				class:active={$page.url.pathname === '/'}
				onclick={closeMobileMenu}
			>
				Builder
			</a>
			<a
				href="/demos"
				class="navbar__link"
				class:active={$page.url.pathname === '/demos'}
				onclick={closeMobileMenu}
			>
				Demos
			</a>
			<a
				href="/canvas"
				class="navbar__link"
				class:active={$page.url.pathname === '/canvas'}
				onclick={closeMobileMenu}
			>
				Canvas
			</a>
			<a
				href="/registry"
				class="navbar__link"
				class:active={$page.url.pathname === '/registry'}
				onclick={closeMobileMenu}
			>
				Registry
			</a>
			<a
				href="/report"
				class="navbar__link"
				class:active={$page.url.pathname === '/report'}
				onclick={closeMobileMenu}
			>
				Report
			</a>
			<a
				href="https://github.com/Virrpe/BentoStack"
				target="_blank"
				rel="noopener noreferrer"
				class="navbar__link"
				onclick={closeMobileMenu}
			>
				GitHub
			</a>
		</div>
	</div>
</nav>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 100;
		width: 100%;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.navbar__container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
	}

	.navbar__logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.navbar__logo:hover {
		color: var(--color-accent);
	}

	.logo-text {
		background: linear-gradient(135deg, #fff 0%, #999 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.logo-image {
		width: 80px;
		height: 80px;
		object-fit: contain;
		border-radius: 12px;
	}

	.navbar__mobile-toggle {
		display: none;
		background: none;
		border: none;
		color: var(--text-primary);
		cursor: pointer;
		padding: 0.5rem;
		transition: color 0.2s ease;
	}

	.navbar__mobile-toggle:hover {
		color: var(--color-accent);
	}

	.navbar__links {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.navbar__link {
		position: relative;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.2s ease;
		padding: 0.5rem 0;
	}

	.navbar__link:hover {
		color: var(--text-primary);
	}

	.navbar__link.active {
		color: var(--text-primary);
	}

	.navbar__link.active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-accent);
		border-radius: 2px 2px 0 0;
	}

	@media (max-width: 768px) {
		.navbar__mobile-toggle {
			display: block;
		}

		.navbar__links {
			position: fixed;
			top: 64px;
			left: 0;
			right: 0;
			flex-direction: column;
			gap: 0;
			background: rgba(0, 0, 0, 0.95);
			backdrop-filter: blur(12px);
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
			padding: 1rem 0;
			transform: translateY(-100%);
			opacity: 0;
			pointer-events: none;
			transition: all 0.3s ease;
		}

		.navbar__links--open {
			transform: translateY(0);
			opacity: 1;
			pointer-events: auto;
		}

		.navbar__link {
			width: 100%;
			padding: 1rem 1.5rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		}

		.navbar__link:last-child {
			border-bottom: none;
		}

		.navbar__link.active::after {
			left: 1.5rem;
			right: auto;
			width: 3px;
			height: 100%;
			top: 0;
			bottom: 0;
			border-radius: 0 2px 2px 0;
		}
	}
</style>
