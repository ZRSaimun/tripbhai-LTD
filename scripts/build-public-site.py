"""Build Trip Bhai's dependency-free public website from its approved company content."""
from pathlib import Path
from html import escape
import json
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public-pages'
# Keep portal links on the Trip Bhai domain; the public build must not send
# clients to the temporary ChatGPT-hosted project.
PORTAL = 'https://tripbhai.co.uk'
TEAM = [('ZR Saimon','Founder','ZR'),('Riazul Iqbal Feroz','Dubai Country Manager','RF'),('Umme Sumaiya','Director, Client Relations','US'),('Aumlanul Abrar','Director of UK Operations & Technology','AA')]
SCHENGEN_ARCHIVE = tuple((f'story-{i:02}', f'Schengen visa story {i:02}') for i in range(1, 8))
UK_ARCHIVE = (('story-08', 'UK student visa story 08'), ('story-09', 'UK student visa story 09'))
TRAVEL_ARCHIVE = (('cabin', 'From the cabin'), ('terminal', 'At the terminal'))
NAV = [('visa-successes','Visa stories'),('visa-services','Visa enquiries'),('flights-travel','Travel planning'),('about','Our company'),('team','Our people'),('contact','Contact')]

def visa_stories_feature(on_home):
    prefix = './' if on_home else '../'
    title = 'h2' if on_home else 'h1'
    label = 'Explore visa stories' if on_home else 'View the gallery'
    href = './visa-successes/' if on_home else '#visa-gallery'
    return f'''<section class="visa-stories-feature" aria-labelledby="visa-stories-title">
  <div class="wrap visa-stories-inner">
    <div class="visa-stories-copy">
      <p class="eyebrow">VISA STORIES</p>
      <{title} id="visa-stories-title">Visa stories.<br><em>From the travel archive.</em></{title}>
      <p>Explore archived visa examples and moments from the journeys beyond them.</p>
      <p class="visa-story-count"><strong>{len(SCHENGEN_ARCHIVE) + len(UK_ARCHIVE)}</strong> visa examples in the archive</p>
      <a class="button" href="{href}">{label} <span aria-hidden="true">↗</span></a>
    </div>
    <figure class="visa-stories-scene">
      <img src="{prefix}assets/cappadocia.jpg" alt="Hot-air balloons at sunrise over Cappadocia, Türkiye" width="1000" height="700" {'loading="lazy"' if on_home else 'fetchpriority="high"'}>
      <figcaption>Cappadocia, Türkiye · Travel inspiration</figcaption>
    </figure>
  </div>
</section>'''

def link(path, label, cls='button', prefix=''):
    return f'<a class="{cls}" href="{prefix}{path}/">{label}</a>'
def heading(kicker,title,description):
    return f'<section class="page-head wrap"><p class="eyebrow">{kicker}</p><h1>{title}</h1><p class="lead">{description}</p></section>'
TEAM_RESPONSIBILITIES = {
    'ZR': 'Company direction and service development',
    'RF': 'Dubai operations and client enquiries',
    'US': 'Client communication and follow-up',
    'AA': 'UK operations and technology',
}

def people():
    return '<div class="people">'+''.join(f'<article class="person"><span class="monogram" aria-hidden="true">{i}</span><h3>{n}</h3><p>{r}</p><p class="person-responsibility">{TEAM_RESPONSIBILITIES[i]}</p></article>' for n,r,i in TEAM)+'</div>'
def cta(p):
    return f'<section class="wrap"><div class="cta"><div><p class="eyebrow">LET’S TALK ABOUT YOUR PLANS</p><h2>Your next journey<br>starts here.</h2></div>{link("contact","Talk to Trip Bhai ↗",prefix=p)}</div></section>'
