# Handoff summary for Gemini (Into the Pond / Expo auth UI)

Copy from **“Project context”** through **“Known pitfalls”** into Gemini when rebuilding this slice elsewhere.

---

## Project context

- **Stack:** Expo SDK ~54, React Native ~0.81, React 19, **expo-router** (file-based routes), Firebase JS SDK (`firebase/auth`), TypeScript.
- **Repo / app:** `into-the-pond-v3` (paths below are relative to repo root).

---

## What was built (auth sign-in slice)

### 1. Sign-in screen (`SignInScreen`)

- **Route file:** `app/(auth)/login.tsx` — exports **`SignInScreen`** as a named export and **default export** (Expo Router uses the default for `/login`).
- **Behavior:**
  - **Layered PNG UI** on a fixed-aspect artboard (**canonical canvas 576×1024**, scaled to screen width minus horizontal padding).
  - **Layer order (bottom → top):** background (`15` / `22` / `23`), then chromes `16`, `17` or `18`, `19`, `20`, `21` — each full artboard size, **`resizeMode="stretch"`**.
  - **Transparent `TextInput`** over normalized hit rects for email and password.
  - **`Pressable`** hit regions: password visibility toggle, sign-in button, sign-up link, forgot-password link.
  - **Validation:** Client email regex before Firebase; Firebase errors mapped so password/credential-ish messages → password error path.
  - **Background switching:** Default **`15.png`**; email-side errors **`22.png`**; password/credential errors **`23.png`** (password error branch checked before email error branch).
  - **Loading:** Full-screen overlay with **`24.png`** while `signInWithEmail` runs (`submitting`).
  - **Success navigation:** `router.replace(routes.sanctuary)` — **Garden tab** is route **`/sanctuary`** (tab label “Garden” in tabs layout).

### 2. Layout / constants

- **Hit rects (fractions 0–1 of artboard):** `src/constants/signInArtboard.ts` — **`signInHitRects`**, **`normRectToStyle`**, **`resolveSignInArtboardIntrinsic`**.
  - **RN Web:** `Image.resolveAssetSource` may be missing; resolver falls back to **576×1024**.
  - Fractions are **initial estimates** — tune after QA on devices.

- **Asset registry:** `src/constants/media.ts` — **`media.auth.signIn`** maps **`require("@/assets/images/auth/NN.png")`** for **`15`–`24`** only.

- **Theme used by inputs:** `src/constants/theme.ts` — `colors.textPrimary`, `fontFamilies.body`, `spacing.inner`, `spacing.section`.

### 3. Auth stack chrome

- `app/(auth)/_layout.tsx` — `Stack` with **`contentStyle: { backgroundColor: colors.bg }`** so navigator background matches the warm palette.

### 4. Firebase integration

- **`signInWithEmail`** — `src/services/firebase/auth.ts` (`signInWithEmailAndPassword`).
- **`formatFirebaseAuthError`** — `src/services/firebase/authLinks.ts`.

### 5. Routes

- `src/navigation/routes.ts` — `routes.login`, `routes.signup`, `routes.forgotPassword`, `routes.sanctuary`, etc.

### 6. Auth PNG asset convention

- **Folder:** `assets/images/auth/`
- **On disk:** **`14.png` … `31.png`** (numbered slices).
- **Sign-in wired in `media.auth.signIn`:** **`15`** base · **`16`** email · **`17`/`18`** password hide/show · **`19`** button · **`20`** sign-up link · **`21`** forgot · **`22`** invalid-email bg · **`23`** invalid-password bg · **`24`** loading.
- **`14`, `25`–`31`:** Reserved for other flows (full sign-in mockup, sign-up, verification, resend cooldown, verified success, etc.); **not** all registered in `media.ts` yet — add `require`s when those screens are implemented.

### 7. Tooling script (black → transparent PNG)

- **Script:** `scripts/auth-black-to-transparent.mjs`
- **Dependency:** devDependency **`sharp`**.
- **npm:** `"auth:transparent-black": "node scripts/auth-black-to-transparent.mjs"`
- **Logic:** For each `.png` under `assets/images/auth/` (or `--dir`), **`ensureAlpha()`**, scan RGBA; **`R=G=B=0`** → **alpha 0**; rewrite PNG via temp file + rename.
- **Flags:** `--dry-run`, `--dir <path>`.
- **Risk:** Any intentional **`#000000`** foreground becomes transparent — verify outputs.

---

## Design rules (Cursor workspace)

- Warm palette tokens (`colors.bg`, `colors.primary`, etc. in theme); **Playfair Display** headlines, **Inter** body (`@expo-google-fonts/*` loaded in root layout).
- Mobile spacing / tap targets (e.g. **48px** min buttons, **16px** horizontal body padding).

---

## What Gemini needs to reproduce elsewhere

1. Copy **`assets/images/auth/*.png`** (or regenerate same numbering / 576×1024 layered slices).
2. Implement **`media.auth.signIn`** requires + **`signInHitRects`** + **`resolveSignInArtboardIntrinsic`** with web fallback.
3. Implement **`SignInScreen`**: layered **`Image`** stack + absolute **`TextInput`** / **`Pressable`** + Firebase **`signInWithEmail`** + **`router.replace('/sanctuary')`** (or equivalent).
4. Wire Expo Router **`app/(auth)/login.tsx`** and auth **`Stack`** **`contentStyle`**.
5. Optionally add the **`sharp`** batch script and **`npm run auth:transparent-black`**.

---

## Known pitfalls

- **RN Web:** Layered PNG compositing via `react-native-web` **`Image`** can look wrong if slice alpha isn’t correct; the black→transparent script + real alpha helps.
- **`Image.resolveAssetSource`:** Undefined on web — canonical **576×1024** fallback is required.
