# GEKEL Ops Console (Next.js)

One admin web app for GEKEL operations, split by department. Black, orange and white, light and dark mode.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · TypeScript. No other runtime dependencies.

## Run

```bash
npm install
npm run dev        # http://localhost:3000  (redirects to /login)
npm run build && npm start
```

Demo sign-ins (password `Gekel#2026`): rashid@gekel.co (Super admin), karanja@gekel.co (Ops lead), wanjiru@gekel.co (Sourcing),
achieng@gekel.co (Support), farah@gekel.co (Finance), otieno@gekel.co (Tech).

## Sign-in only, staff add staff

There is no sign-up. A Super admin opens **Staff, Add staff**, enters name, email, department and role. The console generates a
password (like `Hk7m-Pq4t-Xw9n`), shows it once with a copy-ready message, and the new person must choose their own password on first sign-in.
Super admins can also make a new password, switch someone off, change role or remove them.
`src/lib/auth.ts` keeps accounts in the browser for the demo (salted PBKDF2 hashes, never plain passwords). **Replace it with your
API before launch**: real sign-in must be checked on a server, not in the browser.

## Sections

| Group | Pages |
| --- | --- |
| Operations | Overview, Orders, Quotes (buyer asks and supplier quote requests), Errands |
| Sourcing | Find GEKEL (manual sourcing board), Own-supplier jobs (logistics only) |
| Logistics | Riders and dispatch, Restock and shelves (Rent-a-Shelf) |
| Suppliers | Suppliers (review queue, verified, suspended) |
| Growth | Chama Buy, GEKEL Points, Messages and alerts (bulk push, SMS, templates, automatic messages) |
| Suluhu desk | Disputes and returns in one place ("suluhu" is Swahili for solution) |
| Finance | Payments (fee stream, unmatched payments) |
| Tech | App health (buyer, seller, rider: up or down, active users, crashes, versions, maintenance mode), Logs, Integrations |
| Team and rules | Staff, Pricing and rules, Audit log |

**Pricing and rules** covers: Nairobi delivery fee per area (standard and express), other-area fees, free delivery over an amount,
offers and codes, up-country couriers per county (for example Kisumu by Ena Coach KSh 500), holiday seasons with surcharges and cut-off dates,
gift rules (for example GEKEL merchandise above KSh 30,000), errand prices, own-supplier fee, shelf rent, and the core fee formula.
A "Try a delivery" panel shows what a buyer would pay under the drafted rules before you save. `src/lib/pricing.ts` is the one function
(`deliveryQuote`) your backend and buyer app should mirror.

## Integrations

Start with Daraja, an SMS gateway, Firebase push and your couriers. Each card lists the exact steps to get its keys and where to paste them.
Add anything else with "Add another". Keys belong in your server environment; this console only stores the last 4 characters in the demo.

## Structure

```
src/app            routes (console group + /login), globals.css (tokens, light + dark)
src/components     Shell (sidebar, top bar, search), Overlay (toasts, dialogs, drawers), ui, icons
src/features       one component per page
src/lib            types, constants, seed data, store + live engine, actions, pricing, auth
docs/              BUYER_APP_ASK_QUOTE.md: the Ask quote button and the new name for Order now
```

## Sample data

Everything runs on in-memory sample data (`seed.ts`, `seed2.ts`) with a simulated live engine (`tickEngine`). To connect a real backend,
replace `actions.ts`, `actions2.ts`, `auth.ts` and the reads in `store.ts` with API calls; the pages only use those modules.

## Business rules the console follows

- Buyers pay the supplier's Till directly. GEKEL never holds item money; rulings that return item money are paid by the supplier.
- GEKEL's own fee is collected separately by Daraja STK push and reconciled under Payments.
- Permissions: Super admin, Ops lead, Support, Verifier, Finance, Sourcing agent, Tech. "View as another role" under your account previews them.

## Checked so far

Type-checked and exercised in a real browser (every page, sign-in, staff creation with forced password change, rules save, integrations drawer,
dark mode, phone width) using a build harness. A full `next build` has not been run here because the package registry was not reachable;
run `npm install && npm run build` once and send me any error.
