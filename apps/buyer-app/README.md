# GEKEL buyer app (Expo + React Navigation + NativeWind v4 + TypeScript)

## 1. Install (inside apps/buyer-app)
```bash
pnpm add nativewind react-native-css-interop tailwindcss@^3.4
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-svg expo-linear-gradient expo-image-picker expo-location react-native-maps \
  expo-status-bar react-native-safe-area-context react-native-screens react-native-reanimated \
  @react-native-async-storage/async-storage @expo/vector-icons
```
pnpm monorepo? Put `node-linker=hoisted` in the root `.npmrc`, reinstall, then `npx expo start -c`.
Add to `app.json` for location + camera prompts (and an Android Google Maps key for release builds):
`"plugins": [["expo-location", {"locationWhenInUsePermission": "GEKEL uses your location to find shops near you and set your delivery address."}]]`

## 2. Copy
`src/` (replace), `App.tsx`, `tailwind.config.js`, `global.css`, `nativewind-env.d.ts` to the app root; merge `babel.config.js` / `metro.config.js`.

## 3. What is where
- Theme: `tailwind.config.js` (brand red from the logo), `src/theme.ts`
- Ask GEKEL button: `components/AskGekelButton.tsx` (hero + compact). Kanga motif: `components/KangaPattern.tsx`
- Side menu: `components/SideMenu.tsx`, opened from the Home header
- Addresses: `screens/account/*` (GPS, map pin, apartment/door number, default address)
- Cart + combined multi-shop orders: `screens/home/CartScreen.tsx`, `BundleScreen.tsx`
- Delivery + fees: `data/mock.ts` (`deliveryFee`, `SERVICE_FEE`), `screens/home/CheckoutScreen.tsx`
- Chat order flow (OK/No, M-Pesa prompt or Till): `screens/tabs/ChatRoomScreen.tsx`
- Courier tracking + rider photos: `screens/tabs/OrderDetailScreen.tsx`

## 4. Backend later
Every mocked call has a `TODO` in `src/services/authApi.ts` and `src/context/AppDataContext.tsx`.
