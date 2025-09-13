#!/usr/bin/env node

/**
 * Moonlight Analytica - Automated Article Issue Fixer
 * Fixes dark backgrounds, long titles, and missing meta descriptions
 */

const fs = require('fs').promises;
const path = require('path');

class ArticleFixer {
    constructor() {
        this.articlesToFix = [
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

        this.lightBackgroundReplacements = {
            // Dark backgrounds to light backgrounds
            'background: #000000': 'background: #faf8f3',
            'background: #111111': 'background: #faf8f3', 
            'background: #222222': 'background: #ffffff',
            'background: #0f0f0f': 'background: #faf8f3',
            'background: rgba(0, 0, 0': 'background: rgba(255, 255, 255',
            'background: rgba(17, 17, 17': 'background: rgba(255, 255, 255',
            'background: rgba(34, 34, 34': 'background: rgba(255, 255, 255',
            'background-color: #000000': 'background-color: #faf8f3',
            'background-color: #111111': 'background-color: #faf8f3',
            'background-color: #222222': 'background-color: #ffffff',
            'background-color: rgba(0, 0, 0': 'background-color: rgba(255, 255, 255',
            '--bg-primary: #000000': '--bg-primary: #faf8f3',
            '--bg-primary: #111111': '--bg-primary: #faf8f3',
            '--bg-secondary: #000000': '--bg-secondary: #ffffff',
            '--bg-secondary: #111111': '--bg-secondary: #ffffff',
            '--bg-dark: #0': '--bg-light: #faf8f3',
            '--bg-darker: #1': '--bg-lighter: #ffffff'
        };

        this.titleOptimizations = {
            'nvidia-blackwell-chips-sold-out-2027.html': 'NVIDIA Blackwell Chips Sold Out Until 2027',
            'intel-secret-plan-split-500b-semiconductor-war.html': 'Intel\'s Secret Plan: Split Company Triggers $500B War', 
            'ai-eating-own-tail-chatgpt-dumber-2026.html': 'AI Digital Inbreeding: ChatGPT Getting Dumber',
            'meta-google-apple-twitter-killers-march-2026.html': 'Big Tech\'s Twitter Killers March to Dominance 2026',
            'vision-pro-2-ditching-500-feature-wanted.html': 'Vision Pro 2 Ditches $500 Feature Users Actually Want',
            'big-tech-50m-lobbying-california-ai-bill.html': 'Big Tech\'s $50M Fight Against California AI Bill',
            'amazon-shadow-workforce-purge-10000-contractors.html': 'Amazon\'s Shadow Workforce: 10,000 Contractor Purge',
            'google-nano-banana-photoshop-killer.html': 'Google\'s Nano Banana: The Photoshop Killer',
            'openai-o1-refusal-pattern-analysis.html': 'OpenAI O1 Refusal Patterns: Inside Analysis',
            'iphone-17-ai-demo-failure-analysis.html': 'iPhone 17 AI Demo Failure: What Went Wrong'
        };

        this.descriptionOptimizations = {
            'nvidia-blackwell-chips-sold-out-2027.html': 'NVIDIA\'s Blackwell B200 chips sold out until 2027. Five tech giants secured 89% of production worth $57.8B.',
            'intel-secret-plan-split-500b-semiconductor-war.html': 'Intel\'s foundry separation will trigger massive supply chain realignment, potentially happening Q3 2025.',
            'ai-eating-own-tail-chatgpt-dumber-2026.html': 'AI models training on synthetic data experience rapid quality degradation, ending AI capability growth by 2026.',
            'meta-google-apple-twitter-killers-march-2026.html': 'Meta, Google, Apple launch Twitter competitors in coordinated attack, reshaping social media landscape.',
            'vision-pro-2-ditching-500-feature-wanted.html': 'Apple removes $500 Vision Pro feature users wanted most, prioritizing cost over functionality in Version 2.',
            'big-tech-50m-lobbying-california-ai-bill.html': 'Tech giants spend $50M lobbying against California AI safety bill, revealing industry fears about regulation.',
            'amazon-shadow-workforce-purge-10000-contractors.html': 'Amazon cuts 10,000 contractors from shadow workforce as company restructures operations for efficiency.',
            'google-nano-banana-photoshop-killer.html': 'Google\'s Nano Banana AI tool challenges Photoshop dominance with revolutionary image editing capabilities.',
            'openai-o1-refusal-pattern-analysis.html': 'Deep analysis reveals OpenAI O1\'s refusal patterns, exposing systematic biases in AI safety implementations.',
            'iphone-17-ai-demo-failure-analysis.html': 'iPhone 17 AI demo failure analysis reveals technical limitations and marketing challenges for Apple\'s AI push.'
        };
    }

    async fixAllArticles() {
        console.log('🔧 MOONLIGHT ANALYTICA - AUTOMATED ARTICLE FIXER');
        console.log('🎯 Fixing dark backgrounds, long titles, and missing meta descriptions\n');

        let totalFixed = 0;
        const results = [];

        for (const filename of this.articlesToFix) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🔧 FIXING: ${filename}`);
            console.log(`${'='.repeat(60)}`);

            try {
                const result = await this.fixArticle(filename);
                results.push(result);
                totalFixed += result.changesCount;
                
                if (result.success) {
                    console.log(`✅ SUCCESS: ${result.changesCount} changes made`);
                } else {
                    console.log(`❌ FAILED: ${result.error}`);
                }
            } catch (error) {
                console.error(`💥 ERROR: ${error.message}`);
                results.push({
                    filename,
                    success: false,
                    error: error.message,
                    changesCount: 0
                });
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 FIXING SUMMARY`);
        console.log(`${'='.repeat(60)}`);
        console.log(`✅ Successfully fixed: ${results.filter(r => r.success).length}/${this.articlesToFix.length} articles`);
        console.log(`🔧 Total changes made: ${totalFixed}`);
        console.log(`❌ Failed: ${results.filter(r => !r.success).length} articles`);

        return results;
    }

