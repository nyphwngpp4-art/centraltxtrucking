// Central Texas Truck & Trailer Repair - concept site behavior.
// No dependencies. Everything degrades: the form posts without JavaScript,
// while progressive disclosure only shortens the enhanced experience.

// ===== shop vs. mobile service details ====================================
const serviceType = document.getElementById('f-service-type');
const roadsideFields = document.getElementById('roadside-fields');

function syncServiceFields() {
  if (!serviceType || !roadsideFields) return;
  roadsideFields.hidden = serviceType.value !== 'mobile';
}

if (serviceType && roadsideFields) {
  serviceType.addEventListener('change', syncServiceFields);
  syncServiceFields();
}

// ===== browser geolocation (optional, user-initiated only) =====
const geoBtn = document.getElementById('geo-btn');
const geoField = document.getElementById('f-gps');
const geoStatus = document.getElementById('geo-status');

if (geoBtn && geoField) {
  if (!('geolocation' in navigator)) {
    geoBtn.hidden = true;
  } else {
    geoBtn.addEventListener('click', () => {
      geoStatus.textContent = 'Getting location...';
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude, accuracy } = pos.coords;
          geoField.value =
            latitude.toFixed(5) + ', ' + longitude.toFixed(5) +
            ' (±' + Math.round(accuracy) + ' m)';
          geoStatus.textContent = 'Location attached. Clear the field to remove it.';
          geoField.readOnly = false;
        },
        () => {
          geoStatus.textContent = 'Could not get a location. Type where the unit sits instead.';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }
}

// ===== repair request form -> /api/breakdown =====
document.querySelectorAll('.form-wrap form').forEach(form => {
  const wrap = form.closest('.form-wrap');
  const btn = form.querySelector('button[type="submit"]');

  function markInvalid(el, invalid) {
    const field = el.closest('.field');
    if (field) field.classList.toggle('field--error', invalid);
    el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  function validate() {
    let firstBad = null;
    form.querySelectorAll('[required]').forEach(el => {
      const bad = el.name === 'phone'
        ? (el.value.replace(/\D/g, '').length < 7)
        : !el.checkValidity();
      markInvalid(el, bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    wrap.classList.remove('is-error');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      const res = await fetch(form.getAttribute('action') || '/api/breakdown', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: new FormData(form)
      });
      if (!res.ok) throw new Error('send failed');
      wrap.classList.add('is-sent');
      wrap.querySelector('.form-success').setAttribute('tabindex', '-1');
      wrap.querySelector('.form-success').focus();
    } catch {
      // Never dead-end a stranded driver: surface the phone number instead.
      wrap.classList.add('is-error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send repair request';
    }
  });
});
