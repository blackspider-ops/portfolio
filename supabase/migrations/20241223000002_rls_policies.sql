-- Migration: Row Level Security Policies
-- Requirements: 22.1-22.4

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (anonymous users)
-- Requirement 22.2: Allow anonymous users SELECT only where status equals 'published'
-- ============================================

-- Public can read published projects only
CREATE POLICY "Public can read published projects"
  ON projects FOR SELECT
  TO anon
  USING (status = 'published');

-- Public can read published blog posts only
CREATE POLICY "Public can read published blog posts"
  ON blog_posts FOR SELECT
  TO anon
  USING (status = 'published');

-- Public can read site settings (singleton, always public)
CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  TO anon
  USING (true);

-- Public can read published pages only
CREATE POLICY "Public can read published pages"
  ON pages FOR SELECT
  TO anon
  USING (status = 'published');

-- Public can read redirects (needed for redirect resolution)
CREATE POLICY "Public can read redirects"
  ON redirects FOR SELECT
  TO anon
  USING (true);

-- Public can read public assets
CREATE POLICY "Public can read assets"
  ON assets FOR SELECT
  TO anon
  USING (bucket = 'public-images' OR bucket = 'resume');

-- ============================================
-- AUTHENTICATED USER POLICIES (editors/admins)
-- Requirement 22.3: Allow authenticated editor/admin users full CRUD based on role
-- ============================================

-- Editors/Admins can read ALL projects (including drafts)
CREATE POLICY "Authenticated can read all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can insert projects
CREATE POLICY "Authenticated can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can update projects
CREATE POLICY "Authenticated can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can delete projects
CREATE POLICY "Authenticated can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Same pattern for blog_posts
CREATE POLICY "Authenticated can read all blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can insert blog posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can update blog posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can delete blog posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Same pattern for pages
CREATE POLICY "Authenticated can read all pages"
  ON pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can insert pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can update pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can manage redirects
CREATE POLICY "Authenticated can manage redirects"
  ON redirects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Editors/Admins can manage assets
CREATE POLICY "Authenticated can manage assets"
  ON assets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- ============================================
-- ADMIN-ONLY POLICIES
-- ============================================

-- Only admins can modify site settings
CREATE POLICY "Admins can modify site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- AUDIT LOG (service role only for writes)
-- ============================================

-- Admins can read audit log
CREATE POLICY "Admins can read audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- No INSERT/UPDATE/DELETE policies for audit_log from client
-- Audit log writes happen via service role in server actions

-- ============================================
-- USER ROLES (admin-only management)
-- ============================================

CREATE POLICY "Admins can read user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- CONTENT REVISIONS (editors/admins can manage)
-- ============================================

CREATE POLICY "Authenticated can read revisions"
  ON content_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Authenticated can create revisions"
  ON content_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- ============================================
-- PREVIEW TOKENS
-- ============================================

-- Editors/Admins can manage preview tokens
CREATE POLICY "Authenticated can manage preview tokens"
  ON preview_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Public can validate tokens (for preview route)
CREATE POLICY "Public can validate preview tokens"
  ON preview_tokens FOR SELECT
  TO anon
  USING (expires_at > NOW());

-- ============================================
-- CONTACT MESSAGES
-- ============================================

-- Admins can read contact messages
CREATE POLICY "Admins can read contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update contact messages (mark as read)
CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Contact form submissions via service role (no client insert policy)
