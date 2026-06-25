# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the server
node server.js

# No build step — plain CommonJS, no transpilation required
# No test runner configured
```

Required environment variables (`.env`):
```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
OTP_SECRET          # used to derive AES-256-GCM key for OTP encryption
PORT                # defaults to 3000
```

Firebase credentials must be present in `firebase/service_acount.json`.

## Architecture

This is a Node.js/Express real-time taxi dispatch backend for Turkmenistan (Hayyrly Taxi). Three external services power it:

- **PostgreSQL + PostGIS** — persistent storage, all tables live in the `app_data` schema (search_path is set at connection level). Location columns are `geography` type; queries always use `ST_MakePoint(lng, lat)` (longitude first).
- **Redis** — live taxi state only. Hash `taxi:{id}:meta` holds `{cityId, status, lat, lng, updatedAt}`; set `taxis:city:{cityId}` tracks which taxis are online per city.
- **Socket.IO** — all real-time communication (taxi location, order flow, OTP delivery, SMS gateway).

### Layer structure

| Directory | Role |
|-----------|------|
| `config/` | DB pool (`db.js`), Firebase Admin init (`firebase.js`), map DB (`mapDb.js`) |
| `routes/` | Express routers — thin, just mount controllers |
| `controller/` | HTTP request handlers |
| `models/` | Raw SQL query functions (no ORM) |
| `socket/` | Socket.IO event handlers (`taxiSocket`, `orderSocket`, `smsSocket`) |
| `service/` | `redisClient.js`, `smsService.js`, `push.service.js` |
| `middleware/` | Firebase token verification (`firebaseAuth.js`), file upload (`uploadFactory.js`) |

### Real-time flows

**Taxi location** (`socket/taxiSocket.js`): location updates are written to Redis immediately and broadcast to watchers. A 10-second debounce timer (`locationDebounce` Map) batches writes to PostgreSQL (`taxies_locations` table). On disconnect, the debounce is flushed synchronously.

**Order lifecycle** (`socket/orderSocket.js`): order status transitions are persisted in `taxi_orders` and logged to `taxi_order_logs` inside a transaction. Waiting price is calculated from the `arrived→on_way` log timestamp gap (3 free minutes, then 0.5 TMT/min). See `files/socket_schema.md` for the full event reference.

**OTP delivery** (`server.js` + `service/push.service.js`): PostgreSQL `LISTEN otp_channel` triggers on new OTP rows. If any phone is online via socket, a randomly-chosen connected device receives the encrypted OTP via socket; otherwise it falls back to FCM push. OTP payload is AES-256-GCM encrypted using `OTP_SECRET`.

**SMS gateway** (`service/smsService.js`): SMS messages are not sent via an HTTP API — they are forwarded as `sms:send` socket events to a connected gateway device in the `sms:gateway` room.

### Auth

REST endpoints use Firebase ID tokens (`Authorization: Bearer <token>`), verified by `middleware/firebaseAuth.js`. Two variants: `verifyFirebaseToken` (blocks without token) and `optionalFirebaseToken` (passes through with `req.firebaseUser = null`).

### Routing overview (base `/api`)

| Prefix | Resource |
|--------|----------|
| `/users` | Auth, user profile |
| `/balance` | Add/remove balance |
| `/cities`, `/cars`, `/services` | Reference data |
| `/addresses` | Address lookup |
| `/taksi` | Taxi registration & management |
| `/orders` | Order history queries |
| `/map` | Map/place search |
| `/otp/device` | Register FCM token for OTP |
| `/route` | OSRM routing proxy |
