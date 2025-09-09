/**
 * AI Article Generation Service
 * Integrates the proven 3-AI collaborative system into the CMS
 * Claude Writer → OpenAI Editor → Claude Overseer
 */

class AIArticleGenerationService {
    constructor() {
        // RSS sources from your automated system
        this.rssSources = {
            'ai_news': [
                'https://openai.com/blog/rss.xml',
                'https://www.anthropic.com/news/rss',
                'https://blog.google/technology/ai/rss/',
                'https://huggingface.co/blog/feed.xml'
            ],
            'tech_news': [
                'https://techcrunch.com/feed/',
                'https://feeds.feedburner.com/venturebeat/SZYF',
                'https://www.theverge.com/rss/index.xml',
                'https://arstechnica.com/feed/'
            ],
            'web_dev': [
                'https://css-tricks.com/feed/',
                'https://javascriptweekly.com/rss/',
                'https://reactjs.org/feed.xml'
            ]
        };

        // SaaS products for natural integration (from your system)
        this.saasProducts = {
            'phynxtimer': {
                name: 'PhynxTimer',
                url: 'https://phynxtimer.com',
                description: 'Advanced productivity timer with AI-powered insights',
                keywords: ['productivity', 'time management', 'pomodoro', 'focus', 'remote work']
            },
            'ats_helper': {
                name: 'ATS Resume Helper',
                url: '#beta-signup',
                description: 'AI-powered resume optimization for job seekers',
                keywords: ['resume', 'job search', 'ATS', 'career', 'recruitment', 'AI']
            },
            'janus_beta': {
                name: 'Janus Beta',
                url: '#early-access',
                description: 'Visual line counter and code analysis platform',
                keywords: ['code analysis', 'development', 'analytics', 'programming', 'software']
            }
        };

        this.corsProxyUrl = 'https://api.allorigins.win/raw?url=';
        this.generationProgress = null;
    }

    /**
     * Main entry point: Generate a complete article from user prompt
     */
    async generateArticleFromPrompt(userPrompt, progressCallback = null) {
        this.generationProgress = {
            currentStep: 'analyzing',
            progress: 0,
            status: 'Starting analysis...',
            steps: ['analyzing', 'researching', 'writing', 'editing', 'reviewing']
        };

        try {
            // Step 1: Analyze the user prompt
            this.updateProgress('analyzing', 10, 'Analyzing topic and extracting keywords...', progressCallback);
            const topicAnalysis = await this.analyzeUserPrompt(userPrompt);

            // Step 2: Research the topic
            this.updateProgress('researching', 25, 'Researching topic from tech news sources...', progressCallback);
            const researchData = await this.researchTopic(topicAnalysis);

            // Step 3: Claude Writer - Initial draft
            this.updateProgress('writing', 45, 'Claude Writer creating comprehensive article...', progressCallback);
            const claudeDraft = await this.claudeWriter(topicAnalysis, researchData);

            // Step 4: OpenAI Editor - Enhancement
            this.updateProgress('editing', 70, 'OpenAI Editor optimizing structure and SEO...', progressCallback);
            const enhancedArticle = await this.openaiEditor(claudeDraft, topicAnalysis, researchData);

            // Step 5: Claude Overseer - Quality control
            this.updateProgress('reviewing', 90, 'Claude Overseer performing quality assessment...', progressCallback);
            const finalArticle = await this.claudeOverseer(enhancedArticle, claudeDraft, topicAnalysis);

            this.updateProgress('complete', 100, 'Article generation complete!', progressCallback);

            return {
                success: true,
                article: finalArticle,
                topicAnalysis,
                researchSources: researchData.length
            };

        } catch (error) {
            console.error('Article generation error:', error);
            this.updateProgress('error', 0, `Error: ${error.message}`, progressCallback);
            
            return {
                success: false,
                error: error.message,
                fallback: this.generateFallbackArticle(userPrompt)
            };
        }
    }

