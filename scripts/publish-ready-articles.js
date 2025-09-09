/**
 * Publish Ready Articles Script
 * 
 * Publishes articles that meet quality standards to the live site
 * with proper HTML generation and insights page updates
 */

import ContentAutomationAgent from '../content-automation-agent.js';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

async function publishReadyArticles() {
  console.log('📰 Checking for articles ready to publish...');
  
  const agent = new ContentAutomationAgent();

  try {
    // Get articles ready for publishing
    const { data: articles, error } = await agent.supabase
      .from('articles')
      .select('*')
      .eq('status', 'ready')
      .is('published_at', null)
      .gte('quality_score', agent.config.qualityThreshold)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!articles || articles.length === 0) {
      console.log('📋 No articles ready for publishing');
      
      // Show draft articles for reference
      const { data: drafts } = await agent.supabase
        .from('articles')
        .select('title, quality_score, status, created_at')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(5);

      if (drafts && drafts.length > 0) {
        console.log('\n📝 Recent draft articles:');
        drafts.forEach((draft, index) => {
          console.log(`   ${index + 1}. ${draft.title} (Quality: ${draft.quality_score}/10)`);
        });
        console.log('\n💡 Generate new articles with: npm run generate:article');
      }
      
      return;
    }

    console.log(`📊 Found ${articles.length} articles ready for publishing:`);
    articles.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (Quality: ${article.quality_score}/10)`);
    });

    // Ensure articles directory exists
    const articlesDir = path.join('C:\\Users\\alima', 'articles');
    try {
      await fs.access(articlesDir);
    } catch {
      await fs.mkdir(articlesDir, { recursive: true });
      console.log('📁 Created articles directory');
    }

    let publishedCount = 0;

    for (const article of articles) {
      try {
        console.log(`\n📝 Publishing: ${article.title}`);

        // Generate article HTML
        const articleHTML = generateArticleHTML(article);
        const filename = `${article.slug}.html`;
        const filepath = path.join(articlesDir, filename);

        await fs.writeFile(filepath, articleHTML);
        console.log(`   ✅ HTML file created: ${filename}`);

        // Update insights page
        await updateInsightsPage(article);
        console.log(`   ✅ Insights page updated`);

        // Update article status in database
        const { error: updateError } = await agent.supabase
          .from('articles')
          .update({
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', article.id);

        if (updateError) {
          throw new Error(`Failed to update article status: ${updateError.message}`);
        }

        publishedCount++;
        console.log(`   ✅ Article published successfully`);

      } catch (error) {
        console.error(`   ❌ Failed to publish "${article.title}":`, error.message);
      }
    }

    if (publishedCount > 0) {
      console.log(`\n🎉 Successfully published ${publishedCount} article(s)!`);
      console.log('\n🌐 Your articles are now live at:');
      articles.slice(0, publishedCount).forEach(article => {
        console.log(`   • http://localhost:3000/articles/${article.slug}.html`);
      });
      
      console.log('\n📖 Updated insights page: http://localhost:3000/insights.html');
    } else {
      console.log('\n⚠️  No articles were published due to errors');
    }

  } catch (error) {
    console.error('❌ Publishing process failed:', error.message);
    process.exit(1);
  }
}

/**
 * Generate HTML for article page
 */
