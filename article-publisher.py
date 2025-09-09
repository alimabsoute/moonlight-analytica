#!/usr/bin/env python3
"""
Article Publisher - Deploy articles to production site
Converts articles from database to HTML files and deploys them
"""

import os
import json
from pathlib import Path
from datetime import datetime
from supabase import create_client, Client
import re

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "your_anon_key_here")

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_article_html(article):
    """Generate HTML file for an article"""
    
    # Create article slug for filename
    slug = re.sub(r'[^a-zA-Z0-9\s]', '', article['title'])
    slug = re.sub(r'\s+', '-', slug.lower())
    
    # Format publication date
    pub_date = datetime.fromisoformat(article['published_at'].replace('Z', '+00:00'))
    formatted_date = pub_date.strftime("%B %d, %Y")
    
    # Build image section
    images_html = ""
    if article['image_1_url'] or article['image_2_url']:
        images_html = '<div class="article-images">'
        
        if article['image_1_url']:
            alt_text = article['image_1_alt'] or f"{article['title']} - Image 1"
            images_html += f'''
                <img src="{article['image_1_url']}" 
                     alt="{alt_text}" 
                     class="article-image"
                     loading="lazy">
            '''
        
        if article['image_2_url']:
            alt_text = article['image_2_alt'] or f"{article['title']} - Image 2"
            images_html += f'''
                <img src="{article['image_2_url']}" 
                     alt="{alt_text}" 
                     class="article-image"
                     loading="lazy">
            '''
        
        images_html += '</div>'
    
    # Convert content paragraphs
    content_paragraphs = article['content'].split('\n\n')
    content_html = '\n'.join([f'<p>{p.replace(chr(10), "<br>")}</p>' for p in content_paragraphs if p.strip()])
    
    # Generate full HTML
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{article.get('meta_description', article.get('excerpt', ''))}">
    <title>{article.get('meta_title', article['title'])} - Moonlight Analytica</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="{article['title']}">
    <meta property="og:description" content="{article.get('excerpt', '')}">
    <meta property="og:image" content="{article.get('image_1_url', '')}">
    <meta property="og:url" content="https://moonlightanalytica.com/insights/{slug}.html">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{article['title']}">
    <meta name="twitter:description" content="{article.get('excerpt', '')}">
    <meta name="twitter:image" content="{article.get('image_1_url', '')}">
    
    <link rel="stylesheet" href="../styles/article.css">
    <link rel="stylesheet" href="../styles/moonlight-theme.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="main-nav">
        <div class="nav-container">
            <a href="../moonlight-complete-structure.html" class="nav-logo">
                <span class="logo-text">Moonlight Analytica</span>
            </a>
            <div class="nav-links">
                <a href="../moonlight-complete-structure.html">Home</a>
                <a href="../insights.html" class="active">Insights</a>
                <a href="../products.html">Products</a>
                <a href="../contact.html">Contact</a>
            </div>
        </div>
    </nav>

    <!-- Article Content -->
    <main class="article-main">
        <div class="article-container">
            <!-- Article Header -->
            <header class="article-header">
                <div class="article-meta">
                    <span class="article-category">{article.get('category', 'Technology')}</span>
                    <span class="article-date">{formatted_date}</span>
                </div>
                <h1 class="article-title">{article['title']}</h1>
                {f'<p class="article-excerpt">{article["excerpt"]}</p>' if article.get('excerpt') else ''}
                <div class="article-author">
                    <span>By {article.get('author', 'Moonlight Analytica')}</span>
                </div>
            </header>

            <!-- Article Images -->
            {images_html}

            <!-- Article Content -->
            <div class="article-content">
                {content_html}
            </div>

            <!-- Article Footer -->
            <footer class="article-footer">
                <div class="article-tags">
                    {' '.join([f'<span class="tag">#{tag}</span>' for tag in (article.get('tags') or [])]) if article.get('tags') else ''}
                </div>
                <div class="article-share">
                    <h4>Share this article:</h4>
                    <div class="share-buttons">
                        <a href="https://twitter.com/intent/tweet?text={article['title']}&url=https://moonlightanalytica.com/insights/{slug}.html" target="_blank" class="share-btn twitter">Twitter</a>
                        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://moonlightanalytica.com/insights/{slug}.html" target="_blank" class="share-btn linkedin">LinkedIn</a>
                    </div>
                </div>
            </footer>
        </div>
    </main>

    <!-- Back to Insights -->
    <div class="back-to-insights">
        <a href="../insights.html" class="back-link">← Back to All Insights</a>
    </div>

    <!-- Footer -->
    <footer class="site-footer">
        <div class="footer-container">
            <div class="footer-content">
                <div class="footer-brand">
                    <h3>Moonlight Analytica</h3>
                    <p>Premium Analytics Solutions</p>
                </div>
                <div class="footer-links">
                    <a href="../moonlight-complete-structure.html">Home</a>
                    <a href="../insights.html">Insights</a>
                    <a href="../products.html">Products</a>
                    <a href="../contact.html">Contact</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 Moonlight Analytica. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
        // Track article views
        fetch('/api/track-view', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{ articleId: {article['id']} }})
        }}).catch(() => {{}}); // Ignore errors
    </script>
