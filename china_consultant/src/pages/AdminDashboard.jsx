import { useState, useEffect } from 'react';
import { COMPANY } from '../data/siteData';
import {
  dbGetUsers,
  dbUpdateUserStatus,
  dbGetInvoices,
  dbUpdateInvoiceStatus,
  dbGetAppointments,
  dbUpdateAppointmentStatus,
} from '../utils/db';
import { downloadInvoiceDocument, formatCurrency } from '../utils/invoice';

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState({ role: '', status: '', query: '' });
  const [appointmentFilter, setAppointmentFilter] = useState({ query: '', status: '', date: '' });

  const loadData = async () => {
    const [fetchedUsers, fetchedInvoices, fetchedAppointments] = await Promise.all([
      dbGetUsers(),
      dbGetInvoices(),
      dbGetAppointments(),
    ]);
    setUsers(fetchedUsers);
    setInvoices(fetchedInvoices);
    setAppointments(fetchedAppointments);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveUser = async (email) => {
    await dbUpdateUserStatus(email, 'active');
    await loadData();
  };

  const handleRejectUser = async (email) => {
    await dbUpdateUserStatus(email, 'rejected');
    await loadData();
  };

  const handleUpdateInvoiceStatus = async (id, newStatus) => {
    await dbUpdateInvoiceStatus(id, newStatus);
    await loadData();
  };

  const handleUpdateAppointmentStatus = async (id, newStatus) => {
    await dbUpdateAppointmentStatus(id, newStatus);
    await loadData();
  };

  const handleDownloadInvoice = (invoice) => {
    downloadInvoiceDocument(invoice, COMPANY);
  };

  const filteredUsers = users.filter((member) => {
    const query = userFilter.query.toLowerCase();
    const matchQuery =
      !query ||
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query);
    const matchRole = !userFilter.role || member.role === userFilter.role;
    const matchStatus = !userFilter.status || member.status === userFilter.status;
    return matchQuery && matchRole && matchStatus;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchQuery = !searchQuery || 
      inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.passport.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const filteredAppointments = appointments.filter((appt) => {
    const query = appointmentFilter.query.toLowerCase();
    const matchQuery =
      !query ||
      (appt.clientName || '').toLowerCase().includes(query) ||
      (appt.email || '').toLowerCase().includes(query) ||
      (appt.id || '').toLowerCase().includes(query);
    const matchStatus = !appointmentFilter.status || appt.status === appointmentFilter.status;
    const matchDate = !appointmentFilter.date || appt.date === appointmentFilter.date;
    return matchQuery && matchStatus && matchDate;
  });

  const totalRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const stats = [
    { label: 'Total Users', value: users.length },
    { label: 'Employees', value: users.filter((u) => u.role === 'employee').length },
    { label: 'Total Invoices', value: invoices.length },
    { label: 'Total Revenue (NPR)', value: formatCurrency(totalRevenue) },
    { label: 'Appointments', value: appointments.length },
    { label: 'Pending Approvals', value: users.filter((u) => u.status === 'pending').length },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="container">
          <p className="dashboard__role">Administrator</p>
          <h1 className="dashboard__welcome">Admin Panel</h1>
        </div>
      </div>

      <div className="container dashboard__content">
        {/* Stats Grid */}
        <div className="dashboard__stats">
          {stats.map((s, i) => (
            <div className="dash-stat" key={i}>
              <div className="dash-stat__value">{s.value}</div>
              <div className="dash-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard Tabs */}
        <div className="dashboard__tabs">
          <button className={`dashboard__tab ${tab === 'overview' ? 'dashboard__tab--active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`dashboard__tab ${tab === 'users' ? 'dashboard__tab--active' : ''}`} onClick={() => setTab('users')}>User Management</button>
          <button className={`dashboard__tab ${tab === 'appointments' ? 'dashboard__tab--active' : ''}`} onClick={() => setTab('appointments')}>Appointments</button>
          <button className={`dashboard__tab ${tab === 'invoices' ? 'dashboard__tab--active' : ''}`} onClick={() => setTab('invoices')}>All Invoices</button>
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="dashboard__panel">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Business Snapshot</strong>
                <span style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                  {users.filter((u) => u.role === 'customer').length} customers, {appointments.filter((a) => a.status === 'scheduled').length} scheduled visits, {invoices.filter((i) => i.status === 'pending').length} pending invoices.
                </span>
              </div>
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
                <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Approvals Needed</strong>
                <span style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                  {users.filter((u) => u.status === 'pending').length} accounts are waiting for admin review.
                </span>
              </div>
            </div>
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Recent Activity Invoices</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Amount (NPR)</th>
                    <th>Date</th>
                    <th>Passport</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id}>
                      <td><strong>{inv.id}</strong></td>
                      <td>{inv.client}</td>
                      <td>{formatCurrency(inv.total ?? inv.amount, inv.currency)}</td>
                      <td>{inv.date}</td>
                      <td>{inv.passport}</td>
                      <td>
                        <span className={`status-badge status-badge--${inv.status}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No invoices found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {tab === 'users' && (
          <div className="dashboard__panel">
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>User Accounts</h3>
            <div className="search-bar">
              <input
                className="form-input"
                placeholder="Search by name or email..."
                value={userFilter.query}
                onChange={(e) => setUserFilter({ ...userFilter, query: e.target.value })}
              />
              <select className="form-select" value={userFilter.role} onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value })}>
                <option value="">All Roles</option>
                <option value="customer">Customer</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
              <select className="form-select" value={userFilter.status} onChange={(e) => setUserFilter({ ...userFilter, status: e.target.value })}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, index) => (
                    <tr key={index}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                      <td>
                        <span className={`status-badge ${u.status === 'active' ? 'status-badge--paid' : 'status-badge--pending'}`}>
                          {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {u.status === 'pending' && (
                            <>
                              <button className="btn btn--sm btn--primary" onClick={() => handleApproveUser(u.email)}>Approve</button>
                              <button className="btn btn--sm btn--outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleRejectUser(u.email)}>Reject</button>
                            </>
                          )}
                          {u.status === 'active' && u.email !== user.email && (
                            <button className="btn btn--sm btn--outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleRejectUser(u.email)}>Deactivate</button>
                          )}
                          {u.status === 'rejected' && (
                            <button className="btn btn--sm btn--outline" onClick={() => handleApproveUser(u.email)}>Re-activate</button>
                          )}
                          {u.email === user.email && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>(You)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No users match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="dashboard__panel">
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>All Appointments</h3>
            <div className="search-bar">
              <input
                className="form-input"
                placeholder="Search by client, email, or appointment ID..."
                value={appointmentFilter.query}
                onChange={(e) => setAppointmentFilter({ ...appointmentFilter, query: e.target.value })}
              />
              <select
                className="form-select"
                value={appointmentFilter.status}
                onChange={(e) => setAppointmentFilter({ ...appointmentFilter, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                className="form-input"
                type="date"
                value={appointmentFilter.date}
                onChange={(e) => setAppointmentFilter({ ...appointmentFilter, date: e.target.value })}
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
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td><strong>{appt.id}</strong></td>
                      <td>{appt.clientName || 'N/A'}</td>
                      <td>{appt.email || 'N/A'}</td>
                      <td>{appt.date}</td>
                      <td>{appt.time}</td>
                      <td>{appt.country || 'China'}</td>
                      <td>{appt.purpose || 'Consultation'}</td>
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
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No appointments match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Invoices Tab */}
        {tab === 'invoices' && (
          <div className="dashboard__panel">
            <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>All Generated Invoices</h3>
            <div className="search-bar">
              <input 
                className="form-input" 
                placeholder="Search by client name, passport, invoice ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
              </select>
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
                    <th>Amount (NPR)</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><strong>{inv.id}</strong></td>
                      <td>{inv.client}</td>
                      <td>{inv.passport}</td>
                      <td>{inv.country}</td>
                      <td>{inv.visaType}</td>
                      <td>{formatCurrency(inv.total ?? inv.amount, inv.currency)}</td>
                      <td>{inv.date}</td>
                      <td>
                        <select 
                          className="form-select" 
                          style={{ padding: '2px 8px', fontSize: '0.75rem', width: 'auto' }}
                          value={inv.status}
                          onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                        >
                          <option value="draft">Draft</option>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                      <td>
                        <button className="btn btn--sm btn--outline" onClick={() => handleDownloadInvoice(inv)}>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>No invoices match search criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
