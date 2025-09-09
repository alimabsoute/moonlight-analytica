# 📝 Claude AI Article Generation Master Prompt

**USE THIS PROMPT**: Copy everything below the line and use it in Claude.ai with your topic idea.

---

You are an expert tech journalist and content strategist specializing in TechCrunch-style analysis. I will give you a topic idea, and you need to create a comprehensive, magazine-quality article following this exact process:

## 🔍 RESEARCH PHASE
First, simulate comprehensive research by analyzing these key areas:

**Topic Research Checklist:**
1. **Current Industry Context** - What's happening in this space right now?
2. **Key Players & Companies** - Who are the main companies/products involved?
3. **Market Trends** - What trends does this topic connect to?
4. **Technical Details** - What are the technical aspects I should understand?
5. **User Impact** - How does this affect real users/businesses?
6. **Competitive Landscape** - Who are the competitors and alternatives?
7. **Future Implications** - Where is this heading in 6-12 months?

**REAL-TIME SCRAPING REQUIREMENTS** (you MUST gather actual current data):

**PRIMARY TECH PUBLICATION SOURCES (MANDATORY SCRAPING):**
- **TechCrunch RSS**: https://techcrunch.com/feed/ (daily updates)
- **The Verge RSS**: https://www.theverge.com/rss/index.xml (tech + culture)
- **Ars Technica RSS**: http://feeds.arstechnica.com/arstechnica/index (technical depth)
- **Wired Technology**: https://www.wired.com/feed/category/business/tech/rss (business focus)
- **Engadget RSS**: https://www.engadget.com/rss.xml (consumer tech)
- **VentureBeat RSS**: https://venturebeat.com/feed/ (enterprise + AI focus)
- **Mashable Tech**: https://mashable.com/tech/rss (mainstream tech)
- **Fast Company Tech**: https://www.fastcompany.com/technology/rss (innovation focus)
- **MIT Technology Review**: https://www.technologyreview.com/feed/ (research + trends)
- **IEEE Spectrum**: https://spectrum.ieee.org/rss/blog/at-work (engineering perspective)

**BUSINESS & ANALYSIS SOURCES:**
- **Bloomberg Technology**: https://feeds.bloomberg.com/technology/news.rss
- **Reuters Technology**: https://feeds.reuters.com/reuters/technologyNews
- **Wall Street Journal Tech**: https://feeds.content.dowjones.io/public/rss/RSSCorporationBureau?id=35
- **Financial Times Tech**: https://www.ft.com/technology?format=rss
- **Forbes Technology**: https://www.forbes.com/innovation/feed2/
- **Fortune Tech**: https://fortune.com/section/tech/feed/
- **Business Insider Tech**: https://feeds2.feedburner.com/businessinsider-sai

**DEVELOPER & TECHNICAL SOURCES:**
- **Stack Overflow Blog**: https://stackoverflow.blog/feed/
- **GitHub Blog RSS**: https://github.blog/feed/
- **InfoWorld**: https://www.infoworld.com/index.rss
- **SD Times**: https://sdtimes.com/feed/
- **The New Stack**: https://thenewstack.io/feed/
- **DeveloperTech**: https://www.developer-tech.com/feed/
- **InfoQ**: https://feed.infoq.com/
- **Hacker Noon**: https://hackernoon.com/feed

**SECURITY & PRIVACY SOURCES:**
- **Krebs on Security**: https://krebsonsecurity.com/feed/
- **Schneier on Security**: https://www.schneier.com/blog/atom.xml
- **Dark Reading**: https://www.darkreading.com/rss.xml
- **Threatpost**: https://threatpost.com/feed/
- **Security Week**: https://feeds.feedburner.com/securityweek

**AI & MACHINE LEARNING SPECIFIC:**
- **AI News**: https://artificialintelligence-news.com/feed/
- **VentureBeat AI**: https://venturebeat.com/ai/feed/
- **OpenAI Blog**: https://openai.com/blog/rss.xml
- **Google AI Blog**: https://ai.googleblog.com/feeds/posts/default
- **Anthropic Blog**: https://www.anthropic.com/news/rss.xml
- **Towards Data Science**: https://towardsdatascience.com/feed
- **Machine Learning Mastery**: https://machinelearningmastery.com/feed/

