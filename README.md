# Trip Bhai — Travel & visa portfolio

Travel agency portfolio with a real visa gallery, a five-person team section, destination enquiries, travel services and a persistent enquiry form. Triprex-inspired scenic opening, original layout and owner-supplied red/black logo. Company: TRIP BHAI LTD, 16286072.

## Confirmed owner content
- Email: tripbhaiofficial@gmail.com.
- ZR Saimon — Founder.
- Riazul Iqbal Feroz — Dubai Country Manager.
- Umme Sumaiya — Director, Client Relations.
- Aumlanul Abrar — UK Operations & IT Manager.
- Fifth team member is explicitly awaiting an introduction. Genuine staff portraits have not been supplied; monograms are intentional substitutes.
- Five owner-supplied visa display images are included unchanged: four Spain and one Switzerland. Each is labelled as a historical 2024 photograph. Public collection size is not a total agency success count.

## Excluded assets
The UK photograph dated in its filename 2024-07-01 23.26.00 still shows date-of-birth and reference information. The Spain photograph 2024-07-01 23.28.46 still shows an identifying remarks code. These are not included in the repository or Site. Request more thoroughly redacted copies. The selected PDF contains an Ireland/Schengen checklist mismatch; it is not offered as a public download.

The supplied display photographs already obscure names and passport/document numbers. Client portraits remain visible. Confirm the agency has permission for use before a public audience launch. Never add unredacted originals to this repository.

## Enquiries
POST `/api/enquiries` validates and saves enquiries in D1. There is no public customer-record read endpoint. After saving, the customer can open an email draft addressed to the confirmed agency email with their enquiry and reference. The interface explicitly says the customer must send that draft. No automatic email notification is claimed or configured.

## Development
Uses the supplied Vinext/Cloudflare starter and existing build scripts. D1 binding: DB. Schema: `db/schema.ts`. Migrations: `drizzle/`. Preserve the Sites identity in `.openai/hosting.json`. Run the built-Worker tests after building.

## Photography and sources
Three Unsplash destination photos are credited in the site. Visa display photos and the logo are owner-supplied. Staff monograms are not portraits. Public research and owner corrections are recorded in `docs/agency-sources.md`.
