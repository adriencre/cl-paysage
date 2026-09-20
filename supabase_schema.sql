-- =======================================================
-- SCHEMA SUPABASE POUR CL PAYSAGE
-- À copier-coller dans l'onglet "SQL Editor" de Supabase
-- =======================================================

-- 1. Table des Paramètres du site (avec colonnes visibles et éditables directement dans Supabase)
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  phone TEXT DEFAULT '06 00 00 00 00',
  email TEXT DEFAULT 'contact@clpaysage.fr',
  address TEXT DEFAULT 'Région et alentours',
  hours TEXT DEFAULT 'Lun – Ven : 8h – 18h\nSam : sur rendez-vous',
  site_description TEXT DEFAULT 'Conception et aménagement de jardins d''exception. Nous transformons vos extérieurs en espaces de vie uniques.',
  hero_bg_image TEXT DEFAULT '/images/hero.jpg',
  hero_tagline TEXT DEFAULT 'Atelier de paysage · Conception & Réalisation',
  hero_title_line1 TEXT DEFAULT 'L''art de façonner',
  hero_title_line2 TEXT DEFAULT 'vos espaces extérieurs',
  hero_description TEXT DEFAULT 'Conception sur-mesure, aménagement végétal et harmonie des matières. Nous donnons vie à des jardins d''exception, pensés pour durer et évoluer au fil des saisons.',
  hero_button_text TEXT DEFAULT 'Regarder les réalisations',
  brand_name TEXT DEFAULT 'CL',
  brand_accent TEXT DEFAULT 'Paysage',
  brand_sub TEXT DEFAULT 'Paysagiste Concepteur',
  logo_url TEXT DEFAULT '/images/logo.png',
  social_links JSONB DEFAULT '{"instagram": "", "facebook": "", "pinterest": "", "tiktok": ""}'::jsonb,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la table existait déjà avec seulement "data", on ajoute toutes les colonnes manquantes
