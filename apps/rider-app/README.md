# GEKEL Rider (rider app)

Standalone Expo + NativeWind app. Uses your `tailwind.config.js` unchanged and the GEKEL logo (same theme as the supplier app). App id `co.gekel.rider`.

```bash
npm install
npx expo install --check     # aligns every package to the installed Expo SDK
npx expo start               # scan with Expo Go
```

## Demo mode (default)
With `EXPO_PUBLIC_API_URL` empty the app runs on an in-memory mock (`src/lib/api/mock.ts`). Any Kenyan number works; **OTP is `123456`**, customer release PIN **`4821`**. The Pickup screen shows the seal code to type in demo mode.
Try: Radar → go online → open a job → slide to accept → pickup (code + photo) → on the way → arrived → PIN `4821` + photo.

## Real backend
Set `EXPO_PUBLIC_API_URL`. `src/lib/api/http.ts` maps every method to one REST route; shapes are in `src/lib/api/types.ts`. While online or on a delivery the app posts the rider's position to `POST /rider/location` every ~10s for the buyer's tracking screen.

## Screens
Sign in · Radar (online toggle, earnings, live job offers with countdown, resume active delivery) · Job offer (slide to accept / decline, expiry) · Pickup (scan seal QR or type, camera proof) · On the way (open Google/Apple Maps, call/SMS) · Handover (4-digit customer PIN, photo, attempt limit) · Deliveries · Earnings · Profile. Loading, error-with-retry and empty states throughout.

## Choices
- Only your config's colour tokens are used (brand orange-red, not the green rider mock-ups).
- Not included (per doc scope): in-app map (directions open in Maps, no API key needed), wallet cash-out, ride modes, route batching.

## Verification status
Data layer type-checks (strict) and a script exercised the full delivery lifecycle against the mock (incl. wrong seal code, wrong PIN, second job, offline mid-delivery). Screens type-check against stubbed library types. **Not yet run on a device or simulator**: test on Android and iOS against the real backend before calling a screen done.
