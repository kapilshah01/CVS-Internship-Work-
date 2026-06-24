export const createDefaultServiceItem = (overrides = {}) => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  description: 'Visa processing service',
  quantity: 1,
  unitPrice: 0,
  ...overrides,
});

export const calculateInvoiceTotals = (serviceItems = [], taxRate = 0) => {
  const subtotal = serviceItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);

  const safeTaxRate = Number(taxRate) || 0;
  const taxAmount = subtotal * (safeTaxRate / 100);
  const total = subtotal + taxAmount;

  return {
    subtotal,
    discount: 0,
    taxRate: safeTaxRate,
    taxAmount,
    total,
  };
};

export const normalizeInvoice = (invoice) => {
  const baseItems = Array.isArray(invoice.serviceItems) && invoice.serviceItems.length > 0
    ? invoice.serviceItems.map((item, index) => createDefaultServiceItem({
        id: item.id || `legacy-${index + 1}`,
        description: item.description || `Visa Processing Service - ${invoice.country || ''} ${invoice.visaType || ''}`.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || Number(invoice.amount) || 0,
      }))
    : [
        createDefaultServiceItem({
          id: 'legacy-primary',
          description: `Visa Processing Service - ${invoice.country || ''} (${invoice.visaType || 'General'})`,
          quantity: 1,
          unitPrice: Number(invoice.amount) || 0,
        }),
      ];

  const totals = calculateInvoiceTotals(baseItems, invoice.taxRate ?? 0);

  return {
    ...invoice,
    serviceItems: baseItems,
    invoiceMode: invoice.invoiceMode || 'personal',
    passportList: Array.isArray(invoice.passportList)
      ? invoice.passportList
      : String(invoice.passport || '')
          .split(/[\n,]+/)
          .map((value) => value.trim())
          .filter(Boolean),
    travelerCount: Number(invoice.travelerCount) || 1,
    issueDate: invoice.issueDate || invoice.date,
    dueDate: invoice.dueDate || invoice.date,
    paymentTerms: invoice.paymentTerms || 'Payment due before document submission.',
    paymentMethod: invoice.paymentMethod || 'Cash / Bank Transfer',
    currency: invoice.currency || 'NPR',
    subtotal: invoice.subtotal ?? totals.subtotal,
    discount: 0,
    taxRate: invoice.taxRate ?? totals.taxRate,
    taxAmount: invoice.taxAmount ?? totals.taxAmount,
    total: invoice.total ?? totals.total,
    amount: invoice.amount ?? totals.total,
  };
};

