-- Create tech_logos table in Supabase
CREATE TABLE IF NOT EXISTS tech_logos (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  category VARCHAR(100), -- AI, Dev Tools, Cloud, Design, etc.
  is_company_logo BOOLEAN DEFAULT true,
  related_company_id INTEGER, -- Reference to parent company if this is a product
  tags TEXT[], -- Array of tags for flexible searching
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_tech_logos_company ON tech_logos(company_name);
CREATE INDEX IF NOT EXISTS idx_tech_logos_category ON tech_logos(category);
CREATE INDEX IF NOT EXISTS idx_tech_logos_tags ON tech_logos USING GIN(tags);

-- Add some sample categories and relationships
-- This will be populated by our processing script

-- Create a view for easy article integration
CREATE OR REPLACE VIEW article_logos AS
SELECT 
  id,
  company_name,
  image_name,
  image_url,
  category,
  is_company_logo,
  related_company_id,
  tags,
  -- Helper function to get related logos (company + product)
  CASE 
    WHEN related_company_id IS NOT NULL THEN 
      (SELECT company_name FROM tech_logos WHERE id = related_company_id)
    ELSE NULL
  END as parent_company
FROM tech_logos;

-- Function to get logos for article
CREATE OR REPLACE FUNCTION get_article_logos(topic_keywords TEXT[])
RETURNS TABLE (
  company_name VARCHAR(255),
  image_name VARCHAR(255),
  image_url TEXT,
  category VARCHAR(100),
  is_company_logo BOOLEAN,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tl.company_name,
    tl.image_name,
    tl.image_url,
    tl.category,
    tl.is_company_logo,
    -- Simple relevance scoring based on tag matches
    CASE 
      WHEN tl.tags && topic_keywords THEN array_length(tl.tags & topic_keywords, 1)
      ELSE 0
    END as relevance_score
  FROM tech_logos tl
  WHERE 
    tl.tags && topic_keywords OR
    tl.company_name ILIKE ANY(SELECT '%' || kw || '%' FROM unnest(topic_keywords) as kw) OR
    tl.image_name ILIKE ANY(SELECT '%' || kw || '%' FROM unnest(topic_keywords) as kw)
  ORDER BY relevance_score DESC, company_name ASC;
END;
$$ LANGUAGE plpgsql;