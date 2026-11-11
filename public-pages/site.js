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
