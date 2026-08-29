const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const submitButton = contactForm?.querySelector('button[type="submit"]');
const startedAt = Date.now();

const setStatus = (message, state = '') => {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.state = state;
};

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      topic: String(formData.get('topic') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      privacy: formData.get('privacy') === 'on',
      website: String(formData.get('website') || '').trim(),
      startedAt
    };

    if (payload.message.length < 20) {
      setStatus('Please include a little more detail so we can understand your inquiry.', 'error');
      return;
    }

    const originalButtonText = submitButton?.textContent || 'Submit Inquiry';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
      submitButton.setAttribute('aria-busy', 'true');
    }
    setStatus('Sending your inquiry securely…', 'sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || 'We could not send your inquiry right now.');
      }

      contactForm.reset();
      setStatus('Your inquiry has been received. Thank you for contacting the Russian Adoptees Organization.', 'success');

      if (submitButton) {
        submitButton.textContent = 'Inquiry Sent';
        window.setTimeout(() => {
          submitButton.textContent = originalButtonText;
        }, 2500);
      }
    } catch (error) {
      setStatus(`${error.message} You can also email contact@russianadoptees.com directly.`, 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    }
  });
}
