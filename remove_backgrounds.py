#!/usr/bin/env python3
"""
Simple Background Removal Script for Tech Logos
Uses rembg library for automatic background removal
"""

import os
import sys
from pathlib import Path
from PIL import Image
import requests
from io import BytesIO

def setup_environment():
    """Install required packages"""
    print("Setting up environment...")
    os.system("pip install --quiet rembg pillow requests")
    print("✅ Environment ready")

def remove_background_from_url(image_url, output_path, company_name=""):
    """Download image from URL and remove background"""
    try:
        from rembg import remove
        
        # Download image
        print(f"  Downloading {company_name}...")
        response = requests.get(image_url, headers={'User-Agent': 'Mozilla/5.0'})
        
        if response.status_code == 200:
            # Open image
            input_image = Image.open(BytesIO(response.content))
            
            # Convert to RGBA if needed
            if input_image.mode != 'RGBA':
                input_image = input_image.convert('RGBA')
            
            # Remove background
            print(f"  Removing background...")
            output_image = remove(input_image)
            
            # Save as PNG
            output_image.save(output_path, 'PNG')
            print(f"  ✅ Saved: {output_path}")
            return True
        else:
            print(f"  ❌ Failed to download {company_name}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error processing {company_name}: {e}")
        return False

def process_logos_simple():
    """Process a simple list of tech company logos"""
    
    # Create output directory
    output_dir = Path("moonlight-analytica/assets/tech-logos")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Sample list of tech companies with their logo URLs
    # You can expand this list or load from CSV
    logos = [
        {
            "company": "Google",
            "url": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
            "filename": "google-logo.png"
        },
        {
            "company": "Microsoft", 
            "url": "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31",
            "filename": "microsoft-logo.png"
        },
        {
            "company": "Apple",
            "url": "https://www.apple.com/ac/globalnav/7/en_US/images/be15095f-5a20-57d0-ad14-cf4c638e223a/globalnav_apple_image__b5er5ngrzxqq_large.svg",
            "filename": "apple-logo.png"
        },
        {
            "company": "Amazon",
            "url": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            "filename": "amazon-logo.png"
        },
        {
            "company": "Meta",
            "url": "https://about.meta.com/brand/resources/meta/logo/",
            "filename": "meta-logo.png"
        },
        # Add more companies as needed
    ]
    
    print(f"\n🚀 Processing {len(logos)} logos...\n")
    
    success_count = 0
    for logo in logos:
        output_path = output_dir / logo["filename"]
        if remove_background_from_url(logo["url"], output_path, logo["company"]):
            success_count += 1
    
    print(f"\n✅ Successfully processed {success_count}/{len(logos)} logos")
    print(f"📁 Logos saved to: {output_dir}")
    
    # Generate preview HTML
    generate_preview_html(output_dir)

def generate_preview_html(logo_dir):
    """Generate a preview HTML file to view all logos"""
    
    logos = list(logo_dir.glob("*.png"))
    
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tech Logos Preview - Moonlight Analytica</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: #faf8f3;
            padding: 40px 20px;
        }
        h1 {
            text-align: center;
            color: #1f2937;
            margin-bottom: 40px;
        }
        .logo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .logo-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .logo-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 191, 255, 0.15);
        }
        .logo-card img {
            width: 100%;
            height: 80px;
            object-fit: contain;
            margin-bottom: 10px;
        }
        .logo-name {
            font-size: 14px;
            color: #6b7280;
            word-break: break-word;
        }
    </style>
</head>
<body>
    <h1>🎨 Tech Logos with Transparent Backgrounds</h1>
    <div class="logo-grid">
"""
    
    for logo_path in logos:
        relative_path = f"assets/tech-logos/{logo_path.name}"
        logo_name = logo_path.stem.replace('-', ' ').replace('_', ' ').title()
        html_content += f"""
        <div class="logo-card">
            <img src="{relative_path}" alt="{logo_name}" loading="lazy">
            <div class="logo-name">{logo_name}</div>
        </div>
"""
    
    html_content += """
    </div>
</body>
</html>
"""
    
    preview_path = Path("moonlight-analytica/tech-logos-preview.html")
    preview_path.write_text(html_content)
    print(f"📄 Preview page created: {preview_path}")

def main():
    """Main function"""
    print("=" * 50)
    print("🎯 BACKGROUND REMOVAL FOR TECH LOGOS")
    print("=" * 50)
    
    # Check if we need to install packages
    try:
        import rembg
        print("✅ Dependencies already installed")
    except ImportError:
        setup_environment()
    
    # Process logos
    process_logos_simple()
    
    print("\n" + "=" * 50)
    print("✨ DONE! Your logos are ready for deployment")
    print("=" * 50)

if __name__ == "__main__":
    main()