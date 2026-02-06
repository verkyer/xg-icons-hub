document.addEventListener('DOMContentLoaded', () => {
    const iconGrid = document.getElementById('iconGrid');
    const categoryList = document.getElementById('categoryList');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    const toast = document.getElementById('toast');

    let allIcons = []; // Stores the raw data
    let currentCategory = 'all';

    // 0. Fetch Config
    async function fetchConfig() {
        try {
            const res = await fetch('/api/config.json');
            const config = await res.json();

            // Update Title
            const siteName = (config.SITE_NAME && config.SITE_NAME.trim()) ? config.SITE_NAME.trim() : 'XG-icons';
            document.title = siteName;
            const siteTitle = document.getElementById('siteTitle');
            if (siteTitle) siteTitle.textContent = siteName;

            // Update Logo
            let logoSrc = config.LOGO_IMG;
            if (!/^https?:\/\//.test(logoSrc)) {
                if (logoSrc === 'favicon.ico') {
                    logoSrc = '/static/favicon.ico';
                } else {
                    logoSrc = logoSrc.startsWith('/') ? logoSrc : `/${logoSrc}`;
                }
            }
            
            const siteLogo = document.getElementById('siteLogo');
            if (siteLogo) siteLogo.src = logoSrc;
            
            const faviconLink = document.getElementById('faviconLink');
            if (faviconLink) faviconLink.href = logoSrc;

            // Update Footer
            const siteFooter = document.getElementById('siteFooter');
            if (siteFooter) siteFooter.innerHTML = config.COPYRIGHT;
            
            const mobileFooter = document.getElementById('mobileFooter');
            if (mobileFooter) mobileFooter.innerHTML = config.COPYRIGHT;

        } catch (error) {
            console.error('Error fetching config:', error);
        }
    }

    // 1. Theme Management
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // 2. Fetch Data
    async function fetchIcons() {
        try {
            const response = await fetch('/api/icons.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            allIcons = data;
            renderCategories();
            renderIcons();
            loading.classList.add('hidden');
        } catch (error) {
            console.error('Error fetching icons:', error);
            loading.innerText = '加载失败，请检查控制台';
        }
    }

    // 3. Render Categories
    // Scroll Management
    let allCategoryScrollTop = 0;
    const mainContent = document.querySelector('.main-content');
    const mobileCategorySelect = document.getElementById('mobileCategorySelect');
    const siteLogoEl = document.getElementById('siteLogo');
    const siteTitleEl = document.getElementById('siteTitle');

    function renderCategories() {
        // Clear existing
        categoryList.innerHTML = '';
        mobileCategorySelect.innerHTML = '';

        // Add "All" option for Desktop
        const allLi = document.createElement('li');
        allLi.textContent = `全部 (${allIcons.reduce((sum, cat) => sum + cat.icons.length, 0)})`;
        allLi.classList.add('active');
        allLi.addEventListener('click', () => {
            switchCategory('all', allLi);
        });
        categoryList.appendChild(allLi);

        // Add "All" option for Mobile
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '全部';
        mobileCategorySelect.appendChild(allOption);

        allIcons.forEach(cat => {
            // Desktop List Item
            const li = document.createElement('li');
            li.textContent = `${cat.name} (${cat.icons.length})`;
            li.dataset.category = cat.name; // Add data attribute for easier lookup
            li.addEventListener('click', () => {
                switchCategory(cat.name, li);
            });
            categoryList.appendChild(li);

            // Mobile Option
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            mobileCategorySelect.appendChild(option);
        });
        
        // Mobile Select Event Listener
        mobileCategorySelect.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            // Find corresponding list item to pass as activeElement (to keep states synced if resized)
            let activeLi = allLi;
            if (selectedCategory !== 'all') {
                const found = Array.from(categoryList.children).find(li => li.dataset.category === selectedCategory);
                if (found) activeLi = found;
            }
            switchCategory(selectedCategory, activeLi);
        });
    }

    function switchCategory(categoryName, activeElement) {
        // Save scroll position if we are currently on 'all'
        if (currentCategory === 'all') {
            allCategoryScrollTop = mainContent.scrollTop;
        }

        currentCategory = categoryName;
        
        // Sync Desktop UI
        updateActiveCategory(activeElement);
        
        // Sync Mobile UI
        mobileCategorySelect.value = categoryName;

        renderIcons();

        // Restore or Reset scroll position
        if (currentCategory === 'all') {
            mainContent.scrollTop = allCategoryScrollTop;
        } else {
            mainContent.scrollTop = 0;
        }
    }

    function updateActiveCategory(activeElement) {
        document.querySelectorAll('.category-nav li').forEach(el => el.classList.remove('active'));
        activeElement.classList.add('active');
    }

    // 4. Render Icons
    function renderIcons() {
        iconGrid.innerHTML = '';
        const query = searchInput.value.toLowerCase();
        let hasResults = false;

        allIcons.forEach(cat => {
            if (currentCategory !== 'all' && cat.name !== currentCategory) return;

            cat.icons.forEach(iconName => {
                // Filter by search
                if (query && !iconName.toLowerCase().includes(query)) return;

                hasResults = true;
                const card = createIconCard(cat.name, iconName);
                iconGrid.appendChild(card);
            });
        });

        if (!hasResults) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }

    function createIconCard(category, filename) {
        const div = document.createElement('div');
        div.className = 'icon-card';
        
        // Construct URL
        const url = `${window.location.origin}/images/${category}/${filename}`;
        
        // Display Name (hide extension)
        const displayName = filename.replace(/\.[^/.]+$/, "");

        div.innerHTML = `
            <div class="icon-img-wrapper">
                <img src="${url}" alt="${filename}" loading="lazy" onerror="this.src='/static/favicon.ico';this.style.opacity=0.5;">
            </div>
            <div class="icon-name" title="${displayName}">
                <span>${displayName}</span>
            </div>
        `;

        div.addEventListener('click', () => {
            copyToClipboard(url);
        });

        return div;
    }

    // 5. Search
    const clearSearchBtn = document.getElementById('clearSearch');

    function toggleClearBtn() {
        if (searchInput.value.length > 0) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
    }

    searchInput.addEventListener('input', () => {
        toggleClearBtn();
        renderIcons();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        toggleClearBtn();
        renderIcons();
        searchInput.focus();
    });

    // 6. Copy to Clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(`已复制: ${text}`);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("Copy");
            textArea.remove();
            showToast(`已复制: ${text}`);
        }
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // 7. Back to Top
    const backToTopBtn = document.getElementById('backToTop');

    mainContent.addEventListener('scroll', () => {
        if (mainContent.scrollTop > 300) {
            backToTopBtn.classList.remove('hidden');
        } else {
            backToTopBtn.classList.add('hidden');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        mainContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 8. Click Logo/Title to scroll to top
    function scrollTopViaLogo() {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (siteLogoEl) siteLogoEl.addEventListener('click', scrollTopViaLogo);
    if (siteTitleEl) siteTitleEl.addEventListener('click', scrollTopViaLogo);

    // Init
    fetchConfig();
    fetchIcons();
});
