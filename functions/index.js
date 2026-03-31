const admin = require("firebase-admin");

// Initialize Admin SDK once; all function files share this instance
if (!admin.apps.length) {
  admin.initializeApp();
}

// ── Scheduled functions ───────────────────────────────────────────────────────
const { nightlyReset }         = require("./nightlyReset");
const { weeklyStreakReset }     = require("./weeklyStreakReset");

// ── Firestore trigger functions ───────────────────────────────────────────────
const { onUserCreate }         = require("./onUserCreate");
const { recalculateDailyTotals } = require("./recalculateDailyTotals");

module.exports = {
  nightlyReset,
  weeklyStreakReset,
  onUserCreate,
  recalculateDailyTotals,
};
