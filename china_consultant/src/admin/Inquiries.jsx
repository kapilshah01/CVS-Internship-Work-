import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { dbDeleteInquiry, dbGetInquiries, dbUpdateInquiry } from '../utils/db';

export default function Inquiries({ user }) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: '', saving: '' });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      setRows(await dbGetInquiries({ search }));
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load inquiries.' }));
    }
  };

  useEffect(() => { load(); }, [search]);

  const updateStatus = async (id, status) => {
    setState((prev) => ({ ...prev, saving: id }));
    try {
      await dbUpdateInquiry(id, { status });
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to update inquiry.', saving: '' }));
    }
  };

  const remove = async (id) => {
    setState((prev) => ({ ...prev, saving: id }));
    try {
      await dbDeleteInquiry(id);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to delete inquiry.', saving: '' }));
    }
  };

  return (
    <AdminShell user={user} title="Inquiries" subtitle="Review and update incoming visa inquiries.">
      <div className="dashboard__panel">
        {state.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
        <div className="search-bar">
          <input className="form-input" placeholder="Search inquiries..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading inquiries...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No inquiries found.</td></tr>
              ) : rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.fullName}</td>
                  <td>{item.email}</td>
                  <td>{item.country || '-'}</td>
                  <td style={{ maxWidth: '260px' }}>{item.subject}</td>
                  <td>
                    <select className="form-select" value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} disabled={state.saving === item.id}>
                      <option value="new">New</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
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
