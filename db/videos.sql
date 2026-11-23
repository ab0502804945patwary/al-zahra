-- ============================================
-- MIGRATION: Video Management (social media videos: who posted what, on which channel and platform)
-- Anyone with the "videos" module (and admins) can read, add and change. Delete only through
-- /api/delete (master password), like everything else.
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  posted_on DATE NOT NULL DEFAULT CURRENT_DATE,
  posted_time TIME,
  channel_name TEXT,
  platform TEXT NOT NULL,
  employee_name TEXT,
  video_creator TEXT,
  url TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS videos_posted_idx ON videos (posted_on DESC);
CREATE INDEX IF NOT EXISTS videos_employee_idx ON videos (employee_name);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS videos_select ON videos;
DROP POLICY IF EXISTS videos_insert ON videos;
DROP POLICY IF EXISTS videos_update ON videos;
CREATE POLICY videos_select ON videos FOR SELECT USING (user_has_module('videos'));
CREATE POLICY videos_insert ON videos FOR INSERT WITH CHECK (user_has_module('videos'));
CREATE POLICY videos_update ON videos FOR UPDATE USING (user_has_module('videos')) WITH CHECK (user_has_module('videos'));
