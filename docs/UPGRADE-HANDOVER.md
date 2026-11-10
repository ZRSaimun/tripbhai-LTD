# Trip Bhai upgrade handover

## What this release provides

Public travel and service pages, a lazy-loaded Three.js Earth with bounded scroll progress, illustrative routes, destination controls, pause/skip controls, reduced-motion and phone fallbacks, English/Bangla public copy, and private operational routes. The heavy Earth module is dynamically imported only by the homepage experience, not the staff or client workspace.

The application uses Sites sign-in, D1 records and private R2 objects. Client and staff permissions are checked on the server for case and file operations. Public titles do not determine permissions. There are no default staff credentials or production test clients.

## Setup still required

- Configure `TRIP_OWNER_SUBJECT` to the intended owner's stable, site-specific authenticated subject, obtained from that person's signed-in `/api/platform/me` response. Do not substitute an email address or the application's account UUID. The owner then opens `/staff` and selects **Set up provisioned owner**.
- Configure `MFA_ENCRYPTION_KEY` as 32 cryptographically random bytes encoded in base64. Staff enrol their own authenticator. Keep this key in server secrets and securely backed up; changing it invalidates existing encrypted enrolments.
- Configure an approved HTTPS malware and format-validation processor using `DOCUMENT_SCANNER_URL` and `DOCUMENT_SCANNER_TOKEN`. Uploads fail closed without these. The server sends the exact bytes and SHA-256 digest. The processor must return `{ "sha256": "<same digest>", "verdict": "clean" | "infected", "formatValid": true }` only after full file-format validation and malware scanning. Test the real processor before accepting documents. Test fixtures use a stub, not a live malware service.
- Configure a separate `BACKUP_ENCRYPTION_KEY` (32 random base64 bytes) for encrypted backup downloads. Establish a business retention policy and independent backup custody.
- Email/password identity, outbound email, automatic WhatsApp, online payments, airline booking integration and OCR are not connected. Supported ChatGPT sign-in, copied invitation links, in-portal notifications, staff quotations and audited manual payments are available after account setup.
- Obtain professional authorisation and scope evidence before activating regulated UK services. The owner records this under **Authorisation** and separately activates the service under **Content**.
- Supply and approve real team photographs; the fifth profile remains unpublished. Supply publication permission and reviewed redacted visa derivatives before publishing stories. No invented success totals are displayed.

## Staff workflows

1. **Invite staff:** Owner → Staff & access → create invitation with the intended permission profile. Share the returned link through an independently verified contact channel. After the recipient signs in and claims it, verify their identity and approve the claim. Each staff member then enrols MFA. Revoke access here to invalidate existing sessions immediately.
2. **Create clients/cases:** Clients → New client; continue into a new service case. Existing clients can have several cases. Anonymous enquiries become stored cases, but are not automatically linked to an account by email. Invite and verify the client later.
3. **Assign cases:** Case → Overview → Assign case / handover. Managers and caseworkers need assignment or an explicit owner-granted case access record. Finance has separate, limited access.
4. **Request and upload documents:** Add an explicitly authorised applicant, then issue a reviewed checklist or a case-specific request. In Documents choose the correct item, source (WhatsApp, email, in person or paper scan), date received and file. The original remains private; only scanned files can be opened.
5. **Review:** Documents → review latest file → accepted, checking, needs replacement or expired. A replacement requires an explanation and produces a client notification. Acceptance is a staff review, not a visa decision or authenticity certification.
6. **Collaborate:** Use Messages for client communication, Internal notes for staff only, Tasks for assignments and Appointments for time-zone-labelled bookings. Conflicting confirmed bookings are rejected. Stale revisions cannot silently overwrite changes.
7. **Content:** Save drafts, preview the saved draft, then deliberately publish. Team IDs are `team:1` through `team:5`. Use the separate marketing photograph upload for approved portraits/destination images. `destination:feature` controls the large destination photograph. FAQ entries support English and Bangla fields.
8. **Success stories:** Record an actual approved outcome and client publication permission. Create a separate image copy using rotation, crop and permanent solid redaction rectangles. Inspect all identifiers, faces, machine-readable zones, barcodes and metadata in the saved file. The owner nominates the derivative in the case Activity tab. Content staff download that nominated image, record their review and deliberately publish. Permission withdrawal disables public retrieval. Old publication assets must also be reviewed when migrating from the earlier live site; removed originals are not included in this release's public asset folder.

## Backup and recovery

Owner → Settings → Download encrypted backup. The interactive backup supports up to 24 MiB of referenced file bytes; larger/automatically scheduled production backups require a streaming backup integration. It refuses incomplete or mismatched objects. Keep the encryption key separately.

For an isolated restore on a trusted machine, use Node with SQLite and TypeScript stripping:

```
TRIP_BACKUP_KEY=<separately-stored-key> node --experimental-strip-types scripts/restore-backup.mjs BACKUP.json NEW_TARGET_DIRECTORY
```

The target must not exist. The script restores a fresh SQLite database and private objects, verifies object digests and refuses a non-empty target. It does not alter production. Active sessions and pending invitations are excluded; staff must sign in again. A production restore requires a separately reviewed transfer into the managed database and private bucket. No production restoration was attempted.

## Release verification and limitations

The isolated suite covers enquiry idempotency, shared client records, persisted uploads, WhatsApp provenance, replacement requests, direct case/file permission denial, revocation, optimistic concurrency, quarantine, service-specific forms, regulated-service guards, adult applicant separation, booking conflicts, CSRF, staff MFA, public derivative withdrawal, encrypted restore and bounded reversible Earth mapping. Tests use non-sensitive fixtures and isolated SQLite/R2 adapters.

Browser checks verified desktop page rendering, flight/mentoring form switching, skip navigation and pause/resume control. This environment's browser has WebGL disabled, so the London fallback was verified, not rendered GPU smoothness. Physical iPhone/Android camera upload, real identity-provider sessions across devices, live scanner operation and device performance remain deployment acceptance checks. No perfect performance score is claimed.

## Deployment

Preserve the existing project identity and audience. Build with `npm test`, inspect generated migrations, push the exact source, package validated output, save a Sites version and deploy that saved version. Sites provisions the declared D1/R2 bindings and applies included migrations. Never deploy this Worker to an untrusted direct origin: authentication relies on Sites dispatch stripping and supplying identity headers. Do not enable document intake until the scanner contract has been verified in the deployed environment.
