# GEKEL Ops Console (Next.js)

One admin web app for GEKEL operations: live hub radar, orders and dispatch, requests, supplier verification,
riders, disputes, fee payments, rules and team, and an audit log. Black, orange and white.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · TypeScript. No other runtime dependencies.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Routes

| Route | Page |
| --- | --- |
| `/` | Overview: radar, KPIs, alerts, live feed |
| `/orders` | Orders table + detail drawer (`?open=<orderId>`) |
| `/requests` | Buyer requests |
| `/suppliers` | Review queue, verified, suspended (`?id=<supplierId>`) |
| `/riders` | Dispatch queue + riders (`?open=<riderId>`) |
| `/disputes` | Cases, evidence, rulings (`?id=DIS-882`) |
| `/payments` | GEKEL fee stream and unmatched payments |
| `/rules` | Fee and dispatch rules, team, roles |
| `/audit` | Audit log |

## Structure

```
src/app            routes, layout, globals.css (design tokens, light + dark)
src/components     Shell (sidebar, top bar, search), Overlay (toasts, dialogs, drawers), ui, icons
src/features       one component per page, plus shared dialogs
src/lib            types, constants, seed data, store + live engine, actions
```

## Sample data

Everything runs on in-memory sample data (`src/lib/seed.ts`) with a simulated live engine (`tickEngine` in `store.ts`).
It is created on the client after load, so nothing is fetched. To connect a real backend, replace the functions in
`src/lib/actions.ts` and the reads in `src/lib/store.ts` with API calls; the pages only use those two modules.

## Business rules the console follows

- Buyers pay the supplier's Till directly. GEKEL never holds item money; rulings that return item money are paid by the supplier.
- GEKEL's own fee is collected separately by Daraja STK push and reconciled under Payments.
- Permissions: Super admin, Ops lead, Support, Verifier, Finance. "View as another role" in the top bar previews them.
