-- ============================================
-- MIGRATION: the work categories ticked on the Company Register form.
-- selected_phases lists the optional phases this company needs (stage ids: 9 Bangladesh Company, 10 Foreign Mother,
-- 3 = 1 Foreign Subsidiary, 11 = 2 Foreign Subsidiary). Work goes only to the ticked ones.
-- NULL = older company that was registered before this form: the earlier rules still apply.
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS selected_phases TEXT[];
