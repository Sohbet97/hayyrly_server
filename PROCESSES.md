# Hayyrly Taxi — Process & Workflow Definitions

**Backend scope only.** Each process lists actors, preconditions, step-by-step flow, and what happens on error.

---

## Process Index

1. [Client Registration](#1-client-registration)
2. [Client Login](#2-client-login)
3. [Driver Application (Submit)](#3-driver-application-submit)
4. [Driver Application Review (Admin)](#4-driver-application-review-admin)
5. [Driver Login](#5-driver-login)
6. [Admin / Operator Login](#6-admin--operator-login)
7. [Price Calculation](#7-price-calculation)
8. [Order Creation](#8-order-creation)
9. [Order Lifecycle](#9-order-lifecycle)
10. [Order Cancellation](#10-order-cancellation)
11. [Balance Top-Up (Operator → Driver)](#11-balance-top-up-operator--driver)
12. [Balance Deduction (automatic on order complete)](#12-balance-deduction-automatic-on-order-complete)
13. [Taxi Location Tracking](#13-taxi-location-tracking)
14. [Pricing Config Update (Admin)](#14-pricing-config-update-admin)

---

## 1. Client Registration

**Actor:** Client (mobile app)  
**Trigger:** User submits phone number on sign-up screen

```
Client                      Server                        External
──────                      ──────                        ────────
POST /api/users/register
  { phone, password }
                            Validate phone format
                            Check phone not already taken
                            Hash password (bcrypt)
                            INSERT INTO users (role='client')
                            INSERT INTO otp_codes (phone, code)
                                                          → NOTIFY otp_channel
                                                          ← OTP delivery (socket or FCM)
                            ← 201 { status: true, userId }

Client receives OTP on device
POST /api/users/verify-otp
  { phone, code }
                            SELECT otp_codes WHERE phone AND code
                              AND is_used=FALSE AND created_at > NOW()-5min
                            Mark OTP used / delete
                            Issue JWT (userId, role='client')
                            ← 200 { status: true, token, user }
```

**Error cases:**
- Phone already registered → 409
- OTP expired (>5 min) → 400
- OTP wrong → 400
- Too many OTP requests → 429 (rate limit)

---

## 2. Client Login

**Actor:** Client (mobile app)  
**Trigger:** Returning user logs in

```
Client                      Server
──────                      ──────
POST /api/users/login
  { phone, password }
                            Find user by phone
                            Compare bcrypt hash
                            Generate OTP → NOTIFY otp_channel
                            ← 200 { status: true, message: 'OTP sent' }

POST /api/users/verify-otp
  { phone, code }
                            Verify OTP (same as registration)
                            Issue JWT (userId, role='client')
                            ← 200 { status: true, token, user }
```

**Note:** OTP is required on every login for clients.

**Error cases:**
- Phone not found → 404
- Wrong password → 401
- OTP expired / wrong → 400

---

## 3. Driver Application (Submit)

**Actor:** Client (must be registered, role='client')  
**Trigger:** Client wants to become a driver; submits form from mobile app  
**Precondition:** User is authenticated (valid JWT, role='client'). No existing pending/approved application.

```
Client                      Server
──────                      ──────
POST /api/driver-applications
  Authorization: Bearer <token>
  Body: {
    cityId, firstName, lastName, phone,
    birthday, autoNumber, markaId, modelId,
    autoYear, licensePhoto, carImage, park
  }
                            Verify JWT → extract userId
                            Check role = 'client'
                            Check no existing application with status='pending' or 'approved'
                            INSERT INTO driver_applications (status='pending')
                            ← 201 { status: true, applicationId }
```

**Error cases:**
- Not authenticated → 401
- Already has pending application → 409
- Already approved driver → 409
- Missing required fields → 400

---

## 4. Driver Application Review (Admin)

**Actor:** Admin  
**Trigger:** Admin opens pending applications list in web panel

### 4a. List & View

```
Admin Panel                 Server
───────────                 ──────
GET /api/admin/driver-applications?status=pending
  Authorization: Bearer <admin-token>
                            Verify JWT → role must be 'admin'
                            SELECT from driver_applications WHERE status='pending'
                            ← 200 { data: [...], total, page }

GET /api/admin/driver-applications/:id
                            Return single application with all fields + photo URLs
                            ← 200 { status: true, result }
```

### 4b. Approve

```
Admin Panel                 Server
───────────                 ──────
PUT /api/admin/driver-applications/:id/approve
  Authorization: Bearer <admin-token>
                            BEGIN transaction
                              INSERT INTO taxies (from application data)
                              UPDATE users SET role='driver' WHERE id=application.user_id
                              UPDATE driver_applications
                                SET status='approved',
                                    reviewed_by=adminId,
                                    reviewed_at=NOW()
                            COMMIT
                            ← 200 { status: true, taxiId }
```

### 4c. Reject

```
Admin Panel                 Server
───────────                 ──────
PUT /api/admin/driver-applications/:id/reject
  Body: { reason: "Surat nädogry" }
                            UPDATE driver_applications
                              SET status='rejected',
                                  rejection_reason=reason,
                                  reviewed_by=adminId,
                                  reviewed_at=NOW()
                            ← 200 { status: true }
```

**Error cases:**
- Application not found → 404
- Application already reviewed (not pending) → 409
- DB error during approve → ROLLBACK → 500

---

## 5. Driver Login

**Actor:** Driver (mobile app)  
**Trigger:** Approved driver logs in  
**Precondition:** User exists with role='driver' (application was approved)

```
Driver App                  Server
──────────                  ──────
POST /api/users/login
  { phone, password }
                            Find user by phone
                            Check role = 'driver'
                            Compare bcrypt hash
                            ← 200 { status: true, token, user, taxiId }
```

**Note:** No OTP for drivers — password only, no second factor.

**Error cases:**
- Phone not found or role ≠ 'driver' → 401
- Wrong password → 401

---

## 6. Admin / Operator Login

**Actor:** Admin or Operator (web panel)  
**Precondition:** User exists in DB with role='admin' or role='operator'

```
Web Panel                   Server
─────────                   ──────
POST /api/auth/login
  { phone, password }
                            Find user by phone
                            Check role IN ('admin', 'operator')
                            Compare bcrypt hash
                            Issue JWT (userId, role)
                            ← 200 { status: true, token, user: { id, role, name } }
```

**Note:** No OTP. Web-panel accounts are created manually by admin (no self-registration).

**Error cases:**
- Not found or wrong role → 401
- Wrong password → 401

---

## 7. Price Calculation

**Actor:** Client app (before creating order)  
**Trigger:** Client selects from/to points on map

```
Client App                  Server                        External
──────────                  ──────                        ────────
GET /api/route
  ?start={lng,lat}&end={lng,lat}
                                                          → OSRM hayyrly.com.tm/osrm
                                                          ← { distance, duration, geometry }
                            ← 200 { distance, duration, geometry }

Client app extracts distanceKm

GET /api/pricing/:cityId
                            SELECT from pricing_config WHERE city_id=$1
                            (cached in Redis: pricing:city:{cityId}, TTL 300s)
                            ← 200 {
                                base_price, price_per_km,
                                free_wait_min, wait_price_min
                              }

Client calculates:
  basePrice = base_price + distanceKm × price_per_km
Client may set offeredPrice (custom, lower than basePrice)
```

**Note:** Price calculation happens on the client app using server-provided config. The server recalculates on order completion to prevent tampering.

---

## 8. Order Creation

**Actor:** Client  
**Precondition:** Client is authenticated + connected via Socket.io. Price calculated (step 7).

```
Client App                  Server                        Drivers in city
──────────                  ──────                        ───────────────
socket.emit("order:create", {
  userId, cityId,
  startAddress, endAddress,
  startLat, startLng,
  endLat, endLng,
  distanceKm,
  paymentType,      // cash | balance | card
  basePrice,
  offeredPrice      // null = accept basePrice
})
                            Validate required fields
                            INSERT INTO taxi_orders (status='created')
                            socket.join("order:{orderId}")
                            emit → client: "order:created" { orderId, order }
                            emit → room "taxis:city:{cityId}":
                              "order:new" { orderId, ...orderFields,
                                            basePrice, offeredPrice }
                                                          ← receive "order:new"
                                                             shown as notification
```

**offeredPrice logic:**
- `offeredPrice = null` → driver sees only `basePrice`
- `offeredPrice < basePrice` → driver sees both; can choose which to accept
- `offeredPrice ≥ basePrice` → treat as null (no discount offered)

**Error cases:**
- Missing required fields → `order:error` socket event
- User has another active order → `order:error` (to be implemented)

---

## 9. Order Lifecycle

**Actors:** Driver (socket), Client (socket)  
**Precondition:** Order exists with status='created'. Driver is registered via `taxi:register`.

```
Status flow:
created → accepted → arrived → on_way → completed
```

### Step 1 — Driver Accepts

```
Driver                      Server                        Client
──────                      ──────                        ──────
emit("order:accept", {
  orderId,
  acceptedPrice   // basePrice or offeredPrice
})
                            GET order → must be status='created'
                            BEGIN transaction
                              UPDATE taxi_orders
                                SET status='accepted',
                                    taxi_id=taxiId,
                                    accepted_price=acceptedPrice
                              INSERT INTO taxi_order_logs (status='accepted')
                            COMMIT
                            Redis: taxi:{taxiId}:meta → status='busy'
                            socket.join("order:{orderId}")
                            emit → room "order:{orderId}":
                              "order:accepted" { orderId, taxiId, order }
                                                          ← "order:accepted"
                                                             (show driver info)
                            SMS → client: "Sargydyňyz kabul edildi"
```

**Race condition:** Two drivers emit `order:accept` simultaneously.  
→ Only the first UPDATE succeeds (status='created' check in WHERE clause).  
→ Second driver gets `order:error` "Order already accepted".

### Step 2 — Driver Arrives at pickup

```
Driver                      Server                        Client
──────                      ──────                        ──────
emit("order:arrived", { orderId })
                            UPDATE taxi_orders SET status='arrived'
                            INSERT INTO taxi_order_logs (status='arrived')
                            emit → "order:{orderId}": "order:arrived"
                                                          ← "order:arrived"
                            SMS → client: "Taksiňyz geldi"
```

### Step 3 — Passenger boards (trip starts)

```
Driver                      Server                        Client
──────                      ──────                        ──────
emit("order:on_way", { orderId })
                            Calculate waiting:
                              waitingSec = NOW() - arrived_at (from logs)
                              billableMin = max(0, waitingSec/60 - free_wait_min)
                              waitingPrice = billableMin × wait_price_min
                              (pricing loaded from DB/Redis by cityId)
                            UPDATE taxi_orders
                              SET status='on_way', waiting_price=waitingPrice
                            INSERT log
                            emit → "order:{orderId}":
                              "order:on_way" { waitingSeconds, waitingPrice }
                                                          ← "order:on_way"
                            SMS → client: "Ýola düşdüňiz. Garaşma: {waitingPrice} TMT"
```

### Step 4 — GPS tracking (during trip)

```
Driver                      Server                        Client
──────                      ──────                        ──────
emit("order:track", {
  orderId, lat, lng
})  ← every ~10 seconds
                            INSERT INTO taxi_order_tracks (orderId, location)
                            emit → "order:{orderId}":
                              "order:track" { lat, lng, taxiId }
                                                          ← "order:track"
                                                             (animate on map)
```

### Step 5 — Trip complete

```
Driver                      Server                        Client
──────                      ──────                        ──────
emit("order:complete", { orderId })
                            GET order (base_price, waiting_price, accepted_price)
                            totalPrice = accepted_price + waitingPrice
                            UPDATE taxi_orders
                              SET status='completed', total_price=totalPrice
                            INSERT log
                            Redis: taxi:{taxiId}:meta → status='free'
                            emit → "order:{orderId}":
                              "order:completed" { orderId, totalPrice, order }
                                                          ← "order:completed"
                            SMS → client: "Sargyt tamamlandy. Jemi: {totalPrice} TMT"

                            If paymentType = 'balance':
                              Deduct totalPrice from client balance (see Process 12)
```

---

## 10. Order Cancellation

**Actors:** Client or Driver  
**Can cancel when status IN:** `created`, `accepted`, `arrived`  
**Cannot cancel when status IN:** `on_way`, `completed`

### Client cancels

```
Client                      Server                        Driver
──────                      ──────                        ──────
emit("order:cancel", { orderId })
                            UPDATE taxi_orders SET status='cancelled_by_user'
                            INSERT log
                            emit → "order:{orderId}": "order:cancelled" { cancelledBy: 'user' }
                                                          ← "order:cancelled"
                            If order had taxi_id:
                              SMS → driver: "Müşderi sargydy ýatyrdy"
```

### Driver cancels

```
Driver                      Server                        Client / Other drivers
──────                      ──────                        ─────────────────────
emit("order:cancel", { orderId, cityId })
                            UPDATE taxi_orders SET status='cancelled_by_driver'
                            INSERT log
                            Redis: taxi:{taxiId}:meta → status='free'
                            emit → "order:{orderId}": "order:cancelled" { cancelledBy: 'driver' }
                            ← "order:cancelled"
                            SMS → client: "Sürüji sargydy ýatyrdy"

                            Re-broadcast to city (client still waiting):
                            emit → "taxis:city:{cityId}":
                              "order:new" { ...original order fields }
                                                          ← receive "order:new" again
                                                             (new driver can accept)
```

---

## 11. Balance Top-Up (Operator → Driver)

**Actor:** Operator or Admin (web panel)  
**Trigger:** Operator manually credits a driver's wallet

```
Web Panel                   Server
─────────                   ──────
POST /api/balance/:userId/add
  Authorization: Bearer <operator-token>
  Body: {
    price,
    sendedUserId,    // operator's userId
    sendedName,      // operator's display name
    confirmedName    // driver's display name
  }
                            Verify JWT → role IN ('admin', 'operator')
                            BEGIN transaction
                              INSERT INTO balance (user_id, price)
                                ON CONFLICT DO UPDATE price = price + excluded.price
                              INSERT INTO balance_tranzaksion
                                (sended_user_id, confirmed_user_id, price, is_added=true)
                            COMMIT
                            ← 201 { status: true, result: { user_id, price } }
```

**Error cases:**
- Unauthorized role → 403
- Invalid userId → 404
- price ≤ 0 → 400

---

## 12. Balance Deduction (Automatic on Order Complete)

**Trigger:** `order:complete` socket event, when `paymentType = 'balance'`  
**Precondition:** Client has sufficient balance (≥ totalPrice)

```
Server (inside handleOrderComplete)
────────────────────────────────────
IF order.payment_type = 'balance':
  BEGIN transaction
    SELECT balance WHERE user_id = order.user_id FOR UPDATE
    IF balance.price < totalPrice:
      ROLLBACK
      emit → client: "order:error" { message: 'Balans ýetmezçilik edýär' }
      RETURN

    UPDATE balance SET price = price - totalPrice
    INSERT INTO balance_tranzaksion
      (confirmed_user_id=userId, price=totalPrice, is_added=false)
  COMMIT
```

**Note:** If balance is insufficient, order is still marked completed but payment fails — driver is notified to collect cash instead. (Policy decision — confirm with business.)

---

## 13. Taxi Location Tracking

**Actor:** Driver (socket)  
**Trigger:** Driver app sends GPS position periodically (~every 3–5 seconds while online)  
**Precondition:** Driver connected + sent `taxi:register { taxiId, cityId }`

```
Driver                      Server (Redis)                Watchers / Admin map
──────                      ──────────────                ────────────────────
emit("taxi:register", { taxiId, cityId })
                            socket.data = { taxiId, cityId }
                            socket.join("taxis:city:{cityId}")
                            HSET taxi:{taxiId}:meta
                              { cityId, status:'free', lat, lng }
                            SADD taxis:city:{cityId} taxi_{taxiId}
                            emit → driver: "taxi:registered"

emit("taxi:location", { lat, lng })
                            HSET taxi:{taxiId}:meta { lat, lng, updatedAt }
                            Broadcast → "watch:city:{cityId}":
                              "taxi:location:update" { taxiId, lat, lng, status }
                                                          ← receive live position
                            Debounce 10s → flush to PostgreSQL
                              INSERT INTO taxies_locations (taxi_id, location)

On disconnect:
                            HSET taxi:{taxiId}:meta { status:'offline' }
                            SREM taxis:city:{cityId} taxi_{taxiId}
                            Flush debounce → final position saved to PG
                            Broadcast → "watch:city:{cityId}":
                              "taxi:status:update" { taxiId, status:'offline' }
```

**Admin / Operator live map subscribes:**
```
emit("client:watch:city", { cityId })
  → joins room "watch:city:{cityId}"
  → receives all taxi:location:update events

emit("client:get:taxis", { cityId })
  → one-time snapshot of all online taxis in city from Redis
  → on("city:taxis", { taxis: [...] })
```

---

## 14. Pricing Config Update (Admin)

**Actor:** Admin  
**Trigger:** Admin changes pricing from web panel

```
Admin Panel                 Server                        Redis
───────────                 ──────                        ─────
PUT /api/admin/pricing/:cityId
  Authorization: Bearer <admin-token>
  Body: {
    base_price, price_per_km,
    free_wait_min, wait_price_min
  }
                            Verify JWT → role = 'admin'
                            Validate: all values > 0
                            UPDATE pricing_config
                              SET base_price=..., price_per_km=...,
                                  free_wait_min=..., wait_price_min=...,
                                  updated_at=NOW(), updated_by=adminId
                              WHERE city_id=$1
                            DEL pricing:city:{cityId}   ← invalidate cache
                            ← 200 { status: true, result }
```

Next request for `/api/pricing/:cityId` will miss Redis, fetch from DB, and re-populate cache.

**Error cases:**
- Role ≠ 'admin' → 403
- cityId not found → 404
- Any value ≤ 0 → 400

---

## Status & Role Reference

### Order statuses

| Status | Set by | Description |
|--------|--------|-------------|
| `created` | Server on order:create | Waiting for driver |
| `accepted` | Server on order:accept | Driver assigned |
| `arrived` | Server on order:arrived | Driver at pickup |
| `on_way` | Server on order:on_way | Passenger onboard |
| `completed` | Server on order:complete | Trip done |
| `cancelled_by_user` | Server on order:cancel | Client cancelled |
| `cancelled_by_driver` | Server on order:cancel | Driver cancelled |

### User roles

| Role | Login method | OTP | Created by |
|------|-------------|-----|------------|
| `client` | Phone + password | ✅ required | Self-registration |
| `driver` | Phone + password | ❌ | Admin approval |
| `operator` | Phone + password | ❌ | Admin manually |
| `admin` | Phone + password | ❌ | Seeded / manual |

### Payment types

| paymentType | Balance deducted automatically |
|-------------|-------------------------------|
| `cash` | ❌ |
| `balance` | ✅ on order:complete |
| `card` | ❌ (handled externally) |
