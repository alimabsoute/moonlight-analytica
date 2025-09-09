#!/usr/bin/env python3
"""
Populate Supabase with Tech Company Logos
Processes the HTML file and stores logo data for article integration
"""

import os
import re
import json
from pathlib import Path
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://localhost:54321")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "your_anon_key_here")

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def categorize_company(company_name: str, image_name: str) -> str:
    """Automatically categorize companies based on name patterns"""
    company_lower = company_name.lower()
    image_lower = image_name.lower()
    
    # AI & Machine Learning
    ai_keywords = ['ai', 'openai', 'anthropic', 'midjourney', 'stability', 'perplexity', 
                   'tensorflow', 'pytorch', 'keras', 'scikit', 'machine learning']
    if any(keyword in company_lower or keyword in image_lower for keyword in ai_keywords):
        return "AI & ML"
    
    # Cloud & Infrastructure  
    cloud_keywords = ['aws', 'azure', 'google cloud', 'vercel', 'supabase', 'firebase',
                      'docker', 'kubernetes', 'terraform', 'ansible', 'nginx', 'apache']
    if any(keyword in company_lower or keyword in image_lower for keyword in cloud_keywords):
        return "Cloud & Infrastructure"
    
    # Development Tools
    dev_keywords = ['github', 'gitlab', 'visual studio', 'intellij', 'pycharm', 'webstorm',
                    'sublime', 'atom', 'vim', 'postman', 'insomnia', 'cursor']
    if any(keyword in company_lower or keyword in image_lower for keyword in dev_keywords):
        return "Development Tools"
    
    # Programming Languages & Frameworks
    lang_keywords = ['javascript', 'typescript', 'python', 'rust', 'java', 'node.js',
                     'react', 'vue', 'angular', 'svelte', 'next.js', 'tailwind']
    if any(keyword in company_lower or keyword in image_lower for keyword in lang_keywords):
        return "Languages & Frameworks"
    
    # Design & Creative
    design_keywords = ['figma', 'sketch', 'adobe', 'canva', 'framer', 'photoshop',
                       'illustrator', 'after effects', 'premiere', 'blender']
    if any(keyword in company_lower or keyword in image_lower for keyword in design_keywords):
        return "Design & Creative"
    
    # Communication & Collaboration
    comm_keywords = ['slack', 'discord', 'notion', 'linear', 'jira', 'trello',
                     'zoom', 'teams', 'meet', 'telegram', 'whatsapp']
    if any(keyword in company_lower or keyword in image_lower for keyword in comm_keywords):
        return "Communication & Collaboration"
    
    # Social Media & Entertainment
    social_keywords = ['twitter', 'linkedin', 'instagram', 'youtube', 'tiktok', 'reddit',
                       'spotify', 'netflix', 'twitch', 'steam']
    if any(keyword in company_lower or keyword in image_lower for keyword in social_keywords):
        return "Social & Entertainment"
    
    # Database & Analytics
    data_keywords = ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
                     'tableau', 'power bi', 'looker', 'grafana', 'prometheus']
    if any(keyword in company_lower or keyword in image_lower for keyword in data_keywords):
        return "Data & Analytics"
    
    # Payment & E-commerce
    payment_keywords = ['stripe', 'paypal', 'shopify']
    if any(keyword in company_lower or keyword in image_lower for keyword in payment_keywords):
        return "Payment & E-commerce"
    
    # Default category
    return "Technology"

def generate_tags(company_name: str, image_name: str, category: str) -> list:
    """Generate searchable tags for the logo"""
    tags = []
    
    # Add company name variations
    tags.append(company_name.lower())
    if ' ' in company_name:
        tags.extend(company_name.lower().split())
    
    # Add image name variations
    if image_name != company_name:
        tags.append(image_name.lower())
        if ' ' in image_name:
            tags.extend(image_name.lower().split())
    
    # Add category-based tags
    category_tags = {
        "AI & ML": ["artificial intelligence", "machine learning", "ai", "ml", "neural networks"],
        "Cloud & Infrastructure": ["cloud", "hosting", "infrastructure", "devops", "containers"],
        "Development Tools": ["ide", "editor", "development", "coding", "programming"],
        "Languages & Frameworks": ["programming", "language", "framework", "library", "frontend", "backend"],
        "Design & Creative": ["design", "ui", "ux", "graphics", "creative", "visual"],
        "Communication & Collaboration": ["communication", "chat", "collaboration", "productivity"],
        "Social & Entertainment": ["social media", "entertainment", "streaming", "gaming"],
        "Data & Analytics": ["database", "analytics", "data", "visualization", "business intelligence"],
        "Payment & E-commerce": ["payment", "ecommerce", "finance", "shopping"]
    }
    
    if category in category_tags:
        tags.extend(category_tags[category])
    
    # Remove duplicates and return
    return list(set(tags))

def extract_logos_from_html(html_content: str) -> list:
    """Extract logo data from HTML table"""
    logos = []
    
    # Parse each table row
    rows = re.findall(r'<tr>.*?</tr>', html_content, re.DOTALL)
    
    for row in rows:
        # Skip header row
        if '<th>' in row:
            continue
            
        # Extract company name
        company_match = re.search(r'<td>([^<]+)</td>', row)
        if not company_match:
            continue
        company = company_match.group(1).strip()
        
        # Extract image name (second td)
        tds = re.findall(r'<td>([^<]+)</td>', row)
        if len(tds) < 2:
            continue
        image_name = tds[1].strip()
        
        # Extract image URL
        url_match = re.search(r'src="([^"]+)"', row)
        if not url_match:
            continue
        url = url_match.group(1)
        
        # Categorize and generate tags
        category = categorize_company(company, image_name)
        tags = generate_tags(company, image_name, category)
        
        # Determine if this is a company logo vs product logo
        is_company_logo = company.lower() == image_name.lower() or image_name.lower().endswith('logo')
        
        logos.append({
            "company_name": company,
            "image_name": image_name,
            "image_url": url,
            "category": category,
            "is_company_logo": is_company_logo,
            "tags": tags
        })
    
    return logos

