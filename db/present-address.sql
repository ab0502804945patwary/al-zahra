-- Client present address: country and city picked from lists (the address line stays in client_present_address).
-- The old Province / State box on the company form is removed (the province column stays, unused).
ALTER TABLE companies ADD COLUMN IF NOT EXISTS present_country TEXT, ADD COLUMN IF NOT EXISTS present_city TEXT;
