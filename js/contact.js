(() => {
  const form = document.querySelector('.contact-form');
  const statusEl = document.querySelector('[data-contact-status]');

  if (!form) return;

  // 1) Deploy the Apps Script as a Web App and paste its URL here.
  //    It will look like: https://script.google.com/macros/s/<SCRIPT_ID>/exec
  let ENDPOINT = 'https://script.google.com/macros/s/AKfycbyyUlw5G9hr0ndKyBJSnkySC6Hxp-i-0ImfkPTpX8ct4hcDDmfeS33RrHVy8BmHXdbvqg/exec';
  ENDPOINT = ENDPOINT.trim();
  // Common copy/paste typo.
  if (ENDPOINT.endsWith('/execE')) ENDPOINT = ENDPOINT.slice(0, -1);

  const setStatus = (msg) => {
    if (statusEl) statusEl.textContent = msg;
  };

  form.addEventListener('submit', async (e) => {
    if (!ENDPOINT || ENDPOINT.includes('PASTE_YOUR')) {
      e.preventDefault();
      setStatus('Contact form is not configured yet (missing Google Apps Script URL).');
      return;
    }

    const fd = new FormData(form);

    // Honeypot: bots that fill hidden fields get ignored.
    if ((fd.get('company') || '').toString().trim() !== '') {
      e.preventDefault();
      setStatus('Thanks!');
      form.reset();
      return;
    }

    const name = (fd.get('name') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();

    if (!name || !email || !message) {
      e.preventDefault();
      setStatus('Please fill out name, email, and message.');
      return;
    }

    // Submit as a standard form POST to avoid CORS / payload parsing issues.
    form.action = ENDPOINT;
    form.querySelector('input[name="page"]')?.setAttribute('value', window.location.href);
    form.querySelector('input[name="userAgent"]')?.setAttribute('value', navigator.userAgent);
    form.querySelector('input[name="ts"]')?.setAttribute('value', new Date().toISOString());

    setStatus('Sending...');

    // We can't reliably read the response (cross-origin), so we optimistically confirm.
    window.setTimeout(() => {
      setStatus('Message sent. Thanks!');
      form.reset();
    }, 500);
  });
})();
