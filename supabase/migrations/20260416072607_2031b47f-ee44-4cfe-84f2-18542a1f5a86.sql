-- Fix: Allow authenticated users to see profiles of approved doctors
CREATE POLICY "Anyone can view profiles of approved doctors"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.user_id = profiles.user_id
    AND doctors.status = 'approved'
  )
);

-- Create doctor_ratings table
CREATE TABLE public.doctor_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE public.doctor_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view ratings (for display on doctor cards)
CREATE POLICY "Anyone can view doctor ratings"
ON public.doctor_ratings
FOR SELECT
TO authenticated
USING (true);

-- Patients can insert a rating for their own completed appointment
CREATE POLICY "Patients can rate their completed appointments"
ON public.doctor_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = patient_id
  AND EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.id = appointment_id
    AND appointments.patient_id = auth.uid()
    AND appointments.status = 'completed'
  )
);