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

## Ýalňyşlyk (Error)

Islendik ýalňyşlykda:
```json
on("order:error", {
  "message": "orderId is required"
})

on("taxi:error", {
  "message": "Not registered. Send taxi:register first"
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
