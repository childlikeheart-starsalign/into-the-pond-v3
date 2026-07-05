"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyRef = idempotencyRef;
exports.readIdempotencyInTransaction = readIdempotencyInTransaction;
exports.writeIdempotencyInTransaction = writeIdempotencyInTransaction;
const firestore_1 = require("firebase-admin/firestore");
const index_1 = require("./index");
function idempotencyRef(userRef, idempotencyKey) {
  return userRef
    .collection("economyIdempotency")
    .doc((0, index_1.idempotencyDocId)(idempotencyKey));
}
async function readIdempotencyInTransaction(tx, userRef, idempotencyKey) {
  const ref = idempotencyRef(userRef, idempotencyKey);
  const snap = await tx.get(ref);
  if (snap.exists) {
    const cached = snap.data();
    return {
      hit: true,
      response: cached.response,
      ledgerEntryId: cached.ledgerEntryId ?? "",
    };
  }
  return { hit: false, ref, snap };
}
function writeIdempotencyInTransaction(
  tx,
  userRef,
  idempotencyKey,
  actionType,
  response,
  ledgerEntryId = "",
) {
  const ref = idempotencyRef(userRef, idempotencyKey);
  const idemRecord = (0, index_1.buildIdempotencyRecord)(idempotencyKey, ledgerEntryId, response);
  tx.set(ref, {
    ...idemRecord,
    actionType,
    committedAt: firestore_1.Timestamp.fromMillis(idemRecord.committedAt),
  });
}
