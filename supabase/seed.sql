-- ==============================================================================
-- HIGHLANDER GOLD & SILVER — INITIAL DATA SEED SCRIPT
-- Location: 119 Jewel Basin Ct. B3, Bigfork, MT 59911
-- Website: https://highlander-goldandsilver.vercel.app/
-- ==============================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, slug, description, metal_type, display_order, is_active) VALUES
('cat-001', 'Gold', 'gold', 'Premier sovereign gold coinage, ultra high relief patterns, and investment-grade gold bullion specimens.', 'Gold', 1, true),
('cat-002', 'Morgan Dollars', 'morgan-dollars', 'Classic 1878–1921 Morgan silver dollars featuring certified gem uncirculated and prooflike strikes.', 'Silver', 2, true),
('cat-003', 'Commemorative', 'commemorative', 'Historical US silver and gold commemoratives struck by the United States Mint celebrating American milestones.', 'Silver', 3, true),
('cat-004', 'Silver Bullion', 'silver-bullion', 'Physical .999 and .9999 pure silver bullion bars, precision stackers, and government-minted rounds.', 'Silver', 4, true),
('cat-005', 'Ancient', 'ancient', 'Classical antiquity coinage from the Mediterranean, Greek city-states, and Imperial Rome.', 'Mixed', 5, true)
ON CONFLICT (name) DO UPDATE SET 
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    metal_type = EXCLUDED.metal_type,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- 2. SEED INVENTORY LOTS
INSERT INTO public.inventory (
    id, lot_number, sku, title, lead, description, category, metal, coin_type, year, country_mint, 
    denomination, weight, weight_troy_oz, purity, fineness, grade, cert_company, cert_number, 
    special_features, mintage, price, inventory, stock_quantity, stock_status, storefront_status, 
    status, show_on_storefront, is_featured, estimate_range, payment_note, featured_image, additional_images
) VALUES
(
    'item-001', '1', 'HGS-GOLD-001', 
    '1876 George T. Morgan Proposed $100 Gold Union™', 
    '1876 Private Issue George T. Morgan Ultra High Relief Gold Union .999 Gem Proof', 
    '1876 Private Issue George T. Morgan Ultra High Relief Gold Union .999 Pure Gold Ultra Cameo Gem Proof. Only 999 units minted worldwide, making this a premier collector trophy. Struck in solid 1 Troy Ounce .999 fine gold with mirror-deep fields and frosted high relief devices.', 
    'Gold', 'Gold', 'Private Issue Gold Pattern', '1876', 'Private Issue / Philadelphia Die', 
    '$100 Proposed Gold Union', '1.0000 Troy Oz (31.10g)', 1.0000, '.999 Pure Gold', 0.9990, 
    'NGC Ultra Cameo Gem Proof', 'NGC', '639102-001', 
    'Ultra High Relief, Deep Mirror Cameo, Numbered Edge', '999 Units Worldwide', 
    4850.00, 1, 1, 'In Stock', 'Active', 'Available', true, true, 
    '$4,250.00 – $5,700.00 USD', 'High-value acquisition: Direct bank wire payment preferred with HGS wire credit applied on settlement.', 
    '/assets/items/lot1_morgan_gold_gem.jpg', '["/assets/items/lot1_morgan_gold_gem.jpg", "/assets/items/lot1_morgan_gold_rev.jpg"]'::jsonb
),
(
    'item-153', '153', 'HGS-MORG-153', 
    '1897 Morgan Silver Dollar MS-65 PL (Prooflike)', 
    '1897 Morgan Silver Dollar MS-65 PL with Cartwheel Luster & Toned Rim', 
    '1897 Morgan Silver Dollar graded MS-65 Prooflike (PL) by PCI. Exceptional mirrored fields with frosted cartwheel devices on Lady Liberty, complemented by delicate iridescent toning along the rim denticles. Hand-picked for superior eye appeal.', 
    'Morgan Dollars', 'Silver', 'Morgan Silver Dollar', '1897', 'US Mint / Philadelphia', 
    '$1.00 USD', '26.73 grams', 0.7734, '.900 Fine Silver (0.7734 oz ASW)', 0.9000, 
    'PCI MS-65 PL (Guaranteed Value)', 'PCI', 'PCI-8831920', 
    'Prooflike (PL) Mirrored Fields, Peripheral Rim Toning', '2,822,000', 
    1450.00, 1, 1, 'In Stock', 'Active', 'Available', true, true, 
    '$630.00 – $3,250.00 USD', 'Direct checkout via PayPal. Orders processed and dispatched within 24 hours.', 
    '/assets/items/lot153_morgan_1897_gem.jpg', '["/assets/items/lot153_morgan_1897_gem.jpg", "/assets/items/lot153_morgan_1897_rev.jpg"]'::jsonb
),
(
    'item-009', '9', 'HGS-COMM-009', 
    '1921 Pilgrim Tercentenary 50¢ Silver Commemorative MS-65', 
    '1921 Pilgrim 50C Tercentenary Silver Coin MS-65 NGC Mint Certified', 
    'Issued to commemorate the 300th anniversary of the landing of the Pilgrims at Plymouth Rock. Graded MS-65 by NGC with superb original skin and crisp satiny luster across Governor William Bradford and the Mayflower.', 
    'Commemorative', 'Silver', 'Early US Commemorative Half Dollar', '1921', 'US Mint / Philadelphia', 
    '50 Cents (Half Dollar)', '12.50 grams', 0.3617, '.900 Silver (0.3617 oz ASW)', 0.9000, 
    'NGC MS-65', 'NGC', 'NGC-4882190', 
    'Crisp Die Strike, Original Satiny Luster', '20,053 Distributed', 
    1250.00, 1, 1, 'In Stock', 'Active', 'Available', true, false, 
    '$1,100.00 – $1,650.00 USD', 'Standard FedEx insured shipping included.', 
    '/assets/items/lot9_pilgrim_1921_obv.jpg', '["/assets/items/lot9_pilgrim_1921_obv.jpg", "/assets/items/lot9_pilgrim_1921_rev.jpg"]'::jsonb
),
(
    'item-010', '10', 'HGS-SILV-010', 
    'Scottsdale 10 oz .999 Fine Silver Cast Stacker® Bar', 
    'Precision-engineered interlocking 10 Troy Ounce .999 pure silver stacker bar', 
    'Hallmarked by Scottsdale Mint. Features beveled interlocking edges engineered for secure vault stacking. Laser-etched serial number and anti-counterfeiting swirl finish on the reverse.', 
    'Silver Bullion', 'Silver', 'Interlocking Stacker Bullion Bar', 'Contemporary', 'Scottsdale Mint / USA', 
    '10 Troy Ounces Pure Silver', '10.0000 Troy Oz (311.03g)', 10.0000, '.999 Fine Silver', 0.9990, 
    'Mint Certified Gem Brilliant Uncirculated', 'Mint Certified', 'SM-STK-99218', 
    'Precision Interlocking Beveled Edges, Laser Serialized', 'Continuous Minting', 
    450.00, 1, 1, 'In Stock', 'Active', 'Available', true, true, 
    '$420.00 – $510.00 USD', 'Immediate vault dispatch upon settlement confirmation.', 
    '/assets/items/scottsdale_10oz_stacker.jpg', '["/assets/items/scottsdale_10oz_stacker.jpg"]'::jsonb
),
(
    'item-011', '11', 'HGS-GOLD-011', 
    '1924 $20 Saint-Gaudens Double Eagle MS-64 NGC', 
    '1924 $20 St. Gaudens Gold Double Eagle MS-64 with Vibrant Orange-Peel Luster', 
    'Designed by Augustus Saint-Gaudens, widely acclaimed as the most beautiful coin in American history. Graded Mint State 64 by NGC, showing bold cartwheel luster across Lady Liberty striding before the Capitol dawn.', 
    'Gold', 'Gold', 'Saint-Gaudens Double Eagle', '1924', 'US Mint / Philadelphia', 
    '$20.00 USD', '33.436 grams', 0.9675, '.900 Fine Gold (0.9675 oz AGW)', 0.9000, 
    'NGC MS-64', 'NGC', 'NGC-7119283-004', 
    'Bold High Relief Luster, Vibrant Golden Fields', '4,323,500', 
    3250.00, 1, 1, 'In Stock', 'Active', 'Available', true, true, 
    '$2,950.00 – $3,600.00 USD', 'Bank wire transfer preferred. Vault pickup available in Bigfork by appointment.', 
    '/assets/items/saint_gaudens_1924_ms64.jpg', '["/assets/items/saint_gaudens_1924_ms64.jpg"]'::jsonb
)
ON CONFLICT (lot_number) DO UPDATE SET 
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    status = EXCLUDED.status,
    storefront_status = EXCLUDED.storefront_status;

-- 3. SEED COLLECTOR CUSTOMERS
INSERT INTO public.customers (id, customer_id, full_name, email, phone, city, state, interest, total_spent, orders_count, account_status, tier, notes) VALUES
('cust-001', 'CUST-1001', 'William Sterling', 'w.sterling@bigforkcapital.com', '(406) 837-2201', 'Bigfork', 'MT', 'Morgan Dollars & Pre-1933 Gold', 5577.50, 1, 'Active', 'VIP Vault', 'Prefers bank wire settlement directly with Bigfork 1st National Bank.'),
('cust-002', 'CUST-1002', 'Eleanor Vance', 'evance.curator@montana.edu', '(406) 994-3112', 'Bozeman', 'MT', 'Early US Commemorative Coinage', 1437.50, 1, 'Active', 'Collector', 'University curator and verified Morgan numismatist.')
ON CONFLICT (email) DO NOTHING;
