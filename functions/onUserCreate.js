// functions/onUserCreate.js
// ─────────────────────────────────────────────────────────────────────────────
// Firestore onCreate trigger: /users/{uid}
// When a new user completes onboarding and onboardingComplete flips to true,
// this recalculates their TDEE server-side and stores it on their profile.
// Separating this from the client prevents goal tampering.
// ─────────────────────────────────────────────────────────────────────────────
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { logger }            = require("firebase-functions");
const admin                 = require("firebase-admin");

// ── Mifflin-St Jeor BMR formula ───────────────────────────────────────────────
function calculateTDEE({ weightKg, heightCm, age, gender, activityLevel }) {
  if (!weightKg || !heightCm || !age) return null;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr  = gender === "male" ? base + 5 : base - 161;

  const factors = {
    sedentary: 1.2,
    light:     1.375,
    moderate:  1.55,
    very:      1.725,
    extra:     1.9,
  };

  return Math.round(bmr * (factors[activityLevel] ?? 1.55));
}

function calculateMacros(tdee, goal) {
  const multipliers = { lose: 0.85, maintain: 1.0, gain: 1.1 };
  const targetCals  = Math.round(tdee * (multipliers[goal] ?? 1.0));

  return {
    dailyCalories: targetCals,
    proteinGrams:  Math.round((targetCals * 0.3) / 4),
    carbsGrams:    Math.round((targetCals * 0.4) / 4),
    fatGrams:      Math.round((targetCals * 0.3) / 9),
    tdee,
  };
}

exports.onUserCreate = onDocumentWritten(
  {
    document: "users/{uid}",
    region:   "asia-south1",
  },
  async (event) => {
    const after  = event.data?.after?.data();
    const before = event.data?.before?.data();

    // Only run when onboardingComplete transitions false → true
    const justCompleted =
      after?.onboardingComplete === true &&
      before?.onboardingComplete !== true;

    if (!justCompleted) return;

    const uid     = event.params.uid;
    const metrics = after.metrics;

    if (!metrics?.heightCm || !metrics?.weightKg || !metrics?.age) {
      logger.warn(`[onUserCreate] uid=${uid} missing metrics, skipping`);
      return;
    }

    try {
      const tdee   = calculateTDEE(metrics);
      const macros = calculateMacros(tdee, metrics.goal);

      await admin.firestore().doc(`users/${uid}`).update({
        goals:     macros,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(
        `[onUserCreate] uid=${uid} TDEE=${tdee} → calories=${macros.dailyCalories}`
      );
    } catch (err) {
      logger.error("[onUserCreate] Failed:", err.message);
    }
  }
);