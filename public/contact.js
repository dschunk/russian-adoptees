const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const topic = String(formData.get('topic') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !email || !topic || !subject || !message) {
      if (formStatus) formStatus.textContent = 'Please complete all required fields.';
      return;
    }

    const body = [
      'Russian Adoptees Organization — Website Inquiry',
      '',
      `Name: ${name}`,
      `Reply email: ${email}`,
      `Inquiry type: ${topic}`,
      '',
      'Message:',
      message,
      '',
      '---',
      'Prepared through russianadoptees.com/contact.html'
    ].join('\n');

    const mailto = new URL('mailto:contact@russianadoptees.com');
    mailto.searchParams.set('subject', `[RAO Website] ${topic}: ${subject}`);
    mailto.searchParams.set('body', body);

    if (formStatus) {
      formStatus.textContent = 'Opening your email application with the inquiry prepared for contact@russianadoptees.com. Review it, then send.';
    }

    window.location.href = mailto.toString();
  });
}
