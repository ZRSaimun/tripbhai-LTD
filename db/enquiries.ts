import { env } from "cloudflare:workers";

export function getEnquiryDatabase() {
  if (!env.DB) throw new Error("The enquiry database is unavailable.");
  return env.DB;
}
