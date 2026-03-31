// src/app/(dashboard)/dashboard/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard page. Assembles all Module B components:
//   - DateNavigator  (switch between days)
//   - CalorieRing    (hero ring, top center)
//   - DailyStats     (eaten / remaining / water cards)
//   - MacroRing ×4   (protein, carbs, fat, water)
//   - Quick-action shortcuts → /log and /ai-coach
// All data flows from useMacros which wraps useDailyLog (real-time onSnapshot).
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState }        from "react";
import { useRouter }       from "next/navigation";
import { signOut }         from "firebase/auth";
import { auth }            from "@/lib/firebase/firebaseConfig";
import { useAuth }         from "@/context/AuthContext";
import { useMacros }       from "@/lib/hooks/useMacros";
import CalorieRing         from "@/components/dashboard/CalorieRing";
import MacroRing           from "@/components/dashboard/MacroRing";
import DailyStats          from "@/components/dashboard/DailyStats";
import DateNavigator       from "@/components/dashboard/DateNavigator";

// ── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-pulse">
      {/* Hero ring placeholder */}
      <div className="w-[220px] h-[220px] rounded-full bg-gray-800" />

      {/* Stats row placeholder */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-800" />
        ))}
      </div>

      {/* Macro rings placeholder */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

// ── Quick-action card ────────────────────────────────────────────────────────
function QuickAction({ icon, title, subtitle, onClick, hoverColor }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900
                  p-4 text-left transition-all hover:bg-gray-800 ${hoverColor}`}
    >
      <span className="text-2xl shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { userProfile }             = useAuth();
  const router                      = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { macros, loading }         = useMacros(selectedDate);

  const handleSignOut = async () => {
    await signOut(auth);
    // Delete session cookie so middleware redirects correctly
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/login");
  };

  const firstName = userProfile?.displayName?.split(" ")[0] ?? "there";

  return (
    <main className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="mx-auto max-w-md px-4 py-6 space-y-5">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Good day,</p>
            <h1 className="text-xl font-bold">
              {firstName} 👋
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {userProfile?.photoURL && (
              <img
                src={userProfile.photoURL}
                alt="profile"
                className="w-9 h-9 rounded-full border border-gray-700 object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── Date navigator ────────────────────────────────────────── */}
        <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />

        {/* ── Loading state ─────────────────────────────────────────── */}
        {loading && <Skeleton />}

        {/* ── Dashboard content ─────────────────────────────────────── */}
        {!loading && macros && (
          <>
            {/* Hero calorie ring */}
            <div className="flex justify-center py-2">
              <CalorieRing
                consumed={macros.calories.consumed}
                goal={macros.calories.goal}
                progress={macros.calories.progress}
              />
            </div>

            {/* Quick stat cards */}
            <DailyStats macros={macros} />

            {/* Macro rings row */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Macros
              </h2>
              <div className="grid grid-cols-4 gap-2 justify-items-center">
                {(["protein", "carbs", "fat", "water"]).map((key) => {
                  const m = macros[key];
                  return (
                    <MacroRing
                      key={key}
                      size={80}
                      strokeWidth={7}
                      progress={m.progress}
                      color={m.color}
                      label={m.label}
                      consumed={m.consumed}
                      goal={m.goal}
                      unit={m.unit}
                    />
                  );
                })}
              </div>
            </section>

            {/* Quick actions */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction
                  icon="🍔" title="Log Food" subtitle="Add a meal"
                  hoverColor="hover:border-emerald-500/40"
                  onClick={() => router.push("/log?tab=food")}
                />
                <QuickAction
                  icon="💧" title="Log Water"
                  subtitle={`${macros.water.consumed}ml today`}
                  hoverColor="hover:border-sky-500/40"
                  onClick={() => router.push("/log?tab=water")}
                />
                <QuickAction
                  icon="⏱️" title="Fasting Timer" subtitle="Start a fast"
                  hoverColor="hover:border-amber-500/40"
                  onClick={() => router.push("/log?tab=fasting")}
                />
                <QuickAction
                  icon="🤖" title="AI Coach" subtitle="Ask anything"
                  hoverColor="hover:border-violet-500/40"
                  onClick={() => router.push("/ai-coach")}
                />
              </div>
            </section>
          </>
        )}

      </div>
    </main>
  );
}
