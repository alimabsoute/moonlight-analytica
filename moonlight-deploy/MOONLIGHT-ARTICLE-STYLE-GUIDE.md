# MOONLIGHT ANALYTICA - ARTICLE STYLE GUIDE
**Version**: 2.1
**Created**: January 13, 2025
**Status**: Production Ready

---

## 🚨 CRITICAL DESIGN PRINCIPLES

### **1. CLEAN HEADER RULE (MANDATORY)**
**The header section must ONLY contain basic elements. NO rich content, infographics, or complex visuals.**

```
Header Structure (NON-NEGOTIABLE):
1. Article Title (H1)
2. Meta Information (author, date, read time)
3. Red Separator Line
4. Company Logo (simple image ONLY)
5. Introduction Paragraph
```

### **2. VISUAL/TEXT ALTERNATING PATTERN (MANDATORY)**
**ALL rich content (infographics, charts, diagrams) must appear BELOW the header section.**

```
✅ CORRECT PATTERN:
Header Section → Rich Visual 1 → Text Block → Rich Visual 2 → Text Block

❌ FORBIDDEN PATTERN:
Header Section → Rich Visual 1 → Rich Visual 2 → Long text stream
```

---

## 📏 EXACT SPECIFICATIONS

### **Logo Requirements**
```css
.company-logo-image {
    max-width: 200px;        /* EXACT - never exceed */
    max-height: 80px;        /* EXACT - never exceed */
    object-fit: contain;     /* Maintain aspect ratio */
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Mobile responsive */
@media (max-width: 480px) {
    .company-logo-image {
        max-width: 150px;    /* Mobile size */
    }
}
```

### **Separator Line Requirements**
```css
.separator-line {
    width: 100%;             /* Full width */
    height: 3px;             /* EXACT height */
    background: #dc2626;     /* EXACT red color */
    margin: 1.5rem 0;        /* EXACT margins */
    border-radius: 2px;      /* Subtle rounding */
}
```

### **Typography Standards**
```css
.article-title {
    font-family: 'Poppins', sans-serif;
    font-size: clamp(2rem, 4vw, 3.5rem);
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
    margin-bottom: 1rem;
}

.article-intro p {
    font-size: 1.1rem;       /* Larger than body text */
    line-height: 1.8;        /* More breathing room */
    color: #374151;          /* Slightly lighter than body */
    font-weight: 400;
    text-align: justify;
}
```

---

## 🏗️ HTML TEMPLATE STRUCTURE

### **Complete Header Template**
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

<!-- ALL RICH CONTENT GOES HERE (BELOW HEADER) -->
<div class="article-content">
    <!-- Infographics, charts, diagrams, etc. -->
</div>
```

### **Required CSS Classes**
```css
.article-header {
    margin-bottom: 3rem;
}

.company-logo-section {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2rem 0;
    padding: 1.5rem;
}

.article-intro {
    margin-bottom: 3rem;
    padding: 0 1rem;
}
```

---

## 🎨 COMPANY LOGO MAPPING

### **Logo File Assignments**
| Company | Logo File | Alt Text |
|---------|-----------|----------|
| Intel | `7a.png` | "Intel Strategic Analysis" |
| Amazon | `4a.png` | "Amazon Corporate Analysis" |
| NVIDIA | `5a.png` | "NVIDIA Analysis" |
| OpenAI | `1a.png` | "OpenAI Analysis" |
| Apple | `2a.png` or `10av2.png` | "Apple Analysis" |
| Google | `1a.png` | "Google Analysis" |
| Meta | `6a.png` | "Meta Analysis" |
| General Tech | `8a.png` | "Technology Analysis" |

### **Logo Implementation Rules**
- ✅ **Use simple PNG logos only**
- ❌ **NEVER use SVG infographics in logo section**
- ✅ **Center logos horizontally**
- ❌ **NEVER exceed 200px width**
- ✅ **Include descriptive alt text**

---

## 🚫 COMMON VIOLATIONS & FIXES

### **Violation 1: Logo Size Abuse**
❌ **Wrong**: `max-width: 300px !important`
✅ **Correct**: `max-width: 200px`

### **Violation 2: Wrong Separator Color**
❌ **Wrong**: `background: #3498db` (blue)
✅ **Correct**: `background: #dc2626` (red)

