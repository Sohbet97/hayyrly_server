# Taxi Location System — Plan & Architecture

## Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         TAXI LOCATION SYSTEM                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────┐                    ┌──────────────────────────────────────┐
│                 │  taxi:register     │                                      │
│   TAXI APP      │ ─────────────────→ │              SERVER                  │
│   (Driver)      │  { taxiId,         │                                      │
│                 │    cityId }        │  socket.on('taxi:register')           │
│                 │                    │  socket.on('taxi:location')           │
│                 │  taxi:location     │  socket.on('disconnect')             │
│                 │ ─────────────────→ │                                      │
│                 │  { lat, lng }      │                                      │
│                 │  (every 3s)        └────────────────┬─────────────────────┘
└─────────────────┘                                     │
                                                        │  writes
                          ┌─────────────────────────────┼──────────────────┐
                          │                             │                  │
                          ▼                             ▼                  ▼
               ┌─────────────────┐          ┌─────────────────┐  ┌────────────────┐
               │   Redis GEO     │          │   Redis HASH    │  │   Redis SET    │
               │                 │          │                 │  │                │
               │  taxis:geo      │          │ taxi:{id}:meta  │  │ taxis:city:{N} │
               │                 │          │                 │  │                │
               │  GEOADD         │          │  lat, lng       │  │  taxi_42       │
               │  lng lat id     │          │  cityId         │  │  taxi_17       │
               │                 │          │  status         │  │  taxi_88       │
               │  (for radius    │          │  updatedAt      │  │                │
               │   search)       │          │                 │  │  (index by     │
               │                 │          │  EXPIRE 30s     │  │   city)        │
               └────────┬────────┘          └─────────────────┘  └────────────────┘
                        │
                        │  every N seconds (setInterval)
                        │
                        ▼
               ┌─────────────────┐
               │   Sync Job      │
               │                 │
               │  1. get all     │
               │     active      │
               │     taxis from  │
               │     Redis       │
               │                 │
               │  2. UPSERT      │
               │     batch into  │
               │     PostgreSQL  │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────────────────┐
               │         PostgreSQL           │
               │                             │
               │  table: taxis_location      │
               │  ─────────────────────────  │
               │  taxi_id    INT             │
               │  lat        FLOAT           │
               │  lng        FLOAT           │
               │  city_id    INT             │
               │  updated_at TIMESTAMPTZ     │
               └─────────────────────────────┘


