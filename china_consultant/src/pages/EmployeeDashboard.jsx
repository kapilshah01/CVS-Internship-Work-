import { useState, useEffect } from 'react';
import { COMPANY, COUNTRIES } from '../data/siteData';
import {
  getFeeDestinations,
  getFeeEntries,
  getVisaFee,
  VISA_FEE_NATIONALITIES,
  VISA_PROCESSING_SPEEDS,
} from '../data/visaFeeSchedule';
import {
  dbGetInvoices,
  dbAddInvoice,
  dbUpdateInvoiceStatus,
  dbGetAppointments,
  dbUpdateAppointmentStatus,
  dbGetClients,
  dbGetInquiries,
} from '../utils/db';
import {
  createDefaultServiceItem,
  calculateInvoiceTotals,
  normalizeInvoice,
  formatCurrency,
  downloadInvoiceDocument,
  createInvoiceDocumentBlob,
} from '../utils/invoice';
import { sendInvoiceEmail } from '../services/emailService';

const createInitialInvoice = () => ({
  invoiceMode: 'personal',
  client: '',
  passport: '',
  passportListText: '',
  email: '',
  country: 'China',
  feeNationality: 'Nepal',
  feeDestination: 'Mainland China',
  feeEntry: 'Single',
  processingSpeed: 'normal',
  visaType: '',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date().toISOString().split('T')[0],
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

const COUNTRY_VISA_TYPE_OPTIONS = Object.fromEntries(
  COUNTRIES.map((country) => [country.name, country.visaTypes || []])
);

export default function EmployeeDashboard({ user }) {
  const [tab, setTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [search, setSearch] = useState({ query: '', country: '', status: '', dateFrom: '', dateTo: '' });
  const [appointmentSearch, setAppointmentSearch] = useState({ query: '', status: '', date: '' });
  const [clientSearch, setClientSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState(createInitialInvoice);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
  });
  const [emailStatus, setEmailStatus] = useState('');
  const [emailError, setEmailError] = useState('');
  const [invoiceSubmitState, setInvoiceSubmitState] = useState({
    loading: false,
    error: '',
    success: '',
  });

  const reloadData = async () => {
    const [invoiceData, appointmentData, clientData, inquiryData] = await Promise.all([
      dbGetInvoices(),
      dbGetAppointments(),
      dbGetClients(),
      dbGetInquiries(),
    ]);
    setInvoices(invoiceData);
    setAppointments(appointmentData);
    setClients(clientData);
    setInquiries(inquiryData);
  };

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    if (tab === 'appointments' || tab === 'invoices' || tab === 'clients' || tab === 'inquiries') {
      reloadData();
    }
  }, [tab]);

  useEffect(() => {
    if (newInvoice.country !== 'China') return;

    const destinations = getFeeDestinations(newInvoice.feeNationality);
    const resolvedDestination = destinations.includes(newInvoice.feeDestination)
      ? newInvoice.feeDestination
      : destinations[0];

    const entries = getFeeEntries(newInvoice.feeNationality, resolvedDestination);
    const resolvedEntry = entries.includes(newInvoice.feeEntry)
      ? newInvoice.feeEntry
      : entries[0];

    const resolvedFee = getVisaFee(
      newInvoice.feeNationality,
      resolvedDestination,
      resolvedEntry,
      newInvoice.processingSpeed
    );

    setNewInvoice((prev) => {
      if (prev.country !== 'China') return prev;

      const nextDescription = `China visa fee - ${resolvedDestination} - ${resolvedEntry} (${newInvoice.processingSpeed})`;
      const nextVisaType = `${resolvedDestination} - ${resolvedEntry}`;
      const firstItem = prev.serviceItems[0];
      const nextFirstItem = firstItem
        ? {
            ...firstItem,
            description: nextDescription,
            unitPrice: resolvedFee ?? 0,
          }
        : createDefaultServiceItem({
            description: nextDescription,
            quantity: 1,
            unitPrice: resolvedFee ?? 0,
          });

      return {
        ...prev,
        feeDestination: resolvedDestination,
        feeEntry: resolvedEntry,
        visaType: nextVisaType,
        serviceItems: [nextFirstItem, ...prev.serviceItems.slice(1)],
      };
    });
  }, [
    newInvoice.country,
    newInvoice.feeNationality,
    newInvoice.feeDestination,
    newInvoice.feeEntry,
    newInvoice.processingSpeed,
  ]);

  useEffect(() => {
    if (newInvoice.country === 'China') return;

    const options = COUNTRY_VISA_TYPE_OPTIONS[newInvoice.country] || [];
    if (options.length === 0) return;

    if (!options.includes(newInvoice.visaType)) {
      setNewInvoice((prev) => ({ ...prev, visaType: options[0] }));
    }
  }, [newInvoice.country, newInvoice.visaType]);

  useEffect(() => {
    const handleFocus = () => {
      reloadData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const invoiceTotals = calculateInvoiceTotals(newInvoice.serviceItems, newInvoice.taxRate);

  const buildPassportList = (invoice) => {
    if (invoice.invoiceMode === 'group') {
      return invoice.passportListText
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return invoice.passport.trim() ? [invoice.passport.trim()] : [];
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await dbUpdateInvoiceStatus(id, newStatus);
    await reloadData();
  };

  const handleUpdateAppointmentStatus = async (id, newStatus) => {
    await dbUpdateAppointmentStatus(id, newStatus);
    await reloadData();
  };

  const handleCreateInvoiceFromAppointment = (appointment) => {
    setInvoiceSubmitState({ loading: false, error: '', success: '' });
    setNewInvoice({
      ...createInitialInvoice(),
      client: appointment.clientName || '',
      email: appointment.email || '',
      passport: appointment.passport || '',
      passportListText: appointment.passport || '',
      country: appointment.country || 'China',
      feeNationality: 'Nepal',
      feeDestination: 'Mainland China',
      feeEntry: 'Single',
      processingSpeed: 'normal',
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

  const filteredClients = clients.filter((client) => {
    const q = clientSearch.toLowerCase();
    return !q || client.name.toLowerCase().includes(q) || client.email.toLowerCase().includes(q) || (client.phone || '').toLowerCase().includes(q);
  });

  const filteredInquiries = inquiries.filter((item) => {
    const q = clientSearch.toLowerCase();
    return !q || item.fullName.toLowerCase().includes(q) || item.email.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q);
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
    setInvoiceSubmitState({ loading: true, error: '', success: '' });

    const passportList = buildPassportList(newInvoice);
    const travelerCount = passportList.length || 1;
    const passportSummary = newInvoice.invoiceMode === 'group'
      ? `${travelerCount} passport${travelerCount > 1 ? 's' : ''}`
      : (passportList[0] || newInvoice.passport);

    try {
      const invoice = normalizeInvoice({
        ...newInvoice,
        passport: passportSummary,
        passportList,
        travelerCount,
        subtotal: invoiceTotals.subtotal,
        taxRate: newInvoice.taxRate,
        taxAmount: invoiceTotals.taxAmount,
        total: invoiceTotals.total,
        amount: invoiceTotals.total,
        date: newInvoice.issueDate,
        status: 'pending',
      });

      await dbAddInvoice(invoice);
      await reloadData();
      setInvoiceSubmitState({ loading: false, error: '', success: 'Invoice generated successfully.' });
      setShowForm(false);
      setNewInvoice(createInitialInvoice());
      setTab('invoices');
    } catch (error) {
      setInvoiceSubmitState({
        loading: false,
        error: error.message || 'Failed to generate invoice. Please try again.',
        success: '',
      });
    }
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
      subject: `Invoice ${normalized.id} - ${COMPANY.shortName}`,
      body: `Dear ${normalized.client},\n\nPlease find attached invoice ${normalized.id} for your ${normalized.country} ${normalized.visaType} service request.\n\nTotal Amount: ${formatCurrency(normalized.total, normalized.currency)}\nPassport Details: ${normalized.passport}\nDue Date: ${normalized.dueDate}\n\nBest regards,\n${COMPANY.name}`,
    });
    setEmailStatus('');
    setEmailError('');
    setShowEmailModal(true);
  };

  const handleDownloadInvoice = (invoice) => {
    downloadInvoiceDocument(invoice, COMPANY);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !emailForm.to.trim()) {
      setEmailStatus('missing-email');
      setEmailError('');
      return;
    }

    try {
      setEmailStatus('sending');
      setEmailError('');

      const { html: invoiceHtml, filename } = createInvoiceDocumentBlob(selectedInvoice, COMPANY);

      await sendInvoiceEmail({
        to: emailForm.to.trim(),
        subject: emailForm.subject.trim(),
        text: emailForm.body,
        html: emailForm.body
          .split('\n')
          .map((line) => `<p>${line || '&nbsp;'}</p>`)
          .join(''),
        invoiceHtml,
        invoiceFilename: filename,
        invoiceId: selectedInvoice.id,
        clientName: selectedInvoice.client,
        employeeName: user?.name || '',
        employeeEmail: user?.email || '',
        replyTo: COMPANY.email,
      });

      setEmailStatus('success');
      await handleUpdateStatus(selectedInvoice.id, 'pending');
    } catch (error) {
      setEmailStatus('error');
      setEmailError(error.message || 'Failed to send email.');
    }
  };

  const stats = [
    { label: 'Total Invoices', value: invoices.length },
    { label: 'Paid Invoices', value: invoices.filter((i) => i.status === 'paid').length },
    { label: 'Pending Invoices', value: invoices.filter((i) => i.status === 'pending').length },
    { label: 'Appointments', value: appointments.length },
    { label: 'Inquiries', value: inquiries.length },
  ];
  const activeClients = clients.filter((member) => member.status === 'active').length;

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
            <div className="dash-stat__value">{activeClients}</div>
            <div className="dash-stat__label">Active Clients</div>
          </div>
        </div>

        <div className="dashboard__tabs">
          <button className={`dashboard__tab ${tab === 'invoices' ? 'dashboard__tab--active' : ''}`} onClick={() => { reloadData(); setTab('invoices'); setShowForm(false); }}>
            Invoice History
          </button>
          <button className={`dashboard__tab ${tab === 'appointments' ? 'dashboard__tab--active' : ''}`} onClick={() => { reloadData(); setTab('appointments'); setShowForm(false); }}>
            Appointments
          </button>
          <button className={`dashboard__tab ${tab === 'inquiries' ? 'dashboard__tab--active' : ''}`} onClick={() => { reloadData(); setTab('inquiries'); setShowForm(false); }}>
            Inquiries
          </button>
          <button className={`dashboard__tab ${tab === 'clients' ? 'dashboard__tab--active' : ''}`} onClick={() => { reloadData(); setTab('clients'); setShowForm(false); }}>
            Clients
          </button>
          <button className={`dashboard__tab ${tab === 'create' ? 'dashboard__tab--active' : ''}`} onClick={() => { setTab('create'); setShowForm(true); }}>
            Generate Invoice
          </button>
        </div>

        {tab === 'invoices' && !showForm && (
          <div className="dashboard__panel">
            {invoiceSubmitState.success && (
              <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                {invoiceSubmitState.success}
              </div>
            )}
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

        {tab === 'inquiries' && !showForm && (
          <div className="dashboard__panel">
            <div className="search-bar">
              <input className="form-input" placeholder="Search inquiries..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Country</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No inquiries found.</td></tr>
                  ) : (
                    filteredInquiries.map((item) => (
                      <tr key={item.id}>
                        <td>{item.fullName}</td>
                        <td>{item.email}</td>
                        <td>{item.country || '-'}</td>
                        <td>{item.subject}</td>
                        <td>{item.status}</td>
                        <td style={{ maxWidth: '240px' }}>{item.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'clients' && !showForm && (
          <div className="dashboard__panel">
            <div className="search-bar">
              <input className="form-input" placeholder="Search clients..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No clients found.</td></tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id}>
                        <td>{client.name}</td>
                        <td>{client.email}</td>
                        <td>{client.phone || '-'}</td>
                        <td>{client.country || '-'}</td>
                        <td>{client.status}</td>
                        <td>{client.notes || '-'}</td>
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
            {invoiceSubmitState.error && (
              <div className="form-error" style={{ marginBottom: '1rem' }}>
                {invoiceSubmitState.error}
              </div>
            )}
            <form onSubmit={handleCreateInvoice}>
              <div className="invoice-form">
                {newInvoice.country === 'China' && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="inv-fee-nationality">Nationality Group *</label>
                      <select
                        className="form-select"
                        id="inv-fee-nationality"
                        value={newInvoice.feeNationality}
                        onChange={(e) => setNewInvoice({ ...newInvoice, feeNationality: e.target.value })}
                        required
                      >
                        {VISA_FEE_NATIONALITIES.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="inv-processing-speed">Processing Speed *</label>
                      <select
                        className="form-select"
                        id="inv-processing-speed"
                        value={newInvoice.processingSpeed}
                        onChange={(e) => setNewInvoice({ ...newInvoice, processingSpeed: e.target.value })}
                        required
                      >
                        {VISA_PROCESSING_SPEEDS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-mode">Invoice Type *</label>
                  <select
                    className="form-select"
                    id="inv-mode"
                    value={newInvoice.invoiceMode}
                    onChange={(e) => setNewInvoice({
                      ...newInvoice,
                      invoiceMode: e.target.value,
                      passport: e.target.value === 'personal' ? newInvoice.passport : '',
                    })}
                    required
                  >
                    <option value="personal">Personal Invoice</option>
                    <option value="group">Group Invoice</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-client">{newInvoice.invoiceMode === 'group' ? 'Client / Group Name *' : 'Client Full Name *'}</label>
                  <input className="form-input" id="inv-client" type="text" value={newInvoice.client} onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })} required />
                </div>
                {newInvoice.invoiceMode === 'group' ? (
                  <div className="form-group form-group--full">
                    <label className="form-label" htmlFor="inv-passport-group">Passport / Permit Numbers *</label>
                    <textarea
                      className="form-textarea"
                      id="inv-passport-group"
                      value={newInvoice.passportListText}
                      onChange={(e) => setNewInvoice({ ...newInvoice, passportListText: e.target.value })}
                      placeholder="Enter one passport per line or separate with commas"
                      required
                    ></textarea>
                    <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                      Travelers counted: {buildPassportList(newInvoice).length}
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="inv-passport">Passport / Permit Number *</label>
                    <input className="form-input" id="inv-passport" type="text" value={newInvoice.passport} onChange={(e) => setNewInvoice({ ...newInvoice, passport: e.target.value })} required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-email">Client Email</label>
                  <input className="form-input" id="inv-email" type="email" value={newInvoice.email} onChange={(e) => setNewInvoice({ ...newInvoice, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-visatype">Visa Type *</label>
                  {newInvoice.country === 'China' ? (
                    <select className="form-select" id="inv-visatype" value={newInvoice.visaType} disabled required>
                      <option value={newInvoice.visaType || ''}>
                        {newInvoice.visaType || 'Select fee schedule options first'}
                      </option>
                    </select>
                  ) : (
                    <select
                      className="form-select"
                      id="inv-visatype"
                      value={newInvoice.visaType}
                      onChange={(e) => setNewInvoice({ ...newInvoice, visaType: e.target.value })}
                      required
                    >
                      {(COUNTRY_VISA_TYPE_OPTIONS[newInvoice.country] || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label" htmlFor="inv-country">Country *</label>
                        <select className="form-select" id="inv-country" value={newInvoice.country} onChange={(e) => setNewInvoice({ ...newInvoice, country: e.target.value })} required>
                          <option value="China">China</option>
                          <option value="Japan">Japan</option>
                          <option value="South Korea">South Korea</option>
                        </select>
                      </div>
                      {newInvoice.country === 'China' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label className="form-label" htmlFor="inv-fee-destination">Destination *</label>
                            <select
                              className="form-select"
                              id="inv-fee-destination"
                              value={newInvoice.feeDestination}
                              onChange={(e) => setNewInvoice({ ...newInvoice, feeDestination: e.target.value })}
                              required
                            >
                              {getFeeDestinations(newInvoice.feeNationality).map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="form-label" htmlFor="inv-fee-entry">Entry Type *</label>
                            <select
                              className="form-select"
                              id="inv-fee-entry"
                              value={newInvoice.feeEntry}
                              onChange={(e) => setNewInvoice({ ...newInvoice, feeEntry: e.target.value })}
                              required
                            >
                              {getFeeEntries(newInvoice.feeNationality, newInvoice.feeDestination).map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                    {newInvoice.country === 'China' && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                        The first line item price is auto-filled from the 2024 company visa fee schedule PDF.
                      </div>
                    )}
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
                      <span>Tax</span><strong>{formatCurrency(invoiceTotals.taxAmount)}</strong>
                      <span>Total</span><strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(invoiceTotals.total)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn--primary btn--lg" disabled={invoiceSubmitState.loading}>
                  {invoiceSubmitState.loading ? 'Generating Invoice...' : 'Generate Invoice'}
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--lg"
                  disabled={invoiceSubmitState.loading}
                  onClick={() => {
                    setInvoiceSubmitState({ loading: false, error: '', success: '' });
                    setShowForm(false);
                    setTab('invoices');
                  }}
                >
                  Cancel
                </button>
              </div>

              {invoiceSubmitState.loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', color: 'var(--color-text-light)' }}>
                  <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                  <span>Saving invoice details and generating the record...</span>
                </div>
              )}
              {!invoiceSubmitState.loading && (
                <div style={{ marginTop: '0.85rem', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                  The invoice will appear in the invoice list immediately after it is generated.
                </div>
              )}
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

            <div id="print-area" style={{ fontFamily: 'var(--font-body)', color: '#111827', background: '#FFFFFF', borderRadius: '14px', padding: '1.5rem', border: '1px solid #D7DDE5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(212, 169, 58, 0.45)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', background: 'linear-gradient(135deg, #EAF5FF 0%, #FFFFFF 50%, #FFF6DD 100%)', padding: '0.6rem 0.6rem 1rem', borderRadius: '10px 10px 0 0' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1F4F82', margin: 0, fontSize: '1.55rem' }}>PERFORMA INVOICE</h2>
                  <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: '0.2rem 0' }}>{COMPANY.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>Hattisar, Kathmandu | {COMPANY.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0, color: '#D4A93A' }}>{selectedInvoice.id}</h3>
                  <p style={{ fontSize: '0.85rem', margin: '0.2rem 0', color: '#111827' }}><strong>PI Number:</strong> {selectedInvoice.id}</p>
                  <p style={{ fontSize: '0.85rem', margin: '0.2rem 0', color: '#111827' }}><strong>Issue Date:</strong> {selectedInvoice.issueDate || selectedInvoice.date}</p>
                  <p style={{ fontSize: '0.85rem', margin: '0.2rem 0', color: '#111827' }}><strong>Due Date:</strong> {selectedInvoice.dueDate || selectedInvoice.date}</p>
                  <p style={{ fontSize: '0.85rem', margin: 0, color: '#111827' }}><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#111111' }}>{selectedInvoice.status}</span></p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F9FF 68%, #FFF3D6 100%)', border: '1px solid #D9E2EC', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1F4F82', borderBottom: '1px solid rgba(31,79,130,0.12)', paddingBottom: '0.35rem', letterSpacing: '0.08em' }}>BILL TO</h4>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0', color: '#111827' }}><strong>Client Name:</strong> {selectedInvoice.client}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0', color: '#111827' }}><strong>Invoice Type:</strong> {selectedInvoice.invoiceMode === 'group' ? 'Group' : 'Personal'}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0', color: '#111827' }}><strong>Passport / Permit Number:</strong> {selectedInvoice.passport}</p>
                  {selectedInvoice.invoiceMode === 'group' && (
                    <p style={{ fontSize: '0.9rem', margin: '0.2rem 0', color: '#111827' }}><strong>Travelers:</strong> {selectedInvoice.travelerCount || selectedInvoice.passportList?.length || 1}</p>
                  )}
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0', color: '#111827' }}><strong>Email:</strong> {selectedInvoice.email || 'N/A'}</p>
                </div>
                <div style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F9FF 68%, #FFF3D6 100%)', border: '1px solid #D9E2EC', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1F4F82', borderBottom: '1px solid rgba(31,79,130,0.12)', paddingBottom: '0.35rem', letterSpacing: '0.08em' }}>SERVICE DETAILS</h4>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0', color: '#111827' }}><strong>Country:</strong> {selectedInvoice.country}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0', color: '#111827' }}><strong>Visa Type:</strong> {selectedInvoice.visaType}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0', color: '#111827' }}><strong>Payment Method:</strong> {selectedInvoice.paymentMethod}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(180deg, #F1F8FF 0%, #E9F2FB 68%, #FFF1CD 100%)', textAlign: 'left' }}>
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
                  {selectedInvoice.invoiceMode === 'group' && selectedInvoice.passportList?.length > 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6B7280', background: '#F9FAFB' }}>
                        <strong>Passport Group:</strong> {selectedInvoice.passportList.join(', ')}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>Subtotal</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</td>
                  </tr>
                  {(Number(selectedInvoice.taxRate || 0) > 0 || Number(selectedInvoice.taxAmount || 0) > 0) && (
                    <tr>
                      <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.9rem' }}>Tax</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid rgba(212, 169, 58, 0.35)', background: 'linear-gradient(180deg, rgba(212,169,58,0.18) 0%, rgba(31,79,130,0.10) 100%)' }}>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem' }}>Grand Total</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1rem', color: '#1F4F82' }}>
                      {formatCurrency(selectedInvoice.total ?? selectedInvoice.amount, selectedInvoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F7FBFF 60%, #FFF4DB 100%)', border: '1px solid #D9E2EC', borderRadius: '12px', padding: '1rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', margin: '0 0 0.35rem 0' }}><strong>Payment Terms:</strong> {selectedInvoice.paymentTerms}</p>
                <p style={{ fontSize: '0.85rem', margin: 0, color: '#6B7280' }}>Please verify all client details before submission to the embassy or visa center.</p>
              </div>

              <div style={{ fontSize: '0.82rem', margin: '1rem 0 0 0', color: '#4B5563', lineHeight: 1.7, background: 'linear-gradient(135deg, rgba(31,79,130,0.08) 0%, rgba(212,169,58,0.12) 100%)', border: '1px solid rgba(212,169,58,0.24)', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                <strong>Disclaimer:</strong>
                <div>- This document is a Proforma Invoice only and not a Tax Invoice (VAT Bill).</div>
                <div>- It is issued solely for quotation, approval, and payment estimation purposes.</div>
                <div>- This Proforma Invoice is not valid for claiming VAT input credit.</div>
                <div>- A 13% Value Added Tax (VAT) is applicable on our services.</div>
                <div>- The applicable VAT will be charged separately upon issuance of the Final Tax Invoice (VAT Bill).</div>
              </div>

              <p style={{ fontSize: '0.85rem', margin: '0.85rem 0 0 0', color: '#1F4F82', fontWeight: 700, padding: '0.75rem 0 0', textAlign: 'center' }}>
                Please bring this PI to collect Passport.
              </p>
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

            {emailStatus === 'missing-email' && (
              <div className="form-error" style={{ marginBottom: '1rem' }}>
                Add the client email address before sending the invoice.
              </div>
            )}

            {emailStatus === 'error' && (
              <div className="form-error" style={{ marginBottom: '1rem' }}>
                {emailError}
              </div>
            )}

            {emailStatus === 'success' ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#10B981' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Sent</div>
                <h4>Invoice Email Sent</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '0.25rem' }}>The invoice was processed successfully from the website. In demo mode, this is shown as sent for presentation purposes.</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail}>
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

                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>
                  Clicking send will complete the flow inside the website. For demo deployments without mail credentials, it will still show a successful send state.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <button type="submit" className="btn btn--primary" disabled={emailStatus === 'sending'}>
                    {emailStatus === 'sending' ? 'Sending...' : 'Send Email'}
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
