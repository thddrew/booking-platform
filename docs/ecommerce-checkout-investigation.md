# Ecommerce Template Checkout System Investigation

## Overview

Investigation of the Payload CMS ecommerce template to understand how it implements checkout/cart functionality and how it can be adapted for the booking platform's event booking system.

**Source**: [Payload Ecommerce Template](https://github.com/payloadcms/payload/tree/main/templates/ecommerce)

---

## Key Findings

### 1. Plugin-Based Architecture

The ecommerce template uses **`@payloadcms/plugin-ecommerce`** plugin which provides:

- **Cart management** (`useCart` hook)
- **Payment processing** (`usePayments` hook with Stripe adapter)
- **Address management** (`useAddresses` hook)
- **Collections**: Carts, Orders, Transactions, Addresses
- **Product variants** support

**Plugin Configuration** (`src/plugins/index.ts`):

```typescript
ecommercePlugin({
  access: {
    adminOnlyFieldAccess,
    adminOrPublishedStatus,
    customerOnlyFieldAccess,
    isAdmin,
    isDocumentOwner,
  },
  customers: {
    slug: "users",
  },
  payments: {
    paymentMethods: [
      stripeAdapter({
        secretKey: process.env.STRIPE_SECRET_KEY!,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
      }),
    ],
  },
  products: {
    productsCollectionOverride: ProductsCollection,
  },
});
```

### 2. Current Booking Platform Implementation

Your booking platform currently has:

- ✅ **Bookings collection** (similar to Orders)
- ✅ **Stripe integration** (custom implementation, not using plugin)
- ✅ **Customers collection**
- ✅ **Payment status tracking**
- ✅ **Stripe Connect** (multi-tenant payments)
- ✅ **Admin checkout flow** (`/admin/checkout`)
- ❌ **No public-facing checkout/cart**
- ❌ **No cart persistence**
- ❌ **No guest checkout flow**

### 3. Key Differences

| Feature                | Ecommerce Template                         | Booking Platform                  |
| ---------------------- | ------------------------------------------ | --------------------------------- |
| **Cart System**        | Uses `@payloadcms/plugin-ecommerce` plugin | No cart - direct booking creation |
| **Checkout Flow**      | Public-facing (`/checkout`) with cart      | Admin-only (`/admin/checkout`)    |
| **Address Management** | Plugin-provided Addresses collection       | Not present                       |
| **Payment Method**     | Stripe Elements (embedded UI)              | Stripe Checkout (redirect)        |
| **Multi-tenancy**      | Single tenant                              | Multi-tenant with Stripe Connect  |
| **Order Model**        | Orders collection (plugin)                 | Bookings collection (custom)      |
| **Product Model**      | Products with variants                     | Events with pricing tiers         |

---

## Ecommerce Template Architecture

### Cart Management

**Location**: `src/components/Cart/`

**Components**:

- `CartModal.tsx` - Sheet/modal showing cart items
- `AddToCart.tsx` - Button to add products to cart
- `DeleteItemButton.tsx` - Remove items from cart
- `EditItemQuantityButton.tsx` - Update item quantities
- `OpenCart.tsx` - Trigger button for cart modal

**Usage Pattern**:

```typescript
'use client'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

export function AddToCart({ product }: Props) {
  const { addItem, cart, isLoading } = useCart()

  const addToCart = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    addItem({
      product: product.id,
      variant: selectedVariant?.id ?? undefined,
    }).then(() => {
      toast.success('Item added to cart.')
    })
  }, [addItem, product, selectedVariant])

  return <Button onClick={addToCart}>Add To Cart</Button>
}
```

**Key Features**:

- Cart is managed client-side via React hooks
- Persisted to backend (Carts collection)
- Supports guest carts (unclaimed carts by ID)
- Real-time inventory checking
- Quantity limits based on inventory

### Checkout Flow

**Route**: `/checkout` → `/checkout/confirm-order`

**Components**:

- `CheckoutPage.tsx` - Main checkout page with:
  - Contact information (email for guests, user info for logged-in)
  - Billing address selection/creation
  - Shipping address (optional, can match billing)
  - Payment section (Stripe Elements)
- `CheckoutAddresses.tsx` - Address selection component
- `ConfirmOrder.tsx` - Order confirmation after payment

**Flow**:

1. User adds items to cart
2. Navigate to `/checkout`
3. Enter contact info (email if guest, auto-fill if logged in)
4. Select/create billing address
5. Optionally set shipping address
6. Click "Go to payment" → Initiates Stripe Payment Intent
7. Stripe Elements renders payment form
8. Submit payment → Redirects to `/checkout/confirm-order`
9. Confirm order → Creates Order, clears cart, redirects to order page

**Payment Implementation**:

```typescript
// CheckoutPage.tsx
const { initiatePayment } = usePayments();
const { confirmOrder } = usePayments();

// Initiate payment intent
const paymentData = await initiatePayment("stripe", {
  additionalData: {
    customerEmail: email,
    billingAddress,
    shippingAddress,
  },
});

// CheckoutForm.tsx - After Stripe payment confirmation
const { paymentIntent } = await stripe.confirmPayment({
  elements,
  redirect: "if_required",
});

if (paymentIntent?.status === "succeeded") {
  const confirmResult = await confirmOrder("stripe", {
    additionalData: {
      paymentIntentID: paymentIntent.id,
      customerEmail,
    },
  });

  clearCart();
  router.push(`/orders/${confirmResult.orderID}`);
}
```

### Provider Setup

**Location**: `src/providers/index.tsx`

```typescript
<EcommerceProvider
  enableVariants={true}
  api={{
    cartsFetchQuery: {
      depth: 2,
      populate: {
        products: { slug: true, title: true, gallery: true, inventory: true },
        variants: { title: true, inventory: true },
      },
    },
  }}
  paymentMethods={[
    stripeAdapterClient({
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    }),
  ]}
>
  {children}
</EcommerceProvider>
```

---

## Adapting for Booking Platform

### Considerations

1. **Plugin vs Custom Implementation**:
   - The ecommerce plugin is designed for Products/Orders/Carts
   - Booking platform uses Events/Bookings which have different structure
   - Current Stripe Connect implementation is multi-tenant specific
   - **Recommendation**: Adapt patterns, don't use plugin directly

2. **Cart Concept for Bookings**:
   - Ecommerce: Cart holds multiple products → Checkout → Single Order
   - Bookings: Each booking is event-specific with selected timeslot
   - **Question**: Do we need a cart, or is it one booking per checkout?
   - **Potential**: Cart could hold multiple event bookings (multiple events, multiple timeslots)

3. **Checkout Flow Differences**:
   - Ecommerce: Guest checkout with email, addresses, payment
   - Bookings: Need event selection, timeslot selection, pricing tier selection, attendee count, customer info, payment
   - **More complex**: Bookings require more context (event, schedule, pricing)

4. **Stripe Integration**:
   - Ecommerce: Uses Stripe Elements (embedded payment form)
   - Bookings: Currently uses Stripe Checkout (redirect-based)
   - **Current**: Uses Stripe Connect for multi-tenant (different Stripe accounts per tenant)
   - **Decision**: Keep Stripe Connect or adapt to single account?

---

## Recommended Approach

### Option 1: Build Custom Cart/Checkout (Recommended)

**Rationale**:

- Bookings have unique structure (events, timeslots, pricing tiers)
- Multi-tenant Stripe Connect already implemented
- More control over booking-specific flows
- Can reuse existing Booking collection and payment hooks

**Implementation Plan**:

1. **Cart System** (if needed):
   - Create `Cart` or `BookingCart` collection
   - Store: `{ eventId, timeslot, pricingTier, quantity, tenantId }`
   - Support guest carts (unclaimed by user ID)
   - Client-side cart management component

2. **Public Checkout Flow**:

   ```
   /events/[eventSlug]
     → Select timeslot & pricing tier
     → Add to cart (or proceed to checkout directly)
     → /checkout
     → Enter customer info (or use saved)
     → Review booking details
     → Payment (Stripe Elements or Checkout)
     → Confirm booking
     → /bookings/[bookingId]/success
   ```

3. **Checkout Components** (adapt from ecommerce):
   - `EventBookingCheckout.tsx` - Main checkout page
   - `BookingReview.tsx` - Review booking details (event, timeslot, pricing)
   - `CustomerInfoForm.tsx` - Customer information collection
   - `PaymentSection.tsx` - Stripe payment integration
   - `BookingConfirmation.tsx` - Success page

4. **Payment Integration**:
   - Keep Stripe Connect for multi-tenant
   - Use Stripe Elements (like ecommerce) for embedded payment
   - Or keep Stripe Checkout (redirect-based) if preferred
   - Adapt `createCheckoutSessionSecret` to work with bookings

### Option 2: Use Ecommerce Plugin (Less Recommended)

**Challenges**:

- Plugin is designed for Products, not Events/Bookings
- Would need to map Events → Products, Bookings → Orders
- Stripe Connect multi-tenancy not supported by plugin
- Significant refactoring required
- Less flexibility for booking-specific features

---

## Key Components to Adapt

### 1. Cart Components (if implementing cart)

**From ecommerce template**:

- `CartModal.tsx` - Adapt for booking items
- `AddToCart.tsx` - Change to "Add Booking to Cart"
- Cart items show: Event name, timeslot, pricing tier, quantity

**Booking-specific considerations**:

- Cart items need: `{ eventId, scheduleInstance, pricingTier, quantity }`
- Need to validate timeslot availability when adding to cart
- May need expiration for cart items (timeslots are time-sensitive)

### 2. Checkout Components

**From ecommerce template**:

- `CheckoutPage.tsx` - Main structure, adapt for bookings
- `CheckoutAddresses.tsx` - Adapt for customer info collection
- `CheckoutForm.tsx` - Payment form (can reuse with Stripe Elements)

**Booking-specific**:

- Replace product cart display with booking details display
- Show: Event info, selected timeslot, pricing tier, attendee count
- Customer info form (name, email, phone, optional address)
- Payment section (reuse existing Stripe integration)

### 3. Payment Flow

**Current booking platform**:

- Uses `createCheckoutSessionSecret` with Stripe Checkout (redirect)
- Supports Stripe Connect (multi-tenant)
- Creates booking first, then payment

**Ecommerce template**:

- Uses Stripe Elements (embedded)
- Creates payment intent, then confirms order after payment
- Simpler flow (single Stripe account)

**Adaptation**:

- Keep current Stripe Connect approach
- Option A: Keep Stripe Checkout (redirect-based) - simpler, less code changes
- Option B: Switch to Stripe Elements (embedded) - better UX, more code changes
- Need to handle tenant-specific Stripe account selection

---

## Implementation Recommendations

### Phase 1: Direct Booking Checkout (No Cart)

**Simplest approach** - Skip cart for now:

1. **Event Detail Page** (`EventDetailPage.tsx`):
   - User selects timeslot and pricing tier
   - Click "Book Now" button
   - Redirects to `/checkout` with booking details in URL/state

2. **Checkout Page** (`src/app/(app)/checkout/page.tsx`):
   - Extract booking details from URL/state
   - Display booking summary (event, timeslot, pricing, quantity)
   - Customer info form (name, email, phone)
   - Payment section (reuse existing Stripe Checkout)
   - Create booking → Process payment → Confirm

**Benefits**:

- Faster to implement
- Less complexity (no cart management)
- Direct flow (event → checkout → booking)

### Phase 2: Add Cart (If Needed)

**If users need to book multiple events**:

1. Create `BookingCart` collection or use client-side state
2. Add "Add to Cart" button on event detail page
3. Cart modal/sidebar component
4. Modify checkout to handle multiple cart items
5. Create multiple bookings in checkout

---

## File Structure Proposal

```
src/app/(app)/
  checkout/
    page.tsx                    # Main checkout page
    success/
      page.tsx                  # Booking confirmation page

src/app/components/RenderPage/
  EventBookingPanel.tsx         # Already exists - booking selection
  EventCheckout.tsx             # NEW - Checkout page component
  BookingConfirmation.tsx       # NEW - Success page component

src/components/
  booking-checkout/
    BookingSummary.tsx          # Display booking details
    CustomerInfoForm.tsx        # Customer information form
    PaymentSection.tsx          # Stripe payment integration
    BookingConfirmation.tsx     # Success confirmation

src/collections/Bookings/
  # Keep existing, but add:
  # - Support for creating bookings from checkout
  # - Guest booking support (unclaimed bookings by email)
```

---

## Key Decisions ✅

1. **Cart System**: ❌ **No cart** - One booking = one checkout (direct booking flow)
2. **Payment Method**: ✅ **Stripe Checkout (redirect)** - Keep current approach, simpler
3. **Guest Checkouts**: ✅ **Yes** - Support guest bookings by accepting contact info directly
4. **Cart Persistence**: N/A (no cart needed)
5. **Checkout URL Structure**: ✅ Use URL params - `/checkout?eventId=xxx&timeslot=xxx&pricingTier=xxx`

---

## Guest Booking Support Analysis

**Current State**:

- ✅ `customerSnapshot` field exists (JSON field) - can store guest customer info
- ✅ `customerRelation` is optional (can be null)
- ❌ Booking creation access is restricted to admins only (`superAdminOrTenantAdminAccess`)
- ❌ `saveSnapshots` hook only saves customer snapshot if `customerRelation` exists

**What's Needed**:

1. **Update access control**: Allow public creation of bookings (with proper validation)
2. **Update `saveSnapshots` hook**: Accept direct customer info (firstName, lastName, email, phone) when `customerRelation` is null
3. **Add customer info fields**: Add optional fields to accept guest customer info directly in booking creation

**Structure Already Supports Guest Bookings** - Just needs implementation!

---

## Implementation Plan

### Phase 1: Public Checkout Flow (Direct Booking)

**Goal**: Allow public users to book events via checkout page, with guest booking support.

#### Step 1: Update Booking Access Control

**File**: `src/collections/Bookings/index.ts`

**Changes**:

- Modify `create` access to allow public creation with validation
- Ensure booking has required fields (event, timeslot, customer info)

```typescript
access: {
  create: ({ data, req }) => {
    // Validate required fields for public creation
    if (!req.user) {
      // Guest booking: must have customer info in snapshot
      if (!data?.customerSnapshot || typeof data.customerSnapshot !== 'object') {
        return false;
      }
      const customer = data.customerSnapshot as { email?: string };
      if (!customer.email) return false;
    }

    // Admins can always create
    if (req.user) {
      return superAdminOrTenantAdminAccess({ req, data });
    }

    // Public creation allowed if validation passes
    return true;
  },
  // ... rest of access
}
```

#### Step 2: Update Save Snapshots Hook

**File**: `src/collections/Bookings/hooks/save-snapshots.ts`

**Changes**:

- Accept customer info directly when `customerRelation` is null
- Store guest customer info in `customerSnapshot`

```typescript
// If customerRelation exists, fetch and snapshot (existing logic)
// If customerRelation is null but customerSnapshot has data, use it directly (guest booking)
if (
  !data.customerRelation &&
  data.customerSnapshot &&
  typeof data.customerSnapshot === "object"
) {
  // Already have customer snapshot (guest booking), validate and keep it
  const customer = data.customerSnapshot as { email?: string };
  if (customer.email) {
    // Ensure required fields are present
    data.customerSnapshot = JSON.stringify({
      ...customer,
      id: undefined, // Guest bookings don't have customer ID
    });
  }
}
```

#### Step 3: Create Public Checkout Route

**File**: `src/app/(app)/checkout/page.tsx` (NEW)

**Structure**:

```typescript
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    eventId?: string;
    timeslot?: string; // JSON stringified schedule instance
    pricingTier?: string;
    quantity?: string;
  }>;
}) {
  // Extract booking details from URL params
  // Fetch event data
  // Render checkout form
}
```

#### Step 4: Create Checkout Components

**File Structure**:

```
src/app/components/RenderPage/
  EventCheckout.tsx           # Main checkout page component
  BookingSummary.tsx          # Display booking details (event, timeslot, pricing)
  CustomerInfoForm.tsx        # Customer information form (guest or logged-in)
  PaymentSection.tsx          # Stripe Checkout integration
```

**Flow**:

1. User selects event/timeslot on `EventDetailPage`
2. Clicks "Book Now" → Redirects to `/checkout?eventId=xxx&timeslot=xxx&...`
3. `CheckoutPage` renders:
   - Booking summary (read-only, from URL params)
   - Customer info form (if guest) or use logged-in user info
   - Payment section (Stripe Checkout button)
4. On payment click → Create booking → Redirect to Stripe Checkout
5. After payment → Redirect to booking confirmation page

#### Step 5: Create Booking Confirmation Page

**File**: `src/app/(app)/checkout/success/page.tsx` (NEW)

**Features**:

- Display booking confirmation
- Show booking details (event, timeslot, customer info)
- Payment status
- Booking ID for reference
- Optionally: "View Booking" link (if we add public booking view)

#### Step 6: Update Event Detail Page

**File**: `src/app/components/RenderPage/EventDetailPage.tsx`

**Changes**:

- Add "Book Now" button
- Collect booking details (timeslot selection, pricing tier, quantity)
- Redirect to checkout with URL params

---

## Technical Implementation Details

### URL Parameter Structure

```
/checkout?eventId=<uuid>&timeslot=<base64-encoded-schedule-instance>&pricingTier=<tier-id>&quantity=<number>
```

**Example**:

```
/checkout?eventId=abc123&timeslot=eyJkdHN0YXJ0IjoiMjAyNC0wMS0wMVQxMDowMDowMCJ9&pricingTier=standard&quantity=2
```

### Booking Creation Flow

1. **Parse URL params** → Extract booking details
2. **Validate data** → Ensure event exists, timeslot is valid, pricing tier exists
3. **Collect customer info** (if guest) → Name, email, phone
4. **Create booking** (in draft/pending state):
   ```typescript
   {
     eventRelation: eventId,
     selectedScheduleInstanceData: timeslot,
     dtstart: timeslot.start,
     dtend: timeslot.end,
     customerSnapshot: {
       firstName: "John",
       lastName: "Doe",
       email: "john@example.com",
       phone: "+1234567890"
     },
     pricingSnapshot: { /* pricing details */ },
     paymentMethod: "payNow",
     paymentStatus: null, // Will be updated after payment
   }
   ```
5. **Create Stripe Checkout Session** → Using existing `createCheckoutSessionSecret`
6. **Redirect to Stripe** → User completes payment
7. **Webhook updates booking** → Existing webhook sets `paymentStatus`
8. **Redirect to success page** → Show confirmation

### Guest Booking Access

**For viewing booking confirmation**:

- Guest bookings can be accessed by: Booking ID + Email (stored in `customerSnapshot`)
- Similar to ecommerce template's order viewing pattern

```typescript
// In booking confirmation page
const booking = await payload.find({
  collection: "bookings",
  where: {
    and: [
      { id: { equals: bookingId } },
      { "customerSnapshot.email": { equals: email } },
    ],
  },
});
```

---

## File Changes Summary

### New Files

- `src/app/(app)/checkout/page.tsx` - Main checkout route
- `src/app/(app)/checkout/success/page.tsx` - Booking confirmation
- `src/app/components/RenderPage/EventCheckout.tsx` - Checkout component
- `src/app/components/RenderPage/BookingSummary.tsx` - Booking details display
- `src/app/components/RenderPage/CustomerInfoForm.tsx` - Customer info form
- `src/app/components/RenderPage/PaymentSection.tsx` - Payment button/section

### Modified Files

- `src/collections/Bookings/index.ts` - Update access control
- `src/collections/Bookings/hooks/save-snapshots.ts` - Support guest customer snapshots
- `src/app/components/RenderPage/EventDetailPage.tsx` - Add "Book Now" button and redirect logic

### Reused Components

- `src/components/stripe-checkout/checkout-form.tsx` - Adapt for public checkout (currently admin-only)
- `src/lib/stripe/create-checkout-secret.ts` - Reuse existing Stripe Checkout creation
- `src/lib/stripe/webhooks/checkout.session.updated.ts` - Existing webhook will work

---

## Next Steps

1. ✅ **Decisions made**: Cart, payment method, guest support
2. ✅ **Update access control**: Allow public booking creation
3. ✅ **Update hooks**: Support guest customer snapshots
4. ✅ **Implement**: Public checkout route and components
5. ✅ **Implement**: Booking confirmation success pages
6. 🔄 **Implement**: Payment page for paid events (redirect to Stripe)
7. 🔄 **Test**: Guest booking flow end-to-end
8. 🔄 **Test**: Stripe Connect integration with guest bookings

---

## References

- [Payload Ecommerce Plugin Docs](https://payloadcms.com/docs/ecommerce/plugin)
- [Payload Ecommerce Template](https://github.com/payloadcms/payload/tree/main/templates/ecommerce)
- [Stripe Elements Docs](https://stripe.com/docs/stripe-js/react)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)

---

## Order/Booking Confirmation Pages

### Ecommerce Template Order Page

**Location**: `/orders/[id]` (`src/app/(app)/(account)/orders/[id]/page.tsx`)

**Features**:

- Order details: ID, date, total, status
- Order items: Products with variants, quantities
- Shipping address
- Guest access: Can view order by ID + email (no login required)
- User access: Logged-in users see their orders

**Access Control**:

```typescript
// Guest access: Order ID + email match
const canAccessAsGuest = !user && email && order.customerEmail === email;

// User access: Order belongs to logged-in user
const canAccessAsUser = user && order.customer === user.id;
```

**Similar to**: Could be adapted for `/bookings/[id]` page with booking details

### Booking Platform Current State

**Current**: Admin-only checkout at `/admin/checkout`

- Uses Stripe Checkout (redirect-based)
- Creates booking first, then processes payment
- Payment status tracked via webhooks

**Missing**:

- Public-facing checkout flow
- Booking confirmation page for customers
- Guest booking access

---

## Notes

- The ecommerce template is a good reference for UI/UX patterns
- The plugin provides useful hooks but may not fit booking model directly
- Current booking platform's Stripe Connect implementation is more complex than template
- Consider adapting patterns rather than using plugin directly
- Order confirmation page pattern can be adapted for booking confirmations
