(() => {
  const cards = document.querySelectorAll('[data-flip]');
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-flip-toggle]');
      if (!toggle) return;
      event.preventDefault();
      card.classList.toggle('is-flipped');
      const isFlipped = card.classList.contains('is-flipped');
      toggle.setAttribute('aria-pressed', String(isFlipped));
    });
  });
})();
