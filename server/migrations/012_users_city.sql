-- Lets a user pick/change their city. Also fixes a pre-existing latent bug in
-- models/Order/orderModel.js's getActiveOrdersInCity, which already joined on
-- u.city_id without this column ever having existed.

ALTER TABLE app_data.users ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES app_data.cities(id);
