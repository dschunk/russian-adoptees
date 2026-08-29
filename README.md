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
- `/resources.html` — Adoptee resource center
- `/citizenship.html` — Russian citizenship, passport, and consular starting guide
- `/policies.html` — Governance and policy summaries
- `/documents.html` — Web-native public document archive
- `/community.html` — Discord and community infrastructure
- `/news.html` — Organization news and milestone timeline
- `/sitemap.xml` — Search-engine sitemap
- `/robots.txt` — Crawl policy

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

Do not commit API keys, passwords, private member data, email credentials, Cloudflare tokens, private correspondence, applicant data, or other secrets. Store secrets in Cloudflare's protected environment/secrets system instead.