    /**
     * Analyze user prompt to extract topic, keywords, category
     */
    async analyzeUserPrompt(userPrompt) {
        const prompt = userPrompt.toLowerCase();
        
        // Determine category based on keywords
        let category = 'tech_news';
        if (prompt.includes('ai') || prompt.includes('artificial intelligence') || 
            prompt.includes('machine learning') || prompt.includes('chatgpt') || 
            prompt.includes('claude') || prompt.includes('openai')) {
            category = 'ai_news';
        } else if (prompt.includes('react') || prompt.includes('javascript') || 
                   prompt.includes('web') || prompt.includes('frontend') || 
                   prompt.includes('development')) {
            category = 'web_dev';
        }

        // Extract entities (companies, products, technologies)
        const entities = this.extractEntitiesFromText(userPrompt);
        
        // Generate search keywords
        const keywords = this.generateSearchKeywords(userPrompt, entities);

        return {
            originalPrompt: userPrompt,
            category,
            entities,
            keywords,
            searchQueries: this.generateSearchQueries(keywords, entities),
            suggestedTitle: this.generateSuggestedTitle(userPrompt, entities)
        };
    }

    /**
     * Research topic by scraping RSS feeds
     */
    async researchTopic(topicAnalysis) {
        const relevantSources = this.selectRelevantSources(topicAnalysis.category);
        const researchResults = [];

        for (const sourceUrl of relevantSources.slice(0, 3)) { // Limit to 3 sources for speed
            try {
                const articles = await this.scrapeRSSFeed(sourceUrl);
                const relevantArticles = this.filterRelevantArticles(articles, topicAnalysis.keywords);
                researchResults.push(...relevantArticles.slice(0, 3)); // Top 3 from each source
            } catch (error) {
                console.warn(`Failed to scrape ${sourceUrl}:`, error);
                continue;
            }
        }

        return this.rankArticlesByRelevance(researchResults, topicAnalysis);
    }

    /**
     * Claude Writer - Initial comprehensive draft
     */
    async claudeWriter(topicAnalysis, researchData) {
        const researchContext = researchData.map(article => 
            `- ${article.title}: ${article.description?.slice(0, 200)}...`
        ).join('\n');

        const productContext = this.getRelevantProductMention(topicAnalysis);

        const prompt = `Write a comprehensive, original blog article about: "${topicAnalysis.originalPrompt}"

RESEARCH CONTEXT:
${researchContext}

REQUIREMENTS:
- 1000-1200 words
- TechCrunch-style professional tone
- Original analysis and insights, not just summarizing news
- Clear structure with compelling headlines
- Include industry implications and future outlook
- Professional yet accessible writing
- Focus on practical impact for tech professionals

STYLE GUIDELINES:
- Lead with a strong hook that establishes why this matters now
- Use data and examples to support key points
- Include expert perspectives or market analysis
- End with clear takeaways or actionable insights
- Avoid generic fluff - provide unique angle or perspective

${productContext}

Format as JSON:
{
    "title": "Compelling article title (under 60 chars)",
    "content": "Full article content with HTML formatting",
    "excerpt": "2-sentence summary of key insight",
    "keyPoints": ["3-5 main takeaways"],
    "wordCount": estimated_word_count,
    "readingTime": estimated_minutes
}`;

        // This would call Claude API - for now using mock response
        return this.simulateClaudeAPI(prompt, topicAnalysis);
    }

    /**
     * OpenAI Editor - SEO and structure enhancement
     */
    async openaiEditor(claudeDraft, topicAnalysis, researchData) {
        const prompt = `Enhance this article for SEO optimization and improved structure:

ORIGINAL ARTICLE:
${claudeDraft.content}

ENHANCEMENT REQUIREMENTS:
- Optimize headlines for SEO (H1, H2, H3 structure)
- Add meta description (150-160 characters)
- Identify and naturally integrate relevant keywords
- Improve readability and flow
- Add internal linking opportunities
- Enhance conclusion with clear call-to-action
- Ensure mobile-friendly formatting

TARGET KEYWORDS: ${topicAnalysis.keywords.join(', ')}

Format enhanced version as JSON:
{
    "title": "SEO-optimized title",
    "content": "Enhanced article with better structure",
    "metaDescription": "SEO meta description",
    "tags": ["relevant", "tags", "for", "article"],
    "seoKeywords": ["primary", "secondary", "keywords"],
    "excerpt": "Updated excerpt",
    "improvements": ["list of specific improvements made"]
}`;

        // This would call OpenAI API - for now using mock response
        return this.simulateOpenAIAPI(prompt, claudeDraft, topicAnalysis);
    }

