require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getIcons } = require('./services/iconScanner');

const app = express();
const PORT = process.env.PORT || 3000;

// Config Defaults
const CONFIG = {
    SITE_NAME: process.env.SITE_NAME || 'XG-icons',
    LOGO_IMG: process.env.LOGO_IMG || 'favicon.ico',
    COPYRIGHT: process.env.COPYRIGHT || 'By <a href="https://github.com/verkyer/xg-icons-hub" target="_blank">xg-icons-hub</a>. @<a href="https://www.xiaoge.org" target="_blank">XiaoGe</a>.'
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

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`- Icons: http://localhost:${PORT}/images`);
    console.log(`- API:   http://localhost:${PORT}/api/icons.json`);
});
