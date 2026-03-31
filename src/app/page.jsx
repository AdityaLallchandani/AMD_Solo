// src/app/page.jsx
// Root entry point: immediately redirects based on auth state.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth }   from "@/context/AuthContext";

export default function RootPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user)                              return router.replace("/login");
    if (!userProfile?.onboardingComplete)   return router.replace("/onboarding");
    router.replace("/dashboard");
  }, [user, userProfile, loading, router]);

  // Brief loading state while auth resolves
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  );
}
