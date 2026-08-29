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
- Cloudflare Email Service for website inquiries
- GitHub source control
- Automatic Cloudflare deployments from `main`

## Public site structure

- `/` — Homepage
- `/about.html` — Mission, principles, and organization overview
- `/administration.html` — Executive leadership, offices, governance, and public accountability
- `/contact.html` — Official contact directory and website inquiry form
- `/press.html` — Official Press Office and media resources
- `/resources.html` — Adoptee resource center
- `/citizenship.html` — Russian citizenship, passport, and consular starting guide
- `/law-updates.html` — Russian law and consular changes translated into plain English
- `/policies.html` — Governance and policy summaries
- `/documents.html` — Web-native public document archive
- `/community.html` — Community infrastructure and official platforms
- `/news.html` — Organization news and milestone timeline
- `/sitemap.xml` — Search-engine sitemap
- `/robots.txt` — Crawl policy

## Contact API

The website remains predominantly static. Requests matching `/api/*` run through `worker/index.js`; all other pages continue to use Cloudflare Static Assets.

- `GET /api/health` — confirms the Worker/API layer is active and reports whether required bindings are present.
- `POST /api/contact` — validates public contact-form submissions and sends them through the Cloudflare Email Service `EMAIL` binding.

The Worker expects a secret named `CONTACT_DESTINATION`. This value is the verified private destination inbox for website inquiries and must be configured in Cloudflare, not committed to this repository.

Cloudflare configuration requirements:

1. Onboard `russianadoptees.com` under Email Service > Email Sending.
2. Keep the `EMAIL` send binding configured for the Worker.
3. Add a Worker secret named `CONTACT_DESTINATION` containing the verified private destination address.
4. Public sender: `contact@russianadoptees.com`.

The public form includes server-side validation, same-origin checks, size limits, a honeypot field, minimum completion-time filtering, and graceful direct-email fallback messaging.

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

For local contact-API development, place development-only values in `.dev.vars` or `.env`; these files are already excluded from source control.

## Deploy

```bash
npm run deploy
```

## Repository safety

Do not commit API keys, passwords, private member data, email credentials, forwarding destinations, Cloudflare tokens, private correspondence, applicant data, or other secrets. Store secrets in Cloudflare's protected environment/secrets system instead.
