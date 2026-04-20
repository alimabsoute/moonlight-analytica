#!/usr/bin/env node

/**
 * Rigorous Deployment Verification System
 * Ensures moonlightanalytica.com is publicly accessible without authentication
 * Tests all 10 fixed articles for proper deployment
 */

const https = require('https');
const http = require('http');

class DeploymentVerifier {
    constructor() {
        this.domain = 'www.moonlightanalytica.com';
        this.articles = [
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
        this.results = {
            domain: { status: 'pending', details: {} },
            articles: [],
            summary: { passed: 0, failed: 0, total: 0 }
        };
    }

    async makeRequest(url) {
        return new Promise((resolve) => {
            const protocol = url.startsWith('https://') ? https : http;
            
            const req = protocol.request(url, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'MoonlightAnalytica-DeploymentVerifier/1.0'
                },
                timeout: 10000
            }, (res) => {
                resolve({
                    success: true,
                    statusCode: res.statusCode,
                    headers: res.headers,
                    requiresAuth: res.statusCode === 401 || res.statusCode === 403,
                    redirected: res.statusCode >= 300 && res.statusCode < 400
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    requiresAuth: false,
                    redirected: false
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout',
                    requiresAuth: false,
                    redirected: false
                });
            });

            req.end();
        });
    }

    async verifyDomain() {
        console.log(`🔍 Testing domain accessibility: https://${this.domain}`);
        
        const result = await this.makeRequest(`https://${this.domain}`);
        
        this.results.domain = {
            status: result.success && result.statusCode === 200 && !result.requiresAuth ? 'passed' : 'failed',
            statusCode: result.statusCode,
            requiresAuth: result.requiresAuth,
            redirected: result.redirected,
            error: result.error,
            details: result
        };

        if (this.results.domain.status === 'passed') {
            console.log(`✅ Domain accessible: ${result.statusCode} OK`);
        } else {
            console.log(`❌ Domain issue: ${result.statusCode} ${result.error || 'Unknown error'}`);
            if (result.requiresAuth) {
                console.log(`🚨 AUTHENTICATION REQUIRED - This is the problem we're fixing!`);
            }
        }

        return this.results.domain.status === 'passed';
    }

    async verifyArticle(filename) {
        const url = `https://${this.domain}/${filename}`;
        console.log(`  📄 Testing: ${filename}`);
        
        const result = await this.makeRequest(url);
        
        const articleResult = {
            filename,
            url,
            status: result.success && result.statusCode === 200 && !result.requiresAuth ? 'passed' : 'failed',
            statusCode: result.statusCode,
            requiresAuth: result.requiresAuth,
            error: result.error
        };

        this.results.articles.push(articleResult);
        this.results.summary.total++;

        if (articleResult.status === 'passed') {
            console.log(`    ✅ ${articleResult.statusCode} - Publicly accessible`);
            this.results.summary.passed++;
        } else {
            console.log(`    ❌ ${articleResult.statusCode} - ${articleResult.error || 'Failed'}`);
            if (result.requiresAuth) {
                console.log(`    🚨 Requires authentication!`);
            }
            this.results.summary.failed++;
        }

        return articleResult.status === 'passed';
    }

    async verifyAllArticles() {
        console.log(`\n🔍 Testing all 10 article URLs for public accessibility:`);
        
        for (const filename of this.articles) {
            await this.verifyArticle(filename);
        }
    }

    generateReport() {
        console.log('\n============================================================');
        console.log('📊 RIGOROUS DEPLOYMENT VERIFICATION REPORT');
        console.log('============================================================');
        
        // Domain Status
        console.log(`🌐 Domain Status: https://${this.domain}`);
        if (this.results.domain.status === 'passed') {
            console.log(`   ✅ PASSED - Publicly accessible (${this.results.domain.statusCode})`);
        } else {
            console.log(`   ❌ FAILED - ${this.results.domain.error || 'Unknown issue'}`);
            if (this.results.domain.requiresAuth) {
                console.log(`   🚨 REQUIRES AUTHENTICATION - Major issue!`);
            }
        }

        // Article Results Summary
        console.log(`\n📰 Articles Status: ${this.results.summary.passed}/${this.results.summary.total} passed`);
        
        if (this.results.summary.failed > 0) {
            console.log(`\n❌ Failed Articles:`);
            this.results.articles.filter(a => a.status === 'failed').forEach(article => {
                console.log(`   - ${article.filename}: ${article.statusCode} ${article.error || ''}`);
                if (article.requiresAuth) {
                    console.log(`     🚨 Requires authentication`);
                }
            });
        }

        if (this.results.summary.passed > 0) {
            console.log(`\n✅ Successful Articles:`);
            this.results.articles.filter(a => a.status === 'passed').forEach(article => {
                console.log(`   - ${article.url}`);
            });
        }

        // Overall Status
        const overallSuccess = this.results.domain.status === 'passed' && this.results.summary.failed === 0;
        console.log(`\n============================================================`);
        if (overallSuccess) {
            console.log(`🎉 DEPLOYMENT VERIFICATION: PASSED`);
            console.log(`✅ All systems operational - moonlightanalytica.com is publicly accessible`);
            console.log(`✅ All 10 articles are live and accessible without authentication`);
        } else {
            console.log(`🚨 DEPLOYMENT VERIFICATION: FAILED`);
            console.log(`❌ Issues detected that prevent public access`);
            if (this.results.domain.requiresAuth) {
                console.log(`🔐 Authentication required - this defeats the purpose of a public website`);
            }
        }
        console.log(`============================================================`);

        return {
            success: overallSuccess,
            results: this.results
        };
    }

    async runFullVerification() {
        console.log('🚀 STARTING RIGOROUS DEPLOYMENT VERIFICATION');
        console.log('🎯 Testing moonlightanalytica.com for public accessibility\n');

        // Test domain first
        const domainOk = await this.verifyDomain();
        
        if (!domainOk) {
            console.log('\n⚠️ Domain accessibility failed - testing articles anyway...');
        }

        // Test all articles
        await this.verifyAllArticles();

        // Generate comprehensive report
        return this.generateReport();
    }
}

// Execute if run directly
if (require.main === module) {
    const verifier = new DeploymentVerifier();
    verifier.runFullVerification().then((report) => {
        process.exit(report.success ? 0 : 1);
    }).catch((error) => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });
}

module.exports = DeploymentVerifier;