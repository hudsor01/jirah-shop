-- Jirah Shop — Seed Data
-- Sample products, blog posts, and coupons for development
-- Uses high-resolution Unsplash images (w=1200, q=80)

-- ═══════════════════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════════════════

INSERT INTO public.products (name, slug, description, short_description, price, compare_at_price, category, brand, is_own_brand, images, ingredients, how_to_use, tags, stock_quantity, is_featured, is_active) VALUES

-- SKINCARE
('Rose Glow Hydrating Serum', 'rose-glow-hydrating-serum',
 '<p>Our signature hydrating serum infused with damask rose extract and hyaluronic acid. This lightweight formula absorbs quickly, leaving skin plump, dewy, and radiant.</p><p>Formulated with 3 molecular weights of hyaluronic acid for deep hydration at every layer of the skin.</p>',
 'Lightweight hydrating serum with damask rose extract and triple hyaluronic acid for all-day dewy radiance.',
 38.00, 48.00, 'skincare', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1570194065650-d99fb4ee09b1?w=1200&q=80&fit=crop'
 ],
 'Water, Hyaluronic Acid, Rosa Damascena Extract, Niacinamide, Glycerin, Panthenol',
 'Apply 2-3 drops to clean, damp skin morning and night. Follow with moisturizer.',
 ARRAY['hydrating', 'k-beauty', 'vegan', 'best-seller'], 150, true, true),

('Brightening Rice Water Toner', 'brightening-rice-water-toner',
 '<p>A gentle, alcohol-free toner made with fermented rice water — a centuries-old Asian beauty secret. Brightens, softens, and preps your skin for the next steps in your routine.</p>',
 'Alcohol-free fermented rice water toner for brightening and softening.',
 24.00, NULL, 'skincare', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&q=80&fit=crop'
 ],
 'Fermented Rice Water, Sake Lees Extract, Glycerin, Allantoin, Centella Asiatica',
 'Soak a cotton pad and gently swipe across face after cleansing. Can also be patted in by hand.',
 ARRAY['brightening', 'k-beauty', 'cruelty-free', 'alcohol-free'], 200, true, true),

('Green Tea Cleansing Oil', 'green-tea-cleansing-oil',
 '<p>Melt away sunscreen, makeup, and impurities with this silky cleansing oil enriched with Jeju green tea. Emulsifies with water for a clean rinse — no residue.</p>',
 'Silky green tea cleansing oil that melts makeup and sunscreen effortlessly.',
 28.00, NULL, 'skincare', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80&fit=crop'
 ],
 'Camellia Sinensis (Green Tea) Seed Oil, Jojoba Oil, Vitamin E, Squalane',
 'Apply 2-3 pumps to dry face. Massage gently, add water to emulsify, then rinse.',
 ARRAY['cleansing', 'k-beauty', 'vegan'], 120, false, true),

('Centella Cica Repair Cream', 'centella-cica-repair-cream',
 '<p>A soothing barrier repair cream with 70% Centella Asiatica extract. Calms redness, strengthens the skin barrier, and provides lasting hydration without heaviness.</p>',
 'Soothing barrier repair cream with 70% Centella Asiatica for sensitive skin.',
 32.00, 42.00, 'skincare', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1200&q=80&fit=crop'
 ],
 'Centella Asiatica Extract (70%), Madecassoside, Ceramide NP, Shea Butter, Allantoin',
 'Apply as the last step of your skincare routine. Use morning and night.',
 ARRAY['soothing', 'sensitive-skin', 'k-beauty', 'barrier-repair'], 180, true, true),

('Vitamin C Brightening Ampoule', 'vitamin-c-brightening-ampoule',
 '<p>A potent yet gentle vitamin C ampoule that targets dark spots, uneven tone, and dullness. Stabilized ascorbic acid formula ensures maximum efficacy without irritation.</p>',
 'Potent stabilized vitamin C ampoule for dark spots and luminous, even-toned skin.',
 42.00, 52.00, 'skincare', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1617897903246-719242758050?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&q=80&fit=crop'
 ],
 'Ascorbic Acid (15%), Ferulic Acid, Vitamin E, Hyaluronic Acid, Niacinamide',
 'Apply 3-4 drops to clean skin in the morning before moisturizer and sunscreen.',
 ARRAY['vitamin-c', 'brightening', 'anti-aging', 'k-beauty'], 95, true, true),

-- MAKEUP
('Velvet Lip Tint — Rosewood', 'velvet-lip-tint-rosewood',
 '<p>A long-wearing, buildable lip tint in a sophisticated rosewood shade. Lightweight mousse texture that sets to a velvety matte finish.</p>',
 'Buildable mousse lip tint in elegant rosewood with a velvety matte finish.',
 18.00, NULL, 'makeup', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80&fit=crop'
 ],
 'Water, Dimethicone, Cyclopentasiloxane, CI 15850, Vitamin E',
 'Apply directly from the applicator. Build for more intensity. Blot for a gradient lip.',
 ARRAY['lip-tint', 'k-beauty', 'long-wearing', 'cruelty-free'], 250, true, true),