def chat_widget(prefix, inline=False):
    return f'''<div class="site-chat{' site-chat-inline' if inline else ''}" id="site-chat" hidden>
{'' if inline else '<button class="button chat-toggle" type="button" aria-expanded="false" aria-controls="chat-panel">Chat with TripBhai</button>'}
<section class="chat-panel" id="chat-panel" aria-labelledby="chat-title" hidden>
  <header><div class="chat-avatar" aria-hidden="true">AI</div><div><p class="chat-kicker">TRIP BHAI</p><h2 id="chat-title">TripBhai AI assistant</h2></div>{'' if inline else '<button class="chat-close" type="button" aria-label="Close chat">×</button>'}</header>
  <div class="chat-messages" role="log" aria-live="polite" aria-label="Chat messages" tabindex="0">
    <p class="chat-welcome">I'm TripBhai's AI assistant 👋<br>Ask me anything about visas, travel planning or how our team can help.</p>
  </div>
  <div class="chat-topics" aria-label="Common questions">
    <button type="button">What documents do I need?</button><button type="button">Help with a visa</button><button type="button">Flights and hotels</button><button type="button">Speak to the team</button>
  </div>
  <form class="chat-form">
    <label for="chat-question" class="chat-label">Your question</label>
    <input id="chat-question" type="text" maxlength="240" autocomplete="off" required placeholder="Ask a question">
    <button type="submit" aria-label="Send message">Send</button>
  </form>
  <p class="chat-privacy">AI assistant — replies are automated and can make mistakes; our team confirms details by email. Please keep passport and payment details out of chat.</p>
  <a class="chat-contact" href="{prefix}contact/">Talk to the TripBhai team →</a>
</section>
</div>'''
def page(slug,title,desc,body):
    p='../' if slug else './'
    nav=''.join(f'<a href="{p}{s}/"'+(' aria-current="page"' if s==slug else '')+f'>{n}</a>' for s,n in NAV)
    schema={'@context':'https://schema.org','@type':'TravelAgency','name':'Trip Bhai','legalName':'TRIP BHAI LTD','url':'https://tripbhai.co.uk/','email':'tripbhaiofficial@gmail.com','telephone':'+447514718031','identifier':'16286072','areaServed':'Worldwide','serviceType':['Worldwide visit visa enquiry support','Schengen visa preparation support','Canada visitor visa support','Australia visitor visa support','New Zealand visitor visa support','United States visitor visa support','Flight and travel planning','Accommodation planning','Travel assistance by arrangement'],'knowsAbout':['Worldwide visit visa document preparation','Schengen travel enquiries','Canada, Australia, New Zealand and USA visitor visa enquiries','Ireland visit enquiries','Flights and accommodation']}
    html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | Trip Bhai</title><meta name="description" content="{escape(desc,quote=True)}"><meta name="theme-color" content="#122d30"><link rel="canonical" href="https://tripbhai.co.uk/{slug+'/' if slug else ''}"><meta property="og:title" content="{title} | Trip Bhai"><meta property="og:description" content="{escape(desc,quote=True)}"><meta property="og:type" content="website"><link rel="icon" href="{p}assets/favicon.svg"><link rel="stylesheet" href="{p}site.css?v=2"><script src="{p}site.js?v=2" defer></script><script type="application/ld+json">{json.dumps(schema)}</script></head><body>
<a class="skip" href="#main">Skip to content</a><div class="utility"><div class="wrap"><span>TRIP BHAI LTD · LONDON</span><a href="tel:+447514718031">+44 7514 718031</a></div></div>
<header class="header"><div class="wrap navigation"><a class="brand" href="{p}" aria-label="Trip Bhai home"><img src="{p}assets/tripbhai-wordmark-transparent.png" width="640" height="209" alt=""></a><div class="header-actions"><a class="header-chat" href="{p}chat/">Chat</a><button id="menu" class="menu" aria-expanded="false" aria-controls="navigation">Menu</button></div><nav id="navigation" aria-label="Main navigation">{nav}</nav></div></header>
<main id="main">{body}{cta(p) if slug and slug not in ('contact', 'visa-successes', 'chat') else ''}</main>
{chat_widget(p) if slug != "chat" else ""}
<footer class="footer"><div class="wrap"><div class="footer-top"><div><a class="footer-brand" href="{p}">Trip Bhai<span>ভ্রমণের সঙ্গী</span></a><p>Visit visa enquiries. Thoughtful travel planning.<br>A personal point of contact.</p></div><div><h2>Get in touch</h2><a href="mailto:tripbhaiofficial@gmail.com">tripbhaiofficial@gmail.com</a><a href="tel:+447514718031">+44 7514 718031</a><a href="{PORTAL}/client-login">Client portal ↗</a></div><div><h2>Explore</h2><a href="{p}visa-successes/">Visa stories</a><a href="{p}about/">Company details</a><a href="{p}uk-support/">Service availability</a><a href="{p}privacy-terms/">Privacy &amp; service terms</a></div></div><div class="legal"><p>© {2026} TRIP BHAI LTD · Company no. 16286072<br>Registered in England and Wales · Incorporated 3 March 2025<br>Website last updated 11 November 2026</p><p>Registered office: 53 Blenheim Road, London, England, E6 3EG.<br>Please arrange an appointment and confirm the meeting location before travelling.</p><a href="https://find-and-update.company-information.service.gov.uk/company/16286072">View company record ↗</a></div></div></footer></body></html>'''
    dest=OUT/slug if slug else OUT
    dest.mkdir(parents=True,exist_ok=True)
    (dest/'index.html').write_text(html)
p='./'
home='''<section class="hero wrap visa-hero">
  <div class="hero-copy">
    <h1>Visit visa support<br><em>from a London-based team.</em></h1>
    <p class="lead">Planning a holiday or visiting family? Tell us where you’re going and when. We’ll explain what help we can offer, what to prepare and what it costs.</p>
    <div class="actions">
      <a class="button" href="./contact/?service=Visit%20visa%20enquiry">Start a visa enquiry <span aria-hidden="true">↗</span></a>
      <a class="button secondary" href="./visa-successes/">See visa stories <span aria-hidden="true">→</span></a>
    </div>
  </div>
  <figure class="hero-image visa-hero-image cinematic-hero-scene" data-tilt-scene>
    <img src="./assets/amalfi.jpg" alt="Coastal buildings in Positano, Italy" fetchpriority="high" width="960" height="1200">
    <span class="scene-orbit scene-orbit-one" aria-hidden="true"></span>
    <span class="scene-orbit scene-orbit-two" aria-hidden="true"></span>
    <span class="scene-glow scene-glow-one" aria-hidden="true"></span>
    <span class="scene-glow scene-glow-two" aria-hidden="true"></span>
    <div class="scene-passport" aria-hidden="true" data-tilt-layer="18"><span class="passport-chip"></span><strong>TRIP BHAI</strong><small>VISA STORIES · LONDON</small><i></i></div>
    <div class="scene-stamp" aria-hidden="true" data-tilt-layer="28">READY<br><span>TO GO</span></div>
    <figcaption>Positano, Italy</figcaption>
  </figure>
