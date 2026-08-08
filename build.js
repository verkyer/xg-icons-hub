const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const { getIcons } = require('./server/services/iconScanner');
const { applyHtml } = require('./server/services/htmlTemplate');

const DIST_DIR = path.join(__dirname, 'dist');
const API_DIR = path.join(DIST_DIR, 'api');

// Helper to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('Starting build...');

// 1. Clean/Create dist
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);
fs.mkdirSync(API_DIR);

console.log('Created dist directory');

// 2. Generate API Data
const config = {
    SITE_NAME: process.env.SITE_NAME || 'XG-icons',
    LOGO_IMG: process.env.LOGO_IMG || 'favicon.ico',
    COPYRIGHT: process.env.COPYRIGHT || 'By <a href="https://github.com/verkyer/xg-icons-hub" target="_blank">xg-icons-hub</a>. @<a href="https://www.xiaoge.org" target="_blank">XiaoGe</a>.',
    SEO_DESC: process.env.SEO_DESC || '又一个图标托管项目~ 让你的 Docker 、导航站更 Nice！',
    FAVICON: process.env.FAVICON || 'favicon.ico',
    ICP: process.env.ICP || '',
    UMAMI_URL: process.env.UMAMI_URL || '',
    UMAMI_SITE_ID: process.env.UMAMI_SITE_ID || ''
};

fs.writeFileSync(path.join(API_DIR, 'config.json'), JSON.stringify(config, null, 2));
console.log('Generated api/config.json');

try {
    const icons = getIcons();
    fs.writeFileSync(path.join(API_DIR, 'icons.json'), JSON.stringify(icons, null, 2));
    console.log(`Generated api/icons.json with ${icons.length} categories`);
} catch (error) {
    fs.writeFileSync(path.join(API_DIR, 'icons.json'), JSON.stringify([], null, 2));
    console.warn('Icons directory missing or unreadable, generated empty icons.json');
}

// 3. Copy Static Assets
copyDir(path.join(__dirname, 'static'), path.join(DIST_DIR, 'static'));
console.log('Copied static assets');

const srcImages = path.join(__dirname, 'images');
if (fs.existsSync(srcImages)) {
    copyDir(srcImages, path.join(DIST_DIR, 'images'));
    console.log('Copied images');
} else {
    console.log('Images directory not found, skip copying');
}

// 4. Copy and Process HTML
let html = fs.readFileSync(path.join(__dirname, 'views/index.html'), 'utf-8');
html = applyHtml(html, config);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
console.log('Copied index.html');

// 5. Minify JavaScript in build output only
Promise.all(['script.js', 'modal.js'].map(async (filename) => {
    const outputPath = path.join(DIST_DIR, 'static', filename);
    const source = fs.readFileSync(outputPath, 'utf-8');
    const result = await minify(source, { compress: true, mangle: true });

    if (!result.code) {
        throw new Error(`Failed to minify ${filename}`);
    }

    fs.writeFileSync(outputPath, result.code);
})).then(() => {
    console.log('Minified JavaScript');
    console.log('Build complete! Output directory: dist');
}).catch((error) => {
    console.error('Build failed while minifying JavaScript:', error);
    process.exitCode = 1;
});
