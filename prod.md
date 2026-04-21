# Lootr — Production Readiness Plan

**Written:** 2026-04-21  
**Status:** Post-hackathon polish → App Store submission

---

## What We're Working With

The core loop (scan → game → play → map) is built and functional. The backend runs on Express + Neon Postgres. The mobile app is Expo 54 / React Native 0.81. The architecture is solid and clean — this isn't a rewrite, it's a polish + feature sprint.

---

## Phase 0 — Decisions Made (Do These First)

### 0.1 Kill the Ocean Theme
The deep-sea palette (`#02070b` backgrounds, cyan/seafoam accents) was chosen fast for hackathon aesthetics. For App Store, we want something that reads as a modern consumer game app — bold, high-contrast, and fun without being dark and niche.

**Recommended replacement:** Dark neutral base with vibrant per-game-type accents.
- Background: `#0f0f0f` (pure dark, not oceanic blue-black)
- Surface: `#1a1a1a`, `#242424`
- Primary accent: Bright white + vivid color per game type (already in theme — just swap the blues/teals)
- Text: `#ffffff`, `#a0a0a0`, `#606060`
- The 6 game-type coral/indigo colors can stay — they already work well

**Files to update:** `mobile/theme.js` only. Every screen imports from there, so one file change ripples everywhere. Audit each screen after to check contrast and legibility.

### 0.2 Home Screen → Camera Screen
Currently: hero scan button + recent games list.  
**Target:** Launch straight into the camera viewfinder. The scan button IS the home screen.

This is the right call. The product is "point at something, play a game." The camera should be the first thing a user sees after onboarding.

**Approach:**
- Replace `HomeScreen.js` with a full-screen camera viewfinder using `expo-camera` (already installed)
- Floating bottom tray with recent games (last 3, horizontal scroll)
- Single large shutter button to scan
- Navigation to Map/Games stays via bottom tab bar overlaid on the camera

**Risk:** Camera permissions need to be requested gracefully on first launch — handle this in the onboarding flow (Phase 1).

### 0.3 Random Username + Avatar System
No auth needed. On first launch, assign:
- Username: `player` + 5-digit random number (e.g., `player44891`)
- Avatar: 6 options, user picks one during onboarding, stored in AsyncStorage

**Implementation:**
- On app first open, generate username + default avatar index → store in AsyncStorage under `lootr.userProfile`
- Profile screen reads from AsyncStorage instead of hardcoded values
- Stats (scanned, plays) should be derived from real AsyncStorage game data, not hardcoded
- 6 avatar options: simple colored geometric avatars rendered with React Native (no image assets needed)

---

## Phase 1 — Onboarding Screen

**Goal:** One screen, 10-second experience, sets up username + avatar, then never shows again.

**Layout:**
- Full-screen background: animated game footage (screen-record the timing or dodge game — looks authentic)
- Semi-transparent dark overlay (60% black)
- Top: Lootr logo / wordmark
- Middle: Avatar picker — 6 circles, tap to select (highlighted ring on selected)
- Username display: `player44891` with a shuffle/re-roll button
- Bottom: Large "Ready to Play" button → navigates to camera home, sets `lootr.onboarded = true` in AsyncStorage
- Subtitle: *"Point your camera at anything."*

**Files needed:**
- `mobile/screens/OnboardingScreen.js` (new)
- `mobile/utils/userProfile.js` (new — generate/read/write user profile)
- Update `App.js` to check `lootr.onboarded` on launch and conditionally show onboarding

---

## Phase 2 — App Store Polish (Full List)

### 2.1 Critical (Blockers)

| Issue | Fix |
|-------|-----|
| No app icon | Design and add proper 1024×1024 icon to `app.json` |
| No splash screen | Expo splash is white default — set branded dark splash |
| Profile screen is entirely fake | Wire to real AsyncStorage data |
| Stats are hardcoded | Compute from `lootr.scannedGames` — count scanned, played, etc. |
| No error states shown to user | Scan failure, network down, LLM timeout — add user-facing messages |
| Camera permission denied → app breaks | Add graceful permission denied state with instructions to enable |
| Location permission flow | Request at right time (on first scan, not on launch) |

### 2.2 UX Fixes

| Issue | Fix |
|-------|-----|
| Tab bar is Material Top Tabs (horizontal swipe nav) | Switch to standard Bottom Tabs — users expect bottom nav |
| Scan result modal has no animation | Slide-up with spring animation feels much more premium |
| Game-over screen is abrupt | Add score summary with share button |
| Map pins are generic | Use colored pins per game type |
| No haptics on key actions | Already have `expo-haptics` installed — add on scan start, game start, score events |
| Loading states are bare ActivityIndicator | Replace with skeleton screens or branded loading animation |

