# Russian Adoptees Organization

Official website source for the Russian Adoptees Organization.

## Mission

The Russian Adoptees Organization connects and supports adoptees from Russia and the former Soviet Union through community, advocacy, heritage, practical resources, and international connection.

## Stack

- Static HTML, CSS, and JavaScript
- Cloudflare Workers + Static Assets
- GitHub source control
- Automatic Cloudflare deployments from `main`

## Local development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```

The production site is intended to run at `russianadoptees.com` and `www.russianadoptees.com`.

## Repository safety

Do not commit API keys, passwords, private member data, email credentials, Cloudflare tokens, or other secrets. Store secrets in Cloudflare's protected environment/secrets system instead.
