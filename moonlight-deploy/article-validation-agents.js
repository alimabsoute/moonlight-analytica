#!/usr/bin/env node

/**
 * Moonlight Analytica - Multi-Agent Article Validation System
 * Ensures all new articles have proper structure, appropriate visual design, and quality standards
 */

const fs = require('fs').promises;
const path = require('path');

// Article validation agents
class ArticleStructureAgent {
    constructor() {
        this.name = "Structure Validation Agent";
        this.checks = [
            'doctype_present',
            'html_lang_attribute',
            'meta_charset',
            'meta_viewport',
            'title_tag',
            'meta_description',
            'h1_hierarchy',
            'content_sections',
            'navigation_structure',
            'semantic_html'
        ];
    }

    async validateStructure(content, filename) {
        console.log(`\n🏗️  ${this.name} - Analyzing: ${filename}`);
        
        const results = {
            agent: this.name,
            file: filename,
            passed: true,
            issues: [],
            warnings: [],
            recommendations: []
        };

        // Check DOCTYPE
        if (!content.includes('<!DOCTYPE html>')) {
            results.issues.push('Missing DOCTYPE declaration');
            results.passed = false;
        }

        // Check HTML lang attribute
        if (!content.includes('<html lang="en">')) {
            results.issues.push('Missing or incorrect lang attribute on HTML element');
            results.passed = false;
        }

        // Check meta charset
        if (!content.includes('<meta charset="UTF-8">')) {
            results.issues.push('Missing UTF-8 charset declaration');
            results.passed = false;
        }

        // Check viewport meta
        if (!content.includes('<meta name="viewport"')) {
            results.issues.push('Missing viewport meta tag for mobile responsiveness');
            results.passed = false;
        }

        // Validate title structure
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        if (!titleMatch) {
            results.issues.push('Missing title tag');
            results.passed = false;
        } else {
            const titleLength = titleMatch[1].length;
            if (titleLength > 60) {
                results.warnings.push(`Title too long (${titleLength} chars > 60). Consider shortening for SEO.`);
            }
            if (titleLength < 30) {
                results.warnings.push(`Title too short (${titleLength} chars < 30). Consider expanding for SEO.`);
            }
        }

        // Validate meta description
        const descMatch = content.match(/<meta name="description" content="(.*?)"/);
        if (!descMatch) {
            results.issues.push('Missing meta description');
            results.passed = false;
        } else {
            const descLength = descMatch[1].length;
            if (descLength > 160) {
                results.warnings.push(`Meta description too long (${descLength} chars > 160)`);
            }
            if (descLength < 120) {
                results.warnings.push(`Meta description too short (${descLength} chars < 120)`);
            }
        }

        // Check H1 hierarchy
        const h1Count = (content.match(/<h1[^>]*>/g) || []).length;
        if (h1Count === 0) {
            results.issues.push('No H1 tag found - critical for SEO and accessibility');
            results.passed = false;
        } else if (h1Count > 1) {
            results.warnings.push(`Multiple H1 tags found (${h1Count}) - should have only one per page`);
        }

        // Check heading hierarchy (H1->H2->H3 etc)
        const headings = content.match(/<h[1-6][^>]*>/g);
        if (headings) {
            const headingLevels = headings.map(h => parseInt(h.match(/h([1-6])/)[1]));
            let hasHierarchyIssues = false;
            
            for (let i = 1; i < headingLevels.length; i++) {
                if (headingLevels[i] > headingLevels[i-1] + 1) {
                    hasHierarchyIssues = true;
                    break;
                }
            }
            
            if (hasHierarchyIssues) {
                results.warnings.push('Heading hierarchy issue detected - avoid skipping heading levels');
            }
        }

        // Check for semantic HTML structure
        const hasMain = content.includes('<main');
        const hasHeader = content.includes('<header');
        const hasNav = content.includes('<nav');
        const hasArticle = content.includes('<article');
        const hasSection = content.includes('<section');

        if (!hasMain) {
            results.recommendations.push('Consider using <main> element for primary content');
        }
        if (!hasHeader) {
            results.recommendations.push('Consider using <header> element for page header');
        }
        if (!hasArticle && filename.includes('.html')) {
            results.recommendations.push('Consider using <article> element for article content');
        }

        // Check content sections
        const paragraphCount = (content.match(/<p[^>]*>/g) || []).length;
        if (paragraphCount < 3) {
            results.warnings.push(`Low paragraph count (${paragraphCount}) - consider adding more content structure`);
        }

        return results;
    }
}

