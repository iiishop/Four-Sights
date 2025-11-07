const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const housingDataCache = require('../utils/dataCache');

/**
 * @swagger
 * /api/data/map/geojson:
 *   get:
 *     summary: Get London borough geographic boundaries | 获取伦敦行政区地理边界数据
 *     description: Returns geographic boundary data for London boroughs in TopoJSON format for map rendering | 返回 TopoJSON 格式的伦敦各行政区地理边界数据，用于地图渲染
 *     tags: [Geographic Data]
 *     responses:
 *       200:
 *         description: Successfully returned geographic data | 成功返回地理数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Geographic data in TopoJSON format | TopoJSON 格式的地理数据
 *       500:
 *         description: Server error | 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/data/housing/query:
 *   get:
 *     summary: Flexible housing data query (Core API) | 灵活查询房价数据（核心 API）
 *     description: Flexible data query based on date range, region and fields, supporting multiple condition combinations | 根据日期范围、区域和字段进行灵活的数据查询，支持多条件组合
 *     tags: [Housing Data]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD or DD/MM/YY format) | 起始日期（YYYY-MM-DD 或 DD/MM/YY 格式）
 *         example: 2020-01-01
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD or DD/MM/YY format) | 结束日期（YYYY-MM-DD 或 DD/MM/YY 格式）
 *         example: 2020-12-31
 *       - in: query
 *         name: regions
 *         schema:
 *           type: string
 *         description: Comma-separated list of region names | 区域名称列表（逗号分隔）
 *         example: Camden,Westminster
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return | 需要返回的字段列表（逗号分隔）
 *         example: Date,RegionName,AveragePrice
 *     responses:
 *       200:
 *         description: Query successful | 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueryResponse'
 *       503:
 *         description: Data not yet loaded | 数据尚未加载
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Query failed | 查询失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/housing/query', (req, res) => {
    try {
        if (!housingDataCache.isLoaded) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Data is still loading. Please try again in a moment.'
            });
        }

        const { dateFrom, dateTo, regions, fields } = req.query;

        // 解析参数
        const queryOptions = {};

        if (dateFrom) queryOptions.dateFrom = dateFrom;
        if (dateTo) queryOptions.dateTo = dateTo;
        if (regions) {
            queryOptions.regions = regions.split(',').map(r => r.trim());
        }
        if (fields) {
            queryOptions.fields = fields.split(',').map(f => f.trim());
        }

        // 执行查询
        const startTime = Date.now();
        const results = housingDataCache.query(queryOptions);
        const queryTime = Date.now() - startTime;

        res.json({
            data: results,
            count: results.length,
            queryTime: `${queryTime}ms`,
            query: queryOptions
        });

    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({
            error: 'Query Failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/data/housing/byDate/{date}:
 *   get:
 *     summary: Query housing data by date | 按日期查询房价数据
 *     description: Get housing data for all regions on a specific date | 获取指定日期所有区域的房价数据
 *     tags: [Housing Data]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format | 日期（YYYY-MM-DD 格式）
 *         example: 2020-01-01
 *       - in: query
 *         name: regions
 *         schema:
 *           type: string
 *         description: Comma-separated list of region names (optional) | 区域名称列表（可选，逗号分隔）
 *         example: Camden,Westminster
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return (optional) | 需要返回的字段列表（可选，逗号分隔）
 *         example: RegionName,AveragePrice
 *     responses:
 *       200:
 *         description: Query successful | 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HousingDataRow'
 *                 count:
 *                   type: integer
 *                 date:
 *                   type: string
 *       503:
 *         description: Data not yet loaded | 数据尚未加载
 */