</section>
<section class="wrap visa-trust" aria-label="Get to know Trip Bhai">
  <a href="./about/"><strong>London-based travel agency</strong><span>Trip Bhai Ltd · Company no. 16286072</span></a>
  <a href="./team/"><strong>Speak with a real person</strong><span>Meet the team behind your enquiry</span></a>
  <a href="tel:+447514718031"><strong>Prefer to talk?</strong><span>Call +44 7514 718031</span></a>
</section>
<section class="traveller-proof" aria-labelledby="traveller-proof-title">
  <div class="wrap traveller-proof-inner">
    <div class="traveller-proof-copy">
      <p class="eyebrow">BUILT FROM REAL JOURNEYS</p>
      <h2 id="traveller-proof-title">We know the feeling of planning a trip from the other side of the desk.</h2>
      <p>Saimun’s own travel story moves through London, Dubai, Europe, the Gulf and beyond. TripBhai grew from that experience: a team that understands the questions before a journey, because we have had to ask them too.</p>
      <p>From your first message to the moment you arrive, we can help you understand the next step, organise the practical details and find the right human support.</p>
      <a class="button" href="./about/">Meet the people behind TripBhai <span aria-hidden="true">↗</span></a>
    </div>
    <div class="traveller-proof-grid">
      <article><span>01</span><h3>Visa guidance</h3><p>Destination-focused checklists, application orientation and clear next steps.</p></article>
      <article><span>02</span><h3>Stay & route planning</h3><p>Accommodation, flights and the practical pieces around your journey.</p></article>
      <article><span>03</span><h3>Online & offline help</h3><p>Chat, email, calls and arranged meetings when you need a real person.</p></article>
      <article><span>04</span><h3>Optional tour support</h3><p>Travelling alone? Ask whether a local guide or companion arrangement is available for your route.</p></article>
    </div>
  </div>
