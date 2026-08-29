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

  // Make the expanded site immediately visible instead of hiding it behind navigation changes.
  const hero = document.querySelector('.hero');
  if (hero && !document.querySelector('[data-site-expansion]')) {
    const expansion = document.createElement('section');
    expansion.className = 'section section-soft';
    expansion.setAttribute('data-site-expansion', '');
    expansion.innerHTML = `
      <div class="container">
        <div class="section-intro reveal">
          <p class="eyebrow dark">Now live</p>
          <h2>Explore the expanded Russian Adoptees Organization.</h2>
          <p>The website now includes dedicated citizenship and passport guidance, a resource center, public governance material, community information, and an official document archive.</p>
        </div>
        <div class="card-grid four-up">
          <a class="feature-card reveal" href="/citizenship.html">
            <div class="icon-box" aria-hidden="true">RU</div>
            <h3>Citizenship & Passports</h3>
            <p>Start here for citizenship-status questions, consular processes, documentation, and adoptee-specific guidance.</p>
          </a>
          <a class="feature-card reveal" href="/resources.html">
            <div class="icon-box" aria-hidden="true">⌘</div>
            <h3>Resource Center</h3>
            <p>Find practical starting points for records, consular assistance, heritage, travel, and other adoptee needs.</p>
          </a>
          <a class="feature-card reveal" href="/policies.html">
            <div class="icon-box" aria-hidden="true">§</div>
            <h3>Policies & Governance</h3>
            <p>Read how RAO approaches advocacy, community support, consular relations, transparency, and organizational standards.</p>
          </a>
          <a class="feature-card reveal" href="/documents.html">
            <div class="icon-box" aria-hidden="true">▤</div>
            <h3>Document Archive</h3>
            <p>Browse public memoranda, organizational policies, and other official RAO material in a web-readable archive.</p>
          </a>
        </div>
      </div>`;
    hero.insertAdjacentElement('afterend', expansion);
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