    /**
     * Claude Overseer - Final quality control and assessment
     */
    async claudeOverseer(enhancedArticle, originalDraft, topicAnalysis) {
        const qualityPrompt = `Review this article for publication quality:

ARTICLE TITLE: ${enhancedArticle.title}
ARTICLE CONTENT: ${enhancedArticle.content}
ORIGINAL TOPIC: ${topicAnalysis.originalPrompt}

QUALITY ASSESSMENT CRITERIA:
1. Originality (25%): Unique insights vs news regurgitation
2. Technical Accuracy (25%): Factual correctness and expertise  
3. Writing Quality (25%): Engagement, readability, flow
4. SEO Optimization (25%): Meta tags, keywords, structure

Provide scores 1-10 for each criteria and overall assessment.
Articles scoring 8+ are ready to publish.
Articles 6-7.9 need minor revisions.
Articles below 6 need major rework.

Format as JSON:
{
    "qualityScore": overall_score_out_of_10,
    "scores": {
        "originality": score,
        "technicalAccuracy": score,
        "writingQuality": score,
        "seoOptimization": score
    },
    "readyToPublish": boolean,
    "feedback": "Specific feedback and suggestions",
    "finalContent": "Final polished version if ready",
    "recommendations": ["specific improvement suggestions"]
}`;

        // This would call Claude API for quality assessment - using mock for now
        return this.simulateOverseerAssessment(enhancedArticle, topicAnalysis);
    }

    // UTILITY METHODS

    updateProgress(step, progress, status, callback) {
        this.generationProgress = { step, progress, status };
        if (callback) callback(this.generationProgress);
    }

    extractEntitiesFromText(text) {
        const techEntities = [
            'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'OpenAI', 'Anthropic',
            'ChatGPT', 'Claude', 'GPT', 'React', 'Angular', 'Vue', 'Node.js',
            'JavaScript', 'TypeScript', 'Python', 'AWS', 'Azure', 'Docker',
            'Kubernetes', 'AI', 'Machine Learning', 'Blockchain', 'Web3'
        ];

        return techEntities.filter(entity => 
            text.toLowerCase().includes(entity.toLowerCase())
        );
    }

    generateSearchKeywords(prompt, entities) {
        const baseKeywords = prompt.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 5);
        
