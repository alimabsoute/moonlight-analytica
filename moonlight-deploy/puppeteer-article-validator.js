#!/usr/bin/env node

/**
 * Moonlight Analytica - Article Validation with Puppeteer
 * Comprehensive testing framework for HTML article validation
 */

const fs = require('fs').promises;
const path = require('path');

// First 10 articles to validate and fix
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

// Common validation rules
const VALIDATION_RULES = {
    html: {
        doctype: '<!DOCTYPE html>',
        htmlLang: '<html lang="en">',
        metaCharset: '<meta charset="UTF-8">',
        metaViewport: '<meta name="viewport"',
        title: '<title>',
        metaDescription: '<meta name="description"',
    },
    seo: {
        titleLength: { min: 30, max: 60 },
        descriptionLength: { min: 120, max: 160 },
        h1Count: { min: 1, max: 1 },
        imageAltRequired: true
    },
    performance: {
        maxCSSInline: 50000, // bytes
        maxJSInline: 30000, // bytes
        maxImageCount: 20
    },
    accessibility: {
        headingHierarchy: true,
        altTextRequired: true,
        colorContrast: true
    }
};

class ArticleValidator {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            errors: []
        };
    }

    async validateFile(filepath) {
        console.log(`\n🔍 Validating: ${path.basename(filepath)}`);
        
        try {
            const content = await fs.readFile(filepath, 'utf8');
            const validation = this.runValidationRules(content, filepath);
            
            if (validation.isValid) {
                this.results.passed.push({
                    file: path.basename(filepath),
                    validations: validation.checks
                });
                console.log(`✅ PASSED: ${path.basename(filepath)}`);
            } else {
                this.results.failed.push({
                    file: path.basename(filepath),
                    errors: validation.errors,
                    warnings: validation.warnings
                });
                console.log(`❌ FAILED: ${path.basename(filepath)}`);
                validation.errors.forEach(error => console.log(`   ERROR: ${error}`));
                validation.warnings.forEach(warning => console.log(`   WARN: ${warning}`));
            }
            
            return validation;
        } catch (error) {
            this.results.errors.push({
                file: path.basename(filepath),
                error: error.message
            });
            console.error(`💥 ERROR reading ${path.basename(filepath)}: ${error.message}`);
            return { isValid: false, errors: [error.message], warnings: [] };
        }
    }

    runValidationRules(content, filepath) {
        const errors = [];
        const warnings = [];
        const checks = [];

        // HTML Structure Validation
        if (!content.includes(VALIDATION_RULES.html.doctype)) {
            errors.push('Missing DOCTYPE declaration');
        } else {
            checks.push('DOCTYPE present');
        }

        if (!content.includes(VALIDATION_RULES.html.htmlLang)) {
            errors.push('Missing lang attribute on html element');
        } else {
            checks.push('HTML lang attribute present');
        }

        if (!content.includes(VALIDATION_RULES.html.metaCharset)) {
            errors.push('Missing meta charset declaration');
        } else {
            checks.push('Meta charset present');
        }

        if (!content.includes(VALIDATION_RULES.html.metaViewport)) {
            errors.push('Missing viewport meta tag');
        } else {
            checks.push('Viewport meta tag present');
        }

        // Title validation
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        if (!titleMatch) {
            errors.push('Missing title tag');
        } else {
            const titleLength = titleMatch[1].length;
            checks.push(`Title length: ${titleLength} characters`);
            
            if (titleLength < VALIDATION_RULES.seo.titleLength.min) {
                warnings.push(`Title too short (${titleLength} < ${VALIDATION_RULES.seo.titleLength.min})`);
            }
            if (titleLength > VALIDATION_RULES.seo.titleLength.max) {
                warnings.push(`Title too long (${titleLength} > ${VALIDATION_RULES.seo.titleLength.max})`);
            }
        }

        // Meta description validation
        const descMatch = content.match(/<meta name="description" content="(.*?)"/);
        if (!descMatch) {
            errors.push('Missing meta description');
        } else {
            const descLength = descMatch[1].length;
            checks.push(`Meta description length: ${descLength} characters`);
            
            if (descLength < VALIDATION_RULES.seo.descriptionLength.min) {
                warnings.push(`Description too short (${descLength} < ${VALIDATION_RULES.seo.descriptionLength.min})`);
            }
            if (descLength > VALIDATION_RULES.seo.descriptionLength.max) {
                warnings.push(`Description too long (${descLength} > ${VALIDATION_RULES.seo.descriptionLength.max})`);
            }
        }

        // H1 tag validation
        const h1Matches = content.match(/<h1[^>]*>.*?<\/h1>/g);
        const h1Count = h1Matches ? h1Matches.length : 0;
        checks.push(`H1 tags found: ${h1Count}`);
        
        if (h1Count === 0) {
            errors.push('No H1 tag found');
        } else if (h1Count > 1) {
            warnings.push(`Multiple H1 tags found (${h1Count}), should be 1`);
        }

        // CSS Size validation
        const cssMatches = content.match(/<style[^>]*>(.*?)<\/style>/gs);
        if (cssMatches) {
            const totalCSSSize = cssMatches.reduce((total, match) => total + match.length, 0);
            checks.push(`Inline CSS size: ${totalCSSSize} bytes`);
            
            if (totalCSSSize > VALIDATION_RULES.performance.maxCSSInline) {
                warnings.push(`Large inline CSS (${totalCSSSize} > ${VALIDATION_RULES.performance.maxCSSInline})`);
            }
        }

        // Image validation
        const imgMatches = content.match(/<img[^>]*>/g);
        if (imgMatches) {
            checks.push(`Images found: ${imgMatches.length}`);
            
            // Check for missing alt attributes
            const imgsWithoutAlt = imgMatches.filter(img => !img.includes('alt='));
            if (imgsWithoutAlt.length > 0) {
                warnings.push(`${imgsWithoutAlt.length} images missing alt attributes`);
            }
        }

        // Check for common HTML syntax errors
        const commonErrors = this.checkCommonSyntaxErrors(content);
        errors.push(...commonErrors);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            checks
        };
    }

    checkCommonSyntaxErrors(content) {
        const errors = [];

        // Check for unclosed tags (basic check)
        const openDivs = (content.match(/<div[^>]*>/g) || []).length;
        const closeDivs = (content.match(/<\/div>/g) || []).length;
        if (openDivs !== closeDivs) {
            errors.push(`Mismatched div tags (${openDivs} open, ${closeDivs} close)`);
        }

        const openSections = (content.match(/<section[^>]*>/g) || []).length;
        const closeSections = (content.match(/<\/section>/g) || []).length;
        if (openSections !== closeSections) {
            errors.push(`Mismatched section tags (${openSections} open, ${closeSections} close)`);
        }

        // Check for malformed style attributes
        const malformedStyles = content.match(/style="[^"]*[^;"]"/g);
        if (malformedStyles && malformedStyles.length > 0) {
            errors.push('Potentially malformed style attributes found');
        }

        // Check for missing closing quotes
        if (content.includes('="') && !content.includes('"')) {
            errors.push('Potentially unclosed quotes in attributes');
        }

        return errors;
    }

    async validateAllArticles() {
        console.log('🚀 Starting comprehensive article validation...');
        console.log('📝 Validating first 10 articles with build issues\n');

        for (const article of FIRST_10_ARTICLES) {
            const filepath = path.join('C:/Users/alima/moonlight-deploy', article);
            await this.validateFile(filepath);
        }

        this.printSummary();
        await this.generateReport();
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${this.results.passed.length} files`);
        console.log(`❌ Failed: ${this.results.failed.length} files`);
        console.log(`💥 Errors: ${this.results.errors.length} files`);
        
        if (this.results.failed.length > 0) {
            console.log('\n🔧 Files requiring fixes:');
            this.results.failed.forEach(result => {
                console.log(`   - ${result.file} (${result.errors.length} errors, ${result.warnings.length} warnings)`);
            });
        }
    }

    async generateReport() {
        const reportPath = path.join('C:/Users/alima/moonlight-deploy', 'validation-report.json');
        const timestamp = new Date().toISOString();
        
        const report = {
            timestamp,
            summary: {
                total: FIRST_10_ARTICLES.length,
                passed: this.results.passed.length,
                failed: this.results.failed.length,
                errors: this.results.errors.length
            },
            results: this.results,
            nextSteps: this.generateNextSteps()
        };

        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved: ${reportPath}`);
    }

    generateNextSteps() {
        const steps = [];
        
        if (this.results.failed.length > 0) {
            steps.push('Fix HTML validation errors in failed files');
            steps.push('Address SEO warnings for better search optimization');
            steps.push('Optimize inline CSS and JavaScript if needed');
            steps.push('Add missing alt attributes to images');
        }
        
        if (this.results.errors.length > 0) {
            steps.push('Resolve file access or parsing errors');
        }
        
        steps.push('Re-run validation after fixes');
        steps.push('Deploy to staging for Puppeteer browser testing');
        steps.push('Run full accessibility and performance audits');
        
        return steps;
    }
}