</section>
'''+visa_stories_feature(on_home=True)+'''<section class="journey-film" id="journey-film" aria-labelledby="journey-film-title">
  <div class="journey-film-intro wrap">
    <p class="eyebrow">HOW WE HELP</p>
    <h2 id="journey-film-title">From first enquiry<br><em>to a clearer visa plan.</em></h2>
    <p>See what happens as you go from telling us about your trip to preparing your documents.</p>
  </div>
  <div class="journey-film-track">
    <div class="journey-film-stage">
      <div class="journey-film-visual" aria-hidden="true">
        <img class="journey-film-image is-active" data-film-image="0" src="./assets/amalfi.jpg" alt="">
        <img class="journey-film-image" data-film-image="1" src="./assets/cappadocia.jpg" alt="">
        <img class="journey-film-image" data-film-image="2" src="./assets/london.jpg" alt="">
        <div class="journey-film-shade"></div>
        <div class="visa-plan-preview">
          <div class="visa-plan-sheet">Trip details</div>
          <div class="visa-plan-sheet">Document checklist</div>
          <div class="visa-plan-sheet">Application preparation</div>
        </div>
      </div>
      <div class="journey-film-copy">
        <p class="journey-film-count"><span id="journey-film-current">01</span> / 03</p>
        <p class="journey-film-kicker" id="journey-film-kicker">YOUR TRIP</p>
        <h3 id="journey-film-heading">Tell us your travel plans.</h3>
        <p id="journey-film-text">Share your destination, travel dates and purpose of travel.</p>
        <div class="journey-film-meter" role="progressbar" aria-label="Journey chapter" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1"><span></span></div>
        <div class="journey-film-controls" aria-label="Choose a journey chapter">
          <button class="is-active" type="button" data-film-control="0" aria-label="Chapter 1: Your trip">01</button>
          <button type="button" data-film-control="1" aria-label="Chapter 2: Your checklist">02</button>
          <button type="button" data-film-control="2" aria-label="Chapter 3: Prepare your documents">03</button>
        </div>
      </div>
    </div>
    <ol class="journey-film-chapters wrap">
      <li class="is-active" data-film-chapter="0" data-kicker="YOUR TRIP" data-heading="Tell us your travel plans." data-text="Share your destination, travel dates and purpose of travel."><span>01</span><div><h3>Tell us your plans</h3><p>Tell us the destination, purpose and people travelling.</p></div></li>
      <li data-film-chapter="1" data-kicker="THE VISA PLAN" data-heading="Get a tailored checklist." data-text="We discuss the destination and the support available, then explain what to prepare before any application step."><span>02</span><div><h3>Get a tailored checklist</h3><p>Understand the scope, documents and next step.</p></div></li>
      <li data-film-chapter="2" data-kicker="YOUR DOCUMENTS" data-heading="Prepare your application documents." data-text="Use the destination’s official requirements and the agreed checklist to organise your documents."><span>03</span><div><h3>Prepare your documents</h3><p>We explain how to share any documents securely.</p></div></li>
    </ol>
  </div>
</section>
<section class="section wrap visa-process" aria-labelledby="visa-process-title">
  <h2 id="visa-process-title">What happens after <em>you enquire?</em></h2>
  <ol>
    <li><h3>Tell us about your trip</h3><p>Share your destination, reason for travel and approximate dates. Keep passport scans and bank statements out of your first enquiry.</p></li>
    <li><h3>Review your options</h3><p>We explain what help is available for your trip and confirm the cost before you decide.</p></li>
    <li><h3>Know your next step</h3><p>If you choose to go ahead, we explain what to prepare and how to share any documents securely.</p></li>
  </ol>
  <a class="text-link" href="./visa-services/">Explore visit visa services <span aria-hidden="true">→</span></a>
</section>
<section class="section wrap visa-team">
  <div class="section-title"><h2>Meet your <em>Trip Bhai team.</em></h2><a class="text-link" href="./team/">Get to know us →</a></div>'''+people()+'''</section>
<section class="wrap visa-travel">
  <div><h2>Planning flights or a stay?</h2><p>Share your route, dates and budget with our travel team.</p></div>
  <a class="text-link" href="./flights-travel/">Explore travel planning →</a>
</section>
<section class="wrap">
  <div class="cta"><div><h2>Ready to discuss <em>your visit visa?</em></h2></div>
  <a class="button" href="./contact/?service=Visit%20visa%20enquiry">Start a visa enquiry <span aria-hidden="true">↗</span></a></div>
