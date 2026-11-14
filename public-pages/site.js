const menu = document.querySelector('#menu');
const navigation = document.querySelector('#navigation');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    menu.focus();
  }
});
const form = document.querySelector('#enquiry');
if (form) {
  const service = new URLSearchParams(location.search).get('service');
  const select = form.elements.namedItem('service');
  if ([...select.options].some(option => option.value === service)) select.value = service;
  ['Visa documents and checklist','Hotels and accommodation','Airport assistance','Solo traveller guide','Full trip planning'].forEach(label => {
    if (![...select.options].some(option => option.value === label)) select.add(new Option(label, label));
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const message = `Hello Trip Bhai,\n\nI would like to enquire about ${data.get('service')}.\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nDestination: ${data.get('destination')}\nTravel dates: ${data.get('dates') || 'To be confirmed'}\n\n${data.get('message') || ''}\n\nPlease let me know the next steps.\nThank you.`;
    document.querySelector('#prepared').value = message;
    document.querySelector('#email-open').href = `mailto:tripbhaiofficial@gmail.com?subject=${encodeURIComponent('Trip Bhai — '+data.get('service'))}&body=${encodeURIComponent(message)}`;
    document.querySelector('#email-preview').hidden = false;
    document.querySelector('#email-status').textContent = 'Your email is ready to review. Open your email app or copy the message to send it.';
    document.querySelector('#prepared').focus();
  });
  document.querySelector('#copy-email').addEventListener('click', async () => {
    const prepared = document.querySelector('#prepared');
    try {
      await navigator.clipboard.writeText(prepared.value);
      document.querySelector('#email-status').textContent = 'Message copied. Paste it into an email to tripbhaiofficial@gmail.com and send when ready.';
    } catch {
      prepared.focus(); prepared.select();
      document.querySelector('#email-status').textContent = 'Select and copy the prepared message, then paste it into your email app.';
    }
  });
}

// Make the fastest human contact route visible without replacing the email workflow.
if (!document.querySelector('.floating-whatsapp')) {
  const whatsapp = document.createElement('a');
  whatsapp.className = 'floating-whatsapp';
  whatsapp.href = 'https://wa.me/447514718031?text=Hello%20Trip%20Bhai%2C%20I%20would%20like%20help%20with%20my%20trip.';
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener';
  whatsapp.textContent = 'WhatsApp TripBhai';
  whatsapp.setAttribute('aria-label', 'Message TripBhai on WhatsApp');
  document.body.append(whatsapp);
}

const firstVisaEnquiry = 'First enquiry: send TripBhai your destination, visa type or reason for travel, nationality, country you are applying from, approximate dates, and contact details. Keep documents out of the chat and first message. If we need copies later, the team will confirm a secure way to share them.';

const visaPreparation = [
  'Common documents to prepare, depending on your case:',
  '• Current passport, and previous visas or refusal letters if requested.',
  '• Proof of lawful residence if applying from a country where you are not a citizen.',
  '• Employment, study or business evidence, and financial or sponsor evidence.',
  '• Planned itinerary, accommodation or host invitation, and travel insurance if required.',
  '• For children, birth certificate and parental consent or custody evidence if requested.',
  'The exact checklist depends on your destination, nationality, country of application and visa type. Follow the relevant visa authority’s official checklist for document formats, translations and originals.'
].join('\n');

const countryGuidance = {
  france: 'France: prepare the current France-Visas checklist for your visa type and apply through the official provider listed for your country of application.',
  italy: 'Italy: check the Italian consulate or official visa provider for your place of lawful residence; requirements vary by purpose and nationality.',
  spain: 'Spain: use the Spanish consulate or official visa provider checklist for your place of application, including appointment and translation rules.',
  germany: 'Germany: use the German mission or official provider checklist for your place of application and intended main destination.',
  greece: 'Greece: check the Greek mission or official provider for the current Schengen checklist and appointment process.',
  portugal: 'Portugal: check the Portuguese mission or official provider for the current checklist and application route.',
  switzerland: 'Switzerland: use the Swiss mission or official provider checklist for your place of application.',
  netherlands: 'Netherlands: check the Dutch mission or official provider checklist and appointment requirements.',
  ireland: 'Ireland: use the Irish Immigration Service Delivery checklist for your reason for travel and country of application.',
  australia: 'Australia: check the Department of Home Affairs visitor visa requirements and apply through the official online route where applicable.',
  canada: 'Canada: check the official IRCC visitor visa checklist for your nationality and country of application.',
  'united states': 'United States: check the official U.S. visitor visa guidance and embassy instructions for your place of application.'
};

