-- Lets each review carry the date it was given (or the date of the order
-- it refers to), shown alongside it on the homepage marquee.
alter table reviews add column review_date date not null default current_date;
