import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { dbDeleteUserProfile, dbGetUsers, dbUpdateUserStatus } from '../utils/db';

export default function Employees({ user }) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: '', saving: '' });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const employeeData = await dbGetUsers({ search, role: 'employee' });
      setRows(employeeData);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState({ loading: false, error: error.message || 'Failed to load employees.', saving: '' });
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleStatus = async (email, status) => {
    setState((prev) => ({ ...prev, saving: email, error: '' }));
    try {
      await dbUpdateUserStatus(email, status);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to update employee status.', saving: '' }));
    }
  };

  const handleRemove = async (id) => {
    setState((prev) => ({ ...prev, saving: id, error: '' }));
    try {
      await dbDeleteUserProfile(id);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to remove employee.', saving: '' }));
    }
  };

  return (
    <AdminShell user={user} title="Employees" subtitle="See all employee details and control office access.">
      <div className="dashboard__panel">
        {state.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
        <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Employee Directory</h3>
        <div className="search-bar">
          <input
            className="form-input"
            placeholder="Search employees by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading employees...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No employees found.</td></tr>
              ) : rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.phone || '-'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.role}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.status}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn--sm btn--outline"
                        onClick={() => handleStatus(item.email, item.status === 'active' ? 'rejected' : 'active')}
                        disabled={state.saving === item.email}
                      >
                        {item.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                      <button
                        className="btn btn--sm btn--outline"
                        style={{ color: '#b91c1c', borderColor: '#b91c1c' }}
                        onClick={() => handleRemove(item.id)}
                        disabled={state.saving === item.id || item.id === user?.id}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
          `Block` disables employee login. `Remove` deletes the employee profile from the admin workspace and prevents app login.
        </p>
      </div>
    </AdminShell>
  );
}
