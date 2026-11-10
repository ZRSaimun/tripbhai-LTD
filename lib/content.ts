// Owner-supplied content belongs here. Keep previews explicitly marked until
// real details are supplied. Never add original unredacted passport images.
export const siteContent = {
  brand: "Trip Bhai",
  email: "tripbhaiofficial@gmail.com",
  emailHref: "mailto:tripbhaiofficial@gmail.com",
  legalName: "TRIP BHAI LTD",
  companyNumber: "16286072",
  incorporated: "3 March 2025",
  registeredOffice: "53 Blenheim Road, London, England, E6 3EG",
  companyUrl: "https://find-and-update.company-information.service.gov.uk/company/16286072",
  mapsUrl: "https://www.google.com/maps/place/Trip+Bhai+ltd/@51.5371214,0.0337282,17z/data=!3m1!4b1!4m6!3m5!1s0x47d8a7efc93608cf:0x6169a2fd158bc7b0!8m2!3d51.5371214!4d0.0337282!16s%2Fg%2F11y5vxgb37!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDkwNi4wIKXMDSoASAFQAw%3D%3D",
  phoneDisplay: "+44 7514 718031",
  phoneHref: "tel:+447514718031",
  mapsAddress: "57 Raymond Road, London E13 0SP",
  founderRecordUrl: "https://find-and-update.company-information.service.gov.uk/company/16286072/officers",
  photoCredits: [
    { label: "Positano — Rafael Hoyos Weht", source: "https://unsplash.com/photos/a-city-on-the-water-BPSfX3jIsKk", detail: "Unsplash License" },
    { label: "London — Matt Pictures", source: "https://unsplash.com/photos/the-big-ben-clock-tower-towering-over-the-city-of-london-JpamSz1LXaA", detail: "Unsplash License" },
    { label: "Cappadocia — Igor Sporynin", source: "https://unsplash.com/photos/a-bunch-of-hot-air-balloons-flying-in-the-sky-YhJUdVYdXUg", detail: "Unsplash License" },
  ],
};
export type VisaStory = { id: string; title: string; preview: boolean; image: string | null; imageAlt?: string; country: string | null; visaType: string | null; approvedAt?: string; summary?: string };
export const visaStories: VisaStory[] = [];
export type TeamMember = { id: number; name: string | null; role: string; photo: string | null; bio: string | null; initials: string; location: string };
export const team: TeamMember[] = [
  { id: 1, name: "ZR Saimon", role: "Founder", photo: null, initials: "ZR", location: "United Kingdom", bio: null },
  { id: 2, name: "Riazul Iqbal Feroz", role: "Dubai Country Manager", photo: null, initials: "RF", location: "Dubai", bio: null },
  { id: 3, name: "Umme Sumaiya", role: "Director, Client Relations", photo: null, initials: "US", location: "Client relations", bio: null },
  { id: 4, name: "Aumlanul Abrar", role: "Director of UK Operations & Technology", photo: null, initials: "AA", location: "United Kingdom", bio: null },
  { id: 5, name: null, role: "Travel support", photo: null, initials: "TB", location: "Our wider team", bio: null },
];
export const services = [
  { name: "Visa support", formValue: "Visa support", description: "Application preparation and appointment support for Schengen, UK, US, Canadian and Australian visas.", link: "Discuss your visa" },
  { name: "Flights", formValue: "Flights", description: "Find a route that fits your dates, your plans and the way you like to travel.", link: "Plan your flight" },
  { name: "Hotels & stays", formValue: "Hotels & stays", description: "From a city base to a quiet escape. Let’s find somewhere that feels right for you.", link: "Find your stay" },
  { name: "Tailor-made trips", formValue: "A complete trip", description: "Bring the flights, stays and little details together in a trip shaped around you.", link: "Create your trip" },
];
