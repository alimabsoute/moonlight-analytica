// Auto Logo Suggestions for Articles
// Add this to your article-manager.html or include as a separate script

/**
 * Automatically suggest logos based on article content and title
 * Uses the tech_logos database to find relevant company/product logos
 */

async function suggestLogosForArticle(title, content, category) {
    try {
        // Extract keywords from title and content
        const keywords = extractKeywords(title, content, category);
        
        // Search for matching logos in database
        const { data: logos, error } = await supabase
            .from('tech_logos')
            .select('*')
            .or(
                keywords.map(keyword => 
                    `tags.cs.{${keyword}},company_name.ilike.%${keyword}%,image_name.ilike.%${keyword}%`
                ).join(',')
            )
            .limit(10);

        if (error) throw error;

        // Score and rank logos by relevance
        const rankedLogos = rankLogosByRelevance(logos || [], keywords, title, category);
        
        return rankedLogos.slice(0, 4); // Return top 4 suggestions
        
    } catch (error) {
        console.error('Error suggesting logos:', error);
        return [];
    }
}

function extractKeywords(title, content, category) {
    const keywords = new Set();
    
    // Add category-based keywords
    const categoryKeywords = {
        'AI & ML': ['ai', 'artificial intelligence', 'machine learning', 'neural', 'deep learning', 'openai', 'anthropic', 'chatgpt', 'claude'],
        'Cloud & Infrastructure': ['cloud', 'aws', 'azure', 'google cloud', 'vercel', 'supabase', 'docker', 'kubernetes'],
        'Development Tools': ['github', 'gitlab', 'vscode', 'visual studio', 'intellij', 'cursor', 'postman'],
        'Web Development': ['react', 'vue', 'angular', 'next.js', 'tailwind', 'javascript', 'typescript'],
        'Data Analytics': ['tableau', 'power bi', 'looker', 'grafana', 'mongodb', 'postgresql'],
        'Design & Creative': ['figma', 'sketch', 'adobe', 'canva', 'photoshop', 'illustrator']
    };
    
    if (categoryKeywords[category]) {
        categoryKeywords[category].forEach(keyword => keywords.add(keyword));
    }
    
    // Extract company/product names from title and content
    const text = (title + ' ' + content).toLowerCase();
    
    // Common tech companies and products
    const techTerms = [
        'openai', 'chatgpt', 'anthropic', 'claude', 'midjourney', 'stability',
        'github', 'gitlab', 'microsoft', 'google', 'apple', 'amazon', 'meta',
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'tailwind',
        'typescript', 'javascript', 'python', 'rust', 'go', 'java',
        'aws', 'azure', 'vercel', 'netlify', 'supabase', 'firebase',
        'docker', 'kubernetes', 'terraform', 'ansible',
        'figma', 'sketch', 'adobe', 'canva', 'framer',
        'notion', 'linear', 'jira', 'trello', 'slack', 'discord',
        'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'
    ];
    
    techTerms.forEach(term => {
        if (text.includes(term)) {
            keywords.add(term);
        }
    });
    
    // Extract quoted companies/products (e.g., "OpenAI's GPT-4")
    const quotes = text.match(/"([^"]+)"/g) || [];
    quotes.forEach(quote => {
        const cleaned = quote.replace(/['"]/g, '').toLowerCase();
        if (cleaned.length > 2) keywords.add(cleaned);
    });
    
    return Array.from(keywords);
}

function rankLogosByRelevance(logos, keywords, title, category) {
    return logos.map(logo => {
        let score = 0;
        const titleLower = title.toLowerCase();
        const companyLower = logo.company_name.toLowerCase();
        const imageLower = logo.image_name.toLowerCase();
        
        // Direct company name match in title (highest priority)
        if (titleLower.includes(companyLower)) {
            score += 100;
        }
        
        // Product/image name match in title
        if (titleLower.includes(imageLower.replace(' logo', ''))) {
            score += 80;
        }
        
        // Category match
        if (logo.category === category) {
            score += 30;
        }
        
        // Tag matches
        const logoTags = logo.tags || [];
        keywords.forEach(keyword => {
            if (logoTags.some(tag => tag.includes(keyword) || keyword.includes(tag))) {
                score += 20;
            }
        });
        
        // Company logo preference (usually better for articles)
        if (logo.is_company_logo) {
            score += 10;
        }
        
        // Bonus for well-known companies
        const popularCompanies = ['openai', 'google', 'microsoft', 'apple', 'amazon', 'meta', 'github'];
        if (popularCompanies.some(company => companyLower.includes(company))) {
            score += 15;
        }
        
        return { ...logo, relevanceScore: score };
    })
    .filter(logo => logo.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Function to display logo suggestions in the article editor
function displayLogoSuggestions(suggestions) {
    const suggestionsHtml = suggestions.map((logo, index) => `
        <div class="logo-suggestion" onclick="selectSuggestedLogo(${index + 1}, '${logo.image_url}', '${logo.company_name} - ${logo.image_name}')">
            <img src="${logo.image_url}" alt="${logo.company_name}" class="suggestion-image">
            <div class="suggestion-info">
                <strong>${logo.company_name}</strong>
                <span>${logo.image_name}</span>
                <span class="suggestion-score">Score: ${logo.relevanceScore}</span>
            </div>
        </div>
    `).join('');
    
    // Insert suggestions into the editor
    const suggestionsContainer = document.getElementById('logoSuggestions') || createSuggestionsContainer();
    suggestionsContainer.innerHTML = `
        <h4>💡 Suggested Logos</h4>
        <div class="suggestions-grid">
            ${suggestionsHtml}
        </div>
    `;
}

function createSuggestionsContainer() {
    const container = document.createElement('div');
    container.id = 'logoSuggestions';
    container.className = 'logo-suggestions-container';
    
    // Insert after the image section
    const imageSection = document.querySelector('.image-section');
    if (imageSection) {
        imageSection.parentNode.insertBefore(container, imageSection.nextSibling);
    }
    
    return container;
}

function selectSuggestedLogo(imageNumber, imageUrl, altText) {
    const previewDiv = document.getElementById(`image${imageNumber}Preview`);
    const uploadDiv = document.getElementById(`image${imageNumber}Upload`);
    
    if (previewDiv && uploadDiv) {
        previewDiv.innerHTML = `
            <img src="${imageUrl}" class="image-preview" alt="${altText}">
            <div class="image-info">Suggested: ${altText}</div>
        `;
        
        uploadDiv.classList.add('has-image');
        
        // Add remove button if not exists
        const buttons = uploadDiv.querySelector('.file-button').parentNode;
        if (!buttons.querySelector('.file-button[onclick*="removeImage"]')) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'file-button';
            removeBtn.style.cssText = 'margin-left: 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: #ef4444;';
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => removeImage(imageNumber);
            buttons.appendChild(removeBtn);
        }
        
        showMessage(`Selected ${altText} for Image ${imageNumber}`, 'success');
    }
}

// Auto-suggest when article content changes
function autoSuggestLogos() {
    const title = document.getElementById('articleTitle')?.value || '';
    const content = document.getElementById('articleContent')?.value || '';
    const category = document.getElementById('articleCategory')?.value || '';
    
    if (title && content && category) {
        suggestLogosForArticle(title, content, category).then(suggestions => {
            if (suggestions.length > 0) {
                displayLogoSuggestions(suggestions);
            }
        });
    }
}

// Add to article-manager.html CSS
const logoSuggestionStyles = `
<style>
.logo-suggestions-container {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(0, 191, 255, 0.3);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

.logo-suggestions-container h4 {
    color: #87ceeb;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}

.logo-suggestion {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    gap: 12px;
    align-items: center;
}

.logo-suggestion:hover {
    border-color: #00bfff;
    background: rgba(0, 191, 255, 0.05);
}

.suggestion-image {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
}

.suggestion-info {
    flex: 1;
    min-width: 0;
}

.suggestion-info strong {
    display: block;
    color: #ffffff;
    font-size: 0.9rem;
    margin-bottom: 2px;
}

.suggestion-info span {
    display: block;
    color: #a0a9c0;
    font-size: 0.8rem;
}

.suggestion-score {
    color: #00bfff !important;
    font-size: 0.7rem !important;
}
</style>
`;

// Add styles to page
if (!document.getElementById('logoSuggestionStyles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'logoSuggestionStyles';
    styleElement.innerHTML = logoSuggestionStyles;
    document.head.appendChild(styleElement);
}

// Export functions for use in article-manager.html
if (typeof module !== 'undefined') {
    module.exports = {
        suggestLogosForArticle,
        autoSuggestLogos,
        displayLogoSuggestions,
        selectSuggestedLogo
    };
}