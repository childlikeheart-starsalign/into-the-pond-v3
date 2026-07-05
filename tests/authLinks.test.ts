import assert from "node:assert/strict";
import test from "node:test";

import {
  isAllowedAuthDeepLinkUrl,
  normalizeFirebaseAuthHost,
} from "../shared/auth/authDeepLinkValidation";

const AUTH_DOMAIN = "my-project.firebaseapp.com";
const APP_SCHEME = "intothepond";

test("normalizeFirebaseAuthHost strips protocol and trailing slash", () => {
  assert.equal(normalizeFirebaseAuthHost("https://my-project.firebaseapp.com/"), AUTH_DOMAIN);
});

test("allows HTTPS universal link on configured auth domain", () => {
  assert.equal(
    isAllowedAuthDeepLinkUrl(
      "https://my-project.firebaseapp.com/finish-email?mode=verifyEmail&oobCode=abc",
      { authDomain: AUTH_DOMAIN, appScheme: APP_SCHEME },
    ),
    true,
  );
});

test("rejects HTTPS link on phishing host", () => {
  assert.equal(
    isAllowedAuthDeepLinkUrl("https://evil.example.com/finish-email?mode=verifyEmail&oobCode=abc", {
      authDomain: AUTH_DOMAIN,
      appScheme: APP_SCHEME,
    }),
    false,
  );
});

test("allows custom scheme deep link", () => {
  assert.equal(
    isAllowedAuthDeepLinkUrl("intothepond://finish-email?mode=verifyEmail&oobCode=abc", {
      authDomain: AUTH_DOMAIN,
      appScheme: APP_SCHEME,
    }),
    true,
  );
});

test("rejects unknown custom scheme", () => {
  assert.equal(
    isAllowedAuthDeepLinkUrl("otherapp://finish-email?mode=verifyEmail&oobCode=abc", {
      authDomain: AUTH_DOMAIN,
      appScheme: APP_SCHEME,
    }),
    false,
  );
});
