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

// Keep the institutional sections visible in the primary navigation everywhere.
document.querySelectorAll('.site-nav').forEach((siteNav) => {
  const cta = siteNav.querySelector('.nav-cta');
  const ensureNavLink = (href, label) => {
    if (siteNav.querySelector(`a[href="${href}"]`)) return;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    if (cta) siteNav.insertBefore(link, cta);
    else siteNav.appendChild(link);
  };
  ensureNavLink('/administration.html', 'Administration');
  ensureNavLink('/press.html', 'Press');
  ensureNavLink('/contact.html', 'Contact');
});

// Turn the original one-page homepage into the front door for the full RAO site.
if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
  const routeMap = {
    '#resources': '/resources.html',
    '#community': '/community.html',
    '#about': '/about.html',
    '#contact': '/contact.html'
  };

  document.querySelectorAll('a[href]').forEach((link) => {
    const route = routeMap[link.getAttribute('href')];
    if (route) link.setAttribute('href', route);
  });

  const resourceLinks = document.querySelectorAll('.resource-list a');
  const resourceRoutes = [
    '/citizenship.html',
    '/citizenship.html',
    '/resources.html',
    '/resources.html',
    '/resources.html',
    '/community.html'
  ];
  resourceLinks.forEach((link, index) => {
    if (resourceRoutes[index]) link.setAttribute('href', resourceRoutes[index]);
  });

  const resourceLibraryLink = document.querySelector('.resources-copy .text-link');
  if (resourceLibraryLink) {
    resourceLibraryLink.setAttribute('href', '/resources.html');
    resourceLibraryLink.innerHTML = 'Explore the resource center <span>→</span>';
  }

  const hero = document.querySelector('.hero');
  if (hero && !document.querySelector('[data-site-expansion]')) {
    const expansion = document.createElement('section');
    expansion.className = 'section section-soft';
    expansion.setAttribute('data-site-expansion', '');
    expansion.innerHTML = `
      <div class="container">
        <div class="section-intro reveal">
          <p class="eyebrow dark">Current resources · Reviewed August 29, 2026</p>
          <h2>Answers built specifically for Russian adoptees.</h2>
          <p>RAO now combines adoptee experience with official-source research: current Russian citizenship law, consular procedures, documentation guidance, community infrastructure, and a public organizational archive.</p>
        </div>
        <div class="card-grid four-up">
          <a class="feature-card reveal" href="/citizenship.html">
            <div class="icon-box" aria-hidden="true">RU</div>
            <h3>Citizenship & Passports</h3>
            <p>Were you adopted from Russia? Start here to understand why you may still hold Russian citizenship and how official verification works.</p>
          </a>
          <a class="feature-card reveal" href="/law-updates.html">
            <div class="icon-box" aria-hidden="true">§</div>
            <h3>Russian Law Updates</h3>
            <p>Current Russian citizenship and consular changes translated into plain English, with dates and links to the official government source.</p>
          </a>
          <a class="feature-card reveal" href="/resources.html">
            <div class="icon-box" aria-hidden="true">⌘</div>
            <h3>Resource Center</h3>
            <p>Records, documentation, consular assistance, biological-family search, heritage, travel, and practical adoptee starting points.</p>
          </a>
          <a class="feature-card reveal" href="/community.html">
            <div class="icon-box" aria-hidden="true">◎</div>
            <h3>Russian Adoptee Community</h3>
            <p>Connect through the established adoptee-only Facebook community, RAO Discord infrastructure, regional groups, and meetups.</p>
          </a>
        </div>
      </div>`;
    hero.insertAdjacentElement('afterend', expansion);
  }

  // Organization structured data for search engines.
  if (!document.querySelector('script[data-rao-schema]')) {
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.setAttribute('data-rao-schema', '');
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Russian Adoptees Organization',
      url: 'https://russianadoptees.com/',
      description: 'An adoptee-led organization connecting and supporting people adopted from Russia and former-Soviet countries through community, practical resources, heritage, education, and advocacy.',
      sameAs: ['https://www.facebook.com/groups/russianadoptees']
    });
    document.head.appendChild(schema);
  }
}

// Keep high-value public sections one click away from every page.
document.querySelectorAll('.footer-links').forEach((footerLinks) => {
  const additions = [
    ['/administration.html', 'Administration'],
    ['/press.html', 'Press'],
    ['/law-updates.html', 'Law Updates'],
    ['/documents.html', 'Documents'],
    ['/contact.html', 'Contact']
  ];
  additions.forEach(([href, label]) => {
    if (!footerLinks.querySelector(`a[href="${href}"]`)) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      footerLinks.appendChild(link);
    }
  });
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