('Dewy Cushion Foundation — Fair', 'dewy-cushion-foundation-fair',
 '<p>A buildable, dewy-finish cushion foundation with SPF 50+ PA+++. Infused with hyaluronic acid and centella for skincare benefits while you wear it.</p>',
 'Dewy cushion foundation SPF 50+ with skincare benefits. Shade: Fair.',
 34.00, NULL, 'makeup', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1631214500115-598fc2cb8ada?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200&q=80&fit=crop'
 ],
 'Water, Titanium Dioxide, Hyaluronic Acid, Centella Asiatica, Niacinamide',
 'Press puff into cushion and tap onto skin. Build coverage as desired.',
 ARRAY['foundation', 'k-beauty', 'spf', 'dewy'], 100, false, true),

-- HAIR
('Camellia Hair Oil', 'camellia-hair-oil',
 '<p>A lightweight, non-greasy hair oil made from cold-pressed camellia japonica seeds — the same oil used by Japanese geisha for centuries. Smooths frizz and adds brilliant shine.</p>',
 'Lightweight camellia oil for frizz control and brilliant shine — a Japanese beauty secret.',
 26.00, NULL, 'hair', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1200&q=80&fit=crop'
 ],
 'Camellia Japonica Seed Oil, Squalane, Vitamin E, Rose Hip Oil',
 'Apply 2-3 drops to damp or dry hair, focusing on mid-lengths and ends.',
 ARRAY['hair-oil', 'j-beauty', 'frizz-control', 'vegan'], 90, true, true),

-- BODY
('Yuzu & Honey Body Butter', 'yuzu-honey-body-butter',
 '<p>A rich, whipped body butter with Japanese yuzu citrus and raw honey. Deeply nourishes dry skin while leaving a subtle, uplifting citrus scent.</p>',
 'Whipped body butter with Japanese yuzu and raw honey for deep nourishment.',
 22.00, NULL, 'body', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1570194065650-d99fb4ee09b1?w=1200&q=80&fit=crop'
 ],
 'Shea Butter, Coconut Oil, Yuzu Extract, Raw Honey, Jojoba Oil, Vitamin E',
 'Apply generously to clean, damp skin after bathing.',
 ARRAY['body-care', 'j-beauty', 'nourishing', 'cruelty-free'], 140, false, true),

-- TOOLS
('Jade Gua Sha Facial Tool', 'jade-gua-sha-facial-tool',
 '<p>Hand-carved from genuine Xiuyan jade. This traditional Chinese beauty tool promotes lymphatic drainage, reduces puffiness, and sculpts facial contours naturally.</p>',
 'Genuine Xiuyan jade gua sha tool for facial sculpting and lymphatic drainage.',
 28.00, 35.00, 'tools', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1200&q=80&fit=crop'
 ],
 NULL, 'Apply facial oil or serum first. Gently scrape along jawline, cheekbones, and forehead in upward strokes. Use 2-3 times per week.',
 ARRAY['gua-sha', 'facial-tool', 'traditional', 'best-seller'], 75, true, true),

('Rose Quartz Face Roller', 'rose-quartz-face-roller',
 '<p>A dual-ended rose quartz roller — large roller for cheeks, forehead, and neck; small roller for under-eyes and around the nose. Cool to the touch for a soothing ritual.</p>',
 'Dual-ended rose quartz roller for facial massage and de-puffing.',
 24.00, NULL, 'tools', 'Jirah', true,
 ARRAY[
   'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=1200&q=80&fit=crop'
 ],
 NULL, 'Store in fridge for extra cooling effect. Roll upward and outward after applying serum.',
 ARRAY['face-roller', 'crystal', 'de-puffing'], 85, false, true),

-- CURATED (non own-brand)
('COSRX Snail Mucin Essence', 'cosrx-snail-mucin-essence',
 '<p>The cult-favorite essence with 96.3% snail secretion filtrate. Repairs, hydrates, and gives skin a healthy, glass-skin glow. A K-beauty essential.</p>',
 'Cult-favorite 96.3% snail mucin essence for repair and glass-skin glow.',
 21.00, 25.00, 'skincare', 'COSRX', false,
 ARRAY[
   'https://images.unsplash.com/photo-1570194065650-d99fb4ee09b1?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&q=80&fit=crop'
 ],
 'Snail Secretion Filtrate (96.3%), Betaine, Sodium Hyaluronate, Panthenol',
 'After toner, dispense 2-3 pumps and pat gently into skin.',
 ARRAY['snail-mucin', 'k-beauty', 'glass-skin', 'best-seller'], 300, true, true),

('Laneige Lip Sleeping Mask', 'laneige-lip-sleeping-mask',
 '<p>Wake up to soft, smooth lips with this overnight lip treatment infused with berry extracts and vitamin C. The original K-beauty lip mask.</p>',
 'Overnight berry lip mask for soft, smooth lips by morning.',
 22.00, NULL, 'skincare', 'Laneige', false,
 ARRAY[
   'https://images.unsplash.com/photo-1631214503930-2e89151c17d0?w=1200&q=80&fit=crop',
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80&fit=crop'
 ],
 'Berry Complex, Vitamin C, Hyaluronic Acid, Shea Butter, Coconut Oil',
 'Apply a generous layer to lips before bed. Gently wipe off excess in the morning.',
 ARRAY['lip-care', 'k-beauty', 'overnight', 'best-seller'], 200, false, true);


