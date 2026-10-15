# What's new this round

## Dark mode
`src/context/ThemeContext.tsx` — Light / Dark / Auto, toggle in Profile → Appearance.
Saved to the device and respected everywhere that uses the shared components (`Screen`,
`Button`, `Input`, `Chip`, `ProductCard`, `BackHeader`, `EmptyState`, the tab bar, the side
menu) plus the main list screens. A few very custom screens (splash, onboarding
illustrations, the auth hero) are intentionally brand-red/white in both themes by design.

## Offline mode
`src/context/OfflineContext.tsx` + `src/components/OfflineBanner.tsx`.
- Browsing (Home, Finds, Suppliers) keeps working offline — that data ships with the app.
- Checkout and payments are blocked with a clear message while offline (money actions
  should never silently queue).
- Chat messages sent while offline show a "waiting to send" tag and clear once you're back
  online. (This is UI-pattern-complete; once chat has a real backend, the one `// TODO` in
  `OfflineContext.tsx` becomes "actually re-send the queued message.")
- `services/http.ts` fails auth requests instantly when offline instead of waiting out a
  timeout.

## Categories
15 unique, Kenyan-named aisles (`src/data/mock.ts: CATEGORIES`) — Viatu Mtaani, Duka la
Mama, Fundi Tools, and so on — matching `GET /api/v1/categories` on the API. Browsable
from a new row on Home and as chip filters on Search.

## Every seller does wholesale
`SellerType` is now `'wholesale' | 'both'` — there is no retail-only seller, matching your
instruction to not just be "another Jumia/Kilimall." The Suppliers screen lost its
Wholesalers/Retailers tabs; it's one list with an optional "Retail also available" filter.

## Price comparison
Product pages show GEKEL's price against a typical online-marketplace price and a typical
retail-shop price — no competitor named, just the gap, so the price is self-evidently fair.

## Warranty & returns
Products can carry a warranty (`product.warranty`). A delivered order can be returned:
reason + photo → discuss with the supplier in chat → once they agree, choose who pays the
return pickup (buyer or supplier) → pickup booked. All in `AppDataContext` + the new
`ReturnRequestScreen` and the return card on `OrderDetailScreen`.

## Chama Buy, properly
Not just a progress bar — `src/screens/chama/`: start a group (pick how it pays: everyone
pays their own share, or one person pays on delivery), add members by name + phone (paste
from Contacts) + their own quantity, share an invite link, mark members paid or pick the
payer, then place one combined order once the pool hits the wholesale minimum.

## Gekel Errands
`src/screens/errands/` — local jobs beyond "buy and deliver": queueing, document pickup,
paying a bill in person, hand-delivering something, a grocery run. Its own request type,
its own simple 4-stage tracker.

## Rent-a-Shelf for online sellers
`src/screens/seller/ShelfScreen.tsx` + `RestockScreen.tsx` — restock from a wholesaler
(rider collects, shelves it at GEKEL's sorting centre), see what's stocked and how much
shelf space is used. The idea: a buyer's retail-size order against your stock gets packed
and shipped straight from the shelf — you never touch the parcel.

## GEKEL Points
`src/screens/account/PointsScreen.tsx` — points earned roughly per 100 shillings spent
(plus a flat bonus) on delivery, redeemable for free delivery, a discount, or airtime.

## Follow a supplier
A Follow button on supplier profiles and product pages. Following pushes a (currently
mocked) notification when they "add something new" — the real version needs the supplier
app to exist first (see `ROADMAP.md`), but the buyer-side UI and notification plumbing is
done now.

## Region-based courier / Sacco choice
Outside Nairobi, the buyer picks the long-distance carrier: a Sacco that already runs that
route (Guardian for Kisumu, Super Metro for Kitengela) alongside nationwide couriers —
`transportFor(county)` in `src/data/mock.ts`, wired into Checkout. The copy is explicit
about why: one motorbike rider for Nairobi while GEKEL grows, so the rider hands off to
whoever the buyer trusts for the long haul.

## Buyer-only registration
There is no "join as a supplier" anywhere in this app anymore — matches the real API,
which only ever creates buyer accounts. "I have a supplier" (onboarding, and on the
Suppliers screen) is a *buyer* feature — GEKEL picks up from a supplier you already know —
not a sign-up path.
