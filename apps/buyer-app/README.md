# GEKEL buyer app (Expo + React Navigation + NativeWind v4 + TypeScript)

## 1. Install (inside apps/buyer-app)
```bash
pnpm add nativewind react-native-css-interop tailwindcss@^3.4
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-svg expo-linear-gradient expo-image-picker expo-location react-native-maps \
  expo-secure-store @react-native-community/netinfo \
  expo-status-bar react-native-safe-area-context react-native-screens react-native-reanimated \
  @react-native-async-storage/async-storage @expo/vector-icons
```
`@react-native-community/netinfo` is new this round (powers offline detection) — it's a standard Expo-compatible module, no extra config needed.
pnpm monorepo? Put `node-linker=hoisted` in the root `.npmrc`, reinstall, then `npx expo start -c`.
Set `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`) to point at your Go API from `AUTH_INTEGRATION.md`.

## 2. Copy
Replace the whole `src/` folder, `App.tsx`, `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`; merge `babel.config.js` / `metro.config.js`.

## 3. What's new this round
See `NEW_FEATURES.md` for the full list: dark mode, offline mode, unique Kenyan categories,
price comparison, warranty & returns, Chama Buy (with manual contact invites), Gekel
Errands, Rent-a-Shelf for online sellers, GEKEL Points, follow-a-supplier notifications,
region-based courier/Sacco choice, and buyer-only registration.

## 4. Flow
Splash → Onboarding (first launch) → Welcome → Register / Login / Forgot password (OTP via the real API) → Home tabs.
Bottom bar: Home, Orders, **Search** (large centre button), Chat, Profile.

## 5. Backend later (look for TODO comments)
- `src/services/authApi.ts`, `src/services/usersApi.ts` — already wired to the real Go API, see `AUTH_INTEGRATION.md`
- `src/context/AppDataContext.tsx` — requests, orders, chat, Chama, Errands, Shelf/Restock, returns, points (all mocked; every write path has a `// TODO: POST /...` marking what the real endpoint should do)
- `src/data/mock.ts` — products, suppliers, categories, rewards. Set `image: 'https://…'` on a product for a real photo.
- See `ROADMAP.md` (in the docs bundle) for the suggested order to build the real endpoints in.