</body>
</html>'''
    
    return html_content, slug

def update_insights_index(articles):
    """Update the main insights page with latest articles"""
    
    # Generate article cards for insights page
    article_cards = ""
    for article in articles[:12]:  # Show latest 12 articles
        pub_date = datetime.fromisoformat(article['published_at'].replace('Z', '+00:00'))
        formatted_date = pub_date.strftime("%B %d, %Y")
        
        slug = re.sub(r'[^a-zA-Z0-9\s]', '', article['title'])
        slug = re.sub(r'\s+', '-', slug.lower())
        
        excerpt = article.get('excerpt', article['content'][:150] + '...')
        
        # Use Image 1 as preview image (typically brand logo), fallback to placeholder
        preview_image = article.get('image_1_url', '')
        image_html = ""
        
        if preview_image:
            image_html = f'''
            <div class="card-image-container">
                <img src="{preview_image}" alt="{article['title']}" class="card-image" loading="lazy">
                <div class="card-overlay">
                    <span class="read-more-overlay">Read Article</span>
                </div>
            </div>'''
        else:
            # Fallback placeholder with category-based gradient
            category_colors = {
                'AI & ML': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'Cloud & Infrastructure': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'Development Tools': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'Web Development': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'Data Analytics': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'Technology News': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            }
            gradient = category_colors.get(article.get('category', 'Technology'), 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
            
            image_html = f'''
            <div class="card-image-container card-placeholder" style="background: {gradient};">
                <div class="placeholder-content">
                    <span class="placeholder-icon">📄</span>
                    <span class="placeholder-category">{article.get('category', 'Article')}</span>
                </div>
                <div class="card-overlay">
                    <span class="read-more-overlay">Read Article</span>
                </div>
            </div>'''
        
        article_cards += f'''
        <article class="insight-card">
            <a href="insights/{slug}.html" class="card-link-wrapper">
                {image_html}
                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">{article.get('category', 'Technology')}</span>
                        <span class="card-date">{formatted_date}</span>
                    </div>
                    <h3 class="card-title">{article['title']}</h3>
                    <p class="card-excerpt">{excerpt}</p>
                    <span class="card-link">Read More →</span>
                </div>
            </a>
        </article>
        '''
    
    # Read current insights.html and update the articles section
    insights_path = Path("moonlight-analytica/insights.html")
    if insights_path.exists():
        content = insights_path.read_text(encoding='utf-8')
        
        # Replace the articles section
        start_marker = '<!-- ARTICLES START -->'
        end_marker = '<!-- ARTICLES END -->'
        
        if start_marker in content and end_marker in content:
            start_index = content.find(start_marker)
            end_index = content.find(end_marker) + len(end_marker)
            
            new_section = f'''{start_marker}
            <div class="insights-grid">
                {article_cards}
            </div>
            {end_marker}'''
            
            updated_content = content[:start_index] + new_section + content[end_index:]
            insights_path.write_text(updated_content, encoding='utf-8')
            print(f"✅ Updated insights index with {len(articles)} articles")
        else:
            print("⚠️ Could not find article markers in insights.html")
    else:
        print("⚠️ insights.html not found")

async def publish_article(article_id):
    """Publish a specific article"""
    supabase = get_supabase_client()
    
    try:
        # Get article from database
        result = supabase.table("articles").select("*").eq("id", article_id).single().execute()
        
        if not result.data:
            print(f"❌ Article {article_id} not found")
            return False
        
        article = result.data
        
        # Generate HTML
        html_content, slug = generate_article_html(article)
        
        # Create insights directory if it doesn't exist
        insights_dir = Path("moonlight-analytica/insights")
        insights_dir.mkdir(parents=True, exist_ok=True)
        
        # Save article HTML file
        article_path = insights_dir / f"{slug}.html"
        article_path.write_text(html_content, encoding='utf-8')
        
        print(f"✅ Published article: {article['title']}")
        print(f"📄 File: {article_path}")
        
        # Update article status to published
        supabase.table("articles").update({
            "status": "published",
            "published_at": datetime.now().isoformat()
        }).eq("id", article_id).execute()
        
        return True
        
    except Exception as e:
        print(f"❌ Error publishing article {article_id}: {e}")
        return False

async def publish_all_pending():
    """Publish all pending articles"""
    supabase = get_supabase_client()
    
    try:
        # Get all pending articles
        result = supabase.table("articles").select("*").eq("status", "pending").execute()
        
        if not result.data:
            print("ℹ️ No pending articles to publish")
            return
        
        published_count = 0
        
        for article in result.data:
            success = await publish_article(article['id'])
            if success:
                published_count += 1
        
        # Update insights index page
        if published_count > 0:
            # Get all published articles for index update
            published_result = supabase.table("articles").select("*").eq("status", "published").order("published_at", desc=True).execute()
            update_insights_index(published_result.data)
        
        print(f"\n✅ Published {published_count} articles successfully!")
        
    except Exception as e:
        print(f"❌ Error publishing articles: {e}")

async def deploy_to_vercel():
    """Deploy updated articles to Vercel"""
    try:
        print("\n🚀 Deploying to Vercel...")
        
        # Add, commit, and push changes
        os.system("git add .")
        os.system(f'git commit -m "Update articles - {datetime.now().strftime("%Y-%m-%d %H:%M")}"')
        os.system("git push")
        
        # Trigger Vercel deployment (if you have Vercel CLI)
        os.system("vercel --prod")
        
        print("✅ Deployment complete!")
        
    except Exception as e:
        print(f"❌ Deployment error: {e}")

if __name__ == "__main__":
    import asyncio
    
    print("=" * 60)
    print("📰 ARTICLE PUBLISHER")
    print("=" * 60)
    
    # You can run specific functions:
    # asyncio.run(publish_article(1))  # Publish specific article
    # asyncio.run(publish_all_pending())  # Publish all pending
    # asyncio.run(deploy_to_vercel())  # Deploy to production
    
    print("Available functions:")
    print("- publish_article(id)")
    print("- publish_all_pending()")
    print("- deploy_to_vercel()")