### 2.3 Backend / Reliability

| Issue | Fix |
|-------|-----|
| No rate limiting | Add `express-rate-limit` on `/api/v1/scan` (Groq cost protection) |
| Groq API key exposure risk | Confirm it's only in backend `.env`, never shipped in the mobile bundle |
| No request validation on backend | Scan endpoint accepts any base64 — add size/format checks |
| Human Delta integration is a stub | Remove the dead import or actually implement it |
| ArcGIS sync failures are silent | Log and surface errors, don't block game creation on ArcGIS failure |
| No DB migrations system | Add `/db/migrations/` folder with numbered SQL files |
| `axios` imported but unused in mobile | Remove it (reduces bundle size) |
| `zustand` imported but unused | Remove or wire it up for game state |

### 2.4 App Store Requirements (Apple-specific)

| Requirement | Status |
|-------------|--------|
| Privacy policy URL | ❌ Required for camera + location usage |
| App Store screenshots (6.5", 5.5") | ❌ Need to create |
| App description (4000 char max) | ❌ Write it |
| Age rating questionnaire | ❌ Fill out (likely 4+) |
| Camera usage description in `app.json` | ✅ Present |
| Location usage description | ✅ Present |
| No 3rd-party login required | ✅ Anonymous works fine for App Store |
| Support URL | ❌ Need one |

### 2.5 Performance

| Issue | Fix |
|-------|-----|
| Map screen loads all games | Add pagination or limit to 50 nearest |
| AsyncStorage reads are synchronous-feeling | Add loading states on screens that read from storage |
| Base64 image sent to backend | Already resizing to 512px — confirm compression is applied consistently |

---

## Phase 3 — Post-Launch (After App Store Approval)

- Implement Human Delta feedback loop properly
- Add share mechanic: "I scored 847 in Bottle Dodge" → shareable image card
- Push notifications when someone plays your placed game
- Leaderboard per placed game (top scores)
- Analytics (Mixpanel or Amplitude free tier)
- Game report/flag system for inappropriate content

---

## Suggested Build Order

```
Week 1 (Claude + Codex):
  [ ] New theme — mobile/theme.js overhaul (2 hours)
  [ ] userProfile utility + username/avatar generation (2 hours)
  [ ] OnboardingScreen.js (4-6 hours)
  [ ] HomeScreen → CameraScreen refactor (4-6 hours)
  [ ] Fix ProfileScreen to use real AsyncStorage data (2 hours)

Week 2:
  [ ] Bottom tab nav refactor (2-3 hours)
  [ ] Scan error states + permission denied flows (3 hours)
  [ ] Backend: rate limiting + input validation (2 hours)
  [ ] Remove dead code: axios, zustand, human-delta stub (1 hour)
  [ ] App icon + splash screen (2-3 hours with design tool)

Week 3:
  [ ] App Store assets: screenshots, description, privacy policy (4-6 hours)
  [ ] Full device testing on physical iOS device (4+ hours)
  [ ] Fix any crashes found during testing
  [ ] Submit to TestFlight first
  [ ] Address App Store review feedback
```

---

## Time Estimate

| Phase | Solo | With Claude + Codex |
|-------|------|---------------------|
| Phase 0 (theme + home screen) | 1 day | 2-4 hours |
| Phase 1 (onboarding) | 2 days | 4-6 hours |
| Phase 2 (App Store polish) | 2 weeks | 1 week |
| App Store assets + submission | 2-3 days | 1-2 days |
| **Total to submission** | **~4 weeks** | **~2 weeks** |

---

## Highest ROI Right Now

If you only do 5 things before submission, do these:

1. **New theme** — First impression. 2 hours, massive visual impact.
2. **Camera as home screen** — Communicates the product instantly.
3. **Onboarding screen** — Required for App Store UX standards; sets up username + avatar.
4. **Real profile stats** — Fake hardcoded data will get flagged in App Store review.
5. **Rate limiting on scan endpoint** — One viral post could blow your Groq bill overnight.

---

## What NOT to Touch

- Game engines (dodge, catch, balance, swipe, timing, runner) — they work, leave them alone
- Backend routing structure — it's clean
- ArcGIS integration — functional, not worth reworking
- Zod validation schemas — keep them
- AsyncStorage storage strategy — works fine for anonymous users at this scale
