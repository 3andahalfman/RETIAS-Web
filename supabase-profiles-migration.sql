-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text UNIQUE NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a name is taken (needed for availability check)
CREATE POLICY "Public read" ON public.profiles
  FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
