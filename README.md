# Calisthenics Awakening

Learn calisthenics step by step instead of by trial and error. One app for **Android and iPhone**, built with Expo (React Native).

## Download

Go to **[Releases](../../releases/latest)**:

- **Android:** download `CalisthenicsAwakening-<version>.apk`, open it on your phone and allow *Install unknown apps* when asked.
- **iPhone:** download `CalisthenicsAwakening-<version>-unsigned.ipa`. Apple only runs signed apps, so sign it with your own Apple ID using [Sideloadly](https://sideloadly.io) (Windows/Mac) or [AltStore](https://altstore.io). With a free Apple ID the app must be re-signed every 7 days. A paid Apple Developer account ($99/year) removes that limit and allows TestFlight.

## Features

- **Daily goals:** warm-up, a workout that follows a weekly Push / Pull / Legs rotation, a skill to practise, water and protein targets, plus your own goals. Tick them off for EXP. Finish all of them for a perfect day bonus and keep your streak alive.
- **Skill tree:** 22 skills in 3 branches (Push → Planche, Pull → Front Lever, Core & Legs → Human Flag). Each skill has stages with clear targets. Master a skill to unlock the next one.
- **EXP and ranks:** level up and climb from E-Rank *Awakened* to S-Rank *Monarch*.
- **Guided warm-up:** 8 moves, about 5 minutes, with a timer, pause and skip.
- **Diet plan:** calories, protein, carbs, fat, water and meal ideas from your height, weight, age, sex, goal, activity and diet type (everything, vegetarian, vegan).
- Everything is saved on the phone. No account needed.

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
src/app/            screens (Expo Router): Today, Skills, Diet, Rank, skill detail, warm-up, onboarding
src/components/     UI kit, rank badge, skill illustrations
src/lib/            pure logic: EXP and ranks, skill tree, daily goals, diet, warm-up, app state
```
