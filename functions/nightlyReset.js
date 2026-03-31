// functions/nightlyReset.js
// ─────────────────────────────────────────────────────────────────────────────
// Scheduled Cloud Function (v2) — fires every day at 00:00 IST.
// For every user in /users, it:
//   1. Pre-creates an empty daily_log doc for the new day
//   2. Clears the fastingStart field (fasts don't carry over midnight)
//   3. Increments the user's streakDays if they hit ≥80% of calorie goal yesterday
// ─────────────────────────────────────────────────────────────────────────────
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger }     = require("firebase-functions");
const admin          = require("firebase-admin");
const { format, subDays } = require("date-fns");

const db = admin.firestore;   // shorthand — use as db().collection(...)

exports.nightlyReset = onSchedule(
  {
    // Cron: midnight IST (UTC+5:30 = 18:30 UTC previous day)
    schedule:  "30 18 * * *",
    timeZone:  "UTC",
    region:    "asia-south1",
    memory:    "256MiB",
    timeoutSeconds: 300,
  },
  async () => {
    const today     = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

    logger.info(`[nightlyReset] Running for date: ${today}`);

    try {
      const usersSnap = await admin.firestore().collection("users").get();

      // Process users in batches of 400 (Firestore batch limit is 500)
      const BATCH_SIZE = 400;
      let   batch      = admin.firestore().batch();
      let   opCount    = 0;

      for (const userDoc of usersSnap.docs) {
        const uid     = userDoc.id;
        const profile = userDoc.data();

        // ── 1. Pre-create today's empty log ─────────────────────────────
        const todayLogRef = admin
          .firestore()
          .doc(`users/${uid}/daily_logs/${today}`);

        batch.set(
          todayLogRef,
          {
            date:          today,
            totalCalories: 0,
            totalProtein:  0,
            totalCarbs:    0,
            totalFat:      0,
            waterMl:       0,
            fastingStart:  null,
            createdAt:     admin.firestore.FieldValue.serverTimestamp(),
            updatedAt:     admin.firestore.FieldValue.serverTimestamp(),
          },
          // merge: true — don't overwrite if user already logged something
          // (edge case: function reruns or timezone overlap)
          { merge: true }
        );

        // ── 2. Check yesterday's log for streak logic ────────────────────
        const yesterdayLogRef = admin
          .firestore()
          .doc(`users/${uid}/daily_logs/${yesterday}`);

        const yesterdaySnap = await yesterdayLogRef.get();

        if (yesterdaySnap.exists()) {
          const { totalCalories }  = yesterdaySnap.data();
          const goalCalories       = profile?.goals?.dailyCalories ?? 2000;
          const hitGoal            = totalCalories >= goalCalories * 0.8;

          const currentStreak = profile?.streakDays ?? 0;

          const userRef = admin.firestore().doc(`users/${uid}`);
          batch.update(userRef, {
            streakDays: hitGoal
              ? admin.firestore.FieldValue.increment(1)
              : 0,                                      // reset streak if goal missed
            lastActiveDate: yesterday,
            updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        opCount += 2; // 2 ops per user (log set + user update)

        // Commit and start a fresh batch before hitting the 500 op limit
        if (opCount >= BATCH_SIZE) {
          await batch.commit();
          logger.info(`[nightlyReset] Committed batch of ${opCount} ops`);
          batch    = admin.firestore().batch();
          opCount  = 0;
        }
      }

      // Commit any remaining ops
      if (opCount > 0) {
        await batch.commit();
      }

      logger.info(
        `[nightlyReset] Complete — processed ${usersSnap.size} users`
      );
    } catch (err) {
      logger.error("[nightlyReset] Failed:", err.message);
      throw err; // Re-throw so Cloud Functions marks the run as failed
    }
  }
);