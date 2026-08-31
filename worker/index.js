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

const redirect = (request, url, pathname, status = 301) => {
  const destination = new URL(pathname, url.origin);
  destination.search = url.search;
  return secureResponse(Response.redirect(destination.toString(), status), request);
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
