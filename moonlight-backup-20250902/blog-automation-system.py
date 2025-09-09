"""
Automated Blog Content Generation System
Generates 3-5 daily articles on AI, Tech, Gaming news with SaaS product integration
"""

import requests
import feedparser
import json
import time
import schedule
from datetime import datetime, timedelta
import openai
from typing import List, Dict, Optional
import sqlite3
import hashlib
import re
from urllib.parse import urlparse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BlogContentGenerator:
    def __init__(self, config_file='blog_config.json'):
        """Initialize the blog content generator with configuration"""
        self.config = self.load_config(config_file)
        self.db_path = 'blog_content.db'
        self.init_database()
        
        # RSS Feed sources for content aggregation
        self.rss_sources = {
            'ai_news': [
                'https://openai.com/blog/rss.xml',
                'https://www.anthropic.com/news/rss',
                'https://blog.google/technology/ai/rss/',
                'https://huggingface.co/blog/feed.xml',
                'https://www.deepmind.com/blog/rss.xml'
            ],
            'tech_news': [
                'https://techcrunch.com/feed/',
                'https://feeds.feedburner.com/venturebeat/SZYF',
                'https://www.theverge.com/rss/index.xml',
                'https://arstechnica.com/feed/',
                'https://www.wired.com/feed/rss'
            ],
            'gaming_news': [
                'https://feeds.ign.com/ign/games-all',
                'https://www.gamespot.com/feeds/mashup/',
                'https://www.polygon.com/rss/index.xml',
                'https://kotaku.com/rss',
                'https://www.eurogamer.net/?format=rss'
            ],
            'product_launches': [
                'https://www.producthunt.com/feed',
                'https://github.blog/feed/',
                'https://blog.ycombinator.com/feed/'
            ]
        }
        
        # SaaS products for natural integration
        self.saas_products = {
            'phynxtimer': {
                'name': 'PhynxTimer',
                'url': 'https://phynxtimer.com',
                'description': 'Advanced productivity timer with AI-powered insights',
                'keywords': ['productivity', 'time management', 'pomodoro', 'focus', 'remote work'],
                'status': 'live'
            },
            'ats_helper': {
                'name': 'ATS Resume Helper',
                'url': '#beta-signup',
                'description': 'AI-powered resume optimization for job seekers',
                'keywords': ['resume', 'job search', 'ATS', 'career', 'recruitment', 'AI'],
                'status': 'beta'
            },
            'line_vision': {
                'name': 'Line Vision Analytics',
                'url': '#early-access',
                'description': 'Computer vision platform for retail queue management',
                'keywords': ['retail', 'analytics', 'computer vision', 'AI', 'operations', 'efficiency'],
                'status': 'coming_soon'
            }
        }
    
    def load_config(self, config_file: str) -> Dict:
        """Load configuration from JSON file"""
        default_config = {
            'openai_api_key': 'your-openai-api-key',
            'posts_per_day': 4,
            'min_words_per_post': 800,
            'max_words_per_post': 1200,
            'include_images': True,
            'seo_optimize': True,
            'product_mention_chance': 0.3,
            'publishing_hours': [9, 13, 17, 21],  # 9am, 1pm, 5pm, 9pm
            'content_categories': {
                'ai_news': 0.4,      # 40% AI content
                'tech_news': 0.3,    # 30% Tech content  
                'gaming_news': 0.2,  # 20% Gaming content
                'product_reviews': 0.1  # 10% Product content
            }
        }
        
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                return {**default_config, **config}
        except FileNotFoundError:
            logger.info(f"Config file {config_file} not found, using defaults")
            return default_config
    
    def init_database(self):
        """Initialize SQLite database for content tracking"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL,
                tags TEXT,
                url_slug TEXT UNIQUE,
                publish_date DATETIME,
                source_hash TEXT UNIQUE,
                word_count INTEGER,
                seo_score REAL,
                product_mentions TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_url TEXT NOT NULL,
                title TEXT,
                description TEXT,
                pub_date DATETIME,
                content_hash TEXT UNIQUE,
                used_for_article INTEGER DEFAULT 0,
                category TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def fetch_rss_content(self, category: str) -> List[Dict]:
        """Fetch and parse RSS content from various sources"""
        content_items = []
        
        for rss_url in self.rss_sources.get(category, []):
            try:
                feed = feedparser.parse(rss_url)
                for entry in feed.entries[:5]:  # Get latest 5 items per source
                    
                    # Create content hash to avoid duplicates
                    content_text = f"{entry.title}{entry.get('description', '')}"
                    content_hash = hashlib.md5(content_text.encode()).hexdigest()
                    
                    content_item = {
                        'title': entry.title,
                        'description': entry.get('description', ''),
                        'link': entry.get('link', ''),
                        'pub_date': entry.get('published', ''),
                        'source': urlparse(rss_url).netloc,
                        'category': category,
                        'content_hash': content_hash
                    }
                    content_items.append(content_item)
                    
            except Exception as e:
                logger.error(f"Error fetching RSS from {rss_url}: {str(e)}")
                continue
        
        # Store in database and return new items
        return self.store_and_filter_content(content_items)
    
    def store_and_filter_content(self, content_items: List[Dict]) -> List[Dict]:
        """Store content in database and return only new items"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        new_items = []
        
        for item in content_items:
            try:
                cursor.execute('''
                    INSERT INTO content_sources 
                    (source_url, title, description, pub_date, content_hash, category)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    item['link'], item['title'], item['description'],
                    item['pub_date'], item['content_hash'], item['category']
                ))
                new_items.append(item)
                
            except sqlite3.IntegrityError:
                # Content already exists, skip
                continue
        
        conn.commit()
        conn.close()
        
        logger.info(f"Found {len(new_items)} new content items in {content_items[0]['category'] if content_items else 'unknown'}")
        return new_items
    
    def select_trending_content(self, category: str, limit: int = 3) -> List[Dict]:
        """Select trending content for article generation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get recent, unused content items
        cursor.execute('''
            SELECT * FROM content_sources 
            WHERE category = ? AND used_for_article = 0
            AND created_at > datetime('now', '-2 days')
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (category, limit))
        
        results = cursor.fetchall()
        conn.close()
        
        # Convert to dict format
        columns = ['id', 'source_url', 'title', 'description', 'pub_date', 'content_hash', 'used_for_article', 'category', 'created_at']
        return [dict(zip(columns, row)) for row in results]
    
    def generate_article_content(self, source_content: List[Dict], category: str) -> Dict:
        """Generate original article content using AI"""
        
        # Prepare content summary for AI
        content_summary = "\n".join([
            f"- {item['title']}: {item['description'][:200]}..."
            for item in source_content[:3]
        ])
        
        # Determine if we should mention our SaaS products
        include_product = self.should_include_product_mention(category)
        product_context = ""
        
        if include_product:
            relevant_product = self.get_relevant_product(category)
            if relevant_product:
                product_context = f"\nOptionally mention our product {relevant_product['name']} ({relevant_product['description']}) if relevant to the topic."
        
        # Generate article prompt
        prompt = f"""
        Write a comprehensive, original blog article about recent developments in {category.replace('_', ' ')}.

        Source Material Summary:
        {content_summary}

        Requirements:
        - 800-1200 words
        - Original analysis and insights, not just summarizing
        - SEO optimized with relevant keywords
        - Engaging title and introduction
        - Include expert opinions and future implications
        - Professional tone suitable for tech professionals
        - Structure with clear headings and subheadings
        {product_context}

        Format the response as JSON with these fields:
        - title: Compelling article title
        - content: Full article content with HTML formatting
        - meta_description: SEO meta description (150-160 chars)
        - tags: Comma-separated relevant tags
        - category: Article category
        - estimated_read_time: Reading time in minutes
        - key_points: 3-5 bullet points of main takeaways
        """
        
        try:
            # This would use OpenAI API - placeholder for now
            # response = openai.ChatCompletion.create(
            #     model="gpt-4",
            #     messages=[{"role": "user", "content": prompt}],
            #     max_tokens=2000,
            #     temperature=0.7
            # )
            
            # Mock response for demonstration
            mock_article = self.generate_mock_article(category, source_content, include_product)
            return mock_article
            
        except Exception as e:
            logger.error(f"Error generating article content: {str(e)}")
            return None
    
    def generate_mock_article(self, category: str, source_content: List[Dict], include_product: bool) -> Dict:
        """Generate a mock article for demonstration"""
        
        category_titles = {
            'ai_news': [
                'AI Breakthrough: Latest Developments Reshaping Technology',
                'The Future of Artificial Intelligence: Recent Innovations',
                'Machine Learning Revolution: What Recent Advances Mean for Business'
            ],
            'tech_news': [
                'Tech Industry Shifts: Analyzing Recent Market Developments',
                'Innovation Spotlight: Latest Technology Trends and Implications',
                'Digital Transformation: Recent Developments Driving Change'
            ],
            'gaming_news': [
                'Gaming Industry Update: Latest Releases and Technology Trends',
                'The Evolution of Gaming: Recent Developments and Future Outlook',
                'Gaming Technology Advances: What Gamers Need to Know'
            ]
        }
        
        import random
        
        title = random.choice(category_titles.get(category, ['Latest Technology Developments']))
        
        # Build content with potential product mention
        content_parts = [
            f"<h1>{title}</h1>",
            f"<p>The {category.replace('_', ' ')} landscape continues to evolve at a rapid pace, with recent developments showcasing significant innovations...</p>",
            "<h2>Key Developments</h2>",
            "<p>Recent analysis reveals several important trends emerging in the industry...</p>",
            "<h2>Industry Impact</h2>",
            "<p>These developments are set to transform how businesses and consumers interact with technology...</p>"
        ]
        
        # Add product mention if selected
        if include_product:
            relevant_product = self.get_relevant_product(category)
            if relevant_product:
                if relevant_product['status'] == 'live':
                    product_mention = f"<p>Tools like <a href='{relevant_product['url']}'>{relevant_product['name']}</a> are already helping users leverage these technological advances in practical ways.</p>"
                elif relevant_product['status'] == 'beta':
                    product_mention = f"<p>Emerging solutions like our upcoming {relevant_product['name']} aim to address these evolving needs in the market.</p>"
                else:
                    product_mention = f"<p>The development of specialized tools for this space, including solutions like {relevant_product['name']}, represents the next frontier in this technology area.</p>"
                
                content_parts.insert(-1, product_mention)
        
        content_parts.extend([
            "<h2>Future Outlook</h2>",
            "<p>Looking ahead, these developments signal a continued evolution in how we approach technology integration...</p>",
            "<p>As the industry continues to mature, we can expect to see further innovations that will reshape the technological landscape.</p>"
        ])
        
        return {
            'title': title,
            'content': '\n'.join(content_parts),
            'meta_description': f"Comprehensive analysis of recent {category.replace('_', ' ')} developments and their impact on the technology industry.",
            'tags': f"{category.replace('_', ' ')}, technology, innovation, analysis, trends",
            'category': category,
            'estimated_read_time': random.randint(4, 7),
            'key_points': [
                'Recent developments show significant industry evolution',
                'New technologies are reshaping business practices',
                'Future innovations promise continued transformation',
                'Market adaptation strategies are becoming crucial'
            ],
            'product_mentioned': include_product
        }
    
    def should_include_product_mention(self, category: str) -> bool:
        """Determine if we should include a product mention"""
        import random
        return random.random() < self.config['product_mention_chance']
    
    def get_relevant_product(self, category: str) -> Optional[Dict]:
        """Get the most relevant SaaS product for the content category"""
        
        category_product_mapping = {
            'ai_news': ['ats_helper', 'line_vision'],
            'tech_news': ['phynxtimer', 'ats_helper'],
            'gaming_news': ['phynxtimer'],
            'product_launches': ['phynxtimer', 'ats_helper', 'line_vision']
        }
        
        relevant_products = category_product_mapping.get(category, list(self.saas_products.keys()))
        
        if relevant_products:
            import random
            product_key = random.choice(relevant_products)
            return self.saas_products[product_key]
        
        return None
    
    def save_article(self, article_data: Dict, source_content_ids: List[int]) -> int:
        """Save generated article to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Generate URL slug
        url_slug = re.sub(r'[^a-zA-Z0-9\s]', '', article_data['title'].lower())
        url_slug = '-'.join(url_slug.split()[:8])
        
        # Calculate publish time
        now = datetime.now()
        publish_time = now + timedelta(hours=1)  # Publish 1 hour from now
        
        try:
            cursor.execute('''
                INSERT INTO articles 
                (title, content, category, tags, url_slug, publish_date, word_count, 
                 product_mentions, source_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                article_data['title'],
                article_data['content'],
                article_data['category'],
                article_data['tags'],
                url_slug,
                publish_time,
                len(article_data['content'].split()),
                json.dumps({'mentioned': article_data.get('product_mentioned', False)}),
                hashlib.md5(article_data['content'].encode()).hexdigest()
            ))
            
            article_id = cursor.lastrowid
            
            # Mark source content as used
            for source_id in source_content_ids:
                cursor.execute('''
                    UPDATE content_sources 
                    SET used_for_article = 1 
                    WHERE id = ?
                ''', (source_id,))
            
            conn.commit()
            logger.info(f"Article saved with ID: {article_id}")
            return article_id
            
        except Exception as e:
            logger.error(f"Error saving article: {str(e)}")
            return None
        finally:
            conn.close()
    
    def generate_daily_content(self):
        """Main method to generate daily blog content"""
        logger.info("Starting daily content generation...")
        
        articles_generated = 0
        target_articles = self.config['posts_per_day']
        
        # Distribute articles across categories based on config
        category_distribution = self.config['content_categories']
        
        for category, percentage in category_distribution.items():
            articles_for_category = max(1, int(target_articles * percentage))
            
            logger.info(f"Generating {articles_for_category} articles for {category}")
            
            # Fetch fresh content
            fresh_content = self.fetch_rss_content(category)
            
            if len(fresh_content) < 2:
                logger.warning(f"Not enough fresh content for {category}, skipping...")
                continue
            
            # Select trending content
            trending_content = self.select_trending_content(category, 3)
            
            if not trending_content:
                logger.warning(f"No trending content found for {category}")
                continue
            
            # Generate article
            article_data = self.generate_article_content(trending_content, category)
            
            if article_data:
                # Save article
                source_ids = [item['id'] for item in trending_content]
                article_id = self.save_article(article_data, source_ids)
                
                if article_id:
                    articles_generated += 1
                    logger.info(f"Generated article: {article_data['title']}")
        
        logger.info(f"Daily content generation complete. Generated {articles_generated} articles.")
        return articles_generated
    
    def get_articles_for_publishing(self) -> List[Dict]:
        """Get articles ready for publishing"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM articles 
            WHERE publish_date <= datetime('now') 
            AND id NOT IN (SELECT article_id FROM published_articles WHERE published = 1)
            ORDER BY publish_date ASC
            LIMIT 5
        ''')
        
        results = cursor.fetchall()
        conn.close()
        
        columns = ['id', 'title', 'content', 'category', 'tags', 'url_slug', 
                  'publish_date', 'source_hash', 'word_count', 'seo_score', 
                  'product_mentions', 'created_at']
        
        return [dict(zip(columns, row)) for row in results]
    
    def setup_scheduler(self):
        """Setup automated content generation schedule"""
        
        # Generate content daily at 6 AM
        schedule.every().day.at("06:00").do(self.generate_daily_content)
        
        # Check for publishing every hour
        schedule.every().hour.do(self.check_and_publish)
        
        logger.info("Scheduler setup complete")
        
        # Keep the scheduler running
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def check_and_publish(self):
        """Check for articles ready to publish (placeholder)"""
        articles = self.get_articles_for_publishing()
        logger.info(f"Found {len(articles)} articles ready for publishing")
        
        # This would integrate with your blog platform (WordPress, Ghost, etc.)
        for article in articles:
            logger.info(f"Would publish: {article['title']}")

def main():
    """Main function to run the blog automation system"""
    
    # Create blog generator
    blog_generator = BlogContentGenerator()
    
    # Generate initial content
    print("🤖 Starting Blog Automation System...")
    print("📊 Generating initial daily content...")
    
    articles_generated = blog_generator.generate_daily_content()
    print(f"✅ Generated {articles_generated} articles")
    
    # Show sample article
    conn = sqlite3.connect(blog_generator.db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT title, category, word_count FROM articles ORDER BY created_at DESC LIMIT 1')
    latest = cursor.fetchone()
    if latest:
        print(f"\n📝 Latest Article: {latest[0]}")
        print(f"   Category: {latest[1]} | Words: {latest[2]}")
    conn.close()
    
    print(f"\n🚀 Blog automation system ready!")
    print(f"   - Will generate {blog_generator.config['posts_per_day']} articles daily")
    print(f"   - Product mention rate: {blog_generator.config['product_mention_chance']*100}%")
    print(f"   - Categories: {', '.join(blog_generator.config['content_categories'].keys())}")
    
    # Uncomment to run continuous scheduler
    # print("⏰ Starting continuous content generation...")
    # blog_generator.setup_scheduler()

if __name__ == "__main__":
    main()