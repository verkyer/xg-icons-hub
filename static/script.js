document.addEventListener('DOMContentLoaded', () => {
    const iconGrid = document.getElementById('iconGrid');
    const categoryList = document.getElementById('categoryList');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    const toast = document.getElementById('toast');
    const currentViewTitle = document.getElementById('currentViewTitle');
    const resultSummary = document.getElementById('resultSummary');
    const mobileResultCount = document.getElementById('mobileResultCount');

    const INITIAL_ICON_BATCH_SIZE = 88;
    const ICON_BATCH_SIZE = 48;

    let allIcons = []; // Stores the raw data
    let currentCategory = 'all';
    let iconNameMeasureFrame = 0;
    let filteredIcons = [];
    let renderedIconCount = 0;
    let iconRenderVersion = 0;
    let scheduledIconBatch = 0;
    let allCategoryRenderedCount = 0;

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
            let faviconSrc = config.FAVICON || 'favicon.ico';
            if (!/^https?:\/\//.test(faviconSrc)) {
                faviconSrc = faviconSrc === 'favicon.ico' ? '/static/favicon.ico' : (faviconSrc.startsWith('/') ? faviconSrc : `/${faviconSrc}`);
            }
            if (faviconLink) faviconLink.href = faviconSrc;

            // Update Footer
            const siteFooter = document.getElementById('siteFooter');
            if (siteFooter) siteFooter.innerHTML = config.COPYRIGHT + (config.ICP ? `<br><a id="icpLink" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer nofollow">${config.ICP}</a>` : '');
            
            const mobileFooter = document.getElementById('mobileFooter');
            if (mobileFooter) mobileFooter.innerHTML = config.COPYRIGHT + (config.ICP ? `<br><a id="icpLink" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer nofollow">${config.ICP}</a>` : '');
            
            const descTag = document.querySelector('meta[name="description"]');
            if (descTag && config.SEO_DESC) descTag.setAttribute('content', config.SEO_DESC);

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
            if (resultSummary) resultSummary.textContent = '读取失败';
        }
    }

    // 3. Render Categories
    // Scroll Management
    let allCategoryScrollTop = 0;
    const iconScrollArea = document.getElementById('iconScrollArea');
    const mobileCategorySelect = document.getElementById('mobileCategorySelect');
    const mobileCategoryLabel = document.getElementById('mobileCategoryLabel');
    const siteLogoEl = document.getElementById('siteLogo');
    const siteTitleEl = document.getElementById('siteTitle');

    function categoryItemMarkup(label, count) {
        return `<button type="button" class="menu-link"><span class="menu-label">${label}</span><span class="menu-count">${count}</span></button>`;
    }

    function renderCategories() {
        // Clear existing
        categoryList.innerHTML = '';
        mobileCategorySelect.innerHTML = '';

        // Add "All" option for Desktop
        const totalCount = allIcons.reduce((sum, cat) => sum + cat.icons.length, 0);
        const allLi = document.createElement('li');
        allLi.dataset.category = 'all';
        allLi.classList.add('active');
        allLi.innerHTML = categoryItemMarkup('全部', totalCount);
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
            const liSide = document.createElement('li');
            liSide.dataset.category = cat.name;
            liSide.innerHTML = categoryItemMarkup(cat.name, cat.icons.length);
            liSide.addEventListener('click', () => {
                switchCategory(cat.name, liSide);
            });
            categoryList.appendChild(liSide);

            // Mobile Option
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            mobileCategorySelect.appendChild(option);

        });

        syncMobileCategoryMenu('all');
        
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

    function syncMobileCategoryMenu(categoryName) {
        if (!mobileCategorySelect) return;
        const label = categoryName === 'all' ? '全部' : categoryName;
        mobileCategorySelect.setAttribute('aria-label', `选择分类，当前为 ${label}`);
        if (mobileCategoryLabel) mobileCategoryLabel.textContent = label;
    }

    function switchCategory(categoryName, activeElement) {
        // Save scroll position if we are currently on 'all'
        if (currentCategory === 'all' && categoryName !== 'all') {
            allCategoryScrollTop = iconScrollArea.scrollTop;
            allCategoryRenderedCount = renderedIconCount;
        }

        const restoreAllCategory = categoryName === 'all' && currentCategory !== 'all';

        currentCategory = categoryName;
        
        // Sync Desktop UI
        updateActiveCategory(activeElement);
        
        // Sync Mobile UI
        mobileCategorySelect.value = categoryName;
        syncMobileCategoryMenu(categoryName);

        renderIcons(restoreAllCategory ? Math.max(INITIAL_ICON_BATCH_SIZE, allCategoryRenderedCount) : INITIAL_ICON_BATCH_SIZE);

        // Restore or Reset scroll position
        if (currentCategory === 'all') {
            iconScrollArea.scrollTop = allCategoryScrollTop;
        } else {
            iconScrollArea.scrollTop = 0;
        }
    }

    window.__xgSelectCategory = (categoryName, filename) => {
        const target = Array.from(categoryList?.children || []).find(li => li.dataset.category === categoryName);
        if (!target) return false;
        switchCategory(categoryName, target);

        if (filename) locateIconCard(categoryName, filename);
        return true;
    };

    function updateActiveCategory(activeElement) {
        categoryList.querySelectorAll('li').forEach(el => el.classList.remove('active'));
        activeElement.classList.add('active');
    }

    // 4. Render Icons
    function measureOverflowingIconNames() {
        iconNameMeasureFrame = 0;
        iconGrid.querySelectorAll('.icon-name').forEach(label => {
            const text = label.querySelector('span');
            if (!text) return;

            const overflow = Math.max(0, text.scrollWidth - label.clientWidth);
            const isOverflowing = overflow > 1;
            label.classList.toggle('is-overflowing', isOverflowing);

            if (isOverflowing) {
                label.style.setProperty('--name-scroll-distance', `${overflow}px`);
            } else {
                label.style.removeProperty('--name-scroll-distance');
            }
        });
    }

    function scheduleIconNameMeasure() {
        if (iconNameMeasureFrame) cancelAnimationFrame(iconNameMeasureFrame);
        iconNameMeasureFrame = requestAnimationFrame(measureOverflowingIconNames);
    }

    function getFilteredIcons() {
        const query = searchInput.value.toLowerCase();
        const items = [];

        allIcons.forEach(cat => {
            if (currentCategory !== 'all' && cat.name !== currentCategory) return;

            cat.icons.forEach(filename => {
                const displayName = filename.replace(/\.[^/.]+$/, '');
                if (query && !displayName.toLowerCase().includes(query)) return;

                items.push({
                    category: cat.name,
                    filename,
                    displayName,
                    url: `${window.location.origin}/images/${cat.name}/${filename}`
                });
            });
        });

        if (currentCategory === 'all') {
            items.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-CN', { sensitivity: 'base' }) || a.category.localeCompare(b.category, 'zh-CN'));
        }

        return items;
    }

    function renderIcons(initialCount = INITIAL_ICON_BATCH_SIZE) {
        if (scheduledIconBatch) {
            cancelAnimationFrame(scheduledIconBatch);
            scheduledIconBatch = 0;
        }

        iconRenderVersion++;
        iconGrid.innerHTML = '';
        filteredIcons = getFilteredIcons();
        renderedIconCount = 0;
        appendIconCards(initialCount);

        const resultCount = filteredIcons.length;
        const query = searchInput.value.toLowerCase();

        if (currentViewTitle) {
            currentViewTitle.textContent = currentCategory === 'all' ? '全部图标' : `分类：${currentCategory}`;
        }
        if (resultSummary) {
            resultSummary.textContent = query ? `找到 ${resultCount} 个` : `${resultCount} 个图标`;
        }
        if (mobileResultCount) {
            mobileResultCount.textContent = resultCount > 0 ? resultCount : '';
            mobileResultCount.classList.toggle('hidden', resultCount === 0);
        }

        if (resultCount === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        scheduleIconNameMeasure();
    }

    function appendIconCards(count) {
        if (renderedIconCount >= filteredIcons.length) return;

        const fragment = document.createDocumentFragment();
        const end = Math.min(renderedIconCount + count, filteredIcons.length);

        for (let index = renderedIconCount; index < end; index++) {
            fragment.appendChild(createIconCard(filteredIcons[index], index));
        }

        iconGrid.appendChild(fragment);
        renderedIconCount = end;
        if (currentCategory === 'all') allCategoryRenderedCount = renderedIconCount;
        scheduleIconNameMeasure();
    }

    function queueNextIconBatch() {
        if (scheduledIconBatch || renderedIconCount >= filteredIcons.length) return;

        const renderVersion = iconRenderVersion;
        scheduledIconBatch = requestAnimationFrame(() => {
            scheduledIconBatch = 0;
            if (renderVersion !== iconRenderVersion) return;
            appendIconCards(ICON_BATCH_SIZE);
        });
    }

    function locateIconCard(category, filename) {
        const index = filteredIcons.findIndex(item => item.category === category && item.filename === filename);
        if (index < 0) return;

        if (index >= renderedIconCount) {
            appendIconCards(Math.max(ICON_BATCH_SIZE, index - renderedIconCount + 1));
        }

        const card = Array.from(iconGrid.children).find(item => item.dataset.category === category && item.dataset.filename === filename);
        if (!card) return;

        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            if (!card.isConnected) return;
            card.classList.add('locate-target');
            setTimeout(() => card.classList.remove('locate-target'), 2200);
        }, 550);
    }

    function createIconCard(item, index) {
        const { category, filename, displayName, url } = item;
        const div = document.createElement('div');
        div.className = 'icon-card';
        div.dataset.category = category;
        div.dataset.filename = filename;
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');

        div.innerHTML = `
            <div class="icon-img-wrapper">
                <img src="${url}" alt="${filename}" loading="lazy" onerror="this.src='/static/favicon.ico';this.style.opacity=0.5;">
            </div>
            <div class="icon-name" title="${displayName}">
                <span>${displayName}</span>
            </div>
        `;

        div.addEventListener('click', () => {
            openIconModal(item, index);
        });
        div.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openIconModal(item, index);
            }
        });

        return div;
    }

    function openIconModal(item, index) {
        if (window.__xgOpenModal) {
            window.__xgOpenModal(item, filteredIcons, index);
            return;
        }
        copyToClipboard(item.url, item.displayName);
    }

    // 5. Search
    const clearSearchBtn = document.getElementById('clearSearch');

    function focusSearch() {
        if (document.body.classList.contains('modal-open')) return;
        searchInput.focus();
        searchInput.select();
    }

    function toggleClearBtn() {
        const hasValue = searchInput.value.length > 0;
        clearSearchBtn.classList.toggle('hidden', !hasValue);
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

    document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            focusSearch();
        }
    });

    // 6. Copy to Clipboard
    async function copyToClipboard(text, label) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(`已复制：${label || text}`, 'success');
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            let copied = false;
            try {
                copied = document.execCommand("Copy");
            } catch (fallbackError) {
                console.error('Fallback copy failed: ', fallbackError);
            }
            textArea.remove();
            showToast(copied ? `已复制：${label || text}` : '复制失败，请重试', copied ? 'success' : 'error');
        }
    }

    const toastIcons = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
        warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'
    };

    function showToast(message, type = 'success') {
        const toastType = toastIcons[type] ? type : 'success';
        toast.dataset.type = toastType;
        toast.innerHTML = `${toastIcons[toastType]}<span class="toast-message"></span>`;
        toast.querySelector('.toast-message').textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Expose toast so modal.js can reuse the frosted-glass toast
    window.__xgToast = showToast;

    // 7. Back to Top
    const backToTopBtn = document.getElementById('backToTop');

    iconScrollArea.addEventListener('scroll', () => {
        if (iconScrollArea.scrollTop > 300) {
            backToTopBtn.classList.remove('hidden');
        } else {
            backToTopBtn.classList.add('hidden');
        }

        if (iconScrollArea.scrollTop + iconScrollArea.clientHeight >= iconScrollArea.scrollHeight - 400) {
            queueNextIconBatch();
        }
    });

    backToTopBtn.addEventListener('click', () => {
        iconScrollArea.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 8. Click Logo/Title to scroll to top
    function scrollTopViaLogo() {
        iconScrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (siteLogoEl) siteLogoEl.addEventListener('click', scrollTopViaLogo);
    if (siteTitleEl) siteTitleEl.addEventListener('click', scrollTopViaLogo);

    if ('ResizeObserver' in window) {
        const iconGridResizeObserver = new ResizeObserver(scheduleIconNameMeasure);
        iconGridResizeObserver.observe(iconGrid);
    } else {
        window.addEventListener('resize', scheduleIconNameMeasure);
    }

    // Init
    fetchConfig();
    fetchIcons();
});
