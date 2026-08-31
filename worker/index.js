const ALLOWED_TOPICS = new Set([
  'Citizenship or passport question',
  'Russian records or documents',
  'Community or membership',
  'Volunteer interest',
  'Media inquiry',
  'Partnership or institutional inquiry',
  'Website or resource correction',
  'Other'
]);

const LEGACY_REDIRECTS = new Map([
  ['/the-administration', '/administration'],
  ['/issues', '/resources'],
  ['/faq', '/resources'],
  ['/welcome-home', '/'],
  ['/home', '/']
]);

const CANONICAL_ROUTES = new Set([
  '/about',
  '/accessibility',
  '/administration',
  '/citizenship',
  '/community',
  '/contact',
  '/documents',
  '/law-updates',
  '/news',
  '/policies',
  '/press',
  '/privacy',
  '/resources'
]);

const SOCIAL_IMAGE = 'https://russianadoptees.com/assets/rao-social.jpg';

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
  'cross-origin-opener-policy': 'same-origin',
  'content-security-policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' mailto:",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
};

const secureResponse = (response, request) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  if (new URL(request.url).protocol === 'https:') {
    headers.set('strict-transport-security', 'max-age=31536000');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

const canonicalPath = (pathname) => {
  if (!pathname || pathname === '/index.html') return '/';
  const extensionless = pathname.replace(/\.html$/, '');
  return extensionless.length > 1 ? extensionless.replace(/\/+$/, '') : extensionless || '/';
};

const redirect = (request, url, pathname, status = 301) => {
  const destination = new URL(pathname, url.origin);
  destination.search = url.search;
  return secureResponse(Response.redirect(destination.toString(), status), request);
};

const normalizeHtml = (response, request, url) => {
  const state = {
    canonical: false,
    ogUrl: false,
    ogImage: false,
    ogImageWidth: false,
    ogImageHeight: false,
    ogImageAlt: false,
    twitterCard: false,
    twitterImage: false
  };
  const canonicalUrl = `https://russianadoptees.com${canonicalPath(url.pathname)}`;

  const rewriter = new HTMLRewriter()
    .on('link[rel="canonical"]', {
      element(element) {
        state.canonical = true;
        element.setAttribute('href', canonicalUrl);
      }
    })
    .on('meta[property="og:url"]', {
      element(element) {
        state.ogUrl = true;
        element.setAttribute('content', canonicalUrl);
      }
    })
    .on('meta[property="og:image"]', {
      element(element) {
        state.ogImage = true;
        element.setAttribute('content', SOCIAL_IMAGE);
      }
    })
    .on('meta[property="og:image:width"]', {
      element(element) {
        state.ogImageWidth = true;
        element.setAttribute('content', '600');
      }
    })
    .on('meta[property="og:image:height"]', {
      element(element) {
        state.ogImageHeight = true;
        element.setAttribute('content', '315');
      }
    })
    .on('meta[property="og:image:alt"]', {
      element(element) {
        state.ogImageAlt = true;
        element.setAttribute('content', 'Russian Adoptees Organization');
      }
    })
    .on('meta[name="twitter:card"]', {
      element(element) {
        state.twitterCard = true;
        element.setAttribute('content', 'summary_large_image');
      }
    })
    .on('meta[name="twitter:image"]', {
      element(element) {
        state.twitterImage = true;
        element.setAttribute('content', SOCIAL_IMAGE);
      }
    })
    .on('a[href]', {
      element(element) {
        const href = element.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        try {
          const target = new URL(href, url.origin);
          if (target.origin !== url.origin) return;
          if (!target.pathname.endsWith('.html')) return;
          const extensionless = target.pathname.slice(0, -5);
          if (!CANONICAL_ROUTES.has(extensionless)) return;
          element.setAttribute('href', `${extensionless}${target.search}${target.hash}`);
        } catch {
          // Leave malformed or non-URL values untouched.
        }
      }
    })
    .on('head', {
      element(element) {
        element.onEndTag((endTag) => {
          const tags = [];
          if (!state.canonical) tags.push(`<link rel="canonical" href="${canonicalUrl}">`);
          if (!state.ogUrl) tags.push(`<meta property="og:url" content="${canonicalUrl}">`);
          if (!state.ogImage) tags.push(`<meta property="og:image" content="${SOCIAL_IMAGE}">`);
          if (!state.ogImageWidth) tags.push('<meta property="og:image:width" content="600">');
          if (!state.ogImageHeight) tags.push('<meta property="og:image:height" content="315">');
          if (!state.ogImageAlt) tags.push('<meta property="og:image:alt" content="Russian Adoptees Organization">');
          if (!state.twitterCard) tags.push('<meta name="twitter:card" content="summary_large_image">');
          if (!state.twitterImage) tags.push(`<meta name="twitter:image" content="${SOCIAL_IMAGE}">`);
          if (tags.length) endTag.before(tags.join(''), { html: true });
        });
      }
    });

  return secureResponse(rewriter.transform(response), request);
};

const json = (data, status = 200, request = null) => {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
  return request ? secureResponse(response, request) : response;
};

const clean = (value, maxLength) => String(value ?? '').trim().slice(0, maxLength);
const cleanHeader = (value, maxLength) => clean(value, maxLength).replace(/[\r\n]+/g, ' ');

const validEmail = (value) => {
  if (value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      if (request.method === 'GET' || request.method === 'HEAD') {
        const pathname = url.pathname;
        const trimmedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
        const legacyTarget = LEGACY_REDIRECTS.get(trimmedPath.toLowerCase());

        if (legacyTarget) {
          return redirect(request, url, legacyTarget);
        }

        if (pathname === '/index.html') {
          return redirect(request, url, '/');
        }

        if (pathname.endsWith('.html')) {
          const extensionless = pathname.slice(0, -5);
          if (CANONICAL_ROUTES.has(extensionless)) {
            return redirect(request, url, extensionless);
          }
        }

        if (pathname.length > 1 && pathname.endsWith('/') && CANONICAL_ROUTES.has(trimmedPath)) {
          return redirect(request, url, trimmedPath);
        }
      }

      const assetResponse = await env.ASSETS.fetch(request);
      const contentType = assetResponse.headers.get('content-type') || '';
      if (request.method === 'GET' && contentType.toLowerCase().includes('text/html')) {
        return normalizeHtml(assetResponse, request, url);
      }
      return secureResponse(assetResponse, request);
    }

    if (url.pathname === '/api/health') {
      if (request.method !== 'GET') {
        return json({ ok: false, error: 'Method not allowed.' }, 405, request);
      }

      return json({
        ok: true,
        service: 'Russian Adoptees Organization',
        contactApi: true,
        emailBindingConfigured: Boolean(env.EMAIL),
        contactDestinationConfigured: Boolean(env.CONTACT_DESTINATION),
        timestamp: new Date().toISOString()
      }, 200, request);
    }

    if (url.pathname !== '/api/contact') {
      return json({ ok: false, error: 'Not found.' }, 404, request);
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed.' }, 405, request);
    }

    const origin = request.headers.get('origin');
    if (origin) {
      try {
        if (new URL(origin).host !== url.host) {
          return json({ ok: false, error: 'Invalid request origin.' }, 403, request);
        }
      } catch {
        return json({ ok: false, error: 'Invalid request origin.' }, 403, request);
      }
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return json({ ok: false, error: 'Invalid request format.' }, 415, request);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 16000) {
      return json({ ok: false, error: 'Request is too large.' }, 413, request);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid request body.' }, 400, request);
    }

    // Honeypot: bots commonly fill every field. Return a normal-looking success
    // without generating mail so they do not learn how the filter works.
    if (clean(body.website, 200)) {
      return json({ ok: true }, 200, request);
    }

    const startedAt = Number(body.startedAt || 0);
    if (startedAt > 0 && Date.now() - startedAt < 1200) {
      return json({ ok: true }, 200, request);
    }

    const name = cleanHeader(body.name, 100);
    const email = cleanHeader(body.email, 254).toLowerCase();
    const topic = cleanHeader(body.topic, 100);
    const subject = cleanHeader(body.subject, 120);
    const message = clean(body.message, 5000);
    const privacyAccepted = body.privacy === true;

    if (name.length < 2 || !validEmail(email) || !ALLOWED_TOPICS.has(topic) || subject.length < 3 || message.length < 20 || !privacyAccepted) {
      return json({
        ok: false,
        error: 'Please complete all required fields with valid information.'
      }, 400, request);
    }

    if (!env.CONTACT_DESTINATION) {
      return json({
        ok: false,
        error: 'RAO email delivery is being activated. Please email contact@russianadoptees.com directly for now.'
      }, 503, request);
    }

    const emailText = [
      'RUSSIAN ADOPTEES ORGANIZATION',
      'Website Inquiry',
      '',
      `Name: ${name}`,
      `Reply email: ${email}`,
      `Inquiry type: ${topic}`,
      `Subject: ${subject}`,
      '',
      'MESSAGE',
      '-------',
      message,
      '',
      '-------',
      `Submitted: ${new Date().toISOString()}`,
      'Source: https://russianadoptees.com/contact',
      '',
      'Security note: This message was submitted through the RAO public contact form. Do not request highly sensitive credentials or financial information by reply.'
    ].join('\n');

    try {
      await env.EMAIL.send({
        to: env.CONTACT_DESTINATION,
        from: {
          email: 'contact@russianadoptees.com',
          name: 'Russian Adoptees Organization'
        },
        replyTo: {
          email,
          name
        },
        subject: `[RAO Website] ${topic}: ${subject}`,
        text: emailText
      });

      return json({
        ok: true,
        message: 'Your inquiry has been received by the Russian Adoptees Organization.'
      }, 200, request);
    } catch (error) {
      console.error('RAO contact email failed', error?.code, error?.message);

      if (error?.code === 'E_RATE_LIMIT_EXCEEDED' || error?.code === 'E_DAILY_LIMIT_EXCEEDED') {
        return json({ ok: false, error: 'The contact service is temporarily busy. Please try again later.' }, 429, request);
      }

      if (error?.code === 'E_SENDER_NOT_VERIFIED' || error?.code === 'E_SENDER_DOMAIN_NOT_AVAILABLE') {
        return json({ ok: false, error: 'RAO email delivery is being activated. Please email contact@russianadoptees.com directly for now.' }, 503, request);
      }

      return json({ ok: false, error: 'We could not send your inquiry right now. Please email contact@russianadoptees.com directly.' }, 500, request);
    }
  }
};
