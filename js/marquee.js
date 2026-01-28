(() => {
  const marquee = document.querySelector('.tech-marquee');
  if (!marquee) return;

  const tracks = marquee.querySelectorAll('.tech-track');
  if (tracks.length < 2) return;

  let last = performance.now();
  let offset = 0;
  let speed = 0.06; // px per ms (default)
  const slowSpeed = 0.02;

  const updateWidth = () => tracks[0].getBoundingClientRect().width;
  let trackWidth = updateWidth();

  const onResize = () => {
    trackWidth = updateWidth();
  };

  const onEnter = () => {
    speed = slowSpeed;
  };

  const onLeave = () => {
    speed = 0.06;
  };

  marquee.addEventListener('pointerenter', onEnter);
  marquee.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', onResize);

  const loop = (now) => {
    const dt = now - last;
    last = now;
    offset -= speed * dt;
    if (Math.abs(offset) >= trackWidth) {
      offset += trackWidth;
    }
    marquee.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