### **Violation 3: Complex Logo Content**
❌ **Wrong**: SVG infographic in logo section
✅ **Correct**: Simple company logo PNG

### **Violation 4: CSS Override Abuse**
❌ **Wrong**: Multiple `!important` declarations
✅ **Correct**: Clean template inheritance

### **Violation 5: Header Content Pollution**
❌ **Wrong**: Charts/diagrams in header section
✅ **Correct**: Rich content below introduction paragraph

---

## 📱 MOBILE RESPONSIVENESS

### **Breakpoints**
```css
/* Tablet */
@media (max-width: 768px) {
    .article-title {
        font-size: 2rem;
    }

    .article-meta {
        flex-wrap: wrap;
        gap: 0.5rem;
    }
}

/* Mobile */
@media (max-width: 480px) {
    .article-title {
        font-size: 1.8rem;
    }

    .company-logo-image {
        max-width: 150px;
    }

    .article-intro {
        padding: 0;
    }
}
```

### **Mobile Requirements**
- ✅ Touch-friendly spacing (minimum 44px targets)
- ✅ Readable font sizes at 320px viewport
- ✅ Logos scale appropriately
- ✅ No horizontal scrolling
- ✅ Proper text wrapping

---

## ⚡ IMPLEMENTATION CHECKLIST

### **Before Creating Any Article**
- [ ] Copy template from `article-header-template.html`
- [ ] Select correct company logo from mapping table
- [ ] Write compelling introduction paragraph
- [ ] Plan visual/text alternating pattern for content

### **Header Implementation**
- [ ] Replace all `{{VARIABLE}}` placeholders
- [ ] Verify logo file exists and is correct company
- [ ] Ensure red separator line (#dc2626)
- [ ] Check logo max-width is 200px
- [ ] Confirm introduction paragraph is substantial

### **Content Organization**
- [ ] Place ALL infographics below header
- [ ] Follow visual → text → visual → text pattern
- [ ] Ensure each visual has explanatory text
- [ ] Verify no content clustering violations

### **Quality Validation**
- [ ] Test mobile responsiveness (320px → 1200px)
- [ ] Verify template compliance
- [ ] Check logo sizing on all devices
- [ ] Confirm separator line visibility
- [ ] Validate content flow and readability

---

## 🏆 GOLD STANDARD EXAMPLE

**File**: `intel-secret-plan-split-500b-semiconductor-war.html`

This article demonstrates **PERFECT** template compliance:
- ✅ Clean header structure
- ✅ Correct Intel logo (7a.png) at 200px width
- ✅ Red separator line (#dc2626)
- ✅ Substantial introduction paragraph
- ✅ Rich content properly placed below header
- ✅ Perfect visual/text alternating pattern
- ✅ Mobile responsive design

**Use this article as the reference template for all future articles.**

---

## 🛠️ TROUBLESHOOTING

### **Problem**: Logo appears too large on mobile
**Solution**: Check CSS has `max-width: 150px` in mobile breakpoint

### **Problem**: Separator line is blue instead of red
**Solution**: Verify CSS uses `background: #dc2626` (not `border-bottom`)

### **Problem**: Content looks cluttered
**Solution**: Ensure visual/text alternating pattern, no content clustering

### **Problem**: Header looks unprofessional
**Solution**: Remove any infographics from header, keep only basic elements

### **Problem**: Template not working
**Solution**: Check for duplicate CSS implementations, remove custom overrides

---

## 📋 QUALITY STANDARDS

### **Template Compliance Score**
- **Gold Standard (100%)**: Intel article level compliance
- **Acceptable (90%+)**: Minor cosmetic issues only
- **Needs Fix (< 90%)**: Structural violations present

### **Must-Pass Requirements**
1. ✅ Logo ≤ 200px width
2. ✅ Red separator line (#dc2626)
3. ✅ Clean header structure
4. ✅ Visual/text alternating pattern
5. ✅ Mobile responsive
6. ✅ No content clustering
7. ✅ Proper company logo usage

---

**Last Updated**: January 13, 2025
**Next Review**: February 2025
**Compliance**: MANDATORY for all Moonlight Analytica articles