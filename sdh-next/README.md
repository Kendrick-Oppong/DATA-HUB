# Smart Data Hub — Next.js

A **faithful port** of the original in-browser React prototype (`../platform/*`) to a
real **Next.js 14 (App Router) + React 18 + TypeScript** application. The **look and
functionality are unchanged** — same CSS, same screens, same mock data and flows.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

- **`/`** — the web **Platform** build (marketing site + logged-in app). Equivalent to the
  original `Smart Data Hub Platform.html`.
- **`/mobile`** — the **Mobile** phone-app build (iPhone frame + mobile shell). Equivalent to
  the original `Smart Data Hub Mobile.html`.

```bash
npm run build && npm start   # production build
```

## How the port works

| Original | Here |
|---|---|
| React/Babel from CDN, `<script type="text/babel">` | Compiled by Next/SWC — no in-browser Babel |
| Globals shared via `window` + `Object.assign(window, …)` | Real **ES modules** with `import`/`export` |
| `platform/data.js` → `window.SDH` | `lib/data.ts` exports `SDH` (also sets `window.SDH` for legacy reads) |
| `platform/*.jsx` screens | `components/*.tsx` (one module per original file) |
| `app.jsx` / `mobile-app.jsx` roots (`ReactDOM.createRoot`) | `components/app.tsx` / `components/mobile-app.tsx` (mounted by the route pages) |
| Shared `AppRouter` (duplicated in both roots) | `components/router.tsx` (single source) |
| `platform/motion.js` IIFE | `components/motion.tsx` — a `MotionLayer` client component (runs in `useEffect`) |
| `ios-frame.jsx` | `components/ios-frame.tsx` |

### Client-only rendering
The prototype uses `window` / `localStorage` / `performance` at render time. To keep behavior
**identical**, the whole app tree is mounted client-side via `next/dynamic(..., { ssr: false })`
in `components/WebClient.tsx` and `components/MobileClient.tsx`. React StrictMode is disabled
(the original had none) so timers/toasts fire exactly once.

### Styling
`styles/web.css`, `styles/platform.css`, `styles/motion.css` are global (imported in
`app/layout.tsx`); `styles/mobile.css` loads **only** on `/mobile`. Fonts and `data-theme="dark"`
match the original. Assets live in `public/assets/`.

## Authentication (MongoDB + Arkesel SMS)

Real account creation and auth back the existing login/signup UI (no UI redesign).

- **Sign up:** validate → send a **4-digit OTP by SMS (Arkesel)** → verify → create the user in **MongoDB** (password hashed with bcrypt) → issue session.
- **Sign in:** email-or-phone + password (no OTP, matching the UI).
- **Forgot password:** phone → reset OTP → verify → signed in.
- **Sessions:** signed **JWT in an httpOnly cookie**; `/api/auth/me` restores the session on load; logout clears it.

### Config — `.env.local`
```
MONGODB_URI=            # blank → in-memory dev store
MONGODB_DB=smart_data_hub
JWT_SECRET=<long-random-string>
ARKESEL_API_KEY=        # blank → OTP printed to server console
ARKESEL_SENDER_ID=SmartDataHub   # transactional sender (OTPs, delivery texts)
ARKESEL_BULK_SENDER_ID=OrderRef  # shared sender agents send bulk campaigns under
ARKESEL_SMS_URL=https://sms.arkesel.com/api/v2/sms/send
OTP_TTL_MINUTES=10
```
**Dev fallbacks:** with `MONGODB_URI` blank the app uses an in-memory user store; with `ARKESEL_API_KEY` blank the OTP is logged to the server console. Set both for real MongoDB + SMS. (Register your Arkesel Sender ID first — MTN requires it.)

### Endpoints (`app/api/auth/*`, Node runtime)
`POST register/start` · `POST register/verify` · `POST login` · `POST logout` · `GET me` · `POST reset/start` · `POST reset/verify`

Server code lives in `lib/server/` (`db`, `users`, `otp`, `arkesel`, `jwt`, `session`, `phone`) — imported only by route handlers, never the client.

## Layout

```
app/
  layout.tsx          # <html data-theme=dark>, global CSS, fonts
  page.tsx            # web build      → WebClient
  mobile/page.tsx     # mobile build   → MobileClient
components/
  WebClient.tsx  MobileClient.tsx      # ssr:false loaders
  app.tsx  mobile-app.tsx  router.tsx  # roots + shared router
  store.tsx  ui.tsx  icons.tsx  motion.tsx  ios-frame.tsx
  …one module per original platform/*.jsx screen…
lib/data.ts                            # SDH data model
styles/                                # ported CSS
```
# sdh