</section>'''
page('', 'Visit visa enquiries & travel planning', 'Planning a family visit or holiday? Speak with Trip Bhai’s London-based team about visit visa support, what to prepare and your next step.', home)
page('about','Our company','About TRIP BHAI LTD, company 16286072: our travel focus, public contact details and registered office.',heading('OUR COMPANY','Meet <em>Trip Bhai.</em>','A London-based travel agency with a personal approach to visit visa enquiries and travel planning.')+'''<section class="wrap section split"><div><h2>Built around<br><em>your plans.</em></h2><p>Trip Bhai brings visit visa enquiries, air-ticket enquiries, hotel stays and personalised travel planning into one conversation. We start by understanding your destination and what help you need.</p><p>We agree the service scope and costs before work begins. Travel prices and availability are confirmed separately; visa decisions rest with the relevant authorities.</p><a class="text-link" href="../team/">Meet the people behind Trip Bhai →</a></div><div class="company-panel"><p class="eyebrow">COMPANY INFORMATION</p><dl><dt>Legal name</dt><dd>TRIP BHAI LTD</dd><dt>Company number</dt><dd>16286072</dd><dt>Company type</dt><dd>Private limited company</dd><dt>Incorporated</dt><dd>3 March 2025</dd><dt>Registered office</dt><dd>53 Blenheim Road, London, England, E6 3EG</dd><dt>Nature of business</dt><dd>Travel agency activities (SIC 79110)</dd></dl><a class="text-link" href="https://find-and-update.company-information.service.gov.uk/company/16286072">Check the public register ↗</a></div></section><section class="wrap note"><h2>Before visiting</h2><p>The registered office is our legal correspondence address. Please contact the team to arrange an appointment and confirm your meeting location before travelling.</p></section>''')
page('team','Our people','Meet ZR Saimon, Riazul Iqbal Feroz, Umme Sumaiya and Aumlanul Abrar: the Trip Bhai team.',heading('OUR PEOPLE','The names behind<br><em>your next chapter.</em>','Meet the people behind Trip Bhai, from our founder to client relations and operations.')+'<section class="wrap section">'+people()+'''<div class="note"><h2>Start with the team</h2><p>Use our shared contact details for a new enquiry. Tell us the service and destination you have in mind so your conversation can reach the right person.</p><a class="text-link" href="mailto:tripbhaiofficial@gmail.com">tripbhaiofficial@gmail.com →</a></div></section>''')
page('visa-services','Visit visa enquiries','Worldwide visit visa support from Trip Bhai, with particular experience in Schengen, Canada, Australia, New Zealand, USA and Ireland visitor visa enquiries.',heading('WORLDWIDE VISIT VISA SUPPORT','Every destination.<br><em>A clearer first step.</em>','TripBhai helps travellers understand visit visa requirements and prepare for applications worldwide. We have particular experience with Schengen, Canada, Australia, New Zealand, USA and Ireland visitor visa enquiries.')+'''<section class="wrap section split"><div><h2>Global support.<br><em>Focused experience.</em></h2><p>We can start an enquiry for almost any country and help you understand the practical next step. Our most frequently discussed visitor destinations include the Schengen Area, Canada, Australia, New Zealand, the USA and Ireland.</p><p>Our team can help with document preparation, checklist orientation, application planning and travel arrangements. The exact service depends on your nationality, destination, purpose and country of application.</p><p>We have a strong record of successful client journeys and publish selected, permissioned visa stories. Past outcomes are not a guarantee for a future application because the final decision belongs to the relevant authority.</p><p>UK immigration advice and representation are not currently offered through this public site. See our <a href="../uk-support/">UK support information</a>.</p></div><div class="company-panel"><h2>What to tell us</h2><ul><li>Your destination and the purpose of your visit</li><li>Your nationality and country of application</li><li>Approximate travel dates</li><li>The type of support you are looking for</li><li>Your name and preferred contact details</li></ul><p>Please do not send passport scans, bank statements or other sensitive documents in your initial enquiry.</p><a class="button" href="../contact/?service=Visit%20visa%20enquiry">Start a visa enquiry ↗</a><p class="visa-service-stories"><a href="../visa-successes/">Explore the Visa Stories archive →</a></p></div></section><section class="wrap section faq"><h2>A few helpful answers.</h2><details><summary>Which countries can TripBhai help with?</summary><p>We can begin enquiries for destinations worldwide. Our strongest visitor-visa focus is Schengen, Canada, Australia, New Zealand, the USA and Ireland.</p></details><details><summary>Does an enquiry submit my visa application?</summary><p>No. It starts a conversation with Trip Bhai. An application to an embassy or authority is a separate step.</p></details><details><summary>Can TripBhai guarantee an approval or a 99% success rate?</summary><p>No. We do not promise an approval rate. We can show selected successful client stories with permission, while every application is decided individually by the relevant authority.</p></details><details><summary>What does the service cost?</summary><p>We confirm the scope and quotation for your enquiry before work begins. No fee or processing time is promised on this page.</p></details></section>'''+'''<section class="wrap section visa-official-sources" aria-labelledby="official-visa-info">
<p class="eyebrow">OFFICIAL INFORMATION · CHECKED 12 NOVEMBER 2026</p>
<h2 id="official-visa-info">Check current guidance <em>at its source.</em></h2>
<p class="lead">Visa and entry requirements can change and depend on your destination and circumstances. Check the latest guidance from the authority responsible for the place you plan to visit before applying.</p>
<div class="split">
<article class="company-panel"><p class="eyebrow">EUROPEAN COMMISSION · SCHENGEN</p><h3>Applying for a Schengen visa</h3><p>A general overview. The Commission directs travellers to the embassy or consulate for their main destination for case-specific details.</p><a class="text-link" href="https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en">Read the official Schengen guidance ↗</a></article>
<article class="company-panel"><p class="eyebrow">IRISH IMMIGRATION SERVICE DELIVERY · IRELAND</p><h3>Coming to visit Ireland</h3><p>Official information and links to current Irish visit guidance.</p><a class="text-link" href="https://www.irishimmigration.ie/coming-to-visit-ireland/">Read the official Ireland guidance ↗</a></article>
</div>
<p><small>Sources checked 12 November 2026. Requirements can change; the current official guidance takes precedence.</small></p>
<a class="button" href="../contact/?service=Visit%20visa%20enquiry">Ask about a visit visa enquiry ↗</a>
</section>''')
page('flights-travel','Flights & travel planning','Personalised flight, hotel and holiday enquiries with Trip Bhai. Share your dates, preferences and budget.',heading('FLIGHTS · STAYS · TAILORED TRIPS','Make room<br><em>for the journey.</em>','A flight home, a few nights away or a trip with more moving parts. Let’s start with what you have in mind.')+'''<section class="wrap section editorial"><img src="../assets/london.jpg" alt="Westminster and the Houses of Parliament in London" width="1000" height="700" loading="lazy"><div><p class="eyebrow">A PLAN THAT STARTS WITH YOU</p><h2>Where, when<br><em>and your way.</em></h2><p>For flights, share your departure airport, destination, travel dates, passenger numbers, cabin and baggage preferences.</p><p>For a stay or holiday, tell us your budget, preferred location, length of stay and anything that matters to your travelling party.</p><a class="button" href="../contact/?service=Flights%20and%20travel">Plan my trip ↗</a></div></section><section class="wrap note"><h2>Enquiries, then confirmed options</h2><p>This website does not display live fares or take booking payments. The team confirms availability, prices, supplier terms and the next steps separately. Sending an enquiry does not reserve a flight or hotel.</p></section>''')
page('uk-support','UK support','Current availability of Trip Bhai’s planned UK orientation and application services.',heading('SERVICE AVAILABILITY','Practical support.<br><em>Clear boundaries.</em>','Our planned UK support services have a defined scope. Please check availability with the team before making arrangements.')+'''<section class="section wrap"><div class="steps"><article><span>PLANNED</span><h2>UK orientation</h2><p>One-to-one practical mentoring and administrative support are part of our service plans. Appointments are not advertised as available until confirmed by the team.</p></article><article><span>NOT CURRENTLY AVAILABLE</span><h2>UK immigration advice</h2><p>UK visa, Graduate visa (PSW), ILR advice, application selection and representation remain unavailable pending verification of the responsible adviser’s authorisation and permitted scope.</p><a href="https://www.gov.uk/find-an-immigration-adviser">Find an authorised immigration adviser ↗</a></article><article><span>PLANNED</span><h2>Wellbeing support</h2><p>Non-clinical practical support is planned. This is not therapy, clinical care or crisis support, and no appointments are currently advertised.</p></article></div></section>''')
def archive_cards(entries, category):
    return '<div class="archive-grid">'+''.join(
        f'<figure class="archive-card{" archive-photo" if category == "Travel photography" else ""}"><button class="archive-image archive-image-button" type="button" data-archive-open data-full-src="../assets/visa-archive/{asset}.webp" data-category="{escape(category, quote=True)}" data-title="{escape(label, quote=True)}" aria-label="View full image: {escape(label, quote=True)}">'
        f'<img src="../assets/visa-archive/{asset}.webp" alt="{escape(label, quote=True)} — complete page shown without cropping" loading="lazy"><span class="archive-view-hint">View full page ↗</span></button>'
        f'<figcaption><span>{category}</span><strong>{label}</strong></figcaption></figure>'
        for asset, label in entries
    )+'</div>'

gallery = '''<section id="visa-gallery" class="wrap section visa-gallery" aria-labelledby="visa-gallery-title">
  <nav class="archive-links" aria-label="Browse visa stories">
    <a href="#visa-gallery-title">Schengen visas</a>
    <a href="#uk-archive-title">UK student visas</a>
    <a href="#travel-archive-title">Travel photos</a>
  </nav>
  <div class="section-title"><h2 id="visa-gallery-title">Schengen visa archive</h2><p>These historical examples show only generic document headings. Visa authorities decide each application individually.</p></div>
  '''+archive_cards(SCHENGEN_ARCHIVE, 'Schengen visa')+'''
  <section class="archive-chapter" aria-labelledby="uk-archive-title">
    <h2 id="uk-archive-title">UK student visa archive</h2>
    <p>Historical examples. See our <a href="../uk-support/">UK support page</a> for current service availability.</p>
    '''+archive_cards(UK_ARCHIVE, 'Historical visa')+'''
  </section>
  <section class="archive-chapter" aria-labelledby="travel-archive-title">
    <h2 id="travel-archive-title">Beyond the visa</h2>
    '''+archive_cards(TRAVEL_ARCHIVE, 'Travel photography')+'''
  </section>
  <p class="visa-gallery-contact">For photo removal requests, email <a href="mailto:tripbhaiofficial@gmail.com">tripbhaiofficial@gmail.com</a>.</p>
  <a class="button" href="../contact/?service=Visit%20visa%20enquiry">Discuss your own visa enquiry ↗</a>
  <dialog class="archive-lightbox" id="archiveLightbox" aria-labelledby="archiveLightboxTitle">
    <div class="archive-lightbox-shell">
      <header class="archive-lightbox-header">
        <div><p id="archiveLightboxCategory">VISA STORY</p><h2 id="archiveLightboxTitle">Full page image</h2></div>
        <button class="archive-lightbox-close" type="button" aria-label="Close full page image">×</button>
      </header>
      <figure class="archive-lightbox-figure"><img id="archiveLightboxImage" alt=""><figcaption id="archiveLightboxStatus" aria-live="polite"></figcaption></figure>
      <nav class="archive-lightbox-controls" aria-label="Visa story images">
        <button type="button" data-archive-prev aria-label="Previous image">← <span>Previous</span></button>
        <span data-archive-position>Image viewer</span>
        <button type="button" data-archive-next aria-label="Next image"><span>Next</span> →</button>
      </nav>
    </div>
  </dialog>
