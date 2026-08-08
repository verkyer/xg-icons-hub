const path = require('path');

/**
 * Normalizes asset paths (logo, favicon).
 * @param {string} val - The path or URL from config.
 * @param {string} defaultName - The default filename (e.g., 'favicon.ico').
 * @returns {string} Normalized path.
 */
function normalizeAsset(val, defaultName = 'favicon.ico') {
    let asset = val || defaultName;
    // If it's an absolute URL, return as is
    if (/^https?:\/\//.test(asset)) {
        return asset;
    }
    // Special case for default 'favicon.ico' -> map to /static/favicon.ico
    if (asset === defaultName) {
        return '/static/favicon.ico';
    }
    // Ensure it starts with /
    return asset.startsWith('/') ? asset : `/${asset}`;
}

function normalizeUmamiUrl(val) {
    const url = (val || '').trim().replace(/\/+$/, '');
    if (!url) return '';

    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol) ? url : '';
    } catch {
        return '';
    }
}

function escapeHtmlAttribute(val) {
    return String(val).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

/**
 * Injects configuration values into the HTML template.
 * @param {string} html - The raw HTML template.
 * @param {object} config - The configuration object containing SITE_NAME, LOGO_IMG, etc.
 * @returns {string} The processed HTML.
 */
function applyHtml(html, config) {
    const name = (config.SITE_NAME || 'XG-icons').trim();
    
    const logo = normalizeAsset(config.LOGO_IMG, 'favicon.ico');
    const favicon = normalizeAsset(config.FAVICON, 'favicon.ico');

    let out = html;

    // Replace Title
    out = out.replace(/<title>.*?<\/title>/i, `<title>${name}</title>`);
    out = out.replace(/<h1 id="siteTitle">.*?<\/h1>/i, `<h1 id="siteTitle">${name}</h1>`);

    // Replace Logo
    out = out.replace(/(<img id="siteLogo"[^>]*\bsrc=")[^"]*"/i, `$1${logo}"`);

    // Replace Favicon
    out = out.replace(/(<link id="faviconLink"[^>]*\bhref=")[^"]*"/i, `$1${favicon}"`);

    // Replace Meta Description
    const seoDesc = config.SEO_DESC || '又一个图标托管项目~ 让你的 Docker 、导航站更 Nice！';
    if (/name="description"/i.test(out)) {
        out = out.replace(/<meta name="description"[^>]*content="[^"]*"[^>]*>/i, `<meta name="description" content="${seoDesc}">`);
    } else {
        // Insert after </title> if not found
        out = out.replace(/<\/title>/i, `</title>\n    <meta name="description" content="${seoDesc}">`);
    }

    // Inject Umami analytics when both settings are configured
    const umamiUrl = normalizeUmamiUrl(config.UMAMI_URL);
    const umamiSiteId = (config.UMAMI_SITE_ID || '').trim();
    if (umamiUrl && umamiSiteId) {
        const scriptUrl = escapeHtmlAttribute(`${umamiUrl}/script.js`);
        const siteId = escapeHtmlAttribute(umamiSiteId);
        out = out.replace(/<\/head>/i, `    <script defer src="${scriptUrl}" data-website-id="${siteId}"></script>\n</head>`);
    }

    // Replace Footer
    const footerContent = (config.COPYRIGHT || '') + 
        (config.ICP ? `<br><a id="icpLink" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer nofollow">${config.ICP}</a>` : '');
    
    out = out.replace(/(<footer id="siteFooter"[^>]*>)[\s\S]*?(<\/footer>)/i, `$1${footerContent}$2`);
    out = out.replace(/(<footer id="mobileFooter"[^>]*>)[\s\S]*?(<\/footer>)/i, `$1${footerContent}$2`);

    return out;
}

module.exports = { applyHtml };
