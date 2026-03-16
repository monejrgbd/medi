"use client";

import { User, ClipboardList, Stethoscope, Star, HelpCircle } from "lucide-react";

export type Tab = "patient" | "receptionist" | "doctor" | "reviews" | "faq";

interface DemoTabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  pulsingTab?: string | null;
}

const tabs: { key: Tab; label: string; icon: typeof User; accent: string; bg: string; dot: string }[] = [
  {
    key: "patient",
    label: "Patient",
    icon: User,
    accent: "border-blue-500 text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  {
    key: "receptionist",
    label: "Receptionist",
    icon: ClipboardList,
    accent: "border-green-500 text-green-600",
    bg: "bg-green-50",
    dot: "bg-green-500",
  },
  {
    key: "doctor",
    label: "Doctor",
    icon: Stethoscope,
    accent: "border-purple-500 text-purple-600",
    bg: "bg-purple-50",
    dot: "bg-purple-500",
  },
  {
    key: "reviews",
    label: "Reviews",
    icon: Star,
    accent: "border-orange-500 text-orange-600",
    bg: "bg-orange-50",
    dot: "bg-orange-500",
  },
  {
    key: "faq",
    label: "Q&A",
    icon: HelpCircle,
    accent: "border-amber-500 text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
];

export default function DemoTabBar({
  activeTab,
  onTabChange,
  pulsingTab,
}: DemoTabBarProps) {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      {tabs.map(({ key, label, icon: Icon, accent, bg, dot }) => {
        const isActive = activeTab === key;
        const isPulsing = pulsingTab === key;

        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
              isActive
                ? `${accent} ${bg} border-current`
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {isPulsing && (
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
