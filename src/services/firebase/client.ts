import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

import { env } from "@/src/config/env";
import { createFirebaseAuth } from "@/src/services/firebase/createFirebaseAuth";

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
  measurementId: env.firebase.measurementId,
  ...(env.firebase.databaseUrl ? { databaseURL: env.firebase.databaseUrl } : {}),
};

const hadFirebaseAppBeforeInit = getApps().length > 0;

export const firebaseApp = hadFirebaseAppBeforeInit ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = createFirebaseAuth(firebaseApp, hadFirebaseAppBeforeInit);

export const firestore = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp, env.cloudFunctionsRegion);
export const realtimeDb: Database | null = env.firebase.databaseUrl
  ? getDatabase(firebaseApp)
  : null;
