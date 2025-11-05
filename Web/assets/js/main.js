// 等待DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 1. 导航高亮逻辑（随滚动自动切换）
  const handleNavHighlight = () => {
    // 获取所有导航链接和对应章节
    const navLinks = document.querySelectorAll('.sidebar a');
    const sections = document.querySelectorAll('section[id]');
    
    let currentSection = '';
    
    // 遍历章节，判断当前可视区域的章节
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      // 当滚动位置超过章节顶部100px时，视为当前章节
      if (window.scrollY >= (sectionTop - 100)) {
        currentSection = section.getAttribute('id');
      }
    });
    
    // 更新导航链接高亮状态
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  };

  // 2. 点击导航平滑滚动到对应章节
  const setupNavScroll = () => {
    const navLinks = document.querySelectorAll('.sidebar a');
    
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault(); // 阻止默认跳转行为
        
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
          // 滚动到目标章节（距离顶部80px，避免被导航栏遮挡）
          window.scrollTo({
            top: targetSection.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
    });
  };

  // 3. 初始化地图占位交互（后续可扩展为真实地图逻辑）
  const initMapInteraction = () => {
    const mapPlaceholder = document.querySelector('.map-placeholder');
    if (mapPlaceholder) {
      mapPlaceholder.addEventListener('click', () => {
        alert('Interactive map will be loaded here. Hover over boroughs to see details.');
      });
    }
  };

  // 4. 行政区卡片悬停效果增强（可选，基于CSS补充）
  const enhanceBoroughCards = () => {
    const cards = document.querySelectorAll('.borough-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px)';
        card.style.boxShadow = '0 12px 20px rgba(0, 0, 0, 0.1)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  };

  // 初始化所有功能
  setupNavScroll();
  initMapInteraction();
  enhanceBoroughCards();
  
  // 监听滚动事件，更新导航高亮
  window.addEventListener('scroll', handleNavHighlight);
  
  // 初始加载时触发一次，确保高亮正确
  handleNavHighlight();
});
