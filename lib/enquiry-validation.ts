import { z } from "zod";

export const enquirySchema = z.object({
  requestId: z.string().uuid(),
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(254).transform(value => value.toLowerCase()),
  service: z.enum(["Visa support", "Flights", "Hotels & stays", "A complete trip"]),
  destination: z.string().trim().min(1, "Please enter a destination, or ‘not sure yet’.").max(120),
  travelMonth: z.string().regex(/^$|^\d{4}-(0[1-9]|1[0-2])$/, "Please select a valid travel month.").default(""),
  message: z.string().trim().max(1500).default(""),
  consent: z.literal(true, { errorMap: () => ({ message: "Please allow us to respond to your enquiry." }) }),
  website: z.string().max(0, "Your enquiry could not be accepted.").default(""),
});
