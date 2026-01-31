(() => {
  const items = document.querySelectorAll('.timeline-item.reveal, .exp-card.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Delay one frame so the initial hidden state paints before we reveal.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        });
      });
    },
    { threshold: 0.2 }
  );

  items.forEach((item) => observer.observe(item));
})();