export const formatCurrency = (amount, currency = 'NPR') => {
  const value = Number(amount) || 0;
  if (currency === 'NPR') {
    return `Rs.\u00A0${value.toLocaleString()}`;
  }
  return `${currency}\u00A0${value.toLocaleString()}`;
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const createInvoiceDocumentHtml = (invoice, company = {}) => {
  const normalized = normalizeInvoice(invoice);
  const rows = normalized.serviceItems.map((item) => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">${escapeHtml(formatCurrency(item.unitPrice, normalized.currency))}</td>
      <td class="right strong">${escapeHtml(formatCurrency(item.quantity * item.unitPrice, normalized.currency))}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(normalized.id)} - Invoice</title>
  <style>
    :root {
      --primary: #1d7df2;
      --primary-deep: #0f5fc4;
      --primary-soft: #dfefff;
      --muted: #4a5d78;
      --border: #bfdcff;
      --soft: #eef6ff;
      --text: #111111;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 10mm;
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
      color: var(--text);
    }
    .invoice {
      width: 148mm;
      margin: 0 auto;
      background: linear-gradient(180deg, #ffffff 0%, #fefeff 100%);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: none;
    }
    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 18px 20px 16px;
      background:
        radial-gradient(circle at top right, rgba(29, 125, 242, 0.24) 0%, rgba(29, 125, 242, 0) 30%),
        linear-gradient(135deg, #e7f3ff 0%, #ffffff 48%, #dcedff 100%);
      color: #111111;
      border-bottom: 2px solid rgba(29, 125, 242, 0.38);
      position: relative;
    }
    .hero::after {
      content: "";
      position: absolute;
      left: 20px;
      right: 20px;
      bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, rgba(29,125,242,0.14), rgba(29,125,242,0.72), rgba(29,125,242,0.14));
    }
    .hero h1, .hero h2, .hero p { margin: 0; }
    .hero h1 { font-size: 20px; margin-bottom: 6px; }
    .hero h2 { font-size: 18px; color: var(--primary-deep); }
    .hero p { margin-top: 4px; }
    .content { padding: 16px 18px 18px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }
    .card {
      background:
        linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(238,246,255,0.98) 100%);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 13px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.72);
    }
    .label {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--primary-deep);
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(15,95,215,0.12);
    }
    .item {
      margin: 5px 0;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th, td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      vertical-align: top;
    }
    th {
      background: linear-gradient(180deg, #edf6ff 0%, #dcebff 100%);
      text-align: left;
      color: var(--primary-deep);
    }
    .right { text-align: right; }
    .center { text-align: center; }
    .strong { font-weight: 700; }
    .summary {
      width: min(280px, 100%);
      margin-left: auto;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.55), 0 14px 32px rgba(29,125,242,0.1);
    }
    .summary-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, #ffffff 0%, #f4f9ff 100%);
      font-size: 12px;
    }
    .summary-row:last-child {
      border-bottom: 0;
      background: linear-gradient(135deg, rgba(29,125,242,0.28) 0%, rgba(29,125,242,0.14) 100%);
      color: var(--primary-deep);
      font-weight: 700;
      font-size: 14px;
    }
    .notes {
      margin-top: 16px;
      padding: 12px;
      background: linear-gradient(180deg, #ffffff 0%, #f3f9ff 100%);
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 12px;
    }
    .footer {
      margin-top: 16px;
      padding: 12px 14px;
      background: linear-gradient(135deg, rgba(29,125,242,0.08) 0%, rgba(29,125,242,0.14) 100%);
      border: 1px solid rgba(29,125,242,0.22);
      border-radius: 12px;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.6;
    }
    .footer ul {
      margin: 6px 0 0 18px;
      padding: 0;
    }
    .pickup-note {
      margin-top: 12px;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary-deep);
      padding: 12px;
      text-align: center;
      background: linear-gradient(135deg, rgba(29,125,242,0.12) 0%, rgba(29,125,242,0.2) 100%);
      border-radius: 12px;
    }
    @media print {
      @page { size: A5 portrait; margin: 8mm; }
      body { padding: 0; background: #fff; }
      .invoice { border: 0; border-radius: 0; box-shadow: none; }
    }
    @media (max-width: 720px) {
      body { padding: 12px; }
      .hero, .grid { grid-template-columns: 1fr; display: grid; }
      .content { padding: 18px; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="hero">
      <div>
        <h1>${escapeHtml(company.name || 'China Visa Service Consultancy')}</h1>
        <p>${escapeHtml(company.address || 'Kathmandu, Nepal')}</p>
        <p>${escapeHtml(company.email || '')}</p>
      </div>
      <div>
        <h2>Performa Invoice</h2>
        <p><strong>PI Number:</strong> ${escapeHtml(normalized.id)}</p>
        <p><strong>Issue Date:</strong> ${escapeHtml(normalized.issueDate || normalized.date || '')}</p>
        <p><strong>Due Date:</strong> ${escapeHtml(normalized.dueDate || normalized.date || '')}</p>
        <p><strong>Status:</strong> ${escapeHtml(normalized.status || 'pending')}</p>
      </div>
    </div>
    <div class="content">
      <div class="grid">
        <div class="card">
          <p class="label">BILL TO</p>
          <p class="item"><strong>Client:</strong> ${escapeHtml(normalized.client)}</p>
          <p class="item"><strong>Invoice Type:</strong> ${escapeHtml(normalized.invoiceMode === 'group' ? 'Group' : 'Personal')}</p>
          <p class="item"><strong>Passport / Permit Number:</strong> ${escapeHtml(normalized.passport)}</p>
          ${normalized.invoiceMode === 'group'
            ? `<p class="item"><strong>Travelers:</strong> ${escapeHtml(String(normalized.travelerCount || normalized.passportList?.length || 1))}</p>`
            : ''}
          <p class="item"><strong>Email:</strong> ${escapeHtml(normalized.email || 'N/A')}</p>
        </div>
        <div class="card">
          <p class="label">SERVICE DETAILS</p>
          <p class="item"><strong>Country:</strong> ${escapeHtml(normalized.country || '')}</p>
          <p class="item"><strong>Visa Type:</strong> ${escapeHtml(normalized.visaType || '')}</p>
          <p class="item"><strong>Payment Method:</strong> ${escapeHtml(normalized.paymentMethod || '')}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="center">Qty</th>
            <th class="right">Unit Price</th>
            <th class="right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>${escapeHtml(formatCurrency(normalized.subtotal, normalized.currency))}</span></div>
        ${Number(normalized.taxRate || 0) > 0 || Number(normalized.taxAmount || 0) > 0
          ? `<div class="summary-row"><span>Tax</span><span>${escapeHtml(formatCurrency(normalized.taxAmount, normalized.currency))}</span></div>`
          : ''}
        <div class="summary-row"><span>Grand Total</span><span>${escapeHtml(formatCurrency(normalized.total ?? normalized.amount, normalized.currency))}</span></div>
      </div>

      <div class="notes">
        <p><strong>Payment Terms:</strong> ${escapeHtml(normalized.paymentTerms || 'Payment due before document submission.')}</p>
        ${normalized.invoiceMode === 'group' && normalized.passportList?.length
          ? `<p><strong>Passport Group:</strong> ${escapeHtml(normalized.passportList.join(', '))}</p>`
          : ''}
        <p><strong>Notes:</strong> ${escapeHtml(normalized.notes || 'Please verify all client details before submission.')}</p>
      </div>

      <div class="footer">
        <strong>Disclaimer:</strong>
        <ul>
          <li>This document is a Proforma Invoice only and not a Tax Invoice (VAT Bill).</li>
          <li>It is issued solely for quotation, approval, and payment estimation purposes.</li>
          <li>This Proforma Invoice is not valid for claiming VAT input credit.</li>
          <li>A 13% Value Added Tax (VAT) is applicable on our services.</li>
          <li>The applicable VAT will be charged separately upon issuance of the Final Tax Invoice (VAT Bill).</li>
        </ul>
      </div>

      <div class="pickup-note">
        Please bring this PI to collect Passport.
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const downloadInvoiceDocument = (invoice, company = {}) => {
  const normalized = normalizeInvoice(invoice);
  const html = createInvoiceDocumentHtml(normalized, company);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${normalized.id || 'invoice'}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const createInvoiceDocumentBlob = (invoice, company = {}) => {
  const normalized = normalizeInvoice(invoice);
  const html = createInvoiceDocumentHtml(normalized, company);

  return {
    normalized,
    html,
    blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
    filename: `${normalized.id || 'invoice'}.html`,
  };
};
