/**
 * User preferences stored in localStorage
 */

const PREFS_KEY = 'bentostack:prefs';

export interface Preferences {
  snapToGrid: boolean;
  soundEnabled: boolean;
}

const DEFAULT_PREFS: Preferences = {
  snapToGrid: false,
  soundEnabled: false
};

/**
 * Load preferences from localStorage
 */
export function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };

    const data = JSON.parse(raw) as Partial<Preferences>;
    return {
      snapToGrid: data.snapToGrid ?? DEFAULT_PREFS.snapToGrid,
      soundEnabled: data.soundEnabled ?? DEFAULT_PREFS.soundEnabled
    };
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return { ...DEFAULT_PREFS };
  }
}

/**
 * Save preferences to localStorage
 */
export function savePrefs(prefs: Preferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}
