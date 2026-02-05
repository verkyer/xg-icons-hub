const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../../images');

/**
 * Custom sort function based on requirements:
 * 1. Starts with Number (Pure numbers, versions like 1-1)
 * 2. Starts with Uppercase Letter (A-Z)
 * 3. Starts with Lowercase Letter (a-z)
 * 4. Others
 */
function customSort(a, b) {
    const nameA = path.parse(a).name;
    const nameB = path.parse(b).name;

    function getGroup(name) {
        if (/^\d/.test(name)) return 0; // Starts with digit
        if (/^[A-Z]/.test(name)) return 1; // Starts with Uppercase
        if (/^[a-z]/.test(name)) return 2; // Starts with Lowercase
        return 3; // Others
    }

    const groupA = getGroup(nameA);
    const groupB = getGroup(nameB);

    if (groupA !== groupB) {
        return groupA - groupB;
    }

    // Within same group, use natural sort (handles 1 vs 10, 1 vs 1-1)
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
}

function getIcons() {
    if (!fs.existsSync(IMAGES_DIR)) {
        return [];
    }

    const categories = fs.readdirSync(IMAGES_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
        .map(dirent => dirent.name);

    const result = categories.map(category => {
        const categoryPath = path.join(IMAGES_DIR, category);
        const files = fs.readdirSync(categoryPath)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg', '.gif'].includes(ext);
            })
            .sort(customSort);

        return {
            name: category,
            icons: files
        };
    }).filter(cat => cat.icons.length > 0); // Optional: filter out empty categories

    return result;
}

module.exports = { getIcons };
