# GEKEL buyer app — screens (Expo + React Navigation + NativeWind v4 + TypeScript)

## 1. Install (inside apps/buyer-app)
```bash
pnpm add nativewind react-native-css-interop tailwindcss@^3.4
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-svg expo-linear-gradient expo-image-picker expo-status-bar \
  react-native-safe-area-context react-native-screens react-native-reanimated \
  @react-native-async-storage/async-storage @expo/vector-icons
```
pnpm monorepo? Add `node-linker=hoisted` to the root `.npmrc`, reinstall, then `npx expo start -c`.

## 2. Copy
- `src/` → merge into the app's `src/` (replace the previous version)
- `App.tsx`, `tailwind.config.js`, `global.css`, `nativewind-env.d.ts` → app root
- `babel.config.js`, `metro.config.js` → merge with yours

## 3. Flow
Splash → Onboarding (first launch) → Welcome → Register / Login / Forgot password (OTP 123456) → Home tabs.
Home tabs: Home, Finds, Orders, Chat, Profile. Stack screens: Ask GEKEL, Request detail, Product detail,
Checkout (M-Pesa STK mock), Order tracking, Chat room, Suppliers, Notifications.

## 4. Backend later
- `src/services/authApi.ts` — auth calls
- `src/context/AppDataContext.tsx` — requests, orders, chats, favourites (look for `TODO` comments)
- `src/data/mock.ts` — products, suppliers. Set `image: 'https://…'` on a product to show a real photo instead of the vector art.
