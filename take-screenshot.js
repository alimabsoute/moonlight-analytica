import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function takeScreenshot() {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('📸 Taking screenshot of iPhone 17 article...');
        await page.goto('https://moonlightanalytica.com/iphone-17-ai-demo-failure-analysis.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Wait a bit for any animations or dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const screenshot = await page.screenshot({
            fullPage: true,
            type: 'png'
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `iphone-17-article-fixed-${timestamp}.png`;
        const filepath = path.join(process.cwd(), filename);
        
        fs.writeFileSync(filepath, screenshot);
        console.log(`✅ Screenshot saved: ${filepath}`);
        
        return filepath;
        
    } catch (error) {
        console.error('❌ Screenshot failed:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

takeScreenshot().catch(console.error);