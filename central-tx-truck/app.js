// ===== build flags =====
// Gallery ships hidden until real shop photos are pulled from Facebook.
// Flip to true (and the section un-hides itself) once assets are in place.
const SHOW_GALLERY = false;
if (SHOW_GALLERY) {
  document.querySelectorAll('[data-flag="gallery"]').forEach(el => el.removeAttribute('hidden'));
}

// ===== breakdown form → /api/breakdown =====
document.querySelectorAll('.form-wrap form').forEach(f => {
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const wrap = f.closest('.form-wrap');
    const btn = f.querySelector('button[type="submit"]');
    wrap.classList.remove('is-error');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch(f.getAttribute('action') || '/api/breakdown', {
        method: 'POST',
        headers: { 'accept': 'application/json' },
        body: new FormData(f)
      });
      if (!res.ok) throw new Error('send failed');
      wrap.classList.add('is-sent');
    } catch {
      // Never dead-end the demo: surface the phone number instead.
      wrap.classList.add('is-error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send breakdown report';
    }
  });
});

// (No-JS submissions never reach here — the function redirects them to
// /thanks.html or /call-us.html.)

// ===== smooth scroll for in-page CTAs =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
