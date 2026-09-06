# Socket.IO Schema — Hayyrly Taxi

**URL:** `ws://localhost:3000`  
**Namespace:** `/` (default)

---

## Baglanyşyk (Connection)

Her ulanyjy baglanandan soň `register` ibermeli:

```json
emit("register", {
  "phone": "+99361000000",
  "token": "FCM_TOKEN_HERE"
})
```

Taksi sürüjisi goşmaça `taxi:register` ibermeli:

```json
emit("taxi:register", {
  "taxiId": 1,
  "cityId": 1
})
```

```json
on("taxi:registered", {
  "taxiId": 1,
  "cityId": 1
})
```

---

## Taksi — Lokasion we Status

### Lokasion ibermek
```json
emit("taxi:location", { "lat": 37.9601, "lng": 58.3794 })
```
```json
on("taxi:location:update", { "taxiId": 1, "lat": 37.9601, "lng": 58.3794, "status": "free" })
```

### Status üýtgetmek
```json
emit("taxi:status", { "status": "free" })
// status: "free" | "busy"
```
```json
on("taxi:status:updated", { "taxiId": 1, "status": "free" })
on("taxi:status:update",  { "taxiId": 1, "status": "free" })
```

---

## Taksi — Synlamak (Watch)

### Bir taksi synlamak
```json
emit("client:watch",   { "taxiId": 1 })
emit("client:unwatch", { "taxiId": 1 })
```

### Şäher boýunça ähli taksileri synlamak
```json
emit("client:watch:city",   { "cityId": 1 })
emit("client:unwatch:city", { "cityId": 1 })
```

### Şäherdäki ähli taksileri almak (bir gezek)
```json
emit("client:get:taxis", { "cityId": 1 })
```
```json
on("city:taxis", {
  "cityId": 1,
  "taxis": [
    { "taxiId": "1", "lat": 37.96, "lng": 58.37, "status": "free" }
  ]
})
```

---

## Sargyt Akymы (Order Flow)

```
PASSENGER                        SERVER                         DRIVER
─────────────────────────────────────────────────────────────────────
order:create ──────────────────► DB row döredilýär
              ◄────────────────── order:created (passenger-a)
                                  order:new ────────────────────────► (ähli şäher taksi)

              ◄──────────────────────────────── order:accept
order:accepted ◄─────────────── status=accepted, taxi=busy

              ◄──────────────────────────────── order:arrived
order:arrived ◄──────────────── status=arrived

              ◄──────────────────────────────── order:on_way
order:on_way  ◄──────────────── waiting price hasaplanýar

              ◄──────────────────────────────── order:track (her 10s)
order:track ◄────────────────── GPS nokady ýazylýar

              ◄──────────────────────────────── order:complete
order:completed ◄────────────── total = base + waiting
```

---

### 1. Sargyt döretmek (Passenger → Server)

```json
emit("order:create", {
  "userId":       1,
  "cityId":       1,
  "startAddress": "Bitarap Turkmenistan 123",
  "endAddress":   "Garaşsyzlyk 45",
  "startLat":     37.9601,
  "startLng":     58.3794,
  "endLat":       37.9750,
  "endLng":       58.4100,
  "distanceKm":   3.2,
  "paymentType":  "cash",
  "basePrice":    12.0
})
// endAddress, endLat, endLng — optional (null bolup biler)
// paymentType: "cash" | "balance" | "card"
```

**Passenger-a jogap:**
```json
on("order:created", {
  "orderId": 42,
  "order":   { ...order object... }
})
```

**Şäherdäki ähli taksilere:**
```json
on("order:new", {
  "orderId":      42,
  "userId":       1,
  "startAddress": "Bitarap Turkmenistan 123",
  "endAddress":   "Garaşsyzlyk 45",
  "startLat":     37.9601,
  "startLng":     58.3794,
  "endLat":       37.9750,
  "endLng":       58.4100,
  "distanceKm":   3.2,
  "paymentType":  "cash",
  "basePrice":    12.0
})
```

