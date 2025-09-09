#!/usr/bin/env python3
"""
Simple Logo Extractor - Export to JSON
Processes HTML file and exports logo data as JSON for manual Supabase import
"""

import json
import re
from pathlib import Path

def categorize_company(company_name: str, image_name: str) -> str:
    """Automatically categorize companies based on name patterns"""
    company_lower = company_name.lower()
    image_lower = image_name.lower()
    
    # AI & Machine Learning
    ai_keywords = ['ai', 'openai', 'anthropic', 'midjourney', 'stability', 'perplexity', 
                   'tensorflow', 'pytorch', 'keras', 'scikit']
    if any(keyword in company_lower or keyword in image_lower for keyword in ai_keywords):
        return "AI & ML"
    
    # Cloud & Infrastructure  
    cloud_keywords = ['aws', 'azure', 'google cloud', 'vercel', 'supabase', 'firebase',
                      'docker', 'kubernetes', 'terraform', 'nginx', 'apache']
    if any(keyword in company_lower or keyword in image_lower for keyword in cloud_keywords):
        return "Cloud & Infrastructure"
    
    # Development Tools
    dev_keywords = ['github', 'gitlab', 'visual studio', 'intellij', 'pycharm', 'webstorm',
                    'sublime', 'postman', 'cursor']
    if any(keyword in company_lower or keyword in image_lower for keyword in dev_keywords):
        return "Development Tools"
    
    # Programming Languages & Frameworks
    lang_keywords = ['javascript', 'typescript', 'python', 'rust', 'java', 'node.js',
                     'react', 'vue', 'angular', 'svelte', 'next.js', 'tailwind']
    if any(keyword in company_lower or keyword in image_lower for keyword in lang_keywords):
        return "Languages & Frameworks"
    
    # Design & Creative
    design_keywords = ['figma', 'sketch', 'adobe', 'canva', 'framer', 'photoshop',
                       'illustrator', 'blender']
    if any(keyword in company_lower or keyword in image_lower for keyword in design_keywords):
        return "Design & Creative"
    
    # Communication & Collaboration
    comm_keywords = ['slack', 'discord', 'notion', 'linear', 'jira', 'trello',
                     'zoom', 'teams', 'meet', 'telegram']
    if any(keyword in company_lower or keyword in image_lower for keyword in comm_keywords):
        return "Communication & Collaboration"
    
    # Social Media & Entertainment
    social_keywords = ['twitter', 'linkedin', 'instagram', 'youtube', 'tiktok', 'reddit',
                       'spotify', 'netflix', 'twitch', 'steam']
    if any(keyword in company_lower or keyword in image_lower for keyword in social_keywords):
        return "Social & Entertainment"
    
    # Database & Analytics
    data_keywords = ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
                     'tableau', 'power bi', 'looker', 'grafana']
    if any(keyword in company_lower or keyword in image_lower for keyword in data_keywords):
        return "Data & Analytics"
    
    # Payment & E-commerce
    payment_keywords = ['stripe', 'paypal', 'shopify']
    if any(keyword in company_lower or keyword in image_lower for keyword in payment_keywords):
        return "Payment & E-commerce"
    
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
        "AI & ML": ["artificial intelligence", "machine learning", "ai", "ml"],
        "Cloud & Infrastructure": ["cloud", "hosting", "infrastructure", "devops"],
        "Development Tools": ["ide", "editor", "development", "coding"],
        "Languages & Frameworks": ["programming", "language", "framework", "library"],
        "Design & Creative": ["design", "ui", "ux", "graphics", "creative"],
        "Communication & Collaboration": ["communication", "chat", "collaboration"],
        "Social & Entertainment": ["social media", "entertainment", "streaming"],
        "Data & Analytics": ["database", "analytics", "data", "visualization"],
        "Payment & E-commerce": ["payment", "ecommerce", "finance"]
    }
    
    if category in category_tags:
        tags.extend(category_tags[category])
    
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
        is_company_logo = company.lower() == image_name.lower() or 'logo' in image_name.lower()
        
        logos.append({
            "company_name": company,
            "image_name": image_name,
            "image_url": url,
            "category": category,
            "is_company_logo": is_company_logo,
            "tags": tags
        })
    
    return logos

def main():
    """Main function"""
    print("=" * 50)
    print("TECH LOGOS JSON EXTRACTOR")
    print("=" * 50)
    
    # Check if HTML file exists
    html_file = Path("tech_logos.html")
    if not html_file.exists():
        print("ERROR: tech_logos.html not found")
        return
    
    print("Reading HTML file...")
    html_content = html_file.read_text(encoding='utf-8')
    
    print("Extracting logo data...")
    logos = extract_logos_from_html(html_content)
    print(f"Found {len(logos)} logos")
    
    if not logos:
        print("ERROR: No logos found in HTML file")
        return
    
    # Save to JSON file
    json_file = Path("moonlight-analytica/tech-logos.json")
    json_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(logos, f, indent=2, ensure_ascii=False)
    
    print(f"SUCCESS: Exported {len(logos)} logos to: {json_file}")
    
    # Show category breakdown
    categories = {}
    for logo in logos:
        cat = logo['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\nCategory Breakdown:")
    for category, count in sorted(categories.items()):
        print(f"  {category}: {count} logos")
    
    print("\nNext steps:")
    print("1. Import tech-logos.json into your Supabase tech_logos table")
    print("2. Use SQL: CREATE TABLE tech_logos (see create_tech_logos_table.sql)")
    print("3. Import JSON data via Supabase dashboard or API")
    
    # Show some samples
    print("\nSample logo data:")
    for i, logo in enumerate(logos[:5]):
        print(f"  {i+1}. {logo['company_name']} ({logo['category']})")
        print(f"     URL: {logo['image_url']}")
        print(f"     Tags: {', '.join(logo['tags'][:3])}...")

if __name__ == "__main__":
    main()