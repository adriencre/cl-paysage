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

-- Insertion des paramètres initiaux si non existants
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

-- 3. Activation de la sécurité RLS avec lecture publique
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique (tout le monde peut voir les paramètres et projets publiés)
CREATE POLICY "Lecture publique settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique projects" ON projects
  FOR SELECT USING (true);

-- Politiques d'écriture avec la clé anon (ou service)
CREATE POLICY "Écriture settings" ON settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Écriture projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Bucket de stockage pour les photos (Hero, Logo, Projets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politique d'accès au bucket photos
CREATE POLICY "Photos publiques" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Update photos" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Delete photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos');
