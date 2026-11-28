-- Video Management: a publish date next to the editing date (posted_on). Safe to run more than once.
ALTER TABLE videos ADD COLUMN IF NOT EXISTS publish_date DATE;
NOTIFY pgrst, 'reload schema';
