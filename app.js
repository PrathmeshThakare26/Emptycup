document.addEventListener('DOMContentLoaded', function() {
    initPage();
});

let allDesigners = [];
let showOnlyShortlisted = false;
let currentSort = 'default';

// Initialize page
function initPage() {
    showLoadingState();
    setupEventListeners();
    fetchDesigners();
}

// Show loading spinner
function showLoadingState() {
    const designersList = document.getElementById('designers-list');
    designersList.innerHTML = `
        <div class="loader">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading designers...</p>
        </div>
    `;
}

// Fetch designers from API
async function fetchDesigners() {
    try {
        const response = await fetch('http://localhost:5000/api/designers');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allDesigners = await response.json();
        
        if (allDesigners.length === 0) {
            showFeatureMessage('Database is empty');
        }
        
        renderDesigners(allDesigners);
    } catch (error) {
        console.error('API Error:', error);
        showErrorState();
    }
}

// Render designers list
function renderDesigners(designers) {
    const designersList = document.getElementById('designers-list');
    designersList.innerHTML = '';
    
    if (designers.length === 0) {
        designersList.innerHTML = `
            <div class="empty-state">
                <i class="far fa-folder-open"></i>
                <p>No designers found</p>
                <button id="retry-btn" class="action-btn">Retry</button>
            </div>
        `;
        document.getElementById('retry-btn').addEventListener('click', fetchDesigners);
        return;
    }
    
    // Apply sorting
    const sortedDesigners = [...designers].sort((a, b) => {
        if (currentSort === 'experience') return b.experience - a.experience;
        if (currentSort === 'projects') return b.projects - a.projects;
        if (currentSort === 'rating') return b.rating - a.rating;
        return 0;
    });
    
    // Filter shortlisted if enabled
    const filteredDesigners = showOnlyShortlisted
        ? sortedDesigners.filter(d => localStorage.getItem(`shortlisted_${d.id}`) === 'true')
        : sortedDesigners;
    
    // Render each designer
    filteredDesigners.forEach((designer, index) => {
        const isShortlisted = localStorage.getItem(`shortlisted_${designer.id}`) === 'true';
        
        const designerCard = document.createElement('div');
        designerCard.className = 'designer-card';
        designerCard.style.animationDelay = `${index * 0.1}s`;
        
        designerCard.innerHTML = `
            <div class="designer-content">
                <h2 class="designer-name">${designer.name}</h2>
                <div class="rating">${'★'.repeat(designer.rating)}${'☆'.repeat(5 - designer.rating)}</div>
                <p class="designer-description">${designer.description}</p>
                <div class="designer-stats">
                    <div class="stat-item">
                        <span class="stat-value">${designer.projects}</span>
                        <span class="stat-label">Projects</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${designer.experience}</span>
                        <span class="stat-label">Years</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${designer.price}</span>
                        <span class="stat-label">Price</span>
                    </div>
                </div>
                <div class="contact">
                    ${designer.phones.map(phone => `<div><i class="fas fa-phone-alt"></i> ${phone}</div>`).join('')}
                </div>
            </div>
            <div class="actions">
                <button class="action-btn details-btn" data-tooltip="View Details">
                    <i class="fas fa-info-circle"></i>
                    <span>Details</span>
                </button>
                <button class="action-btn hide-btn" data-tooltip="Hide Designer">
                    <i class="fas fa-eye-slash"></i>
                    <span>Hide</span>
                </button>
                <button class="action-btn shortlist-btn ${isShortlisted ? 'active' : ''}" 
                        data-id="${designer.id}" data-tooltip="${isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}">
                    <i class="${isShortlisted ? 'fas' : 'far'} fa-bookmark"></i>
                    <span>Shortlist</span>
                </button>
                <button class="action-btn call-btn" data-tooltip="Call Designer">
                    <i class="fas fa-phone-alt"></i>
                    <span>Call</span>
                </button>
            </div>
        `;
        
        designersList.appendChild(designerCard);
    });
    
    setupCardInteractions();
}

// Event listeners for main controls
function setupEventListeners() {
    // Shortlisted filter toggle
    document.getElementById('shortlisted-filter').addEventListener('click', function(e) {
        e.preventDefault();
        showOnlyShortlisted = !showOnlyShortlisted;
        this.classList.toggle('active-filter');
        renderDesigners(allDesigners);
    });
    
    // Sort button
    document.querySelector('.sort-btn').addEventListener('click', function(e) {
        e.preventDefault();
        const sortOptions = ['default', 'rating', 'experience', 'projects'];
        currentSort = sortOptions[(sortOptions.indexOf(currentSort) + 1) % sortOptions.length];
        renderDesigners(allDesigners);
    });
}

// Event listeners for designer cards
function setupCardInteractions() {
    // Shortlist button
    document.querySelectorAll('.shortlist-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const designerId = this.getAttribute('data-id');
            const isShortlisted = localStorage.getItem(`shortlisted_${designerId}`) === 'true';
            localStorage.setItem(`shortlisted_${designerId}`, !isShortlisted);
            renderDesigners(allDesigners);
        });
    });
    
    // Other button interactions...
}

// Show error state
function showErrorState() {
    const designersList = document.getElementById('designers-list');
    designersList.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load designers</p>
            <button id="retry-btn" class="action-btn">Retry</button>
        </div>
    `;
    document.getElementById('retry-btn').addEventListener('click', fetchDesigners);
}

// Show notification message
function showFeatureMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'feature-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Add dynamic styles
const style = document.createElement('style');
style.textContent = `
    .loader, .empty-state, .error-state {
        text-align: center;
        padding: 2rem;
    }
    .loader i, .error-state i {
        font-size: 2rem;
        margin-bottom: 1rem;
    }
    .loader i {
        color: #00b894;
        animation: spin 1s linear infinite;
    }
    .error-state i {
        color: #d63031;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .action-btn {
        transition: all 0.3s ease;
    }
    .shortlist-btn.active {
        color: #00b894;
    }
`;
document.head.appendChild(style);