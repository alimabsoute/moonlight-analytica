/**
 * Generate Single Article - Test Script
 * 
 * This script generates a single article for testing purposes
 * and demonstrates the complete 3-AI collaborative pipeline.
 */

import ContentAutomationAgent from '../content-automation-agent.js';
import 'dotenv/config';

async function generateTestArticle() {
  console.log('🤖 Initializing Content Automation Agent...');
  
  const agent = new ContentAutomationAgent({
    qualityThreshold: 7, // Lower threshold for testing
    maxRetries: 2
  });

  try {
    console.log('📰 Scraping latest content...');
    await agent.scrapeContent();

    console.log('📈 Selecting trending content...');
    const trendingContent = await agent.selectTrendingContent('tech', 5);
    
    if (trendingContent.length < 3) {
      console.log('⚠️  Not enough trending content. Using mock data...');
      // Create mock trending content for testing
      const mockContent = [
        {
          id: 1,
          title: "Latest AI Breakthrough in Machine Learning",
          description: "Revolutionary new approach to neural network training shows promising results in reducing computational overhead while improving accuracy.",
          source_url: "https://example.com/ai-breakthrough",
          source_name: "TechCrunch",
          category: "tech"
        },
        {
          id: 2,
          title: "Quantum Computing Reaches New Milestone",
          description: "Scientists achieve record-breaking quantum coherence times, bringing practical quantum computers closer to reality.",
          source_url: "https://example.com/quantum-milestone", 
          source_name: "The Verge",
          category: "tech"
        },
        {
          id: 3,
          title: "Open Source LLM Performance Rivals GPT-4",
          description: "New open-source language model demonstrates competitive performance with leading proprietary models across multiple benchmarks.",
          source_url: "https://example.com/opensource-llm",
          source_name: "Ars Technica", 
          category: "tech"
        }
      ];
      
      console.log('🎯 Generating article with 3-AI collaborative approach...');
      console.log('   Step 1: Claude Writer (Initial Draft)');
      console.log('   Step 2: OpenAI Editor (Enhancement & SEO)');
      console.log('   Step 3: Claude Overseer (Quality Assessment)');
      
      const article = await agent.generateArticle(mockContent, 'tech');
      
      if (article) {
        console.log('\n✅ Article Generation Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📰 Title: ${article.title}`);
        console.log(`📊 Quality Score: ${article.quality_score}/10`);
        console.log(`📝 Word Count: ${article.word_count}`);
        console.log(`🤖 AI Writers: ${article.ai_writers.join(' → ')}`);
        console.log(`🔄 Iterations: ${article.iterations}`);
        console.log(`📋 Status: ${article.quality_score >= 8 ? 'Ready to Publish' : 'Needs Review'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (article.excerpt) {
          console.log(`📖 Excerpt: ${article.excerpt}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        
        console.log(`🏷️  Tags: ${article.tags ? article.tags.join(', ') : 'None'}`);
        console.log(`🔗 Slug: ${article.slug}`);
        
        if (article.quality_breakdown) {
          console.log('\n📈 Quality Breakdown:');
          Object.entries(article.quality_breakdown).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}/10`);
          });
        }
        
        if (article.final_notes) {
          console.log(`\n📝 Editor Notes: ${article.final_notes}`);
        }
        
        // Show content preview (first 200 chars)
        const contentPreview = article.content
          .replace(/<[^>]*>/g, '') // Strip HTML
          .substring(0, 200) + '...';
        console.log(`\n📄 Content Preview:\n${contentPreview}`);
        
        return article;
      } else {
        console.log('❌ Article generation failed');
        return null;
      }
    } else {
      console.log(`📊 Found ${trendingContent.length} trending content items`);
      const article = await agent.generateArticle(trendingContent, 'tech');
      
      if (article) {
        console.log(`\n✅ Generated: ${article.title}`);
        console.log(`📊 Quality: ${article.quality_score}/10`);
        return article;
      }
    }
    
  } catch (error) {
    console.error('❌ Article generation failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTestArticle()
    .then(article => {
      if (article) {
        console.log('\n🎉 Test completed successfully!');
        
        // Prompt for publishing
        if (article.quality_score >= 8) {
          console.log('\n💡 This article meets quality standards.');
          console.log('   Run `npm run publish:ready` to publish it to your site.');
        } else {
          console.log('\n⚠️  Article quality is below threshold.');
          console.log('   Review the content before publishing.');
        }
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export default generateTestArticle;