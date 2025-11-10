(function () {
    'use strict';

    const CONFIG = {
        sections: ['compare', 'find'],
        debug: true,
        scrollHeightMultiplier: 2.5,
        stages: {
            start: 0.10,
            accelerate: 0.25,
            focus: 0.50,
            settle: 0.75,
            exit: 0.90
        }
    };

    const state = {
        sections: [],
        breakoutContainers: new Map()
    };

    function init() {
        console.log('Initializing true fullscreen breakout...');

        CONFIG.sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (!section) {
                console.warn(`Section #${sectionId} not found`);
                return;
            }

            setupSection(section, sectionId);
        });

        setupScrollListener();

        console.log('Fullscreen breakout initialized');
    }

    function setupSection(section, sectionId) {

        section.classList.add('transition-section');
        section.style.minHeight = `${CONFIG.scrollHeightMultiplier * 100}vh`;

        const stickyWrapper = document.createElement('div');
        stickyWrapper.className = 'section-sticky-wrapper';

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'section-content';

        while (section.firstChild) {
            contentWrapper.appendChild(section.firstChild);
        }

        stickyWrapper.appendChild(contentWrapper);
        section.appendChild(stickyWrapper);

        const breakoutContainer = createBreakoutContainer(sectionId);
        document.body.appendChild(breakoutContainer);

        state.sections.push({
            id: sectionId,
            element: section,
            stickyWrapper,
            contentWrapper,
            breakoutContainer,
            scrollProgress: 0,
            currentStage: 0,
            contentMoved: false
        });

        state.breakoutContainers.set(sectionId, breakoutContainer);
    }

    function createBreakoutContainer(sectionId) {
        const container = document.createElement('div');
        container.className = 'fullscreen-breakout stage-0';
        container.id = `${sectionId}-fullscreen`;
        container.style.display = 'none';

        const layoutContainer = document.createElement('div');
        if (sectionId === 'compare') {
            layoutContainer.className = 'compare-fullscreen-layout';
            layoutContainer.innerHTML = `
                <div class="controls-area"></div>
                <div class="insight-area"></div>
                <div class="map-area"></div>
                <div class="chart-top"></div>
                <div class="chart-bottom"></div>
            `;
        } else if (sectionId === 'find') {
            layoutContainer.className = 'find-fullscreen-layout';
            layoutContainer.innerHTML = `
                <div class="map-area"></div>
                <div class="metrics-area"></div>
            `;
        }

        container.appendChild(layoutContainer);
        return container;
    }

    function moveContentToBreakout(sectionId, contentWrapper, breakoutContainer) {
        const layoutContainer = breakoutContainer.firstChild;

        if (sectionId === 'compare') {
            const topControls = contentWrapper.querySelector('#topControls');
            const insightContainer = contentWrapper.querySelector('#insightContainer');
            const mapWrapper = contentWrapper.querySelector('#mapWrapper');
            const chartsWrapper = contentWrapper.querySelector('#chartsWrapper');
            const lineChart = chartsWrapper?.querySelector('.chart-container:nth-child(1)');
            const rankChart = chartsWrapper?.querySelector('.chart-container:nth-child(2)');

            const controlsArea = layoutContainer.querySelector('.controls-area');
            const insightArea = layoutContainer.querySelector('.insight-area');
            const mapArea = layoutContainer.querySelector('.map-area');
            const chartTop = layoutContainer.querySelector('.chart-top');
            const chartBottom = layoutContainer.querySelector('.chart-bottom');

            if (topControls && controlsArea) controlsArea.appendChild(topControls);
            if (insightContainer && insightArea) insightArea.appendChild(insightContainer);
            if (mapWrapper && mapArea) mapArea.appendChild(mapWrapper);
            if (lineChart && chartTop) chartTop.appendChild(lineChart);
            if (rankChart && chartBottom) chartBottom.appendChild(rankChart);
        } else if (sectionId === 'find') {
            const suitabilityLeft = contentWrapper.querySelector('.suitability-left');
            const suitabilityMetricsRight = contentWrapper.querySelector('.suitability-metrics-right');

            const mapArea = layoutContainer.querySelector('.map-area');
            const metricsArea = layoutContainer.querySelector('.metrics-area');

            if (suitabilityLeft && mapArea) mapArea.appendChild(suitabilityLeft);
            if (suitabilityMetricsRight && metricsArea) metricsArea.appendChild(suitabilityMetricsRight);
        }
    }

    function moveContentBack(sectionId, contentWrapper, breakoutContainer) {
        const layoutContainer = breakoutContainer.firstChild;

        if (sectionId === 'compare') {
            const topControls = layoutContainer.querySelector('#topControls');
            const insightContainer = layoutContainer.querySelector('#insightContainer');
            const mapWrapper = layoutContainer.querySelector('#mapWrapper');
            const lineChart = layoutContainer.querySelector('.chart-container:nth-child(1)');
            const rankChart = layoutContainer.querySelector('.chart-container:nth-child(2)');

            let visualSection = contentWrapper.querySelector('#visualSection');
            if (!visualSection) {
                visualSection = document.createElement('div');
                visualSection.id = 'visualSection';
            }

            let chartsWrapper = visualSection.querySelector('#chartsWrapper');
            if (!chartsWrapper) {
                chartsWrapper = document.createElement('div');
                chartsWrapper.id = 'chartsWrapper';
            }

            visualSection.innerHTML = '';

            if (mapWrapper) visualSection.appendChild(mapWrapper);
            if (chartsWrapper) visualSection.appendChild(chartsWrapper);

            if (lineChart) chartsWrapper.appendChild(lineChart);
            if (rankChart) chartsWrapper.appendChild(rankChart);

            const tooltip = contentWrapper.querySelector('.tooltip');

            if (topControls && tooltip) {
                contentWrapper.insertBefore(topControls, tooltip);
            }

            if (visualSection && tooltip) {
                contentWrapper.insertBefore(visualSection, tooltip);
            }

            if (insightContainer && tooltip) {
                contentWrapper.insertBefore(insightContainer, tooltip);
            }
        } else if (sectionId === 'find') {
            const suitabilityLeft = layoutContainer.querySelector('.suitability-left');
            const suitabilityMetricsRight = layoutContainer.querySelector('.suitability-metrics-right');

            let suitabilityContainer = contentWrapper.querySelector('.suitability-container');
            if (!suitabilityContainer) {
                suitabilityContainer = document.createElement('div');
                suitabilityContainer.className = 'suitability-container';
                contentWrapper.appendChild(suitabilityContainer);
            }

            suitabilityContainer.innerHTML = '';
            if (suitabilityLeft) suitabilityContainer.appendChild(suitabilityLeft);
            if (suitabilityMetricsRight) suitabilityContainer.appendChild(suitabilityMetricsRight);
        }
    }

    function setupScrollListener() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateSections();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        updateSections();
    }

    function updateSections() {
        const windowHeight = window.innerHeight;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        state.sections.forEach(sectionData => {
            const { element, breakoutContainer } = sectionData;
            const rect = element.getBoundingClientRect();
            const sectionTop = rect.top + scrollY;
            const sectionHeight = element.offsetHeight;

            let progress = 0;

            if (rect.top <= 0) {
                const scrolledDistance = scrollY - sectionTop;
                const totalScrollDistance = sectionHeight - windowHeight;
                progress = Math.min(1, Math.max(0, scrolledDistance / totalScrollDistance));
            }

            sectionData.scrollProgress = progress;

            applyBreakout(sectionData, progress);
        });
    }

    function applyBreakout(sectionData, progress) {
        const { id, contentWrapper, breakoutContainer, currentStage, contentMoved } = sectionData;
        const { start, accelerate, focus, settle, exit } = CONFIG.stages;

        let transitionProgress = 0;
        let isActive = false;
        let isExiting = false;

        if (progress < start) {
            transitionProgress = 0;
            isActive = false;
        } else if (progress >= start && progress < exit) {
            isActive = true;
            transitionProgress = Math.min((progress - start) / (settle - start), 1);
        } else if (progress >= exit) {
            isActive = false;
            isExiting = true;
            transitionProgress = 1 - Math.min((progress - exit) / (1 - exit), 1);
        }

        if (isActive || isExiting) {
            breakoutContainer.style.display = 'block';

            if (isActive) {
                breakoutContainer.classList.add('active');
            } else {
                breakoutContainer.classList.remove('active');
            }

            breakoutContainer.classList.remove('stage-0', 'stage-1', 'stage-2', 'exiting');

            const easeProgress = easeInOutCubic(transitionProgress);

            const scale = 0.7 + (easeProgress * 0.3);
            const translateZ = (1 - easeProgress) * 200;
            const blur = (1 - easeProgress) * 15;
            const opacity = easeProgress;

            breakoutContainer.style.setProperty('--transition-scale', scale);
            breakoutContainer.style.setProperty('--transition-translateZ', `${translateZ}px`);
            breakoutContainer.style.setProperty('--transition-blur', `${blur}px`);
            breakoutContainer.style.setProperty('--transition-opacity', opacity);

            if (!sectionData.contentMoved && progress > 0.35 && isActive) {
                moveContentToBreakout(id, contentWrapper, breakoutContainer);
                sectionData.contentMoved = true;
                console.log(`${id} content moved to breakout at progress ${progress.toFixed(2)}`);
            }

            if (sectionData.contentMoved && isExiting) {
                contentWrapper.classList.remove('has-breakout');
                moveContentBack(id, contentWrapper, breakoutContainer);
                sectionData.contentMoved = false;
                console.log(`${id} content moved back at progress ${progress.toFixed(2)}`);
            }

            if (sectionData.contentMoved && !isExiting && easeProgress > 0.2) {
                contentWrapper.classList.add('has-breakout');
            } else {
                contentWrapper.classList.remove('has-breakout');
            }

            const elements = breakoutContainer.querySelectorAll('.controls-area, .insight-area, .map-area, .chart-top, .chart-bottom, .metrics-area');
            elements.forEach((el, index) => {
                const delay = index * 0.05;
                const elementProgress = Math.max(0, Math.min(1, (transitionProgress - delay) / (1 - delay)));
                const elementEase = easeInOutCubic(elementProgress);

                const elementY = (1 - elementEase) * 40;
                const elementOpacity = elementEase;

                el.style.setProperty('--element-y', `${elementY}px`);
                el.style.setProperty('--element-opacity', elementOpacity);
            });

        } else {
            if (sectionData.contentMoved) {
                contentWrapper.classList.remove('has-breakout');
                moveContentBack(id, contentWrapper, breakoutContainer);
                sectionData.contentMoved = false;
                console.log(`${id} content moved back at exit`);
            }

            breakoutContainer.style.display = 'none';
            breakoutContainer.classList.remove('active');
        }

        sectionData.currentStage = isActive ? 1 : 0;
    }

    function easeInOutCubic(t) {
        if (t < 0.5) {
            return 16 * t * t * t * t * t;
        } else {
            return 1 - Math.pow(-2 * t + 2, 5) / 2;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
