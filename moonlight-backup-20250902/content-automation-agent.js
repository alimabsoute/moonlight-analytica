/**
 * Moonlight Analytica Content Automation Agent
 * 
 * Production-ready specialist agent handling complete content automation pipeline:
 * - Content scraping & analysis
 * - 3-AI collaborative content generation (Claude → OpenAI → Claude Overseer)
 * - Database management with proper error handling
 * - Quality assurance & publishing integration
 * - Comprehensive logging & monitoring
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import feedparser from 'feedparser';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import cron from 'node-cron';
import winston from 'winston';
import fs from 'fs/promises';
import path from 'path';

class ContentAutomationAgent {
  constructor(config = {}) {
    this.config = {
      supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
      qualityThreshold: 8,
      maxRetries: 3,
      publishingPath: process.env.PUBLISHING_PATH || 'C:\\Users\\alima\\articles',
      ...config
    };

    // Initialize services
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
    this.anthropic = new Anthropic({ apiKey: this.config.anthropicKey });
    this.openai = new OpenAI({ apiKey: this.config.openaiKey });

    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'content-automation.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Content sources configuration
    this.contentSources = {
      techcrunch: { 
        rss: 'https://techcrunch.com/feed/',
        priority: 'high',
        category: 'tech'
      },
      theverge: {
        rss: 'https://www.theverge.com/rss/index.xml',
        priority: 'high', 
        category: 'tech'
      },
      arstechnica: {
        rss: 'https://feeds.arstechnica.com/arstechnica/index',
        priority: 'medium',
        category: 'tech'
      },
      hackernews: {
        api: 'https://hacker-news.firebaseio.com/v0',
        priority: 'high',
        category: 'tech'
      }
    };

    // Initialize database schema
    this.initializeDatabase();
  }

  /**
   * Initialize database tables with proper schema
   */
  async initializeDatabase() {
    try {
      // Create articles table with all required fields
      const { error: articlesError } = await this.supabase.rpc('create_articles_table', {
        sql_query: `
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
        `
      });

      // Create content_sources table
      const { error: sourcesError } = await this.supabase.rpc('create_sources_table', {
        sql_query: `
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
        `
      });

      // Create generation_logs table for monitoring
      const { error: logsError } = await this.supabase.rpc('create_logs_table', {
        sql_query: `
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
        `
      });

      if (articlesError || sourcesError || logsError) {
        this.logger.error('Database initialization error:', { articlesError, sourcesError, logsError });
      } else {
        this.logger.info('Database schema initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
    }
  }

  /**
   * Scrape content from configured sources
   */
  async scrapeContent() {
    this.logger.info('Starting content scraping process');
    const scrapedItems = [];

    for (const [sourceName, config] of Object.entries(this.contentSources)) {
      try {
        if (config.rss) {
          const items = await this.scrapeRSSFeed(sourceName, config);
          scrapedItems.push(...items);
        } else if (config.api) {
          const items = await this.scrapeAPI(sourceName, config);
          scrapedItems.push(...items);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        this.logger.error(`Failed to scrape ${sourceName}:`, error);
      }
    }

    await this.storeScrapedContent(scrapedItems);
    this.logger.info(`Scraped ${scrapedItems.length} content items`);
    return scrapedItems;
  }

  /**
   * Scrape RSS feed with error handling
   */
  async scrapeRSSFeed(sourceName, config) {
    return new Promise((resolve, reject) => {
      const items = [];
      const feedparser = new FeedParser();

      const req = fetch(config.rss)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.body;
        });

      req.then(stream => {
        stream.pipe(feedparser);
      }).catch(reject);

      feedparser.on('error', reject);
      
      feedparser.on('readable', function() {
        let item;
        while (item = this.read()) {
          const contentHash = this.generateContentHash(`${item.title}${item.description}`);
          items.push({
            title: item.title,
            description: item.description || item.summary,
            source_url: item.link,
            source_name: sourceName,
            category: config.category,
            content_hash: contentHash,
            published_date: item.pubdate || new Date()
          });
        }
      });

      feedparser.on('end', () => resolve(items.slice(0, 10))); // Limit to 10 items
    });
  }

  /**
   * Store scraped content with deduplication
   */
  async storeScrapedContent(items) {
    const newItems = [];

    for (const item of items) {
      try {
        const { data, error } = await this.supabase
          .from('content_sources')
          .insert(item)
          .select();

        if (!error) {
          newItems.push(data[0]);
        } else if (error.code !== '23505') { // Not a duplicate constraint error
          this.logger.error('Failed to store content item:', error);
        }
      } catch (error) {
        this.logger.error('Error storing content:', error);
      }
    }

    this.logger.info(`Stored ${newItems.length} new content items`);
    return newItems;
  }

  /**
   * Select trending content for article generation
   */
  async selectTrendingContent(category = 'tech', limit = 5) {
    const { data, error } = await this.supabase
      .from('content_sources')
      .select('*')
      .eq('category', category)
      .not('used_in_articles', 'cs', '{}') // Not used in articles yet
      .gte('scraped_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()) // Last 2 days
      .order('scraped_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to select trending content:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 3-AI Collaborative Content Generation Pipeline
   */
  async generateArticle(sourceContent, category = 'tech') {
    const startTime = Date.now();
    let articleId = null;

    try {
      this.logger.info('Starting 3-AI collaborative content generation');

      // Step 1: Claude Writer - Initial Article Generation
      const writerResult = await this.claudeWriter(sourceContent, category);
      if (!writerResult) throw new Error('Claude Writer failed');

      // Step 2: OpenAI Editor - Content Enhancement & SEO
      const editorResult = await this.openaiEditor(writerResult, sourceContent);
      if (!editorResult) throw new Error('OpenAI Editor failed');

      // Step 3: Claude Overseer - Quality Assessment & Final Polish
      const finalResult = await this.claudeOverseer(editorResult, writerResult);
      if (!finalResult) throw new Error('Claude Overseer failed');

      // Quality check
      if (finalResult.quality_score < this.config.qualityThreshold) {
        this.logger.warn(`Article quality ${finalResult.quality_score}/10 below threshold ${this.config.qualityThreshold}`);
        
        // Retry once with different approach
        if (finalResult.iterations < 2) {
          this.logger.info('Retrying with enhanced prompts');
          return await this.generateArticle(sourceContent, category);
        }
      }

      // Save to database
      articleId = await this.saveArticle(finalResult, sourceContent);
      
      // Log generation metrics
      await this.logGeneration(articleId, 'complete', {
        total_processing_time: (Date.now() - startTime) / 1000,
        quality_score: finalResult.quality_score,
        word_count: finalResult.word_count,
        ai_writers: ['claude', 'openai', 'claude-overseer']
      });

      this.logger.info(`Article generated successfully: ${finalResult.title} (Quality: ${finalResult.quality_score}/10)`);
      return finalResult;

    } catch (error) {
      this.logger.error('Article generation failed:', error);
      
      if (articleId) {
        await this.logGeneration(articleId, 'error', {
          error_message: error.message,
          processing_time: (Date.now() - startTime) / 1000
        });
      }
      
      throw error;
    }
  }

  /**
   * Claude Writer - Initial article creation
   */
  async claudeWriter(sourceContent, category) {
    const startTime = Date.now();

    try {
      const contentSummary = sourceContent
        .map(item => `- ${item.title}: ${item.description?.substring(0, 200) || 'No description'}`)
        .join('\n');

      const prompt = `You are a professional tech journalist writing for Moonlight Analytica. 

Source Material:
${contentSummary}

Write a comprehensive, original article about recent developments in ${category}. 

Requirements:
- 800-1200 words
- TechCrunch-style professional tone
- Original analysis, not just summarization
- Clear structure with headings
- Include industry implications
- Mention specific companies/technologies when relevant
- Professional but engaging writing style

Return your response as JSON with:
{
  "title": "Engaging article title",
  "content": "Full article with HTML formatting",
  "excerpt": "Brief summary (150 chars)",
  "key_insights": ["insight1", "insight2", "insight3"]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });

      const result = JSON.parse(response.content[0].text);
      
      await this.logGeneration(null, 'claude_writer', {
        processing_time: (Date.now() - startTime) / 1000,
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens
      });

      return {
        ...result,
        ai_writers: ['claude'],
        iterations: 1,
        word_count: this.countWords(result.content)
      };

    } catch (error) {
      this.logger.error('Claude Writer failed:', error);
      throw error;
    }
  }

  /**
   * OpenAI Editor - Content enhancement and SEO optimization
   */
  async openaiEditor(writerResult, sourceContent) {
    const startTime = Date.now();

    try {
      const prompt = `You are an expert content editor specializing in SEO optimization and content enhancement.

Original Article:
Title: ${writerResult.title}
Content: ${writerResult.content}

Tasks:
1. Enhance content structure and flow
2. Add SEO-optimized meta description
3. Suggest relevant tags
4. Improve readability and engagement
5. Ensure proper keyword integration
6. Add compelling call-to-actions

Source Context:
${sourceContent.map(item => `- ${item.title}: ${item.source_url}`).join('\n')}

Return JSON response:
{
  "title": "SEO-optimized title",
  "content": "Enhanced content with better structure",
  "meta_description": "SEO meta description (150-160 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "improvements": ["improvement1", "improvement2"],
  "seo_keywords": ["keyword1", "keyword2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      await this.logGeneration(null, 'openai_editor', {
        processing_time: (Date.now() - startTime) / 1000,
        input_tokens: response.usage?.prompt_tokens,
        output_tokens: response.usage?.completion_tokens
      });

      return {
        ...writerResult,
        ...result,
        ai_writers: ['claude', 'openai'],
        iterations: writerResult.iterations + 1,
        word_count: this.countWords(result.content)
      };

    } catch (error) {
      this.logger.error('OpenAI Editor failed:', error);
      throw error;
    }
  }

  /**
   * Claude Overseer - Quality assessment and final polish
   */
  async claudeOverseer(editorResult, originalResult) {
    const startTime = Date.now();

    try {
      const prompt = `You are a senior editor conducting final quality review for Moonlight Analytica.

Original Article: ${originalResult.title}
Enhanced Article: ${editorResult.title}
Content: ${editorResult.content}

Evaluation Criteria:
1. Content originality and depth (25%)
2. Technical accuracy and insight (25%)
3. Writing quality and engagement (25%)
4. SEO optimization and structure (25%)

Tasks:
1. Score the article 1-10 overall
2. Make final improvements if needed
3. Ensure brand voice consistency
4. Verify all claims are supportable
5. Polish for publication

Return JSON:
{
  "title": "Final polished title",
  "content": "Final content ready for publication",
  "excerpt": "Final excerpt",
  "meta_description": "Final meta description",
  "tags": ["final", "tag", "list"],
  "quality_score": 8.5,
  "quality_breakdown": {
    "originality": 8,
    "accuracy": 9, 
    "writing": 8,
    "seo": 9
  },
  "final_notes": "Brief quality assessment",
  "ready_to_publish": true
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });

      const result = JSON.parse(response.content[0].text);
      
      await this.logGeneration(null, 'claude_overseer', {
        processing_time: (Date.now() - startTime) / 1000,
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens
      });

      return {
        ...editorResult,
        ...result,
        ai_writers: ['claude', 'openai', 'claude-overseer'],
        iterations: editorResult.iterations + 1,
        word_count: this.countWords(result.content),
        slug: this.generateSlug(result.title)
      };

    } catch (error) {
      this.logger.error('Claude Overseer failed:', error);
      throw error;
    }
  }

  /**
   * Save article to database with proper field mapping
   */
  async saveArticle(articleData, sourceContent) {
    try {
      const articleRecord = {
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt,
        category: 'tech',
        tags: articleData.tags || [],
        slug: articleData.slug,
        meta_description: articleData.meta_description,
        source_urls: sourceContent.map(item => item.source_url),
        status: articleData.quality_score >= this.config.qualityThreshold ? 'ready' : 'draft',
        quality_score: articleData.quality_score,
        word_count: articleData.word_count,
        ai_writers: articleData.ai_writers,
        iterations: articleData.iterations
      };

      const { data, error } = await this.supabase
        .from('articles')
        .insert(articleRecord)
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to save article:', error);
        throw error;
      }

      // Mark source content as used
      const sourceIds = sourceContent.map(item => item.id);
      await this.supabase
        .from('content_sources')
        .update({ used_in_articles: [data.id] })
        .in('id', sourceIds);

      this.logger.info(`Article saved with ID: ${data.id}`);
      return data.id;

    } catch (error) {
      this.logger.error('Error saving article:', error);
      throw error;
    }
  }

  /**
   * Publish articles to live site
   */
  async publishReadyArticles() {
    try {
      const { data: articles, error } = await this.supabase
        .from('articles')
        .select('*')
        .eq('status', 'ready')
        .is('published_at', null)
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) {
        this.logger.error('Failed to fetch articles for publishing:', error);
        return;
      }

      for (const article of articles) {
        try {
          await this.publishToSite(article);
          
          // Update article status
          await this.supabase
            .from('articles')
            .update({ 
              status: 'published',
              published_at: new Date().toISOString()
            })
            .eq('id', article.id);

          this.logger.info(`Published article: ${article.title}`);
        } catch (error) {
          this.logger.error(`Failed to publish article ${article.id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in publishing process:', error);
    }
  }

  /**
   * Publish article to static HTML site
   */
  async publishToSite(article) {
    try {
      // Generate article HTML file
      const articleHTML = this.generateArticleHTML(article);
      const filename = `${article.slug}.html`;
      const filepath = path.join(this.config.publishingPath, filename);

      await fs.writeFile(filepath, articleHTML);

      // Update insights.html with new article card
      await this.updateInsightsPage(article);

      this.logger.info(`Article published to: ${filepath}`);
    } catch (error) {
      this.logger.error('Failed to publish to site:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for article page
   */
  generateArticleHTML(article) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} | Moonlight Analytica</title>
    <meta name="description" content="${article.meta_description}">
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
    <header>
        <nav>
            <a href="../moonlight-complete-structure.html">Home</a>
            <a href="../insights.html">Insights</a>
            <a href="../products.html">Products</a>
            <a href="../contact.html">Contact</a>
        </nav>
    </header>
    
    <main class="article-container">
        <article>
            <header class="article-header">
                <h1>${article.title}</h1>
                <div class="article-meta">
                    <span>By ${article.author}</span>
                    <span>•</span>
                    <span>${new Date(article.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>${Math.ceil(article.word_count / 200)} min read</span>
                </div>
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </header>
            
            <div class="article-content">
                ${article.content}
            </div>
            
            <footer class="article-footer">
                <p>Generated by Moonlight Analytica's AI content system</p>
                <p>Quality Score: ${article.quality_score}/10</p>
            </footer>
        </article>
    </main>
</body>
</html>`;
  }

  /**
   * Update insights.html with new article
   */
  async updateInsightsPage(article) {
    try {
      const insightsPath = path.join('C:\\Users\\alima', 'insights.html');
      let insightsHTML = await fs.readFile(insightsPath, 'utf8');

      const articleCard = `
        <div class="article-card">
            <h3><a href="articles/${article.slug}.html">${article.title}</a></h3>
            <p>${article.excerpt}</p>
            <div class="article-meta">
                <span>${new Date(article.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>${Math.ceil(article.word_count / 200)} min read</span>
                <span>•</span>
                <span>Quality: ${article.quality_score}/10</span>
            </div>
        </div>`;

      // Insert new article at the top of articles container
      insightsHTML = insightsHTML.replace(
        '<div class="articles-container">',
        `<div class="articles-container">${articleCard}`
      );

      await fs.writeFile(insightsPath, insightsHTML);
      this.logger.info('Updated insights.html with new article');
    } catch (error) {
      this.logger.error('Failed to update insights page:', error);
    }
  }

  /**
   * Log generation metrics
   */
  async logGeneration(articleId, step, metadata = {}) {
    try {
      await this.supabase
        .from('generation_logs')
        .insert({
          article_id: articleId,
          step,
          ai_model: metadata.ai_model,
          input_tokens: metadata.input_tokens,
          output_tokens: metadata.output_tokens,
          processing_time: metadata.processing_time,
          error_message: metadata.error_message,
          metadata
        });
    } catch (error) {
      this.logger.error('Failed to log generation metrics:', error);
    }
  }

  /**
   * Run complete automation pipeline
   */
  async runPipeline() {
    try {
      this.logger.info('Starting complete content automation pipeline');

      // Step 1: Scrape content
      await this.scrapeContent();

      // Step 2: Select trending content
      const trendingContent = await this.selectTrendingContent('tech', 5);
      
      if (trendingContent.length < 3) {
        this.logger.warn('Insufficient trending content for article generation');
        return;
      }

      // Step 3: Generate article
      const article = await this.generateArticle(trendingContent, 'tech');

      // Step 4: Publish if quality is good
      if (article && article.quality_score >= this.config.qualityThreshold) {
        await this.publishReadyArticles();
        this.logger.info('Pipeline completed successfully');
      } else {
        this.logger.warn('Article quality insufficient for publishing');
      }

    } catch (error) {
      this.logger.error('Pipeline execution failed:', error);
      throw error;
    }
  }

  /**
   * Setup automated scheduling
   */
  setupScheduler() {
    // Run content generation daily at 6 AM
    cron.schedule('0 6 * * *', () => {
      this.logger.info('Starting scheduled content generation');
      this.runPipeline().catch(error => {
        this.logger.error('Scheduled pipeline failed:', error);
      });
    });

    // Check for publishing every 2 hours
    cron.schedule('0 */2 * * *', () => {
      this.logger.info('Checking for articles to publish');
      this.publishReadyArticles().catch(error => {
        this.logger.error('Scheduled publishing failed:', error);
      });
    });

    this.logger.info('Content automation scheduler initialized');
  }

  // Utility methods
  generateContentHash(content) {
    return require('crypto').createHash('md5').update(content).digest('hex');
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
}

// Export for use
export default ContentAutomationAgent;

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new ContentAutomationAgent();
  
  // Test the pipeline
  agent.runPipeline()
    .then(() => {
      console.log('✅ Content automation pipeline completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Pipeline failed:', error);
      process.exit(1);
    });
}