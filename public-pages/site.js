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

function chatAnswer(question) {
  const text = question.toLowerCase();
  if (/\b(contact|human|phone|email|whatsapp|call|agent|team)\b/.test(text)) {
    return 'You can email tripbhaiofficial@gmail.com or call +44 7514 718031. Use the contact link below to prepare an enquiry.';
  }
  if (/\b(?:uk|british|graduate)\s+(?:(?:student|visit|work|visitor|spouse)\s+)?(?:visa|immigration|settlement)\b|\b(?:visa|immigration)\b.*\b(?:to|for)\s+(?:the\s+)?uk\b|\b(?:ilr|psw)\b/.test(text)) {
    return 'TripBhai does not currently offer UK immigration advice. For a question about travelling from the UK to another country, tell our team your destination.';
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
  return 'I can help with common questions about visas, flights and hotels. For anything else, use the contact link below and our team can pick it up.';
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

  function reply(question) {
    const message = question.trim();
    if (!message) return;
    const visitor = document.createElement('p');
    visitor.className = 'chat-visitor';
    visitor.textContent = message;
    const answer = document.createElement('p');
    answer.textContent = chatAnswer(message);
    log.append(visitor, answer);
    log.scrollTop = log.scrollHeight;
    input.value = '';
    input.focus();
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
