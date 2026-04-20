# Article Workflow & Header Guidelines

## Article Structure Format (Google Style)

All Moonlight Analytica articles must follow this exact header structure:

### 1. Clean Header Section
```
1. Article Title (H1)
2. Meta Information (author, date, read time)
3. Red Separator Line
4. Company Logo (centered)
5. Introduction Paragraph
```

### 2. Main Content Section
After the clean header, include all rich content:
- Infographics and visualizations
- Comparison tables and matrices
- Statistical charts and graphs
- Highlight boxes and callouts
- Analysis sections
- Everything creative and engaging

## Header Template Usage

### Required Variables:
- `{{ARTICLE_TITLE}}` - Main article headline
- `{{AUTHOR_NAME}}` - Default: "Moonlight Analytica Team"
- `{{PUBLISH_DATE}}` - Format: "January 15, 2025"
- `{{READ_TIME}}` - Format: "7 min read"
- `{{PREVIEW_IMAGE}}` - Company logo file (e.g., "7a.png")
- `{{PREVIEW_ALT}}` - Alt text for logo
- `{{INTRO_PARAGRAPH}}` - Opening paragraph introducing the topic

### Header Structure:
```html
<header class="article-header">
    <h1 class="article-title">{{ARTICLE_TITLE}}</h1>
    
    <div class="article-meta">
        <div class="author-info">
            <div class="author-avatar">🌙</div>
            <span>{{AUTHOR_NAME}}</span>
        </div>
        <span>•</span>
        <span>{{PUBLISH_DATE}}</span>
        <span>•</span>
        <span>{{READ_TIME}}</span>
    </div>

    <!-- Red Separator Line -->
    <div class="separator-line"></div>

    <!-- Company Logo Section -->
    <div class="company-logo-section">
        <img src="{{PREVIEW_IMAGE}}" alt="{{PREVIEW_ALT}}" class="company-logo-image">
    </div>

    <!-- Introduction Paragraph -->
    <div class="article-intro">
        <p>{{INTRO_PARAGRAPH}}</p>
    </div>
</header>
```

## Image Assets Available

### Preview Card Images (for news.html):
- `1a.png` - OpenAI Analysis
- `2a.png` - iPhone 17 Demo
- `3a.png` - AI Lobbying
- `4a.png` - Amazon Workforce (UPDATED)
- `5a.png` - NVIDIA Blackwell (UPDATED)
- `6a.png` - AI Quality
- `7a.png` - Intel Strategic (UPDATED)
- `8a.png` - Token Arms Race
- `9a.png` - Token Context
- `10av2.png` - Vision Pro (Apple logo + headset)

### Company Logo Mapping:
- Intel articles → `7a.png` (Intel logo)
- Amazon articles → `4a.png` (Amazon logo)
- NVIDIA articles → `5a.png` (NVIDIA logo)
- OpenAI articles → `1a.png`
- Apple articles → `2a.png` or `10av2.png`
- General Tech → `6a.png` or `8a.png`

## Content Guidelines

### Header Rules (STRICT):
1. **NEVER** place infographics directly after title
2. **ALWAYS** include red separator line
3. **ALWAYS** center the company logo
4. **ALWAYS** include introduction paragraph
5. **Keep header clean and professional**

### Content Rules (CREATIVE):
1. **DO** include rich infographics below intro
2. **DO** use comparison tables and charts
3. **DO** create engaging visualizations  
4. **DO** add statistical breakdowns
5. **DO** include analysis highlights
6. **DO** make content visually compelling

## 🚨 CRITICAL: VISUAL/TEXT ALTERNATING PATTERN (MANDATORY) 🚨

### The Fundamental Rule:
**NEVER** have multiple visual elements clustered together. **NEVER** have long streams of text without visual breaks.

### Required Pattern:
```
Header Section
↓
VISUAL ELEMENT 1 (chart/diagram/infographic)
↓ 
SUBSTANTIAL TEXT BLOCK 1 (2-4 paragraphs explaining Visual 1)
↓
VISUAL ELEMENT 2 (different chart/diagram/infographic)  
↓
SUBSTANTIAL TEXT BLOCK 2 (2-4 paragraphs explaining Visual 2)
↓
VISUAL ELEMENT 3 (if exists)
↓
SUBSTANTIAL TEXT BLOCK 3 (2-4 paragraphs explaining Visual 3)
↓
[Continue for N visual elements...]
```

### Clustering Violations (FORBIDDEN):
❌ **NEVER DO THIS:**
- Visual 1 → Visual 2 → Visual 3 → Long text stream
- Multiple charts/diagrams stacked together
- Visual elements appearing consecutively without text separation
- Orphaned visual elements (like single cards below rows)
- Text walls longer than 4 paragraphs without visual breaks

✅ **ALWAYS DO THIS:**  
- Visual 1 → Text Block → Visual 2 → Text Block → Visual 3 → Text Block
- Each visual gets its own corresponding explanatory text
- Substantial text blocks (minimum 2 paragraphs per visual)
- Balanced visual-to-text ratio throughout article

### Implementation Checklist:
- [ ] Count all visual elements in article (charts, diagrams, infographics, cards, highlights)
- [ ] Ensure each visual has dedicated text block following it
- [ ] No visual elements appear consecutively
- [ ] Text blocks are substantial (2-4 paragraphs minimum)
- [ ] Pattern flows smoothly from intro to conclusion
- [ ] Mobile layout maintains alternating pattern

### Style Consistency:
- Use Inter font for body text
- Use Poppins for headings
- Red separator: `#dc2626`
- Logo max-width: 200px, max-height: 80px
- Introduction paragraph: 1.1rem font-size, 1.8 line-height

## File Organization

### Template Files:
- `article-header-template.html` - Complete header template with CSS
- `sample-upgraded-article.html` - Example implementation

### Image Files:
- `Xa.png` - Preview card images (where X = 1-10)
- Company logos embedded in preview images

### News Integration:
- `news.html` - Uses preview images in card format
- Links to individual articles with full header implementation

## Implementation Checklist

For each new article:

- [ ] Copy header template from `article-header-template.html`
- [ ] Replace all `{{VARIABLE}}` placeholders
- [ ] Select appropriate company logo image
- [ ] Write compelling introduction paragraph
- [ ] Add red separator line styling
- [ ] Implement rich content below header
- [ ] Test mobile responsiveness
- [ ] Verify clean header format matches Google style
- [ ] Ensure infographics appear after intro paragraph

## Mobile Optimization

### Responsive Breakpoints:
- **Desktop**: Full layout with large logos
- **Tablet (768px)**: Adjusted font sizes and spacing
- **Mobile (480px)**: Stacked layout, smaller logos

### Mobile Considerations:
- Logo max-width: 150px on mobile
- Font sizes scale appropriately
- Introduction paragraph remains readable
- Red line maintains visibility
- Touch-friendly spacing

## Quality Standards

### Header Quality:
- Professional, clean appearance
- Consistent brand identity
- Proper typography hierarchy
- Clear visual separation

### Content Quality:
- Engaging visual elements
- Data-driven insights
- Interactive components
- Comprehensive analysis
- Professional presentation

---

**Last Updated**: January 2025  
**Template Version**: 2.0  
**Status**: Production Ready