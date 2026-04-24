"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key);

  function handleClick(key: string) {
    setActive(key);
    onChange?.(key);
  }

  return (
    <div className={cn("flex border-b border-border bg-white", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
            active === tab.key
              ? "border-primary text-primary"
              : "border-transparent text-fg-5 hover:text-fg-3"
          )}
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span className="ml-1 bg-success-mid text-success-text text-xs font-medium px-1.5 py-0.5 rounded-full">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