class VisualDesignAgent {
    constructor() {
        this.name = "Visual Design Validation Agent";
        this.darkBackgroundPatterns = [
            'background.*#0',
            'background.*#1',
            'background.*#2',
            'background.*black',
            'background.*rgb\\(0',
            'background.*rgb\\([0-9],\\s*[0-9],\\s*[0-9]\\)',
            'background.*rgba\\(0',
            '--bg.*#0',
            '--bg.*#1',
            '--bg.*#2'
        ];
        this.lightBackgroundRequired = [
            '#faf8f3',
            '#ffffff',
            'white',
            '#f3f4f6',
            '#f9fafb'
        ];
    }

    async validateDesign(content, filename) {
        console.log(`\n🎨 ${this.name} - Analyzing: ${filename}`);
        
        const results = {
            agent: this.name,
            file: filename,
            passed: true,
            issues: [],
            warnings: [],
            recommendations: []
        };

        // Check for dark backgrounds - patterns that indicate problematic dark colors
            // UPDATED: Exclude light blue rgba(0, 191, 255, x) patterns
            const darkBackgroundPatterns = [
                /background.*rgba\(0,\s*0,\s*0/i,       // Only pure black rgba(0,0,0,x)
                /background.*#0{6}/i,                      // Only pure black #000000
                /background.*#1{6}/i,                      // Only #111111 
                /background.*#0[0-9a-fA-F]{5}(?!0bfff)/i, // #0xxxxx but not #00bfff (cyan)
                /background.*#1[0-9a-fA-F]{5}/i,          // #1xxxxx patterns
                /background.*#2[0-9a-fA-F]{5}/i,          // #2xxxxx patterns
                /background.*\bblack\b/i,                // keyword 'black' as whole word
            ];
            let hasGenericLinks = false;
            
            links.forEach(link => {
                const linkText = link.replace(/<[^>]*>/g, '').toLowerCase();
                if (genericLinkText.includes(linkText.trim())) {
                    hasGenericLinks = true;
                }
            });

            if (hasGenericLinks) {
                results.warnings.push('Generic link text found - use descriptive link text');
            }
        }

        // Check color contrast (basic check)
        const hasContrastVars = content.includes('--text-primary') && 
                               (content.includes('#1f2937') || content.includes('#000000'));
        
        if (!hasContrastVars) {
            results.warnings.push('Ensure sufficient color contrast for text readability');
        }

        // Check interactive element size (touch targets)
        const hasButtonSizing = content.includes('min-height') || content.includes('padding');
        if (!hasButtonSizing) {
            results.recommendations.push('Ensure interactive elements have adequate touch target size (44px minimum)');
        }

        return results;
    }
}

class ValidationOrchestrator {
    constructor() {
        this.agents = [
            new ArticleStructureAgent(),
            new VisualDesignAgent(),
            new SEOComplianceAgent(),
            new AccessibilityAgent()
        ];
        this.results = [];
    }

