Back Office Refund Flow

> **Regional Senior Frontend Developer Technical Assessment**  
> Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Vite**.

Live Demo: [Add your deployed GitHub Pages / Vercel URL here]

---

## 1. Quick Start

### Installation & Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit tests (Node 24+ native ESM test runner)
npm test

# Type-check and build production bundle
npm run build

# Run Oxlint linter
npm run lint
```

---

## 2. Assessment Requirements & Feature Summary

- **Order Page**: Displays order metadata (`ORD-10482`), item unit breakdowns, delivery fee status, paid vs. refunded balances, and the primary "Initiate Refund" trigger.
- **Step 1: Item & Add-on Selection**:
  - Multi-unit breakdown for quantity > 1 (e.g. separate rows for `L3-1`, `L3-2`, `L3-3`).
  - Add-ons are nested under their respective units with individual prices.
  - **Dependency Rule**: An add-on cannot be refunded without its parent drink. Unchecking a drink automatically deselects and disables its add-ons. Selecting an add-on automatically selects the parent drink.
  - **Disabled States**: Previously refunded units/add-ons are visually tagged with `Refunded` badges and permanently disabled.
  - **Delivery Fee**: Optional standalone toggle to refund the delivery fee if it was paid.
  - **Live Calculation**: Instant calculation at the bottom with a `Full Refund` indicator when all refundable items are selected.
- **Step 2: Review & Details**:
  - Itemized breakdown of selected items, units, add-ons, and delivery fee.
  - **Refund Reason Dropdown**: _Wrong item_, _Missing item_, _Quality issue_, _Late delivery_, _Other_.
  - **Refund Channel Selector**: _Original payment method_ vs. _In-app credit_.
  - Back button preserves all item selections.
- **Step 3: Confirmation Dialog**:
  - Explicit confirmation modal before final dispatch.
  - Cancelling closes only the confirmation modal, leaving Step 2 intact.
  - Real API simulation with simulated latency and failure handling.
- **Back Office Testing Tools**:
  - **"Simulate API Error"** toggle in the top navigation bar to test network failure, error alerts, and retry mechanisms.
  - **"Reset Demo Data"** button to restore the assessment seed data at any time.

---

## 3. Written Section

### a) API Endpoints

This flow interacts with two primary RESTful endpoints:

#### 1. `GET /api/orders/:orderId`

Retrieves the order snapshot including line items, units, add-ons, delivery fee, and payment/refund statuses.

- **Response Shape (`200 OK`)**:

```json
{
  "order_id": "ORD-10482",
  "status": "completed",
  "currency": "MYR",
  "delivery_fee": 5.0,
  "delivery_fee_status": "paid",
  "version": 1,
  "items": [
    {
      "line_id": "L1",
      "name": "Iced Spanish Latte",
      "unit_price": 13.9,
      "units": [
        {
          "unit_id": "L1-1",
          "status": "refunded",
          "addons": [
            {
              "addon_id": "A1",
              "name": "Extra Shot",
              "unit_price": 2.0,
              "status": "refunded"
            }
          ]
        },
        {
          "unit_id": "L1-2",
          "status": "paid",
          "addons": [
            {
              "addon_id": "A1",
              "name": "Extra Shot",
              "unit_price": 2.0,
              "status": "paid"
            }
          ]
        }
      ]
    }
  ]
}
```

#### 2. `POST /api/orders/:orderId/refunds`

Submits a refund request for specific units, add-ons, and optional delivery fee.

- **Request Shape**:

```json
{
  "order_id": "ORD-10482",
  "order_version": 1,
  "reason": "Quality issue",
  "channel": "Original payment method",
  "notes": "Customer reported spilled cup upon arrival.",
  "expected_refund_amount": 15.9,
  "currency": "MYR",
  "selection": {
    "units": [
      {
        "unit_id": "L1-2",
        "addon_ids": ["A1"]
      }
    ],
    "refund_delivery_fee": false
  }
}
```

- **Response Shape (`201 Created`)**:

```json
{
  "success": true,
  "refund_id": "REF-849201",
  "refunded_at": "2026-10-26T10:15:30Z",
  "refund_amount": 15.9,
  "currency": "MYR",
  "channel": "Original payment method",
  "updated_order": {
    "order_id": "ORD-10482",
    "status": "partially_refunded",
    "...": "..."
  }
}
```

---

### b) Refund Calculation

#### Where should the refund amount be calculated, frontend or backend?

**Ideally both, but with clear separation of responsibilities:**

1. **Frontend (Optimistic / Real-time)**: Calculates totals live on the client side to give operations staff instant feedback as they check/uncheck units and add-ons in Step 1, and previews it in Step 2.
2. **Backend (Main Source of Truth)**: The backend have similar calculation for order stored in the database.

#### How to guarantee staff see what is actually refunded:

1. **Expected Amount Payload & Validation (`expected_refund_amount`)**:
   The frontend sends `expected_refund_amount` in the request payload. When the backend calculates its own authoritative total, it compares it against `expected_refund_amount`. If there is any discrepancy, the transaction aborts with `409 Conflict` (`PRICE_MISMATCH_ERROR`).
2. **Optimistic Locking (`order_version` / `ETag`)**:
   If another staff member concurrently processes a refund on the same order, the version check fails (`412 Precondition Failed`), preventing double refunds.
3. **Integer Cents Arithmetic**:
   To prevent IEEE 754 binary floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), calculations are executed using integer cents (`Math.round(amount * 100)`), ensuring byte-for-byte numerical parity between frontend JavaScript and backend services.

---

### c) Assumptions, Questions & Comments for the PM or Designer

1. **Seed Data Edge Case (Orphaned Add-on Status)**:
   - In the sample data for `L2-2`, the unit is `"status": "refunded"` while its add-ons (`A2 Oat Milk`, `A3 Brown Sugar Syrup`) are marked `"status": "paid"`.
   - _Spec Rule_: _"An add-on cannot be refunded on its own. Its main drink must also be refunded."_
   - _Assumption made_: Since the parent unit `L2-2` was already refunded in an earlier transaction, its add-ons cannot be refunded in subsequent sessions. We recommend clarifying with PM whether operations should ever support post-hoc add-on refunds.
2. **Delivery Fee Policy on Partial Refunds**:
   - _Assumption made_: The delivery fee can only be refunded once. If refunded during a partial refund, it becomes `status: 'refunded'` and disabled in future sessions.
3. **Full Refund Definition**:
   - _Assumption made_: Selecting all remaining refundable items marks the modal with a `Full Refund` badge. If the delivery fee is still refundable, a true full refund includes the delivery fee as well.
4. **Order Status Transitions**:
   - If some units remain paid after a refund, the order status transitions to `partially_refunded`. If all units and the delivery fee are refunded, it transitions to `refunded`.
5. **Tablet Hit Targets**:
   - Operations staff use tablet browsers in busy retail/kitchen environments. We increased touch targets to $\ge 40\text{px}$ to prevent accidental misclicks.

---

### d) Key Decisions & Trade-Offs

1. **Decoupled Business Logic Engine (`refundCalculation.ts`)**:
   - _Decision_: Pure functions for arithmetic, eligibility rules, and selection toggles, completely independent from React components.
   - _Why_: Allows exhaustive, lightning-fast unit testing (10/10 tests in ~3ms) and ensures the logic can be ported or shared with Node.js microservices.
2. **Controlled Multi-Step Dialog within a Single Parent**:
   - _Decision_: Step 1 and Step 2 share state inside `RefundModal`, while Step 3 (Confirmation) sits as a lightweight nested alert dialog.
   - _Why_: Navigating back from Step 2 to Step 1 preserves selected checkboxes and prevents lost input, while cancelling Step 3 keeps the review open.
3. **Simulated Latency & Error Injection Controls**:
   - _Decision_: Added an on-screen toggle to simulate network errors and a reset button.
   - _Why_: Allows technical interviewers to immediately evaluate loading states, disabled buttons during inflight requests, error banners, and retry behavior without opening DevTools or editing code.

---

### e) Known Limitations & Next Steps

1. **Role-Based Authorization & Limits**:
   - In production, refunds exceeding a certain threshold (e.g. > RM 100) should require Manager approval or 2FA PIN authorization.
2. **Vouchers & Discount Proration**:
   - Real-world orders often include campaign promo codes (e.g. `10% off` or `RM 5 off voucher`).
3. **WebSocket / Server-Sent Events (SSE)**:
   - Real-time synchronization to update other staff tablets if an order status changes concurrently.
4. **Audit Trail**:
   - Displaying an expandable timeline of past refunds on the Order page (refund ID, staff username, timestamp, reason, and transaction receipt).
