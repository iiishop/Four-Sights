const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// 导入数据缓存和路由
const housingDataCache = require('./utils/dataCache');
const dataRoutes = require('./routes/dataRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码的请求体

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Swagger API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'London Housing API Documentation'
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// API 路由
app.use('/api/data', dataRoutes);

// 提供静态文件服务 (前端文件)
// 这会让 Express 托管 Web 文件夹中的所有静态资源
app.use(express.static(path.join(__dirname, '../Web')));

// 根路径重定向到前端主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Web', 'index.html'));
});

// 404 错误处理
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// 启动服务器并预加载数据
async function startServer() {
    try {
        // 预加载房价数据
        console.log('正在初始化服务器...');
        const csvPath = path.join(__dirname, 'data', 'london_house_data.csv');
        await housingDataCache.load(csvPath);

        // 启动 HTTP 服务
        app.listen(PORT, () => {
            console.log('='.repeat(60));
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log('='.repeat(60));
            console.log('API Documentation:');
            console.log(`  Swagger UI: http://localhost:${PORT}/api-docs`);
            console.log(`  JSON Spec:  http://localhost:${PORT}/api-docs.json`);
            console.log('='.repeat(60));
            console.log('Available API endpoints:');
            console.log(`  GET  http://localhost:${PORT}/api/data/`);
            console.log(`  GET  http://localhost:${PORT}/api/data/map/geojson`);
            console.log(`  GET  http://localhost:${PORT}/api/data/housing/query`);
            console.log(`  GET  http://localhost:${PORT}/api/data/housing/byDate/:date`);
            console.log(`  GET  http://localhost:${PORT}/api/data/housing/byRegion/:region`);
            console.log(`  GET  http://localhost:${PORT}/api/data/housing/metadata`);
            console.log(`  POST http://localhost:${PORT}/api/data/housing/reload`);
            console.log(`  GET  http://localhost:${PORT}/api/data/boroughs`);
            console.log(`  GET  http://localhost:${PORT}/api/data/stats`);
            console.log('='.repeat(60));
            console.log(`Frontend available at: http://localhost:${PORT}`);
            console.log('='.repeat(60));
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();

module.exports = app;