// Enhanced Puppeteer Browser Testing Class
class PuppeteerTester {
    constructor() {
        this.baseURL = 'https://moonlight-deploy-qxrzdiuyl-alimabsoute-3065s-projects.vercel.app';
    }

    async setupBrowser() {
        try {
            // Connect to existing Chrome instance if available
            const puppeteer = require('puppeteer');
            this.browser = await puppeteer.launch({
                headless: false,
                devtools: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--disable-gpu',
                    '--remote-debugging-port=9222'
                ]
            });
            
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1200, height: 800 });
            
            console.log('✅ Puppeteer browser setup complete');
            return true;
        } catch (error) {
            console.error('❌ Failed to setup Puppeteer:', error.message);
            return false;
        }
    }

    async testArticle(articlePath) {
        const url = `${this.baseURL}/${articlePath}`;
        console.log(`🔍 Testing: ${url}`);
        
        try {
            // Load page
            await this.page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Run comprehensive tests
            const results = await this.runPageTests(articlePath);
            return results;
        } catch (error) {
            console.error(`❌ Failed to test ${articlePath}:`, error.message);
            return {
                success: false,
                error: error.message,
                tests: []
            };
        }
    }

    async runPageTests(articlePath) {
        const tests = [];

        // Test 1: Page loads successfully
        tests.push(await this.testPageLoad());

        // Test 2: Title and meta tags
        tests.push(await this.testSEOElements());

        // Test 3: Content structure
        tests.push(await this.testContentStructure());

        // Test 4: Images and media
        tests.push(await this.testImages());

        // Test 5: Performance metrics
        tests.push(await this.testPerformance());

        // Test 6: Mobile responsiveness
        tests.push(await this.testMobileResponsiveness());

        // Test 7: Accessibility
        tests.push(await this.testAccessibility());

        const successCount = tests.filter(t => t.passed).length;
        
        return {
            success: successCount === tests.length,
            article: articlePath,
            totalTests: tests.length,
            passedTests: successCount,
            tests
        };
    }

    async testPageLoad() {
        try {
            const title = await this.page.title();
            const hasContent = await this.page.$eval('body', el => el.textContent.trim().length > 0);
            
            return {
                name: 'Page Load',
                passed: title && hasContent,
                details: `Title: "${title}", Has content: ${hasContent}`
            };
        } catch (error) {
            return {
                name: 'Page Load',
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    async testSEOElements() {
        try {
            const title = await this.page.$eval('title', el => el.textContent);
            const description = await this.page.$eval('meta[name="description"]', el => el.content).catch(() => '');
            const h1 = await this.page.$eval('h1', el => el.textContent).catch(() => '');
            
            const titleOK = title.length >= 30 && title.length <= 60;
            const descOK = description.length >= 120 && description.length <= 160;
            const h1OK = h1.length > 0;
            
            return {
                name: 'SEO Elements',
                passed: titleOK && descOK && h1OK,
                details: `Title: ${title.length}chars, Description: ${description.length}chars, H1: ${h1OK}`
            };
        } catch (error) {
            return {
                name: 'SEO Elements',
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    async testContentStructure() {
        try {
            const headers = await this.page.$$eval('h1, h2, h3, h4, h5, h6', els => els.length);
            const paragraphs = await this.page.$$eval('p', els => els.length);
            const sections = await this.page.$$eval('section', els => els.length);
            
            const structureOK = headers > 0 && paragraphs > 0;
            
            return {
                name: 'Content Structure',
                passed: structureOK,
                details: `Headers: ${headers}, Paragraphs: ${paragraphs}, Sections: ${sections}`
            };
        } catch (error) {
            return {
                name: 'Content Structure',
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    async testImages() {
        try {
            const images = await this.page.$$eval('img', els => 
                els.map(img => ({
                    src: img.src,
                    alt: img.alt,
                    loaded: img.complete && img.naturalHeight !== 0
                }))
            );
            
            const imagesWithAlt = images.filter(img => img.alt.trim().length > 0);
            const loadedImages = images.filter(img => img.loaded);
            
            const altTextOK = images.length === 0 || imagesWithAlt.length === images.length;
            const imagesLoadedOK = images.length === 0 || loadedImages.length === images.length;
            
            return {
                name: 'Images',
                passed: altTextOK && imagesLoadedOK,
                details: `Images: ${images.length}, With Alt: ${imagesWithAlt.length}, Loaded: ${loadedImages.length}`
            };
        } catch (error) {
            return {
                name: 'Images',
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    async testPerformance() {
        try {
            const performanceMetrics = await this.page.evaluate(() => ({
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                resources: performance.getEntriesByType('resource').length
            }));
            
            const loadTimeOK = performanceMetrics.loadTime < 3000; // Under 3 seconds
            const domLoadOK = performanceMetrics.domContentLoaded < 2000; // Under 2 seconds
            
            return {
                name: 'Performance',
                passed: loadTimeOK && domLoadOK,
                details: `Load: ${performanceMetrics.loadTime}ms, DOM: ${performanceMetrics.domContentLoaded}ms, Resources: ${performanceMetrics.resources}`
            };
        } catch (error) {
            return {
                name: 'Performance',
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    async testMobileResponsiveness() {
        try {
            // Test mobile viewport
            await this.page.setViewport({ width: 375, height: 667 });
            await this.page.waitForTimeout(1000);
            
            const mobileLayout = await this.page.evaluate(() => {
                const body = document.body;
                return {
                    hasHorizontalScroll: body.scrollWidth > window.innerWidth,
                    hasVisibleContent: body.scrollHeight > 500,
                    fontSizeOK: parseInt(window.getComputedStyle(body).fontSize) >= 14
                };
            });
            
            // Reset to desktop
            await this.page.setViewport({ width: 1200, height: 800 });
            
            const mobileOK = !mobileLayout.hasHorizontalScroll && 
                           mobileLayout.hasVisibleContent && 
                           mobileLayout.fontSizeOK;
            
            return {
                name: 'Mobile Responsiveness',
                passed: mobileOK,
                details: `No H-Scroll: ${!mobileLayout.hasHorizontalScroll}, Content: ${mobileLayout.hasVisibleContent}, Font: ${mobileLayout.fontSizeOK}`
            };
        } catch (error) {
            return {
                name: 'Mobile Responsiveness',
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    async testAccessibility() {
        try {
            const a11yChecks = await this.page.evaluate(() => {
                const focusableElements = document.querySelectorAll('a, button, input, textarea, select').length;
                const headingHierarchy = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                    .map(h => parseInt(h.tagName.charAt(1)))
                    .every((level, i, arr) => i === 0 || level <= arr[i-1] + 1);
                
                return {
                    focusableElements,
                    headingHierarchy,
                    hasSkipLinks: !!document.querySelector('[href="#main"], [href="#content"]')
                };
            });
            
            const a11yOK = a11yChecks.headingHierarchy;
            
            return {
                name: 'Accessibility',
                passed: a11yOK,
                details: `Focusable: ${a11yChecks.focusableElements}, Heading hierarchy: ${a11yChecks.headingHierarchy}, Skip links: ${a11yChecks.hasSkipLinks}`
            };
        } catch (error) {
            return {
                name: 'Accessibility',
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Puppeteer browser closed');
        }
    }
}

// Main execution function
async function main() {
    console.log('🚀 Moonlight Analytica - Article Validation System');
    console.log('🎯 Target: First 10 articles with build issues');
    console.log('🔧 Tools: HTML validation + Puppeteer browser testing\n');

    // Phase 1: Static HTML validation
    const validator = new ArticleValidator();
    await validator.validateAllArticles();

    console.log('\n' + '='.repeat(60));
    console.log('🌐 Starting Puppeteer Browser Testing...');
    console.log('='.repeat(60));

    // Phase 2: Browser testing with Puppeteer
    const tester = new PuppeteerTester();
    
    if (await tester.setupBrowser()) {
        const browserResults = [];
        
        for (const article of FIRST_10_ARTICLES) {
            const result = await tester.testArticle(article);
            browserResults.push(result);
            
            if (result.success) {
                console.log(`✅ ${article}: ${result.passedTests}/${result.totalTests} tests passed`);
            } else {
                console.log(`❌ ${article}: ${result.passedTests || 0}/${result.totalTests || 0} tests passed`);
                if (result.tests) {
                    result.tests.filter(t => !t.passed).forEach(test => {
                        console.log(`   ❌ ${test.name}: ${test.details}`);
                    });
                }
            }
        }
        
        // Save browser test results
        const browserReportPath = path.join('C:/Users/alima/moonlight-deploy', 'puppeteer-test-results.json');
        await fs.writeFile(browserReportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            results: browserResults,
            summary: {
                total: FIRST_10_ARTICLES.length,
                passed: browserResults.filter(r => r.success).length,
                failed: browserResults.filter(r => !r.success).length
            }
        }, null, 2));
        
        console.log(`\n📄 Browser test results saved: ${browserReportPath}`);
        
        await tester.cleanup();
    }

    console.log('\n🎉 Validation and testing complete!');
    console.log('📋 Next steps:');
    console.log('   1. Review validation-report.json for HTML errors');
    console.log('   2. Review puppeteer-test-results.json for browser issues');
    console.log('   3. Fix identified issues in article files');
    console.log('   4. Re-run this script to verify fixes');
}

// Export classes for use in other scripts
module.exports = {
    ArticleValidator,
    PuppeteerTester,
    FIRST_10_ARTICLES,
    VALIDATION_RULES
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}