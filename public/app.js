// Russian Adoptees Organization site shell and progressive enhancements.
const RAO_BRAND_VERSION = '20260829-7';
const RAO_SEAL_URL = `/assets/rao-seal.svg?v=${RAO_BRAND_VERSION}`;
const RAO_FAVICON_URL = `/assets/rao-favicon.svg?v=${RAO_BRAND_VERSION}`;
const RAO_ORIGIN = 'https://russianadoptees.com';

const canonicalPath = (pathname) => {
  if (!pathname || pathname === '/index.html') return '/';
  return pathname.replace(/\.html$/, '') || '/';
};

if (!document.querySelector('link[data-rao-branding]') && !document.querySelector('link[href*="branding.css"]')) {
  const branding = document.createElement('link');
  branding.rel = 'stylesheet';
  branding.href = `/branding.css?v=${RAO_BRAND_VERSION}`;
  branding.setAttribute('data-rao-branding', '');
  document.head.appendChild(branding);
}

document.querySelectorAll('link[rel~="icon"]').forEach((link) => link.remove());
const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/svg+xml';
favicon.href = RAO_FAVICON_URL;
document.head.appendChild(favicon);

if (!document.querySelector('link[rel="manifest"]')) {
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = '/site.webmanifest';
  document.head.appendChild(manifest);
}

if (!document.querySelector('link[rel="canonical"]')) {
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = `${RAO_ORIGIN}${canonicalPath(location.pathname)}`;
  document.head.appendChild(canonical);
}

if (!document.querySelector('meta[property="og:image"]')) {
  const image = document.createElement('meta');
  image.setAttribute('property', 'og:image');
  image.content = `${RAO_ORIGIN}/assets/rao-seal.webp`;
  document.head.appendChild(image);
}

const installSeal = (element, className = 'rao-brand-image') => {
  if (!element || element.querySelector(`.${className}`)) return;
  element.textContent = '';
  element.style.background = 'transparent';
  element.style.border = '0';
  element.style.boxShadow = 'none';
  element.style.overflow = 'visible';

  const image = document.createElement('img');
  image.className = className;
  image.src = RAO_SEAL_URL;
  image.alt = '';
  image.decoding = 'async';
  image.width = className === 'rao-admin-seal-image' ? 190 : 62;
  image.height = image.width;
  image.style.width = '100%';
  image.style.height = '100%';
  image.style.objectFit = 'contain';
  image.style.display = 'block';
  image.style.filter = 'drop-shadow(0 4px 10px rgba(0,0,0,.18))';
  image.addEventListener('error', () => {
    element.textContent = 'RAO';
    element.style.background = '#0b1f33';
    element.style.color = '#fff';
    element.style.display = 'grid';
    element.style.placeItems = 'center';
    element.style.fontWeight = '800';
    element.style.fontSize = '11px';
  }, { once: true });
  element.appendChild(image);
};

document.querySelectorAll('.brand-mark').forEach((mark) => installSeal(mark));
document.querySelectorAll('.admin-seal').forEach((mark) => installSeal(mark, 'rao-admin-seal-image'));

const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const year = document.querySelector('[data-year]');

const navigation = [
  ['/about.html', 'About'],
  ['/administration.html', 'Administration'],
  ['/resources.html', 'Resources'],
  ['/community.html', 'Community'],
  ['/news.html', 'News'],
  ['/press.html', 'Press']
];

document.querySelectorAll('.site-nav').forEach((siteNav) => {
  const links = navigation.map(([href, label]) => `<a href="${href}">${label}</a>`).join('');
  siteNav.innerHTML = `${links}<a class="nav-cta" href="/contact.html">Contact</a>`;
});

const current = canonicalPath(location.pathname);
const markCurrentLinks = () => {
  document.querySelectorAll('.site-nav a, .footer-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    const linkPath = canonicalPath(new URL(href, location.origin).pathname);
    if (linkPath === current) link.setAttribute('aria-current', 'page');
  });
};
markCurrentLinks();

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

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !nav.classList.contains('open')) return;
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    menuToggle.focus();
  });
}

if (year) year.textContent = new Date().getFullYear();

document.querySelectorAll('.footer-links').forEach((footerLinks) => {
  footerLinks.innerHTML = [
    ['/about.html', 'About'],
    ['/administration.html', 'Administration'],
    ['/resources.html', 'Resources'],
    ['/policies.html', 'Policies'],
    ['/documents.html', 'Documents'],
    ['/community.html', 'Community'],
    ['/press.html', 'Press'],
    ['/privacy.html', 'Privacy'],
    ['/accessibility.html', 'Accessibility']
  ].map(([href, label]) => `<a href="${href}">${label}</a>`).join('');
});
markCurrentLinks();

document.querySelectorAll('.footer-bottom').forEach((footerBottom) => {
  if (footerBottom.querySelector('.footer-legal')) return;
  const legal = document.createElement('span');
  legal.className = 'footer-legal';
  legal.innerHTML = '<a href="/privacy.html">Privacy</a><a href="/accessibility.html">Accessibility</a>';
  footerBottom.appendChild(legal);
});

document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  link.rel = 'noopener noreferrer';
});

if (current === '/') {
  if (!document.querySelector('script[data-rao-schema]')) {
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.setAttribute('data-rao-schema', '');
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${RAO_ORIGIN}/#organization`,
          name: 'Russian Adoptees Organization',
          url: `${RAO_ORIGIN}/`,
          logo: `${RAO_ORIGIN}/assets/rao-seal.svg`,
          description: 'An independent, adoptee-led organization connecting and supporting people adopted from Russia and former-Soviet countries through community, practical resources, heritage, education, and advocacy.',
          sameAs: [
            'https://www.facebook.com/groups/russianadoptees',
            'https://discord.gg/XqxWJHAnCY'
          ]
        },
        {
          '@type': 'WebSite',
          '@id': `${RAO_ORIGIN}/#website`,
          url: `${RAO_ORIGIN}/`,
          name: 'Russian Adoptees Organization',
          publisher: { '@id': `${RAO_ORIGIN}/#organization` }
        }
      ]
    });
    document.head.appendChild(schema);
  }
}

if (document.body.classList.contains('inner-page')) {
  const topButton = document.createElement('button');
  topButton.className = 'back-to-top';
  topButton.type = 'button';
  topButton.setAttribute('aria-label', 'Back to top');
  topButton.textContent = '↑';
  document.body.appendChild(topButton);

  const updateTopButton = () => topButton.classList.toggle('visible', window.scrollY > 700);
  updateTopButton();
  window.addEventListener('scroll', updateTopButton, { passive: true });
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

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