function chatAnswer(question) {
  const text = question.toLowerCase();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how are you|how do you do)\b/.test(text)) {
    return 'Hello! Welcome to TripBhai 👋\n\nI’m here to help with visit visa enquiries, document preparation, flights, accommodation and travel planning.\n\nWhat would you like help with today?';
  }
  if (/\b(who are you|what can you do|how can you help|help me)\b/.test(text)) {
    return 'I’m TripBhai’s AI travel assistant. I can help you understand:\n\n• visit visa preparation and common documents\n• Schengen, Canada, Australia, USA and Ireland enquiries\n• flights, hotels and accommodation\n• solo-travel and tour-guide support\n• how to contact our human team\n\nTell me your destination and what you are planning.';
  }
  if (/\b(?:uk|british|graduate)\s+(?:(?:student|visit|work|visitor|spouse)\s+)?(?:visa|immigration|settlement)\b|\b(?:visa|immigration)\b.*\b(?:to|for)\s+(?:the\s+)?uk\b|\b(?:ilr|psw)\b/.test(text)) {
    return 'TripBhai does not currently provide UK immigration advice or representation. For travel from the UK to another country, tell me your destination, reason for travel and approximate dates, and I’ll explain the next enquiry step.';
  }
  if (/\b(document\w*|paperwork|checklist|bank statement\w*|payslip\w*|proof of funds|passport\w*|what (?:do|should) i (?:send|prepare)|what (?:to|can i) (?:send|upload))\b/.test(text) && !/\b(flight only|hotel only)\b/.test(text)) {
    let route = '';
    const destination = Object.keys(countryGuidance).find((country) => text.includes(country));
    if (destination) route = countryGuidance[destination];
    else if (/\bschengen\b/.test(text)) route = 'For Schengen, check the destination consulate’s checklist for the country where you apply and the country that is your main destination.';
    return ['Here’s a useful starting point for your visa enquiry:', firstVisaEnquiry, visaPreparation, route, 'If you tell me your nationality, country of application and destination, I can make the guidance more relevant.'].filter(Boolean).join('\n\n');
  }
  if (/\b(alone|solo|tour guide|guide|companion|escort|meet me|pick me up)\b/.test(text)) {
    return 'Travelling alone? Tell us your destination, dates and the kind of support you need. We can check whether an optional local guide or arranged companion service is available for your route. Availability, safety arrangements and cost must be confirmed before booking.';
  }
  if (/\b(online|offline|meeting|appointment|visit office|face to face|in person)\b/.test(text)) {
    return 'We can usually start by chat, email or phone. In-person meetings are by prior arrangement only; contact the team first to confirm availability and location.';
  }
  if (/\b(contact|human|phone|email|whatsapp|call|agent|team)\b/.test(text)) {
    return 'You can email tripbhaiofficial@gmail.com or call +44 7514 718031. Use the contact link below to prepare an enquiry, and a TripBhai team member can follow up with you.';
  }
  if (/\b(guarantee\w*|approved|approval\w*|success\w*|refus\w*|reject\w*)\b/.test(text)) {
    return 'Visa authorities decide each application. TripBhai cannot guarantee approval. For questions about your circumstances, contact the team below.';
  }
  if (/\b(how (much|long)|cost\w*|price\w*|fee\w*|quote\w*|processing|timeline)\b/.test(text)) {
    return 'Costs and times vary by service and destination. Send the team your destination, approximate dates and what help you need so they can confirm what is available.';
  }
  if (/\b(visa\w*|schengen|ireland|document\w*|passport\w*)\b/.test(text)) {
    return 'For a visit visa enquiry, share your destination, reason for travel and approximate dates through the contact page. The team will confirm what help is available for your trip.';
  }
  if (/\b(flight\w*|airline\w*|ticket\w*|airport\w*|baggage)\b/.test(text)) {
    return 'For flight enquiries, share your departure airport, destination, dates and passenger count. The team can confirm available options and prices.';
  }
  if (/\b(hotel\w*|holiday\w*|accommodation|stay|package\w*)\b/.test(text)) {
    return 'For hotels or holidays, tell the team your destination, dates, number of travellers and budget. They can help you explore available options.';
  }
  return 'I can help with visit visas, travel documents, flights, accommodation and tour support. Tell me your destination and what you need help with, or use the contact link below to speak with the TripBhai team.';
}