        return [...baseKeywords, ...entities.map(e => e.toLowerCase())];
    }

    generateSuggestedTitle(prompt, entities) {
        if (entities.length > 0) {
            return `${entities[0]} vs Competition: ${prompt.split(' ').slice(0, 4).join(' ')}`;
        }
        return prompt.charAt(0).toUpperCase() + prompt.slice(1);
    }

    selectRelevantSources(category) {
        return this.rssSources[category] || this.rssSources.tech_news;
    }

    async scrapeRSSFeed(url) {
        try {
            const proxyUrl = this.corsProxyUrl + encodeURIComponent(url);
            const response = await fetch(proxyUrl);
            const xmlText = await response.text();
            
            // Simple XML parsing for RSS
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const items = xmlDoc.querySelectorAll('item');
            
            return Array.from(items).slice(0, 5).map(item => ({
                title: item.querySelector('title')?.textContent || '',
                description: item.querySelector('description')?.textContent || '',
                link: item.querySelector('link')?.textContent || '',
                pubDate: item.querySelector('pubDate')?.textContent || ''
            }));
        } catch (error) {
            console.error('RSS scraping error:', error);
            return [];
        }
    }

    filterRelevantArticles(articles, keywords) {
        return articles.filter(article => {
            const content = (article.title + ' ' + article.description).toLowerCase();
            return keywords.some(keyword => content.includes(keyword.toLowerCase()));
        });
    }

    rankArticlesByRelevance(articles, topicAnalysis) {
        return articles.map(article => {
            let relevanceScore = 0;
            const content = (article.title + ' ' + article.description).toLowerCase();
            
            // Score based on keyword matches
            topicAnalysis.keywords.forEach(keyword => {
                if (content.includes(keyword.toLowerCase())) {
                    relevanceScore += 10;
                }
            });
            
            // Bonus for entity mentions
            topicAnalysis.entities.forEach(entity => {
                if (content.includes(entity.toLowerCase())) {
                    relevanceScore += 15;
                }
            });
            
            return { ...article, relevanceScore };
        })
        .filter(article => article.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 8); // Top 8 most relevant
    }

    getRelevantProductMention(topicAnalysis) {
        const relevantProducts = Object.values(this.saasProducts).filter(product => {
            return product.keywords.some(keyword => 
                topicAnalysis.keywords.includes(keyword) ||
                topicAnalysis.originalPrompt.toLowerCase().includes(keyword)
            );
        });

        if (relevantProducts.length > 0 && Math.random() < 0.3) {
            const product = relevantProducts[0];
            return `\nOptionally mention our product ${product.name} (${product.description}) if relevant to the topic.`;
        }
        return '';
    }

    // MOCK API RESPONSES (Replace with actual API calls)

    async simulateClaudeAPI(prompt, topicAnalysis) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockTitle = this.generateMockTitle(topicAnalysis);
        const mockContent = this.generateMockContent(topicAnalysis);
        
        return {
            title: mockTitle,
            content: mockContent,
            excerpt: "This article explores the latest developments and their implications for the tech industry.",
            keyPoints: [
                "Market dynamics are shifting rapidly",
                "New technologies are enabling innovation",  
                "Industry leaders are adapting strategies",
                "Future opportunities are emerging"
            ],
            wordCount: 1150,
            readingTime: 5
        };
    }

    async simulateOpenAIAPI(prompt, claudeDraft, topicAnalysis) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
            ...claudeDraft,
            title: claudeDraft.title + " - 2024 Analysis",
            metaDescription: `Comprehensive analysis of ${topicAnalysis.entities.join(', ')} and their impact on the tech industry. Expert insights and future predictions.`,
            tags: [...topicAnalysis.keywords.slice(0, 5), "technology", "analysis", "2024"],
            seoKeywords: topicAnalysis.keywords.slice(0, 3),
            improvements: [
                "Enhanced SEO structure with H1/H2/H3 hierarchy",
                "Added meta description and keyword optimization", 
                "Improved readability and flow",
                "Added compelling conclusion with clear takeaways"
            ]
        };
    }

    async simulateOverseerAssessment(enhancedArticle, topicAnalysis) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const scores = {
            originality: 8.5,
            technicalAccuracy: 8.8,
            writingQuality: 8.2,
            seoOptimization: 8.7
        };
        
        const qualityScore = Object.values(scores).reduce((a, b) => a + b) / 4;
        
        return {
            qualityScore: Math.round(qualityScore * 10) / 10,
            scores,
            readyToPublish: qualityScore >= 8,
            feedback: "Article demonstrates strong technical understanding with original insights. Well-structured and SEO-optimized. Ready for publication.",
            finalContent: enhancedArticle.content,
            recommendations: qualityScore >= 8 ? 
                ["Consider adding more specific examples", "Could benefit from expert quotes"] :
                ["Needs more original analysis", "Improve technical accuracy", "Enhance SEO optimization"]
        };
    }

    generateMockTitle(topicAnalysis) {
        const entity = topicAnalysis.entities[0] || 'Technology';
        const templates = [
            `${entity} Revolution: What It Means for Tech in 2024`,
            `The Rise of ${entity}: Industry Analysis and Future Outlook`,
            `${entity} vs Competition: Comprehensive Market Analysis`,
            `Breaking Down ${entity}: Technical Deep Dive and Implications`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    generateMockContent(topicAnalysis) {
        const entity = topicAnalysis.entities[0] || 'this technology';
        
        return `<h1>${this.generateMockTitle(topicAnalysis)}</h1>

<p>The technology landscape is witnessing unprecedented transformation as ${entity} continues to reshape how we think about innovation and industry practices. This comprehensive analysis explores the key developments, market implications, and future trajectory of these evolving technologies.</p>

<h2>Current Market Dynamics</h2>

<p>Recent developments in ${entity} have created significant ripple effects across multiple sectors. Industry leaders are rapidly adapting their strategies to leverage these innovations, while emerging startups are building entirely new business models around these capabilities.</p>

<p>Key market indicators suggest that adoption rates are accelerating faster than initially projected, with enterprise implementations showing particularly strong growth patterns. This trend reflects growing confidence in the technology's maturity and practical applications.</p>

<h2>Technical Innovation and Capabilities</h2>

<p>The underlying technical advances driving ${entity} represent a convergence of multiple breakthrough technologies. Machine learning algorithms, advanced computing architectures, and sophisticated data processing capabilities have combined to create powerful new possibilities.</p>

<p>Recent benchmarks demonstrate significant performance improvements across key metrics, with efficiency gains that were previously thought to require additional years of development. These advances are enabling applications that extend well beyond initial use case projections.</p>

<h2>Industry Impact and Applications</h2>

<p>Early adopters across various sectors are reporting transformative results from ${entity} implementation. From streamlined operational processes to entirely new product categories, the practical applications continue to expand rapidly.</p>

<p>Particularly noteworthy are the emerging use cases in enterprise productivity, where organizations are seeing measurable improvements in efficiency and output quality. These real-world applications are driving increased investment and development focus.</p>

<h2>Competitive Landscape Analysis</h2>

<p>The competitive dynamics around ${entity} are intensifying as major technology companies expand their capabilities and market presence. Strategic partnerships, acquisitions, and internal development efforts are accelerating across the industry.</p>

<p>Market positioning strategies are evolving rapidly, with companies focusing on differentiation through specialized capabilities, integration advantages, and ecosystem development. This competition is driving innovation velocity and improving capabilities for end users.</p>

<h2>Future Outlook and Predictions</h2>

<p>Looking ahead, several key trends are likely to shape the continued evolution of ${entity}. Increasing integration with existing technology stacks, expanded accessibility for smaller organizations, and continued performance improvements are expected to drive broader adoption.</p>

<p>Industry analysts project significant growth in implementation rates over the next 18-24 months, with particular strength in sectors that have been slower to adopt emerging technologies. This broader acceptance suggests the technology is reaching a maturity inflection point.</p>

<h2>Strategic Implications</h2>

<p>Organizations evaluating ${entity} adoption should consider both immediate implementation opportunities and longer-term strategic positioning. The technology's rapid evolution means that early movers may gain significant competitive advantages.</p>

<p>Success factors for implementation include clear use case definition, appropriate technical infrastructure, and change management strategies that account for workflow modifications. Organizations that approach adoption systematically are seeing the strongest results.</p>

<h2>Conclusion</h2>

<p>The developments around ${entity} represent more than incremental technological progress—they signal a fundamental shift in how we approach core business and technical challenges. Companies that understand and adapt to these changes will be best positioned for success in an increasingly competitive landscape.</p>

<p>As the technology continues to mature and expand its capabilities, the key to success will be thoughtful implementation that aligns with strategic objectives and operational realities. The opportunities are significant for organizations ready to embrace these emerging possibilities.</p>`;
    }

    generateFallbackArticle(userPrompt) {
        return {
            title: `Analysis: ${userPrompt}`,
            content: `<h1>Analysis: ${userPrompt}</h1><p>This is a fallback article generated when the full AI pipeline encountered an error. The article would normally be generated using our 3-AI collaborative system.</p>`,
            qualityScore: 6.0,
            readyToPublish: false
        };
    }
}

// Export for use in the CMS
if (typeof window !== 'undefined') {
    window.AIArticleGenerationService = AIArticleGenerationService;
}