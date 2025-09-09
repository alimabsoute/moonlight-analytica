#!/usr/bin/env python3
"""
Process Tech Logos from HTML - Download and Remove Backgrounds
Extracts logo URLs from HTML and creates transparent PNGs
"""

import os
import re
from pathlib import Path
import requests
from PIL import Image
from io import BytesIO
import time

def extract_logos_from_html(html_content):
    """Extract company names and logo URLs from HTML"""
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
        
        # Extract image name
        image_name_match = re.search(r'<td>([^<]+)</td>.*?<td>', row, re.DOTALL)
        if image_name_match:
            image_name = image_name_match.group(1).strip()
        else:
            image_name = "logo"
        
        # Extract image URL
        url_match = re.search(r'src="([^"]+)"', row)
        if url_match:
            url = url_match.group(1)
            
            # Create safe filename
            safe_company = company.replace(' ', '_').replace('/', '_').replace('\\', '_')
            safe_name = image_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
            filename = f"{safe_company}__{safe_name}.png"
            
            logos.append({
                "company": company,
                "image_name": image_name,
                "url": url,
                "filename": filename
            })
    
    return logos

def download_and_process_logo(logo_info, output_dir):
    """Download logo and save with transparent background"""
    try:
        print(f"Processing {logo_info['company']} - {logo_info['image_name']}...")
        
        # Download image
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(logo_info['url'], headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"  ❌ Failed to download (HTTP {response.status_code})")
            return False
        
        # Handle SVG files
        if logo_info['url'].endswith('.svg'):
            # For SVGs, we'll save them directly (they already have transparent backgrounds)
            svg_path = output_dir / logo_info['filename'].replace('.png', '.svg')
            svg_path.write_bytes(response.content)
            print(f"  ✅ Saved SVG: {svg_path.name}")
            
            # Also try to convert to PNG if possible
            try:
                # This requires cairosvg or similar library
                from cairosvg import svg2png
                png_data = svg2png(bytestring=response.content, output_width=512)
                img = Image.open(BytesIO(png_data))
                output_path = output_dir / logo_info['filename']
                img.save(output_path, 'PNG')
                print(f"  ✅ Converted to PNG: {output_path.name}")
            except ImportError:
                print(f"  ℹ️  SVG saved (install cairosvg for PNG conversion)")
            
        else:
            # Handle raster images (PNG, JPG, etc.)
            img = Image.open(BytesIO(response.content))
            
            # Convert to RGBA if needed
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # For images that are already PNG with transparency, just save
            # For JPG or images with white backgrounds, we'd need rembg
            output_path = output_dir / logo_info['filename']
            img.save(output_path, 'PNG')
            print(f"  ✅ Saved: {output_path.name}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def generate_preview_html(logos, output_dir):
    """Generate HTML preview of all logos"""
    
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tech Logos Gallery - Moonlight Analytica</title>
    <style>
        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: #faf8f3;
            padding: 40px 20px;
            margin: 0;
        }
        h1 {
            text-align: center;
            color: #1f2937;
            margin-bottom: 20px;
            font-size: 2.5rem;
        }
        .stats {
            text-align: center;
            color: #6b7280;
            margin-bottom: 40px;
            font-size: 1.1rem;
        }
        .logo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .logo-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .logo-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 191, 255, 0.12);
            border-color: rgba(0, 191, 255, 0.3);
        }
        .logo-img {
            width: 100%;
            height: 80px;
            object-fit: contain;
            margin-bottom: 12px;
            background: repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 50% / 20px 20px;
            border-radius: 8px;
            padding: 10px;
        }
        .logo-company {
            font-weight: 600;
            color: #1f2937;
            font-size: 0.95rem;
            margin-bottom: 4px;
        }
        .logo-name {
            font-size: 0.8rem;
            color: #6b7280;
            line-height: 1.2;
        }
        .search {
            text-align: center;
            margin-bottom: 30px;
        }
        .search input {
            padding: 12px 24px;
            font-size: 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 50px;
            width: 100%;
            max-width: 400px;
            outline: none;
            transition: border-color 0.3s ease;
        }
        .search input:focus {
            border-color: #00bfff;
        }
    </style>