</section>'''
page('visa-successes','Visa stories','Explore Trip Bhai’s archive of historical Schengen and UK student visa examples and travel photographs.',visa_stories_feature(on_home=False)+gallery)
page('contact','Contact Trip Bhai','Email or call Trip Bhai, or prepare a travel enquiry. tripbhaiofficial@gmail.com · +44 7514 718031.',heading('CONTACT TRIP BHAI','Where would you<br><em>like to go?</em>','A few details are all we need to start the conversation. Please keep passports and financial documents out of your initial message.')+'''<section class="wrap section contact-grid"><aside><p class="eyebrow">SPEAK WITH OUR TEAM</p><h2>Let’s make<br><em>a start.</em></h2><a class="contact-link" href="mailto:tripbhaiofficial@gmail.com">tripbhaiofficial@gmail.com</a><a class="contact-link" href="tel:+447514718031">+44 7514 718031</a><p lang="bn">আপনার গন্তব্য ও ভ্রমণের পরিকল্পনা আমাদের জানান।</p><hr><h3>Already a client?</h3><p>Use the existing client portal for your account.</p><a class="text-link" href="'''+PORTAL+'''/client-login">Open client portal ↗</a><h3>Visits by arrangement</h3><p>Please confirm an appointment and meeting location with the team before travelling.</p></aside><form id="enquiry"><h2>Start your enquiry</h2><p>Enter your trip details, then review and send the prepared email; nothing is submitted automatically.</p><label for="name">Your name</label><input id="name" name="name" autocomplete="name" required maxlength="100"><label for="email">Your email</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="200"><label for="service">How can we help?</label><select id="service" name="service"><option>Visit visa enquiry</option><option>Flights and travel</option><option>Hotels and holidays</option><option>General enquiry</option></select><label for="destination">Destination</label><input id="destination" name="destination" required maxlength="100" placeholder="For example, Italy"><label for="dates">Approximate travel dates (optional)</label><input id="dates" name="dates" maxlength="100" placeholder="For example, March 2027"><label for="message">Tell us a little more (optional)</label><textarea id="message" name="message" rows="4" maxlength="2000"></textarea><button class="button" type="submit">Prepare my email ↗</button><p id="email-status" role="status"></p><div id="email-preview" hidden><label for="prepared">Your prepared message</label><textarea id="prepared" rows="10" readonly></textarea><div class="actions"><a id="email-open" class="button">Open email app ↗</a><button id="copy-email" type="button" class="secondary">Copy message</button></div><p>Send to <strong>tripbhaiofficial@gmail.com</strong>. Your enquiry has not been sent yet.</p></div><noscript><p>Please email tripbhaiofficial@gmail.com or call +44 7514 718031 to start your enquiry.</p></noscript></form></section>''')
page('privacy-terms','Privacy & service terms','How Trip Bhai handles website enquiries and personal information, and the terms on which travel and visa enquiry services are offered.',heading('PRIVACY & SERVICE TERMS','Plain information.<br><em>No small print.</em>','How this website works with your information, and what you can expect when you make an enquiry with TRIP BHAI LTD.')+'''<section class="wrap section split"><div><h2>Privacy on<br><em>this website.</em></h2><p>This public website is a set of static pages. It does not set tracking cookies, run analytics scripts or save your enquiry or chat messages. The automated chat processes questions on your device, and closing or reloading the page clears the conversation.</p><p>The enquiry form on our contact page does not send anything by itself. It prepares a message on your device which you review and send from your own email app to tripbhaiofficial@gmail.com. Until you send that email, we receive nothing.</p><p>When you email or call us, we use your contact details and the travel details you share to respond to your enquiry and, if you go ahead, to provide the agreed service. We ask you not to send passport scans, bank statements or other sensitive documents in a first enquiry. Sensitive documents are only requested through the separate client portal, which has its own privacy information.</p><p>You can ask us at any time what information we hold about you, ask us to correct it or ask us to delete it, subject to any records we must keep. Email <a href="mailto:tripbhaiofficial@gmail.com">tripbhaiofficial@gmail.com</a>.</p></div><div class="company-panel"><p class="eyebrow">DATA CONTROLLER</p><dl><dt>Company</dt><dd>TRIP BHAI LTD</dd><dt>Company number</dt><dd>16286072</dd><dt>Registered office</dt><dd>53 Blenheim Road, London, England, E6 3EG</dd><dt>Contact</dt><dd><a href="mailto:tripbhaiofficial@gmail.com">tripbhaiofficial@gmail.com</a><br><a href="tel:+447514718031">+44 7514 718031</a></dd></dl><p>Client portal users should also read the portal’s own <a href="'''+PORTAL+'''/privacy">privacy information ↗</a> and <a href="'''+PORTAL+'''/terms">service terms ↗</a>.</p></div></section><section class="wrap section"><h2>Service terms<br><em>in brief.</em></h2><div class="steps"><article><span>01</span><h3>An enquiry is not a booking</h3><p>Sending us an enquiry does not reserve a flight, hotel or holiday and is not an application to any embassy, consulate or government authority. We confirm availability, prices, supplier terms and next steps separately, in writing.</p></article><article><span>02</span><h3>Scope and cost agreed first</h3><p>Before any paid work begins we confirm what the service includes, what it does not include and the fee. No fee, processing time or timescale is promised on this website.</p></article><article><span>03</span><h3>No guaranteed outcomes</h3><p>Visa decisions are made by the relevant authorities. We cannot guarantee an approval, and a past approval shown on our visa stories page is not a prediction for anyone else’s application.</p></article><article><span>04</span><h3>UK immigration advice</h3><p>UK immigration advice, choosing an application form and representation are not offered through this website. See our <a href="../uk-support/">service availability page</a>. Practical orientation support, where offered, is not legal advice, therapy or crisis support.</p></article><article><span>05</span><h3>Photographs and stories</h3><p>Client photographs are published only with the client’s permission. To withdraw a photograph or story, email us and we will remove it from the public site.</p></article><article><span>06</span><h3>Changes</h3><p>We may update this page as our services change. The version published on this website is the current one. Last reviewed: November 2026.</p></article></div></section>''')
page('chat', 'Chat with TripBhai', 'Get instant answers about visit visas, flights and hotels.', heading('INSTANT HELP', 'Chat with TripBhai', 'Type a question or choose a topic to get an automated reply.') + '<section class="wrap chat-page">' + chat_widget('../', inline=True) + '<p><a href="../contact/">Contact the TripBhai team</a> or call <a href="tel:+447514718031">+44 7514 718031</a>.</p></section>')
(OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>https://tripbhai.co.uk/'+s+'</loc></url>' for s in ['', 'about/','team/','visa-services/','flights-travel/','uk-support/','visa-successes/','contact/','chat/','privacy-terms/'])+'</urlset>')
(OUT/'.nojekyll').write_text('')
(OUT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://tripbhai.co.uk/sitemap.xml\n')
print('Built ten Trip Bhai public pages.')
