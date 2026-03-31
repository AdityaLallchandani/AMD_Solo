// functions/recalculateDailyTotals.js
// ─────────────────────────────────────────────────────────────────────────────
// Firestore onDelete trigger: /users/{uid}/daily_logs/{date}/meals/{mealId}
// When a meal is deleted, re-sums all remaining meals and updates the
// parent daily_log totals — avoids stale calorie counts after deletions.
// ─────────────────────────────────────────────────────────────────────────────
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { logger }            = require("firebase-functions");
const admin                 = require("firebase-admin");

exports.recalculateDailyTotals = onDocumentDeleted(
  {
    document: "users/{uid}/daily_logs/{date}/meals/{mealId}",
    region:   "asia-south1",
  },
  async (event) => {
    const { uid, date } = event.params;

    try {
      const mealsSnap = await admin
        .firestore()
        .collection(`users/${uid}/daily_logs/${date}/meals`)
        .get();

      // Sum all remaining meals
      let totalCalories = 0;
      let totalProtein  = 0;
      let totalCarbs    = 0;
      let totalFat      = 0;

      mealsSnap.docs.forEach((doc) => {
        const m    = doc.data();
        totalCalories += m.calories ?? 0;
        totalProtein  += m.protein  ?? 0;
        totalCarbs    += m.carbs    ?? 0;
        totalFat      += m.fat      ?? 0;
      });

      await admin
        .firestore()
        .doc(`users/${uid}/daily_logs/${date}`)
        .update({
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      logger.info(
        `[recalculateDailyTotals] uid=${uid} date=${date} → ${totalCalories} kcal`
      );
    } catch (err) {
      logger.error("[recalculateDailyTotals] Failed:", err.message);
    }
  }
);