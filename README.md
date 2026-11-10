# Trip Bhai — Travel, visa and UK support

Trip Bhai is the public brand of **TRIP BHAI LTD**, a UK private limited company (company no. **16286072**). The company is recorded as active and its registered office is **53 Blenheim Road, London, England, E6 3EG**. The customer-facing site is currently published at [beyond-travel-portfolio.saintblue022.chatgpt.site](https://beyond-travel-portfolio.saintblue022.chatgpt.site).

This repository contains the full application source: public marketing pages, the client portal, staff workspace, Cloudflare Worker API, D1 schema and migrations, private R2 document handling, and supporting assets. See [the recovered project context](docs/PROJECT_CONTEXT.md), [current company research](docs/agency-sources.md), and the [implementation handover](docs/UPGRADE-HANDOVER.md).

## Confirmed public content

- Customer contact: [tripbhaiofficial@gmail.com](mailto:tripbhaiofficial@gmail.com) · [+44 7514 718031](tel:+447514718031).
- Owner-supplied public profiles: ZR Saimon — Founder; Riazul Iqbal Feroz — Dubai Country Manager; Umme Sumaiya — Director, Client Relations; Aumlanul Abrar — Director of UK Operations & Technology.
- Four named team profiles are present. The fifth remains unpublished until real details and an approved photograph are supplied. Public job titles do not grant staff permissions.
- The registered office and the Google Maps listing are displayed separately. The map listing is not presented as a confirmed walk-in office; visitors are asked to confirm an appointment and location first.
- The public visa-story gallery stays empty unless a story has client permission, a reviewed redacted asset and deliberate approval. This repository contains no passport or visa-document images and makes no success-rate or guaranteed-outcome claims.

## Services and safeguards

Visit-visa enquiries, flights and personalised travel planning are the primary public services. UK immigration advice, form selection and representation remain unavailable unless the responsible adviser’s registration and permitted scope have been verified. The platform enforces this authorisation check in its service workflow. Mentoring and planned wellbeing support are not presented as legal advice or clinical care. Flight and hotel enquiries are not represented as live fares or confirmed bookings.

Initial enquiries collect only basic contact and trip details. Sensitive documents are requested separately through an authenticated case workflow. See the handover for the server-side permission model, upload scanning requirements, staff setup and other deployment dependencies.

## Development

The app uses Vinext/React with a Cloudflare Worker, D1 database and private R2 storage. The supported scripts are in `package.json`; run `npm run install:ci` to install the project's pinned dependencies. `npm run dev` starts the local development server. `npm test` runs the build and focused test suite.

Database schema: `db/schema.ts`. Migrations: `drizzle/`. Keep secrets out of source control and follow `docs/UPGRADE-HANDOVER.md` for required production configuration.

## Hosting and domain

The existing production site is served by the Sites/Cloudflare Worker environment. GitHub Pages cannot run the Worker API, D1 or private R2 workflows, so the repository’s `CNAME` file alone does not publish this application through GitHub Pages. The `tripbhai.co.uk` custom-domain mapping is pending DNS verification; the existing Sites URL remains live while that is completed.

## Privacy and source assets

`public/images/` contains the Trip Bhai logo and destination/earth imagery, not client documents. Never add unredacted passport or visa originals, client records, credentials, or private uploads to the repository. Keep private originals in the secure case store and publish only a separately redacted, permissioned derivative.

## GitHub Pages

The requested GitHub Pages URL is a lightweight entry point that forwards visitors to the full production site at [beyond-travel-portfolio.saintblue022.chatgpt.site](https://beyond-travel-portfolio.saintblue022.chatgpt.site). The full application depends on its existing Cloudflare Worker, D1 and private R2 services, so it cannot run as a standalone GitHub Pages static site. The `Publish Trip Bhai GitHub Pages entry` workflow deploys only `public-pages/`; it does not deploy application secrets or client records.

To activate the URL, the repository’s Pages setting must use **GitHub Actions** as the source. If no Pages site is configured yet, an administrator must select that in repository **Settings → Pages → Build and deployment → Source**. The separate `tripbhai.co.uk` custom domain remains configured on the production Sites host.
