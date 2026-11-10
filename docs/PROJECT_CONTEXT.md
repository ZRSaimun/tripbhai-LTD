# Trip Bhai website — project context

This is the working brief recovered from the earlier “Travel Agency Website” work, the saved upgrade prompt and the current source. The exact chat transcript was not available, but the saved prompt preserves its requirements. Legal company facts below were refreshed from Companies House on 10 November 2026; see [agency-sources.md](agency-sources.md).

## Product goal

Maintain one application with three connected experiences:

1. **Public website:** a memorable, accessible travel and visa portfolio, with visit-visa enquiries as the main commercial focus.
2. **Client portal:** authenticated, resumable service cases, checklists, private documents, messages and status updates.
3. **Staff workspace:** real case management, task assignment, document review, content control, staff roles and audit history.

Keep the existing public production URL and audience stable while changes are prepared. The current source uses the existing Sites/Cloudflare Worker platform, D1 and private R2 storage.

## Brand and approved content

- Customer-facing brand: **Trip Bhai**. Legal name: **TRIP BHAI LTD**, company no. **16286072**.
- Owner-confirmed contact details: **tripbhaiofficial@gmail.com**, **+44 7514 718031**.
- Owner-supplied profiles: ZR Saimon — Founder; Riazul Iqbal Feroz — Dubai Country Manager; Umme Sumaiya — Director, Client Relations; Aumlanul Abrar — Director of UK Operations & Technology.
- Provide room for five profiles, but leave the fifth unpublished until the owner supplies the real name, role and an approved photograph.
- Use British English and an English/Bangla interface structure. Preserve people’s names exactly. Do not translate, edit or expose clients’ legal documents.
- Clearly distinguish the registered office from a map listing or customer meeting location. Ask visitors to confirm a location before travelling.

## Public service scope

Prioritise visit-visa enquiries and approved client stories, with supporting pages for UK application support, flights, hotels, tailored trips, contact and practical one-to-one UK orientation. Let the owner mark services active, coming soon or unpublished. Do not show appointments or other availability that is not real.

UK immigration advice, choosing an application form and representation require verified adviser registration and permitted scope before activation. The project must not evade this requirement by calling the work form-filling. The code has server-side authorisation gates; keep the public copy equally clear. Practical orientation is not immigration advice, legal representation, therapy or crisis support.

Flights and hotels are staff-managed enquiries and quotations unless a genuine booking integration is connected. Do not imply live fares, confirmed bookings, tickets, payments or government submissions without supporting records. A website enquiry is not an application to an embassy or the Home Office.

## Experience and accessibility

- Use the existing Trip Bhai brand assets and a premium, cinematic travel identity.
- Keep the homepage’s genuine scroll-controlled 3D Earth as a progressive enhancement. It must have London/Dubai/Dhaka illustrative routes, reverse smoothly with scroll, and never imply a live route or office at every marker.
- Keep headline text and enquiry actions available before 3D assets load. Support native scrolling, pause/skip controls, reduced motion, a static fallback and simplified mobile motion.
- Keep the heavy Earth experience off client and staff routes. Do not block forms or force a long loading intro.
- Provide labelled controls, keyboard access, visible focus, readable contrast, accessible dialogs and announcements for uploads and submissions.

## Portal and staff safeguards

- Public enquiries collect minimal contact and travel details, not passports or financial records.
- Request sensitive documents only through an authenticated account or a verified invitation. Store private originals in the protected object store, never in `public/`, browser local storage, analytics or source control.
- Separate client records from login accounts. Do not link adults or expose one person’s documents to another based only on a shared name, email or family relationship.
- Use case-specific permissions on every server and file operation. Staff receive individual accounts, narrowly scoped roles and MFA; public job titles do not grant permissions.
- Version checklists and record their sources, reviewer and review date. Ireland and Schengen requirements remain separate. A staff document review is not a visa decision or proof of authenticity.
- Record audit events without copying raw documents or credentials into logs. Keep internal notes separate from client messages.
- Publish a success story only after recorded permission, separate permanent redaction, staff review and a deliberate publish action. Keep the original private and support withdrawal.

## Current implementation and deployment dependencies

The source includes the public pages, English/Bangla copy, scroll-controlled Earth, D1-backed case workflows, private uploads, staff workspace, role and case checks, checklist drafts, content controls, document quarantine hooks, audit events and backup/restore tooling. [UPGRADE-HANDOVER.md](UPGRADE-HANDOVER.md) records setup steps and limits; do not represent unconfigured integrations as live.

Remaining setup called out by the handover includes the owner’s site-specific identity subject, MFA and backup encryption keys, an approved file-format and malware-scanning service, and verified authorisation evidence before regulated UK services can activate. Email/password, automated WhatsApp, email delivery, online payments, airline booking and OCR are not connected. No production restore or physical-device upload acceptance is claimed.

The repository is a source copy; its `CNAME` file does not deploy a Worker to GitHub Pages. The Sites URL remains live while `tripbhai.co.uk` waits for DNS verification.

## Content and privacy exclusions

- Never invent customer stories, testimonials, visa totals, approval rates, biographies, qualifications, partners or awards.
- Do not put personal financial information, identity documents, credentials, private client records or unredacted visa evidence in this repository.
- Do not use the old self-published “hundreds of clients” or “high approval rate” statements without reliable, current evidence.
- Do not treat company incorporation date as a trading start date. Show director appointments and ownership/control accurately and separately.
