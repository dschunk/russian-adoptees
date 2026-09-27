import { DurableObject } from "cloudflare:workers";

const ALLOWED_TOPICS = new Set([
  'Citizenship or passport question',
  'Russian records or documents',
  'Orphanage or institution research',
  'Community or membership',
  'Volunteer interest',
  'Media inquiry',
  'Partnership or institutional inquiry',
  'Website or resource correction',
  'Other'
]);

const ORPHANAGE_TYPES = new Set([
  'Unknown',
  'Baby home / дом ребёнка',
  "Children's home / детский дом",
  'Boarding institution / школа-интернат',
  'Medical or hospital placement',
  'Shelter or social-rehabilitation institution',
  'Other institution'
]);

const ORPHANAGE_RECORDS = new Set([
  'Russian birth certificate',
  'Adoption court decree',
  'Adoption certificate',
  'Orphanage or child-history report',
  'Medical records',
  'Russian passport or travel document',
  'Adoption agency packet',
  'Photographs with identifying clues',
  'Other records'
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
  '/orphanage-finder',
  '/policies',
  '/press',
  '/privacy',
  '/resources'
]);

const SOCIAL_IMAGE = 'https://russianadoptees.com/assets/rao-social.jpg';

const CASE_STATUSES = new Set([
  'Received',
  'Under review',
  'Researching',
  'Waiting for information',
  'Possible match found',
  'Resolved',
  'Closed'
]);

const HISTORICAL_PLACE_ALIASES = new Map([
  ['leningrad', 'Saint Petersburg'],
  ['ленинград', 'Санкт-Петербург'],
  ['gorky', 'Nizhny Novgorod'],
  ['горький', 'Нижний Новгород'],
  ['sverdlovsk', 'Yekaterinburg'],
  ['свердловск', 'Екатеринбург'],
  ['kuybyshev', 'Samara'],
  ['kuibyshev', 'Samara'],
  ['куйбышев', 'Самара'],
  ['kalinin', 'Tver'],
  ['калинин', 'Тверь'],
  ['ordzhonikidze', 'Vladikavkaz'],
  ['орджоникидзе', 'Владикавказ']
]);