router.get('/housing/byDate/:date', (req, res) => {
    try {
        if (!housingDataCache.isLoaded) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Data is still loading.'
            });
        }

        const { date } = req.params;
        const { fields, regions } = req.query;

        const queryOptions = {
            dateFrom: date,
            dateTo: date
        };

        if (regions) {
            queryOptions.regions = regions.split(',').map(r => r.trim());
        }
        if (fields) {
            queryOptions.fields = fields.split(',').map(f => f.trim());
        }

        const results = housingDataCache.query(queryOptions);

        res.json({
            data: results,
            count: results.length,
            date: date
        });

    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({
            error: 'Query Failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/data/housing/byRegion/{region}:
 *   get:
 *     summary: Query housing data by region | 按区域查询房价数据
 *     description: Get historical housing price data for a specific region | 获取指定区域的历史房价数据
 *     tags: [Housing Data]
 *     parameters:
 *       - in: path
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *         description: Region name | 区域名称
 *         example: Camden
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (optional) | 起始日期（可选）
 *         example: 2020-01-01
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (optional) | 结束日期（可选）
 *         example: 2020-12-31
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to return (optional) | 需要返回的字段列表（可选，逗号分隔）
 *         example: Date,AveragePrice
 *     responses:
 *       200:
 *         description: Query successful | 查询成功
 *       503:
 *         description: Data not yet loaded | 数据尚未加载
 */
router.get('/housing/byRegion/:region', (req, res) => {
    try {
        if (!housingDataCache.isLoaded) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Data is still loading.'
            });
        }

        const { region } = req.params;
        const { dateFrom, dateTo, fields } = req.query;

        const queryOptions = {
            regions: [region]
        };

        if (dateFrom) queryOptions.dateFrom = dateFrom;
        if (dateTo) queryOptions.dateTo = dateTo;
        if (fields) {
            queryOptions.fields = fields.split(',').map(f => f.trim());
        }

        const results = housingDataCache.query(queryOptions);

        res.json({
            data: results,
            count: results.length,
            region: region
        });

    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({
            error: 'Query Failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/data/housing/metadata:
 *   get:
 *     summary: Get dataset metadata | 获取数据集元信息
 *     description: Returns metadata about the dataset including available dates, regions, and field list | 返回数据集的元数据，包括可用日期、区域、字段列表等
 *     tags: [Housing Data]
 *     responses:
 *       200:
 *         description: Metadata retrieved successfully | 成功返回元数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Metadata'
 *       500:
 *         description: Failed to retrieve metadata | 获取失败
 */
router.get('/housing/metadata', (req, res) => {
    try {
        const metadata = housingDataCache.getMetadata();
        res.json(metadata);
    } catch (error) {
        console.error('Metadata error:', error);
        res.status(500).json({
            error: 'Failed to get metadata',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/data/housing/reload:
 *   post:
 *     summary: Reload housing data | 重新加载房价数据
 *     description: Reload data from CSV file and rebuild indexes (admin function) | 从 CSV 文件重新加载数据并重建索引（管理功能）
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Reload successful | 重载成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 metadata:
 *                   $ref: '#/components/schemas/Metadata'
 *       500:
 *         description: Reload failed | 重载失败
 */
router.post('/housing/reload', async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../data', 'london_house_data.csv');
        await housingDataCache.reload(filePath);

        res.json({
            success: true,
            message: 'Data reloaded successfully',
            metadata: housingDataCache.getMetadata()
        });
    } catch (error) {
        console.error('Reload error:', error);
        res.status(500).json({
            error: 'Reload Failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/data/housing:
 *   get:
 *     summary: Get all housing data (legacy) | 获取所有房价数据（旧版）
 *     description: Returns all housing data without filtering (for backward compatibility, not recommended for production) | 返回所有未经过滤的房价数据（仅用于向后兼容，不推荐在生产环境使用）
 *     tags: [Housing Data]
 *     deprecated: true
 *     responses:
 *       200:
 *         description: Query successful | 查询成功
 *       503:
 *         description: Data not yet loaded | 数据尚未加载
 */
// API Endpoint 7: 兼容旧的接口 - 返回所有数据（不推荐，仅用于向后兼容）
router.get('/housing', (req, res) => {
    try {
        if (!housingDataCache.isLoaded) {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Data is still loading.'
            });
        }

        const results = housingDataCache.query({});

        res.json(results);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({
            error: 'Query Failed',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/data/boroughs:
 *   get:
 *     summary: Get borough information | 获取行政区信息
 *     description: Returns detailed information and descriptions for all London boroughs | 返回所有伦敦行政区的详细信息和描述
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Borough data retrieved successfully | 成功获取行政区数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Failed to load borough data | 加载行政区数据失败
 */

// 添加borough数据缓存
let boroughsCache = null;
let boroughsCacheTime = null;
let boroughsIndexMap = null; // 新增: slug索引Map,加速单个查询
const BOROUGH_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 加载并缓存borough数据的辅助函数
function loadBoroughsData() {
    const now = Date.now();

    // 如果缓存有效,直接返回
    if (boroughsCache && boroughsCacheTime && (now - boroughsCacheTime < BOROUGH_CACHE_DURATION)) {
        return Promise.resolve(boroughsCache);
    }

    // 否则重新加载
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, '../data', 'boroughs-data.json');

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                boroughsCache = jsonData;
                boroughsCacheTime = now;

                // 创建slug索引Map,加速查找
                boroughsIndexMap = new Map();
                jsonData.forEach(borough => {
                    boroughsIndexMap.set(borough.slug, borough);
                });

                console.log(`📦 Borough data cached: ${jsonData.length} boroughs loaded`);
                resolve(jsonData);
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
}

// API Endpoint 3: 提供行政区数据
router.get('/boroughs', async (req, res) => {
    try {
        const boroughs = await loadBoroughsData();
        res.json(boroughs);
    } catch (err) {
        console.error('Error loading boroughs data:', err);
        res.status(500).json({ error: 'Failed to load boroughs data' });
    }
});

/**
 * @swagger
 * /api/data/boroughs/{slug}:
 *   get:
 *     summary: Get single borough detail | 获取单个行政区详情
 *     description: Returns detailed information for a specific borough by slug | 根据slug返回特定行政区的详细信息
 *     tags: [Static Data]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Borough slug (e.g., 'barking-and-dagenham')
 *     responses:
 *       200:
 *         description: Borough data retrieved successfully | 成功获取行政区数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 location:
 *                   type: string
 *                 history:
 *                   type: string
 *                 living:
 *                   type: string
 *       404:
 *         description: Borough not found | 未找到该行政区
 *       500:
 *         description: Failed to load borough data | 加载行政区数据失败
 */
router.get('/boroughs/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        // 先加载数据(如果缓存有效会直接返回)
        await loadBoroughsData();

        // 使用Map查找,O(1)时间复杂度,比Array.find()的O(n)快
        const borough = boroughsIndexMap.get(slug);

        if (!borough) {
            return res.status(404).json({ error: 'Borough not found' });
        }

        // 设置缓存头,提升性能
        res.set('Cache-Control', 'public, max-age=300'); // 5分钟浏览器缓存
        res.json(borough);
    } catch (err) {
        console.error('Error loading borough data:', err);
        res.status(500).json({ error: 'Failed to load borough data' });
    }
});

/**
 * @swagger
 * /api/data/stats:
 *   get:
 *     summary: Get statistical data | 获取统计数据
 *     description: Returns statistical data and rankings for London housing market | 返回伦敦房地产市场的统计数据和排名
 *     tags: [Static Data]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully | 成功获取统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Failed to load statistics | 加载统计数据失败
 */
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

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: API overview | API概览
 *     description: Get information about available API endpoints and cache status | 获取可用API端点信息和缓存状态
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information retrieved successfully | 成功获取API信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 cacheStatus:
 *                   type: object
 *                   properties:
 *                     isLoaded:
 *                       type: boolean
 *                     loadTime:
 *                       type: number
 *                     totalRows:
 *                       type: integer
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: object
 */
// 可选:提供所有可用API端点的列表
router.get('/', (req, res) => {
    res.json({
        message: 'London Housing Data API',
        version: '2.0.0',
        cacheStatus: {
            isLoaded: housingDataCache.isLoaded,
            loadTime: housingDataCache.loadTime,
            totalRows: housingDataCache.metadata.totalRows
        },
        endpoints: [
            {
                path: '/api/data/map/geojson',
                method: 'GET',
                description: 'Get London boroughs geographic boundaries (TopoJSON)'
            },
            {
                path: '/api/data/housing/query',
                method: 'GET',
                description: 'Flexible query for housing data',
                parameters: {
                    dateFrom: 'Start date (YYYY-MM-DD or DD/MM/YY)',
                    dateTo: 'End date (YYYY-MM-DD or DD/MM/YY)',
                    regions: 'Comma-separated region names',
                    fields: 'Comma-separated field names'
                },
                example: '/api/data/housing/query?dateFrom=2020-01-01&dateTo=2020-12-31&regions=Camden,Westminster&fields=Date,RegionName,AveragePrice'
            },
            {
                path: '/api/data/housing/byDate/:date',
                method: 'GET',
                description: 'Get all boroughs data for a specific date',
                example: '/api/data/housing/byDate/2020-01-01?fields=RegionName,AveragePrice'
            },
            {
                path: '/api/data/housing/byRegion/:region',
                method: 'GET',
                description: 'Get all historical data for a specific region',
                example: '/api/data/housing/byRegion/Camden?dateFrom=2020-01-01&dateTo=2020-12-31'
            },
            {
                path: '/api/data/housing/metadata',
                method: 'GET',
                description: 'Get metadata about the housing dataset'
            },
            {
                path: '/api/data/housing/reload',
                method: 'POST',
                description: 'Reload housing data from CSV file'
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
