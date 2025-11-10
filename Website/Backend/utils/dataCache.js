/**
 * 数据缓存模块
 * 负责加载、索引和查询 CSV 数据
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parseCSVDate, normalizeDate, isDateInRange } = require('./dateUtils');

class HousingDataCache {
    constructor() {
        this.rawData = [];
        this.indexes = {
            byDate: new Map(),
            byRegion: new Map(),
            byDateRegion: new Map()
        };
        this.metadata = {
            dates: [],
            regions: [],
            columns: [],
            minDate: null,
            maxDate: null,
            totalRows: 0
        };
        this.isLoaded = false;
        this.loadTime = null;
    }

    /**
     * 加载 CSV 文件并构建索引
     * @param {string} filePath - CSV 文件路径
     * @returns {Promise<void>}
     */
    async load(filePath) {
        console.log('开始加载 CSV 数据...');
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const results = [];
            const dateSet = new Set();
            const regionSet = new Set();

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('headers', (headers) => {
                    this.metadata.columns = headers;
                    console.log(`检测到 ${headers.length} 个列`);
                })
                .on('data', (data) => {
                    // 转换日期为标准格式
                    const originalDate = data.Date;
                    const standardDate = parseCSVDate(originalDate);

                    const row = {
                        ...data,
                        Date: standardDate,           // 标准格式日期
                        _originalDate: originalDate   // 保留原始日期
                    };

                    const rowIndex = results.length;
                    results.push(row);

                    // 收集元数据
                    if (standardDate) dateSet.add(standardDate);
                    if (data.RegionName) regionSet.add(data.RegionName.trim());

                    // 构建索引
                    this._buildIndexForRow(row, rowIndex);
                })
                .on('end', () => {
                    this.rawData = results;
                    this.metadata.totalRows = results.length;
                    this.metadata.dates = Array.from(dateSet).sort();
                    this.metadata.regions = Array.from(regionSet).sort();
                    this.metadata.minDate = this.metadata.dates[0] || null;
                    this.metadata.maxDate = this.metadata.dates[this.metadata.dates.length - 1] || null;
                    this.isLoaded = true;
                    this.loadTime = new Date();

                    const duration = Date.now() - startTime;
                    console.log('数据加载完成！');
                    console.log(`   总行数: ${this.metadata.totalRows.toLocaleString()}`);
                    console.log(`   日期范围: ${this.metadata.minDate} 到 ${this.metadata.maxDate}`);
                    console.log(`   区域数量: ${this.metadata.regions.length}`);
                    console.log(`   加载耗时: ${duration}ms`);

                    resolve();
                })
                .on('error', (error) => {
                    console.error('CSV 加载失败:', error);
                    reject(error);
                });
        });
    }

    /**
     * 为单行数据构建索引
     * @private
     */
    _buildIndexForRow(row, rowIndex) {
        const date = row.Date;
        const region = row.RegionName?.trim();

        // 按日期索引
        if (date) {
            if (!this.indexes.byDate.has(date)) {
                this.indexes.byDate.set(date, []);
            }
            this.indexes.byDate.get(date).push(rowIndex);
        }

        // 按区域索引
        if (region) {
            if (!this.indexes.byRegion.has(region)) {
                this.indexes.byRegion.set(region, []);
            }
            this.indexes.byRegion.get(region).push(rowIndex);
        }

        // 复合索引（日期 + 区域）
        if (date && region) {
            const key = `${date}_${region}`;
            this.indexes.byDateRegion.set(key, rowIndex);
        }
    }

    /**
     * 查询数据
     * @param {Object} options - 查询选项
     * @param {string} options.dateFrom - 起始日期
     * @param {string} options.dateTo - 结束日期
     * @param {string[]} options.regions - 区域列表
     * @param {string[]} options.fields - 需要的字段
     * @returns {Array} 查询结果
     */
    query(options = {}) {
        if (!this.isLoaded) {
            throw new Error('数据尚未加载');
        }

        const {
            dateFrom,
            dateTo,
            regions,
            fields
        } = options;

        // 标准化日期
        const normalizedDateFrom = dateFrom ? normalizeDate(dateFrom) : null;
        const normalizedDateTo = dateTo ? normalizeDate(dateTo) : null;

        let rowIndexes = new Set();

        // 策略1：如果指定了日期和区域，使用复合索引（最快）
        if (normalizedDateFrom && normalizedDateTo && normalizedDateFrom === normalizedDateTo && regions && regions.length > 0) {
            regions.forEach(region => {
                const key = `${normalizedDateFrom}_${region.trim()}`;
                const index = this.indexes.byDateRegion.get(key);
                if (index !== undefined) {
                    rowIndexes.add(index);
                }
            });
        }
        // 策略2：按日期范围查询
        else if (normalizedDateFrom || normalizedDateTo) {
            this.indexes.byDate.forEach((indexes, date) => {
                if (isDateInRange(date, normalizedDateFrom, normalizedDateTo)) {
                    indexes.forEach(idx => rowIndexes.add(idx));
                }
            });

            // 如果还指定了区域，进一步筛选
            if (regions && regions.length > 0) {
                const regionSet = new Set(regions.map(r => r.trim()));
                rowIndexes = new Set(
                    Array.from(rowIndexes).filter(idx =>
                        regionSet.has(this.rawData[idx].RegionName?.trim())
                    )
                );
            }
        }
        // 策略3：只按区域查询
        else if (regions && regions.length > 0) {
            regions.forEach(region => {
                const indexes = this.indexes.byRegion.get(region.trim());
                if (indexes) {
                    indexes.forEach(idx => rowIndexes.add(idx));
                }
            });
        }
        // 策略4：返回所有数据
        else {
            rowIndexes = new Set(this.rawData.map((_, idx) => idx));
        }

        // 获取结果行
        let results = Array.from(rowIndexes).map(idx => this.rawData[idx]);

        // 字段过滤
        if (fields && fields.length > 0) {
            const fieldSet = new Set(fields);
            results = results.map(row => {
                const filtered = {};
                fieldSet.forEach(field => {
                    if (row.hasOwnProperty(field)) {
                        filtered[field] = row[field];
                    }
                });
                return filtered;
            });
        }

        return results;
    }

    /**
     * 获取元数据
     */
    getMetadata() {
        return {
            ...this.metadata,
            isLoaded: this.isLoaded,
            loadTime: this.loadTime
        };
    }

    /**
     * 重新加载数据
     */
    async reload(filePath) {
        console.log('重新加载数据...');
        this.rawData = [];
        this.indexes = {
            byDate: new Map(),
            byRegion: new Map(),
            byDateRegion: new Map()
        };
        this.isLoaded = false;
        await this.load(filePath);
    }
}

// 创建单例实例
const housingDataCache = new HousingDataCache();

module.exports = housingDataCache;