const OFFICIAL_INSTITUTION_LEADS = [
  {
    regions: ['saint petersburg', 'санкт-петербург'],
    city: 'Peterhof',
    name: 'Дом социального обслуживания «Первый»',
    address: '198517, Санкт-Петербург, Петергоф, улица Воровского, дом 12',
    director: 'Асикритов Валерий Николаевич',
    phone: '450-70-39',
    sourceLabel: 'St. Petersburg government',
    sourceUrl: 'https://www.gov.spb.ru/gov/otrasl/trud/podvedomstvennye-uchrezhdeniya/',
    notes: 'Current public institution listing; historical names and functions should be checked for the adoption year.'
  },
  {
    regions: ['saint petersburg', 'санкт-петербург'],
    city: 'Peterhof',
    name: 'Детский дом социального обслуживания «Солнечный»',
    address: '198504, Санкт-Петербург, Петергоф, улица Петергофская, дом 4/2',
    director: 'Дерябина Ирина Викторовна',
    phone: '450-50-83',
    sourceLabel: 'St. Petersburg government',
    sourceUrl: 'https://www.gov.spb.ru/gov/otrasl/trud/podvedomstvennye-uchrezhdeniya/',
    notes: 'Current public institution listing; historical names and functions should be checked for the adoption year.'
  },
  {
    regions: ['saint petersburg', 'санкт-петербург'],
    city: 'Ushkovo',
    name: 'Дом социального обслуживания «Парус»',
    address: '197720, Санкт-Петербург, посёлок Ушково, Приморское шоссе, дом 617, литера О',
    sourceLabel: 'St. Petersburg government',
    sourceUrl: 'https://www.gov.spb.ru/gov/otrasl/trud/podvedomstvennye-uchrezhdeniya/',
    notes: 'Current public institution listing; historical names and functions should be checked for the adoption year.'
  },
  {
    regions: ['tver oblast', 'тверская область'],
    city: 'Kimry',
    name: 'Кимрская школа-интернат',
    address: '171505, Тверская область, г. Кимры, ул. Парковая, д. 3',
    sourceLabel: 'Russian Ministry of Education',
    sourceUrl: 'https://edu.gov.ru/activity/main_activities/limited_health/list_of_organizations/',
    notes: 'Listed as an institution for children without parental care; verify the institution name and status for the relevant year.'
  },
  {
    regions: ['tver oblast', 'тверская область'],
    city: 'Ploskosh',
    name: 'Плоскошская школа-интернат',
    address: '172870, Тверская область, Торопецкий р-н, п. Плоскошь, ул. Советская, д. 19',
    sourceLabel: 'Russian Ministry of Education',
    sourceUrl: 'https://edu.gov.ru/activity/main_activities/limited_health/list_of_organizations/',
    notes: 'Listed as a boarding institution; verify adoption-era function and archival successor.'
  },
  {
    regions: ['tver oblast', 'тверская область'],
    city: 'Emmaus',
    name: 'Эммаусская школа-интернат',
    address: '170530, Тверская область, Калининский р-н, н.п. Эммаусская школа-интернат, д. 12',
    sourceLabel: 'Russian Ministry of Education',
    sourceUrl: 'https://edu.gov.ru/activity/main_activities/limited_health/list_of_organizations/',
    notes: 'Listed as an institution for children without parental care; verify adoption-era function and name.'
  },
  {
    regions: ['rostov oblast', 'ростовская область'],
    city: 'Azov',
    name: 'Детский дом г. Азова',
    director: 'Байер Елена Александровна',
    phone: '(863-42) 4-02-15',
    sourceLabel: 'Regional education directory',
    sourceUrl: 'https://remroo.profiedu.ru/site/section?id=43',
    notes: 'Public staff directory entry. Staff names are time-sensitive and should not be assumed to match an earlier adoption year.'
  },
  {
    regions: ['rostov oblast', 'ростовская область'],
    city: 'Bataysk',
    name: 'Детский дом г. Батайска',
    director: 'Пащенко Ольга Петровна',
    phone: '(863-54) 2-25-66',
    sourceLabel: 'Regional education directory',
    sourceUrl: 'https://remroo.profiedu.ru/site/section?id=43',
    notes: 'Public staff directory entry. Staff names are time-sensitive and should not be assumed to match an earlier adoption year.'
  },
  {
    regions: ['moscow', 'москва'],
    city: 'Moscow',
    name: 'ЦССВ «Наш дом»',
    address: '121309, Москва, ул. Новозаводская, д. 19А, стр. 2',
    sourceLabel: 'Наставники child-welfare directory',
    sourceUrl: 'https://nastavniki.org/detskie-doma/',
    notes: 'Current child-welfare directory listing; predecessor institutions and historical names may differ.'
  },
  {
    regions: ['moscow', 'москва'],
    city: 'Moscow',
    name: 'ЦССВ «Каховские ромашки»',
    address: '117303, Москва, ул. Каховка, д. 2, стр. 3',
    sourceLabel: 'Наставники child-welfare directory',
    sourceUrl: 'https://nastavniki.org/detskie-doma/',
    notes: 'Current child-welfare directory listing; predecessor institutions and historical names may differ.'
  },
  {
    regions: ['moscow', 'москва'],
    city: 'Moscow',
    name: 'ЦССВ «Вертикаль»',
    address: '117638, Москва, Криворожский проезд, д. 1, стр. 1',
    sourceLabel: 'Наставники child-welfare directory',
    sourceUrl: 'https://nastavniki.org/detskie-doma/',
    notes: 'Current child-welfare directory listing; predecessor institutions and historical names may differ.'
  }
];

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
const cleanList = (value, allowedSet, maxItems = 20) =>
  (Array.isArray(value) ? value : [])
    .map((item) => clean(item, 300))
    .filter((item) => item && (!allowedSet || allowedSet.has(item)))
    .slice(0, maxItems);

