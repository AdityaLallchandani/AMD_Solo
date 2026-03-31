// src/app/(dashboard)/log/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FoodSearch   from "@/components/logging/FoodSearch";
import WaterTracker from "@/components/logging/WaterTracker";
import FastingTimer from "@/components/logging/FastingTimer";

const TABS = [
  { id: "food",    label: "Food",   icon: "🍔" },
  { id: "water",   label: "Water",  icon: "💧" },
  { id: "fasting", label: "Fasting",icon: "⏱️" },
];

export default function LogPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") ?? "food"
  );

  // Keep URL in sync when tab changes
  useEffect(() => {
    router.replace(`/log?tab=${activeTab}`, { scroll: false });
  }, [activeTab, router]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-md px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold">Log</h1>
          <p className="text-sm text-gray-400">Track food, water, and fasting</p>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-2 rounded-2xl border border-gray-800 bg-gray-900 p-1">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-gray-800 text-white shadow"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div>
          {activeTab === "food"    && <FoodSearch />}
          {activeTab === "water"   && <WaterTracker />}
          {activeTab === "fasting" && <FastingTimer />}
        </div>

      </div>
    </main>
  );
}
