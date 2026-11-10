import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Bhai — Visa support & travel from London",
  description: "Trip Bhai Ltd is a London-based travel agency. Explore our visa success collection, meet our team, and enquire about visa support, flights and stays. UK company 16286072.",
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'TravelAgency',name:'Trip Bhai',legalName:'TRIP BHAI LTD',url:'https://beyond-travel-portfolio.saintblue022.chatgpt.site',telephone:'+44 7514 718031',email:'tripbhaiofficial@gmail.com',identifier:{'@type':'PropertyValue',propertyID:'UK company number',value:'16286072'},sameAs:'https://find-and-update.company-information.service.gov.uk/company/16286072'})}}/>{children}</body>
    </html>
  );
}
