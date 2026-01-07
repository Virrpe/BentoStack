<div class="ambient-drift"></div>

<style>
  .ambient-drift {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(
      ellipse 800px 600px at 20% 40%,
      rgba(37, 99, 235, 0.04),
      transparent 50%
    ),
    radial-gradient(
      ellipse 600px 800px at 80% 60%,
      rgba(168, 85, 247, 0.03),
      transparent 50%
    );
    animation: drift 40s ease-in-out infinite alternate;
  }

  @keyframes drift {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 0.5;
    }
    50% {
      transform: translate(-2%, 3%) scale(1.02);
      opacity: 0.6;
    }
    100% {
      transform: translate(3%, -2%) scale(0.98);
      opacity: 0.5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ambient-drift {
      animation: none;
      opacity: 0.5;
    }
  }
</style>
