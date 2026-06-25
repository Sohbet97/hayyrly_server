# Hayyrly Taxi — Scope of Work & Implementation Plan

**Date:** 2026-06-24  
**Stack:** Node.js / Express · PostgreSQL + PostGIS · Redis · Socket.io · React (admin web panel)  
**Scope:** Backend only — REST API + Socket.io. Mobile apps are built by a separate team consuming this API.

---

## 1. Current State Audit

### What is implemented and working

| Area | Status |
|------|--------|
| Client auth (phone + OTP via socket/FCM) | ✅ Done |
| JWT / Firebase token middleware | ✅ Done |
| Taxi registration (basic INSERT) | ✅ Done |
| Taxi location tracking (Redis + PostGIS, debounced) | ✅ Done |
| Full order lifecycle via Socket.io | ✅ Done |
| Order logs & GPS track recording | ✅ Done |
| Balance top-up / deduction + transaction log | ✅ Done |
| SMS gateway via Socket.io relay | ✅ Done |
| Reference data (cities, car marks/models, services) | ✅ Done |
| OSRM routing proxy | ✅ Done |
| Address / place search (PostGIS) | ✅ Done |

### What is incomplete or stubbed

| Area | Status |
|------|--------|
| `getTaksis()` — list/filter taxis | ⚠️ Empty stub |
| `updateTaksi()` — edit taxi profile | ⚠️ Empty stub |
| `getBalanceInUSerId()` — fetch driver balance | ⚠️ Empty stub |
| Driver approval workflow (admin approves application) | ❌ Missing |
| `offeredPrice` — client proposes custom price | ❌ Missing |
| Role-based access (admin / operator / driver / client) | ❌ Missing |
| Admin / Operator web panel | ❌ Missing |
| Pricing configuration (currently hardcoded / env vars) | ❌ Missing |
| Admin: user management, driver moderation, reports | ❌ Missing |
| Operator: live map of drivers + order statuses | ❌ Missing |

### Hardcoded values that must move to DB

```js
// controller/order/orderController.js
const BASE_PRICE   = parseFloat(process.env.ORDER_BASE_PRICE)   || 10;
const PRICE_PER_KM = parseFloat(process.env.ORDER_PRICE_PER_KM) || 2.5;

// socket/orderSocket.js
const FREE_WAIT_MINUTES  = 3;
const WAIT_PRICE_PER_MIN = 0.5;
```

All four must come from a `pricing_config` table, editable from the admin panel.

---

## 2. Scope of Work

### 2.1 Backend (this repo)

#### P0 — Blockers (required before mobile apps ship)

1. **Pricing config table + admin API** — `base_price`, `price_per_km`, `free_wait_minutes`, `wait_price_per_min` configurable per city.
2. **`offeredPrice` flow** — client can propose a custom price; drivers see both `basePrice` and `offeredPrice`; driver accepts either one.
3. **Driver application & approval workflow** — client submits application (car info + license photo) → admin approves/rejects → role switches to `driver`.
4. **Role-based middleware** — guard endpoints and socket events by role (`admin`, `operator`, `driver`, `client`).
5. **Complete stubs** — `getTaksis`, `updateTaksi`, `getBalanceInUSerId`.

#### P1 — Admin / Operator panel backend

6. **Admin: user management** — list, search, block/unblock users and drivers.
7. **Admin: driver moderation** — list pending applications, approve/reject with reason.
8. **Admin: pricing config CRUD** — read and update pricing per city.
9. **Admin: reports** — order stats by date/city/driver, revenue summary.
10. **Operator: live data endpoints** — driver locations snapshot, active order list (already partially covered by existing endpoints).

#### P2 — Hardening

11. Auth on all sensitive REST endpoints (currently many are unguarded).
12. Input validation layer (consider `express-validator` or `zod`).
13. Consistent error codes across REST and Socket.

---

### 2.2 Web Panel (React — separate repo)

| Screen | Role |
|--------|------|
| Login | Admin + Operator |
| Live map (driver pins + order markers) | Admin + Operator |
| Active orders list | Admin + Operator |
| Driver list + approval queue | Admin |
| User list + block/unblock | Admin |
| Balance top-up form | Admin + Operator |
| Pricing config form | Admin |
| Reports / stats | Admin |

---

## 3. Database Changes

### 3.1 New table: `app_data.pricing_config`

```sql
CREATE TABLE app_data.pricing_config (
    id              SERIAL PRIMARY KEY,
    city_id         INT REFERENCES app_data.cities(id) ON DELETE CASCADE,
    base_price      NUMERIC(10,2) NOT NULL DEFAULT 10,
    price_per_km    NUMERIC(10,2) NOT NULL DEFAULT 2.5,
    free_wait_min   NUMERIC(5,2)  NOT NULL DEFAULT 3,
    wait_price_min  NUMERIC(10,2) NOT NULL DEFAULT 0.5,
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by      INT REFERENCES app_data.users(id),
    UNIQUE (city_id)
);
-- Seed default row for each existing city
INSERT INTO app_data.pricing_config (city_id, base_price, price_per_km, free_wait_min, wait_price_min)
SELECT id, 10, 2.5, 3, 0.5 FROM app_data.cities;
```

