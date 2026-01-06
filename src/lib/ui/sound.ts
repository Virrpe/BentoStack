/**
 * Tiny Web Audio synth for TE-inspired tactile sounds
 * NO audio files - all synthesis
 */

let audioContext: AudioContext | null = null;
let isUnlocked = false;

const MASTER_VOLUME = 0.12;

/**
 * Initialize audio context (lazy, requires user gesture)
 */
export function initSound(): boolean {
  if (audioContext) return true;

  try {
    audioContext = new AudioContext();
    isUnlocked = audioContext.state === 'running';
    return true;
  } catch (error) {
    console.warn('Web Audio not supported:', error);
    return false;
  }
}

/**
 * Unlock audio context (must be called from user gesture)
 */
export async function unlockAudio(): Promise<void> {
  if (!audioContext || isUnlocked) return;

  try {
    await audioContext.resume();
    isUnlocked = true;
  } catch (error) {
    console.warn('Failed to unlock audio:', error);
  }
}

/**
 * Play a simple synth note
 */
function playNote(frequency: number, duration: number, gain: number = 1.0): void {
  if (!audioContext || !isUnlocked) return;

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;

  // Envelope: quick attack, exponential decay
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(MASTER_VOLUME * gain, now + 0.002);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Click sound (node select) - subtle, high pitch
 */
export function playClick(): void {
  playNote(1200, 0.06, 0.8);
}

/**
 * Confirm sound (Apply, Export) - pleasant, mid pitch
 */
export function playConfirm(): void {
  playNote(880, 0.12, 1.0);
}

/**
 * Warning sound (collision, error) - lower, slightly harsh
 */
export function playWarn(): void {
  playNote(440, 0.15, 0.9);
}

/**
 * Cleanup
 */
export function closeSound(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    isUnlocked = false;
  }
}
