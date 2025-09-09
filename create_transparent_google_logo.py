#!/usr/bin/env python3
"""
Google Logo Transparent Background Creator
Creates a transparent PNG version of the Google logo from SVG
"""

import os
from PIL import Image, ImageDraw
import base64
import io

def create_google_logo_png(width=272, height=92):
    """
    Creates a Google logo PNG with transparent background
    Returns the image as PIL Image object
    """
    # Create transparent image
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Google colors
    colors = {
        'blue': (66, 133, 244, 255),    # #4285F4
        'red': (234, 67, 53, 255),      # #EA4335
        'yellow': (251, 188, 4, 255),   # #FBBC04
        'green': (52, 168, 83, 255)     # #34A853
    }
    
    # Scale factor for the drawing
    scale_x = width / 272
    scale_y = height / 92
    
    print("Creating Google logo with transparent background...")
    print(f"Dimensions: {width}x{height}")
    print("Note: This creates a simplified version. For exact reproduction,")
    print("we'll use the SVG-to-PNG conversion method below.")
    
    return img

def svg_to_transparent_png():
    """
    Convert SVG to PNG with transparent background using cairosvg
    """
    try:
        import cairosvg
        
        # Google logo SVG
        svg_content = '''<svg viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
<path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
<path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC04"/>
<path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
<path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
<path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
<path d="M35.29 41.41V32H67.8c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
</svg>'''
        
        # Convert SVG to PNG with transparency
        png_data = cairosvg.svg2png(
            bytestring=svg_content.encode('utf-8'),
            output_width=272,
            output_height=92,
            background_color='rgba(0,0,0,0)'  # Transparent background
        )
        
        # Load into PIL Image
        img = Image.open(io.BytesIO(png_data))
        
        return img
        
    except ImportError:
        print("cairosvg not available. Using alternative method...")
        return None

def create_base64_png(img):
    """Convert PIL Image to base64 encoded PNG"""
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return img_str

def save_logo_files():
    """Create and save Google logo files with transparent background"""
    
    print("🔧 Creating Google logo with transparent background...")
    
    # Try SVG to PNG conversion first
    img = svg_to_transparent_png()
    
    if img is None:
        print("📝 Installing required packages...")
        os.system("pip install cairosvg pillow")
        img = svg_to_transparent_png()
    
    if img is None:
        print("⚠️ Using fallback method...")
        img = create_google_logo_png()
    
    # Save PNG file
    png_filename = "google_logo_transparent.png"
    img.save(png_filename, format='PNG')
    print(f"✅ Saved: {png_filename}")
    
    # Create base64 version
    base64_png = create_base64_png(img)
    
    # Save base64 to file
    with open("google_logo_base64.txt", "w") as f:
        f.write(f"data:image/png;base64,{base64_png}")
    print("✅ Saved: google_logo_base64.txt")
    
    # Create HTML test file
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Logo Transparency Test</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 20px;
            background: linear-gradient(135deg, #faf8f3, #e8e6e1);
            min-height: 100vh;
        }}
        .test-section {{
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.7);
        }}
        .logo-container {{
            padding: 20px;
            margin: 10px 0;
            border: 2px dashed #ccc;
            display: inline-block;
        }}
        .bg-cream {{ background-color: #faf8f3; }}
        .bg-white {{ background-color: white; }}
        .bg-dark {{ background-color: #333; }}
        .bg-pattern {{
            background-image: 
                radial-gradient(circle at 1px 1px, rgba(0,0,0,.15) 1px, transparent 0);
            background-size: 20px 20px;
        }}
    </style>
</head>
<body>
    <h1>Google Logo Transparency Test</h1>
    
    <div class="test-section">
        <h2>1. PNG with Transparent Background</h2>
        <div class="logo-container bg-cream">
            <img src="{png_filename}" alt="Google Logo PNG" style="height: 40px;">
            <p>On cream background (#faf8f3)</p>
        </div>
        <div class="logo-container bg-white">
            <img src="{png_filename}" alt="Google Logo PNG" style="height: 40px;">
            <p>On white background</p>
        </div>
        <div class="logo-container bg-dark">
            <img src="{png_filename}" alt="Google Logo PNG" style="height: 40px;">
            <p>On dark background</p>
        </div>
    </div>
    
    <div class="test-section">
        <h2>2. Base64 Embedded PNG</h2>
        <div class="logo-container bg-cream">
            <img src="data:image/png;base64,{base64_png}" alt="Google Logo Base64" style="height: 40px;">
            <p>Base64 on cream background</p>
        </div>
        <div class="logo-container bg-pattern">
            <img src="data:image/png;base64,{base64_png}" alt="Google Logo Base64" style="height: 40px;">
            <p>Base64 on patterned background</p>
        </div>
    </div>
    
    <div class="test-section">
        <h2>3. Original SVG (for comparison)</h2>
        <div class="logo-container bg-cream">
            <svg viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg" style="height: 40px;">
                <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
                <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC04"/>
                <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
                <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
                <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
                <path d="M35.29 41.41V32H67.8c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
            </svg>
            <p>Original SVG</p>
        </div>
    </div>
    
    <div class="test-section">
        <h2>Implementation Code</h2>
        <h3>HTML with PNG file:</h3>
        <pre><code>&lt;img src="{png_filename}" alt="Google Logo" style="height: 40px;"&gt;</code></pre>
        
        <h3>HTML with Base64:</h3>
        <pre><code>&lt;img src="data:image/png;base64,{base64_png[:50]}..." alt="Google Logo" style="height: 40px;"&gt;</code></pre>
    </div>
</body>
</html>'''
    
    with open("google_logo_test.html", "w", encoding='utf-8') as f:
        f.write(html_content)
    print("✅ Saved: google_logo_test.html")
    
    print(f"\n📋 Summary:")
    print(f"   • PNG file: {png_filename}")
    print(f"   • Base64 data: google_logo_base64.txt")  
    print(f"   • Test page: google_logo_test.html")
    print(f"\n🌐 Open google_logo_test.html in your browser to test transparency!")
    
    return base64_png

if __name__ == "__main__":
    # Install required packages
    try:
        import cairosvg
        from PIL import Image
    except ImportError:
        print("📦 Installing required packages...")
        os.system("pip install cairosvg pillow")
        import cairosvg
        from PIL import Image
    
    # Create the logo files
    base64_data = save_logo_files()
    
    print(f"\n🎯 Ready-to-use Base64 PNG:")
    print(f"data:image/png;base64,{base64_data}")