const chat = document.querySelector('#site-chat');
if (chat) {
  const toggle = chat.querySelector('.chat-toggle');
  const panel = chat.querySelector('#chat-panel');
  const log = chat.querySelector('.chat-messages');
  const questionForm = chat.querySelector('.chat-form');
  const input = chat.querySelector('#chat-question');

  function showChat(open) {
    panel.hidden = !open;
    toggle?.setAttribute('aria-expanded', String(open));
    (open ? input : toggle).focus();
  }

  const CHAT_API = 'https://dawn-wave-aa6e.forhadhossain00093.workers.dev';
  const history = [];
  let pending = false;

  async function reply(question) {
    const message = question.trim();
    if (!message || pending) return;
    const visitor = document.createElement('p');
    visitor.className = 'chat-visitor';
    visitor.textContent = message;
    const answer = document.createElement('p');
    answer.className = 'chat-waiting';
    answer.textContent = '…';
    log.append(visitor, answer);
    log.scrollTop = log.scrollHeight;
    input.value = '';
    input.focus();
    history.push({ role: 'user', text: message });
    pending = true;
    let text = '';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10) }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) text = (await res.json()).reply || '';
    } catch {}
    pending = false;
    if (!text) text = chatAnswer(message);
    history.push({ role: 'model', text });
    answer.classList.remove('chat-waiting');
    answer.textContent = text;
    log.scrollTop = log.scrollHeight;
  }

  toggle?.addEventListener('click', () => showChat(panel.hidden));
  chat.querySelector('.chat-close')?.addEventListener('click', () => showChat(false));
  chat.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle && !panel.hidden) {
      event.stopPropagation();
      showChat(false);
    }
  });
  chat.querySelectorAll('.chat-topics button').forEach(button => {
    button.addEventListener('click', () => reply(button.textContent));
  });
  questionForm.addEventListener('submit', event => {
    event.preventDefault();
    reply(input.value);
  });
  if (!toggle) panel.hidden = false;
  chat.hidden = false;
}


/* Cinematic motion: progressive enhancement only */
(() => {
  const targets = document.querySelectorAll(
    '.visa-stories-copy, .visa-stories-scene, .visa-trust a, .visa-process li, .person, .visa-travel, .cta, .page-head > *, .split > *, .contact-grid > *, .faq > *'
  );
  targets.forEach((element) => element.classList.add('cinematic-reveal'));

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((element) => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    targets.forEach((element, index) => {
      element.style.transitionDelay = Math.min(index % 4, 3) * 70 + 'ms';
      observer.observe(element);
    });
  }

  const heroImage = document.querySelector('.hero-image img');
  if (heroImage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY * 0.055, 34);
      heroImage.style.transform = 'translate3d(0,' + y + 'px,0) scale(1.035)';
    }, { passive: true });
  }
})();

/* Gentle pointer-controlled depth for the hero scene; touch and reduced-motion stay still. */
(() => {
  const scene = document.querySelector('[data-tilt-scene]');
  if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const layers = [...scene.querySelectorAll('[data-tilt-layer]')];
  let frame = 0;
  scene.addEventListener('pointermove', (event) => {
    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      layers.forEach((layer) => {
        const amount = Number(layer.dataset.tiltLayer || 12);
        layer.style.transform = `rotate(${layer.classList.contains('scene-passport') ? -12 : 14}deg) translate3d(${x * amount}px, ${y * amount}px, ${amount * 3}px)`;
      });
    });
  });
  scene.addEventListener('pointerleave', () => {
    layers.forEach((layer) => {
      layer.style.transform = layer.classList.contains('scene-passport') ? 'rotate(-12deg) translateZ(72px)' : 'rotate(14deg) translateZ(90px)';
    });
  });
})();


