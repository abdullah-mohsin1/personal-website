(() => {
  const cards = Array.from(document.querySelectorAll('.exp-card'));
  if (!cards.length) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const update = () => {
    const trigger = 420; // px from top where shrink starts (lower = later)
    const range = 260; // px over which it shrinks
    const listRect = cards[0]?.parentElement?.getBoundingClientRect();
    const listTopDoc = (listRect?.top ?? 0) + window.scrollY;
    const startStackAt = listTopDoc + 80;
    const header = document.querySelector('.hud');
    const headerBottom = header ? header.getBoundingClientRect().bottom + 24 : 120;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const active = window.scrollY >= startStackAt;
      const t = active ? clamp((trigger - rect.top) / range, 0, 1) : 0;
      const scale = 1 - t * 0.08;
      const desiredLift = t * 28;
      const maxLift = Math.max(0, rect.top - headerBottom);
      const lift = Math.min(desiredLift, maxLift);

      card.style.transform = `translateY(${-lift}px) scale(${scale})`;
      card.style.zIndex = String(100 - index);
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
})();
