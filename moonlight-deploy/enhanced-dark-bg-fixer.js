#!/usr/bin/env node

/**
 * Enhanced Dark Background Fixer for Moonlight Analytica
 * Targets the exact patterns detected by validation agents
 */

const fs = require('fs');
const path = require('path');

class EnhancedDarkBackgroundFixer {
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

        // Enhanced patterns based on validation agent detection
        this.darkBackgroundPatterns = [
            // Exact patterns from validation agent
            { 
                regex: /background.*rgba\(0[^)]*\)/gi,
                description: 'rgba(0,x,x,x) patterns'
            },
            { 
                regex: /background.*#0[0-9a-fA-F]{5}/gi,
                description: 'hex #0xxxxx patterns'
            },
            { 
                regex: /background.*#1[0-9a-fA-F]{5}/gi,
                description: 'hex #1xxxxx patterns'
            },
            { 
                regex: /background.*#2[0-9a-fA-F]{5}/gi,
                description: 'hex #2xxxxx patterns'
            },
            // Additional comprehensive patterns
            { 
                regex: /background-color:\s*rgba\(0,\s*0,\s*0[^)]*\)/gi,
                description: 'background-color: rgba(0,0,0,x)'
            },
            { 
                regex: /background:\s*rgba\(0,\s*0,\s*0[^)]*\)/gi,
                description: 'background: rgba(0,0,0,x)'
            },
            { 
                regex: /background-color:\s*#0{6}/gi,
                description: 'background-color: #000000'
            },
            { 
                regex: /background:\s*#0{6}/gi,
                description: 'background: #000000'
            },
            { 
                regex: /background-color:\s*#1{6}/gi,
                description: 'background-color: #111111'
            },
            { 
                regex: /background:\s*#1{6}/gi,
                description: 'background: #111111'
            },
            { 
                regex: /background-color:\s*black/gi,
                description: 'background-color: black'
            },
            { 
                regex: /background:\s*black/gi,
                description: 'background: black'
            }
        ];

        this.lightReplacements = {
            // RGBA replacements
            'rgba(0,0,0,1)': 'rgba(255,255,255,1)',
            'rgba(0,0,0,0.9)': 'rgba(255,255,255,0.9)',
            'rgba(0,0,0,0.8)': 'rgba(255,255,255,0.8)',
            'rgba(0,0,0,0.7)': 'rgba(255,255,255,0.7)',
            'rgba(0,0,0,0.5)': 'rgba(255,255,255,0.5)',
            'rgba(0, 0, 0, 1)': 'rgba(255, 255, 255, 1)',
            'rgba(0, 0, 0, 0.9)': 'rgba(255, 255, 255, 0.9)',
            'rgba(0, 0, 0, 0.8)': 'rgba(255, 255, 255, 0.8)',
            'rgba(0, 0, 0, 0.7)': 'rgba(255, 255, 255, 0.7)',
            'rgba(0, 0, 0, 0.5)': 'rgba(255, 255, 255, 0.5)',
            
            // Hex replacements
            '#000000': '#faf8f3',
            '#111111': '#faf8f3',
            '#222222': '#faf8f3',
            '#000': '#faf8f3',
            '#111': '#faf8f3',
            '#222': '#faf8f3',
            
            // Keyword replacements
            'black': '#faf8f3'
        };

        this.stats = {
            totalFiles: 0,
            filesModified: 0,
            totalReplacements: 0,
            patternMatches: {}
        };
    }

    async processAllArticles() {
        console.log('🔧 ENHANCED DARK BACKGROUND FIXER');
        console.log('🎯 Targeting exact patterns detected by validation agents\n');

        for (const filename of this.articlesToProcess) {
            await this.processArticle(filename);
        }

        this.printSummary();
    }

    async processArticle(filename) {
        const filePath = path.join(process.cwd(), filename);
        
        console.log(`\n============================================================`);
        console.log(`🔧 PROCESSING: ${filename}`);
        console.log(`============================================================`);

        try {
            if (!fs.existsSync(filePath)) {
                console.log(`❌ File not found: ${filename}`);
                return;
            }

            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;
            let replacements = 0;

            // First, detect what patterns are present
            console.log('🔍 Detecting dark background patterns...');
            const foundPatterns = [];
            
            for (const pattern of this.darkBackgroundPatterns) {
                const matches = content.match(pattern.regex);
                if (matches && matches.length > 0) {
                    foundPatterns.push({
                        pattern: pattern.description,
                        matches: matches,
                        count: matches.length
                    });
                    console.log(`  ⚠️ Found ${matches.length} instances of ${pattern.description}`);
                    matches.forEach(match => console.log(`     "${match}"`));
                }
            }

            if (foundPatterns.length === 0) {
                console.log('  ✅ No dark background patterns detected');
                return;
            }

            // Apply replacements
            console.log('\n🔧 Applying replacements...');
            
            // Generic RGBA pattern replacements
            content = content.replace(/rgba\(0,\s*0,\s*0,\s*([0-9.]+)\)/gi, (match, opacity) => {
                replacements++;
                const replacement = `rgba(255, 255, 255, ${opacity})`;
                console.log(`  ✨ ${match} → ${replacement}`);
                return replacement;
            });

            // Hex pattern replacements
            for (const [dark, light] of Object.entries(this.lightReplacements)) {
                const regex = new RegExp(dark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                const matches = content.match(regex);
                if (matches) {
                    content = content.replace(regex, light);
                    replacements += matches.length;
                    console.log(`  ✨ Replaced ${matches.length} instances of ${dark} → ${light}`);
                }
            }

            // Special case: background properties with dark colors
            content = content.replace(/background(-color)?:\s*(#0{6}|#1{6}|#2{6}|black)/gi, (match, colorProp, color) => {
                replacements++;
                const replacement = `background${colorProp || ''}:${colorProp ? '' : ''} #faf8f3`;
                console.log(`  ✨ ${match} → ${replacement}`);
                return replacement;
            });

            if (replacements > 0) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ SUCCESS: ${replacements} replacements made in ${filename}`);
                this.stats.filesModified++;
                this.stats.totalReplacements += replacements;
            } else {
                console.log(`ℹ️ No replacements needed for ${filename}`);
            }

            this.stats.totalFiles++;

        } catch (error) {
            console.error(`❌ ERROR processing ${filename}:`, error.message);
        }
    }

    printSummary() {
        console.log('\n============================================================');
        console.log('📊 ENHANCED FIXING SUMMARY');
        console.log('============================================================');
        console.log(`✅ Files processed: ${this.stats.totalFiles}`);
        console.log(`🔧 Files modified: ${this.stats.filesModified}`);
        console.log(`✨ Total replacements: ${this.stats.totalReplacements}`);
        
        if (this.stats.filesModified > 0) {
            console.log('\n🎉 Enhanced dark background fixing complete!');
            console.log('📋 Next step: Run validation again to verify all fixes');
        } else {
            console.log('\n⚠️ No modifications made - check if patterns match actual content');
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const fixer = new EnhancedDarkBackgroundFixer();
    fixer.processAllArticles().catch(console.error);
}

module.exports = EnhancedDarkBackgroundFixer;