---

### 2. Sargydy kabul etmek (Driver → Server)

```json
emit("order:accept", { "orderId": 42 })
// Diňe taxi:register edilen soket ibermeli
```

**Ikisine-de (passenger + driver):**
```json
on("order:accepted", {
  "orderId": 42,
  "taxiId":  1,
  "order":   { ...order object... }
})
```

---

### 3. Sürüji geldi (Driver → Server)

```json
emit("order:arrived", { "orderId": 42 })
```

```json
on("order:arrived", {
  "orderId": 42,
  "order":   { ...order object... }
})
```

---

### 4. Ýola düşdük (Driver → Server)

```json
emit("order:on_way", { "orderId": 42 })
```

```json
on("order:on_way", {
  "orderId":        42,
  "waitingSeconds": 245,
  "waitingPrice":   1.0,
  "order":          { ...order object... }
})
// Ilkinji 3 minut mugt, soňra 0.5 TMT/min hasaplanýar
```

---

### 5. GPS treki ibermek (Driver → Server) — ýolda wagty

```json
emit("order:track", {
  "orderId": 42,
  "lat":     37.9650,
  "lng":     58.3850
})
```

**Passenger-a:**
```json
on("order:track", {
  "orderId": 42,
  "lat":     37.9650,
  "lng":     58.3850,
  "taxiId":  1
})
```

---

### 6. Sargyt tamamlandy (Driver → Server)

```json
emit("order:complete", { "orderId": 42 })
```

```json
on("order:completed", {
  "orderId":    42,
  "totalPrice": 13.0,
  "order":      { ...order object... }
})
// totalPrice = basePrice + waitingPrice
```

---

### 7. Ýatyrmak (Passenger ýa Driver → Server)

```json
emit("order:cancel", {
  "orderId": 42,
  "cityId":  1
})
// cityId — driver ýatyrsa hökmany (täzeden şähere iberler)
```

```json
on("order:cancelled", {
  "orderId":     42,
  "cancelledBy": "driver",
  "order":       { ...order object... }
})
// cancelledBy: "user" | "driver"
```

> Sürüji ýatyrsa, sargyt şäherdäki täksilere täzeden `order:new` hökmünde iberilýär.

---

### 8. Sargydy synlamak (Passenger, geç baglananda)

```json
emit("order:watch", { "orderId": 42 })
// Ulanyjy oglan odata birikýär we ähli update-lary alýar
```

---

### 9. Söhbetdeşlik — sargyt çaty (Passenger ↔ Driver → Server)

> Sargyt çaty diňe **client ↔ driver** üçin. Admin bu çata ýazyp bilmeýär — diňe `GET /api/admin/orders/:id/messages` arkaly gözegçilik üçin okaýar. Admin ulanyjy bilen gürleşmek üçin aşakdaky **10-njy bölümdäki** goldaw çatyny ulanýar.

```json
emit("chat:send", {
  "orderId":    42,
  "senderType": "client",
  "senderId":   7,
  "body":       "Salam, men gapyň öňünde"
})
// senderType: "client" | "driver"  (admin bu event-i ulanyp bilmeýär)
// senderId — ugradyjynyň users.id ýa-da taxies.id-si
```

Sargyt otagyndaky ähliler alýar:
```json
on("chat:message", {
  "id":          15,
  "order_id":    42,
  "sender_type": "client",
  "sender_id":   7,
  "body":        "Salam, men gapyň öňünde",
  "created_at":  "2026-07-16T10:15:00.000Z"
})
```

---

### 10. Goldaw çaty — user ↔ admin (Söhbetdeşlik order-a bagly däl)

> Ulanyjynyň admin bilen ýeke-täk, üznüksiz gürrüňdeşlik dessesi (thread). Sargyda bagly däl — balans, şikaýat we ş.m. üçin.

