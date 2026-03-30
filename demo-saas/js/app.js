document.addEventListener('DOMContentLoaded', () => {
  // Active nav state based on current filename
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentFile || (currentFile === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });

  // Settings tabs
  const tabBtns = document.querySelectorAll('[data-tab-btn]');
  const tabPanels = document.querySelectorAll('[data-tab-panel]');

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tabBtn;
        tabBtns.forEach(b => b.classList.toggle('tabs__btn--active', b === btn));
        tabPanels.forEach(p => {
          p.classList.toggle('tabs__panel--active', p.dataset.tabPanel === target);
        });
      });
    });
  }

  // Mobile sidebar toggle
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar--open');
      if (overlay) overlay.classList.toggle('sidebar-overlay--visible');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('sidebar-overlay--visible');
    });
  }

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
