const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (formStatus) {
      formStatus.textContent = 'Official RAO email delivery is being configured. For now, please use the Russian Adoptees Facebook community to reach the organization.';
    }
  });
}
