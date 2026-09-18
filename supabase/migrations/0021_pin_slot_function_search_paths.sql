-- Closes the "Function Search Path Mutable" security-advisor warning on
-- the three slot-capacity functions — hold_slot was just redefined by
-- 0020, and release_expired_holds now runs unattended via pg_cron, so
-- pinning search_path on all three (not letting the caller's/session's
-- search_path influence which objects an unqualified name resolves to)
-- is worth doing now rather than leaving it open.

alter function public.hold_slot(uuid, uuid, int) set search_path = public;
alter function public.release_expired_holds() set search_path = public;
alter function public.release_slot_capacity(uuid) set search_path = public;
