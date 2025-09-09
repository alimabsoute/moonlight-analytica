/**
 * Health Check Script
 * 
 * Monitors the content automation agent's health and performance
 * Provides detailed status of all system components
 */

import ContentAutomationAgent from '../content-automation-agent.js';
import 'dotenv/config';

async function performHealthCheck() {
  console.log('🏥 Performing Content Automation Agent Health Check');
  console.log('═'.repeat(60));

  const agent = new ContentAutomationAgent();
  const healthReport = {
    timestamp: new Date().toISOString(),
    overallStatus: 'healthy',
    components: {},
    metrics: {},
    issues: []
  };

  try {
    // 1. Database Connection Health
    console.log('\n🗄️  Database Connection');
    console.log('─'.repeat(30));
    
    try {
      const { data, error } = await agent.supabase
        .from('articles')
        .select('count')
        .single();
        
      if (error && !error.message.includes('JSON object requested')) {
        throw error;
      }
      
      healthReport.components.database = {
        status: 'healthy',
        message: 'Database connection successful'
      };
      console.log('   ✅ Database connection: OK');
    } catch (error) {
      healthReport.components.database = {
        status: 'error',
        message: error.message
      };
      healthReport.issues.push(`Database connection failed: ${error.message}`);
      console.log('   ❌ Database connection: FAILED');
      console.log(`      Error: ${error.message}`);
    }

    // 2. API Service Health
    console.log('\n🤖 AI Services');
    console.log('─'.repeat(30));

    // Test Claude AI
    try {
      const testMessage = await agent.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      
      healthReport.components.claude = {
        status: 'healthy',
        message: 'Claude AI responding normally'
      };
      console.log('   ✅ Claude AI: OK');
    } catch (error) {
      healthReport.components.claude = {
        status: 'error',
        message: error.message
      };
      healthReport.issues.push(`Claude AI failed: ${error.message}`);
      console.log('   ❌ Claude AI: FAILED');
      console.log(`      Error: ${error.message}`);
    }

    // Test OpenAI
    try {
      const testCompletion = await agent.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      });
      
      healthReport.components.openai = {
        status: 'healthy',
        message: 'OpenAI responding normally'
      };
      console.log('   ✅ OpenAI: OK');
    } catch (error) {
      healthReport.components.openai = {
        status: 'error',
        message: error.message
      };
      healthReport.issues.push(`OpenAI failed: ${error.message}`);
      console.log('   ❌ OpenAI: FAILED');
      console.log(`      Error: ${error.message}`);
    }

    // 3. Content Sources Health
    console.log('\n📰 Content Sources');
    console.log('─'.repeat(30));

    let sourceCount = 0;
    for (const [sourceName, config] of Object.entries(agent.contentSources)) {
      try {
        if (config.rss) {
          const response = await fetch(config.rss, { 
            method: 'HEAD',
            timeout: 10000 
          });
          if (response.ok) {
            sourceCount++;
            console.log(`   ✅ ${sourceName}: OK`);
          } else {
            console.log(`   ⚠️  ${sourceName}: HTTP ${response.status}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${sourceName}: ${error.message}`);
      }
    }

    healthReport.components.contentSources = {
      status: sourceCount > 0 ? 'healthy' : 'warning',
      message: `${sourceCount}/${Object.keys(agent.contentSources).length} sources available`
    };

    // 4. Database Metrics
    console.log('\n📊 Database Metrics');
    console.log('─'.repeat(30));

    try {
      // Articles metrics
      const { data: articlesData, error: articlesError } = await agent.supabase
        .rpc('get_articles_stats');
      
      if (articlesError) {
        // Fallback to simple queries
        const { data: totalArticles } = await agent.supabase
          .from('articles')
          .select('id')
          .single();
        
        const { data: publishedArticles } = await agent.supabase
          .from('articles')
          .select('id')
          .eq('status', 'published');
        
        const { data: draftArticles } = await agent.supabase
          .from('articles')
          .select('id')
          .eq('status', 'draft');

        healthReport.metrics.articles = {
          total: 'Unknown',
          published: publishedArticles?.length || 0,
          drafts: draftArticles?.length || 0,
          ready: 'Unknown'
        };
      } else {
        healthReport.metrics.articles = articlesData;
      }

      // Content sources metrics
      const { data: sourcesData, error: sourcesError } = await agent.supabase
        .from('content_sources')
        .select('id, scraped_at')
        .order('scraped_at', { ascending: false })
        .limit(1);

      if (!sourcesError && sourcesData) {
        const lastScraped = sourcesData[0]?.scraped_at;
        const hoursAgo = lastScraped ? 
          Math.floor((new Date() - new Date(lastScraped)) / (1000 * 60 * 60)) : 
          null;

        healthReport.metrics.contentSources = {
          lastScraped: lastScraped,
          hoursAgo: hoursAgo
        };

        console.log(`   📝 Articles: ${healthReport.metrics.articles.published || 0} published, ${healthReport.metrics.articles.drafts || 0} drafts`);
        console.log(`   🌐 Content: Last scraped ${hoursAgo ? hoursAgo + ' hours ago' : 'unknown'}`);
      }

    } catch (error) {
      console.log(`   ⚠️  Could not retrieve all metrics: ${error.message}`);
    }

    // 5. System Performance
    console.log('\n⚡ System Performance');
    console.log('─'.repeat(30));

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    healthReport.metrics.performance = {
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      uptime: Math.round(uptime)
    };

    console.log(`   💾 Memory: ${healthReport.metrics.performance.memoryUsage.heapUsed}MB used / ${healthReport.metrics.performance.memoryUsage.heapTotal}MB allocated`);
    console.log(`   ⏱️  Process uptime: ${Math.floor(uptime / 60)} minutes`);

    // 6. Recent Generation Activity
    console.log('\n🔄 Recent Activity');
    console.log('─'.repeat(30));

    try {
      const { data: recentArticles, error: recentError } = await agent.supabase
        .from('articles')
        .select('title, quality_score, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.log('   ⚠️  Could not retrieve recent articles');
      } else if (recentArticles && recentArticles.length > 0) {
        console.log('   📰 Recent Articles:');
        recentArticles.forEach((article, index) => {
          const timeAgo = Math.floor((new Date() - new Date(article.created_at)) / (1000 * 60 * 60));
          const status = article.status === 'published' ? '🟢' : 
                        article.status === 'ready' ? '🟡' : '⚪';
          console.log(`      ${index + 1}. ${status} ${article.title.substring(0, 50)}...`);
          console.log(`         Quality: ${article.quality_score}/10 | ${timeAgo}h ago`);
        });
        
        healthReport.metrics.recentActivity = {
          articlesGenerated: recentArticles.length,
          averageQuality: recentArticles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / recentArticles.length
        };
      } else {
        console.log('   📭 No recent articles found');
        healthReport.metrics.recentActivity = { articlesGenerated: 0 };
      }
    } catch (error) {
      console.log(`   ⚠️  Could not retrieve recent activity: ${error.message}`);
    }

    // 7. Overall Health Assessment
    console.log('\n🏥 Health Summary');
    console.log('═'.repeat(60));

    const healthyComponents = Object.values(healthReport.components)
      .filter(c => c.status === 'healthy').length;
    const totalComponents = Object.keys(healthReport.components).length;
    
    if (healthReport.issues.length === 0) {
      healthReport.overallStatus = 'healthy';
      console.log('   🟢 Overall Status: HEALTHY');
      console.log(`   📊 Components: ${healthyComponents}/${totalComponents} operational`);
    } else if (healthReport.issues.length <= 2) {
      healthReport.overallStatus = 'warning';
      console.log('   🟡 Overall Status: WARNING');
      console.log(`   📊 Components: ${healthyComponents}/${totalComponents} operational`);
      console.log('   ⚠️  Issues detected:');
      healthReport.issues.forEach(issue => console.log(`      • ${issue}`));
    } else {
      healthReport.overallStatus = 'critical';
      console.log('   🔴 Overall Status: CRITICAL');
      console.log(`   📊 Components: ${healthyComponents}/${totalComponents} operational`);
      console.log('   ❌ Critical issues:');
      healthReport.issues.forEach(issue => console.log(`      • ${issue}`));
    }

    // 8. Recommendations
    console.log('\n💡 Recommendations');
    console.log('─'.repeat(30));

    if (healthReport.issues.length === 0) {
      console.log('   ✨ System is running optimally!');
      console.log('   💡 Consider running: npm run generate:article');
    } else {
      console.log('   🔧 Recommended actions:');
      if (healthReport.components.database?.status === 'error') {
        console.log('      • Check database connection and run: npm run setup:db');
      }
      if (healthReport.components.claude?.status === 'error') {
        console.log('      • Verify ANTHROPIC_API_KEY in .env file');
      }
      if (healthReport.components.openai?.status === 'error') {
        console.log('      • Verify OPENAI_API_KEY in .env file');
      }
    }

    console.log('\n═'.repeat(60));
    console.log(`Health check completed at ${new Date().toLocaleString()}`);

    return healthReport;

  } catch (error) {
    console.error('❌ Health check failed:', error);
    healthReport.overallStatus = 'critical';
    healthReport.issues.push(`Health check system error: ${error.message}`);
    return healthReport;
  }
}

// Export health check data as JSON
async function exportHealthReport() {
  const healthReport = await performHealthCheck();
  const reportPath = `health-report-${Date.now()}.json`;
  
  try {
    await require('fs').promises.writeFile(
      reportPath, 
      JSON.stringify(healthReport, null, 2)
    );
    console.log(`\n📄 Health report saved to: ${reportPath}`);
  } catch (error) {
    console.error('Failed to save health report:', error.message);
  }
  
  return healthReport;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const exportFlag = process.argv.includes('--export');
  
  if (exportFlag) {
    exportHealthReport()
      .then(report => {
        process.exit(report.overallStatus === 'healthy' ? 0 : 1);
      })
      .catch(error => {
        console.error('Health check failed:', error);
        process.exit(1);
      });
  } else {
    performHealthCheck()
      .then(report => {
        process.exit(report.overallStatus === 'healthy' ? 0 : 1);
      })
      .catch(error => {
        console.error('Health check failed:', error);
        process.exit(1);
      });
  }
}

export { performHealthCheck, exportHealthReport };