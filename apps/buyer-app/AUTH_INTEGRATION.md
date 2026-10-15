# Auth screens connected to the GEKEL API

Drop these files onto your `gekel-screens-v4` project (same paths). 22 files, nothing else changes.

## 1. Install one package
```bash
npx expo install expo-secure-store
```

## 2. Point the app at the API
Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` (Android emulator `http://10.0.2.2:8080`, real phone `http://<computer LAN IP>:8080`, production `https://...`). Restart with `npx expo start -c`.
Plain `http://` only works in development. Release builds must use HTTPS. (On a real iPhone or in a dev build you may need an ATS / cleartext exception for the local IP.)

## 3. What was wired up
| Screen / file | Endpoint(s) |
|---|---|
| `LoginScreen` | `POST /auth/login` (phone or email) |
| `RegisterScreen` | `POST /auth/register` (server field errors shown under each field; "log in instead" on duplicates) |
| `ForgotPasswordScreen` | `POST /auth/forgot-password` |
| `VerifyOtpScreen` | `POST /auth/verify-otp` (resend countdown follows the server's 60 s cooldown) |
| `ResetPasswordScreen` | `POST /auth/reset-password` (expired link offers "Start again") |
| `VerifyPhoneScreen` (new) | `POST /auth/phone/send-code`, `POST /auth/phone/verify`. Opens once right after signup (the SMS is already on its way) and from a Home banner until the number is verified |
| `AuthContext` | restores the session at launch (`/auth/refresh`), `logout` → `/auth/logout`, `logoutAll`, `updateProfile` → `PATCH /users/me` |
| `EditProfileScreen` (new) | `PATCH /users/me`; shows phone Verified / Verify |
| `SessionsScreen` (new, "Security & devices") | `GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `POST /auth/logout-all` |
| `ChangePasswordScreen` (new) | `POST /auth/change-password` |
| Profile tab | new rows: Edit profile, Security & devices, Change password |

## 4. How the session works in the app
* The **refresh token** (30 days) is stored in the phone's keychain/keystore through `expo-secure-store`. The **access token** (10 min) lives only in memory.
* `services/http.ts` adds the bearer token, and on a `401` it refreshes **once** (shared by every request in flight, because refresh tokens are single-use) and replays the request. If the server rejects the refresh token, the app signs out and the login screen explains why.
* Passwords: 10 to 128 characters with a letter and a number. The screens validate the same rules as the server, and show the server's own messages if it disagrees.
* Every error goes through `utils/apiErrors.ts`: no connection, slow connection, "try again in 14 minutes" on lockouts, and so on.

## 5. Tested
* The whole app type-checks with `tsc --strict` (79 files).
* The real `http.ts`, `authApi.ts`, `usersApi.ts` and `tokenStore.ts` were run against the live Go API (register, phone verification, silent refresh, 6 parallel requests causing exactly one refresh, lockout, change password, session list, restart-restore, OTP reset, stale-session sign-out, logout): 35/35 checks, 3 runs in a row.
* **Not tested on a device**: how the screens look and how the keyboard behaves. Run it once on Android and iOS.

## 6. Good to know
* Your older mock `User` shape is kept (`name`, `phone`, `email`) and now also has `role`, `emailVerified`, `phoneVerified`.
* Registering as a supplier (from the onboarding "I have a supplier" path) sends `role: "supplier"`. Only `buyer` and `supplier` can be self-assigned.
* Phone number changes are intentionally not offered: that number receives the sign-in codes.
