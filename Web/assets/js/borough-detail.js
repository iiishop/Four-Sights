// Borough Detail Page Script
// 优化版本 - 使用缓存和异步加载

(function () {
    'use strict';

    // 配置
    const CONFIG = {
        API_BASE: 'http://localhost:3000/api/data', // 固定使用后端服务器地址
        CACHE_KEY: 'borough_data_cache',
        CACHE_DURATION: 5 * 60 * 1000, // 5分钟
        IMAGE_MAP: {
            'barking-and-dagenham': 1060,
            'barnet': 1061,
            'bexley': 1062,
            'brent': 1063,
            'camden': 1064,
            'croydon': 1065,
            'ealing': 1066,
            'enfield': 1067,
            'greenwich': 1068,
            'hackney': 1069,
            'hammersmith-and-fulham-area': 1070,
            'haringey': 1071,
            'harrow': 1072,
            'havering': 1073,
            'hillingdon': 1074,
            'hounslow': 1075,
            'islington': 1076,
            'kensington-and-chelsea': 1077,
            'kingston-upon-thames': 1078,
            'lambeth': 1079,
            'lewisham': 1080,
            'merton': 1081,
            'newham': 1082,
            'redbridge': 1083,
            'richmond-upon-thames': 1084,
            'southwark': 1085,
            'sutton': 1086,
            'tower-hamlets': 1087,
            'waltham-forest': 1088,
            'wandsworth': 1089,
            'city-of-westminster': 1090
        }
    };

    // DOM元素
    const elements = {
        loading: document.getElementById('loading-state'),
        error: document.getElementById('error-state'),
        errorMessage: document.getElementById('error-message'),
        main: document.getElementById('main-container'),
        title: document.getElementById('page-title'),
        description: document.getElementById('page-description'),
        name: document.getElementById('borough-name'),
        location: document.getElementById('borough-location'),
        history: document.getElementById('borough-history'),
        living: document.getElementById('borough-living'),
        image: document.getElementById('borough-image')
    };

    // 从URL获取borough slug
    function getBoroughSlug() {
        const params = new URLSearchParams(window.location.search);
        return params.get('borough');
    }

    // 本地存储缓存
    function getCachedData(slug) {
        try {
            const cached = localStorage.getItem(`${CONFIG.CACHE_KEY}_${slug}`);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();

            if (now - timestamp < CONFIG.CACHE_DURATION) {
                return data;
            }

            // 缓存过期,清除
            localStorage.removeItem(`${CONFIG.CACHE_KEY}_${slug}`);
            return null;
        } catch (e) {
            return null;
        }
    }

    function setCachedData(slug, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(`${CONFIG.CACHE_KEY}_${slug}`, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to cache data:', e);
        }
    }

    // 加载borough数据
    async function loadBoroughData(slug) {
        // 先检查缓存
        const cached = getCachedData(slug);
        if (cached) {
            console.log('Using cached data for', slug);
            return cached;
        }

        // 从API获取
        const response = await fetch(`${CONFIG.API_BASE}/boroughs/${slug}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Borough not found');
            }
            throw new Error('Failed to load borough data');
        }

        const data = await response.json();

        // 缓存数据
        setCachedData(slug, data);

        return data;
    }

    // 显示borough数据
    function displayBoroughData(borough) {
        // 更新页面标题和描述
        elements.title.textContent = borough.name;
        elements.description.setAttribute('content',
            `Detailed guide to ${borough.name}, including location, history and living information.`);

        // 更新内容
        elements.name.textContent = borough.name;
        elements.location.textContent = borough.location;
        elements.history.textContent = borough.history;
        elements.living.textContent = borough.living;

        // 更新图片
        const imageId = CONFIG.IMAGE_MAP[borough.slug] || 1060;
        elements.image.src = `https://picsum.photos/id/${imageId}/600/400`;
        elements.image.alt = `${borough.name} view`;

        // 隐藏加载状态,显示内容
        elements.loading.style.display = 'none';
        elements.main.style.display = 'block';
    }

    // 显示错误
    function showError(message) {
        elements.loading.style.display = 'none';
        elements.error.style.display = 'block';
        elements.errorMessage.textContent = message;
    }

    // 主函数
    async function init() {
        const slug = getBoroughSlug();

        if (!slug) {
            showError('No borough specified in URL');
            return;
        }

        try {
            const borough = await loadBoroughData(slug);
            displayBoroughData(borough);
        } catch (error) {
            console.error('Error loading borough:', error);
            showError(error.message);
        }
    }

    // 页面加载时执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