function generateArticleHTML(article) {
  const publishDate = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const readingTime = Math.ceil(article.word_count / 200);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} | Moonlight Analytica</title>
    <meta name="description" content="${article.meta_description || article.excerpt || ''}">
    <meta name="keywords" content="${article.tags ? article.tags.join(', ') : ''}">
    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="${article.title}">
    <meta property="og:description" content="${article.meta_description || article.excerpt || ''}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Moonlight Analytica">
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.title}">
    <meta name="twitter:description" content="${article.meta_description || article.excerpt || ''}">
    
    <!-- CSS Styles matching site design -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
            color: #ffffff;
            min-height: 100vh;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }

        .back-nav {
            margin-bottom: 2rem;
        }

        .back-nav a {
            color: #00bfff;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: color 0.3s ease;
        }

        .back-nav a:hover {
            color: #87ceeb;
        }

        .article-header {
            margin-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 2rem;
        }

        .article-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #00bfff, #87ceeb);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: none;
        }

        .article-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 1rem;
        }

        .article-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .tag {
            background: rgba(0, 191, 255, 0.1);
            color: #00bfff;
            padding: 0.3rem 0.8rem;
            border-radius: 15px;
            font-size: 0.8rem;
            border: 1px solid rgba(0, 191, 255, 0.3);
        }

        .article-content {
            font-size: 1.1rem;
            line-height: 1.8;
        }

        .article-content h1,
        .article-content h2,
        .article-content h3 {
            color: #ffffff;
            margin: 2rem 0 1rem 0;
            font-weight: 600;
        }

        .article-content h2 {
            font-size: 1.8rem;
            background: linear-gradient(135deg, #00bfff, #87ceeb);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .article-content h3 {
            font-size: 1.4rem;
            color: #87ceeb;
        }

        .article-content p {
            margin-bottom: 1.5rem;
            color: rgba(255, 255, 255, 0.9);
        }

        .article-content a {
            color: #00bfff;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.3s ease;
        }

        .article-content a:hover {
            border-bottom-color: #00bfff;
        }

        .article-content ul,
        .article-content ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
        }

        .article-content li {
            margin-bottom: 0.5rem;
            color: rgba(255, 255, 255, 0.9);
        }

        .article-footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
            text-align: center;
        }

        .quality-indicator {
            display: inline-block;
            background: rgba(0, 191, 255, 0.1);
            color: #00bfff;
            padding: 0.3rem 0.8rem;
            border-radius: 10px;
            font-size: 0.8rem;
            margin-top: 1rem;
        }

        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .article-title {
                font-size: 2rem;
            }
            
            .article-meta {
                flex-direction: column;
                gap: 0.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <nav class="back-nav">
            <a href="../insights.html">← Back to Insights</a>
        </nav>
        
        <article>
            <header class="article-header">
                <h1 class="article-title">${article.title}</h1>
                
                <div class="article-meta">
                    <span>By ${article.author}</span>
                    <span>•</span>
                    <span>${publishDate}</span>
                    <span>•</span>
                    <span>${readingTime} min read</span>
                    <span>•</span>
                    <span>${article.word_count} words</span>
                </div>
                
                ${article.excerpt ? `<p style="font-size: 1.2rem; color: rgba(255, 255, 255, 0.8); margin-top: 1rem;">${article.excerpt}</p>` : ''}
                
                ${article.tags && article.tags.length > 0 ? `
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ` : ''}
            </header>
            
            <div class="article-content">
                ${article.content}
            </div>
            
            <footer class="article-footer">
                <p>Generated by Moonlight Analytica's AI Content System</p>
                <div class="quality-indicator">
                    Quality Score: ${article.quality_score}/10 | 
                    AI Writers: ${article.ai_writers ? article.ai_writers.join(' → ') : 'AI Collaborative System'}
                </div>
            </footer>
        </article>
    </div>
</body>
</html>`;
}

/**
 * Update insights.html with new article
 */
async function updateInsightsPage(article) {
  try {
    const insightsPath = path.join('C:\\Users\\alima', 'insights.html');
    
    // Check if insights.html exists
    let insightsHTML;
    try {
      insightsHTML = await fs.readFile(insightsPath, 'utf8');
    } catch {
      // Create basic insights page if it doesn't exist
      insightsHTML = createBasicInsightsPage();
    }

    const publishDate = new Date(article.created_at).toLocaleDateString();
    const readingTime = Math.ceil(article.word_count / 200);

    const articleCard = `
        <article class="article-card" style="margin-bottom: 2rem; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 10px; border: 1px solid rgba(0, 191, 255, 0.2);">
            <h3 style="margin-bottom: 0.8rem;">
                <a href="articles/${article.slug}.html" style="color: #00bfff; text-decoration: none; font-size: 1.3rem; font-weight: 600;">${article.title}</a>
            </h3>
            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; line-height: 1.6;">${article.excerpt || 'Read the full article for detailed insights and analysis.'}</p>
            <div class="article-meta" style="display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: rgba(255, 255, 255, 0.6);">
                <span>${publishDate}</span>
                <span>•</span>
                <span>${readingTime} min read</span>
                <span>•</span>
                <span>Quality: ${article.quality_score}/10</span>
                ${article.tags && article.tags.length > 0 ? `
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    ${article.tags.slice(0, 3).map(tag => `<span style="background: rgba(0, 191, 255, 0.1); color: #00bfff; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.75rem;">${tag}</span>`).join('')}
                </div>
                ` : ''}
            </div>
        </article>`;

    // Insert new article at the top of articles container
    const insertionPoint = insightsHTML.indexOf('<div class="articles-container">');
    if (insertionPoint !== -1) {
      const afterTag = insightsHTML.indexOf('>', insertionPoint) + 1;
      insightsHTML = 
        insightsHTML.slice(0, afterTag) + 
        articleCard + 
        insightsHTML.slice(afterTag);
    } else {
      // Fallback: append to body
      const bodyEnd = insightsHTML.lastIndexOf('</body>');
      if (bodyEnd !== -1) {
        insightsHTML = 
          insightsHTML.slice(0, bodyEnd) + 
          '<div class="articles-container">' + articleCard + '</div>' +
          insightsHTML.slice(bodyEnd);
      }
    }

    await fs.writeFile(insightsPath, insightsHTML);
    console.log(`   ✅ Insights page updated with new article`);

  } catch (error) {
    console.error(`   ⚠️  Warning: Failed to update insights page:`, error.message);
  }
}

/**
 * Create basic insights page if it doesn't exist
 */
function createBasicInsightsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insights | Moonlight Analytica</title>
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
            color: white; 
            margin: 0; 
            padding: 2rem; 
        }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: #00bfff; font-size: 2.5rem; margin-bottom: 2rem; }
        .articles-container { margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Latest Insights</h1>
        <div class="articles-container">
        </div>
    </div>
</body>
</html>`;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  publishReadyArticles()
    .then(() => {
      console.log('✅ Publishing process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Publishing failed:', error);
      process.exit(1);
    });
}

export default publishReadyArticles;