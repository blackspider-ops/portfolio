'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSiteSettings } from './useData';

export interface FeatureToggles {
  terminal: boolean;
  phone_mock: boolean;
  games: boolean;
  '3d_ribbon': boolean;
}

const DEFAULT_TOGGLES: FeatureToggles = {
  terminal: true,
  phone_mock: true,
  games: true,
  '3d_ribbon': true,
};

const FeatureTogglesContext = createContext<FeatureToggles>(DEFAULT_TOGGLES);

export function FeatureTogglesProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useSiteSettings();
  
  const toggles: FeatureToggles = {
    ...DEFAULT_TOGGLES,
    ...(settings?.feature_toggles as Partial<FeatureToggles> || {}),
  };

  return (
    <FeatureTogglesContext.Provider value={toggles}>
      {children}
    </FeatureTogglesContext.Provider>
  );
}

export function useFeatureToggles(): FeatureToggles {
  return useContext(FeatureTogglesContext);
}

export function useFeatureEnabled(feature: keyof FeatureToggles): boolean {
  const toggles = useFeatureToggles();
  return toggles[feature] ?? true;
}
