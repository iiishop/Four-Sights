(function () {
    'use strict';

    const CONFIG = {
        API_BASE: 'http://localhost:3000/api/data',
        CACHE_KEY: 'borough_data_cache',
        CACHE_DURATION: 5 * 60 * 1000,
        IMAGE_MAP: {
            'barking-and-dagenham': 101,
            'barnet': 102,
            'bexley': 103,
            'brent': 104,
            'bromley': 135,
            'camden': 106,
            'croydon': 107,
            'ealing': 108,
            'enfield': 109,
            'greenwich': 110,
            'hackney': 111,
            'hammersmith-and-fulham': 112,
            'haringey': 113,
            'harrow': 114,
            'havering': 115,
            'hillingdon': 116,
            'hounslow': 117,
            'islington': 118,
            'kensington-and-chelsea': 133,
            'kingston-upon-thames': 120,
            'lambeth': 121,
            'lewisham': 122,
            'merton': 123,
            'newham': 124,
            'redbridge': 125,
            'richmond-upon-thames': 126,
            'southwark': 127,
            'sutton': 128,
            'tower-hamlets': 129,
            'waltham-forest': 130,
            'wandsworth': 131,
            'city-of-westminster': 132
        }
    };

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

    function getBoroughSlug() {
        const params = new URLSearchParams(window.location.search);
        return params.get('borough');
    }

    function getCachedData(slug) {
        try {
            const cached = localStorage.getItem(`${CONFIG.CACHE_KEY}_${slug}`);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();

            if (now - timestamp < CONFIG.CACHE_DURATION) {
                return data;
            }

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

    async function loadBoroughData(slug) {
        const cached = getCachedData(slug);
        if (cached) {
            console.log('Using cached data for', slug);
            return cached;
        }

        const response = await fetch(`${CONFIG.API_BASE}/boroughs/${slug}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Borough not found');
            }
            throw new Error('Failed to load borough data');
        }

        const data = await response.json();

        setCachedData(slug, data);

        return data;
    }

    function displayBoroughData(borough) {
        elements.title.textContent = borough.name;
        elements.description.setAttribute('content',
            `Detailed guide to ${borough.name}, including location, history and living information.`);

        elements.name.textContent = borough.name;
        elements.location.textContent = borough.location;
        elements.history.textContent = borough.history;
        elements.living.textContent = borough.living;

        const imageId = CONFIG.IMAGE_MAP[borough.slug] || 101;
        elements.image.src = `https://picsum.photos/id/${imageId}/600/400`;
        elements.image.alt = `${borough.name} landscape view`;

        elements.loading.style.display = 'none';
        elements.main.style.display = 'block';
    }

    function showError(message) {
        elements.loading.style.display = 'none';
        elements.error.style.display = 'block';
        elements.errorMessage.textContent = message;
    }

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