/* Trip Bhai journey film */
(() => {
  const chapters = [...document.querySelectorAll('[data-film-chapter]')];
  if (!chapters.length) return;
  const images = [...document.querySelectorAll('[data-film-image]')];
  const planSheets = [...document.querySelectorAll('.visa-plan-sheet')];
  const controls = [...document.querySelectorAll('[data-film-control]')];
  const current = document.querySelector('#journey-film-current');
  const kicker = document.querySelector('#journey-film-kicker');
  const heading = document.querySelector('#journey-film-heading');
  const text = document.querySelector('#journey-film-text');
  const progress = document.querySelector('.journey-film-meter');
  const meter = progress?.querySelector('span');
  let active = -1;

  const showChapter = (index) => {
    index = Math.max(0, Math.min(index, chapters.length - 1));
    if (index === active) return;
    active = index;
    const chapter = chapters[index];
    chapters.forEach((item, i) => item.classList.toggle('is-active', i === index));
    images.forEach((item, i) => item.classList.toggle('is-active', i === index));
    planSheets.forEach((item, i) => item.classList.toggle('is-assembled', i <= index));
    controls.forEach((item, i) => {
      item.classList.toggle('is-active', i === index);
      item.setAttribute('aria-pressed', String(i === index));
    });
    if (current) current.textContent = String(index + 1).padStart(2, '0');
    if (kicker) kicker.textContent = chapter.dataset.kicker || '';
    if (heading) heading.textContent = chapter.dataset.heading || '';
    if (text) text.textContent = chapter.dataset.text || '';
    if (meter) meter.style.width = ((index + 1) / chapters.length * 100) + '%';
    if (progress) {
      progress.setAttribute('aria-valuenow', String(index + 1));
      progress.setAttribute('aria-valuetext', 'Chapter ' + (index + 1) + ' of ' + chapters.length);
    }
  };

  showChapter(0);
  controls.forEach((button, index) => button.addEventListener('click', () => {
    chapters[index].scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    showChapter(index);
  }));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) showChapter(chapters.indexOf(visible[0].target));
    }, { threshold: [0.3, 0.55, 0.75], rootMargin: '-18% 0px -18% 0px' });
    chapters.forEach(chapter => observer.observe(chapter));
  }
})();


/* Accessible full-page viewer for the supplied Visa Stories archive */
(() => {
  const openers = [...document.querySelectorAll('[data-archive-open]')];
  const dialog = document.querySelector('#archiveLightbox');
  if (!openers.length || !dialog) return;

  const image = dialog.querySelector('#archiveLightboxImage');
  const title = dialog.querySelector('#archiveLightboxTitle');
  const category = dialog.querySelector('#archiveLightboxCategory');
  const status = dialog.querySelector('#archiveLightboxStatus');
  const position = dialog.querySelector('[data-archive-position]');
  const previous = dialog.querySelector('[data-archive-prev]');
  const next = dialog.querySelector('[data-archive-next]');
  const close = dialog.querySelector('.archive-lightbox-close');
  let activeIndex = 0;
  let returnFocus = null;

  const render = (index) => {
    activeIndex = (index + openers.length) % openers.length;
    const source = openers[activeIndex];
    image.src = source.dataset.fullSrc;
    image.alt = source.querySelector('img')?.alt || source.dataset.title || 'Visa story image';
    title.textContent = source.dataset.title || 'Visa story';
    category.textContent = source.dataset.category || 'VISA STORY';
    status.textContent = 'Complete image shown as supplied; no part of the page is cropped.';
    position.textContent = 'Image ' + (activeIndex + 1) + ' of ' + openers.length;
    previous.disabled = activeIndex === 0;
    next.disabled = activeIndex === openers.length - 1;
  };

  openers.forEach((button, index) => button.addEventListener('click', () => {
    returnFocus = button;
    render(index);
    dialog.showModal();
    close.focus();
  }));

  previous.addEventListener('click', () => {
    if (activeIndex > 0) render(activeIndex - 1);
  });
  next.addEventListener('click', () => {
    if (activeIndex < openers.length - 1) render(activeIndex + 1);
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => returnFocus?.focus());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && activeIndex > 0) {
      event.preventDefault();
      render(activeIndex - 1);
    } else if (event.key === 'ArrowRight' && activeIndex < openers.length - 1) {
      event.preventDefault();
      render(activeIndex + 1);
    }
  });
})();
