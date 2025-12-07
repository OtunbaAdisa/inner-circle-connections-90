-- Create a security definer function to check if user is participant in event
CREATE OR REPLACE FUNCTION public.is_participant_in_event(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.participant_profiles
    WHERE user_id = _user_id
      AND event_id = _event_id
  )
$$;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Participants can view participants in same event" ON public.participant_profiles;

-- Create new non-recursive policy using the security definer function
CREATE POLICY "Participants can view participants in same event"
ON public.participant_profiles
FOR SELECT
USING (
  is_participant_in_event(auth.uid(), event_id) OR is_admin(auth.uid())
);

-- Fix storage policies - drop and recreate with proper conditions
DROP POLICY IF EXISTS "Users can upload their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own selfies" ON storage.objects;

-- Recreate storage policies that work properly
CREATE POLICY "Anyone can upload to selfies bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'selfies');

CREATE POLICY "Anyone can update selfies"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'selfies');

CREATE POLICY "Anyone can delete selfies"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'selfies');