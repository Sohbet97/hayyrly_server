-- Commission on cash rides must still be deducted from the driver's balance even when
-- funds are insufficient (the driver goes into debt — "bergi"). The old chk_price_positive
-- CHECK blocked ANY balance debit from going negative, for every caller (admin manual
-- adjustments, balance-request withdrawals, self-service removal, and commission alike).
-- Drop it at the DB level; server/models/User/balanceModel.js now enforces "insufficient
-- funds" in application code (via SELECT ... FOR UPDATE) for the callers that still need it,
-- while the cash-commission deduction path explicitly opts out and is allowed to go negative.
ALTER TABLE app_data.balance
    DROP CONSTRAINT IF EXISTS chk_price_positive;
