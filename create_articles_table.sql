-- Create articles table for content management
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category VARCHAR(100),
  tags TEXT[], -- Array of tags
  status VARCHAR(20) DEFAULT 'draft', -- draft, pending, published, archived
  author VARCHAR(100) DEFAULT 'Moonlight Analytica',
  
  -- Image management
  image_1_url TEXT,
  image_1_alt TEXT,
  image_2_url TEXT,
  image_2_alt TEXT,
  
  -- SEO fields
  meta_title VARCHAR(200),
  meta_description VARCHAR(300),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- AI generation tracking
  generated_by VARCHAR(50), -- 'ai', 'human', 'ai-edited'
  ai_model VARCHAR(100), -- 'claude-3', 'gpt-4', etc.
  original_prompt TEXT, -- Store original AI prompt for reference
  
  -- Publishing workflow
  reviewer VARCHAR(100),
  review_notes TEXT,
  revision_count INTEGER DEFAULT 0,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-increment revision count on content changes
    IF OLD.content IS DISTINCT FROM NEW.content OR 
       OLD.title IS DISTINCT FROM NEW.title THEN
        NEW.revision_count = COALESCE(OLD.revision_count, 0) + 1;
    END IF;
    
    -- Set published_at when status changes to published
    IF OLD.status != 'published' AND NEW.status = 'published' THEN
        NEW.published_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at 
BEFORE UPDATE ON articles 
FOR EACH ROW EXECUTE FUNCTION update_articles_updated_at();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(
        regexp_replace(title_text, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
    ));
END;
$$ language 'plpgsql';

-- Function to get articles for review workflow
CREATE OR REPLACE FUNCTION get_articles_for_review()
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(500),
    category VARCHAR(100),
    status VARCHAR(20),
    generated_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    revision_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.title, a.category, a.status, a.generated_by, 
        a.created_at, a.revision_count
    FROM articles a
    WHERE a.status IN ('draft', 'pending')
    ORDER BY 
        CASE WHEN a.generated_by = 'ai' THEN 0 ELSE 1 END, -- AI articles first
        a.created_at DESC;
END;
$$ language 'plpgsql';

-- Function to get published articles for site
CREATE OR REPLACE FUNCTION get_published_articles(
    limit_count INTEGER DEFAULT 10,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(500),
    slug VARCHAR(500),
    content TEXT,
    excerpt TEXT,
    category VARCHAR(100),
    image_1_url TEXT,
    image_2_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.title, a.slug, a.content, a.excerpt, a.category,
        a.image_1_url, a.image_2_url, a.published_at, a.view_count
    FROM articles a
    WHERE a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ language 'plpgsql';

-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public, created_at, updated_at) 
VALUES ('article-images', 'article-images', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Storage policies for article images
CREATE POLICY "Public Access for Article Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can delete article images"
ON storage.objects FOR DELETE
USING (bucket_id = 'article-images');

-- Create article_workflow_log table for tracking changes
CREATE TABLE IF NOT EXISTS article_workflow_log (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'edited', 'published', 'archived'
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  changed_by VARCHAR(100),
  change_notes TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_log_article_id ON article_workflow_log(article_id);
CREATE INDEX IF NOT EXISTS idx_workflow_log_changed_at ON article_workflow_log(changed_at DESC);

-- Trigger to log workflow changes
CREATE OR REPLACE FUNCTION log_article_workflow()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO article_workflow_log (article_id, action, new_status, changed_by)
        VALUES (NEW.id, 'created', NEW.status, NEW.author);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO article_workflow_log (article_id, action, old_status, new_status, changed_by)
            VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, COALESCE(NEW.reviewer, NEW.author));
        END IF;
        
        IF OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title THEN
            INSERT INTO article_workflow_log (article_id, action, changed_by)
            VALUES (NEW.id, 'content_edited', COALESCE(NEW.reviewer, NEW.author));
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_article_workflow_trigger
AFTER INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION log_article_workflow();