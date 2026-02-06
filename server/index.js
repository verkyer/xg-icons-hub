require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getIcons } = require('./services/iconScanner');

const app = express();
const PORT = process.env.PORT || 5000;

// Config Defaults
const CONFIG = {
    SITE_NAME: process.env.SITE_NAME || 'XG-icons',
    LOGO_IMG: process.env.LOGO_IMG || 'favicon.ico',
    COPYRIGHT: process.env.COPYRIGHT || 'By <a href="https://github.com/verkyer/xg-icons-hub" target="_blank">xg-icons-hub</a>. @<a href="https://www.xiaoge.org" target="_blank">XiaoGe</a>.',
    SEO_DESC: process.env.SEO_DESC || '又一个图标托管项目~ 让你的 Docker 、导航站更 Nice！',
    FAVICON: process.env.FAVICON || 'favicon.ico'
};

// Middleware
app.use(cors());

// Static Files - Core Requirement: /images path must remain stable
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/static', express.static(path.join(__dirname, '../static')));

// API Routes
app.get('/api/config.json', (req, res) => {
    res.json(CONFIG);
});

app.get('/api/icons.json', (req, res) => {
    try {
        const data = getIcons();
        res.json(data);
    } catch (error) {
        console.error('Error scanning icons:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function applyHtml(html) {
    const name = (CONFIG.SITE_NAME || 'XG-icons').trim();
    let logo = CONFIG.LOGO_IMG || 'favicon.ico';
    if (!/^https?:\/\//.test(logo)) {
        logo = logo === 'favicon.ico' ? '/static/favicon.ico' : (logo.startsWith('/') ? logo : `/${logo}`);
    }
    let favicon = CONFIG.FAVICON || 'favicon.ico';
    if (!/^https?:\/\//.test(favicon)) {
        favicon = favicon === 'favicon.ico' ? '/static/favicon.ico' : (favicon.startsWith('/') ? favicon : `/${favicon}`);
    }
    html = html.replace(/<title>.*?<\/title>/i, `<title>${name}</title>`);
    html = html.replace(/<h1 id="siteTitle">.*?<\/h1>/i, `<h1 id="siteTitle">${name}</h1>`);
    html = html.replace(/<img id="siteLogo"[^>]*src="[^"]*"/i, (m)=>m.replace(/src="[^"]*"/, `src="${logo}"`));
    html = html.replace(/<link id="faviconLink"[^>]*href="[^"]*"/i, (m)=>m.replace(/href="[^"]*"/, `href="${favicon}"`));
    if (/name="description"/i.test(html)) {
        html = html.replace(/<meta name="description"[^>]*content="[^"]*"/i, `<meta name="description" content="${CONFIG.SEO_DESC}">`);
    } else {
        html = html.replace(/<\/title>/i, `</title>\n    <meta name="description" content="${CONFIG.SEO_DESC}">`);
    }
    return html;
}

app.get('/', (req, res) => {
    const html = applyHtml(require('fs').readFileSync(path.join(__dirname, '../views/index.html'), 'utf-8'));
    res.type('html').send(html);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`- Icons: http://localhost:${PORT}/images`);
    console.log(`- API:   http://localhost:${PORT}/api/icons.json`);
});
