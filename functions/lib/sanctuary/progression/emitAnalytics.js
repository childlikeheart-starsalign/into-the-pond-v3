"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitAnalytics = emitAnalytics;
const firestore_1 = require("firebase-admin/firestore");
const init_1 = require("../../init");
/** Append-only sanctuary analytics — shared entry point for progression events. */
async function emitAnalytics(uid, event) {
  await init_1.db
    .collection("users")
    .doc(uid)
    .collection("sanctuaryAnalytics")
    .add({
      ...event,
      recordedAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
