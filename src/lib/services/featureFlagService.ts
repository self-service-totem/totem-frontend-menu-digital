const FLAG_KEY = 'ff:feature-flags';

export type FeatureFlags = {
  delivery: boolean;
  kiosk: boolean;
  reservations: boolean;
  queueDisplay: boolean;
};

const DEFAULTS: FeatureFlags = {
  delivery: true,
  kiosk: true,
  reservations: true,
  queueDisplay: true,
};

export const featureFlagService = {
  getAll(): FeatureFlags {
    try {
      const raw = localStorage.getItem(FLAG_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  },

  set(flags: Partial<FeatureFlags>) {
    const current = this.getAll();
    localStorage.setItem(FLAG_KEY, JSON.stringify({ ...current, ...flags }));
  },

  toggle(key: keyof FeatureFlags) {
    const current = this.getAll();
    this.set({ [key]: !current[key] });
  },

  isEnabled(key: keyof FeatureFlags): boolean {
    return this.getAll()[key];
  },
};
