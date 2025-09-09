#!/usr/bin/env python3
"""
Simple CMS System for Moonlight Analytica
Based on the successful Google Nano Banana article format and preview system.
"""

import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import base64
import re


class ArticleTemplate:
    """Template system based on successful Google Nano Banana article."""
    
    @staticmethod
    def create_full_article(article_data: Dict) -> str:
        """Create full article HTML based on successful template."""
        
        # Extract data with defaults
        title = article_data.get('title', 'Untitled Article')
        subtitle = article_data.get('subtitle', '')
        category = article_data.get('category', 'Tech News')
        content = article_data.get('content', '')
        read_time = article_data.get('read_time', '5 minutes')
        hero_image = article_data.get('hero_image', '')
        date = article_data.get('date', datetime.now().strftime('%B %d, %Y'))
        
        # Create filename-safe slug
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug = re.sub(r'\s+', '-', slug).strip('-')
        filename = f"{slug}.html"
        
        html_template = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Moonlight Analytica</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        :root {{
            --primary-color: #e5e7eb;
            --secondary-color: #f3f4f6;
            --accent-color: #ffffff;
            --text-light: #ffffff;
            --text-dark: #000000;
            --text-muted: #9ca3af;
            --glass-bg: rgba(255, 255, 255, 0.08);
            --glass-border: rgba(255, 255, 255, 0.15);
            --shadow-light: rgba(255, 255, 255, 0.2);
            --shadow-dark: rgba(0, 0, 0, 0.8);
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --info-color: #00bfff;
            --bg-primary: #000000;
            --bg-secondary: #111111;
            --bg-card: rgba(255, 255, 255, 0.03);
            --backdrop-blur: blur(24px);
            --neon-blue: #00bfff;
            --neon-purple: #9945ff;
            --neon-cyan: #87ceeb;
        }}
        
        body {{
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            overflow-x: hidden;
            background: #faf8f3;
            color: #1f2937;
            min-height: 100vh;
        }}
        
        /* Navigation */
        .navbar {{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            padding: 20px 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: var(--backdrop-blur);
            border-bottom: 1px solid rgba(135, 206, 235, 0.2);
        }}
        
        .nav-container {{
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            padding: 0 10px;
            gap: 3rem;
        }}
        
        .logo {{
            font-family: 'Poppins', sans-serif;
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--primary-color);
            text-decoration: none;
            letter-spacing: -0.3px;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.3s ease;
            text-shadow: 0 0 20px rgba(135, 206, 235, 0.4);
            animation: logoPulse 3s ease-in-out infinite;
        }}
        
        .logo:hover {{
            transform: scale(1.05);
            text-shadow: 0 0 30px rgba(135, 206, 235, 0.6);
            animation-duration: 1.5s;
        }}
        
        .logo-icon {{
            width: 50px;
            height: 50px;
            filter: drop-shadow(0 0 10px rgba(135, 206, 235, 0.5));
            animation: iconPulse 3s ease-in-out infinite 1.5s;
        }}
        
        @keyframes logoPulse {{
            0%, 100% {{
                text-shadow: 0 0 20px rgba(135, 206, 235, 0.4);
                color: var(--primary-color);
            }}
            50% {{
                text-shadow: 0 0 50px rgba(135, 206, 235, 1.0), 0 0 80px rgba(70, 130, 180, 0.8);
                color: #00bfff;
            }}
        }}
        
        @keyframes iconPulse {{
            0%, 100% {{
                filter: drop-shadow(0 0 10px rgba(135, 206, 235, 0.5));
            }}
            50% {{
                filter: drop-shadow(0 0 50px rgba(135, 206, 235, 1.0)) drop-shadow(0 0 80px rgba(70, 130, 180, 0.8));
            }}
        }}
        
        .nav-menu {{
            display: flex;
            list-style: none;
            gap: 2.5rem;
            margin-left: auto;
        }}
        
        .nav-link {{
            color: var(--text-light);
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
        }}
        
        .nav-link:hover {{
            color: var(--neon-blue);
            text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
            transform: translateY(-2px);
        }}
        
        /* Article Styles */
        .article-container {{
            max-width: 900px;
            margin: 0 auto;
            padding: 120px 40px 40px;
        }}
        
        .article-header {{
            margin-bottom: 3rem;
        }}
        
        .article-category {{
            background: #3498db;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 20px;
            font-weight: 600;
            font-size: 0.85rem;
        }}
        
        .article-title {{
            font-family: 'Poppins', sans-serif;
            font-size: 2.5rem;
            line-height: 1.2;
            color: #1a1a1a;
            margin-bottom: 20px;
            font-weight: 700;
        }}
        
        .article-subtitle {{
            font-size: 1.25rem;
            color: #555;
            margin-bottom: 30px;
            font-style: italic;
        }}
        
        .article-meta {{
            font-size: 0.9rem;
            color: #7f8c8d;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3498db;
        }}
        
        .hero-image {{
            width: 100%;
            text-align: center;
            margin: 40px 0;
            padding: 40px 0;
            background: transparent !important;
            border-radius: 0;
            box-shadow: none !important;
            border: none !important;
        }}
        
        .article-content h2 {{
            font-family: 'Poppins', sans-serif;
            font-size: 1.8rem;
            color: #2c3e50;
            margin: 40px 0 20px 0;
            font-weight: 600;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }}
        
        .article-content p {{
            margin-bottom: 20px;
            font-size: 1.05rem;
            text-align: justify;
        }}
        
        .lead {{
            font-size: 1.15rem;
            font-weight: 400;
            color: #34495e;
            margin-bottom: 30px;
            line-height: 1.7;
        }}
        
        .stat-box {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            font-family: 'Inter', sans-serif;
        }}
        
        .stat-box h3 {{
            font-size: 2rem;
            margin-bottom: 10px;
        }}
        
        .stat-box p {{
            font-size: 1rem;
            margin: 0;
        }}
        
        .comparison-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            font-family: 'Inter', sans-serif;
        }}
        
        .comparison-table th {{
            background: #2c3e50;
            color: white;
            padding: 15px;
            text-align: left;
        }}
        
        .comparison-table td {{
            padding: 15px;
            border-bottom: 1px solid #ecf0f1;
        }}
        
        .comparison-table tr:nth-child(even) {{
            background: #f8f9fa;
        }}
        
        blockquote {{
            border-left: 4px solid #3498db;
            padding: 15px 20px;
            margin: 25px 0;
            background: #f8f9fa;
            font-style: italic;
        }}
        
        .highlight {{
            background: #fff3cd;
            padding: 2px 4px;
            border-radius: 3px;
        }}
        
        .key-insight {{
            background: #e8f4f8;
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
            border-left: 5px solid #3498db;
        }}
        
        .key-insight h4 {{
            font-family: 'Inter', sans-serif;
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }}
        
        .back-to-news {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--neon-blue);
            text-decoration: none;
            font-weight: 600;
            margin-bottom: 2rem;
            transition: all 0.3s ease;
        }}
        
        .back-to-news:hover {{
            transform: translateX(-5px);
            text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
        }}
        
        @media (max-width: 768px) {{
            .article-container {{
                padding: 120px 20px 40px;
            }}
            
            .article-title {{
                font-size: 2rem;
            }}
            
            .nav-menu {{
                gap: 1.5rem;
            }}
        }}
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <a href="moonlight-complete-structure.html" class="logo">
                <svg class="logo-icon" width="50" height="50" viewBox="0 0 80 80">
                    <defs>
                        <linearGradient id="gradientPhase" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#ffffff">
                                <animate attributeName="stop-color" values="#ffffff;#00bfff;#ffffff" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                            </stop>
                            <stop offset="50%" style="stop-color:#e5e7eb">
                                <animate attributeName="stop-color" values="#e5e7eb;#87ceeb;#e5e7eb" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                            </stop>
                            <stop offset="100%" style="stop-color:#9ca3af">
                                <animate attributeName="stop-color" values="#9ca3af;#4682b4;#9ca3af" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                            </stop>
                        </linearGradient>
                        <filter id="glowFilter">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge> 
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                            <animate attributeName="stdDeviation" values="3;8;3" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                        </filter>
                    </defs>
                    <g transform="translate(40, 40)" filter="url(#glowFilter)">
                        <circle cx="0" cy="0" r="35" fill="none" stroke="url(#gradientPhase)" stroke-width="1" opacity="0.2">
                            <animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" dur="30s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="0" cy="-20" r="6" fill="none" stroke="url(#gradientPhase)" stroke-width="2" opacity="0.8">
                            <animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" dur="8s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.8;1.0;0.8" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="0" cy="-20" r="3" fill="url(#gradientPhase)" opacity="0.9">
                            <animateTransform attributeName="transform" type="rotate" values="0 0 0;360 0 0" dur="8s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.9;1.0;0.9" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="0" cy="25" r="4" fill="none" stroke="url(#gradientPhase)" stroke-width="1.5" opacity="0.6">
                            <animateTransform attributeName="transform" type="rotate" values="0 0 0;-360 0 0" dur="12s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.6;1.0;0.6" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="0" cy="25" r="2" fill="url(#gradientPhase)" opacity="0.7">
                            <animateTransform attributeName="transform" type="rotate" values="0 0 0;-360 0 0" dur="12s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.7;1.0;0.7" dur="3s" begin="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <path d="M -15,-10 A 20,20 0 0,1 15,-10" fill="none" stroke="url(#gradientPhase)" stroke-width="2" opacity="0.4">
                            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="6s" repeatCount="indefinite"/>
                        </path>
                    </g>
                </svg>
                Moonlight Analytica
            </a>
            <ul class="nav-menu">
                <li><a href="moonlight-complete-structure.html" class="nav-link">Home</a></li>
                <li><a href="solutions.html" class="nav-link">Solutions</a></li>
                <li><a href="news.html" class="nav-link">News</a></li>
                <li><a href="contact.html" class="nav-link">Contact</a></li>
            </ul>
        </div>
    </nav>

    <!-- Article Content -->
    <div class="article-container">
        <a href="news.html" class="back-to-news">← Back to News</a>
        
        <div class="article-header">
            <span class="article-category">{category}</span>
            <h1 class="article-title">{title}</h1>
            <p class="article-subtitle">{subtitle}</p>
            <div class="article-meta">
                <strong>Published:</strong> {date} | <strong>Read Time:</strong> {read_time}
            </div>
        </div>

        {hero_image}

        <div class="article-content">
            {content}
        </div>
    </div>
</body>
</html>'''
        
        return html_template, filename
    
    @staticmethod
    def create_news_preview(article_data: Dict) -> str:
        """Create news preview card based on successful format."""
        
        title = article_data.get('title', 'Untitled Article')
        subtitle = article_data.get('subtitle', '')
        category = article_data.get('category', 'Tech News')
        hero_image = article_data.get('preview_image', '')
        slug = article_data.get('slug', 'article')
        date = article_data.get('date', datetime.now().strftime('%B %d, %Y'))
        
        preview_html = f'''
        <article class="featured-article">
            <div class="featured-content">
                <div class="featured-image">
                    {hero_image}
                </div>
                <div class="featured-text">
                    <span class="featured-category">{category}</span>
                    <h3 class="featured-title">{title}</h3>
                    <p class="featured-excerpt">{subtitle}</p>
                    <div class="featured-meta">
                        <span class="featured-date">{date}</span>
                        <a href="{slug}.html" class="read-more-link">Read More →</a>
                    </div>
                </div>
            </div>
        </article>'''
        
        return preview_html


class SimpleCMS:
    """Simple CMS system based on successful manual workflow."""
    
    def __init__(self, base_dir: str = "."):
        self.base_dir = Path(base_dir)
        self.articles_dir = self.base_dir / "articles"
        self.articles_dir.mkdir(exist_ok=True)
        
        # Article metadata storage
        self.metadata_file = self.base_dir / "articles_metadata.json"
        self.load_metadata()
    
    def load_metadata(self):
        """Load existing article metadata."""
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {}
    
    def save_metadata(self):
        """Save article metadata."""
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)
    
    def create_article(self, article_data: Dict) -> str:
        """Create a new article using the successful template."""
        
        # Generate article HTML and filename
        html_content, filename = ArticleTemplate.create_full_article(article_data)
        
        # Save article file
        article_path = self.base_dir / filename
        with open(article_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        # Save metadata
        slug = filename.replace('.html', '')
        self.metadata[slug] = {
            'title': article_data.get('title', 'Untitled'),
            'subtitle': article_data.get('subtitle', ''),
            'category': article_data.get('category', 'Tech News'),
            'date': article_data.get('date', datetime.now().strftime('%B %d, %Y')),
            'filename': filename,
            'created': datetime.now().isoformat(),
            'status': 'published'
        }
        
        self.save_metadata()
        
        return f"Article created successfully: {filename}"
    
    def update_news_page(self):
        """Update the news page with latest articles."""
        
        # Get all published articles, sorted by date
        published_articles = []
        for slug, meta in self.metadata.items():
            if meta.get('status') == 'published':
                published_articles.append((slug, meta))
        
        # Sort by creation date (most recent first)
        published_articles.sort(key=lambda x: x[1].get('created', ''), reverse=True)
        
        # Generate preview cards
        preview_cards = []
        for slug, meta in published_articles[:10]:  # Show latest 10 articles
            
            # Create preview image placeholder (you can customize this)
            preview_image = f'''<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                 color: white; padding: 40px; border-radius: 8px; text-align: center;">
                                 <h4 style="margin: 0; font-size: 1.2rem;">{meta['category']}</h4>
                                </div>'''
            
            preview_data = {
                'title': meta['title'],
                'subtitle': meta['subtitle'],
                'category': meta['category'],
                'date': meta['date'],
                'slug': slug,
                'preview_image': preview_image
            }
            
            preview_cards.append(ArticleTemplate.create_news_preview(preview_data))
        
        # You would integrate this into your existing news.html structure
        return "\\n".join(preview_cards)
    
    def list_articles(self) -> List[Dict]:
        """List all articles with metadata."""
        articles = []
        for slug, meta in self.metadata.items():
            articles.append({
                'slug': slug,
                **meta
            })
        
        return sorted(articles, key=lambda x: x.get('created', ''), reverse=True)


def create_sample_article():
    """Create a sample article using the successful Google Nano Banana format."""
    
    cms = SimpleCMS()
    
    # Sample article data
    article_data = {
        'title': 'The Future of AI-Powered Content Creation',
        'subtitle': 'How automated tools are reshaping digital marketing and content strategy in 2025',
        'category': 'AI & ML',
        'content': '''
            <p class="lead">The landscape of content creation is undergoing a fundamental transformation. As AI-powered tools become more sophisticated and accessible, businesses are discovering new ways to scale their content operations while maintaining quality and authenticity.</p>
            
            <h2>The Current State of AI Content Tools</h2>
            <p>Today's AI content tools have evolved far beyond simple text generation. They now offer comprehensive solutions for visual design, video creation, and even interactive experiences. This evolution has created opportunities for businesses of all sizes to compete on a more level playing field.</p>
            
            <div class="key-insight">
                <h4>Key Insight</h4>
                <p>Companies using AI-powered content creation tools report <strong>40% faster</strong> time-to-market for their campaigns while maintaining quality standards.</p>
            </div>
            
            <h2>Strategic Implementation</h2>
            <p>The most successful companies aren't replacing human creativity with AI—they're augmenting it. By using AI to handle repetitive tasks and generate initial drafts, creative teams can focus on strategy, refinement, and innovation.</p>
            
            <blockquote>
                "AI doesn't replace creativity; it amplifies it. The key is knowing when and how to leverage these tools effectively." - Sarah Johnson, CMO at TechScale
            </blockquote>
            
            <h2>Looking Ahead</h2>
            <p>As we move forward, the companies that will thrive are those that view AI as a collaborative partner rather than a replacement. The future belongs to organizations that can seamlessly blend human insight with machine efficiency.</p>
        ''',
        'hero_image': '''<div class="hero-image" style="background: none;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 60px; border-radius: 12px; text-align: center;">
                <h2 style="margin: 0; font-size: 2rem;">AI Content Creation</h2>
                <p style="margin: 10px 0 0 0; font-size: 1.1rem;">The Future is Here</p>
            </div>
        </div>''',
        'read_time': '8 minutes',
        'date': datetime.now().strftime('%B %d, %Y')
    }
    
    result = cms.create_article(article_data)
    print(result)
    
    # Show how to update news page
    print("\\nNews page preview cards:")
    print(cms.update_news_page())


if __name__ == '__main__':
    print("=== Simple CMS System for Moonlight Analytica ===")
    print("Based on successful Google Nano Banana article format\\n")
    
    create_sample_article()
    
    print("\\n" + "="*60)
    print("CMS System Ready!")
    print("- Creates articles using proven successful template")
    print("- Generates news page previews automatically") 
    print("- Simple metadata management")
    print("- Easy to extend and customize")