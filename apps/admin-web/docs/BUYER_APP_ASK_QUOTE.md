# Buyer app: "Ask quote" button and a local name for "Order now"

## 1. The name

"Order now" is on every shop in Kenya. Pick one of these and keep it everywhere (button, chat bubble, notifications, SMS).

| Name | Means | Why it fits GEKEL |
|---|---|---|
| **Nipakie** (recommended) | "Pack it for me" | Matches "we find, we pack, we deliver". Short, friendly, nobody else uses it as a button. |
| Niletee | "Bring it to me" | Sounds like a delivery promise. |
| Nipe hii | "Give me this one" | Casual, market-stall feel. Works for Sheng speakers. |
| Beba | "Take it" | One word, very short. Good if the button is small. |

Pair it with the quote button: **Uliza bei** ("Ask the price"). So the product page has two buttons: `Uliza bei` (outline) and `Nipakie` (orange).
Keep the English words as a small second line for new users ("Ask quote" / "Order"), and let people switch in Settings. Search the Play Store and a trademark check on the final choice before printing it on anything. I cannot confirm nobody has registered it.

Where to change the label: one place only. Add `export const ORDER_LABEL = 'Nipakie'; export const QUOTE_LABEL = 'Uliza bei';` to `data/mock.ts` and use them in the product screen, the cart, the chat quote bubble and the notification text.

## 2. What "Ask quote" does

Today **Order now** calls `placeBundle`, which creates an order and a chat message in one go. A buyer who only wants a price or to check stock has no way to do that without creating an order.

New flow:

1. Buyer taps **Uliza bei** on a product. A small sheet asks for quantity and an optional note ("black, size 42", "need 50 by Friday").
2. The app posts that message in the supplier chat and creates a **quote ask** (no order, no fees, nothing to pay).
3. The supplier answers with a price from the seller app. The reply appears in the chat as a quote bubble with **Nipakie** and **Not now**.
4. **Nipakie** creates the real order at the agreed price. From here it is the normal order flow.
5. If the supplier does not answer in 20 minutes, the admin console Quotes page flags it and staff can nudge the supplier. After a day it expires.

## 3. Code for `AppDataContext.tsx`

Types (add near `Message`):

```ts
export interface QuoteAsk {
  id: string; productId: string; qty: number; note?: string; chatId: string;
  status: 'waiting' | 'answered' | 'ordered' | 'declined' | 'expired';
  price?: number;            // unit price the supplier quoted
  createdAt: number;
}
// in Message, add:   quoteAskId?: string;
// in BundleInput, add:   priceOverride?: Record<string, number>; // productId -> agreed unit price
```

Context interface (add):

```ts
quoteAsks: QuoteAsk[];
askQuote: (productId: string, qty: number, note?: string) => string;
answerQuoteAsk: (id: string, unitPrice: number) => void;       // called by the websocket / push in production
acceptQuoteAsk: (id: string, i: Omit<BundleInput, 'lines'>) => void;
declineQuoteAsk: (id: string) => void;
```

State and functions (inside `AppDataProvider`):

