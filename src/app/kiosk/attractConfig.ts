export interface AttractScreenConfig {
  enabled: boolean;
  videoUrl: string | null;
  logoUrl: string | null;
  restaurantName: string;
  slogan: string | null;
  idleTimeoutSeconds: number;
}

// Default config — future: loaded from admin API per branch.
// Architecture note: videoUrl is intentionally nullable so the component can
// fall back to a branded backdrop. When offline caching is implemented, point
// videoUrl to a Service Worker / IndexedDB cached URL instead of a remote one.
export const defaultAttractConfig: AttractScreenConfig = {
  enabled: true,
  videoUrl: null,
  logoUrl: null,
  restaurantName: 'Pertinho do Céu',
  slogan: null,
  idleTimeoutSeconds: 90,
};

const STORAGE_KEY = 'ff_attract_config';

export function loadAttractConfig(): AttractScreenConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAttractConfig;
    return { ...defaultAttractConfig, ...JSON.parse(raw) };
  } catch {
    return defaultAttractConfig;
  }
}

export function saveAttractConfig(cfg: AttractScreenConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}
