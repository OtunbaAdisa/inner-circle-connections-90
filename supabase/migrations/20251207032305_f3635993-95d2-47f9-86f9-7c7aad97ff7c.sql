-- Create selfies storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('selfies', 'selfies', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own selfies
CREATE POLICY "Users can upload their own selfies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'selfies');

-- Allow public read access to selfies
CREATE POLICY "Selfies are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'selfies');

-- Allow users to update their own selfies
CREATE POLICY "Users can update their own selfies"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'selfies');

-- Allow users to delete their own selfies
CREATE POLICY "Users can delete their own selfies"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'selfies');