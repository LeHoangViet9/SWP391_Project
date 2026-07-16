# Cart Hold Specification

## Objective

Keep every room in a customer's cart reserved on the server for 1 minute,
including before guest details and payment are submitted.

## Contract

- `POST /api/v1/cart-holds` creates a hold and returns a random `holdToken`,
  expiry time, item ids, and the selected room ids.
- `PUT /api/v1/cart-holds/{holdToken}` replaces the complete cart atomically.
- `GET /api/v1/cart-holds/{holdToken}` restores an active hold after refresh.
- `DELETE /api/v1/cart-holds/{holdToken}` releases the complete cart.
- `POST /api/v1/cart-holds/{holdToken}/checkout` converts the hold into the
  existing `PENDING_PAYMENT` bookings and invoices atomically.

All hold endpoints are public because the booking page supports guests. The
opaque random token is the client's capability to access its own hold.

## Rules

- A hold lasts `app.booking.hold-minutes` and cannot reserve overlapping rooms
  already held by another active cart or booking.
- Updating a cart replaces all previous items in one transaction. A conflict
  rolls back the update and leaves the previous hold unchanged.
- Expired and cancelled holds release only their own rooms.
- Checkout rejects expired, cancelled, empty, or incomplete holds.
- Existing booking creation and payment APIs remain backward compatible.

## Verification

- Add/update/remove cart items lock and release the expected rooms.
- Two concurrent holds for one room produce one success and one conflict.
- Expiry releases rooms and prevents checkout.
- Checkout creates one booking per cart item with the shared hold expiry.
