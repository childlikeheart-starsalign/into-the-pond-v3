import { Timestamp } from "firebase-admin/firestore";

import { buildIdempotencyRecord, idempotencyDocId, type EconomyActionType } from "./index";

export type IdempotencyReadResult<T> =
  | { hit: true; response: T; ledgerEntryId: string }
  | {
      hit: false;
      ref: FirebaseFirestore.DocumentReference;
      snap: FirebaseFirestore.DocumentSnapshot;
    };

export function idempotencyRef(
  userRef: FirebaseFirestore.DocumentReference,
  idempotencyKey: string,
): FirebaseFirestore.DocumentReference {
  return userRef.collection("economyIdempotency").doc(idempotencyDocId(idempotencyKey));
}

export async function readIdempotencyInTransaction<T>(
  tx: FirebaseFirestore.Transaction,
  userRef: FirebaseFirestore.DocumentReference,
  idempotencyKey: string,
): Promise<IdempotencyReadResult<T>> {
  const ref = idempotencyRef(userRef, idempotencyKey);
  const snap = await tx.get(ref);

  if (snap.exists) {
    const cached = snap.data() as {
      response?: T;
      ledgerEntryId?: string;
    };
    return {
      hit: true,
      response: cached.response as T,
      ledgerEntryId: cached.ledgerEntryId ?? "",
    };
  }

  return { hit: false, ref, snap };
}

export function writeIdempotencyInTransaction<T>(
  tx: FirebaseFirestore.Transaction,
  userRef: FirebaseFirestore.DocumentReference,
  idempotencyKey: string,
  actionType: EconomyActionType,
  response: T,
  ledgerEntryId = "",
): void {
  const ref = idempotencyRef(userRef, idempotencyKey);
  const idemRecord = buildIdempotencyRecord(idempotencyKey, ledgerEntryId, response);
  tx.set(ref, {
    ...idemRecord,
    actionType,
    committedAt: Timestamp.fromMillis(idemRecord.committedAt),
  });
}
