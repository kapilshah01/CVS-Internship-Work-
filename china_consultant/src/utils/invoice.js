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
    return `Rs. ${value.toLocaleString()}`;
  }
  return `${currency} ${value.toLocaleString()}`;
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
      --primary: #0a4a72;
      --accent: #c89b3c;
      --muted: #6b7280;
      --border: #dbe3ea;
      --soft: #f8fafc;
      --text: #111827;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      font-family: Arial, Helvetica, sans-serif;
      background: #eef3f7;
      color: var(--text);
    }
    .invoice {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
    }
    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 32px;
      background: linear-gradient(135deg, #0a1628 0%, var(--primary) 100%);
      color: #ffffff;
    }
    .hero h1, .hero h2, .hero p { margin: 0; }
    .hero h1 { font-size: 30px; margin-bottom: 6px; }
    .hero h2 { font-size: 24px; color: #f7d995; }
    .hero p { margin-top: 4px; opacity: 0.9; }
    .content { padding: 32px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .card {
      background: var(--soft);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
    }
    .label {
      margin: 0 0 12px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--primary);
    }
    .item {
      margin: 6px 0;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 14px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 14px;
      vertical-align: top;
    }
    th {
      background: #f3f6f9;
      text-align: left;
      color: var(--primary);
    }
    .right { text-align: right; }
    .center { text-align: center; }
    .strong { font-weight: 700; }
    .summary {
      width: min(360px, 100%);
      margin-left: auto;
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
    }
    .summary-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: #ffffff;
      font-size: 14px;
    }
    .summary-row:last-child {
      border-bottom: 0;
      background: #f8fbff;
      color: var(--primary);
      font-weight: 700;
      font-size: 16px;
    }
    .notes {
      margin-top: 24px;
      padding: 16px 18px;
      background: #fff9ed;
      border: 1px solid #f0dfb2;
      border-radius: 14px;
      font-size: 14px;
    }
    .footer {
      margin-top: 28px;
      color: var(--muted);
      font-size: 13px;
    }
    @media print {
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
        <p><strong>ID:</strong> ${escapeHtml(normalized.id)}</p>
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
          <p class="item"><strong>Passport:</strong> ${escapeHtml(normalized.passport)}</p>
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
        <div class="summary-row"><span>Tax (${normalized.taxRate || 0}%)</span><span>${escapeHtml(formatCurrency(normalized.taxAmount, normalized.currency))}</span></div>
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
        <strong>Disclaimer:</strong> This is not VAT invoice, 13% VAT applicable on our services.
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
