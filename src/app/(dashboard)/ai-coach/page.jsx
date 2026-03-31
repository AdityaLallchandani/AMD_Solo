// src/app/(dashboard)/ai-coach/page.jsx
import ChatInterface from "@/components/ai-coach/ChatInterface";

export const metadata = { title: "AI Coach – FuelTrack" };

export default function AICoachPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-md">
        <ChatInterface />
      </div>
    </main>
  );
}