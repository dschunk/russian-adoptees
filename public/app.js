const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const year = document.querySelector('[data-year]');

const updateHeader = () => {
  if (!header) return;
  if (document.body.classList.contains('inner-page')) {
    header.classList.add('scrolled');
    return;
  }
  header.classList.toggle('scrolled', window.scrollY > 24);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    });
  });
}

if (year) year.textContent = new Date().getFullYear();

// Turn the original one-page homepage into the front door for the full RAO site.
if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
  const routeMap = {
    '#resources': '/resources.html',
    '#community': '/community.html',
    '#about': '/about.html'
  };

  document.querySelectorAll('a[href]').forEach((link) => {
    const route = routeMap[link.getAttribute('href')];
    if (route) link.setAttribute('href', route);
  });

  const resourceLinks = document.querySelectorAll('.resource-list a');
  const resourceRoutes = [
    '/citizenship.html',
    '/resources.html',
    '/resources.html',
    '/resources.html',
    '/resources.html',
    '/resources.html'
  ];
  resourceLinks.forEach((link, index) => {
    if (resourceRoutes[index]) link.setAttribute('href', resourceRoutes[index]);
  });

  const resourceLibraryLink = document.querySelector('.resources-copy .text-link');
  if (resourceLibraryLink) {
    resourceLibraryLink.setAttribute('href', '/resources.html');
    resourceLibraryLink.innerHTML = 'Explore the resource center <span>→</span>';
  }
}

// Keep the public document archive one click away from every page.
document.querySelectorAll('.footer-links').forEach((footerLinks) => {
  if (!footerLinks.querySelector('a[href="/documents.html"]')) {
    const documentsLink = document.createElement('a');
    documentsLink.href = '/documents.html';
    documentsLink.textContent = 'Documents';
    footerLinks.appendChild(documentsLink);
  }
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}