### 3.2 Alter `app_data.taxi_orders` — add offeredPrice

```sql
ALTER TABLE app_data.taxi_orders
    ADD COLUMN IF NOT EXISTS offered_price NUMERIC(10,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS accepted_price NUMERIC(10,2) DEFAULT NULL;
-- offered_price: set by client, NULL means client accepted base price
-- accepted_price: the price the driver actually accepted
```

### 3.3 New table: `app_data.driver_applications`

```sql
CREATE TABLE app_data.driver_applications (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES app_data.users(id),
    city_id         INT REFERENCES app_data.cities(id),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    phone           TEXT NOT NULL,
    birthday        DATE,
    auto_number     TEXT,
    marka_id        INT,
    model_id        INT,
    auto_year       INT,
    license_photo   TEXT,   -- URL/path
    car_image       TEXT,
    park            TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    rejection_reason TEXT,
    reviewed_by     INT REFERENCES app_data.users(id),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.4 Alter `app_data.users` — add role column

```sql
ALTER TABLE app_data.users
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';
-- role: 'client' | 'driver' | 'operator' | 'admin'
```

---

## 4. API Specification (new / changed endpoints)

Base: `/api/v1` (existing endpoints stay under `/api` for backwards compat)

### 4.1 Pricing Config

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/pricing/:cityId` | public | Get pricing for city (used by apps for price calculation) |
| PUT | `/api/admin/pricing/:cityId` | admin | Update pricing for city |

**GET `/api/pricing/:cityId` response:**
```json
{
  "status": true,
  "result": {
    "city_id": 1,
    "base_price": 10,
    "price_per_km": 2.5,
    "free_wait_min": 3,
    "wait_price_min": 0.5
  }
}
```

**PUT `/api/admin/pricing/:cityId` body:**
```json
{
  "base_price": 12,
  "price_per_km": 3.0,
  "free_wait_min": 2,
  "wait_price_min": 0.75
}
```

### 4.2 Driver Applications

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/driver-applications` | client | Submit driver application |
| GET | `/api/admin/driver-applications` | admin | List applications (filter by status) |
| GET | `/api/admin/driver-applications/:id` | admin | Get single application |
| PUT | `/api/admin/driver-applications/:id/approve` | admin | Approve → creates taxi record + sets role=driver |
| PUT | `/api/admin/driver-applications/:id/reject` | admin | Reject with reason |

**POST `/api/driver-applications` body:**
```json
{
  "userId": 1,
  "cityId": 1,
  "firstName": "Merdan",
  "lastName": "Aşyrow",
  "phone": "+99361000000",
  "birthday": "1990-05-15",
  "autoNumber": "AA 001 AA",
  "markaId": 2,
  "modelId": 5,
  "autoYear": 2020,
  "licensePhoto": "/uploads/license/xxx.webp",
  "carImage": "/uploads/cars/xxx.webp",
  "park": "Merkezi Park"
}
```

**PUT `.../approve` body:** `{}` (no body needed)  
**PUT `.../reject` body:** `{ "reason": "Surat nädogry" }`

On approval, server:
1. Inserts row into `app_data.taxies`
2. Sets `app_data.users.role = 'driver'` for that user
3. Updates application `status = 'approved'`

### 4.3 Admin — User Management

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/admin/users` | admin | List users (filter: role, status, city, search) |
| GET | `/api/admin/users/:id` | admin | Get user detail |
| PUT | `/api/admin/users/:id/block` | admin | Block user |
| PUT | `/api/admin/users/:id/unblock` | admin | Unblock user |

**GET `/api/admin/users` query params:** `?role=driver&city_id=1&search=merdan&page=1&limit=20`

### 4.4 Admin — Reports

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/admin/reports/orders` | admin | Order stats by date range + city |
| GET | `/api/admin/reports/revenue` | admin | Revenue (total_price sum) by date/driver/city |
| GET | `/api/admin/reports/drivers` | admin | Driver activity (order count, earnings) |

**GET `/api/admin/reports/orders` query params:** `?from=2026-06-01&to=2026-06-30&city_id=1`

```json
{
  "status": true,
  "result": {
    "total_orders": 1240,
    "completed": 1100,
    "cancelled_by_user": 80,
    "cancelled_by_driver": 60,
    "by_day": [
      { "date": "2026-06-01", "count": 42, "revenue": 520.5 }
    ]
  }
}
```

### 4.5 Operator — Live Data

Already partially covered. Add:

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/operator/drivers/online` | admin + operator | List online drivers with last location (from Redis) |
| GET | `/api/operator/orders/active` | admin + operator | Active orders (status: created, accepted, arrived, on_way) |

