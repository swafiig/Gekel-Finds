# GEKEL Seller (supplier app)

Standalone Expo + NativeWind app. Uses your `tailwind.config.js` unchanged and the GEKEL logo (icon, splash, header mark). App id `co.gekel.seller`.

```bash
npm install
npx expo install --check     # aligns every package to the installed Expo SDK
npx expo start               # scan with Expo Go
```

## Demo mode (default)
With `EXPO_PUBLIC_API_URL` empty the app runs on an in-memory mock (`src/lib/api/mock.ts`) that enforces the real order state machine. Any Kenyan number works; **OTP is `123456`**.
Try: Orders → "To confirm" → #GK-10460 → type `26000` → Payment received → Pack (photo) → Mark ready → handoff QR/code appears.

## Real backend
Set `EXPO_PUBLIC_API_URL`. `src/lib/api/http.ts` maps every method to one REST route (the API contract for the Go service); shapes are in `src/lib/api/types.ts`.

## Screens
Sign in (phone + OTP) · Home · Requests + quote · Catalogue + Add/Edit product (photo required, stock, wholesale tiers) · Orders by stage → confirm payment → pack with camera proof + seal serial → mark ready → handoff QR · Chat · Catalogue import (WhatsApp, manual per the build doc) · Profile (shop, Till, support, sign out). Loading, error-with-retry and empty states throughout.

## Choices
- Payments follow the build doc: buyer pays your Till directly, you confirm the amount, and packing is blocked until then. GEKEL never holds your sales.
- Only your config's colour tokens are used; status pills use success / brand / neutral / danger.
- Not included (per doc scope): video call, live showroom, analytics page.

## Verification status
Data layer type-checks (strict) and a script exercised the full supplier lifecycle against the mock (17 checks). Screens type-check against stubbed library types. **Not yet run on a device or simulator**: test on Android and iOS against the real backend before calling a screen done.
