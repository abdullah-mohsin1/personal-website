(() => {
  const form = document.querySelector('.contact-form');
  const statusEl = document.querySelector('[data-contact-status]');

  if (!form) return;

  // Google Apps Script Web App URL (ends with /exec)
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWAw-bst2_zrMCyb2puA7zoC0stvS_04mcKqIHQsimZA7xBiszUpJJqGQIYZozF5hxeA/exec';

  const setStatus = (msg) => {
    if (statusEl) statusEl.textContent = msg;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!SCRIPT_URL || SCRIPT_URL.includes('PASTE_')) {
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
      setStatus('Please fill out name, email, and message.');
      return;
    }

    setStatus('Sending...');

    const payload = {
      name,
      email,
      message,
      page: window.location.href,
      userAgent: navigator.userAgent,
      ts: new Date().toISOString(),
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (data && data.ok === false) {
        setStatus('Could not send message. Please try again.');
        return;
      }

      setStatus('Message sent. Thanks!');
      form.reset();
    } catch (_) {
      try {
        // Fallback: form-encoded POST works great with Apps Script + no-cors (shows up as e.parameter).
        const params = new URLSearchParams();
        params.append('name', name);
        params.append('email', email);
        params.append('message', message);
        params.append('page', window.location.href);
        params.append('userAgent', navigator.userAgent);
        params.append('ts', new Date().toISOString());

        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: params.toString(),
        });

        setStatus('Message sent. Thanks!');
        form.reset();
      } catch (_) {
        setStatus('Could not send message. Please try again.');
      }
    }
  });
})();