-- ═══════════════════════════════════════════════════════
-- BLOG POSTS
-- ═══════════════════════════════════════════════════════

INSERT INTO public.blog_posts (title, slug, content, excerpt, cover_image, tags, is_published, published_at) VALUES

('The 10-Step Korean Skincare Routine, Simplified',
 'korean-skincare-routine-simplified',
 '<h2>Why Korean Skincare?</h2><p>Korean skincare (K-beauty) emphasizes prevention, hydration, and gentle ingredients over harsh treatments. The famous 10-step routine might sound overwhelming, but it is really about layering lightweight products from thinnest to thickest.</p><h2>The Essential Steps</h2><ol><li><strong>Oil Cleanser</strong> — Removes sunscreen and makeup</li><li><strong>Water Cleanser</strong> — Removes remaining impurities</li><li><strong>Toner</strong> — Balances pH and preps skin</li><li><strong>Essence</strong> — The heart of K-beauty, deeply hydrating</li><li><strong>Serum</strong> — Targeted treatment for your concerns</li><li><strong>Moisturizer</strong> — Locks everything in</li><li><strong>Sunscreen (AM)</strong> — Non-negotiable protection</li></ol><h2>Start Simple</h2><p>You do not need all 10 steps on day one. Start with cleanser, moisturizer, and sunscreen — then add products as you learn what your skin loves.</p>',
 'K-beauty does not have to be complicated. Here is how to build your own Korean skincare routine, step by step.',
 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1600&q=80&fit=crop',
 ARRAY['skincare', 'k-beauty', 'routine', 'beginner'],
 true, now() - interval '3 days'),

('Ingredient Spotlight: Why Centella Asiatica Is Everywhere',
 'ingredient-spotlight-centella-asiatica',
 '<h2>The Ancient Herb That Went Viral</h2><p>Centella Asiatica (also called Cica, Tiger Grass, or Gotu Kola) has been used in traditional Asian medicine for centuries. Now it is one of the most popular ingredients in modern K-beauty products — and for good reason.</p><h2>Benefits for Your Skin</h2><ul><li><strong>Soothes irritation</strong> — Calms redness, sensitivity, and post-procedure skin</li><li><strong>Strengthens barrier</strong> — Boosts ceramide production for a stronger moisture barrier</li><li><strong>Anti-aging</strong> — Stimulates collagen synthesis for firmer skin</li><li><strong>Healing</strong> — Accelerates wound healing and reduces scarring</li></ul><h2>How to Use It</h2><p>Look for it in serums, moisturizers, and sheet masks. Our Centella Cica Repair Cream contains 70% Centella extract for maximum soothing power.</p>',
 'From Tiger Grass to trending ingredient — discover why Centella Asiatica is the soothing powerhouse your skin needs.',
 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=1600&q=80&fit=crop',
 ARRAY['ingredients', 'centella', 'skincare-science', 'soothing'],
 true, now() - interval '7 days'),

('Glass Skin: The Ultimate K-Beauty Goal',
 'glass-skin-ultimate-k-beauty-goal',
 '<h2>What Is Glass Skin?</h2><p>Glass skin refers to skin so smooth, clear, and luminous that it looks like glass. It is the ultimate expression of healthy, well-hydrated skin — a hallmark of Korean beauty philosophy.</p><h2>How to Achieve It</h2><p>Glass skin is not about one magic product. It is about consistent hydration layering:</p><ol><li>Start with a gentle, hydrating cleanser</li><li>Layer a hydrating toner (try our Rice Water Toner)</li><li>Apply an essence with snail mucin or hyaluronic acid</li><li>Follow with a hydrating serum (our Rose Glow Serum is perfect)</li><li>Seal with a lightweight moisturizer</li><li>Finish with SPF in the morning</li></ol><p>The key is patience — glass skin comes from weeks of consistent hydration, not overnight miracles.</p>',
 'Learn the layering technique behind the coveted glass skin look, plus the products that actually deliver results.',
 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1600&q=80&fit=crop',
 ARRAY['glass-skin', 'k-beauty', 'hydration', 'tutorial'],
 true, now() - interval '14 days');


-- ═══════════════════════════════════════════════════════
-- COUPONS
-- ═══════════════════════════════════════════════════════

INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at) VALUES
('WELCOME10', 'percentage', 10, 30, 1000, true, now() + interval '90 days'),
('BEAUTY20', 'percentage', 20, 50, 500, true, now() + interval '30 days'),
('FREESHIP', 'fixed_amount', 5.99, 25, NULL, true, now() + interval '60 days');


-- ═══════════════════════════════════════════════════════
-- SHOP SETTINGS
-- ═══════════════════════════════════════════════════════

INSERT INTO public.shop_settings (shipping_cost, free_shipping_threshold, allowed_shipping_countries)
VALUES (5.99, 50.00, ARRAY['US', 'CA', 'GB', 'AU']);
