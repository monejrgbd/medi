"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { syncDemoLocationFeatures } from "@/app/demo/_actions/demo-location";

interface DemoFeatures {
  nurseEnabled: boolean;
  vitalsEnabled: boolean;
  vaccinesEnabled: boolean;
  skipAi: boolean;
  reviewCollection: boolean;
  askReferralSource: boolean;
  askDiscoverySource: boolean;
  queueDisplayEnabled: boolean;
}

const DEFAULTS: DemoFeatures = {
  nurseEnabled: true,
  vitalsEnabled: true,
  vaccinesEnabled: true,
  skipAi: false,
  reviewCollection: true,
  askReferralSource: true,
  askDiscoverySource: true,
  queueDisplayEnabled: true,
};

const STORAGE_KEY = "demo_features";

interface DemoFeatureContextType {
  features: DemoFeatures;
  setFeature: (key: keyof DemoFeatures, value: boolean) => void;
  isCustomized: boolean;
  markCustomized: () => void;
  locationId: string | null;
}

const DemoFeatureContext = createContext<DemoFeatureContextType>({
  features: DEFAULTS,
  setFeature: () => {},
  isCustomized: false,
  markCustomized: () => {},
  locationId: null,
});

function syncToLocation(locationId: string, features: DemoFeatures) {
  syncDemoLocationFeatures(locationId, {
    nurseEnabled: features.nurseEnabled,
    vitalsEnabled: features.vitalsEnabled,
    vaccinesEnabled: features.vaccinesEnabled,
    reviewCollection: features.reviewCollection,
  }).catch(() => { /* best effort */ });
}

export function DemoFeatureProvider({ children, locationId }: { children: ReactNode; locationId?: string }) {
  const [features, setFeatures] = useState<DemoFeatures>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) { try { return { ...DEFAULTS, ...JSON.parse(stored) }; } catch { /* ignore */ } }
    }
    return DEFAULTS;
  });

  const [isCustomized, setIsCustomized] = useState(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem("demo_customized") === "true";
    return false;
  });

  const setFeature = useCallback((key: keyof DemoFeatures, value: boolean) => {
    setFeatures(prev => {
      const next = { ...prev, [key]: value };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (locationId) syncToLocation(locationId, next);
      return next;
    });
  }, [locationId]);

  const markCustomized = useCallback(() => {
    setIsCustomized(true);
    sessionStorage.setItem("demo_customized", "true");
    // Sync initial features to location DB on demo start
    if (locationId) syncToLocation(locationId, features);
  }, [locationId, features]);

  return (
    <DemoFeatureContext.Provider value={{ features, setFeature, isCustomized, markCustomized, locationId: locationId || null }}>
      {children}
    </DemoFeatureContext.Provider>
  );
}

export function useDemoFeatures() { return useContext(DemoFeatureContext); }
export { DEFAULTS as DEMO_FEATURE_DEFAULTS };
export type { DemoFeatures };
