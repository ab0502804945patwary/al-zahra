-- Video Management: the headline of each video. Safe to run more than once.
ALTER TABLE videos ADD COLUMN IF NOT EXISTS headline TEXT;
NOTIFY pgrst, 'reload schema';
