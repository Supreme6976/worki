-- 1. Restrict profile reads to authenticated users (phone field is sensitive)
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;

CREATE POLICY "Authenticated users view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Prevent privilege escalation via profiles.role
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'client');

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = 'client');
