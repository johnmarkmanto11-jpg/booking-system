(() => {
  const form = document.getElementById('bookingForm');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const ymd = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = new Date(s + 'T00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const today = ymd(new Date());

  // Smooth scroll to the booking section + preselect room from room cards
  document.querySelectorAll('[data-book]').forEach(a => a.addEventListener('click', e => {
    const target = document.getElementById('booking');
    if (!target) return;
    e.preventDefault();
    if (a.dataset.room) $('room').value = a.dataset.room;
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    setTimeout(() => $('name').focus({ preventScroll: true }), 600);
  }));

  // Date logic: no past check-in, checkout at least 1 day after check-in
  $('checkin').min = today;
  $('checkout').min = addDays(today, 1);
  $('checkin').addEventListener('change', () => {
    const ci = $('checkin').value;
    if (!ci) return;
    const minOut = addDays(ci, 1);
    $('checkout').min = minOut;
    if (!$('checkout').value || $('checkout').value < minOut) $('checkout').value = minOut;
    clear('checkin'); clear('checkout');
  });

  const rules = {
    name: v => (!v.trim() && 'Full Name is required.') || (v.trim().length < 2 && 'Enter your full name.'),
    email: v => (!v.trim() && 'Email Address is required.') || (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && 'Enter a valid email, like you@example.com.'),
    phone: v => (!v.trim() && 'Phone Number is required.') || (!/^\+?[\d\s()-]{7,18}$/.test(v.trim()) && 'Enter a valid phone number.'),
    checkin: v => (!v && 'Check-In Date is required.') || (v < today && 'Check-in cannot be in the past.'),
    checkout: v => (!v && 'Check-Out Date is required.') || (v <= $('checkin').value && 'Check-out must be after check-in.'),
    room: v => !v && 'Room Type is required.'
  };
  const show = (id, msg) => { $(id).setAttribute('aria-invalid', !!msg); $('e-' + id).textContent = msg || ''; };
  const clear = id => show(id, '');
  const check = id => { const m = rules[id]($(id).value); show(id, m); return !m; };

  Object.keys(rules).forEach(id => {
    $(id).addEventListener('blur', () => check(id));
    $(id).addEventListener('input', () => $(id).getAttribute('aria-invalid') === 'true' && check(id));
  });

  const done = $('done');
  $('closeDone').addEventListener('click', () => done.close());

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const results = Object.keys(rules).map(check);
    if (results.includes(false)) { document.querySelector('[aria-invalid=true]').focus(); return; }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Sending...';
    try {
      // Asynchronous submit (no page refresh). Point the form action to your real backend.
      const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      if (!res.ok) throw new Error('Server error');
    } catch (err) {
      // No backend yet (static demo): continue to the success state.
      console.info('Demo mode: booking not sent to a server.', err.message);
    }
    $('doneMsg').textContent = `Thank you, ${$('name').value.trim()}. We received your request for the ${$('room').value} (${$('checkin').value} to ${$('checkout').value}) and will email ${$('email').value.trim()} shortly.`;
    done.showModal();
    form.reset();
    $('checkout').min = addDays(today, 1);
    btn.disabled = false; btn.textContent = 'Check Availability';
  });
})();
