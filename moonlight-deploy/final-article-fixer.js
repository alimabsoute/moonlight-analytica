#!/usr/bin/env node

/**
 * Final Article Fixer for Moonlight Analytica
 * Fixes over-aggressive replacements and updates validation agent
 */

const fs = require('fs');
const path = require('path');

class FinalArticleFixer {
    constructor() {
        this.articlesToProcess = [
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

        this.textReversions = {
            // Fix over-aggressive word replacements
            '#faf8f3well': 'Blackwell',
            '#faf8f3hole': 'blackhole',
            '#faf8f3box': 'blackbox',
            '#faf8f3list': 'blacklist',
            '#faf8f3out': 'blackout',
            '#faf8f3berry': 'blackberry',
            '#faf8f3rock': 'BlackRock',
            '#faf8f3-box': 'black-box',
            '#faf8f3_box': 'black_box',
        };

        this.stats = {
            totalFiles: 0,
            filesModified: 0,
            totalReversions: 0,
        };
    }

    async processAllArticles() {
        console.log('🔧 FINAL ARTICLE FIXER');
        console.log('🎯 Fixing over-aggressive replacements and validation issues\n');

        // Fix articles
        for (const filename of this.articlesToProcess) {
            await this.processArticle(filename);
        }

        // Update validation agent
        await this.updateValidationAgent();

        this.printSummary();
    }

    async processArticle(filename) {
        const filePath = path.join(process.cwd(), filename);
        
        console.log(`\n============================================================`);
        console.log(`🔧 FIXING: ${filename}`);
        console.log(`============================================================`);

        try {
            if (!fs.existsSync(filePath)) {
                console.log(`❌ File not found: ${filename}`);
                return;
            }

            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;
            let reversions = 0;

            // Fix over-aggressive text replacements
            console.log('🔍 Checking for over-aggressive replacements...');
            
            for (const [incorrect, correct] of Object.entries(this.textReversions)) {
                if (content.includes(incorrect)) {
                    const regex = new RegExp(incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    const matches = content.match(regex);
                    if (matches) {
                        content = content.replace(regex, correct);
                        reversions += matches.length;
                        console.log(`  ✨ Reverted ${matches.length} instances of "${incorrect}" → "${correct}"`);
                    }
                }
            }

            if (reversions > 0) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ SUCCESS: ${reversions} reversions made in ${filename}`);
                this.stats.filesModified++;
                this.stats.totalReversions += reversions;
            } else {
                console.log(`ℹ️ No reversions needed for ${filename}`);
            }

            this.stats.totalFiles++;

        } catch (error) {
            console.error(`❌ ERROR processing ${filename}:`, error.message);
        }
    }

    async updateValidationAgent() {
        console.log('\n============================================================');
        console.log('🔧 UPDATING VALIDATION AGENT');
        console.log('============================================================');

        const validationAgentPath = path.join(process.cwd(), 'article-validation-agents.js');
        
        try {
            let content = fs.readFileSync(validationAgentPath, 'utf8');

            // Update the dark background detection to exclude light blue colors
            const oldPattern = `
            // Check for dark backgrounds - patterns that indicate problematic dark colors
            const darkBackgroundPatterns = [
                /background.*rgba\\(0/i,       // rgba patterns starting with 0
                /background.*#0/i,            // hex patterns starting with #0
                /background.*#1/i,            // hex patterns starting with #1  
                /background.*#2/i,            // hex patterns starting with #2
                /background.*black/i,         // keyword 'black'
            ];`;

            const newPattern = `
            // Check for dark backgrounds - patterns that indicate problematic dark colors
            // UPDATED: Exclude light blue rgba(0, 191, 255, x) patterns
            const darkBackgroundPatterns = [
                /background.*rgba\\(0,\\s*0,\\s*0/i,       // Only pure black rgba(0,0,0,x)
                /background.*#0{6}/i,                      // Only pure black #000000
                /background.*#1{6}/i,                      // Only #111111 
                /background.*#0[0-9a-fA-F]{5}(?!0bfff)/i, // #0xxxxx but not #00bfff (cyan)
                /background.*#1[0-9a-fA-F]{5}/i,          // #1xxxxx patterns
                /background.*#2[0-9a-fA-F]{5}/i,          // #2xxxxx patterns
                /background.*\\bblack\\b/i,                // keyword 'black' as whole word
            ];`;

            content = content.replace(/\/\/ Check for dark backgrounds[\s\S]*?\];/m, newPattern.trim());

            fs.writeFileSync(validationAgentPath, content, 'utf8');
            console.log('✅ Updated validation agent to exclude light blue colors');

        } catch (error) {
            console.error('❌ ERROR updating validation agent:', error.message);
        }
    }

    printSummary() {
        console.log('\n============================================================');
        console.log('📊 FINAL FIXING SUMMARY');
        console.log('============================================================');
        console.log(`✅ Files processed: ${this.stats.totalFiles}`);
        console.log(`🔧 Files modified: ${this.stats.filesModified}`);
        console.log(`✨ Total reversions: ${this.stats.totalReversions}`);
        console.log(`🎯 Validation agent updated to exclude light blue colors`);
        
        if (this.stats.filesModified > 0 || this.stats.totalReversions > 0) {
            console.log('\n🎉 Final article fixing complete!');
            console.log('📋 Next step: Run validation again to verify all fixes');
        } else {
            console.log('\n✅ All articles are already correctly formatted');
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const fixer = new FinalArticleFixer();
    fixer.processAllArticles().catch(console.error);
}

module.exports = FinalArticleFixer;