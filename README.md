# Calisthenics Awakening

Learn calisthenics step by step instead of by trial and error. One app for **Android and iPhone**, built with Expo (React Native).

## Download

<p align="center">
  <a href="https://github.com/Dekuxd69/Calisthenics-Awakning/releases/latest/download/CalisthenicsAwakening.apk"><img alt="Download APK for Android" src="https://img.shields.io/badge/Download%20APK-Android-C6F432?style=for-the-badge&logo=android&logoColor=0A0A0A&labelColor=0A0A0A" height="56"></a>
</p>

**Direct link (always the newest version):** https://github.com/Dekuxd69/Calisthenics-Awakning/releases/latest/download/CalisthenicsAwakening.apk

Download page: https://dekuxd69.github.io/Calisthenics-Awakning/

### Install on Android
1. Open the link above on your phone and download the APK.
2. Tap the downloaded file. If asked, allow **Install unknown apps** for your browser or file manager.
3. Tap **Install**, then **Open**. Updating later: install the new APK over the old one and your progress stays.

### iPhone
Download `CalisthenicsAwakening-<version>-unsigned.ipa` from **[Releases](../../releases/latest)**. Apple only runs signed apps, so sign it with your own Apple ID using [Sideloadly](https://sideloadly.io) (Windows/Mac) or [AltStore](https://altstore.io). With a free Apple ID the app must be re-signed every 7 days. A paid Apple Developer account ($99/year) removes that limit and allows TestFlight.

## Features

- **Skill path:** 22 skills on a winding Duolingo-style path, split into Push, Pull and Core and grouped into units (Push → Planche, Pull → Front Lever, Core & Legs → Human Flag). Tap a lesson to see its next stage and tick it off.
- **Illustrations:** every skill has its own athlete pose. Hero art is built in layers that shift with the phone's tilt for a parallax effect. The trophy, chest, flame and coin art lives in `src/components/art/Illustrations.tsx`; to swap in your own PNGs, put them in `assets/illustrations/` and register them in the `CUSTOM` map at the top of that file.
- **Daily quests:** warm-up, a Push / Pull / Legs workout rotation, a skill to practise, water and protein, plus your own quests. Finish them all to open the daily chest.
- **Streaks and badges:** a 7-day streak strip, best streak, and 15 badges with celebrations.
- **EXP and ranks:** level up from E-Rank *Awakened* to S-Rank *Monarch*.
- **Guided warm-up:** 8 moves, about 5 minutes, with a timer.
- **Diet plan:** calories, macros, water and meal ideas from your body data.
- **Dark and light mode** in Settings, plus a vibration toggle. Everything is saved on the phone.

## Develop

```bash
npm install
npx expo start          # scan the QR code with a development build, or press w for web
npm test                # unit tests for EXP, skill tree, goals and diet logic
npx tsc --noEmit        # type check
```

## Build and publish

GitHub Actions (`.github/workflows/build.yml`) builds the Android APK and an unsigned iOS IPA. To publish a new version, either:

- open **Actions → Build app → Run workflow** and type a tag such as `v0.2.0`, or
- push a tag: `git tag v0.2.0 && git push origin v0.2.0`.

Both attach the files to a GitHub Release for that tag. Running the workflow with no tag only builds; the files then appear as run artifacts.

The APK is signed with the standard debug key, which is fine for sideloading. For the Play Store, set up a release keystore (for example with `eas build`).

## Project layout

```
src/app/            screens (Expo Router): Main, Skills, Diet, Profile, skill detail, warm-up, onboarding, settings
src/components/     UI kit, rank badge, skill illustrations
src/lib/            pure logic: EXP and ranks, skill tree, daily goals, diet, warm-up, app state
```
