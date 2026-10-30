-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — USERS, CUSTOMERS & ADMIN ACCESS RECOVERY MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azibnvfxnsrocmobzswt/sql
-- ==============================================================================

-- 1. Ensure columns exist on public.customers
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS customer_id TEXT,
    ADD COLUMN IF NOT EXISTS auth_user_id UUID,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS interest TEXT DEFAULT 'Precious Metals & Rare Coins',
    ADD COLUMN IF NOT EXISTS total_spent NUMERIC(14,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS orders_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Ensure columns exist on public.admin_users
ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Super Admin',
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Senior Numismatist & Vault Director',
    ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Bigfork Storefront & Vault, MT',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS last_login TEXT DEFAULT 'Just now',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Configure Row Level Security (RLS) on public.customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Clean legacy policies on customers
DROP POLICY IF EXISTS "Staff Full Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Public Insert Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Read Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Update Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Staff Delete Customers" ON public.customers;
DROP POLICY IF EXISTS "Allow All Customers" ON public.customers;

-- Enable full read/write access for admin dashboard and storefront
CREATE POLICY "Allow All Customers" ON public.customers
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Configure Row Level Security (RLS) on public.admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Clean legacy policies on admin_users
DROP POLICY IF EXISTS "Staff Full Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow All Admin Users" ON public.admin_users;

-- Enable full read/write access for admin dashboard (including toggling suspended status)
CREATE POLICY "Allow All Admin Users" ON public.admin_users
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Grant explicit table privileges
GRANT ALL ON public.customers TO anon, authenticated, service_role;
GRANT ALL ON public.admin_users TO anon, authenticated, service_role;

-- 6. Seed initial customers if the database table is currently empty
INSERT INTO public.customers (id, customer_id, full_name, email, phone, city, state, interest, total_spent, orders_count, account_status, notes, created_at)
VALUES
    ('cust-001', 'CUST-1001', 'William Sterling', 'w.sterling@bigforkcapital.com', '(406) 883-2210', 'Bigfork', 'MT', 'Gold & High Relief Proofs', 9700.00, 2, 'Active', 'Prefers direct wire settlements. Interested in pre-1933 $20 Saint-Gaudens.', '2026-09-14T08:30:00Z'),
    ('cust-002', 'CUST-1002', 'James Thornton', 'j.thornton@montanaranch.com', '(406) 755-4300', 'Kalispell', 'MT', 'Morgan Silver Dollars (GSA / CC)', 3350.00, 1, 'Active', 'Carson City hoard collector. Looking for uncirculated 1885-CC Morgan lots.', '2026-09-22T14:15:00Z'),
    ('cust-003', 'CUST-1003', 'Thomas MacGregor', 't.macgregor@flatheadvalley.org', '(406) 862-1190', 'Whitefish', 'MT', 'Silver Stacker & Bullion', 442.75, 1, 'Active', 'Regular local pickup at Bigfork armory. Prefers Scottsdale 10 oz cast bars.', '2026-10-02T11:00:00Z'),
    ('cust-004', 'CUST-1004', 'Eleanor Vance', 'e.vance@yellowstonellc.com', '(406) 587-9200', 'Bozeman', 'MT', 'Numismatic Rarities & Gold Patterns', 18250.00, 4, 'Active', 'High-net-worth bullion allocator. Immediate wire release upon invoice transmission.', '2026-08-10T16:45:00Z'),
    ('cust-005', 'CUST-1005', 'Marcus Sterling', 'm.sterling@sterlingholdings.com', '(406) 257-8900', 'Polson', 'MT', 'Ancient & Biblical Silver', 1250.00, 1, 'Active', 'Specializes in Athenian Owls and Roman Denarii. Requested private vault review.', '2026-10-15T09:20:00Z'),
    ('cust-006', 'CUST-1006', 'Robert Chen', 'r.chen@bouldergold.com', '(303) 441-3200', 'Boulder', 'CO', 'Pre-1933 US Gold Coinage', 7200.00, 2, 'Active', 'Collector of Indian Head Eagles & Saint-Gaudens Double Eagles in MS-63+.', '2026-09-28T13:10:00Z'),
    ('cust-007', 'CUST-1007', 'Sarah Jenkins', 's.jenkins@bigskyassociates.com', '(406) 995-4500', 'Big Sky', 'MT', 'Modern Proof Gold Eagles', 4600.00, 1, 'Active', 'Corporate gifting allocator. Prefers West Point mintmark 1 oz proof lots.', '2026-10-18T10:30:00Z'),
    ('cust-008', 'CUST-1008', 'David O''Connor', 'd.oconnor@helenawealth.com', '(406) 442-8800', 'Helena', 'MT', 'Silver Rounds & Fractional Bullion', 890.00, 2, 'Active', 'Physical delivery to depository box. Prefers tamper-evident assay cards.', '2026-10-24T15:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed initial admin staff members if empty
INSERT INTO public.admin_users (id, name, email, role, title, location, status, two_factor_enabled, last_login, created_at)
VALUES
    ('adm-001', 'Saurabh Kumar Yadav', 'saurabhyadav739888@gmail.com', 'Super Admin', 'Senior Numismatist & Vault Director', 'Bigfork Storefront & Vault, MT', 'Active', true, 'Just now', '2026-01-10T00:00:00Z'),
    ('adm-002', 'Elena Rostova', 'elena.rostova@highlandergoldsilver.com', 'Inventory Manager', 'Numismatic Catalog & Authentication Officer', 'Flathead Armory Logistics, MT', 'Active', true, '2 hours ago', '2026-02-01T00:00:00Z'),
    ('adm-003', 'Marcus Vance', 'marcus.vance@highlandergoldsilver.com', 'Order Manager', 'Treasury & Bank Wire Settlement Officer', 'Bigfork Storefront & Vault, MT', 'Active', true, 'Yesterday', '2026-03-15T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