┌─────────────────┐                    ┌──────────────────────────────────────┐
│                 │  client:get:taxis  │                                      │
│  CLIENT APP     │ ─────────────────→ │  if cityId:                          │
│  (Passenger)    │                    │    SMEMBERS taxis:city:{N}           │
│                 │  { cityId: 5 }     │    HGETALL  taxi:{id}:meta  (x each) │
│                 │  OR                │                                      │
│                 │  { lat, lng }      │  if lat/lng:                         │
│                 │  OR                │    GEOSEARCH taxis:geo               │
│                 │  { lat, lng,       │    FROMLONLAT lng lat                │
│                 │    radius: 5 }     │    BYRADIUS {radius} km ASC          │
│                 │                    │    WITHCOORD WITHDIST                │
│                 │ ←──────────────── │                                      │
│                 │  client:taxis:     └──────────────────────────────────────┘
│                 │  result
│                 │  [{ taxiId,
│                 │     lat, lng,
│                 │     dist?,     ← только в режиме GEO
│                 │     cityId }]
└─────────────────┘
```

---

## Redis Keys

| Key | Type | Описание | TTL |
|-----|------|----------|-----|
| `taxis:geo` | GEO (ZSET) | Позиции всех такси | нет (удаляем при disconnect) |
| `taxi:{id}:meta` | HASH | Метаданные такси (lat, lng, cityId) | 30 сек (авто-офлайн) |
| `taxis:city:{cityId}` | SET | Индекс taxiId по городу | нет (удаляем при disconnect) |

---

## PostgreSQL Table

```sql
CREATE TABLE IF NOT EXISTS taxis_location (
    taxi_id     INT PRIMARY KEY,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    city_id     INT,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Stages

---

### Stage 1 — Redis: taxi:register

**Что делаем:**
- Обрабатываем событие `taxi:register` от такси
- Сохраняем `taxiId`, `cityId` в `socket.data`
- `SADD taxis:city:{cityId} taxi_{taxiId}` — добавляем в индекс города
- `HSET taxi:{taxiId}:meta cityId {cityId} status active` — метаданные

**Как тестировать:**
```
1. Подключиться к socket (Postman / wscat)
2. Отправить событие:
   taxi:register  →  { "taxiId": 1, "cityId": 5 }
3. Проверить в Redis CLI:
   SMEMBERS taxis:city:5       → ["taxi_1"]
   HGETALL  taxi:1:meta        → { cityId: 5, status: active }
```

---

### Stage 2 — Redis: taxi:location (GEO + HASH + EXPIRE)

**Что делаем:**
- Обрабатываем событие `taxi:location` → `{ lat, lng }`
- `GEOADD taxis:geo lng lat taxi_{taxiId}`
- `HSET taxi:{taxiId}:meta lat {lat} lng {lng} updatedAt {ts}`
- `EXPIRE taxi:{taxiId}:meta 30` — если такси молчит 30 сек → офлайн

**Как тестировать:**
```
1. После Stage 1 отправить:
   taxi:location  →  { "lat": 37.9601, "lng": 58.3261 }
2. Проверить в Redis CLI:
   GEOPOS  taxis:geo  taxi_1          → [[58.3261, 37.9601]]
   HGETALL taxi:1:meta                → { lat, lng, cityId, updatedAt }
   TTL     taxi:1:meta                → ~30 (сек)
```

---

### Stage 3 — Redis: disconnect (cleanup)

**Что делаем:**
- При `disconnect` убираем такси из всех Redis структур:
- `ZREM taxis:geo taxi_{taxiId}`
- `SREM taxis:city:{cityId} taxi_{taxiId}`
- `DEL  taxi:{taxiId}:meta`

**Как тестировать:**
```
1. Подключить такси, зарегистрировать, отправить location
2. Отключить (закрыть соединение)
3. Проверить в Redis CLI:
   ZRANK    taxis:geo  taxi_1         → nil
   SMEMBERS taxis:city:5              → []
   EXISTS   taxi:1:meta               → 0
```

---

### Stage 4 — Client: client:get:taxis (два режима)

**Что делаем:**
- Обрабатываем `client:get:taxis`:
  - если пришёл `cityId` → `SMEMBERS` + `HGETALL` каждого
  - если пришёл `lat/lng` → `GEOSEARCH BYRADIUS`
- Возвращаем `client:taxis:result` с массивом такси

**Как тестировать:**
```
--- Режим CITY ---
1. Подключить такси, зарегистрировать в city 5, отправить location
2. Подключить клиента, отправить:
   client:get:taxis  →  { "cityId": 5 }
3. Ожидаем:
   client:taxis:result  →  [{ taxiId: 1, lat, lng, cityId: 5 }]

--- Режим GEO ---
1. То же такси онлайн
2. Клиент отправляет:
   client:get:taxis  →  { "lat": 37.9601, "lng": 58.3261 }
3. Ожидаем:
   client:taxis:result  →  [{ taxiId: 1, lat, lng, dist: 0.0 }]

--- Граничный случай ---
4. Клиент отправляет координаты далеко (> 3km) от такси
5. Ожидаем:
   client:taxis:result  →  []
```

---

### Stage 5 — PostgreSQL sync (setInterval)

**Что делаем:**
- `setInterval` каждые N секунд (например 10)
- Берём все ключи `taxi:*:meta` из Redis
- Batch UPSERT в таблицу `taxis_location`
- Создаём саму таблицу (миграция)

**Как тестировать:**
```
1. Запустить сервер
2. Подключить такси, зарегистрировать, отправить несколько location
3. Подождать N секунд
4. Проверить в PostgreSQL:
   SELECT * FROM taxis_location;
   → должна быть строка с taxi_id=1 и актуальными lat/lng

5. Обновить location такси (другие координаты)
6. Подождать ещё N секунд
7. Проверить что updated_at обновился и координаты изменились
```

---

## Files to create / modify

```
server.js                          ← добавить socket логику + sync job
config/
  └── db.js                        ← без изменений
migrations/
  └── 001_create_taxis_location.sql ← CREATE TABLE taxis_location
socket/
  └── taxiSocket.js                ← вся socket логика такси и клиента (новый файл)
jobs/
  └── taxiLocationSync.js          ← setInterval sync Redis → PostgreSQL (новый файл)
```

---

## Event Summary Table

| Отправитель | Событие | Данные | Действие сервера |
|-------------|---------|--------|------------------|
| Taxi | `taxi:register` | `{ taxiId, cityId }` | SADD, HSET |
| Taxi | `taxi:location` | `{ lat, lng }` | GEOADD, HSET, EXPIRE |
| Taxi | `disconnect` | — | ZREM, SREM, DEL |
| Client | `taxi:register` | `{ userId, role: 'client' }` | socket.data сохранить |
| Client | `client:get:taxis` | `{ cityId }` или `{ lat, lng, radius? }` | Redis query → emit result |
| Server | `client:taxis:result` | `[{ taxiId, lat, lng, dist?, cityId }]` | — |