```json
emit("support:watch", { "userId": 7 })
// Ulanyjy öz thread otagyna birikýär, admin jogaplaryny göni alar ýaly
```

```json
emit("support:send", {
  "userId":   7,
  "message":  "Salam, kömek gerek",
  "photoUrl": null
})
// message ýa-da photoUrl-yň biri hökmany
```

Ulanyja we `admin:support` otagyndaky adminlere ýaýradylýar:
```json
on("support:message", {
  "id":          3,
  "user_id":     7,
  "sender_type": "user",
  "sender_id":   7,
  "message":     "Salam, kömek gerek",
  "photo_url":   null,
  "is_read":     false,
  "created_at":  "2026-07-23T10:15:00.000Z"
})
```

> Admin jogaby REST arkaly (`POST /api/admin/support/:userId/messages`) ýazylýar we şol bir `support:user:${userId}` + `admin:support` otaglaryna ýaýradylýar. Taryhy almak: `GET /api/support/user/:userId/messages` (ulanyjy) / `GET /api/admin/support/:userId/messages` (admin, tredler sanawy: `GET /api/admin/support`).

---

### 11. SOS signaly (Passenger/Driver → Server)

```json
emit("sos:trigger", {
  "orderId": 42,
  "userId":  7,
  "taxiId":  1,
  "phone":   "+99361000000",
  "note":    "emergency",
  "lat":     37.9601,
  "lng":     58.3794
})
// orderId, userId, taxiId — optional (aktiw sargyt bolmasa hem iberilip bilner)
// note — erkin tekst, mysal üçin: emergency, fire, police...
```

Iberen kliente jogap:
```json
on("sos:triggered", {
  "id": 3, "order_id": 42, "user_id": 7, "taxi_id": 1,
  "phone": "+99361000000", "note": "emergency", "status": "open",
  "lat": 37.9601, "lng": 58.3794, "created_at": "2026-07-23T10:15:00.000Z"
})
```

`admin:sos` otagyna birikdirilen admin panel sokletlerine ýaýradylýar:
```json
on("sos:alert", { ...ýokardaky SOS obýekti... })
```

REST arkaly hem iberip bolýar (soket ýok bolsa): `POST /api/sos` (şol bir body).

**Admin panel — SOS we goldaw çaty otaglaryna goşulmak (bir gezek, birikende):**
```json
emit("admin:register", { "token": "ADMIN_JWT_HERE" })
```
```json
on("admin:registered", { "adminId": 1 })
// Awtomatik "admin:sos" we "admin:support" otaglaryna goşulýar
```
> Admin panelinden SOS sanawyny görmek/ýapmak REST arkaly: `GET /api/admin/sos`, `PUT /api/admin/sos/:id/status`.

---

## Ýalňyşlyk (Error)

Islendik ýalňyşlykda:
```json
on("order:error", {
  "message": "orderId is required"
})

on("taxi:error", {
  "message": "Not registered. Send taxi:register first"
})

on("sos:error", {
  "message": "phone, lat, lng are required"
})

on("support:error", {
  "message": "userId and (message or photoUrl) are required"
})
```

---

## Status ENUMlary

| Status               | Düşündiriş                        |
|----------------------|-----------------------------------|
| `created`            | Döredildi, taksi gözlenýär        |
| `accepted`           | Taksi kabul etdi, ýolda           |
| `arrived`            | Taksi geldi, garaşýar             |
| `on_way`             | Passenger mindi, ýolda            |
| `completed`          | Tamamlandy                        |
| `cancelled_by_user`  | Ulanyjy ýatyrdy                   |
| `cancelled_by_driver`| Sürüji ýatyrdy                    |

## Töleg usullary

| paymentType | Düşündiriş        |
|-------------|-------------------|
| `cash`      | Nagt              |
| `balance`   | Balans (köşelok)  |
| `card`      | Kart              |
