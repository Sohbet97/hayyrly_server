-- PLAN.md §3.4 — role column drives the driver-application approval flow
-- (approving an application sets role='driver').

ALTER TABLE app_data.users
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';
-- role: 'client' | 'driver' | 'operator' | 'admin'
