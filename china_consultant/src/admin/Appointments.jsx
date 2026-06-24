import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { dbDeleteAppointment, dbGetAppointments, dbUpdateAppointmentStatus } from '../utils/db';

export default function Appointments({ user }) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: '', saving: '' });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      setRows(await dbGetAppointments({ search }));
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load appointments.' }));
    }
  };

  useEffect(() => { load(); }, [search]);

  const updateStatus = async (id, status) => {
    setState((prev) => ({ ...prev, saving: id }));
    try {
      await dbUpdateAppointmentStatus(id, status);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to update appointment.', saving: '' }));
    }
  };

  const remove = async (id) => {
    setState((prev) => ({ ...prev, saving: id }));
    try {
      await dbDeleteAppointment(id);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to delete appointment.', saving: '' }));
    }
  };

  return (
    <AdminShell user={user} title="Appointments" subtitle="Manage office bookings from customers and the public site.">
      <div className="dashboard__panel">
        {state.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
        <div className="search-bar">
          <input className="form-input" placeholder="Search appointments..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Country</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading appointments...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No appointments found.</td></tr>
              ) : rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.clientName}</td>
                  <td>{item.country}</td>
                  <td>{item.date}</td>
                  <td>{item.time}</td>
                  <td>
                    <select className="form-select" value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} disabled={state.saving === item.id}>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn--sm btn--outline" style={{ color: '#b91c1c', borderColor: '#b91c1c' }} onClick={() => remove(item.id)} disabled={state.saving === item.id}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
