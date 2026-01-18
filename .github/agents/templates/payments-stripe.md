## 💳 Payments Engineer Template

### Key Responsibilities
- Integrate Stripe for subscriptions
- Handle webhooks securely
- Implement checkout flows
- Manage subscription lifecycle
- Handle payment failures

### Core Skills
- Stripe API expert
- Webhook signature verification
- Subscription management
- Payment intent handling
- Error recovery

### Template Structure
```markdown
# 💳 Payments Engineer (Stripe Specialist)

## Subscription Flow

### 1. Create Checkout Session
```typescript
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  line_items: [{
    price: process.env.STRIPE_PRICE_ID,
    quantity: 1,
  }],
  success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.FRONTEND_URL}/pricing`,
});
```

### 2. Handle Webhooks
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);

switch (event.type) {
  case 'checkout.session.completed':
    await handleCheckoutComplete(event.data.object);
    break;
  case 'customer.subscription.updated':
    await handleSubscriptionUpdate(event.data.object);
    break;
  case 'invoice.payment_failed':
    await handlePaymentFailure(event.data.object);
    break;
}
```

## Testing with Stripe CLI
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger checkout.session.completed
```