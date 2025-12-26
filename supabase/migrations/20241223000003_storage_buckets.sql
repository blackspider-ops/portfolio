-- Migration: Storage Buckets
-- Requirements: 20.1

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Public images bucket for portfolio images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-images',
  'public-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Resume bucket for PDF storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume',
  'resume',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Private admin bucket for draft assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-admin',
  'private-admin',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Public images: anyone can read
CREATE POLICY "Public images are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'public-images');

-- Public images: authenticated editors/admins can upload
CREATE POLICY "Authenticated users can upload public images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Public images: authenticated editors/admins can update
CREATE POLICY "Authenticated users can update public images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'public-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    bucket_id = 'public-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Public images: authenticated editors/admins can delete
CREATE POLICY "Authenticated users can delete public images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'public-images'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Resume: anyone can read
CREATE POLICY "Resume is publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'resume');

-- Resume: only admins can upload/update/delete
CREATE POLICY "Admins can upload resume"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resume'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update resume"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resume'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'resume'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete resume"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resume'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Private admin: only authenticated editors/admins can access
CREATE POLICY "Authenticated users can read private admin files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'private-admin'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated users can upload private admin files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'private-admin'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated users can update private admin files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'private-admin'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    bucket_id = 'private-admin'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated users can delete private admin files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'private-admin'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );
