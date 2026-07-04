# Plan: Sequelize Migration + Admin API + Web Panel Real Data

## Context

The web admin panel (`web/`) currently runs entirely on mock data (`web/src/data/mock.js`, fake login). The backend (`server/`) is a mobile-only Express 5 API using hand-written raw `pg` SQL with no ORM. Task:

1. Migrate the backend model layer to **Sequelize** — all models — while keeping every existing endpoint URL, request shape, and response JSON **byte-identical** (mobile app depends on them).
2. Add new **`/api/admin/*`** endpoints for the web panel: password login, analytics/reports, driver applications queue, per-city pricing, team management.
3. Wire the web panel to real APIs: services layer, `VITE_API_BASE`, vite `/api` proxy, real login with token persistence, Socket.IO for live driver positions.

This plan is **aligned with the existing repo docs** `PLAN.md` (scope of work, DB schemas §3, API spec §4, conventions §7) and `PROCESSES.md` (flows #4, #6, #14). Where PLAN.md already defines a schema (pricing_config, driver_applications, users.role), we use it verbatim.

Conventions follow the user's reference project `/Users/dovletli/Documents/projects/embium/backend`: factory-style `sequelize.define` models with explicit snake_case columns, static-class controllers/services, yup + shared Validator, `ApiError` + error middleware, bcryptjs + JWT Bearer middleware, hand-written numbered **raw `.sql` migrations** (no sequelize-cli), no `sequelize.sync()`.

User decisions: full model conversion; add `/api/admin/*`; password login for web (dedicated `admin_users` table — this resolves PLAN.md Open Question #1 in favor of a separate credentials table); map existing `app_data` tables as-is, migrations only for new tables.

---

## Phase 1 — Sequelize foundation (server/)

1. **Deps** (`server/package.json`): add `sequelize`, `pg-hstore`, `bcryptjs`, `yup`.
2. **New `server/db/index.js`** (mirrors embium `models/index.js`): one `new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, { host, port, dialect: 'postgres', logging: false, dialectOptions: { options: '-c search_path=app_data,public' } })`; registers all models; runs `Model.associate(db)`; exports `db = { sequelize, Sequelize, ...models }` plus `connectSequelize()` (`authenticate()`). **Never** `sequelize.sync()`.
3. **Models** in `server/db/models/` — factory style, explicit snake_case columns, `timestamps: false` (tables managed externally):
   `User.js` (users), `OtpCode.js` (otp_codes), `DeviceToken.js` (device_tokens), `Taxi.js` (taxies), `TaxiOrder.js` (taxi_orders — **do not declare geography columns**), `TaxiOrderLog.js` (taxi_order_logs), `Balance.js` (balance), `BalanceTransaction.js` (balance_tranzaksion), `City.js` (cities), `Marka.js` (markas), `CarModel.js` (models), `Service.js` (services), `Address.js` (address).
   `taxies_locations` / `taxi_order_tracks` stay raw-query-only (geography-primary).
4. **Stays raw pg**: `startOtpListener` in `server/server.js` (already uses its own dedicated `pg.Client` for LISTEN/NOTIFY — untouched); `server/config/mapDb.js` + `server/models/mapModel.js` (separate read-only geo DB, no ORM value).

## Phase 2 — Model-by-model conversion

Strategy: rewrite the **internals** of existing model files against `db`, keeping every exported function name, args, and return shape identical → controllers and sockets untouched → envelope parity guaranteed. Order low-risk → high-risk:

| File | Technique |
|---|---|
| `server/models/Constants/serviceModel.js` | Model API (`raw: true`, `update({...}, {returning: true})`) |
| `server/models/Constants/markaModel.js` | Model API; `getMarkaTree` → raw `sequelize.query` (keep JOIN + reduce) |
| `server/models/Constants/cityModel.js` | Model API; keep `buildCityTree` untouched |
| `server/models/addressModel.js` | `findAndCountAll` with built `where` (`Op.iLike`), same `{addresses, total, hasMore}` |
| `server/models/User/userModel.js` | `getOrCreateUserByPhoneNumber` / `getUserById` → raw `sequelize.query` (CTE upsert + `COALESCE(b.price,0.0) AS balance` — keep field types); rest Model API |
| `server/models/User/authModel.js` | `createNewCode` → raw (ON CONFLICT ... RETURNING — the NOTIFY trigger fires on this exact insert, keep SQL verbatim); verify/delete → Model API |
| `server/models/User/balanceModel.js` | `sequelize.transaction` wrapping raw upsert + `BalanceTransaction.create`; **pg error code moves to `error.original.code`** (23514 check); log list → `findAndCountAll` with same pagination object |
| `server/models/Taksi/taksiModel.js` | Model API; `createNewTaksi` must keep returning an **array**; `getNearbyTaxis` → raw verbatim (ST_DWithin); also implement the stubs `getTaksis` / `updateTaksi` (PLAN.md Phase-3 items — needed by the web panel anyway) |
| `server/models/Order/orderModel.js` | **all raw `sequelize.query` with `bind`** (geography inserts, ST_X/ST_Y, `COUNT(*) OVER()`, dynamic `$N` filters); `updateOrderStatus` → `sequelize.transaction` + two raw queries |

Non-model call sites in the same phase:
- `server/server.js`: device_tokens upsert (POST `/api/otp/device` + socket register) → `db.DeviceToken`; `markOtpAsSended`, `/search` → raw `sequelize.query`; `connectDB()` → `connectSequelize()`.
- `server/socket/taxiSocket.js`: `upsertLocation` → raw `sequelize.query` (verbatim geography upsert).
- `server/service/smsService.js`: phone lookups → `db.User.findByPk` / `db.Taxi.findByPk`.

Then delete `server/config/db.js` (no consumers left).

## Phase 3 — Admin module (backend)

**Migrations** (`server/migrations/`, numbered raw SQL applied via psql, + `README.md`). Schemas come **from PLAN.md §3** verbatim:
- `001_pricing_config.sql` — PLAN.md §3.1: `app_data.pricing_config` (city_id UNIQUE FK, base_price, price_per_km, free_wait_min, wait_price_min, updated_at, updated_by) + seed row per existing city.
- `002_driver_applications.sql` — PLAN.md §3.3: `app_data.driver_applications` (user_id, city_id, name/phone/birthday, auto fields, license_photo, car_image, park, status pending|approved|rejected, rejection_reason, reviewed_by, reviewed_at).
- `003_users_role.sql` — PLAN.md §3.4: `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'client'` (client|driver|operator|admin).
- `004_admin_users.sql` — id, name, phone UNIQUE, password_hash, role CHECK ('admin','operator'), is_active, created_at/updated_at (web-panel credentials; separate from mobile users per user decision).

**Shared infra** (new): `server/exceptions/api-error.js` (embium ApiError), `server/middleware/adminAuth.js` (Bearer → `jwt.verify`, require `typ: 'admin'` claim so mobile tokens can't hit admin routes, load active AdminUser → `req.admin`), `server/middleware/requireRole.js` (PLAN.md Phase-1 item), `server/middleware/errorMiddleware.js` (**mounted on the admin router only** — legacy error behavior untouched), `server/utils/validator.js` (yup helper).

**Module** `server/modules/admin/` (embium layout): `models/AdminUser.js`, `models/PricingConfig.js`, `models/DriverApplication.js` (registered in `server/db/index.js`); `routes/index.js` mounted as `app.use('/api/admin', ...)` in server.js; `controllers/` + `services/` (static async classes; services own all Sequelize access; aggregates via raw `sequelize.query`); `validators/` (yup). Seed script `server/scripts/createAdmin.js` (bcryptjs hash).

**Endpoints** (all `{status: true, ...}` envelope; paths follow PLAN.md §4 & §7 conventions):

| Endpoint | Purpose |
|---|---|
| `POST /api/admin/auth/login` | `{phone,password}` → `{status, token, user}`; JWT `{id, role, typ:'admin'}`, 12h |
| `GET /api/admin/auth/me` | current admin |
| `GET /api/pricing/:cityId` | public — pricing for city (PLAN.md §4.1, used by mobile apps) |
| `PUT /api/admin/pricing/:cityId` + `GET /api/admin/pricing` | pricing_config CRUD (admin role) |
| `POST /api/driver-applications` | client submits application (PLAN.md §4.2) |
| `GET /api/admin/driver-applications?status=` + `GET .../:id` | applications queue |
| `PUT /api/admin/driver-applications/:id/approve` | atomic tx: INSERT taxies + `users.role='driver'` + status='approved' (PROCESSES.md #4) |
| `PUT /api/admin/driver-applications/:id/reject` | `{reason}` → status='rejected' |
| `GET /api/admin/users?role=&city_id=&search=&page=&limit=` | user management list (PLAN.md §4.3) |
| `GET /api/admin/drivers?cityId=&status=&limit=&page=` | taxies JOIN balance/cities/markas + order counts |
| `GET /api/admin/orders?status=&cityId=&limit=&page=` | orders JOIN users + taxies, ST_X/ST_Y coords |
| `GET /api/admin/reports/orders?from=&to=&city_id=` | totals + by_day (PLAN.md §4.4 shape) — feeds AnalyticsPage |
| `GET /api/admin/reports/drivers` | driver activity / top drivers |
| `GET /api/admin/transactions?limit=&page=` | balance ledger |
| `POST /api/admin/drivers/:userId/balance` | add/remove — reuses balanceModel |
| `GET /api/balance/:userId` | implement the empty `getBalanceInUSerId` stub (PLAN.md §4.6) |
| `GET/POST/PUT/DELETE /api/admin/team[/:id]` | admin_users CRUD (admin role) |

**Pricing wiring** (PLAN.md P0 + §5.2): `orderController.getOrderPrice` and `socket/orderSocket.js` read pricing_config by cityId (Redis cache `pricing:city:{cityId}` TTL 300s, invalidated on PUT) with env-constant fallback — response shapes unchanged. *(offeredPrice flow from PLAN.md is out of scope here — separate task.)*

## Phase 4 — Web: API layer + real data

1. **Plumbing**: `web/vite.config.js` — add proxies `/api` and `/socket.io` (ws) → `http://localhost:3000`; `web/.env.example`/`.env.production` — add `VITE_API_BASE` (empty dev / `https://hayyrly.com.tm` prod); add `socket.io-client` dep.
2. **API layer** (new `web/src/api/`): `client.js` (fetch wrapper: base URL, token from `localStorage('hayyrly_admin_token')`, throw on `status:false`, logout event on 401); per-resource files `auth.js`, `drivers.js`, `orders.js`, `applications.js`, `pricing.js`, `team.js`, `reports.js`, `transactions.js`; `socket.js` (socket.io-client singleton — emits `client:watch:city`/`client:get:taxis`, subscribes `city:taxis`, `taxi:location:update`, `taxi:status:update` per `server/socket/taxiSocket.js`); `useApi.js` (small loading/error/reload hook).
3. **Auth**: `web/src/auth/LoginPage.jsx` → real login call, role comes from server, show errors; `web/src/App.jsx` → restore session from localStorage on mount (validate via `/auth/me`), logout clears it.
4. **Page-by-page mock replacement** (order): SettingsPage (team + pricing) → DriversPage (drivers / driver-applications / transactions / balance actions) → OrdersPage + BoardPage → AnalyticsPage (reports) → MapPage + LiveMap (initial list via REST, live positions via socket — replaces the coordinate randomizer, 30s REST re-sync fallback). Then delete `web/src/data/mock.js`.

## Phase 5 — Verification

1. **Parity snapshots**: before Phase 2, curl every existing endpoint into `scratchpad/before/*.json`; re-run + `diff` after each conversion group. Watch: numeric-as-string fields (`total_count`, `price`, `balance`), geography hex strings in `RETURNING *`, array-vs-object (`createNewTaksi`).
2. **Transaction**: PATCH `/api/orders/:id/status` → log row atomic; force error → rollback. Same for application approve (taxies + role + status atomic).
3. **Realtime**: OTP flow (INSERT → NOTIFY → socket/FCM), taxi location socket flow.
4. **Admin E2E**: apply migrations, `createAdmin.js`, run server + `web npm run dev`, log in, walk all six pages.

## Risks / gotchas

- **PostGIS**: never declare `DataTypes.GEOMETRY/GEOGRAPHY` — Sequelize would register a global WKB→GeoJSON pg type parser, silently changing `RETURNING *` payloads everywhere. All geo queries stay verbatim raw `sequelize.query` with `bind`.
- **`timestamps: false`** on all mapped models; set `updated_at` explicitly where old SQL did (`taxi_order_logs` uses `changed_at`).
- Pg error codes surface as `error.original.code` under Sequelize (balance 23514 check).
- Express 5: admin error middleware router-scoped only; plain named params in admin routes.
- Never template values into SQL — positional/named `bind` only for dynamic filters.
- Same `JWT_SECRET` for both token types, but `typ:'admin'` claim gates admin routes.
- Geography inserts keep `ST_MakePoint(lng, lat)` — longitude first (PLAN.md §7).

## Documentation

Save this plan as `documentation/IMPLEMENTATION_PLAN.md` in the repo (new `documentation/` folder), cross-referencing `PLAN.md` / `PROCESSES.md`; update it if scope shifts during implementation.
