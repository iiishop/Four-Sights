const express = require('express');
const path = require('path');
const cors = require('cors');

// 导入数据路由
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

// 启动服务器
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('Available API endpoints:');
    console.log(`  📍 GET http://localhost:${PORT}/api/data/`);
    console.log(`  📍 GET http://localhost:${PORT}/api/data/map/geojson`);
    console.log(`  📍 GET http://localhost:${PORT}/api/data/housing`);
    console.log(`  📍 GET http://localhost:${PORT}/api/data/boroughs`);
    console.log(`  📍 GET http://localhost:${PORT}/api/data/stats`);
    console.log('='.repeat(50));
    console.log(`Frontend available at: http://localhost:${PORT}`);
    console.log('='.repeat(50));
});

module.exports = app;
