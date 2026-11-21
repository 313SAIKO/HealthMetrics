/** Product limits, not a claim of clinical validation. */
export const PROFILE_LIMITS = {
  age: { min: 20, max: 78, step: 1 },
  weight: { min: 20, max: 300, step: 0.1 },
  height: { min: 100, max: 220, step: 0.1 },
} as const;
export const BMI_BOUNDARIES = [18.5, 25, 30] as const;
export const IDEAL_WEIGHT_HEIGHT = { min: 152.4, max: 220 } as const;
export const ENERGY_POLICY = { adjustment: 500, minimumCutting: 1500 } as const;