const validEmail = (value) => {
  if (value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const validCaseReference = (value) => /^RAO-OF-\d{8}-[A-F0-9]{8}$/.test(String(value || '').trim().toUpperCase());

const caseStub = (env, reference) => {
  const id = env.CASE_STORE.idFromName(reference);
  return env.CASE_STORE.get(id);
};

const internalJson = async (stub, path, data) => {
  const response = await stub.fetch('https://case.internal' + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (degrees) => degrees * Math.PI / 180;
  const earthKm = 6371.0088;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const safeHttp = (value) => {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
};

const buildOsmAddress = (tags = {}) => {
  if (tags['addr:full']) return tags['addr:full'];
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', ');
  return [
    tags['addr:postcode'],
    tags['addr:region'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    street
  ].filter(Boolean).join(', ');
};

const institutionTypeLabel = (tags = {}, name = '') => {
  const lower = String(name).toLowerCase();
  if (lower.includes('дом ребёнка') || lower.includes('дом ребенка') || lower.includes('baby home')) return 'Baby home';
  if (lower.includes('детский дом') || lower.includes('orphanage') || lower.includes("children's home")) return "Children's home";
  if (lower.includes('школа-интернат') || lower.includes('интернат')) return 'Boarding institution';
  if (lower.includes('центр содействия') || lower.includes('центр помощи детям')) return 'Child-welfare center';
  if (tags.social_facility === 'group_home') return 'Residential social facility';
  return 'Child-welfare institution';
};

const canonicalInstitutionType = (label) => {
  if (label === 'Baby home') return 'Baby home / дом ребёнка';
  if (label === "Children's home") return "Children's home / детский дом";
  if (label === 'Boarding institution') return 'Boarding institution / школа-интернат';
  return 'Other institution';
};

const normalizePlaceForGeocoding = (input) => {
  const raw = clean(input, 160);
  const lower = raw.toLowerCase();
  return HISTORICAL_PLACE_ALIASES.get(lower) || raw;
};

const matchingOfficialLeads = (geocode) => {
  const searchable = [
    geocode?.display_name,
    geocode?.address?.state,
    geocode?.address?.region,
    geocode?.address?.city,
    geocode?.address?.town,
    geocode?.address?.county
  ].filter(Boolean).join(' ').toLowerCase();
  return OFFICIAL_INSTITUTION_LEADS.filter((lead) =>
    lead.regions.some((region) => searchable.includes(region))
  ).map(({ regions, ...lead }) => lead);
};

export class CaseStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
  }

  async fetch(request) {
    const url = new URL(request.url);
    let body = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    if (url.pathname === '/create') {
      const existing = await this.ctx.storage.get('case');
      if (!existing) await this.ctx.storage.put('case', body);
      return Response.json({ ok: true });
    }

    const record = await this.ctx.storage.get('case');
    if (!record) return Response.json({ ok: false, found: false }, { status: 404 });

    if (url.pathname === '/lookup') {
      if (body.emailHash !== record.emailHash) return Response.json({ ok: false, found: false }, { status: 404 });
      return Response.json({
        ok: true,
        found: true,
        reference: record.reference,
        submittedAt: record.submittedAt,
        status: record.status,
        publicNote: record.publicNote || '',
        lastUpdatedAt: record.lastUpdatedAt || record.submittedAt
      });
    }

    if (url.pathname === '/admin') {
      if (body.adminTokenHash !== record.adminTokenHash) return Response.json({ ok: false }, { status: 403 });
      if (!CASE_STATUSES.has(body.status)) return Response.json({ ok: false }, { status: 400 });
      record.status = body.status;
      record.publicNote = clean(body.publicNote, 1000);
      record.lastUpdatedAt = new Date().toISOString();
      await this.ctx.storage.put('case', record);
      return Response.json({ ok: true, status: record.status, lastUpdatedAt: record.lastUpdatedAt });
    }

    return Response.json({ ok: false }, { status: 404 });
  }
}

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
        orphanageCaseApi: true,
        emailBindingConfigured: Boolean(env.EMAIL),
        contactDestinationConfigured: Boolean(env.CONTACT_DESTINATION),
        timestamp: new Date().toISOString()
      }, 200, request);
    }

    if (url.pathname === '/api/orphanage-case') {
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
      if (contentLength > 32000) {
        return json({ ok: false, error: 'Request is too large.' }, 413, request);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: 'Invalid request body.' }, 400, request);
      }

      if (clean(body.website, 200)) {
        return json({ ok: true, reference: 'RAO-OF-RECEIVED' }, 200, request);
      }

      const startedAt = Number(body.startedAt || 0);
      if (startedAt > 0 && Date.now() - startedAt < 1500) {
        return json({ ok: true, reference: 'RAO-OF-RECEIVED' }, 200, request);
      }

      const requesterName = cleanHeader(body.requesterName, 100);
      const email = cleanHeader(body.email, 254).toLowerCase();
      const requesterRole = cleanHeader(body.requesterRole, 100);
      const authorized = body.authorized === true;
      const privacyAccepted = body.privacy === true;
      const noSensitiveNumbers = body.noSensitiveNumbers === true;

      const birthName = clean(body.birthName, 160);
      const birthNameCyrillic = clean(body.birthNameCyrillic, 160);
      const dateOfBirth = clean(body.dateOfBirth, 60);
      const birthPlace = clean(body.birthPlace, 160);
      const birthRegion = clean(body.birthRegion, 160);
      const formerPlaceName = clean(body.formerPlaceName, 160);
      const identityNotes = clean(body.identityNotes, 1200);

      const institutionName = clean(body.institutionName, 220);
      const institutionNumber = clean(body.institutionNumber, 80);
      const requestedInstitutionType = clean(body.institutionType, 100);
      const institutionType = ORPHANAGE_TYPES.has(requestedInstitutionType) ? requestedInstitutionType : 'Unknown';
      const institutionLocation = clean(body.institutionLocation, 180);
      const yearsInCare = clean(body.yearsInCare, 100);
      const addressClue = clean(body.addressClue, 240);
      const placeNotes = clean(body.placeNotes, 1800);

      const directorName = clean(body.directorName, 180);
      const doctorName = clean(body.doctorName, 180);
      const staffNames = clean(body.staffNames, 500);
      const officialNames = clean(body.officialNames, 300);
      const records = cleanList(body.records, ORPHANAGE_RECORDS, 12);
      const documentClues = clean(body.documentClues, 2000);
      const evidenceNotes = clean(body.evidenceNotes, 1500);

      const adoptionYear = clean(body.adoptionYear, 60);
      const adoptionAge = clean(body.adoptionAge, 80);
      const adoptionCourt = clean(body.adoptionCourt, 220);
      const adoptionAgency = clean(body.adoptionAgency, 220);
      const facilitatorName = clean(body.facilitatorName, 220);
      const adoptiveDestination = clean(body.adoptiveDestination, 180);
      const adoptionNotes = clean(body.adoptionNotes, 1800);
      const researchQueries = cleanList(body.researchQueries, null, 8);
      const researchRoutes = cleanList(body.researchRoutes, null, 8);

      const locatorCluePresent = Boolean(
        birthPlace || birthRegion || institutionName || institutionNumber || institutionLocation ||
        directorName || doctorName || adoptionCourt || adoptionAgency || documentClues || placeNotes
      );

      if (
        requesterName.length < 2 ||
        !validEmail(email) ||
        !authorized ||
        !privacyAccepted ||
        !noSensitiveNumbers ||
        !locatorCluePresent
      ) {
        return json({
          ok: false,
          error: 'Please complete the required fields and include at least one useful research clue.'
        }, 400, request);
      }

      if (!env.CONTACT_DESTINATION) {
        return json({
          ok: false,
          error: 'RAO email delivery is being activated. Please use the general contact page for now.'
        }, 503, request);
      }

      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const reference = `RAO-OF-${dateCode}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const subjectLead = cleanHeader(birthName || institutionName || birthPlace || 'New research case', 80);

      const section = (title, rows) => {
        const rendered = rows
          .filter(([, value]) => value && (!Array.isArray(value) || value.length))
          .map(([label, value]) => `${label}: ${Array.isArray(value) ? value.join('; ') : value}`);
        return [title, '-'.repeat(title.length), ...(rendered.length ? rendered : ['No information provided.']), ''];
      };

      const emailText = [
        'RUSSIAN ADOPTEES ORGANIZATION',
        'Find My Orphanage — Research Case',
        '',
        `Case reference: ${reference}`,
        `Submitted: ${new Date().toISOString()}`,
        '',
        ...section('SUBMITTER', [
          ['Name', requesterName],
          ['Reply email', email],
          ['Role', requesterRole]
        ]),
        ...section('RUSSIAN IDENTITY & PLACE', [
          ['Birth / pre-adoption name', birthName],
          ['Cyrillic name', birthNameCyrillic],
          ['Date of birth / approximate date', dateOfBirth],
          ['Birthplace', birthPlace],
          ['Region', birthRegion],
          ['Former / alternate place name', formerPlaceName],
          ['Other identity clues', identityNotes]
        ]),
        ...section('INSTITUTION', [
          ['Institution name', institutionName],
          ['Number / designation', institutionNumber],
          ['Type', institutionType],
          ['Location', institutionLocation],
          ['Approximate years in care', yearsInCare],
          ['Address clue', addressClue],
          ['Place / photograph / landmark clues', placeNotes]
        ]),
        ...section('PEOPLE & RECORDS', [
          ['Director', directorName],
          ['Doctor / medical director', doctorName],
          ['Caregiver / teacher / staff', staffNames],
          ['Social worker / guardianship official', officialNames],
          ['Records on hand', records],
          ['Short document wording / stamps / phrases', documentClues],
          ['Clue provenance / source notes', evidenceNotes]
        ]),
        ...section('ADOPTION PATH', [
          ['Adoption year', adoptionYear],
          ['Age at adoption', adoptionAge],
          ['Court / jurisdiction', adoptionCourt],
          ['Adoption agency', adoptionAgency],
          ['Facilitator / translator / coordinator', facilitatorName],
          ['Adoptive destination', adoptiveDestination],
          ['Timeline / other adoption clues', adoptionNotes]
        ]),
        ...section('INVESTIGATOR SEARCH LEADS', researchQueries.map((query, index) => [`Lead ${index + 1}`, query])),
        ...section('RECOMMENDED RESEARCH ROUTES', researchRoutes.map((route, index) => [`Route ${index + 1}`, route])),
        'PRIVACY / HANDLING',
        '------------------',
        'The submitter affirmed that they are the adoptee or have permission to submit these details.',
        'The submitter affirmed that they did not include highly sensitive credentials or complete passport/document numbers.',
        'This case was submitted through the private RAO research intake and must not be published as a public directory entry.',
        '',
        'Research standard: Search strings and possible institutions are leads only. Do not describe an institution as a verified match until supporting evidence has been reviewed.',
        '',
        'Source: https://russianadoptees.com/orphanage-finder'
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
            name: requesterName
          },
          subject: `[RAO Orphanage Finder] ${reference}: ${subjectLead}`,
          text: emailText
        });

        return json({
          ok: true,
          reference,
          message: 'Your orphanage research case has been received by the Russian Adoptees Organization.'
        }, 200, request);
      } catch (error) {
        console.error('RAO orphanage research email failed', error?.code, error?.message);

        if (error?.code === 'E_RATE_LIMIT_EXCEEDED' || error?.code === 'E_DAILY_LIMIT_EXCEEDED') {
          return json({ ok: false, error: 'The research intake is temporarily busy. Please try again later.' }, 429, request);
        }

        if (error?.code === 'E_SENDER_NOT_VERIFIED' || error?.code === 'E_SENDER_DOMAIN_NOT_AVAILABLE') {
          return json({ ok: false, error: 'RAO email delivery is being activated. Please use the general contact page for now.' }, 503, request);
        }

        return json({ ok: false, error: 'We could not send your research case right now. Please use the general contact page.' }, 500, request);
      }
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