def populate_database(logos: list):
    """Insert logos into Supabase database"""
    supabase = get_supabase_client()
    
    try:
        # Clear existing data (optional - comment out to preserve existing data)
        print("Clearing existing logo data...")
        supabase.table("tech_logos").delete().neq("id", 0).execute()
        
        # Insert logos in batches
        batch_size = 50
        total_inserted = 0
        
        for i in range(0, len(logos), batch_size):
            batch = logos[i:i + batch_size]
            
            print(f"Inserting batch {i//batch_size + 1}: {len(batch)} logos...")
            
            result = supabase.table("tech_logos").insert(batch).execute()
            
            if result.data:
                total_inserted += len(result.data)
                print(f"✅ Successfully inserted {len(result.data)} logos")
            else:
                print(f"❌ Failed to insert batch: {result}")
        
        print(f"\n🎉 Successfully populated database with {total_inserted} logos!")
        
        # Print category breakdown
        category_counts = {}
        for logo in logos:
            category = logo["category"]
            category_counts[category] = category_counts.get(category, 0) + 1
        
        print("\n📊 Category Breakdown:")
        for category, count in sorted(category_counts.items()):
            print(f"  {category}: {count} logos")
            
    except Exception as e:
        print(f"❌ Error populating database: {e}")
        return False
    
    return True

def create_article_helper_functions():
    """Create helper functions for article integration"""
    
    helper_code = '''
# Article Logo Integration Helper Functions
# Add this to your article generation system

def get_logos_for_article(topic_keywords, max_logos=3):
    """
    Get relevant logos for an article based on topic keywords
    
    Args:
        topic_keywords: List of keywords related to the article topic
        max_logos: Maximum number of logos to return
    
    Returns:
        List of logo objects with company_name, image_url, etc.
    """
    from supabase import create_client
    import os
    
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_ANON_KEY")
    )
    
    # Use the database function we created
    result = supabase.rpc("get_article_logos", {"topic_keywords": topic_keywords}).execute()
    
    if result.data:
        return result.data[:max_logos]
    return []

def format_logo_html(logo_data, alt_text="", css_class="article-logo"):
    """
    Generate HTML for logo in article
    
    Args:
        logo_data: Logo object from database
        alt_text: Alternative text for accessibility
        css_class: CSS class for styling
    
    Returns:
        HTML string for the logo
    """
    alt = alt_text or f"{logo_data['company_name']} - {logo_data['image_name']}"
    
    return f'<img src="{logo_data["image_url"]}" alt="{alt}" class="{css_class}" loading="lazy" style="max-width: 100px; height: auto;">'

# Example usage in article generation:
def generate_article_with_logos(topic, content):
    """
    Example of how to integrate logos into article generation
    """
    # Extract keywords from topic
    keywords = topic.lower().split()
    
    # Get relevant logos
    logos = get_logos_for_article(keywords, max_logos=2)
    
    # Add logos to article content
    if logos:
        logo_html = ""
        for logo in logos:
            logo_html += format_logo_html(logo)
        
        # Insert logos after first paragraph or at top
        content = content.replace("</p>", f"</p>\n<div class='article-logos'>{logo_html}</div>", 1)
    
    return content
    '''
    
    # Save helper functions
    helper_file = Path("moonlight-analytica/article-logo-helpers.py")
    helper_file.parent.mkdir(parents=True, exist_ok=True)
    helper_file.write_text(helper_code)
    print(f"📝 Created article integration helpers: {helper_file}")

def main():
    """Main function"""
    print("=" * 60)
    print("🚀 TECH LOGOS DATABASE POPULATION")
    print("=" * 60)
    
    # Check if HTML file exists
    html_file = Path("tech_logos.html")
    if not html_file.exists():
        print("❌ tech_logos.html not found")
        print("Please ensure the HTML file is in the current directory")
        return
    
    # Read and process HTML
    print("📖 Reading HTML file...")
    html_content = html_file.read_text(encoding='utf-8')
    
    print("🔍 Extracting logo data...")
    logos = extract_logos_from_html(html_content)
    print(f"📊 Found {len(logos)} logos to process")
    
    if not logos:
        print("❌ No logos found in HTML file")
        return
    
    # Show sample data
    print("\n📝 Sample logo data:")
    for i, logo in enumerate(logos[:3]):
        print(f"  {i+1}. {logo['company_name']} - {logo['image_name']} ({logo['category']})")
        print(f"     Tags: {', '.join(logo['tags'][:5])}...")
    
    # Populate database
    print(f"\n💾 Populating Supabase database...")
    success = populate_database(logos)
    
    if success:
        # Create helper functions
        create_article_helper_functions()
        
        print("\n" + "=" * 60)
        print("✅ DATABASE POPULATION COMPLETE!")
        print("=" * 60)
        print("🔧 Next steps:")
        print("1. Use get_logos_for_article(['ai', 'openai']) to get relevant logos")
        print("2. Integration helpers saved to: moonlight-analytica/article-logo-helpers.py")
        print("3. Test queries in your Supabase dashboard")
        print("=" * 60)
    else:
        print("\n❌ Database population failed. Check your Supabase connection.")

if __name__ == "__main__":
    main()