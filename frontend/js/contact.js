// ============================================
// CONTACT PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  setupContactForm();
  setupCharCounter();
});

// ===== CONTACT FORM SUBMIT =====
function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('submitContactBtn');
    const errorDiv = document.getElementById('formError');
    const successDiv = document.getElementById('formSuccess');

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value.trim();

    // Clear previous messages
    errorDiv.classList.remove('show');
    successDiv.style.display = 'none';

    // Validate
    if (!name || !email || !subject || !message) {
      errorDiv.textContent = 'Please fill in all required fields.';
      errorDiv.classList.add('show');
      return;
    }

    if (message.length < 10) {
      errorDiv.textContent = 'Message must be at least 10 characters.';
      errorDiv.classList.add('show');
      return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;

    try {
      const response = await API.post('/contact', {
        name,
        email,
        subject,
        message
      });

      // Show success
      form.style.display = 'none';
      successDiv.style.display = 'block';
      showToast(response.message, 'success');

    } catch (error) {
      errorDiv.textContent = error.message || 'Failed to send message. Please try again.';
      errorDiv.classList.add('show');
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
      btn.disabled = false;
    }
  });
}

// ===== CHARACTER COUNTER =====
function setupCharCounter() {
  const textarea = document.getElementById('contactMessage');
  const counter = document.getElementById('charCount');

  if (!textarea || !counter) return;

  textarea.addEventListener('input', () => {
    const count = textarea.value.length;
    counter.textContent = count;
    if (count > 900) {
      counter.style.color = '#e94560';
    } else if (count > 700) {
      counter.style.color = '#f5a623';
    } else {
      counter.style.color = '';
    }
  });
}

// ===== FAQ TOGGLE =====
function toggleFaq(button) {
  const answer = button.nextElementSibling;
  const isOpen = button.classList.contains('active');

  // Close all others
  document.querySelectorAll('.faq-question.active').forEach(q => {
    q.classList.remove('active');
    q.nextElementSibling.classList.remove('open');
  });

  // Open current if it was closed
  if (!isOpen) {
    button.classList.add('active');
    answer.classList.add('open');
  }
}