document.addEventListener('DOMContentLoaded', function () {
  const handleNavHighlight = () => {
    const navLinks = document.querySelectorAll('.sidebar a');
    const sections = document.querySelectorAll('section[id]');

    let currentSection = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (window.scrollY >= (sectionTop - 100)) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  };

  const setupNavScroll = () => {
    const navLinks = document.querySelectorAll('.sidebar a');

    navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          window.scrollTo({
            top: targetSection.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
    });
  };

  const initMapInteraction = () => {
    const mapPlaceholder = document.querySelector('.map-placeholder');
    if (mapPlaceholder) {
      mapPlaceholder.addEventListener('click', () => {
        alert('Interactive map will be loaded here Hover over boroughs to see details');
      });
    }
  };

  const enhanceBoroughCards = () => {
    const cards = document.querySelectorAll('.borough-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px)';
        card.style.boxShadow = '0 12px 20px rgba(0, 0, 0, 01)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  };

  setupNavScroll();
  initMapInteraction();
  enhanceBoroughCards();

  window.addEventListener('scroll', handleNavHighlight);

  handleNavHighlight();

  const setupFullscreenButtons = () => {
    const compareFullscreenBtn = document.getElementById('compareFullscreenBtn');
    const compareSection = document.getElementById('compare');

    if (compareFullscreenBtn && compareSection) {
      compareFullscreenBtn.addEventListener('click', () => {
        const isFullscreen = compareSection.classList.contains('fullscreen-mode');

        if (isFullscreen) {
          compareSection.classList.add('fullscreen-exit-animation');
          setTimeout(() => {
            compareSection.classList.remove('fullscreen-mode');
            compareSection.classList.remove('fullscreen-exit-animation');
          }, 100);
          compareFullscreenBtn.innerHTML = '<i class="ri-fullscreen-line"></i>';
          compareFullscreenBtn.setAttribute('title', 'Full Screen');

          setTimeout(() => {
            compareSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        } else {
          compareSection.classList.add('fullscreen-enter-animation');
          compareSection.classList.add('fullscreen-mode');
          setTimeout(() => {
            compareSection.classList.remove('fullscreen-enter-animation');
          }, 500);
          compareFullscreenBtn.innerHTML = '<i class="ri-fullscreen-exit-line"></i>';
          compareFullscreenBtn.setAttribute('title', 'Exit Full Screen');

          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 300);
        }
      });
    }

    const findFullscreenBtn = document.getElementById('findFullscreenBtn');
    const findSection = document.getElementById('find');

    if (findFullscreenBtn && findSection) {
      findFullscreenBtn.addEventListener('click', () => {
        const isFullscreen = findSection.classList.contains('fullscreen-mode');

        if (isFullscreen) {
          findSection.classList.remove('fullscreen-mode');
          findFullscreenBtn.innerHTML = '<i class="ri-fullscreen-line"></i>';
          findFullscreenBtn.setAttribute('title', 'Full Screen');

          setTimeout(() => {
            findSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        } else {
          findSection.classList.add('fullscreen-mode');
          findFullscreenBtn.innerHTML = '<i class="ri-fullscreen-exit-line"></i>';
          findFullscreenBtn.setAttribute('title', 'Exit Full Screen');
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (compareSection && compareSection.classList.contains('fullscreen-mode')) {
          compareSection.classList.remove('fullscreen-mode');
          compareFullscreenBtn.innerHTML = '<i class="ri-fullscreen-line"></i>';
          compareFullscreenBtn.setAttribute('title', 'Full Screen');
        }
        if (findSection && findSection.classList.contains('fullscreen-mode')) {
          findSection.classList.remove('fullscreen-mode');
          findFullscreenBtn.innerHTML = '<i class="ri-fullscreen-line"></i>';
          findFullscreenBtn.setAttribute('title', 'Full Screen');
        }
      }
    });
  };

  setupFullscreenButtons();
});