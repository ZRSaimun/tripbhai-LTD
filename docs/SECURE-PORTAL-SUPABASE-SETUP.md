# Secure portal: Supabase setup and cutover

## Architecture

The public marketing website remains on GitHub Pages. The portal is a separate application deployed at `https://portal.tripbhai.co.uk`; its production database and private file store belong to a dedicated TripBhai Supabase project. Do not reuse the Family Heritage Tree Supabase project.

The migration branch is `secure-portal/supabase-foundation`. It adds a PostgreSQL schema and RLS foundation under `supabase/migrations/`. This is not yet a deployed portal or production-ready cutover: runtime authentication, application routes, OAuth credentials, private storage validation/scanning, backups and end-to-end acceptance still need implementation and configuration.

## Create the isolated Supabase project

1. Create a new Supabase project named `TripBhai Secure Portal` in an organization controlled by TRIP BHAI LTD.
2. Choose a strong database password, retain it in the company password manager, and enable the project’s available backup/PITR option appropriate to the selected plan.
3. Apply the checked-in migrations with Supabase CLI from the repository root:
   ```sh
   supabase link --project-ref YOUR_TRIPBHAI_PROJECT_REF
   supabase db push
   ```
4. Keep the service-role key server-only. Never add it to GitHub, frontend bundles, logs, screenshots or client-side environment variables.
5. Provision the first administrator via a trusted, audited administrative process after verifying the account holder. The migration deliberately creates no default privileged account or password.

## Supabase Auth settings

Set the Site URL to `https://portal.tripbhai.co.uk`. Add these redirect URLs:

- Production: `https://portal.tripbhai.co.uk/auth/callback`
- Local development: `http://localhost:3000/auth/callback`
- Optional preview domain: add an exact, controlled preview callback; do not use a broad wildcard in production.

Enable email verification, password reset and magic-link sign-in. Set a short, company-approved session lifetime and enable MFA for management accounts. Do not expose client self-signup as a management route: every new account receives only the Client role; privileged access is assigned through a separately authenticated admin workflow.

### Google

In Google Cloud Console, configure the OAuth consent screen for TRIP BHAI LTD, add the verified production and development origins, then create a Web OAuth client. Set its authorized redirect URI to the Supabase provider callback shown under Authentication → Providers → Google (normally `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`). Copy the client ID and secret into Supabase’s Google provider settings. Do not put provider secrets in this repository.

### Microsoft

In Microsoft Entra admin center, register a web application. Add the exact Supabase callback URI shown under Authentication → Providers → Azure/Microsoft as a Web redirect URI, configure the intended supported account types, and create a client secret with an expiry reminder. Enter the application ID, tenant choice and secret in Supabase’s provider configuration. Test both the approved tenant and error handling for unsupported accounts.

### Facebook

In Meta for Developers, create/configure the Facebook Login product, add the exact Supabase callback URI shown by Supabase, and set the app domains and privacy policy URL to the verified TripBhai domains. Complete any required app review before making Facebook login available to customers. Store the app secret only in Supabase provider settings.

### Application environment

Use server/runtime secret settings for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key; safe for browser use with RLS)
- `SUPABASE_SERVICE_ROLE_KEY` (server only; bypasses RLS)
- OAuth provider secrets (stored in Supabase, not copied into the app)
- `DOCUMENT_SCANNER_URL` and `DOCUMENT_SCANNER_TOKEN` (server only, when an approved scanner is selected)
- `BACKUP_ENCRYPTION_KEY` (server only, stored separately from backups)

Do not create a production `.env` file in Git. Commit only a redacted `.env.example`.

## Private document storage

The migration creates a private `client-documents` bucket restricted to PDF/JPEG/PNG and 10 MiB per object. Files must be uploaded through a case-authorized route, scanned and format-validated before they can be downloaded. The app must use short-lived signed URLs generated only after checking the current user's case access and the document's client visibility. Do not provide permanent public URLs or place client files in GitHub Pages, repository assets or browser local storage.

The scanner must fail closed. Its clean result must include the SHA-256 digest of the exact uploaded bytes, a clean malware verdict and successful format validation. Staff review is a review, not an authenticity certificate or a visa decision.

## Domain and deployment order

1. Keep `tripbhai.co.uk` on GitHub Pages.
2. Deploy the portal app to a production host capable of server-side auth callbacks and secret storage.
3. Configure `portal.tripbhai.co.uk` DNS to that host and verify HTTPS before enabling production sign-in.
4. Set the Supabase Site URL and provider callback/origin settings to the production host.
5. Deploy and migrate the dedicated Supabase project, set backups, scanner and monitoring.
6. Create and MFA-enroll the Administrator and Case Manager through named individual accounts. Never use shared accounts or default passwords.
7. Run the end-to-end acceptance checklist below with synthetic accounts and non-sensitive test files.
8. Update the public login links to `https://portal.tripbhai.co.uk/client-login` and `https://portal.tripbhai.co.uk/management-login` only after those routes work.
9. Keep the existing portal available during a verification period. Delete it only after the owner explicitly confirms the replacement works.

## Cutover acceptance checklist

- [ ] Client registration, email verification, sign-in, magic link and password reset
- [ ] Google, Microsoft and Facebook OAuth in production, including callback errors
- [ ] Management MFA enrollment and enforcement
- [ ] Client can access only their own case, applicant, message and document rows
- [ ] Client cannot read internal notes or another client's records
- [ ] Case assignment and role restrictions enforced by RLS and server checks
- [ ] Finance functions restricted to Administrator, Operations Manager and Finance Manager
- [ ] Upload allowlist, size limit, scanner fail-closed path and replacement versioning
- [ ] Short-lived signed download links; inaccessible after revocation or expiry
- [ ] Audit trail captures privileged changes without document bytes or credentials
- [ ] Backup completed and isolated restore verified
- [ ] Mobile layout, keyboard flow and accessibility review
- [ ] Production HTTPS, security headers, rate limits and secret scan
- [ ] Public site links checked; no old-host or ChatGPT sign-in references remain in active portal flows
- [ ] Existing portal kept online until owner confirms end-to-end success

A checkbox is not evidence by itself. Record the date, test account class, outcome and reviewer in a release report, without including client personal data.
