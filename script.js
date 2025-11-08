const navToggle = document.querySelector('.nav__toggle');
const navLinks = document.querySelector('.nav__links');
const backToTop = document.querySelector('.back-to-top');

const updateBackToTop = () => {
  if (!backToTop) return;
  const shouldShow = window.scrollY > window.innerHeight * 0.6;
  backToTop.classList.toggle('is-visible', shouldShow);
};

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();
}
