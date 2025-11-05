const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// API Endpoint 1: 提供地理数据 (TopoJSON)
router.get('/map/geojson', (req, res) => {
    const filePath = path.join(__dirname, '../data', 'london_topo.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading london_topo.json:', err);
            return res.status(500).json({ error: 'Failed to load map data' });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(500).json({ error: 'Invalid JSON format' });
        }
    });
});

// API Endpoint 2: 提供房价数据 (CSV -> JSON)
router.get('/housing', (req, res) => {
    const filePath = path.join(__dirname, '../data', 'london_house_data.csv');
    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.json(results);
        })
        .on('error', (err) => {
            console.error('Error reading CSV:', err);
            res.status(500).json({ error: 'Failed to load housing data' });
        });
});

// API Endpoint 3: 提供行政区数据
router.get('/boroughs', (req, res) => {
    const filePath = path.join(__dirname, '../data', 'boroughs-data.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading boroughs-data.json:', err);
            return res.status(500).json({ error: 'Failed to load boroughs data' });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(500).json({ error: 'Invalid JSON format' });
        }
    });
});

// API Endpoint 4: 提供统计数据
router.get('/stats', (req, res) => {
    const filePath = path.join(__dirname, '../data', 'stats-data.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading stats-data.json:', err);
            return res.status(500).json({ error: 'Failed to load stats data' });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(500).json({ error: 'Invalid JSON format' });
        }
    });
});

// 可选：提供所有可用API端点的列表
router.get('/', (req, res) => {
    res.json({
        message: 'London Housing Data API',
        version: '1.0.0',
        endpoints: [
            {
                path: '/api/data/map/geojson',
                method: 'GET',
                description: 'Get London boroughs geographic boundaries (TopoJSON)'
            },
            {
                path: '/api/data/housing',
                method: 'GET',
                description: 'Get historical housing price data for all boroughs'
            },
            {
                path: '/api/data/boroughs',
                method: 'GET',
                description: 'Get borough information and descriptions'
            },
            {
                path: '/api/data/stats',
                method: 'GET',
                description: 'Get statistical data and rankings'
            }
        ]
    });
});

module.exports = router;
