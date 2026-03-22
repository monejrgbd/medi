"use client";

import type { LucideIcon } from "lucide-react";

export type Tab = "patient" | "receptionist" | "nurse" | "doctor" | "reviews" | "marketing" | "faq";

export interface TabDef {
  key: Tab;
  label: string;
  icon: LucideIcon;
  accent: string;
  bg: string;
  dot: string;
  enabled: boolean;
}

interface DemoTabBarProps {
  tabs: TabDef[];
  activeTab: Tab;
  pulsingTab: string | null;
  onTabClick: (tab: Tab) => void;
}

export default function DemoTabBar({
  tabs,
  activeTab,
  pulsingTab,
  onTabClick,
}: DemoTabBarProps) {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      {tabs.map(({ key, label, icon: Icon, accent, bg, dot, enabled }) => {
        const isActive = activeTab === key;
        const isPulsing = pulsingTab === key;

        return (
          <button
            key={key}
            onClick={() => enabled && onTabClick(key)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
              !enabled
                ? "opacity-40 pointer-events-none border-transparent text-gray-400"
                : isActive
                  ? `${accent} ${bg} border-current`
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {isPulsing && enabled && (
              <span
                className={`absolute top-2 right-1/4 w-2.5 h-2.5 rounded-full ${dot} animate-pulse`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
