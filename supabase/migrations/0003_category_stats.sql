-- Per-category counts for the home grid, so the client doesn't have to
-- download every product/rating row just to count them.
create or replace view category_stats with (security_invoker = on) as
select
  c.id as category_id,
  count(distinct p.id) as product_count,
  count(r.id) as rating_count
from categories c
left join products p on p.category_id = c.id
left join ratings r on r.product_id = p.id
group by c.id;
