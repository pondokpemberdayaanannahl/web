export function initDonationPayment(doc = document) {
  const dialog = doc.getElementById('payment-dialog');
  if (!dialog) return;
  const programInput = doc.getElementById('donor-program');
  const panels = [...doc.querySelectorAll('[data-payment-panel]')];
  const methodButtons = [...doc.querySelectorAll('[data-payment-method]')];
  let program = '';
  const selectMethod = method => {
    if (!panels.some(panel => panel.dataset.paymentPanel === method)) return;
    panels.forEach(panel => { panel.hidden = panel.dataset.paymentPanel !== method; });
    methodButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.paymentMethod === method)));
    doc.getElementById('payment-copy-status').textContent = '';
    const donorMethod = doc.getElementById('donor-method');
    donorMethod.value = { bank: 'Transfer Bank BSI', wallet: 'GoPay', qris: 'QRIS' }[method];
    const qris = doc.getElementById('donation-qris');
    const ready = !!qris.getAttribute('src');
    qris.hidden = !ready;
    doc.getElementById('qris-unavailable').hidden = ready;
  };
  // Move the editable source panels into the dialog without duplicating IDs.
  const body = doc.getElementById('payment-panels');
  panels.forEach(panel => body.append(panel));
  const open = (method = 'bank') => {
    doc.getElementById('payment-program').textContent = program || 'Donasi umum';
    selectMethod(method);
    if (!dialog.open) dialog.showModal();
  };
  doc.querySelectorAll('[data-donate-program]').forEach(button => button.addEventListener('click', () => {
    program = button.closest('.card')?.querySelector('.card-title')?.textContent.trim() || button.dataset.donateProgram;
    if (![...programInput.options].some(option => option.value === program)) {
      const option = doc.createElement('option'); option.value = option.textContent = program;
      programInput.append(option);
    }
    programInput.value = program;
    open();
  }));
  doc.querySelectorAll('[data-open-payment]').forEach(button => button.addEventListener('click', () => { program = programInput.value; open(button.dataset.openPayment); }));
  methodButtons.forEach(button => button.addEventListener('click', () => selectMethod(button.dataset.paymentMethod)));
  doc.getElementById('payment-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  doc.getElementById('payment-confirm').addEventListener('click', () => {
    dialog.close();
    const form = doc.getElementById('donation-form');
    form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    doc.getElementById('donor-name').focus({ preventScroll: true });
  });
  doc.querySelectorAll('[data-copy-payment]').forEach(button => button.addEventListener('click', async () => {
    const value = doc.getElementById(button.dataset.copyPayment).textContent.replace(/\s/g, '');
    try { await navigator.clipboard.writeText(value); doc.getElementById('payment-copy-status').textContent = 'Nomor berhasil disalin.'; }
    catch { doc.getElementById('payment-copy-status').textContent = 'Belum dapat menyalin. Silakan salin nomor yang tertera.'; }
  }));
}
