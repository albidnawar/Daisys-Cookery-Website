-- One-time data fix: orders placed before exact-time booking (0032) still
-- carry their old 2-3 hour window (e.g. 16:00-18:00) on their
-- delivery_slots row. Collapse each to its midpoint as a single time
-- (16:00-18:00 -> 17:00-17:00) so every order — old and new — now displays
-- one exact time rather than a mix of ranges and points. Only rows a real
-- order still points at are touched.

update delivery_slots ds
set start_time = ds.start_time + (ds.end_time - ds.start_time) / 2,
    end_time = ds.start_time + (ds.end_time - ds.start_time) / 2
where ds.start_time <> ds.end_time
  and exists (select 1 from orders o where o.slot_id = ds.id);
