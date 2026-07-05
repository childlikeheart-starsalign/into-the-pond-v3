import { runSignInClassificationSelfTest } from "../src/services/firebase/signInClassification.test";

void runSignInClassificationSelfTest().then(() => {
  console.log("signInClassification self-test passed.");
});