ALTER TABLE settings 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS hours TEXT,
  ADD COLUMN IF NOT EXISTS site_description TEXT,
  ADD COLUMN IF NOT EXISTS hero_bg_image TEXT,
  ADD COLUMN IF NOT EXISTS hero_tagline TEXT,
  ADD COLUMN IF NOT EXISTS hero_title_line1 TEXT,
  ADD COLUMN IF NOT EXISTS hero_title_line2 TEXT,
  ADD COLUMN IF NOT EXISTS hero_description TEXT,
  ADD COLUMN IF NOT EXISTS hero_button_text TEXT,
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS brand_accent TEXT,
  ADD COLUMN IF NOT EXISTS brand_sub TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Insertion ou mise à jour de la ligne 1 des paramètres (préserve l'image de fond si déjà uploadée)
INSERT INTO settings (
  id, phone, email, address, hours, site_description,
  hero_bg_image, hero_tagline, hero_title_line1, hero_title_line2, hero_description, hero_button_text,
  brand_name, brand_accent, brand_sub, logo_url, social_links
)
VALUES (
  1,
  '06 00 00 00 00',
  'contact@clpaysage.fr',
  'Région et alentours',
  E'Lun – Ven : 8h – 18h\nSam : sur rendez-vous',
  'Conception et aménagement de jardins d''exception. Nous transformons vos extérieurs en espaces de vie uniques.',
  COALESCE((SELECT (data->'hero'->>'bgImage') FROM settings WHERE id = 1), '/images/hero.jpg'),
  'Atelier de paysage · Conception & Réalisation',
  'L''art de façonner',
  'vos espaces extérieurs',
  'Conception sur-mesure, aménagement végétal et harmonie des matières. Nous donnons vie à des jardins d''exception, pensés pour durer et évoluer au fil des saisons.',
  'Regarder les réalisations',
  'CL',
  'Paysage',
  'Paysagiste Concepteur',
  '/images/logo.png',
  '{"instagram": "", "facebook": "", "pinterest": "", "tiktok": ""}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  phone = COALESCE(settings.phone, EXCLUDED.phone),
  email = COALESCE(settings.email, EXCLUDED.email),
  address = COALESCE(settings.address, EXCLUDED.address),
  hours = COALESCE(settings.hours, EXCLUDED.hours),
  site_description = COALESCE(settings.site_description, EXCLUDED.site_description),
  hero_bg_image = COALESCE(settings.hero_bg_image, (settings.data->'hero'->>'bgImage'), EXCLUDED.hero_bg_image),
  hero_tagline = COALESCE(settings.hero_tagline, EXCLUDED.hero_tagline),
  hero_title_line1 = COALESCE(settings.hero_title_line1, EXCLUDED.hero_title_line1),
  hero_title_line2 = COALESCE(settings.hero_title_line2, EXCLUDED.hero_title_line2),
  hero_description = COALESCE(settings.hero_description, EXCLUDED.hero_description),
  hero_button_text = COALESCE(settings.hero_button_text, EXCLUDED.hero_button_text),
  brand_name = COALESCE(settings.brand_name, EXCLUDED.brand_name),
  brand_accent = COALESCE(settings.brand_accent, EXCLUDED.brand_accent),
  brand_sub = COALESCE(settings.brand_sub, EXCLUDED.brand_sub),
  logo_url = COALESCE(settings.logo_url, EXCLUDED.logo_url),
  updated_at = NOW();

-- 2. Table des Projets / Réalisations
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'autre',
  location TEXT,
  date TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des 4 réalisations initiales
INSERT INTO projects (id, title, description, category, location, date, photos, social_links, published, created_at)
VALUES 
(
  'projet-1',
  'Jardin méditerranéen',
  'Aménagement complet d''un jardin méditerranéen avec terrasse en pierre naturelle, pergola végétalisée et plantations de lavande, romarin et oliviers. Un espace de vie extérieur pensé pour profiter du climat doux toute l''année.',
  'amenagement',
  'Région Sud',
  '2024-06',
  '[{"filename": "gallery-1.jpg", "isMain": true, "isStatic": true, "url": "/images/gallery-1.jpg"}, {"filename": "hero.jpg", "isMain": false, "isStatic": true, "url": "/images/hero.jpg"}]'::jsonb,
  '{"instagram": "", "facebook": "", "pinterest": "", "tiktok": ""}'::jsonb,
  true,
  '2024-06-15T10:00:00Z'
),
(
  'projet-2',
  'Jardin zen japonais',
  'Création d''un jardin d''inspiration japonaise avec pas japonais en pierre, bambous, mousse, érable du Japon et fontaine tsukubai. Un havre de paix et de méditation au cœur de la ville.',
  'jardin',
  'Région Centre',
  '2024-03',
  '[{"filename": "gallery-2.jpg", "isMain": true, "isStatic": true, "url": "/images/gallery-2.jpg"}]'::jsonb,
  '{"instagram": "", "facebook": "", "pinterest": "", "tiktok": ""}'::jsonb,
  true,
  '2024-03-20T10:00:00Z'
),
(
  'projet-3',
  'Aménagement contemporain',
  'Conception et réalisation d''un espace extérieur contemporain alliant lignes épurées, graminées ornementales et éclairage paysager. Terrasse en dalles grand format et mobilier design pour un rendu moderne et élégant.',
  'terrasse',
  'Région Ouest',
  '2024-01',
  '[{"filename": "gallery-3.jpg", "isMain": true, "isStatic": true, "url": "/images/gallery-3.jpg"}]'::jsonb,
  '{"instagram": "", "facebook": "", "pinterest": "", "tiktok": ""}'::jsonb,
  true,
  '2024-01-10T10:00:00Z'
),
(
  'projet-4',
  'Jardin fleuri et pelouse',
  'Création d''un jardin classique avec pelouse parfaite, massifs fleuris et haies taillées. Un jardin de charme avec pergola et éclairage d''ambiance pour les soirées d''été.',
  'jardin',
  'Région Nord',
  '2023-09',
  '[{"filename": "gallery-4.jpg", "isMain": true, "isStatic": true, "url": "/images/gallery-4.jpg"}]'::jsonb,
  '{"instagram": "", "facebook": "", "pinterest": "", "tiktok": ""}'::jsonb,
  true,
  '2023-09-05T10:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Sécurité RLS et Politiques d'accès globales
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout public settings" ON settings;
CREATE POLICY "Tout public settings" ON settings
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Tout public projects" ON projects;
CREATE POLICY "Tout public projects" ON projects
  FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Bucket de stockage pour les photos (Hero, Logo, Projets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Tout public storage photos" ON storage.objects;
CREATE POLICY "Tout public storage photos" ON storage.objects
  FOR ALL TO public USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');
