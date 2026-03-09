"""
Generate printable HTML from PRD.md for Project Janus
Open the HTML in a browser and use Print > Save as PDF
"""
import markdown2
from pathlib import Path

# Read the markdown file
prd_path = Path(__file__).parent / "PRD.md"
with open(prd_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Convert markdown to HTML with extras
html_content = markdown2.markdown(
    md_content,
    extras=[
        "tables",
        "fenced-code-blocks",
        "code-friendly",
        "header-ids",
        "toc",
        "strike",
        "task_list"
    ]
)

# Create full HTML document with print-optimized styling
full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Janus - Product Requirements Document v1.4</title>
    <style>
        /* Print-optimized styles */
        @media print {{
            @page {{
                size: A4;
                margin: 1.5cm;
            }}

            body {{
                font-size: 10pt;
            }}

            h1, h2, h3, h4 {{
                page-break-after: avoid;
            }}

            table, pre, .code-block {{
                page-break-inside: avoid;
            }}

            .no-print {{
                display: none !important;
            }}
        }}

        /* Screen and print styles */
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.65;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 30px;
            background: #fff;
        }}

        /* Header styles */
        h1 {{
            color: #1a1a2e;
            font-size: 26pt;
            border-bottom: 3px solid #007bff;
            padding-bottom: 12px;
            margin-top: 40px;
            margin-bottom: 20px;
        }}

        h1:first-of-type {{
            margin-top: 0;
            font-size: 32pt;
            text-align: center;
            border-bottom: none;
            color: #007bff;
        }}

        h2 {{
            color: #2c3e50;
            font-size: 18pt;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
            margin-top: 35px;
            margin-bottom: 15px;
        }}

        h3 {{
            color: #34495e;
            font-size: 14pt;
            margin-top: 25px;
            margin-bottom: 12px;
        }}

        h4 {{
            color: #5a6c7d;
            font-size: 12pt;
            margin-top: 20px;
            margin-bottom: 10px;
        }}

        /* Paragraph and text */
        p {{
            margin: 12px 0;
            text-align: justify;
        }}

        strong {{
            color: #2c3e50;
        }}

        em {{
            color: #555;
        }}

        /* Tables */
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 9.5pt;
        }}

        th, td {{
            border: 1px solid #ddd;
            padding: 10px 12px;
            text-align: left;
            vertical-align: top;
        }}

        th {{
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
            font-weight: 600;
            color: #2c3e50;
            white-space: nowrap;
        }}

        tr:nth-child(even) {{
            background: #f9f9f9;
        }}

        tr:hover {{
            background: #f0f7ff;
        }}

        /* Code */
        code {{
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 9pt;
            color: #c7254e;
        }}

        pre {{
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 16px 20px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 9pt;
            line-height: 1.5;
            margin: 15px 0;
        }}

        pre code {{
            background: none;
            color: inherit;
            padding: 0;
            font-size: inherit;
        }}

        /* Lists */
        ul, ol {{
            margin: 12px 0;
            padding-left: 28px;
        }}

        li {{
            margin: 6px 0;
        }}

        li > ul, li > ol {{
            margin: 4px 0;
        }}

        /* Blockquotes */
        blockquote {{
            border-left: 4px solid #007bff;
            padding: 10px 20px;
            margin: 20px 0;
            background: #f8f9fa;
            color: #555;
        }}

        /* Horizontal rule */
        hr {{
            border: none;
            border-top: 2px solid #e0e0e0;
            margin: 35px 0;
        }}

        /* Links */
        a {{
            color: #007bff;
            text-decoration: none;
        }}

        a:hover {{
            text-decoration: underline;
        }}

        /* Cover info */
        .cover-info {{
            text-align: center;
            margin: 30px 0 50px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }}

        .cover-info p {{
            text-align: center;
            margin: 5px 0;
            color: #666;
        }}

        /* Print button */
        .print-button {{
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: linear-gradient(145deg, #007bff, #0056b3);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
            z-index: 1000;
        }}

        .print-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
        }}

        /* Footer */
        .footer {{
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #888;
            font-size: 10pt;
        }}
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        Print / Save as PDF
    </button>

    <div class="cover-info no-print">
        <p><strong>Project Janus</strong> - People Tracking Analytics Platform</p>
        <p>Product Requirements Document v1.4</p>
        <p>December 2024</p>
    </div>

    {html_content}

    <div class="footer">
        <p>Project Janus PRD v1.4 | Generated by Claude Code | December 2024</p>
    </div>
</body>
</html>
"""

# Save the HTML file
output_path = Path(__file__).parent / "Project-Janus-PRD-v1.4.html"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(full_html)

print(f"Printable HTML generated: {output_path}")
print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")
print()
print("To create PDF:")
print("1. Open the HTML file in your browser")
print("2. Click 'Print / Save as PDF' button (or Ctrl+P)")
print("3. Select 'Save as PDF' as the destination")
print("4. Click Save")
