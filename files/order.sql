-- =========================================================================
-- НАЗВАНИЕ: Модуль такси с поддержкой PostGIS (Схема: app_data)
-- ОПИСАНИЕ: Архитектура для заказа такси, логгирования времени ожидания
--           и трекинга маршрута поездки через гео-точки.
-- =========================================================================

START TRANSACTION;

-- -------------------------------------------------------------------------
-- [1] СОЗДАНИЕ ПЕРЕЧИСЛЕНИЙ (ENUMS)
-- -------------------------------------------------------------------------

-- Статусы жизненного цикла заказа
CREATE TYPE app_data.order_status AS ENUM (
    'created',              -- Клиент создал заказ, идет поиск машины
    'accepted',             -- Водитель принял заказ и едет к клиенту
    'arrived',              -- Водитель на месте (старт БЕСПЛАТНОГО/ПЛАТНОГО ожидания)
    'on_way',               -- Пассажир сел, машина в движении (статус "в пути")
    'completed',            -- Поездка успешно завершена
    'cancelled_by_user',    -- Заказ отменен клиентом
    'cancelled_by_driver'   -- Заказ отменен водителем
);

-- Доступные методы оплаты
CREATE TYPE app_data.payment_method AS ENUM (
    'cash',                 -- Наличный расчет
    'balance',              -- Списание с личного кошелька (таблица balance)
    'card'                  -- Оплата привязанной картой
);


-- -------------------------------------------------------------------------
-- [2] ОСНОВНАЯ ТАБЛИЦА: ТАКСИ ЗАКАЗЫ (taxi_orders)
-- -------------------------------------------------------------------------
CREATE TABLE app_data.taxi_orders (
    id BIGSERIAL PRIMARY KEY,
    user_id integer NOT NULL,          -- Ссылка на клиента (app_data.users)
    taxi_id integer DEFAULT NULL,      -- Ссылка на водителя (app_data.taxies). NULL при поиске
    
    -- Текстовые ориентиры (для истории поездок во Flutter)
    start_address text NOT NULL,
    end_address text NOT NULL,
    
    -- Пространственные GIS координаты (Используют GPS проекцию 4326 WGS 84)
    -- Хранятся в формате geography для точного расчета расстояний в метрах
    start_location public.geography(Point, 4326) NOT NULL,
    end_location public.geography(Point, 4326) NOT NULL,
    
    distance_km decimal(6,2) NOT NULL DEFAULT 0.00, -- Итоговая длина маршрута
    status app_data.order_status NOT NULL DEFAULT 'created',
    payment_type app_data.payment_method NOT NULL DEFAULT 'cash',
    
    -- Финансовый блок (Расчет стоимости)
    base_price double precision NOT NULL DEFAULT 0.0,    -- Чистая стоимость за километраж
    waiting_price double precision NOT NULL DEFAULT 0.0, -- Стоимость простоя по таймеру (ozidaniye)
    total_price double precision NOT NULL DEFAULT 0.0,   -- Финальный чек: base_price + waiting_price
    
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES app_data.users (id),
    CONSTRAINT fk_order_taxi FOREIGN KEY (taxi_id) REFERENCES app_data.taxies (id)
);


-- -------------------------------------------------------------------------
-- [3] ТАБЛИЦА ЛОГОВ: ИСТОРИЯ И ТАЙМИНГИ СТАТУСОВ (taxi_order_logs)
-- -------------------------------------------------------------------------
-- Используется для точного замера времени. 
-- Разница между временем 'on_way' и 'arrived' покажет точное время ожидания пассажира.
CREATE TABLE app_data.taxi_order_logs (
    id BIGSERIAL PRIMARY KEY,
    order_id bigint NOT NULL,
    status app_data.order_status NOT NULL,
    changed_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_log_order FOREIGN KEY (order_id) REFERENCES app_data.taxi_orders (id) ON DELETE CASCADE
);


-- -------------------------------------------------------------------------
-- [4] ТАБЛИЦА ТРЕКИНГА: ПУТЕВЫЕ ТОЧКИ МАШИНЫ (taxi_order_tracks)
-- -------------------------------------------------------------------------
-- Сюда WebSocket'ы шлют координаты водителя в пути каждые 10-15 сек.
-- Позволяет отрисовать пройденный маршрут линией на карте во Flutter.
CREATE TABLE app_data.taxi_order_tracks (
    id BIGSERIAL PRIMARY KEY,
    order_id bigint NOT NULL,
    location public.geography(Point, 4326) NOT NULL, -- Точка нахождения авто в секунду X
    recorded_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_track_order FOREIGN KEY (order_id) REFERENCES app_data.taxi_orders (id) ON DELETE CASCADE
);


-- -------------------------------------------------------------------------
-- [5] ИНДЕКСЫ ОПТИМИЗАЦИИ (Для работы при нагрузках 10K+)
-- -------------------------------------------------------------------------

-- Пространственные индексы GIST (Критически важны для быстрой работы PostGIS)
CREATE INDEX idx_orders_start_loc ON app_data.taxi_orders USING GIST (start_location);
CREATE INDEX idx_orders_end_loc ON app_data.taxi_orders USING GIST (end_location);
CREATE INDEX idx_tracks_loc ON app_data.taxi_order_tracks USING GIST (location);

-- Стандартные B-Tree индексы для ускорения выборок по внешним ключам и фильтрам
CREATE INDEX idx_orders_user ON app_data.taxi_orders (user_id);
CREATE INDEX idx_orders_taxi ON app_data.taxi_orders (taxi_id);
CREATE INDEX idx_orders_status ON app_data.taxi_orders (status);
CREATE INDEX idx_order_logs_order ON app_data.taxi_order_logs (order_id);
CREATE INDEX idx_order_tracks_order ON app_data.taxi_order_tracks (order_id);

COMMIT;