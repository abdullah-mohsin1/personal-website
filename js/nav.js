const navToggle = document.querySelector('[data-nav-toggle]');
const hud = document.querySelector('[data-hud]');

if (navToggle && hud) {
  navToggle.addEventListener('click', () => {
    const isOpen = hud.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}
