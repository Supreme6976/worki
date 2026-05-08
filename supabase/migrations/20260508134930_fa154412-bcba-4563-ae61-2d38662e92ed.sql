-- 1. Restrict jobs.contact_info to authenticated users (column-level)
REVOKE SELECT (contact_info) ON public.jobs FROM anon;
GRANT SELECT (contact_info) ON public.jobs TO authenticated;

-- 2. Prevent anonymous bucket listing while preserving public file URLs
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Authenticated users can list avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
