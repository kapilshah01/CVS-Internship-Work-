import { useState, useEffect } from 'react';
import { dbGetInvoices, dbGetAppointments, dbAddAppointment } from '../utils/db';
import { COMPANY } from '../data/siteData';
import { downloadInvoiceDocument, formatCurrency, normalizeInvoice } from '../utils/invoice';

export default function CustomerDashboard({ user }) {
  const [tab, setTab] = useState('status');
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00 AM');
  const [apptPurpose, setApptPurpose] = useState('Consultation');
  const [apptNotes, setApptNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const loadDashboardData = async () => {
    const allInvoices = await dbGetInvoices();
    const filtered = allInvoices.filter(
      (inv) =>
        inv.email?.toLowerCase() === user.email?.toLowerCase() ||
        inv.client.toLowerCase().includes(user.name?.toLowerCase())
    );
    setInvoices(filtered);

    const allAppts = await dbGetAppointments();
    const myAppts = allAppts.filter(
      (appt) =>
        appt.email?.toLowerCase() === user.email?.toLowerCase() ||
        appt.clientName?.toLowerCase() === user.name?.toLowerCase()
    );
    setAppointments(myAppts);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const applications = invoices.map((invoice) => ({
    id: invoice.id,
    country: invoice.country,
    visaType: invoice.visaType,
    submitted: invoice.issueDate || invoice.date,
    updated: invoice.dueDate || invoice.date,
    status:
      invoice.status === 'paid'
        ? 'Approved'
        : invoice.status === 'draft'
          ? 'Draft'
          : 'Processing',
  }));

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (bookingLoading) return;
    setSuccessMsg('');
    setErrorMsg('');

    if (!apptDate) {
      setErrorMsg('Please select a date.');
      return;
    }

    const dateObj = new Date(apptDate);
    const day = dateObj.getDay();
    if (day === 6) {
      setErrorMsg('The office is closed on Saturdays. Please select another day (Sunday to Friday).');
      return;
    }

    setBookingLoading(true);

    try {
      await dbAddAppointment({
        clientName: user.name,
        email: user.email,
        date: apptDate,
        time: apptTime,
        purpose: apptPurpose,
        notes: apptNotes,
        country: 'China',
        visaType: apptPurpose,
      });

      setSuccessMsg('Your appointment slot has been scheduled successfully!');
      setApptDate('');
      setApptNotes('');
      await loadDashboardData();
    } catch (error) {
      setErrorMsg(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const getTodayString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const getAppointmentStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-badge--paid';
      case 'cancelled':
        return 'status-badge--cancelled';
      case 'scheduled':
      default:
        return 'status-badge--pending';
    }
  };

  const getAppointmentStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'scheduled':
      default:
        return 'Scheduled';
    }
  };

  const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="container">
          <p className="dashboard__role">Customer Portal</p>
          <h1 className="dashboard__welcome">Welcome, {user?.name || 'Customer'}</h1>
        </div>
      </div>

      <div className="container dashboard__content">
        <div className="dashboard__stats">
          <div className="dash-stat"><div className="dash-stat__value">{applications.length}</div><div className="dash-stat__label">Applications</div></div>
          <div className="dash-stat"><div className="dash-stat__value">{applications.filter((a) => a.status === 'Processing').length}</div><div className="dash-stat__label">In Progress</div></div>
          <div className="dash-stat"><div className="dash-stat__value">{invoices.length}</div><div className="dash-stat__label">Invoices</div></div>
          <div className="dash-stat"><div className="dash-stat__value">{appointments.length}</div><div className="dash-stat__label">Appointments</div></div>
        </div>

        <div className="dashboard__tabs">
          <button className={`dashboard__tab ${tab === 'status' ? 'dashboard__tab--active' : ''}`} onClick={() => setTab('status')}>Application Status</button>
          <button className={`dashboard__tab ${tab === 'invoices' ? 'dashboard__tab--active' : ''}`} onClick={() => setTab('invoices')}>My Invoices</button>
          <button className={`dashboard__tab ${tab === 'appointments' ? 'dashboard__tab--active' : ''}`} onClick={() => setTab('appointments')}>Book Appointment</button>
          <button className={`dashboard__tab ${tab === 'documents' ? 'dashboard__tab--active' : ''}`} onClick={() => setTab('documents')}>Documents</button>
        </div>

        {tab === 'status' && (
          <div className="dashboard__panel">
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Application Status</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Application #</th><th>Country</th><th>Visa Type</th><th>Submitted</th><th>Last Updated</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No live application records found yet.</td></tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id}>
                        <td><strong>{app.id}</strong></td>
                        <td>{app.country}</td>
                        <td>{app.visaType}</td>
                        <td>{app.submitted}</td>
                        <td>{app.updated}</td>
                        <td><span className={`status-badge ${app.status === 'Approved' ? 'status-badge--paid' : 'status-badge--pending'}`}>{app.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'invoices' && (
          <div className="dashboard__panel">
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>My Invoices</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Invoice #</th><th>Country</th><th>Visa Type</th><th>Amount (NPR)</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No invoices found for your account.</td></tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>{inv.id}</strong></td>
                        <td>{inv.country}</td>
                        <td>{inv.visaType}</td>
                        <td>{formatCurrency(inv.total ?? inv.amount, inv.currency)}</td>
                        <td>{inv.date}</td>
                        <td><span className={`status-badge status-badge--${inv.status}`}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span></td>
                        <td>
                          <button className="btn btn--sm btn--outline" onClick={() => { setSelectedInvoice(inv); setShowPdfModal(true); }} title="Download / Print PDF">
                            Download / Print
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

        {tab === 'appointments' && (
          <div className="dashboard__panel" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Schedule Office Visit</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Select a slot to meet our visa consultants at our Kathmandu office. (Office hours: Sun-Fri 10:00 AM - 5:00 PM).
              </p>

              {successMsg && (
                <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleBookAppointment}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Purpose of Visit *</label>
                  <select className="form-select" value={apptPurpose} onChange={(e) => setApptPurpose(e.target.value)}>
                    <option value="Consultation">Consultation & Form Filling</option>
                    <option value="Document Handover">Original Passport Handover</option>
                    <option value="Biometrics Support">Biometrics Submission Scheduling</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Pick Appointment Date *</label>
                  <input type="date" className="form-input" min={getTodayString()} value={apptDate} onChange={(e) => setApptDate(e.target.value)} required />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Available Time Slots *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`btn btn--sm ${apptTime === slot ? 'btn--primary' : 'btn--outline'}`}
                        onClick={() => setApptTime(slot)}
                        style={{ padding: '0.5rem' }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Special Notes / Inquiries</label>
                  <textarea className="form-textarea" placeholder="Provide any additional details or requirements..." value={apptNotes} onChange={(e) => setApptNotes(e.target.value)} style={{ minHeight: '80px' }}></textarea>
                </div>

                <button type="submit" className={`btn btn--primary btn--lg ${bookingLoading ? 'btn--loading' : ''}`} style={{ width: '100%' }} disabled={bookingLoading}>
                  {bookingLoading ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </div>

            <div style={{ borderLeft: '1px solid var(--color-border-light)', paddingLeft: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Your Appointments</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '420px' }}>
                {appointments.length === 0 ? (
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>No active bookings.</p>
                ) : (
                  appointments.map((appt) => (
                    <div key={appt.id} style={{
                      padding: '1rem', borderRadius: '8px', background: 'var(--color-surface-alt)',
                      border: '1px solid var(--color-border-light)', position: 'relative'
                    }}>
                      <span className={`status-badge ${getAppointmentStatusClass(appt.status)}`} style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.65rem' }}>
                        {getAppointmentStatusLabel(appt.status)}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: 'var(--color-primary)' }}>{appt.purpose}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', margin: '0.2rem 0' }}><strong>Date:</strong> {appt.date} ({appt.time})</p>
                      <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0.2rem 0' }}>ID: {appt.id}</p>
                      {appt.status === 'completed' && (
                        <p style={{ fontSize: '0.78rem', color: '#10B981', marginTop: '0.5rem', fontWeight: 600 }}>
                          Your office visit has been marked as completed by our team.
                        </p>
                      )}
                      {appt.status === 'cancelled' && (
                        <p style={{ fontSize: '0.78rem', color: '#EF4444', marginTop: '0.5rem', fontWeight: 600 }}>
                          This appointment was cancelled. Please book a new slot or contact the office for help.
                        </p>
                      )}
                      {appt.notes && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.5rem', background: 'var(--color-surface)', padding: '0.5rem', borderRadius: '4px' }}>"{appt.notes}"</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <div className="dashboard__panel">
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Upload Documents</h3>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
              Upload required documents for your visa application. Accepted formats: PDF, JPG, PNG (max 5MB each).
            </p>
            <div style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Documents</p>
              <p style={{ fontWeight: 'var(--fw-semibold)' }}>Drag & drop files here</p>
              <p style={{ color: 'var(--color-text-light)', fontSize: 'var(--fs-small)', marginBottom: '1rem' }}>or click to browse</p>
              <button className="btn btn--outline btn--sm">Browse Files</button>
            </div>
          </div>
        )}
      </div>

      {showPdfModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPdfModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '650px',
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
                  <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', margin: 0, fontSize: '1.75rem' }}>PRO FORMA INVOICE</h2>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0.2rem 0' }}>{COMPANY.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>Hattisar, Kathmandu | {COMPANY.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-accent)' }}>{selectedInvoice.id}</h3>
                  <p style={{ fontSize: '0.85rem', margin: '0.2rem 0' }}><strong>Date:</strong> {selectedInvoice.date}</p>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: selectedInvoice.status === 'paid' ? '#10B981' : '#F59E0B' }}>{selectedInvoice.status}</span></p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem' }}>BILL TO:</h4>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Client Name:</strong> {selectedInvoice.client}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Passport Number:</strong> {selectedInvoice.passport}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Email:</strong> {selectedInvoice.email || 'N/A'}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.25rem' }}>SERVICE DETAILS:</h4>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Country:</strong> {selectedInvoice.country}</p>
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}><strong>Visa Type:</strong> {selectedInvoice.visaType}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#F3F4F6', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.85rem' }}>Description</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.85rem', textAlign: 'right' }}>Total (NPR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem' }}>
                      Visa Processing Services - {selectedInvoice.country} ({selectedInvoice.visaType})<br />
                      <small style={{ color: '#6B7280' }}>Includes documentation assistance, verification, and submission handling.</small>
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatCurrency(selectedInvoice.total ?? selectedInvoice.amount, selectedInvoice.currency)}
                    </td>
                  </tr>
                  {selectedInvoice.notes && (
                    <tr>
                      <td colSpan="2" style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic', background: '#F9FAFB' }}>
                        <strong>Notes:</strong> {selectedInvoice.notes}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid #E5E7EB' }}>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem' }}>Grand Total:</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-primary)' }}>
                      {formatCurrency(selectedInvoice.total ?? selectedInvoice.amount, selectedInvoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                  <div style={{ borderBottom: '1px solid #6B7280', width: '150px', height: '40px', margin: '0 auto' }}></div>
                  <p style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '0.5rem' }}>Prepared By (Authorized Sign)</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                  <div style={{ borderBottom: '1px solid #6B7280', width: '150px', height: '40px', margin: '0 auto' }}></div>
                  <p style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '0.5rem' }}>Client Signature</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <button className="btn btn--outline" onClick={() => downloadInvoiceDocument(normalizeInvoice(selectedInvoice), COMPANY)}>Download Invoice</button>
              <button className="btn btn--primary" onClick={() => window.print()}>Print Invoice</button>
              <button className="btn btn--outline" onClick={() => setShowPdfModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
