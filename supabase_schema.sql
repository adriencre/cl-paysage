-- =======================================================
-- SCHEMA SUPABASE POUR CL PAYSAGE
-- À copier-coller dans l'onglet "SQL Editor" de Supabase
-- =======================================================

-- 1. Table des Paramètres du site
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des paramètres initiaux
INSERT INTO settings (id, data)
VALUES (
  1,
  '{
    "branding": {
      "brandName": "CL",
      "brandAccent": "Paysage",
      "brandSub": "Paysagiste Concepteur",
      "logoUrl": "/images/logo.png"
    },
    "hero": {
      "bgImage": "/images/hero.jpg",
      "tagline": "Atelier de paysage · Conception & Réalisation",
      "titleLine1": "L''art de façonner",
      "titleLine2": "vos espaces extérieurs",
      "description": "Conception sur-mesure, aménagement végétal et harmonie des matières. Nous donnons vie à des jardins d''exception, pensés pour durer et évoluer au fil des saisons.",
      "buttonText": "Regarder les réalisations"
    },
    "phone": "06 00 00 00 00",
    "email": "contact@clpaysage.fr",
    "address": "Région et alentours",
    "hours": "Lun – Ven : 8h – 18h\nSam : sur rendez-vous",
    "socialLinks": {
      "instagram": "",
      "facebook": "",
      "pinterest": "",
      "tiktok": ""
    },
    "siteDescription": "Conception et aménagement de jardins d''exception. Nous transformons vos extérieurs en espaces de vie uniques."
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

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
