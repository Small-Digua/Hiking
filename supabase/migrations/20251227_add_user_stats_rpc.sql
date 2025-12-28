-- Create a function to get user statistics
create or replace function public.get_user_stats(user_uuid uuid)
returns json
language plpgsql
security definer
as $$
declare
  total_distance numeric;
  completed_count integer;
  routes_count integer;
  cities_count integer;
begin
  -- Calculate completed count (total times routes were completed)
  select count(*)
  into completed_count
  from itineraries
  where user_id = user_uuid and status = 'Completed';

  -- Calculate unique routes count (distinct routes completed)
  select count(distinct route_id)
  into routes_count
  from itineraries
  where user_id = user_uuid and status = 'Completed';
  
  -- Calculate cities count (distinct cities visited)
  select count(distinct r.city_id)
  into cities_count
  from itineraries i
  join routes r on i.route_id = r.id
  where i.user_id = user_uuid and i.status = 'Completed';

  -- Calculate total distance
  select coalesce(sum(r.distance_km), 0)
  into total_distance
  from itineraries i
  join routes r on i.route_id = r.id
  where i.user_id = user_uuid and i.status = 'Completed';

  return json_build_object(
    'totalDistance', total_distance,
    'routesCount', routes_count,
    'completedCount', completed_count,
    'citiesCount', cities_count
  );
end;
$$;
