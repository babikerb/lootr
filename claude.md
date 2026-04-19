# 🧠 Project: Lootr

Lootr is a mobile app that turns real-world objects into playable mini-games.

Users:
1. Scan an object with their camera
2. AI determines the best-fit game type
3. A mini-game launches instantly
4. Users can place the game on a map
5. Other users can discover and play those games
6. Users provide feedback → system improves

---

# 🎯 Core Principles

- Speed > perfection
- Demo reliability is the top priority
- Always preserve core loop: scan → game → play → map
- Keep systems simple and predictable
- AI should feel responsive and consistent
- Human feedback must be visible and meaningful

---

# 🧱 Tech Stack

## Mobile
- React Native (Expo)

## AI
- Groq API (LLM)
- Local object detection (MediaPipe or fallback)

## Backend
- Node.js + Express

## Database
- Neon (Postgres)

## Maps
- ArcGIS (Esri)

## Feedback / Evaluation
- Human Delta API

---

# 🔁 Core Flow

1. Capture image
2. Detect object label
3. Send to LLM (Groq)
4. Receive:
   - gameType
   - parameters
   - title
5. Launch game
6. User plays
7. User submits feedback (👍 / 👎)
8. Feedback sent to Human Delta + stored locally
9. User places game on map
10. Other users discover and play

---

# 🎮 Game System

## Allowed Game Types
- dodge
- catch
- balance
- swipe
- timing
- runner

## Rules
- Every object MUST map to one of these
- No dynamic game creation beyond these
- LLM only selects type + parameters
- Game engines are prebuilt and reusable

---

# 🎨 Theme

**Style:** Deep sea. Dark, muted, oceanic.

All colors live in `mobile/theme.js` — always import from there, never hardcode hex values.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0d1f1e` | Screen backgrounds |
| `surface` | `#142e2c` | Cards, tab bar, inputs |
| `teal` | `#3A8F6D` | Primary accent, active states, capture button |
| `tealDark` | `#2F7C7F` | Secondary teal |
| `blue` | `#346A7F` | Tertiary accent |
| `indigo` | `#50588F` | Quaternary accent |
| `purple` | `#4A4182` | Quinary accent |
| `text` | `#e0f0ee` | Primary text |
| `textMuted` | `rgba(224,240,238,0.45)` | Secondary text, inactive icons |

---

# 🧠 AI Integration Rules

- Only ONE LLM call per scan
- LLM must return structured JSON
- Always validate response before use
- Provide fallback gameType if LLM fails

Example:
```json
{
  "gameType": "dodge",
  "title": "Bottle Dodge",
  "speed": 1.2
}
