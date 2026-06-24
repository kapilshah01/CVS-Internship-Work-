import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { dbGetAppointments, dbGetClients, dbGetInquiries, dbGetInvoices, dbGetUsers } from '../utils/db';

export default function Dashboard({ user }) {
  const [state, setState] = useState({
    loading: true,
    error: '',
    users: [],
    clients: [],
    inquiries: [],
    appointments: [],
    invoices: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [users, clients, inquiries, appointments, invoices] = await Promise.all([
          dbGetUsers(),
          dbGetClients(),
          dbGetInquiries(),
          dbGetAppointments(),
          dbGetInvoices(),
        ]);
        setState({ loading: false, error: '', users, clients, inquiries, appointments, invoices });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load dashboard.' }));
      }
    };
    load();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const pendingApplications = state.inquiries.filter((item) => item.status === 'new' || item.status === 'reviewing').length;
  const recentActivities = [
    ...state.inquiries.slice(0, 3).map((item) => ({ id: item.id, text: `Inquiry from ${item.fullName}`, time: item.createdAt })),
    ...state.appointments.slice(0, 3).map((item) => ({ id: item.id, text: `Appointment booked by ${item.clientName}`, time: item.created_at || item.createdDate })),
    ...state.invoices.slice(0, 3).map((item) => ({ id: item.id, text: `Invoice ${item.id} for ${item.client}`, time: item.issueDate || item.date })),
  ]
    .sort((a, b) => String(b.time).localeCompare(String(a.time)))
    .slice(0, 6);

  const stats = [
    { label: 'Total clients', value: state.clients.length },
    { label: 'Total inquiries', value: state.inquiries.length },
    { label: 'Appointments today', value: state.appointments.filter((item) => item.date === today).length },
    { label: 'Pending applications', value: pendingApplications },
  ];

  return (
    <AdminShell user={user} title="Dashboard" subtitle="Live operations overview from Supabase.">
      {state.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
      {state.loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          <div className="dashboard__stats">
            {stats.map((item) => (
              <div className="dash-stat" key={item.label}>
                <div className="dash-stat__value">{item.value}</div>
                <div className="dash-stat__label">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="dashboard__panel">
            <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Recent Activities</h3>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {recentActivities.map((activity) => (
                <div key={activity.id} style={{ padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', background: 'var(--color-surface-alt)' }}>
                  <strong style={{ display: 'block' }}>{activity.text}</strong>
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>{String(activity.time || '').slice(0, 16)}</span>
                </div>
              ))}
              {recentActivities.length === 0 && <p style={{ color: 'var(--color-text-light)' }}>No recent activity yet.</p>}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
