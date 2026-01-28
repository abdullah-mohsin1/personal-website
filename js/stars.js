(() => {
  const layers = [
    { id: 'stars', count: 700, size: 1, duration: 50 },
    { id: 'stars2', count: 200, size: 2, duration: 100 },
    { id: 'stars3', count: 100, size: 3, duration: 150 },
  ];

  const random = (max) => Math.floor(Math.random() * max);
  const buildShadows = (count) => {
    const parts = [];
    for (let i = 0; i < count; i += 1) {
      parts.push(`${random(2000)}px ${random(2000)}px #fff`);
    }
    return parts.join(', ');
  };

  layers.forEach(({ id, count, size, duration }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.boxShadow = buildShadows(count);
    el.style.setProperty('--star-duration', `${duration}s`);
  });
})();