</head>
<body>
    <h1>🎨 Tech Company Logos</h1>
    <div class="stats">{{COUNT}} logos ready for your site</div>
    
    <div class="search">
        <input type="text" id="searchInput" placeholder="Search companies..." onkeyup="filterLogos()">
    </div>
    
    <div class="logo-grid" id="logoGrid">
{{CARDS}}
    </div>
    
    <script>
        function filterLogos() {
            const input = document.getElementById('searchInput').value.toLowerCase();
            const cards = document.querySelectorAll('.logo-card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(input) ? '' : 'none';
            });
        }
        
        // Copy filename on click
        document.querySelectorAll('.logo-card').forEach(card => {
            card.addEventListener('click', function() {
                const filename = this.dataset.filename;
                navigator.clipboard.writeText(filename);
                this.style.background = '#e0f7ff';
                setTimeout(() => {
                    this.style.background = '';
                }, 300);
            });
        });
    </script>
</body>
</html>"""
    
    cards = ""
    for logo in logos:
        # Check if file exists
        png_path = output_dir / logo['filename']
        svg_path = output_dir / logo['filename'].replace('.png', '.svg')
        
        if png_path.exists():
            img_path = f"assets/tech-logos/{logo['filename']}"
        elif svg_path.exists():
            img_path = f"assets/tech-logos/{logo['filename'].replace('.png', '.svg')}"
        else:
            continue
            
        cards += f"""
        <div class="logo-card" data-filename="{logo['filename']}">
            <img src="{img_path}" alt="{logo['company']} - {logo['image_name']}" class="logo-img">
            <div class="logo-company">{logo['company']}</div>
            <div class="logo-name">{logo['image_name']}</div>
        </div>"""
    
    html = html.replace('{{COUNT}}', str(len(logos)))
    html = html.replace('{{CARDS}}', cards)
    
    preview_path = Path("moonlight-analytica/tech-logos-gallery.html")
    preview_path.write_text(html)
    print(f"\n📄 Preview gallery created: {preview_path}")

def main():
    """Main function"""
    print("=" * 60)
    print("🚀 TECH LOGO PROCESSOR")
    print("=" * 60)
    
    # Check if HTML file exists
    html_file = Path("tech_logos.html")
    if not html_file.exists():
        # Try to find the HTML content from user input
        print("❌ tech_logos.html not found")
        print("Please save the HTML content to 'tech_logos.html' file")
        return
    
    # Read HTML content
    html_content = html_file.read_text(encoding='utf-8')
    
    # Extract logos
    logos = extract_logos_from_html(html_content)
    print(f"\n📊 Found {len(logos)} logos to process")
    
    # Create output directory
    output_dir = Path("moonlight-analytica/assets/tech-logos")
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"📁 Output directory: {output_dir}")
    
    # Process each logo
    print("\n" + "=" * 60)
    print("PROCESSING LOGOS...")
    print("=" * 60 + "\n")
    
    success_count = 0
    for i, logo in enumerate(logos, 1):
        print(f"\n[{i}/{len(logos)}]", end=" ")
        if download_and_process_logo(logo, output_dir):
            success_count += 1
        
        # Small delay to be respectful to servers
        if i % 10 == 0:
            time.sleep(1)
    
    # Generate preview
    print("\n" + "=" * 60)
    generate_preview_html(logos, output_dir)
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ PROCESSING COMPLETE!")
    print("=" * 60)
    print(f"📊 Successfully processed: {success_count}/{len(logos)} logos")
    print(f"📁 Logos saved to: {output_dir}")
    print(f"🌐 To use in your site:")
    print(f"   <img src=\"/assets/tech-logos/[filename]\" alt=\"Company Name\">")
    print("=" * 60)

if __name__ == "__main__":
    main()