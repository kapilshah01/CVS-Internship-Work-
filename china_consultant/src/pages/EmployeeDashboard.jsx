import { useState, useEffect } from 'react';
import { COMPANY } from '../data/siteData';
import {
  dbGetInvoices,
  dbAddInvoice,
  dbUpdateInvoiceStatus,
  dbGetAppointments,
  dbUpdateAppointmentStatus,
  dbGetUsers,
} from '../utils/db';
import {
  createDefaultServiceItem,
  calculateInvoiceTotals,
  normalizeInvoice,
  formatCurrency,
  downloadInvoiceDocument,
} from '../utils/invoice';

const createInitialInvoice = () => ({
  client: '',
  passport: '',
  email: '',
  country: 'China',
  visaType: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date().toISOString().split('T')[0],
  discount: 0,
  taxRate: 0,
  paymentTerms: 'Payment due before document submission.',
  paymentMethod: 'Cash / Bank Transfer',
  serviceItems: [
    createDefaultServiceItem({
      description: 'Visa processing service',
      quantity: 1,
      unitPrice: 0,
    }),
  ],
  notes: '',
});

export default function EmployeeDashboard({ user }) {
  const [tab, setTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState({ query: '', country: '', status: '', dateFrom: '', dateTo: '' });
  const [appointmentSearch, setAppointmentSearch] = useState({ query: '', status: '', date: '' });
  const [showForm, setShowForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState(createInitialInvoice);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: '',
    from: 'test-visa-billing@gmail.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    appPassword: '',
    subject: '',
    body: '',
  });
  const [emailStatus, setEmailStatus] = useState('');

  const reloadData = async () => {
    const [invoiceData, appointmentData, userData] = await Promise.all([
      dbGetInvoices(),
      dbGetAppointments(),
      dbGetUsers(),
    ]);
    setInvoices(invoiceData);
    setAppointments(appointmentData);
    setUsers(userData);
  };

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    if (tab === 'appointments' || tab === 'invoices') {
      reloadData();
    }
  }, [tab]);

  useEffect(() => {
    const handleFocus = () => {
      reloadData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const invoiceTotals = calculateInvoiceTotals(
    newInvoice.serviceItems,
    newInvoice.discount,
    newInvoice.taxRate
  );

  const handleUpdateStatus = async (id, newStatus) => {
    await dbUpdateInvoiceStatus(id, newStatus);
    await reloadData();
  };

  const handleUpdateAppointmentStatus = async (id, newStatus) => {
    await dbUpdateAppointmentStatus(id, newStatus);
    await reloadData();
  };

  const handleCreateInvoiceFromAppointment = (appointment) => {
    setNewInvoice({
      ...createInitialInvoice(),
      client: appointment.clientName || '',
      email: appointment.email || '',
      passport: appointment.passport || '',
      country: appointment.country || 'China',
      visaType: appointment.visaType || appointment.purpose || 'Consultation',
      notes: appointment.notes || '',
      serviceItems: [
        createDefaultServiceItem({
          description: `${appointment.country || 'Visa'} ${appointment.visaType || appointment.purpose || 'consultation'} service`,
          quantity: 1,
          unitPrice: 0,
        }),
      ],
    });
    setShowForm(true);
    setTab('create');
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.query.toLowerCase();
    const matchQuery =
      !q ||
      inv.client.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      inv.passport.toLowerCase().includes(q);
    const matchCountry = !search.country || inv.country === search.country;
    const matchStatus = !search.status || inv.status === search.status;
    const matchDateFrom = !search.dateFrom || (inv.issueDate || inv.date) >= search.dateFrom;
    const matchDateTo = !search.dateTo || (inv.issueDate || inv.date) <= search.dateTo;
    return matchQuery && matchCountry && matchStatus && matchDateFrom && matchDateTo;
  });

  const filteredAppointments = appointments.filter((appt) => {
    const q = appointmentSearch.query.toLowerCase();
    const matchQuery =
      !q ||
      (appt.clientName || '').toLowerCase().includes(q) ||
      (appt.email || '').toLowerCase().includes(q) ||
      (appt.id || '').toLowerCase().includes(q) ||
      (appt.purpose || '').toLowerCase().includes(q);
    const matchStatus = !appointmentSearch.status || appt.status === appointmentSearch.status;
    const matchDate = !appointmentSearch.date || appt.date === appointmentSearch.date;
    return matchQuery && matchStatus && matchDate;
  });

  const updateServiceItem = (id, key, value) => {
    setNewInvoice((prev) => ({
      ...prev,
      serviceItems: prev.serviceItems.map((item) => (
        item.id === id ? { ...item, [key]: value } : item
      )),
    }));
  };

  const addServiceItem = () => {
    setNewInvoice((prev) => ({
      ...prev,
      serviceItems: [...prev.serviceItems, createDefaultServiceItem()],
    }));
  };

  const removeServiceItem = (id) => {
    setNewInvoice((prev) => ({
      ...prev,
      serviceItems: prev.serviceItems.length === 1
        ? prev.serviceItems
        : prev.serviceItems.filter((item) => item.id !== id),
    }));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    const invoice = normalizeInvoice({
      ...newInvoice,
      subtotal: invoiceTotals.subtotal,
      discount: newInvoice.discount,
      taxRate: newInvoice.taxRate,
      taxAmount: invoiceTotals.taxAmount,
      total: invoiceTotals.total,
      amount: invoiceTotals.total,
      date: newInvoice.issueDate,
      status: 'pending',
    });

    await dbAddInvoice(invoice);
    await reloadData();
    setShowForm(false);
    setNewInvoice(createInitialInvoice());
    setTab('invoices');
  };

  const openPdf = (invoice) => {
    setSelectedInvoice(normalizeInvoice(invoice));
    setShowPdfModal(true);
  };

  const openEmail = (invoice) => {
    const normalized = normalizeInvoice(invoice);
    setSelectedInvoice(normalized);
    setEmailForm({
      to: normalized.email || '',
      from: 'test-visa-billing@gmail.com',
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      appPassword: 'xxxx xxxx xxxx xxxx',
      subject: `Invoice ${normalized.id} - ${COMPANY.shortName}`,
      body: `Dear ${normalized.client},\n\nPlease find attached invoice ${normalized.id} for your ${normalized.country} ${normalized.visaType} service request.\n\nTotal Amount: ${formatCurrency(normalized.total, normalized.currency)}\nPassport Number: ${normalized.passport}\nDue Date: ${normalized.dueDate}\n\nBest regards,\n${COMPANY.name}`,
    });
    setEmailStatus('');
    setShowEmailModal(true);
  };

  const handleDownloadInvoice = (invoice) => {
    downloadInvoiceDocument(invoice, COMPANY);
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    setEmailStatus('sending');

    setTimeout(() => {
      setEmailStatus('success');
      handleUpdateStatus(selectedInvoice.id, 'pending');
      setTimeout(() => setShowEmailModal(false), 1500);
    }, 1800);
  };

  const stats = [
    { label: 'Total Invoices', value: invoices.length },
    { label: 'Paid Invoices', value: invoices.filter((i) => i.status === 'paid').length },
    { label: 'Pending Invoices', value: invoices.filter((i) => i.status === 'pending').length },
    { label: 'Appointments', value: appointments.length },
  ];

  const activeCustomers = users.filter((member) => member.role === 'customer' && member.status === 'active').length;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="container">
          <p className="dashboard__role">Employee Dashboard</p>
          <h1 className="dashboard__welcome">Welcome, {user?.name || 'Employee'}</h1>
        </div>
      </div>

      <div className="container dashboard__content">
        <div className="dashboard__stats">
          {stats.map((s, i) => (
            <div className="dash-stat" key={i}>
              <div className="dash-stat__value">{s.value}</div>
              <div className="dash-stat__label">{s.label}</div>
            </div>
          ))}
          <div className="dash-stat">
            <div className="dash-stat__value">{activeCustomers}</div>
            <div className="dash-stat__label">Active Customers</div>
          </div>
        </div>

        <div className="dashboard__tabs">
          <button className={`dashboard__tab ${tab === 'invoices' ? 'dashboard__tab--active' : ''}`} onClick={() => { reloadData(); setTab('invoices'); setShowForm(false); }}>
            Invoice History
          </button>
          <button className={`dashboard__tab ${tab === 'appointments' ? 'dashboard__tab--active' : ''}`} onClick={() => { reloadData(); setTab('appointments'); setShowForm(false); }}>
            Appointments
          </button>
          <button className={`dashboard__tab ${tab === 'create' ? 'dashboard__tab--active' : ''}`} onClick={() => { setTab('create'); setShowForm(true); }}>
            Generate Invoice
          </button>
        </div>

        {tab === 'invoices' && !showForm && (
          <div className="dashboard__panel">
            <div className="search-bar">
              <input className="form-input" placeholder="Search by client, invoice ID, or passport..." value={search.query} onChange={(e) => setSearch({ ...search, query: e.target.value })} />
              <select className="form-select" value={search.country} onChange={(e) => setSearch({ ...search, country: e.target.value })}>
                <option value="">All Countries</option>
                <option value="China">China</option>
                <option value="Japan">Japan</option>
                <option value="South Korea">South Korea</option>
              </select>
              <select className="form-select" value={search.status} onChange={(e) => setSearch({ ...search, status: e.target.value })}>
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
              </select>
              <input className="form-input" type="date" value={search.dateFrom} onChange={(e) => setSearch({ ...search, dateFrom: e.target.value })} />
              <input className="form-input" type="date" value={search.dateTo} onChange={(e) => setSearch({ ...search, dateTo: e.target.value })} />
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Passport</th>
                    <th>Country</th>
                    <th>Visa Type</th>
                    <th>Total (NPR)</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No invoices found matching your search criteria.</td></tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>{inv.id}</strong></td>
                        <td>{inv.client}</td>
                        <td>{inv.passport}</td>
                        <td>{inv.country}</td>
                        <td>{inv.visaType}</td>
                        <td>{formatCurrency(inv.total ?? inv.amount, inv.currency)}</td>
                        <td>{inv.issueDate || inv.date}</td>
                        <td>{inv.dueDate || inv.date}</td>
                        <td>
                          <select
                            className="form-select"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', width: 'auto' }}
                            value={inv.status}
                            onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                          >
                            <option value="draft">Draft</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn--sm btn--outline" onClick={() => openPdf(inv)} title="Preview / Print Invoice">View</button>
                            <button className="btn btn--sm btn--outline" onClick={() => handleDownloadInvoice(inv)} title="Download Invoice">Download</button>
                            <button className="btn btn--sm btn--outline" onClick={() => openEmail(inv)} title="Prepare Email">Email</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'appointments' && !showForm && (
          <div className="dashboard__panel">
            <div className="search-bar">
              <input
                className="form-input"
                placeholder="Search by client, email, appointment ID, or purpose..."
                value={appointmentSearch.query}
                onChange={(e) => setAppointmentSearch({ ...appointmentSearch, query: e.target.value })}
              />
              <select
                className="form-select"
                value={appointmentSearch.status}
                onChange={(e) => setAppointmentSearch({ ...appointmentSearch, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                className="form-input"
                type="date"
                value={appointmentSearch.date}
                onChange={(e) => setAppointmentSearch({ ...appointmentSearch, date: e.target.value })}
              />
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Appointment #</th>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Country</th>
                    <th>Purpose</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No appointments found yet.</td></tr>
                  ) : (
                    filteredAppointments.map((appt) => (
                      <tr key={appt.id}>
                        <td><strong>{appt.id}</strong></td>
                        <td>{appt.clientName || 'N/A'}</td>
                        <td>{appt.email || 'N/A'}</td>
                        <td>{appt.date}</td>
                        <td>{appt.time}</td>
                        <td>{appt.country || 'China'}</td>
                        <td>{appt.purpose || 'Consultation'}</td>
                        <td style={{ maxWidth: '220px' }}>{appt.notes || '-'}</td>
                        <td>
                          <select
                            className="form-select"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', width: 'auto' }}
                            value={appt.status}
                            onChange={(e) => handleUpdateAppointmentStatus(appt.id, e.target.value)}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--sm btn--outline"
                            onClick={() => handleCreateInvoiceFromAppointment(appt)}
                          >
                            Create Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(tab === 'create' || showForm) && (
          <div className="dashboard__panel">
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Generate Client Invoice</h3>
            <form onSubmit={handleCreateInvoice}>
              <div className="invoice-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-client">Client Full Name *</label>
                  <input className="form-input" id="inv-client" type="text" value={newInvoice.client} onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-passport">Passport Number *</label>
                  <input className="form-input" id="inv-passport" type="text" value={newInvoice.passport} onChange={(e) => setNewInvoice({ ...newInvoice, passport: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-email">Client Email</label>
                  <input className="form-input" id="inv-email" type="email" value={newInvoice.email} onChange={(e) => setNewInvoice({ ...newInvoice, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-country">Country *</label>
                  <select className="form-select" id="inv-country" value={newInvoice.country} onChange={(e) => setNewInvoice({ ...newInvoice, country: e.target.value })} required>
                    <option value="China">China</option>
                    <option value="Japan">Japan</option>
                    <option value="South Korea">South Korea</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-visatype">Visa Type *</label>
                  <input className="form-input" id="inv-visatype" type="text" placeholder="e.g. Tourist (L)" value={newInvoice.visaType} onChange={(e) => setNewInvoice({ ...newInvoice, visaType: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-issue-date">Issue Date *</label>
                  <input className="form-input" id="inv-issue-date" type="date" value={newInvoice.issueDate} onChange={(e) => setNewInvoice({ ...newInvoice, issueDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-due-date">Due Date *</label>
                  <input className="form-input" id="inv-due-date" type="date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-discount">Discount (NPR)</label>
                  <input className="form-input" id="inv-discount" type="number" min="0" value={newInvoice.discount} onChange={(e) => setNewInvoice({ ...newInvoice, discount: Number(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-tax-rate">Tax Rate (%)</label>
                  <input className="form-input" id="inv-tax-rate" type="number" min="0" step="0.01" value={newInvoice.taxRate} onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: Number(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-payment-method">Payment Method</label>
                  <input className="form-input" id="inv-payment-method" type="text" value={newInvoice.paymentMethod} onChange={(e) => setNewInvoice({ ...newInvoice, paymentMethod: e.target.value })} />
                </div>
                <div className="form-group form-group--full">
                  <label className="form-label" htmlFor="inv-payment-terms">Payment Terms</label>
                  <input className="form-input" id="inv-payment-terms" type="text" value={newInvoice.paymentTerms} onChange={(e) => setNewInvoice({ ...newInvoice, paymentTerms: e.target.value })} />
                </div>

                <div className="form-group form-group--full">
                  <label className="form-label">Service Line Items</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {newInvoice.serviceItems.map((item, index) => (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2.3fr 0.7fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Description {index + 1}</label>
                          <input className="form-input" type="text" value={item.description} onChange={(e) => updateServiceItem(item.id, 'description', e.target.value)} required />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                          <input className="form-input" type="number" min="1" value={item.quantity} onChange={(e) => updateServiceItem(item.id, 'quantity', Number(e.target.value) || 1)} required />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit Price</label>
                          <input className="form-input" type="number" min="0" value={item.unitPrice} onChange={(e) => updateServiceItem(item.id, 'unitPrice', Number(e.target.value) || 0)} required />
                        </div>
                        <button type="button" className="btn btn--outline btn--sm" onClick={() => removeServiceItem(item.id)}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <div>
                      <button type="button" className="btn btn--outline btn--sm" onClick={addServiceItem}>Add Line Item</button>
                    </div>
                  </div>
                </div>

                <div className="form-group form-group--full">
                  <label className="form-label" htmlFor="inv-notes">Additional Notes</label>
                  <textarea className="form-textarea" id="inv-notes" value={newInvoice.notes} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} placeholder="Any additional details for this invoice..."></textarea>
                </div>

                <div className="form-group form-group--full">
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem', background: 'var(--color-surface-alt)' }}>
                    <h4 style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>Invoice Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.4rem', fontSize: '0.95rem' }}>
                      <span>Subtotal</span><strong>{formatCurrency(invoiceTotals.subtotal)}</strong>
                      <span>Discount</span><strong>{formatCurrency(invoiceTotals.discount)}</strong>
                      <span>Tax</span><strong>{formatCurrency(invoiceTotals.taxAmount)}</strong>
                      <span>Total</span><strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(invoiceTotals.total)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn--primary btn--lg">Generate Invoice</button>
                <button type="button" className="btn btn--outline btn--lg" onClick={() => { setShowForm(false); setTab('invoices'); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {showPdfModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPdfModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '760px',
            borderRadius: '12px', padding: '2rem', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)',
            position: 'relative', overflowY: 'auto', maxHeight: '90vh'
          }}>
            <button onClick={() => setShowPdfModal(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none',
              fontSize: '1.25rem', cursor: 'pointer', color: 'var(--color-text-light)'
            }}>X</button>

            <div id="print-area" style={{ fontFamily: 'var(--font-body)', color: '#111827' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-accent)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', margin: 0, fontSize: '1.75rem' }}>CLIENT INVOICE</h2>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0.2rem 0' }}>{COMPANY.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>Kathmandu, Nepal | {COMPANY.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-accent)' }}>{selectedInvoice.id}</h3>
                  <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>Issue Date:</strong> {selectedInvoice.issueDate || selectedInvoice.date}</p>
                  <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>Due Date:</strong> {selectedInvoice.dueDate || selectedInvoice.date}</p>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: selectedInvoice.status === 'paid' ? '#10B981' : '#F59E0B' }}>{selectedInvoice.status}</span></p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem' }}>BILL TO</h4>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Client Name:</strong> {selectedInvoice.client}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Passport Number:</strong> {selectedInvoice.passport}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Email:</strong> {selectedInvoice.email || 'N/A'}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem' }}>SERVICE DETAILS</h4>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Country:</strong> {selectedInvoice.country}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Visa Type:</strong> {selectedInvoice.visaType}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Payment Method:</strong> {selectedInvoice.paymentMethod}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#F3F4F6', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.85rem' }}>Description</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.85rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.85rem', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.85rem', textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.serviceItems?.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem' }}>{item.description}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem', textAlign: 'right' }}>{formatCurrency(item.unitPrice, selectedInvoice.currency)}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(item.quantity * item.unitPrice, selectedInvoice.currency)}
                      </td>
                    </tr>
                  ))}

                  {selectedInvoice.notes && (
                    <tr>
                      <td colSpan="4" style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic', background: '#F9FAFB' }}>
                        <strong>Notes:</strong> {selectedInvoice.notes}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>Subtotal</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>Discount</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(selectedInvoice.discount, selectedInvoice.currency)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>Tax ({selectedInvoice.taxRate || 0}%)</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #E5E7EB' }}>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem' }}>Grand Total</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-primary)' }}>
                      {formatCurrency(selectedInvoice.total ?? selectedInvoice.amount, selectedInvoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '1rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', margin: '0 0 0.35rem 0' }}><strong>Payment Terms:</strong> {selectedInvoice.paymentTerms}</p>
                <p style={{ fontSize: '0.85rem', margin: 0, color: '#6B7280' }}>Please verify all client details before submission to the embassy or visa center.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <button className="btn btn--outline" onClick={() => handleDownloadInvoice(selectedInvoice)}>Download Invoice</button>
              <button className="btn btn--primary" onClick={() => window.print()}>Print Invoice</button>
              <button className="btn btn--outline" onClick={() => setShowPdfModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '550px',
            borderRadius: '12px', padding: '2rem', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)',
            position: 'relative'
          }}>
            <button onClick={() => setShowEmailModal(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none',
              fontSize: '1.25rem', cursor: 'pointer', color: 'var(--color-text-light)'
            }}>X</button>

            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Send Invoice via Email</h3>

            {emailStatus === 'success' ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#10B981' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Sent</div>
                <h4>Email Prepared Successfully</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '0.25rem' }}>The invoice email draft is ready to be transmitted using your office SMTP settings.</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>SMTP Host</label>
                    <input className="form-input" style={{ padding: '0.4rem 0.6rem' }} value={emailForm.smtpHost} onChange={(e) => setEmailForm({ ...emailForm, smtpHost: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>SMTP Port</label>
                    <input className="form-input" style={{ padding: '0.4rem 0.6rem' }} value={emailForm.smtpPort} onChange={(e) => setEmailForm({ ...emailForm, smtpPort: e.target.value })} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Office Email (From)</label>
                    <input className="form-input" style={{ padding: '0.4rem 0.6rem' }} type="email" value={emailForm.from} onChange={(e) => setEmailForm({ ...emailForm, from: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>App Password</label>
                    <input className="form-input" style={{ padding: '0.4rem 0.6rem' }} type="password" value={emailForm.appPassword} onChange={(e) => setEmailForm({ ...emailForm, appPassword: e.target.value })} required />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Client Email (To)</label>
                  <input className="form-input" style={{ padding: '0.4rem 0.6rem' }} type="email" value={emailForm.to} onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })} required />
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Subject</label>
                  <input className="form-input" style={{ padding: '0.4rem 0.6rem' }} value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} required />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Body</label>
                  <textarea className="form-textarea" style={{ minHeight: '80px', padding: '0.4rem 0.6rem' }} value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} required></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <button type="submit" className="btn btn--primary" disabled={emailStatus === 'sending'}>
                    {emailStatus === 'sending' ? 'Preparing...' : 'Prepare Email'}
                  </button>
                  <button type="button" className="btn btn--outline" onClick={() => setShowEmailModal(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
