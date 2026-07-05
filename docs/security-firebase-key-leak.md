# Firebase Android API key — post-leak checklist

GitHub secret scanning flagged root `google-services.json` on `childlike-heart-parenting-course-index.html` branch `launch/v3-prep`. Complete these steps in Google Cloud / Firebase (cannot be automated from CI):

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) (project **into-the-pond**)
2. Find the Android API key (was exposed as `current_key` in committed root `google-services.json`)
3. **Application restrictions** → Android apps → package `com.intothepond.app.v3` + your debug and release SHA-1 fingerprints
4. **API restrictions** → Firebase-related APIs only
5. If rotating: download fresh `google-services.json` from Firebase Console → replace local `assets/google-services.json` → run `npm run setup:eas-firebase-files` → disable the old key
6. [Resolve secret scanning alert #1](https://github.com/childlikeheart-starsalign/childlike-heart-parenting-course-index.html/security/secret-scanning/1) as **revoked** (rotated) or **resolved** (restricted + branch removed)

Native config files belong only under `assets/` (gitignored). Never commit root `google-services.json`.
