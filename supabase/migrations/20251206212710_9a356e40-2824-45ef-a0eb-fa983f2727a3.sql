
-- Fix function search path for calculate_age
CREATE OR REPLACE FUNCTION public.calculate_age(birthday DATE)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, birthday))::INTEGER
$$;

-- Fix function search path for get_age_band
CREATE OR REPLACE FUNCTION public.get_age_band(age_value INTEGER)
RETURNS age_band
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE
        WHEN age_value BETWEEN 13 AND 24 THEN 'trailblazers'::age_band
        WHEN age_value BETWEEN 25 AND 40 THEN 'creatives'::age_band
        WHEN age_value BETWEEN 41 AND 55 THEN 'luminaries'::age_band
        WHEN age_value BETWEEN 56 AND 65 THEN 'pillars'::age_band
        ELSE 'icons'::age_band
    END
$$;
