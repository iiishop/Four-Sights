/**
 * 日期处理工具模块
 * 处理 CSV 中的日期格式 (DD/MM/YY) 并转换为标准格式 (YYYY-MM-DD)
 */

/**
 * 将 DD/MM/YY 格式转换为 YYYY-MM-DD
 * @param {string} dateStr - 原始日期字符串，格式：DD/MM/YY
 * @returns {string} 标准日期格式 YYYY-MM-DD
 */
function parseCSVDate(dateStr) {
    if (!dateStr) return null;

    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parseInt(parts[2]);

    // 处理两位数年份：< 50 认为是 20xx，>= 50 认为是 19xx
    if (year < 50) {
        year = 2000 + year;
    } else if (year < 100) {
        year = 1900 + year;
    }

    return `${year}-${month}-${day}`;
}

/**
 * 将标准格式 YYYY-MM-DD 转换回 DD/MM/YY
 * @param {string} dateStr - 标准日期字符串
 * @returns {string} CSV 格式日期
 */
function toCSVDate(dateStr) {
    if (!dateStr) return null;

    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0]);
    const month = parts[1];
    const day = parts[2];

    const shortYear = year >= 2000 ? (year - 2000).toString().padStart(2, '0') : (year - 1900).toString().padStart(2, '0');

    return `${day}/${month}/${shortYear}`;
}

/**
 * 灵活解析多种日期格式
 * 支持：YYYY-MM-DD, DD/MM/YY, DD/MM/YYYY
 * @param {string} dateStr - 日期字符串
 * @returns {string} 标准格式 YYYY-MM-DD
 */
function normalizeDate(dateStr) {
    if (!dateStr) return null;

    // 已经是标准格式
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // DD/MM/YY 或 DD/MM/YYYY 格式
    if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(dateStr)) {
        return parseCSVDate(dateStr);
    }

    return null;
}

/**
 * 比较两个日期
 * @param {string} date1 - 日期1 (YYYY-MM-DD)
 * @param {string} date2 - 日期2 (YYYY-MM-DD)
 * @returns {number} -1: date1 < date2, 0: 相等, 1: date1 > date2
 */
function compareDate(date1, date2) {
    if (date1 === date2) return 0;
    return date1 < date2 ? -1 : 1;
}

/**
 * 验证日期是否在范围内
 * @param {string} date - 要检查的日期
 * @param {string} from - 起始日期（可选）
 * @param {string} to - 结束日期（可选）
 * @returns {boolean}
 */
function isDateInRange(date, from, to) {
    if (!date) return false;

    if (from && compareDate(date, from) < 0) return false;
    if (to && compareDate(date, to) > 0) return false;

    return true;
}

module.exports = {
    parseCSVDate,
    toCSVDate,
    normalizeDate,
    compareDate,
    isDateInRange
};
