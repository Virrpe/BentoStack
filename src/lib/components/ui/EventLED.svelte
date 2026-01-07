<script lang="ts">
  let { type } = $props<{ type: string }>();

  // Pulse trigger on type change
  let pulse = $state(false);

  $effect(() => {
    type; // track type changes
    pulse = true;
    setTimeout(() => pulse = false, 400);
  });

  // LED color based on event type
  const ledColor = $derived.by(() => {
    if (type.includes('COLLISION') || type.includes('REMOVED')) return 'var(--color-collision-500)';
    if (type.includes('CONNECTED') || type.includes('CHANGED') || type.includes('ADDED')) return 'var(--color-native-500)';
    return 'var(--color-neutral-400)';
  });
</script>

<div class="event-led" class:pulse>
  <div class="led-dot" style="background: {ledColor};"></div>
</div>

<style>
  .event-led {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
  }

  .led-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    transition: all var(--duration-fast) var(--ease-out);
  }

  .event-led.pulse .led-dot {
    animation: led-pulse 400ms var(--ease-out);
  }

  @keyframes led-pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.5);
      opacity: 0.8;
      box-shadow: 0 0 8px currentColor;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .event-led.pulse .led-dot {
      animation: none;
    }
  }
</style>
