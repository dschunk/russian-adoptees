# Russian Adoptees Organization

Official website source for the Russian Adoptees Organization.

## Mission

The Russian Adoptees Organization connects and supports adoptees from Russia and the former Soviet Union through community, advocacy, heritage, practical resources, and international connection.

## Production

- https://russianadoptees.com
- https://www.russianadoptees.com

## Stack

- Static HTML, CSS, and JavaScript
- Cloudflare Workers + Static Assets
- GitHub source control
- Automatic Cloudflare deployments from `main`

## Public site structure

- `/` — Homepage
- `/about.html` — Mission, principles, and organization overview
- `/administration.html` — Executive leadership and organizational structure
- `/press.html` — Press Office, media contact, and organization facts
- `/contact.html` — Official inquiry form
- `/resources.html` — Adoptee resource center
- `/citizenship.html` — Russian citizenship, passport, and consular starting guide
- `/law-updates.html` — Official-source Russian law and consular change monitor
- `/policies.html` — Governance and policy summaries
- `/documents.html` — Web-native public document archive
- `/community.html` — Discord and community infrastructure
- `/news.html` — Organization news and milestone timeline
- `/sitemap.xml` — Search-engine sitemap
- `/robots.txt` — Crawl policy

## Contact API

`POST /api/contact` is handled by `worker/index.js`. Static pages continue to be served directly from `public/`; only `/api/*` routes execute Worker logic.

The contact API:

- validates all submitted fields server-side;
- checks same-origin requests when an Origin header is present;
- enforces request and field-length limits;
- uses a honeypot and minimum-submission-time check for basic bot filtering;
- sends through Cloudflare Email Service using the `EMAIL` send binding;
- uses `contact@russianadoptees.com` as the public sender;
- uses the visitor's email as Reply-To;
- reads the private delivery mailbox from the `CONTACT_DESTINATION` Cloudflare secret.

`GET /api/health` reports whether the Worker sees the Email binding and private contact destination without exposing either value.

The private destination address must never be committed to this repository. Configure it in Cloudflare as a secret named `CONTACT_DESTINATION`.

## Official branding

The site-wide identity uses the official RAO navy-and-gold seal in `public/assets/rao-seal.webp` and the simplified crest favicon in `public/assets/rao-favicon.webp`. Branding overrides are centralized in `public/branding.css` and loaded site-wide through `public/app.js`.

## Content standards

The website is designed to distinguish clearly between:

1. **RAO policy and organizational positions** — decisions adopted by the organization.
2. **Community and educational resources** — information intended to help adoptees organize questions and find a starting point.
3. **Official government determinations** — decisions that only the relevant government, embassy, consulate, court, or other competent authority can make.

References to embassies, consulates, governments, or public officials must not imply endorsement, affiliation, partnership, or delegated governmental authority unless such a relationship is explicitly documented.

## Local development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Repository safety

Do not commit API keys, passwords, private member data, private forwarding addresses, email credentials, Cloudflare tokens, private correspondence, applicant data, or other secrets. Store secrets in Cloudflare's protected environment/secrets system instead.
