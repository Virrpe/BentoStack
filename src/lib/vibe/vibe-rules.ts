export type VibeRules = {
  bestBonus: number;
  frictionPenalty: number;
  unknownPenalty: number;
};

export const DEFAULT_VIBE_RULES: VibeRules = {
  bestBonus: 12,
  frictionPenalty: 35,
  unknownPenalty: 3
};
