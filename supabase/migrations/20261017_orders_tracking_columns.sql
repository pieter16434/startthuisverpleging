-- Tracking kolommen op orders tabel voor Meta CAPI Purchase event
-- Sla fbp, fbc, IP en user-agent op bij checkout zodat de Mollie webhook
-- deze kan meesturen naar de Meta Conversions API.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_fbp TEXT,
  ADD COLUMN IF NOT EXISTS tracking_fbc TEXT,
  ADD COLUMN IF NOT EXISTS tracking_ip  TEXT,
  ADD COLUMN IF NOT EXISTS tracking_ua  TEXT;