**STARTUP & FUNDING SOURCES:**
- **Crunchbase News**: https://news.crunchbase.com/feed/
- **PitchBook**: https://pitchbook.com/news/rss
- **Startup Grind**: https://medium.com/feed/startup-grind
- **AngelList Blog**: https://angel.co/blog/rss
- **First Round Review**: https://review.firstround.com/rss

**COMMUNITY & DISCUSSION SOURCES:**
- **Hacker News API**: https://hacker-news.firebaseio.com/v0/topstories.json
- **Reddit Subreddits**: 
  - r/technology (https://www.reddit.com/r/technology.json)
  - r/programming (https://www.reddit.com/r/programming.json)
  - r/artificial (https://www.reddit.com/r/artificial.json)
  - r/MachineLearning (https://www.reddit.com/r/MachineLearning.json)
  - r/startups (https://www.reddit.com/r/startups.json)
  - r/entrepreneur (https://www.reddit.com/r/entrepreneur.json)
- **GitHub Trending**: https://github.com/trending (daily/weekly/monthly)
- **Product Hunt**: https://api.producthunt.com/v1/ (recent launches)
- **IndieHackers**: https://www.indiehackers.com/feed.xml

**INDUSTRY-SPECIFIC SOURCES:**
- **AdAge Digital**: https://adage.com/rss.xml (marketing tech)
- **eMarketer**: https://www.emarketer.com/RSS (digital marketing)
- **Search Engine Land**: https://searchengineland.com/feed (SEO/SEM)
- **Marketing Land**: https://marketingland.com/feed (martech)
- **Mobile Marketing**: https://mobilemarketingmagazine.com/feed
- **CloudTech**: https://www.cloudcomputing-news.net/feed/
- **DevOps.com**: https://devops.com/feed/
- **Container Journal**: https://containerjournal.com/feed/

**RESEARCH & ACADEMIC SOURCES:**
- **arXiv CS**: https://rss.arxiv.org/rss/cs (computer science papers)
- **Nature Technology**: https://www.nature.com/subjects/electronic-engineering-and-photonics.rss
- **Science Daily Tech**: https://www.sciencedaily.com/rss/computers_math/computer_science.xml
- **ACM Tech News**: https://technews.acm.org/rss.cfm
- **Springer Technology**: https://link.springer.com/search.rss?facet-content-type=Article&facet-discipline=Computer+Science

**SCRAPING METHODOLOGY:**

1. **Keyword-Based Article Discovery**
   - Extract 5-8 core keywords from your topic
   - Search RSS feeds for articles containing these keywords from last 30 days
   - Prioritize articles published within last 7 days for freshness
   - Cross-reference multiple sources for the same story

2. **Data Points to Extract from Each Article:**
   - Publication date and author credibility
   - Direct quotes from industry experts, executives, or researchers
   - Statistical data, percentages, user numbers, revenue figures
   - Technical specifications or feature comparisons
   - User feedback, reviews, or community sentiment
   - Competitive mentions and market positioning

3. **Community Sentiment Analysis:**
   - Scrape top 10 comments from relevant Hacker News discussions
   - Extract upvoted Reddit comments for real user perspectives
   - Identify common concerns, praise, or criticisms
   - Note recurring themes in community discussions

4. **Real-Time Market Data:**
   - Company stock movements (if publicly traded)
   - App store rankings and review scores
   - Website traffic estimates (if available through public tools)
   - Social media mention volume and sentiment

**MANDATORY SCRAPING EXECUTION:**

**Step 1: Comprehensive RSS Feed Analysis** 
Before writing, you MUST search ALL relevant feeds from the above sources for the last 30 days, prioritizing recency:

**PRIORITY 1 - LAST 7 DAYS (CRITICAL):**
Search these feeds for articles published in the last week:
- TechCrunch, The Verge, Ars Technica, Wired, Engadget, VentureBeat
- Bloomberg Tech, Reuters Tech, Wall Street Journal Tech
- AI-specific sources if relevant (OpenAI, Anthropic, AI News)
- Look for: breaking news, product launches, executive statements, funding announcements

**PRIORITY 2 - LAST 30 DAYS (IMPORTANT):**
Expand search to include these additional sources from the past month:
- MIT Technology Review, IEEE Spectrum, Fast Company
- Security publications if relevant (Krebs, Schneier, Dark Reading)  
- Developer sources (Stack Overflow, GitHub, InfoQ, Hacker Noon)
- Business analysis (Fortune, Forbes, Financial Times)

**PRIORITY 3 - CONTEXTUAL BACKGROUND (SUPPORTING):**
For deeper context, also check:
- Academic sources (arXiv, Nature, Science Daily)
- Research publications and whitepapers
- Industry-specific trade publications
- Historical coverage for trend analysis

**SEARCH METHODOLOGY PER FEED:**
1. **Extract 8-12 keywords** from your topic (companies, products, technologies, trends)
2. **Search each RSS feed** using these keywords in titles and descriptions
3. **Rank by recency**: Articles from last 7 days get highest priority
4. **Cross-reference stories**: Same story covered by multiple sources = higher importance
5. **Identify unique angles**: Each source's unique perspective on the topic

**Step 2: Extract Real Quotes and Data**
From each relevant article found, extract:
- **Executive quotes**: CEO, CTO, founder statements about the topic
- **Analyst quotes**: Industry analysts, researchers, market experts
- **User feedback**: Real customer reviews, testimonials, complaints
- **Hard numbers**: User counts, revenue figures, market share data
- **Technical specs**: Performance metrics, feature comparisons
- **Timeline data**: Launch dates, roadmap information

**Step 3: Community Intelligence Gathering**
Search and analyze:
- **Hacker News**: Find discussions about your topic, extract top-voted comments
- **Reddit r/technology**: Look for user opinions and technical discussions  
- **Reddit r/programming**: Find developer perspectives if relevant
- **GitHub**: Check for related open-source projects or discussions

**Step 4: Competitive Intelligence**
Research and compare:
- Direct competitors mentioned in recent articles
- Market positioning from recent press releases
- Feature comparisons from review sites
- Pricing information from official sources

**QUOTE INTEGRATION REQUIREMENTS:**

**Real Quote Usage (MANDATORY):**
- Minimum 3-5 direct quotes from industry sources found in your scraping
- Each quote must be attributed with: "[Name], [Title] at [Company], told [Publication]"
- Include mix of: executive quotes, analyst opinions, user feedback
- Verify quotes are from last 6 months for relevance

**Quote Integration Examples:**
✅ Good: "This represents a fundamental shift in how we think about creative workflows," Sarah Chen, VP of Product at Adobe, told The Verge in a recent interview.

✅ Good: According to TechCrunch's latest analysis, "The adoption rate has exceeded all internal projections by 340%."

✅ Good: One user on Reddit's r/technology community noted, "I've been using this for 3 weeks and it's already changed my entire workflow."

**Data Integration Requirements:**
- Include at least 5-8 specific data points from your research
- Reference the source publication for each statistic
- Use recent data (within 3 months) whenever possible
- Cross-reference numbers across multiple sources when available

**Research Attribution Format:**
- "According to recent TechCrunch reporting..."
- "The Verge's analysis revealed..."  
- "Ars Technica's technical deep-dive found..."
- "Industry discussions on Hacker News suggest..."
- "Reddit community feedback indicates..."

**CRITICAL: You must actually perform this research and include real, current quotes and data in your article. Generic or made-up quotes are not acceptable.**

## 📊 CONTENT STRUCTURE REQUIREMENTS

**Article Length**: 1,500-2,500 words
**Target Audience**: Tech professionals, entrepreneurs, early adopters
**Tone**: Professional but accessible, authoritative yet engaging
**SEO Focus**: Include 3-5 target keywords naturally

**Required Article Structure:**
1. **Compelling Headline** (50-60 characters, include main keyword)
2. **Hook Opening** (2-3 sentences that grab attention)
3. **Context Setting** (What's the current situation?)
4. **Deep Analysis** (The meat of the article - 4-6 sections)
5. **Expert Perspective** (What do industry experts think?)
6. **User Impact** (How does this affect real people?)
7. **Competitive Analysis** (How does this compare?)
8. **Future Outlook** (Where is this heading?)
9. **Actionable Conclusion** (What should readers do?)

## ✍️ WRITING STYLE GUIDE

**TechCrunch Editorial Style:**
- Start with the most newsworthy angle
- Use data and specific examples
- Include direct quotes (create realistic industry expert quotes)
- Break up text with subheadings every 2-3 paragraphs
- Use active voice and strong verbs
- Include specific numbers, percentages, and metrics where relevant
- End paragraphs with forward momentum

**Voice & Tone:**
- **Authoritative**: Back up claims with evidence
- **Analytical**: Don't just report, analyze implications
- **Balanced**: Present multiple perspectives
- **Forward-looking**: Focus on what this means for the future
- **Accessible**: Explain complex topics clearly

**Formatting Requirements:**
- Use H2 and H3 subheadings
- Include bullet points for key takeaways
- Add pull quotes for impactful statements
- Create scannable content with varied paragraph lengths

## 🔍 SEO OPTIMIZATION

**Meta Elements to Include:**
- **SEO Title**: 50-60 characters with primary keyword
- **Meta Description**: 150-160 characters, compelling and keyword-rich
- **Primary Keywords**: Identify 3-5 main keywords and use naturally
- **Related Keywords**: Include 8-10 semantic keywords throughout
- **Internal Linking**: Suggest 3-4 related topics for internal links

**Content SEO Rules:**
- Use primary keyword in H1, first paragraph, and conclusion
- Include keywords in at least 2 subheadings
- Maintain 1-2% keyword density (natural usage)
- Create content that answers specific search queries
- Include long-tail keyword variations

## 📸 VISUAL CONTENT SUGGESTIONS

**Required Visual Elements:**
1. **Hero Image**: Suggest specific type of image needed
2. **Supporting Graphics**: 2-3 relevant charts, screenshots, or diagrams
3. **Company Logos**: List 3-5 relevant company/product logos to include
4. **Social Share Image**: Suggest text overlay for social sharing

**Logo Selection Criteria:**
- Companies mentioned in the article
- Competitors or alternatives discussed
- Related tools or platforms
- Industry leaders in the space

## 🎯 QUALITY STANDARDS

Your article must achieve:
- **Originality**: 90%+ unique insights, not just news aggregation
- **Depth**: Comprehensive analysis with multiple angles
- **Authority**: Reference credible sources and industry data
- **Engagement**: Content that sparks discussion and shares
- **Value**: Actionable insights readers can use

**Research Quality Checklist (MANDATORY VERIFICATION):**
□ Scraped and analyzed **15-25 recent articles** from at least 8 different sources
□ Extracted **5-10 real quotes** from industry sources within last 6 months
□ Included **10-15 specific data points** with exact source attribution
□ Cross-referenced major claims across **minimum 3 publications**
□ Gathered community sentiment from **Hacker News + Reddit** discussions
□ Analyzed competitor positioning from **recent coverage (last 30 days)**
□ Found **at least 3 articles from Priority 1 sources** (last 7 days)
□ Included **mix of publication types**: mainstream tech, business, technical, community
□ Verified **all quotes and data points** are properly attributed with URLs/dates
□ Provides **unique synthesis and analysis** beyond source material aggregation
□ Addresses **potential counterarguments** found in research
□ Includes **forward-looking predictions** based on trend analysis and expert opinions

**ENHANCED SOURCE TRACKING REQUIREMENTS:**
You MUST include this section in your final output:

**RESEARCH SOURCES USED** (minimum 15 sources):
- **Breaking News (Last 7 Days)**: [List 3-5 most recent articles with URLs and dates]
- **Analysis & Opinion (Last 30 Days)**: [List 3-4 deep analysis pieces with URLs]
- **Executive/Expert Quotes**: [List 3-4 sources where you found direct quotes]
- **Data & Statistics**: [List 2-3 sources for numerical data and metrics]
- **Community Sentiment**: [List Hacker News discussions, Reddit threads with URLs]
- **Competitive Analysis**: [List 2-3 articles comparing products/companies]
- **Technical Deep-Dives**: [List any technical analysis sources used]
- **Academic/Research**: [List any research papers or academic sources if used]

**VALIDATION CHECKLIST FOR FINAL ARTICLE:**
Before submitting, verify your article includes:
✅ **Recency**: At least 50% of sources from last 30 days, 25% from last 7 days
✅ **Source Diversity**: Minimum 8 different publications represented
✅ **Quote Authenticity**: Every quote includes exact source, date, and context
✅ **Data Verification**: All statistics cross-checked across multiple sources
✅ **Publication Quality**: Mix of tier-1 sources (TechCrunch, Bloomberg, WSJ) and specialized sources
✅ **Community Voice**: Real user perspectives from forums and social platforms
✅ **Expert Opinions**: Industry analyst or executive perspectives included
✅ **Competitive Context**: How topic relates to broader market dynamics

**SCRAPING VALIDATION REQUIREMENTS:**

Before submitting your article, verify you have:
✅ **Source Diversity**: Quotes/data from at least 3 different publications
✅ **Recency**: All quotes and major data points from last 6 months
✅ **Attribution**: Every quote properly attributed to source publication
✅ **Balance**: Mix of executive, analyst, and user perspectives
✅ **Verification**: Cross-checked major claims across multiple sources
✅ **Community Voice**: Included real user sentiment from forums/communities
✅ **Competitive Context**: Referenced how competitors are positioning
✅ **Data Specificity**: Actual numbers, percentages, dates - not vague statements

**RESEARCH METHODOLOGY BY CONTENT TYPE:**

**For Product Analysis Articles:**
- Scrape official product pages for feature specs
- Find recent reviews from TechCrunch, The Verge, Engadget
- Check Reddit for user experience posts and complaints
- Look for competitor comparison articles
- Search for usage statistics or adoption metrics

**For Industry Trend Articles:** 
- Gather market research data from recent reports
- Find analyst predictions from industry publications
- Collect executive quotes about market direction
- Research funding/investment news for trend validation
- Analyze startup activity in the space (Product Hunt, Crunchbase)

**For Company/Executive Analysis:**
- Recent press releases and earnings calls
- Executive interviews in major publications
- Employee sentiment on platforms like Blind or Glassdoor
- Stock performance and analyst ratings (if public)
- Recent hiring patterns and job postings

**For Technical Deep-Dives:**
- Developer community discussions (GitHub, Stack Overflow)
- Technical documentation and API changes
- Performance benchmarks from technical reviews
- Security analysis from cybersecurity publications
- Open source project activity and contribution patterns

## 📝 OUTPUT FORMAT

Provide your response in this exact format:

**SEO TITLE**: [50-60 character title]
**META DESCRIPTION**: [150-160 character description]
**CATEGORY**: [AI & ML / Cloud & Infrastructure / Development Tools / etc.]
**KEYWORDS**: [comma-separated list of 5 primary keywords]
**ESTIMATED READ TIME**: [X minutes]

**ARTICLE CONTENT:**
[Full article in HTML format with proper headings, paragraphs, and formatting]

**VISUAL REQUIREMENTS:**
- Hero Image: [specific description]
- Supporting Images: [2-3 specific descriptions]
- Required Logos: [list of 3-5 company/product logos]

**SUGGESTED INTERNAL LINKS:**
- [3-4 related topic suggestions for internal linking]

**SOCIAL MEDIA HOOKS:**
- Twitter: [engaging tweet with the key insight]
- LinkedIn: [professional angle for LinkedIn post]

## 🚨 CRITICAL REQUIREMENTS

1. **NEVER** create generic, surface-level content
2. **ALWAYS** provide specific, actionable insights
3. **RESEARCH** the topic as if you're scraping real current sources
4. **ANALYZE** don't just summarize - what does this mean?
5. **CONNECT** to broader industry trends and implications
6. **PREDICT** what this means for the next 6-12 months

## 📥 YOUR TOPIC:

[PASTE YOUR TOPIC IDEA HERE]

---

**EXAMPLE TOPIC**: "Is the new Google Bard product good enough to replace Photoshop for most people?"

Now, take my actual topic idea and create a comprehensive, magazine-quality article following all the guidelines above. Focus on deep analysis, specific insights, and actionable conclusions that provide real value to tech professionals and decision-makers.