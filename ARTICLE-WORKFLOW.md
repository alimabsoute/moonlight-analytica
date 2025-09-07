# Moonlight Analytica Article Creation Workflow

## 📝 Article Template System

### 1. **HTML Template Structure**
Every article follows this consistent structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>[ARTICLE TITLE] - Moonlight Analytica</title>
    <!-- Consistent styling across all articles -->
</head>
<body>
    <!-- Navigation (same across all pages) -->
    <!-- Article Header -->
    <!-- Article Content -->
    <!-- Related Articles -->
    <!-- Footer -->
</body>
</html>
```

### 2. **Content Structure Formula**

Each article follows this proven structure:

#### **Opening Hook (First 2 paragraphs)**
- Start with a shocking stat or controversial statement
- Immediately establish the stakes/importance
- Preview what the reader will learn

#### **Context Section (3-4 paragraphs)**
- Background information
- Why this matters now
- Key players involved

#### **Main Analysis (5-7 paragraphs)**
- Deep dive into the topic
- Data and evidence
- Expert perspectives
- Implications and consequences

#### **Future Outlook (2-3 paragraphs)**
- What happens next
- Timeline predictions
- Action items for readers

#### **Conclusion (1-2 paragraphs)**
- Summarize key takeaways
- Call to action or thought-provoking question

## 🎯 Article Types & Templates

### **1. Breaking News Analysis**
**Example**: "OpenAI o1's Hidden Refusal Pattern"
- Lead with discovery/leak
- Explain technical details simply
- Industry implications
- What it means for users

### **2. Industry Prediction**
**Example**: "10-Million Token Arms Race"
- Start with bold prediction
- Supporting evidence and trends
- Timeline with milestones
- Impact on current solutions

### **3. Corporate Analysis**
**Example**: "Amazon's Shadow Workforce Purge"
- Reveal hidden strategy
- Financial/business implications
- Employee/user impact
- Competitive landscape shifts

### **4. Technology Deep Dive**
**Example**: "NVIDIA's Blackwell Chips Sold Out"
- Technical specifications
- Market dynamics
- Supply chain analysis
- Investment implications

## 📊 Metadata Standards

Every article includes:
```html
<!-- In header -->
<div class="article-category">AI & ML</div>
<h1 class="article-title">[TITLE]</h1>
<div class="article-meta">
    [DATE] • [READ TIME] min read • Moonlight Analytica Research
</div>

<!-- Categories Used -->
- AI & ML
- Hardware
- Corporate Strategy
- Policy & Regulation
- Mobile Technology
- Semiconductors
- Social Media
- VR/AR Technology
```

## 🚀 Writing Workflow

### **Step 1: Topic Selection**
- Check trending topics on:
  - Hacker News
  - TechCrunch
  - Reddit r/technology
  - Twitter tech discussions
- Look for controversial angles
- Focus on future implications

### **Step 2: Research Phase**
- Gather 3-5 primary sources
- Find supporting data/statistics
- Identify expert quotes
- Note contrarian viewpoints

### **Step 3: Headline Creation**
Formula: **[Shocking Fact] + [Unexpected Comparison/Outcome]**
- "The 10-Million Token Arms Race That Will Make ChatGPT Look Like a Calculator"
- "Apple's Ditching the $500 Feature Nobody Wanted"
- "Why ChatGPT Gets Dumber by 2026"

### **Step 4: Writing Process**
1. Write hook first (most important)
2. Outline main points
3. Fill in analysis sections
4. Add data/evidence
5. Write conclusion
6. Review and tighten

### **Step 5: SEO Optimization**
- Primary keyword in title
- Keywords in first 100 words
- Use semantic variations
- Include numbers/dates
- Question-based subheadings

### **Step 6: Visual Elements**
- Hero image or brand logo
- Data visualizations
- Pull quotes
- Section breaks

## 📁 File Management

### Naming Convention:
```
[topic]-[key-angle]-[optional-descriptor].html

Examples:
- openai-o1-refusal-pattern-analysis.html
- nvidia-blackwell-chips-sold-out-2027.html
- big-tech-50m-lobbying-california-ai-bill.html
```

### Storage Structure:
```
moonlight-analytica/
├── index.html (homepage)
├── news.html (news listing)
├── [individual-article].html (each article)
└── assets/
    └── images/
        ├── 1a.png (preview images)
        └── logos/
```

## ✨ Style Guidelines

### **Tone & Voice**
- Authoritative but accessible
- Data-driven arguments
- Slight contrarian angle
- Forward-looking perspective
- No fluff or filler

### **Language Rules**
- Active voice preferred
- Short paragraphs (2-3 sentences)
- Varied sentence structure
- Technical terms explained
- Compelling transitions

### **Formatting Standards**
- Headers every 2-3 paragraphs
- Pull quotes for key insights
- Bold for emphasis sparingly
- Lists for multiple points
- Code blocks for technical content

## 🔄 Publishing Checklist

Before publishing any article:

- [ ] Fact-check all statistics
- [ ] Verify company/product names
- [ ] Check dates and timelines
- [ ] Ensure consistent attribution (Moonlight Analytica Research)
- [ ] Test all links
- [ ] Verify image loading
- [ ] Mobile responsive check
- [ ] SEO meta tags present
- [ ] Read time accurate
- [ ] Category correctly assigned

## 🎨 HTML/CSS Standards

### Color Scheme:
```css
--neon-blue: #00bfff;
--neon-purple: #9945ff;
--neon-cyan: #87ceeb;
--bg-primary: #0f1419;
--text-light: #ffffff;
--text-muted: #9ca3af;
```

### Typography:
- Headlines: Poppins, 700 weight
- Body: Inter, 400 weight
- Code: 'Courier New', monospace

### Responsive Breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 📈 Performance Metrics

Track for each article:
- Page views
- Time on page (target: 3+ minutes)
- Scroll depth (target: 75%+)
- Social shares
- Click-through to related articles

## 🔮 Future Automation Plans

### Phase 1: Semi-Automated (Current)
- Manual topic selection
- AI-assisted writing
- Manual publishing

### Phase 2: Automated Pipeline
- AI topic discovery
- Automated research aggregation
- AI writing with human review
- Scheduled publishing

### Phase 3: Full Automation
- Real-time news monitoring
- Instant article generation
- Auto-publishing with quality gates
- Performance-based optimization

---

## Quick Reference Commands

```bash
# Create new article from template
cp article-template.html new-article-name.html

# Test article locally
python -m http.server 8000

# Deploy article
git add [article].html
git commit -m "Add article: [title]"
git push

# Update all articles with changes
for file in *.html; do
    # Apply bulk changes
done
```

## Need Help?

- Template issues: Check article-template.html
- Style problems: Review existing articles for patterns
- SEO questions: Follow the checklist above
- Publishing errors: Verify file naming and git workflow

Remember: Every article should provide value, insight, and a unique perspective that readers can't find elsewhere.