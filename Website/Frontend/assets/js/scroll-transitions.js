/**
 * Scroll-driven Section Transitions - True Full-screen Breakout
 * 真正突破section限制的全屏滚动效果
 * 使用position:fixed完全脱离原始布局
 */

(function () {
    'use strict';

    // 配置
    const CONFIG = {
        sections: ['compare', 'find'],
        debug: true,
        scrollHeightMultiplier: 2.5,
        // 相机推进式过渡 - 平滑的进入和退出
        stages: {
            start: 0.10,     // 10%开始淡入
            accelerate: 0.25, // 25%加速推进
            focus: 0.50,     // 50%聚焦清晰
            settle: 0.75,    // 75%稳定显示
            exit: 0.90       // 90%开始退出
        }
    };

    //状态
    const state = {
        sections: [],
        breakoutContainers: new Map()
    };

    /**
     * 初始化
     */
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

    /**
     * 设置section
     */
    function setupSection(section, sectionId) {
        // 设置section高度
        section.classList.add('transition-section');
        section.style.minHeight = `${CONFIG.scrollHeightMultiplier * 100}vh`;

        // 创建sticky wrapper
        const stickyWrapper = document.createElement('div');
        stickyWrapper.className = 'section-sticky-wrapper';

        // 创建content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'section-content';

        // 移动所有子元素到content wrapper
        while (section.firstChild) {
            contentWrapper.appendChild(section.firstChild);
        }

        // 组装
        stickyWrapper.appendChild(contentWrapper);
        section.appendChild(stickyWrapper);

        // 创建全屏突破容器(空的,稍后移动内容进去)
        const breakoutContainer = createBreakoutContainer(sectionId);
        document.body.appendChild(breakoutContainer);

        // 记录
        state.sections.push({
            id: sectionId,
            element: section,
            stickyWrapper,
            contentWrapper,
            breakoutContainer,
            scrollProgress: 0,
            currentStage: 0,
            contentMoved: false // 标记内容是否已移动到全屏容器
        });

        state.breakoutContainers.set(sectionId, breakoutContainer);
    }

    /**
     * 创建全屏突破容器(空的)
     */
    function createBreakoutContainer(sectionId) {
        const container = document.createElement('div');
        container.className = 'fullscreen-breakout stage-0';
        container.id = `${sectionId}-fullscreen`;
        container.style.display = 'none';

        // 创建布局容器
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

    /**
     * 将内容移动到全屏布局
     */
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

    /**
     * 将内容移回原位置
     */
    function moveContentBack(sectionId, contentWrapper, breakoutContainer) {
        const layoutContainer = breakoutContainer.firstChild;

        if (sectionId === 'compare') {
            const topControls = layoutContainer.querySelector('#topControls');
            const insightContainer = layoutContainer.querySelector('#insightContainer');
            const mapWrapper = layoutContainer.querySelector('#mapWrapper');
            const lineChart = layoutContainer.querySelector('.chart-container:nth-child(1)');
            const rankChart = layoutContainer.querySelector('.chart-container:nth-child(2)');

            // 找到或创建原始容器
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

            // 重建 visualSection 内部结构
            // 清空 visualSection
            visualSection.innerHTML = '';

            // 按顺序添加: mapWrapper -> chartsWrapper
            if (mapWrapper) visualSection.appendChild(mapWrapper);
            if (chartsWrapper) visualSection.appendChild(chartsWrapper);

            // 将图表放回 chartsWrapper
            if (lineChart) chartsWrapper.appendChild(lineChart);
            if (rankChart) chartsWrapper.appendChild(rankChart);

            // 将内容按原始顺序放回 contentWrapper
            // 找到参考节点（fullscreen button后面，tooltip前面）
            const tooltip = contentWrapper.querySelector('.tooltip');

            // 插入 topControls
            if (topControls && tooltip) {
                contentWrapper.insertBefore(topControls, tooltip);
            }

            // 插入 visualSection (在 topControls 后面)
            if (visualSection && tooltip) {
                contentWrapper.insertBefore(visualSection, tooltip);
            }

            // 插入 insightContainer (在 visualSection 后面)
            if (insightContainer && tooltip) {
                contentWrapper.insertBefore(insightContainer, tooltip);
            }
        } else if (sectionId === 'find') {
            const suitabilityLeft = layoutContainer.querySelector('.suitability-left');
            const suitabilityMetricsRight = layoutContainer.querySelector('.suitability-metrics-right');

            // 找到或创建原始容器
            let suitabilityContainer = contentWrapper.querySelector('.suitability-container');
            if (!suitabilityContainer) {
                suitabilityContainer = document.createElement('div');
                suitabilityContainer.className = 'suitability-container';
                contentWrapper.appendChild(suitabilityContainer);
            }

            // 清空并重建 suitability-container
            suitabilityContainer.innerHTML = '';
            if (suitabilityLeft) suitabilityContainer.appendChild(suitabilityLeft);
            if (suitabilityMetricsRight) suitabilityContainer.appendChild(suitabilityMetricsRight);
        }

        // 内容已经通过 appendChild 移回原位置
        // layoutContainer 的子区域会自动变空
        // 不需要手动清空，保留结构以便下次复用
    }

    /**
     * 设置滚动监听
     */
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

    /**
     * 更新sections
     */
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

            // 应用突破效果
            applyBreakout(sectionData, progress);
        });
    }

    /**
     * 应用突破效果 - 相机推进式过渡
     */
    function applyBreakout(sectionData, progress) {
        const { id, contentWrapper, breakoutContainer, currentStage, contentMoved } = sectionData;
        const { start, accelerate, focus, settle, exit } = CONFIG.stages;

        // 计算过渡进度 (0-1)
        let transitionProgress = 0;
        let isActive = false;
        let isExiting = false;

        if (progress < start) {
            // 未开始
            transitionProgress = 0;
            isActive = false;
        } else if (progress >= start && progress < exit) {
            // 活跃状态
            isActive = true;
            // 将 start 到 settle 的进度映射到 0-1
            transitionProgress = Math.min((progress - start) / (settle - start), 1);
        } else if (progress >= exit) {
            // 退出状态
            isActive = false;
            isExiting = true;
            // 计算退出进度 (90%-100%)
            transitionProgress = 1 - Math.min((progress - exit) / (1 - exit), 1);
        }

        // 应用连续的过渡效果
        if (isActive || isExiting) {
            // 显示容器
            breakoutContainer.style.display = 'block';

            // 只有在活跃状态才允许鼠标事件，退出状态立即禁用
            if (isActive) {
                breakoutContainer.classList.add('active'); // 添加激活类
            } else {
                breakoutContainer.classList.remove('active'); // 退出时移除激活类
            }

            // 移除所有预定义的stage类
            breakoutContainer.classList.remove('stage-0', 'stage-1', 'stage-2', 'exiting');

            // 使用CSS变量控制平滑过渡
            const easeProgress = easeInOutCubic(transitionProgress);

            // 计算变换值
            const scale = 0.7 + (easeProgress * 0.3); // 0.7 -> 1.0
            const translateZ = (1 - easeProgress) * 200; // 200 -> 0
            const blur = (1 - easeProgress) * 15; // 15px -> 0
            const opacity = easeProgress; // 0 -> 1

            // 应用变换
            breakoutContainer.style.setProperty('--transition-scale', scale);
            breakoutContainer.style.setProperty('--transition-translateZ', `${translateZ}px`);
            breakoutContainer.style.setProperty('--transition-blur', `${blur}px`);
            breakoutContainer.style.setProperty('--transition-opacity', opacity);

            // 关键修复：延迟移动内容，等全屏容器足够不透明
            // 当进度 > 0.35 时（对应 opacity > 0.5），才移动内容
            if (!sectionData.contentMoved && progress > 0.35 && isActive) {
                moveContentToBreakout(id, contentWrapper, breakoutContainer);
                sectionData.contentMoved = true;
                console.log(`${id} content moved to breakout at progress ${progress.toFixed(2)}`);
            }

            // 关键修复：一旦进入退出状态，立即恢复内容
            if (sectionData.contentMoved && isExiting) {
                contentWrapper.classList.remove('has-breakout');
                moveContentBack(id, contentWrapper, breakoutContainer);
                sectionData.contentMoved = false;
                console.log(`${id} content moved back at progress ${progress.toFixed(2)}`);
            }

            // 隐藏原内容（只有在内容已移动且未退出时才隐藏）
            if (sectionData.contentMoved && !isExiting && easeProgress > 0.2) {
                contentWrapper.classList.add('has-breakout');
            } else {
                contentWrapper.classList.remove('has-breakout');
            }

            // 子元素视差效果 - 不同元素不同速度
            const elements = breakoutContainer.querySelectorAll('.controls-area, .insight-area, .map-area, .chart-top, .chart-bottom, .metrics-area');
            elements.forEach((el, index) => {
                const delay = index * 0.05; // 错开0.05
                const elementProgress = Math.max(0, Math.min(1, (transitionProgress - delay) / (1 - delay)));
                const elementEase = easeInOutCubic(elementProgress);

                const elementY = (1 - elementEase) * 40; // 从下方40px开始
                const elementOpacity = elementEase;

                el.style.setProperty('--element-y', `${elementY}px`);
                el.style.setProperty('--element-opacity', elementOpacity);
            });

        } else {
            // 完全退出后，确保内容已恢复
            if (sectionData.contentMoved) {
                contentWrapper.classList.remove('has-breakout');
                moveContentBack(id, contentWrapper, breakoutContainer);
                sectionData.contentMoved = false;
                console.log(`${id} content moved back at exit`);
            }

            // 立即隐藏容器，防止阻挡鼠标事件（使用 CSS 类控制）
            breakoutContainer.style.display = 'none';
            breakoutContainer.classList.remove('active'); // 移除激活类
        }

        sectionData.currentStage = isActive ? 1 : 0;
    }

    /**
     * 缓动函数 - 电影式缓入缓出（更平滑的加速和减速）
     */
    function easeInOutCubic(t) {
        // 使用五次方曲线,更接近真实相机运动
        if (t < 0.5) {
            return 16 * t * t * t * t * t;
        } else {
            return 1 - Math.pow(-2 * t + 2, 5) / 2;
        }
    }

    // 页面加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
