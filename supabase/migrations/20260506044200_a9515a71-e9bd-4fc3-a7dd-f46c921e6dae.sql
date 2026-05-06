CREATE POLICY "Doctors can update their own record"
ON public.doctors
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);