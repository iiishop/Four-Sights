/**
 * Swagger API 文档配置
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'London Housing Market Data API',
            version: '2.0.0',
            description: `
# London Housing Market Analysis API | 伦敦房地产市场分析 API

High-performance London housing price data query API, providing historical housing price data, geographic boundary information and statistical data.

高性能的伦敦房价数据查询 API，提供历史房价数据、地理边界信息和统计数据。

## Features | 特性

- **High Performance | 高性能**: In-memory caching with multi-level indexing, millisecond-level query speed | 内存缓存 + 多级索引，查询速度毫秒级
- **Large Dataset | 大数据量**: 12,000+ records covering 33 London boroughs | 12,000+ 条记录，涵盖伦敦 33 个行政区
- **Time Span | 时间跨度**: 1995 - 2024
- **Flexible Queries | 灵活查询**: Support for date range, region filtering, field selection | 支持日期范围、区域筛选、字段选择
- **Hot Reload | 热重载**: Support for online data updates | 支持在线更新数据

## Data Sources | 数据源

- Housing Price Data | 房价数据: UK Office for National Statistics (ONS) | 英国国家统计局
- Geographic Data | 地理数据: London borough boundaries in GeoJSON/TopoJSON format | GeoJSON/TopoJSON 格式的伦敦行政区边界
      `,
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server | 本地开发服务器'
            },
            {
                url: 'http://your-production-url.com',
                description: 'Production Server | 生产环境服务器'
            }
        ],
        tags: [
            {
                name: 'Housing Data',
                description: 'Housing price data query endpoints | 房价数据查询接口'
            },
            {
                name: 'Geographic Data',
                description: 'Geographic boundary data | 地理边界数据'
            },
            {
                name: 'Static Data',
                description: 'Static information data | 静态信息数据'
            },
            {
                name: 'System',
                description: 'System management endpoints | 系统管理接口'
            }
        ],
        components: {
            schemas: {
                HousingDataRow: {
                    type: 'object',
                    properties: {
                        Date: {
                            type: 'string',
                            format: 'date',
                            description: 'Date in YYYY-MM-DD format | 日期（YYYY-MM-DD 格式）',
                            example: '2020-01-01'
                        },
                        RegionName: {
                            type: 'string',
                            description: 'Region name | 区域名称',
                            example: 'Camden'
                        },
                        AreaCode: {
                            type: 'string',
                            description: 'Region code | 区域代码',
                            example: 'E09000007'
                        },
                        AveragePrice: {
                            type: 'string',
                            description: 'Average house price in GBP | 平均房价（英镑）',
                            example: '750000'
                        },
                        Index: {
                            type: 'string',
                            description: 'House price index | 房价指数',
                            example: '150.5'
                        },
                        '1m%Change': {
                            type: 'string',
                            description: 'Monthly percentage change | 月度涨跌幅（%）',
                            example: '2.5'
                        },
                        '12m%Change': {
                            type: 'string',
                            description: 'Annual percentage change | 年度涨跌幅（%）',
                            example: '8.3'
                        },
                        DetachedPrice: {
                            type: 'string',
                            description: 'Detached house price | 独立屋价格',
                            example: '1200000'
                        },
                        SemiDetachedPrice: {
                            type: 'string',
                            description: 'Semi-detached house price | 半独立屋价格',
                            example: '850000'
                        },
                        TerracedPrice: {
                            type: 'string',
                            description: 'Terraced house price | 联排别墅价格',
                            example: '650000'
                        },
                        FlatPrice: {
                            type: 'string',
                            description: 'Flat/Apartment price | 公寓价格',
                            example: '450000'
                        }
                    }
                },
                QueryResponse: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/HousingDataRow'
                            }
                        },
                        count: {
                            type: 'integer',
                            description: 'Number of returned data rows | 返回的数据行数',
                            example: 24
                        },
                        queryTime: {
                            type: 'string',
                            description: 'Query execution time | 查询耗时',
                            example: '5ms'
                        },
                        query: {
                            type: 'object',
                            description: 'Query parameters echo | 查询参数回显'
                        }
                    }
                },
                Metadata: {
                    type: 'object',
                    properties: {
                        dates: {
                            type: 'array',
                            items: {
                                type: 'string',
                                format: 'date'
                            },
                            description: 'List of all available dates | 所有可用日期列表'
                        },
                        regions: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'List of all region names | 所有区域名称列表'
                        },
                        columns: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'List of all available fields | 所有可用字段列表'
                        },
                        minDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Earliest date | 最早日期'
                        },
                        maxDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Latest date | 最晚日期'
                        },
                        totalRows: {
                            type: 'integer',
                            description: 'Total number of data rows | 总数据行数'
                        },
                        isLoaded: {
                            type: 'boolean',
                            description: 'Whether data is loaded | 数据是否已加载'
                        },
                        loadTime: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data load timestamp | 数据加载时间'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error type | 错误类型'
                        },
                        message: {
                            type: 'string',
                            description: 'Error message | 错误信息'
                        }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
