-- Create storage bucket for tech logos
INSERT INTO storage.buckets (id, name, public, created_at, updated_at) 
VALUES ('tech-logos', 'tech-logos', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'tech-logos');

-- Allow authenticated uploads (you can modify this based on your auth setup)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tech-logos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'tech-logos');

-- Update the existing tech_logos table to ensure it has the right structure
ALTER TABLE tech_logos 
ADD COLUMN IF NOT EXISTS related_company_id INTEGER REFERENCES tech_logos(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tech_logos_updated_at 
BEFORE UPDATE ON tech_logos 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();