    async fixArticle(filename) {
        const filepath = path.join('C:/Users/alima/moonlight-deploy', filename);
        
        // Read original content
        const originalContent = await fs.readFile(filepath, 'utf8');
        let content = originalContent;
        let changesCount = 0;

        console.log('  🎨 Fixing dark backgrounds...');
        
        // Fix dark backgrounds
        for (const [darkBg, lightBg] of Object.entries(this.lightBackgroundReplacements)) {
            const regex = new RegExp(darkBg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            if (regex.test(content)) {
                content = content.replace(regex, lightBg);
                changesCount++;
                console.log(`    ✓ Replaced: ${darkBg} → ${lightBg}`);
            }
        }

        console.log('  📝 Optimizing title...');
        
        // Fix title if too long
        const newTitle = this.titleOptimizations[filename];
        if (newTitle) {
            const titleRegex = /<title>(.*?)<\/title>/;
            const titleMatch = content.match(titleRegex);
            if (titleMatch && titleMatch[1].length > 60) {
                content = content.replace(titleRegex, `<title>${newTitle}</title>`);
                changesCount++;
                console.log(`    ✓ Title: ${titleMatch[1].length} chars → ${newTitle.length} chars`);
            }
        }

        console.log('  📄 Optimizing meta description...');
        
        // Fix meta description
        const newDescription = this.descriptionOptimizations[filename];
        if (newDescription) {
            const descRegex = /<meta name="description" content="(.*?)"/;
            const descMatch = content.match(descRegex);
            
            if (descMatch) {
                if (descMatch[1].length > 160) {
                    content = content.replace(descRegex, `<meta name="description" content="${newDescription}"`);
                    changesCount++;
                    console.log(`    ✓ Description: ${descMatch[1].length} chars → ${newDescription.length} chars`);
                }
            } else if (filename === 'google-nano-banana-photoshop-killer.html') {
                // Add missing meta description
                const headEndRegex = /<\/head>/;
                content = content.replace(headEndRegex, `    <meta name="description" content="${newDescription}">\n</head>`);
                changesCount++;
                console.log(`    ✓ Added missing meta description: ${newDescription.length} chars`);
            }
        }

        // Add focus states CSS if missing
        if (!content.includes(':focus') && content.includes('<style>')) {
            console.log('  🎯 Adding focus states...');
            const focusCSS = `
        /* Focus states for accessibility */
        button:focus, 
        input:focus, 
        textarea:focus, 
        select:focus, 
        a:focus {
            outline: 2px solid var(--cyber-blue, #00bfff);
            outline-offset: 2px;
        }

        .btn:focus {
            box-shadow: 0 0 0 3px rgba(0, 191, 255, 0.3);
        }`;
            
            content = content.replace(/(.*<style>.*?)(.*<\/style>)/s, `$1${focusCSS}\n        $2`);
            changesCount++;
            console.log(`    ✓ Added focus states for accessibility`);
        }

        // Save the file if changes were made
        if (changesCount > 0) {
            await fs.writeFile(filepath, content, 'utf8');
            console.log(`  💾 Saved ${changesCount} changes to ${filename}`);
        } else {
            console.log(`  ℹ️  No changes needed for ${filename}`);
        }

        return {
            filename,
            success: true,
            changesCount,
            changes: {
                backgroundFixed: changesCount > 0,
                titleOptimized: newTitle && content.includes(newTitle),
                descriptionOptimized: newDescription && content.includes(newDescription)
            }
        };
    }
}

async function main() {
    const fixer = new ArticleFixer();
    const results = await fixer.fixAllArticles();
    
    console.log('\n🎉 Automated fixing complete!');
    console.log('📋 Next step: Run validation again to verify all fixes');
    
    return results;
}

module.exports = { ArticleFixer };

if (require.main === module) {
    main().catch(console.error);
}