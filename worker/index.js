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

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});

const clean = (value, maxLength) => String(value ?? '').trim().slice(0, maxLength);

const validEmail = (value) => {
  if (value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      if (request.method !== 'GET') {
        return json({ ok: false, error: 'Method not allowed.' }, 405);
      }

      return json({
        ok: true,
        service: 'Russian Adoptees Organization',
        contactApi: true,
        emailBindingConfigured: Boolean(env.EMAIL),
        contactDestinationConfigured: Boolean(env.CONTACT_DESTINATION),
        timestamp: new Date().toISOString()
      });
    }

    if (url.pathname !== '/api/contact') {
      return json({ ok: false, error: 'Not found.' }, 404);
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed.' }, 405);
    }

    const origin = request.headers.get('origin');
    if (origin) {
      try {
        if (new URL(origin).host !== url.host) {
          return json({ ok: false, error: 'Invalid request origin.' }, 403);
        }
      } catch {
        return json({ ok: false, error: 'Invalid request origin.' }, 403);
      }
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return json({ ok: false, error: 'Invalid request format.' }, 415);
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 16000) {
      return json({ ok: false, error: 'Request is too large.' }, 413);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid request body.' }, 400);
    }

    // Honeypot: bots commonly fill every field. Return a normal-looking success
    // without generating mail so they do not learn how the filter works.
    if (clean(body.website, 200)) {
      return json({ ok: true });
    }

    const startedAt = Number(body.startedAt || 0);
    if (startedAt > 0 && Date.now() - startedAt < 1200) {
      return json({ ok: true });
    }

    const name = clean(body.name, 100);
    const email = clean(body.email, 254).toLowerCase();
    const topic = clean(body.topic, 100);
    const subject = clean(body.subject, 120);
    const message = clean(body.message, 5000);
    const privacyAccepted = body.privacy === true;

    if (name.length < 2 || !validEmail(email) || !ALLOWED_TOPICS.has(topic) || subject.length < 3 || message.length < 20 || !privacyAccepted) {
      return json({
        ok: false,
        error: 'Please complete all required fields with valid information.'
      }, 400);
    }

    if (!env.CONTACT_DESTINATION) {
      return json({
        ok: false,
        error: 'RAO email delivery is being activated. Please email contact@russianadoptees.com directly for now.'
      }, 503);
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
      'Source: https://russianadoptees.com/contact.html',
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
      });
    } catch (error) {
      console.error('RAO contact email failed', error?.code, error?.message);

      if (error?.code === 'E_RATE_LIMIT_EXCEEDED' || error?.code === 'E_DAILY_LIMIT_EXCEEDED') {
        return json({ ok: false, error: 'The contact service is temporarily busy. Please try again later.' }, 429);
      }

      if (error?.code === 'E_SENDER_NOT_VERIFIED' || error?.code === 'E_SENDER_DOMAIN_NOT_AVAILABLE') {
        return json({ ok: false, error: 'RAO email delivery is being activated. Please email contact@russianadoptees.com directly for now.' }, 503);
      }

      return json({ ok: false, error: 'We could not send your inquiry right now. Please email contact@russianadoptees.com directly.' }, 500);
    }
  }
};
