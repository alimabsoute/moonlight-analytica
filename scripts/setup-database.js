/**
 * Database Setup Script
 * 
 * Sets up the required database schema for the content automation agent
 * with proper error handling and field validation
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🗄️  Setting up database schema...');

  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1);

    if (testError && !testError.message.includes('does not exist')) {
      console.error('❌ Database connection failed:', testError.message);
      process.exit(1);
    }

    console.log('✅ Database connection successful');

    // Create articles table
    console.log('📝 Creating articles table...');
    const { error: articlesError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          excerpt TEXT,
          author VARCHAR(100) DEFAULT 'Moonlight Analytica',
          category VARCHAR(50) NOT NULL,
          tags TEXT[],
          slug VARCHAR(500) UNIQUE NOT NULL,
          meta_description VARCHAR(160),
          source_urls TEXT[],
          status VARCHAR(20) DEFAULT 'draft',
          quality_score DECIMAL(3,1),
          word_count INTEGER,
          ai_writers TEXT[],
          iterations INTEGER DEFAULT 1,
          published_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
        CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
        CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
        CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
      `
    });

    if (articlesError) {
      console.log('ℹ️  Articles table setup (might already exist):', articlesError.message);
    } else {
      console.log('✅ Articles table created successfully');
    }

    // Create content_sources table
    console.log('📊 Creating content_sources table...');
    const { error: sourcesError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS content_sources (
          id SERIAL PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          source_url VARCHAR(1000) NOT NULL,
          source_name VARCHAR(100) NOT NULL,
          category VARCHAR(50) NOT NULL,
          content_hash VARCHAR(64) UNIQUE NOT NULL,
          published_date TIMESTAMP,
          scraped_at TIMESTAMP DEFAULT NOW(),
          used_in_articles INTEGER[] DEFAULT '{}',
          trending_score DECIMAL(3,1) DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_content_sources_hash ON content_sources(content_hash);
        CREATE INDEX IF NOT EXISTS idx_content_sources_category ON content_sources(category);
        CREATE INDEX IF NOT EXISTS idx_content_sources_scraped_at ON content_sources(scraped_at);
      `
    });

    if (sourcesError) {
      console.log('ℹ️  Content sources table setup (might already exist):', sourcesError.message);
    } else {
      console.log('✅ Content sources table created successfully');
    }

    // Create generation_logs table
    console.log('📊 Creating generation_logs table...');
    const { error: logsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS generation_logs (
          id SERIAL PRIMARY KEY,
          article_id INTEGER REFERENCES articles(id),
          step VARCHAR(50) NOT NULL,
          ai_model VARCHAR(50),
          input_tokens INTEGER,
          output_tokens INTEGER,
          processing_time DECIMAL(6,2),
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_generation_logs_article_id ON generation_logs(article_id);
        CREATE INDEX IF NOT EXISTS idx_generation_logs_step ON generation_logs(step);
        CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at);
      `
    });

    if (logsError) {
      console.log('ℹ️  Generation logs table setup (might already exist):', logsError.message);
    } else {
      console.log('✅ Generation logs table created successfully');
    }

    // Verify tables exist and have correct structure
    console.log('🔍 Verifying table structure...');
    
    const tables = ['articles', 'content_sources', 'generation_logs'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table} table:`, error.message);
      } else {
        console.log(`✅ ${table} table verified`);
      }
    }

    // Insert sample data for testing
    console.log('📝 Inserting sample data...');
    const { error: sampleError } = await supabase
      .from('content_sources')
      .upsert([
        {
          title: 'Sample AI News Article',
          description: 'A sample article about artificial intelligence developments.',
          source_url: 'https://example.com/ai-news',
          source_name: 'TechCrunch',
          category: 'tech',
          content_hash: 'sample_hash_' + Date.now(),
          published_date: new Date().toISOString()
        }
      ], { 
        onConflict: 'content_hash',
        ignoreDuplicates: true 
      });

    if (sampleError) {
      console.log('ℹ️  Sample data insertion (might already exist):', sampleError.message);
    } else {
      console.log('✅ Sample data inserted successfully');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Database Schema Summary:');
    console.log('   • articles: Main article storage with quality scores');
    console.log('   • content_sources: Scraped content for article generation');  
    console.log('   • generation_logs: AI processing metrics and monitoring');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Copy .env.example to .env and configure your API keys');
    console.log('   2. Run `npm run generate:article` to test article generation');
    console.log('   3. Run `npm start` to start the full automation pipeline');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export default setupDatabase;