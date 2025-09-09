# ARTICLE-IMAGE-MAPPING REFERENCE

## CRITICAL: This is the definitive mapping for all articles. DO NOT DEVIATE.

### MAIN ARTICLE FILES AND THEIR CORRECT IMAGES

| Article File | Correct Image | Status |
|--------------|---------------|---------|
| `openai-o1-refusal-pattern-analysis.html` | `1a.png` | ✅ CORRECT |
| `iphone-17-ai-demo-failure-analysis.html` | `2a.png` | ⚠️ DARK THEME - needs white theme fix |
| `big-tech-50m-lobbying-california-ai-bill.html` | `3a.png` | ✅ CORRECT |
| `amazon-shadow-workforce-purge-10000-contractors.html` | `4a.png` | ✅ CORRECT |
| `nvidia-blackwell-chips-sold-out-2027.html` | `5a.png` | ✅ CORRECT |
| `google-nano-banana-photoshop-killer.html` | `6a.png` | ✅ CORRECT |
| `intel-secret-plan-split-500b-semiconductor-war.html` | `7a.png` | ⚠️ DARK THEME - needs white theme fix |
| `10-million-token-arms-race-chatgpt-calculator.html` | `10av2.png` | ✅ CORRECT |
| `vision-pro-2-ditching-500-feature-wanted.html` | `10av2.png` | ✅ CORRECT |
| `meta-google-apple-twitter-killers-march-2026.html` | `6a.png` | ✅ CORRECT |
| `ai-eating-own-tail-chatgpt-dumber-2026.html` | `6a.png` | ✅ CORRECT |

### ARTICLES WITH DARK THEME THAT NEED WHITE THEME CONVERSION

1. `iphone-17-ai-demo-failure-analysis.html` - has `--dark-bg: #0a0a0a`
2. `intel-secret-plan-split-500b-semiconductor-war.html` - has dark theme CSS (❌ STILL NOT FIXED)
3. `openai-o1-refusal-pattern-analysis.html` - has dark theme CSS

### NEWS.HTML IMAGE MAPPING (CORRECT ASSIGNMENTS)

| Article Reference | Should Use Image | Current Status |
|------------------|------------------|-----------------|
| `openai-o1-refusal-pattern-analysis.html` | `1a.png` | ✅ CORRECT |
| `iphone-17-ai-demo-failure-analysis.html` | `2a.png` | ✅ CORRECT |
| `big-tech-50m-lobbying-california-ai-bill.html` | `3a.png` | ✅ CORRECT |
| `amazon-shadow-workforce-purge-10000-contractors.html` | `4a.png` | ✅ CORRECT |
| `nvidia-blackwell-chips-sold-out-2027.html` | `5a.png` | ✅ CORRECT |
| `intel-secret-plan-split-500b-semiconductor-war.html` | `7a.png` | ❌ DUPLICATE ENTRY using 8a.png |
| `10-million-token-arms-race-chatgpt-calculator.html` | `10av2.png` | ✅ CORRECT |
| `ai-eating-own-tail-chatgpt-dumber-2026.html` | `6a.png` | ✅ CORRECT |
| `meta-google-apple-twitter-killers-march-2026.html` | `6a.png` | ❌ WRONG - using 7a.png |
| `vision-pro-2-ditching-500-feature-wanted.html` | `10av2.png` | ✅ CORRECT |

### CRITICAL ISSUES FOUND

1. **DUPLICATE INTEL ENTRY**: Intel article appears twice in news.html - one correct (7a.png), one wrong (8a.png) - REMOVE THE DUPLICATE
2. **META ARTICLE WRONG IMAGE**: meta-google-apple should use `6a.png` but news.html shows `7a.png` 
3. **DARK THEME ARTICLES**: 3 articles still have dark theme CSS that needs conversion to white theme

### STANDARD WHITE THEME CSS TEMPLATE

```css
:root {
    --primary-color: #1f2937;
    --secondary-color: #6b7280;
    --accent-color: #00bfff;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --bg-primary: #faf8f3;
    --bg-secondary: #ffffff;
    --card-bg: rgba(255, 255, 255, 0.9);
    --cyber-blue: #00bfff;
    --cyber-green: #10b981;
    --cyber-cyan: #87ceeb;
}

body {
    font-family: 'Inter', sans-serif;
    background: #faf8f3;
    color: #1f2937;
    line-height: 1.6;
}

.navbar {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
}
```

### DEPLOYMENT VERIFICATION CHECKLIST

After fixing, verify these URLs show correct images and white theme:
- https://moonlightanalytica.com/iphone-17-ai-demo-failure-analysis ✅ 2a.png + white theme
- https://moonlightanalytica.com/intel-secret-plan-split-500b-semiconductor-war ✅ 7a.png + white theme
- https://moonlightanalytica.com/openai-o1-refusal-pattern-analysis ✅ 1a.png + white theme
- https://moonlightanalytica.com/news ✅ No duplicates, correct images for all cards