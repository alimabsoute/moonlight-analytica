"""
Generate PDF from PRD.md for Project Janus
"""
import markdown2
from weasyprint import HTML, CSS
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
        "toc"
    ]
)

# Create full HTML document with styling
full_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Project Janus - Product Requirements Document</title>
</head>
<body>
{html_content}
</body>
</html>
"""

# CSS for professional PDF styling
css = CSS(string="""
    @page {
        size: A4;
        margin: 2cm;
        @bottom-center {
            content: "Project Janus PRD v1.4 - Page " counter(page) " of " counter(pages);
            font-size: 9pt;
            color: #666;
        }
    }

    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
        max-width: 100%;
    }

    h1 {
        color: #1a1a2e;
        font-size: 24pt;
        border-bottom: 3px solid #007bff;
        padding-bottom: 10px;
        margin-top: 30px;
        page-break-after: avoid;
    }

    h2 {
        color: #2c3e50;
        font-size: 18pt;
        border-bottom: 1px solid #ddd;
        padding-bottom: 8px;
        margin-top: 25px;
        page-break-after: avoid;
    }

    h3 {
        color: #34495e;
        font-size: 14pt;
        margin-top: 20px;
        page-break-after: avoid;
    }

    h4 {
        color: #5a6c7d;
        font-size: 12pt;
        margin-top: 15px;
        page-break-after: avoid;
    }

    p {
        margin: 10px 0;
        text-align: justify;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 10pt;
        page-break-inside: auto;
    }

    tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }

    th, td {
        border: 1px solid #ddd;
        padding: 8px 10px;
        text-align: left;
    }

    th {
        background: #f8f9fa;
        font-weight: 600;
        color: #2c3e50;
    }

    tr:nth-child(even) {
        background: #f9f9f9;
    }

    code {
        background: #f4f4f4;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 9pt;
        color: #c7254e;
    }

    pre {
        background: #2d2d2d;
        color: #f8f8f2;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
        font-size: 9pt;
        line-height: 1.4;
        page-break-inside: avoid;
    }

    pre code {
        background: none;
        color: inherit;
        padding: 0;
    }

    ul, ol {
        margin: 10px 0;
        padding-left: 25px;
    }

    li {
        margin: 5px 0;
    }

    blockquote {
        border-left: 4px solid #007bff;
        padding-left: 15px;
        margin: 15px 0;
        color: #666;
        font-style: italic;
    }

    hr {
        border: none;
        border-top: 1px solid #ddd;
        margin: 30px 0;
    }

    strong {
        color: #2c3e50;
    }

    a {
        color: #007bff;
        text-decoration: none;
    }

    /* Special styling for status indicators */
    td:last-child {
        white-space: nowrap;
    }

    /* Cover page styling */
    body > h1:first-child {
        font-size: 32pt;
        text-align: center;
        border: none;
        margin-top: 100px;
        margin-bottom: 20px;
    }
""")

# Generate PDF
output_path = Path(__file__).parent / "Project-Janus-PRD-v1.4.pdf"
HTML(string=full_html).write_pdf(output_path, stylesheets=[css])

print(f"PDF generated: {output_path}")
print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")
