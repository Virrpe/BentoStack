<script lang="ts">
  import { onDestroy } from 'svelte';

  let { src = '/brand/icon.png', alt = 'BentoStack', href = null } = $props<{
    src?: string;
    alt?: string;
    href?: string | null;
  }>();

  let el: HTMLDivElement | null = null;
  let hovering = false;

  // Throttle pointer updates (prevents "mousemove jank")
  let raf = 0;
  let lastClientX = 0;
  let lastClientY = 0;

  // "Clippy-ish" micro behavior: occasional nudge
  let nudge = false;
  let nudgeTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleNudge() {
    if (!hovering) return;
    const wait = 3500 + Math.random() * 6500; // 3.5s–10s
    nudgeTimer = setTimeout(() => {
      nudge = true;
      setTimeout(() => (nudge = false), 260);
      scheduleNudge();
    }, wait);
  }

  function stopNudge() {
    if (nudgeTimer) clearTimeout(nudgeTimer);
    nudgeTimer = null;
    nudge = false;
  }

  function setVarsFromPointer(clientX: number, clientY: number) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;

    // Spotlight center
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);

    // Tilt (normalized -0.5..0.5)
    const nx = x / r.width - 0.5;
    const ny = y / r.height - 0.5;

    const ry = nx * 7; // rotateY (maxTiltDeg)
    const rx = -ny * 7; // rotateX

    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
  }

  function onPointerEnter(e: PointerEvent) {
    hovering = true;
    if (!el) return;

    el.dataset.hover = 'true';
    setVarsFromPointer(e.clientX, e.clientY);
    scheduleNudge();
  }

  function onPointerMove(e: PointerEvent) {
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!hovering) return;
      setVarsFromPointer(lastClientX, lastClientY);
    });
  }

  function onPointerLeave() {
    hovering = false;
    stopNudge();
    if (!el) return;

    el.dataset.hover = 'false';
    // Ease back to neutral
    el.style.setProperty('--rx', `0deg`);
    el.style.setProperty('--ry', `0deg`);
  }

  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf);
    stopNudge();
  });
</script>

{#if href}
  <a class="wrap" {href} aria-label={alt}>
    <div
      class="card"
      bind:this={el}
      onpointerenter={onPointerEnter}
      onpointermove={onPointerMove}
      onpointerleave={onPointerLeave}
      role="button"
      tabindex="0"
    >
      <div class="inner">
        <div class="logo {nudge ? 'nudge' : ''}">
          <img {src} {alt} draggable="false" />
        </div>
      </div>
    </div>
  </a>
{:else}
  <div
    class="card"
    bind:this={el}
    onpointerenter={onPointerEnter}
    onpointermove={onPointerMove}
    onpointerleave={onPointerLeave}
    role="presentation"
  >
    <div class="inner">
      <div class="logo {nudge ? 'nudge' : ''}">
        <img {src} {alt} draggable="false" />
      </div>
    </div>
  </div>
{/if}

<style>
  .wrap {
    display: inline-block;
    text-decoration: none;
  }

  .card {
    --mx: 50%;
    --my: 50%;
    --rx: 0deg;
    --ry: 0deg;

    position: relative;
    width: 96px;
    height: 96px;
    border-radius: var(--radius-2xl);
    transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
    transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
    will-change: transform;
    isolation: isolate;
  }

  /* Rotating "shine border" (conic gradient masked to border) */
  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--radius-2xl);
    padding: 1px;
    background: conic-gradient(
      from 0deg,
      rgba(160, 220, 255, 0.55),
      rgba(255, 255, 255, 0.08),
      rgba(160, 220, 255, 0.22),
      rgba(255, 255, 255, 0.08),
      rgba(160, 220, 255, 0.55)
    );

    /* Mask to "border only" */
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;

    opacity: 0.55;
    filter: blur(0.1px);
    animation: borderSpin 10s linear infinite;
    pointer-events: none;
  }

  /* Spotlight that follows cursor (Magic Card-ish) */
  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--radius-2xl);
    background: radial-gradient(
      220px circle at var(--mx) var(--my),
      rgba(170, 235, 255, 0.18),
      rgba(170, 235, 255, 0.05) 35%,
      transparent 60%
    );
    opacity: 0;
    transition: opacity 220ms ease;
    pointer-events: none;
  }

  .card[data-hover='true']::after {
    opacity: 1;
  }

  .inner {
    border-radius: var(--radius-2xl);
    overflow: hidden;
    background: #000000;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    padding: 12px;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  .logo {
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    transform: translateZ(0);
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35));
    animation: float 5.4s ease-in-out infinite;
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;

    /* "Alive, but subtle": micro-breathe + tiny blink-ish squash */
    animation: breathe 6.2s ease-in-out infinite;
  }

  .logo.nudge img {
    animation: breathe 6.2s ease-in-out infinite, nudge 260ms cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  @keyframes borderSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-3px);
    }
  }

  @keyframes breathe {
    0%,
    100% {
      transform: scale(1);
      filter: brightness(1);
    }
    50% {
      transform: scale(1.015);
      filter: brightness(1.03);
    }
    /* quick "blink hint" without deforming the card/background */
    88% {
      transform: scale(1.015);
    }
    90% {
      transform: scaleX(1.02) scaleY(0.985);
    }
    92% {
      transform: scale(1.015);
    }
  }

  @keyframes nudge {
    0% {
      transform: rotate(0deg) translateY(0px);
    }
    35% {
      transform: rotate(-1.4deg) translateY(-1px);
    }
    70% {
      transform: rotate(1.1deg) translateY(0px);
    }
    100% {
      transform: rotate(0deg) translateY(0px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none;
    }
    .card::before,
    .logo,
    .logo img {
      animation: none !important;
    }
    .card::after {
      transition: none;
    }
  }
</style>