    async validateArticle(filepath) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🚀 VALIDATING: ${path.basename(filepath)}`);
        console.log(`${'='.repeat(80)}`);

        try {
            const content = await fs.readFile(filepath, 'utf8');
            const filename = path.basename(filepath);
            const articleResults = {
                file: filename,
                path: filepath,
                timestamp: new Date().toISOString(),
                overallPassed: true,
                agentResults: []
            };

            // Run all agents
            for (const agent of this.agents) {
                let result;
                switch (agent.name) {
                    case 'Structure Validation Agent':
                        result = await agent.validateStructure(content, filename);
                        break;
                    case 'Visual Design Validation Agent':
                        result = await agent.validateDesign(content, filename);
                        break;
                    case 'SEO Compliance Agent':
                        result = await agent.validateSEO(content, filename);
                        break;
                    case 'Accessibility Validation Agent':
                        result = await agent.validateAccessibility(content, filename);
                        break;
                }

                articleResults.agentResults.push(result);
                
                if (!result.passed) {
                    articleResults.overallPassed = false;
                }

                // Print agent results
                this.printAgentResults(result);
            }

            this.results.push(articleResults);
            return articleResults;

        } catch (error) {
            console.error(`❌ Error validating ${filepath}: ${error.message}`);
            return {
                file: path.basename(filepath),
                path: filepath,
                error: error.message,
                overallPassed: false
            };
        }
    }

    printAgentResults(result) {
        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`\n${status}: ${result.agent}`);
        
        if (result.issues.length > 0) {
            console.log('  🚨 CRITICAL ISSUES:');
            result.issues.forEach(issue => console.log(`    • ${issue}`));
        }
        
        if (result.warnings.length > 0) {
            console.log('  ⚠️  WARNINGS:');
            result.warnings.forEach(warning => console.log(`    • ${warning}`));
        }
        
        if (result.recommendations.length > 0) {
            console.log('  💡 RECOMMENDATIONS:');
            result.recommendations.forEach(rec => console.log(`    • ${rec}`));
        }
    }

    async validateAllArticles(articlePaths) {
        console.log('🤖 MOONLIGHT ANALYTICA - MULTI-AGENT VALIDATION SYSTEM');
        console.log('🎯 Ensuring all articles meet quality and design standards\n');

        for (const articlePath of articlePaths) {
            await this.validateArticle(articlePath);
        }

        await this.generateFinalReport();
    }

    async generateFinalReport() {
        console.log(`\n${'='.repeat(80)}`);
        console.log('📊 FINAL VALIDATION SUMMARY');
        console.log(`${'='.repeat(80)}`);

        const totalArticles = this.results.length;
        const passedArticles = this.results.filter(r => r.overallPassed).length;
        const failedArticles = totalArticles - passedArticles;

        console.log(`📈 Total Articles Validated: ${totalArticles}`);
        console.log(`✅ Passed All Checks: ${passedArticles}`);
        console.log(`❌ Failed Some Checks: ${failedArticles}`);
        console.log(`📊 Success Rate: ${((passedArticles / totalArticles) * 100).toFixed(1)}%`);

        // Agent-specific summary
        const agentSummary = {};
        this.agents.forEach(agent => {
            agentSummary[agent.name] = {
                total: totalArticles,
                passed: 0,
                failed: 0,
                issues: 0,
                warnings: 0,
                recommendations: 0
            };
        });

        this.results.forEach(articleResult => {
            if (articleResult.agentResults) {
                articleResult.agentResults.forEach(agentResult => {
                    const summary = agentSummary[agentResult.agent];
                    if (summary) {
                        if (agentResult.passed) summary.passed++;
                        else summary.failed++;
                        summary.issues += agentResult.issues.length;
                        summary.warnings += agentResult.warnings.length;
                        summary.recommendations += agentResult.recommendations.length;
                    }
                });
            }
        });

        console.log('\n🤖 AGENT PERFORMANCE SUMMARY:');
        Object.entries(agentSummary).forEach(([agentName, summary]) => {
            console.log(`\n  ${agentName}:`);
            console.log(`    ✅ Passed: ${summary.passed}/${summary.total}`);
            console.log(`    ❌ Failed: ${summary.failed}/${summary.total}`);
            console.log(`    🚨 Issues: ${summary.issues}`);
            console.log(`    ⚠️  Warnings: ${summary.warnings}`);
            console.log(`    💡 Recommendations: ${summary.recommendations}`);
        });

        // Save detailed report
        const reportPath = path.join('C:/Users/alima/moonlight-deploy', 'multi-agent-validation-report.json');
        await fs.writeFile(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                total: totalArticles,
                passed: passedArticles,
                failed: failedArticles,
                successRate: (passedArticles / totalArticles) * 100
            },
            agentSummary,
            detailedResults: this.results
        }, null, 2));

        console.log(`\n📄 Detailed report saved: ${reportPath}`);

        // Generate action items for failed articles
        if (failedArticles > 0) {
            console.log('\n🔧 REQUIRED ACTIONS:');
            this.results.filter(r => !r.overallPassed).forEach(article => {
                console.log(`\n  📄 ${article.file}:`);
                article.agentResults.forEach(agent => {
                    if (!agent.passed && agent.issues.length > 0) {
                        console.log(`    ${agent.agent}:`);
                        agent.issues.forEach(issue => console.log(`      • FIX: ${issue}`));
                    }
                });
            });
        }
    }
}

// Main execution
async function main() {
    const FIRST_10_ARTICLES = [
        'nvidia-blackwell-chips-sold-out-2027.html',
        'intel-secret-plan-split-500b-semiconductor-war.html',
        'ai-eating-own-tail-chatgpt-dumber-2026.html',
        'meta-google-apple-twitter-killers-march-2026.html',
        'vision-pro-2-ditching-500-feature-wanted.html',
        'big-tech-50m-lobbying-california-ai-bill.html',
        'amazon-shadow-workforce-purge-10000-contractors.html',
        'google-nano-banana-photoshop-killer.html',
        'openai-o1-refusal-pattern-analysis.html',
        'iphone-17-ai-demo-failure-analysis.html'
    ];

    const articlePaths = FIRST_10_ARTICLES.map(filename => 
        path.join('C:/Users/alima/moonlight-deploy', filename)
    );

    const orchestrator = new ValidationOrchestrator();
    await orchestrator.validateAllArticles(articlePaths);

    console.log('\n🎉 Multi-agent validation complete!');
    console.log('📋 Review the generated report for detailed findings and action items.');
}

module.exports = {
    ArticleStructureAgent,
    VisualDesignAgent,
    SEOComplianceAgent,
    AccessibilityAgent,
    ValidationOrchestrator
};

if (require.main === module) {
    main().catch(console.error);
}