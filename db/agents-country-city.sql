-- Agents: Country and City dropdowns (the old Address / Location text is moved into City, as Saudi Arabia).
ALTER TABLE agents ADD COLUMN IF NOT EXISTS country TEXT, ADD COLUMN IF NOT EXISTS city TEXT;
UPDATE agents SET country = 'Saudi Arabia', city = address WHERE country IS NULL AND city IS NULL AND address IS NOT NULL AND address <> '';
