const roles = [
  'Software Engineer',
  'Full-Stack Engineer',
  'Data Engineer',
  'ML Engineer',
];

const typingTarget = document.querySelector('[data-typing]');
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeLoop() {
  if (!typingTarget) return;

  const current = roles[roleIndex];
  const visible = current.slice(0, charIndex);
  typingTarget.textContent = visible;

  if (!isDeleting && charIndex < current.length) {
    charIndex += 1;
    setTimeout(typeLoop, 90);
    return;
  }

  if (isDeleting && charIndex > 0) {
    charIndex -= 1;
    setTimeout(typeLoop, 50);
    return;
  }

  if (!isDeleting) {
    isDeleting = true;
    setTimeout(typeLoop, 900);
    return;
  }

  isDeleting = false;
  roleIndex = (roleIndex + 1) % roles.length;
  setTimeout(typeLoop, 300);
}

typeLoop();