```ts
const [quoteAsks, setQuoteAsks] = useState<QuoteAsk[]>([]);

const askQuote: Ctx['askQuote'] = useCallback((productId, qty, note) => {
  const p0 = PRODUCTS.find((x) => x.id === productId)!;
  const supplier = sup(p0.supplierId);
  const id = uid(); const chatId = `s-${supplier.id}`;
  setQuoteAsks((p) => [{ id, productId, qty, note, chatId, status: 'waiting', createdAt: Date.now() }, ...p]);
  post(chatId, { from: 'me', text: `Hi! Please quote ${qty} × ${p0.name}${note ? ` (${note})` : ''}. Is it available and what is your best price?` }, supplier);
  // TODO: POST /quote-asks  { productId, qty, note }. The backend writes the chat message and notifies the supplier.
  // Demo only: the shop answers after a moment.
  setTimeout(() => answerQuoteAsk(id, unitPriceFor(productId, qty)), 1600);
  return id;
}, [post]);

const answerQuoteAsk: Ctx['answerQuoteAsk'] = useCallback((id, unitPrice) => {
  setQuoteAsks((p) => p.map((q) => (q.id === id && q.status === 'waiting' ? { ...q, status: 'answered', price: unitPrice } : q)));
  setQuoteAsks((p) => {
    const q = p.find((x) => x.id === id);
    if (q) {
      const p0 = PRODUCTS.find((x) => x.id === q.productId)!;
      post(q.chatId, { from: 'them', kind: 'quote', quoteAskId: id, amount: unitPrice * q.qty,
        text: `Yes, available ✅ ${q.qty} × ${p0.name} at KSh ${unitPrice.toLocaleString('en-KE')} each. Total KSh ${(unitPrice * q.qty).toLocaleString('en-KE')}.` });
    }
    return p;
  });
}, [post]);

const acceptQuoteAsk: Ctx['acceptQuoteAsk'] = useCallback((id, rest) => {
  const q = quoteAsks.find((x) => x.id === id);
  if (!q || q.status !== 'answered') return;
  setQuoteAsks((p) => p.map((x) => (x.id === id ? { ...x, status: 'ordered' } : x)));
  placeBundle({ ...rest, lines: [{ productId: q.productId, qty: q.qty }], priceOverride: { [q.productId]: q.price! } });
}, [quoteAsks, placeBundle]);

const declineQuoteAsk: Ctx['declineQuoteAsk'] = useCallback((id) => {
  setQuoteAsks((p) => p.map((x) => (x.id === id ? { ...x, status: 'declined' } : x)));
}, []);
```

One change inside `placeBundle`, where the items are built:

```ts
const items: OrderItem[] = ls.map((l) => ({
  productId: l.productId, qty: l.qty,
  unitPrice: priceOverride?.[l.productId] ?? unitPriceFor(l.productId, l.qty),   // <- was unitPriceFor(...)
}));
```

Because the buyer already agreed the price, set `quote: 'accepted'` on orders made from a quote ask and skip the second "Shall I pack it?" message. Then the supplier goes straight to sending the Till number.

Add `quoteAsks, askQuote, answerQuoteAsk, acceptQuoteAsk, declineQuoteAsk` to the memoised `value` and its dependency list.

## 4. Product screen

```tsx
<View className="flex-row gap-3">
  <Pressable onPress={() => setAskOpen(true)} className="flex-1 h-12 rounded-xl border border-brand items-center justify-center">
    <Text className="text-brand font-bold">{QUOTE_LABEL}</Text>
    <Text className="text-ink-3 text-[11px]">Ask quote</Text>
  </Pressable>
  <Pressable onPress={onOrder} className="flex-1 h-12 rounded-xl bg-brand items-center justify-center">
    <Text className="text-white font-bold">{ORDER_LABEL}</Text>
  </Pressable>
</View>
```

`onOrder` keeps today's behaviour (goes through the cart and `placeBundle`). The ask sheet calls `askQuote(product.id, qty, note)`, then `router.push('/chat/' + chatId)`.

In the chat screen, render messages with `kind === 'quote' && quoteAskId` as a bubble with two buttons: **Nipakie** calls `acceptQuoteAsk(quoteAskId, { address: defaultAddress, delivery })` (or opens the delivery picker first if the buyer has not chosen one), and **Not now** calls `declineQuoteAsk`.

## 5. What the other apps and the console need

- **Seller app:** a "Quote requests" list. Tap one, enter the unit price (or "not available"), send. This calls `answerQuoteAsk` on the server, which posts the quote bubble to the buyer. Buyers with Quote Pending should never see an empty chat.
- **Admin console:** Quotes page already lists open asks, who is waiting, how long, and has a Nudge supplier button.
- **Backend:** `POST /quote-asks`, `POST /quote-asks/:id/answer`, `POST /quote-asks/:id/accept` (creates the order at the quoted price), plus a job that expires asks after 24 hours.
