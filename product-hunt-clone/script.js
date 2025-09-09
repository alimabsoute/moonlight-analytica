class ProductHuntClone {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentSort = 'votes';
        this.currentCategory = '';
        this.currentSearch = '';
        this.productsPerPage = 12;
        this.currentPage = 1;
        
        this.init();
    }

    init() {
        this.generateMockData();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.renderProducts();
    }

    generateMockData() {
        const mockProducts = [
            {
                id: 1,
                name: "TaskFlow AI",
                tagline: "AI-powered task management for busy professionals",
                description: "Revolutionary task management app that uses AI to prioritize your work, predict deadlines, and optimize your daily schedule for maximum productivity.",
                website: "https://taskflow-ai.com",
                logo: "https://via.placeholder.com/80x80/4f46e5/ffffff?text=TF",
                category: "productivity",
                votes: 342,
                comments: 28,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: "Sarah Chen",
                featured: true
            },
            {
                id: 2,
                name: "DesignCraft",
                tagline: "Create stunning designs with AI assistance",
                description: "Professional design tool that combines traditional design principles with AI to help you create beautiful graphics, logos, and marketing materials in minutes.",
                website: "https://designcraft.io",
                logo: "https://via.placeholder.com/80x80/06b6d4/ffffff?text=DC",
                category: "design",
                votes: 287,
                comments: 19,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: "Alex Rodriguez",
                featured: false
            },
            {
                id: 3,
                name: "CodeSnap",
                tagline: "Beautiful code screenshots in seconds",
                description: "Transform your code into beautiful, shareable images with syntax highlighting, custom themes, and social media optimization.",
                website: "https://codesnap.dev",
                logo: "https://via.placeholder.com/80x80/10b981/ffffff?text=CS",
                category: "development",
                votes: 195,
                comments: 15,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: "Dev Team",
                featured: false
            },
            {
                id: 4,
                name: "MarketPulse",
                tagline: "Real-time marketing analytics dashboard",
                description: "Get insights into your marketing campaigns with real-time analytics, A/B testing tools, and predictive performance modeling.",
                website: "https://marketpulse.com",
                logo: "https://via.placeholder.com/80x80/f59e0b/ffffff?text=MP",
                category: "marketing",
                votes: 156,
                comments: 12,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: "Marketing Team",
                featured: false
            },
            {
                id: 5,
                name: "Neural Writer",
                tagline: "AI writing assistant for content creators",
                description: "Advanced AI writing tool that helps content creators, bloggers, and marketers produce high-quality content faster with intelligent suggestions and editing.",
                website: "https://neuralwriter.ai",
                logo: "https://via.placeholder.com/80x80/8b5cf6/ffffff?text=NW",
                category: "ai",
                votes: 423,
                comments: 34,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: "AI Labs",
                featured: true
            },
            {
                id: 6,
                name: "MobileFirst",
                tagline: "No-code mobile app builder",
                description: "Build professional mobile apps without coding. Drag-and-drop interface, native performance, and one-click deployment to app stores.",
                website: "https://mobilefirst.app",
                logo: "https://via.placeholder.com/80x80/ef4444/ffffff?text=MF",
                category: "mobile",
                votes: 298,
                comments: 22,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: "Mobile Team",
                featured: false
            },
            {
                id: 7,
                name: "CloudSync Pro",
                tagline: "Universal file synchronization service",
                description: "Sync files across all your devices and cloud services. Support for Google Drive, Dropbox, OneDrive, and more with intelligent conflict resolution.",
                website: "https://cloudsync-pro.com",
                logo: "https://via.placeholder.com/80x80/06b6d4/ffffff?text=CP",
                category: "saas",
                votes: 234,
                comments: 18,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: "Cloud Team",
                featured: false
            },
            {
                id: 8,
                name: "FocusTime",
                tagline: "Pomodoro timer with productivity insights",
                description: "Smart Pomodoro timer that tracks your focus patterns, provides productivity insights, and helps you optimize your work sessions for better results.",
                website: "https://focustime.app",
                logo: "https://via.placeholder.com/80x80/10b981/ffffff?text=FT",
                category: "productivity",
                votes: 187,
                comments: 14,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: "Productivity Co",
                featured: false
            }
        ];

        // Generate more products to simulate a full database
        for (let i = 9; i <= 50; i++) {
            const categories = ['productivity', 'design', 'development', 'marketing', 'ai', 'mobile', 'saas'];
            const category = categories[Math.floor(Math.random() * categories.length)];
            
            mockProducts.push({
                id: i,
                name: `Product ${i}`,
                tagline: `Amazing ${category} tool for modern teams`,
                description: `This is a fantastic ${category} product that helps teams work more efficiently and achieve better results.`,
                website: `https://product${i}.com`,
                logo: `https://via.placeholder.com/80x80/${this.getRandomColor()}/ffffff?text=P${i}`,
                category: category,
                votes: Math.floor(Math.random() * 500) + 10,
                comments: Math.floor(Math.random() * 50) + 1,
                submittedAt: new Date(Date.now() - Math.random() * 86400000),
                maker: `Maker ${i}`,
                featured: Math.random() < 0.1
            });
        }

        this.products = mockProducts;
        this.filteredProducts = [...mockProducts];
    }

    getRandomColor() {
        const colors = ['4f46e5', '06b6d4', '10b981', 'f59e0b', '8b5cf6', 'ef4444', '6366f1', '14b8a6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.currentSearch = e.target.value.toLowerCase();
            this.filterAndSort();
        });

        // Sort functionality
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.filterAndSort();
        });

        // Category filter
        document.getElementById('category-select').addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.filterAndSort();
        });

        // Modal functionality
        document.getElementById('submit-product-btn').addEventListener('click', () => {
            this.openSubmitModal();
        });

        document.getElementById('modal-close-btn').addEventListener('click', () => {
            this.closeSubmitModal();
        });

        document.getElementById('product-modal-close').addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeSubmitModal();
        });

        // Form submission
        document.getElementById('submit-form').addEventListener('submit', (e) => {
            this.handleProductSubmission(e);
        });

        // Load more functionality
        document.getElementById('load-more-btn').addEventListener('click', () => {
            this.loadMoreProducts();
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeSubmitModal();
                this.closeProductModal();
            }
        });
    }

    updateCurrentDate() {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);
    }

    filterAndSort() {
        let filtered = [...this.products];

        // Apply search filter
        if (this.currentSearch) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(this.currentSearch) ||
                product.tagline.toLowerCase().includes(this.currentSearch) ||
                product.description.toLowerCase().includes(this.currentSearch)
            );
        }

        // Apply category filter
        if (this.currentCategory) {
            filtered = filtered.filter(product => product.category === this.currentCategory);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'votes':
                    return b.votes - a.votes;
                case 'newest':
                    return new Date(b.submittedAt) - new Date(a.submittedAt);
                case 'trending':
                    // Trending algorithm based on votes and recency
                    const aScore = a.votes * (1 - (Date.now() - new Date(a.submittedAt)) / (1000 * 60 * 60 * 24));
                    const bScore = b.votes * (1 - (Date.now() - new Date(b.submittedAt)) / (1000 * 60 * 60 * 24));
                    return bScore - aScore;
                default:
                    return b.votes - a.votes;
            }
        });

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderProducts();
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        const startIndex = 0;
        const endIndex = this.currentPage * this.productsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        container.innerHTML = productsToShow.map((product, index) => this.createProductCard(product, index)).join('');

        // Update load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (endIndex >= this.filteredProducts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }

        // Add event listeners to product cards
        this.addProductCardListeners();
    }

    createProductCard(product, index) {
        const rankBadge = index < 3 ? `<div class="rank-badge">#${index + 1}</div>` : '';
        const featuredBadge = product.featured ? '<div class="featured-badge">Featured</div>' : '';
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                ${rankBadge}
                ${featuredBadge}
                <div class="product-vote">
                    <button class="vote-btn" data-product-id="${product.id}">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <span class="vote-count">${product.votes}</span>
                </div>
                <div class="product-info">
                    <div class="product-header">
                        <img src="${product.logo}" alt="${product.name}" class="product-logo">
                        <div class="product-main">
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-tagline">${product.tagline}</p>
                        </div>
                    </div>
                    <div class="product-meta">
                        <span class="product-category">${this.formatCategory(product.category)}</span>
                        <span class="product-comments">
                            <i class="fas fa-comment"></i> ${product.comments}
                        </span>
                        <span class="product-maker">by ${product.maker}</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatCategory(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
    }

    addProductCardListeners() {
        // Vote buttons
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleVote(parseInt(btn.dataset.productId));
            });
        });

        // Product cards
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openProductModal(parseInt(card.dataset.productId));
            });
        });
    }

    handleVote(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            // Check if user has already voted (in real app, this would be stored)
            const hasVoted = localStorage.getItem(`voted_${productId}`);
            
            if (!hasVoted) {
                product.votes++;
                localStorage.setItem(`voted_${productId}`, 'true');
                
                // Update the display
                const voteCount = document.querySelector(`[data-product-id="${productId}"] .vote-count`);
                const voteBtn = document.querySelector(`[data-product-id="${productId}"] .vote-btn`);
                
                if (voteCount) {
                    voteCount.textContent = product.votes;
                    voteBtn.classList.add('voted');
                }
                
                // Re-sort if needed
                this.filterAndSort();
            }
        }
    }

    loadMoreProducts() {
        this.currentPage++;
        this.renderProducts();
    }

    openSubmitModal() {
        document.getElementById('submit-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSubmitModal() {
        document.getElementById('submit-modal').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('submit-form').reset();
    }

    openProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            const modalContent = document.getElementById('product-detail-content');
            modalContent.innerHTML = this.createProductDetail(product);
            document.getElementById('product-modal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeProductModal() {
        document.getElementById('product-modal').classList.remove('active');
        document.body.style.overflow = '';
    }

    createProductDetail(product) {
        return `
            <div class="product-detail-header">
                <img src="${product.logo}" alt="${product.name}" class="product-detail-logo">
                <div class="product-detail-info">
                    <h2>${product.name}</h2>
                    <p class="product-detail-tagline">${product.tagline}</p>
                    <div class="product-detail-meta">
                        <span class="category-tag">${this.formatCategory(product.category)}</span>
                        <span class="maker">by ${product.maker}</span>
                    </div>
                </div>
                <div class="product-detail-vote">
                    <button class="vote-btn large" data-product-id="${product.id}">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <span class="vote-count">${product.votes}</span>
                </div>
            </div>
            <div class="product-detail-body">
                <p class="product-description">${product.description}</p>
                <div class="product-actions">
                    <a href="${product.website}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i>
                        Visit Website
                    </a>
                    <button class="btn btn-secondary">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                </div>
                <div class="product-stats">
                    <div class="stat">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${product.votes} upvotes</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-comment"></i>
                        <span>${product.comments} comments</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-calendar"></i>
                        <span>Submitted ${this.formatDate(product.submittedAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours < 1) {
            return 'just now';
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        }
    }

    handleProductSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newProduct = {
            id: this.products.length + 1,
            name: formData.get('name'),
            tagline: formData.get('tagline'),
            description: formData.get('description'),
            website: formData.get('website'),
            logo: formData.get('logo') || `https://via.placeholder.com/80x80/${this.getRandomColor()}/ffffff?text=${formData.get('name').charAt(0)}`,
            category: formData.get('category'),
            votes: 1,
            comments: 0,
            submittedAt: new Date(),
            maker: 'You',
            featured: false
        };

        this.products.unshift(newProduct);
        this.filterAndSort();
        this.closeSubmitModal();
        
        // Show success message
        this.showNotification('Product submitted successfully!', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ProductHuntClone();
});