### 4.6 Balance — Fix missing endpoint

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/balance/:userId` | admin + operator | Get current balance for a user |

(Currently `getBalanceInUSerId` is an empty stub — needs implementation.)

---

## 5. Socket Changes

### 5.1 offeredPrice in order:create

```json
emit("order:create", {
  "userId": 1,
  "cityId": 1,
  "startAddress": "...",
  "startLat": 37.96, "startLng": 58.38,
  "distanceKm": 3.2,
  "paymentType": "cash",
  "basePrice": 12.0,
  "offeredPrice": 10.0   // NEW — null means client accepts basePrice
})
```

Drivers receive both in `order:new`. Driver can accept at either price:

```json
emit("order:accept", {
  "orderId": 42,
  "acceptedPrice": 10.0   // NEW — which price the driver agreed to
})
```

Server stores `accepted_price` on the order; all downstream price calculations use `accepted_price` (or `base_price` if null).

### 5.2 Pricing loaded from DB

`orderSocket.js` and `orderController.js` must fetch pricing from `pricing_config` by `cityId` instead of using hardcoded constants. Values should be cached in Redis with a short TTL (e.g. 5 minutes) to avoid a DB hit on every order.

```
Redis key: pricing:city:{cityId}
TTL: 300 seconds
```

---

## 6. Implementation Tasks (Ordered by Priority)

### Phase 1 — Foundation (do first, unblocks everything)

- [ ] **DB migration** — create `pricing_config`, `driver_applications` tables; alter `users` (role), `taxi_orders` (offered_price, accepted_price)
- [ ] **Role middleware** — `requireRole(...roles)` Express middleware using JWT claims or DB lookup
- [ ] **Pricing config model + controller + routes** — GET public, PUT admin
- [ ] **Wire pricing into orderController & orderSocket** — replace hardcoded constants with DB lookup (Redis-cached)

### Phase 2 — Driver Onboarding

- [ ] **Driver application model** — createApplication, listApplications, getApplication, approve, reject
- [ ] **Driver application controller + routes**
- [ ] **Approval handler** — atomic: insert taxies row + update user role

### Phase 3 — Complete Stubs

- [ ] **`getTaksis(filter)`** — list with pagination, filter by city/status/park
- [ ] **`updateTaksi(id, data)`** — update taxi profile fields
- [ ] **`getBalanceInUSerId(userId)`** — SELECT from `app_data.balance`
- [ ] **Balance GET endpoint** — `/api/balance/:userId`

### Phase 4 — offeredPrice

- [ ] **Order model** — add `offeredPrice`, `acceptedPrice` to createOrder and updateOrderStatus
- [ ] **orderSocket** — pass offeredPrice in order:create, acceptedPrice in order:accept
- [ ] **Price calculation** — use `accepted_price ?? base_price` for total

### Phase 5 — Admin Endpoints

- [ ] **User management** — list/get/block/unblock
- [ ] **Reports** — orders stats, revenue, driver activity
- [ ] **Operator live data** — online drivers snapshot from Redis, active orders

### Phase 6 — Auth Hardening

- [ ] Audit all routes and add `requireRole` guards
- [ ] Add request validation (express-validator or zod)
- [ ] Standardize error response format

---

## 7. Naming & Convention Rules

- All new endpoints: `/api/admin/...` for admin-only, `/api/operator/...` for operator+admin
- Existing endpoints stay unchanged unless a coordinated mobile+backend deploy is possible
- DB columns: `snake_case`; JS variables: `camelCase`
- All geography inserts: `ST_MakePoint(lng, lat)` (longitude first — already established in codebase)
- Transactions: use `pool.connect()` + BEGIN/COMMIT/ROLLBACK for any multi-table write
- Redis pricing cache key: `pricing:city:{cityId}`, TTL 300s; invalidate on PUT pricing update

---

## 8. Open Questions

1. **Admin auth** — should admin/operator use the same Firebase phone auth as clients, or a separate username+password login? (Recommendation: separate login with bcrypt password, no OTP, stored in `app_data.users` with `role='admin'`)
2. **Per-city pricing or global?** — current proposal is per-city. If only one city is in use now, a single global row is fine; schema supports per-city from day one.
3. **offeredPrice floor** — should there be a minimum `offeredPrice` (e.g. cannot offer less than 50% of `basePrice`)? Backend can enforce this.
4. **Web panel deployment** — same server as the API or separate? Affects CORS and static file serving config.
5. **Driver balance deduction** — is commission deducted automatically on order completion, or is balance only topped up by operators manually? If automatic, define the commission rate and add deduction logic to `handleOrderComplete`.
