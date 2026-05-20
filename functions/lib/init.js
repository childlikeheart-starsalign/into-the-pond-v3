"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Optional `functions/.env` (gitignored) so local emulators pick up FIREBASE_SERVICE_ACCOUNT_PATH without shell exports.
const functionsEnvPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(functionsEnvPath)) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: functionsEnvPath });
  } catch {
    /* dotenv missing — use shell env only */
  }
}
/**
 * Firebase Admin initialization:
 * - **Deployed Cloud Functions:** `initializeApp()` with no args uses the runtime service account (recommended).
 *   Do not set `FIREBASE_SERVICE_ACCOUNT_PATH` in production deploy.
 * - **Local / emulators:** set `FIREBASE_SERVICE_ACCOUNT_PATH` to your JSON key path (outside git), or copy
 *   [`.env.example`](./.env.example) to `functions/.env` and adjust the path.
 */
if (firebase_admin_1.default.apps.length === 0) {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (keyPath) {
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    const raw = fs.readFileSync(resolved, "utf8");
    const serviceAccount = JSON.parse(raw);
    firebase_admin_1.default.initializeApp({
      credential: firebase_admin_1.default.credential.cert(serviceAccount),
    });
  } else {
    firebase_admin_1.default.initializeApp();
  }
}
exports.db = firebase_admin_1.default.firestore();
