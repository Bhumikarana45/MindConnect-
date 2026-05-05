DROP POLICY IF EXISTS "Users can upload their own certificates" ON storage.objects;
CREATE POLICY "Anyone can upload certificates"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'certificates');