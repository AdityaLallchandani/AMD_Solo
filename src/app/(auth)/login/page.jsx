import OnboardingForm from "@/components/auth/OnboardingForm";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Set up your nutrition goals</h1>
          <p className="mt-2 text-gray-400">
            Tell us a little about yourself so we can personalize your dashboard
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}