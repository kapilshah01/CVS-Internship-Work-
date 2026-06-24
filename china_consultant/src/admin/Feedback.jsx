import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { dbDeleteFeedback, dbGetFeedback } from '../utils/db';

export default function Feedback({ user }) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: '', saving: '' });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await dbGetFeedback({ search });
      setRows(data);
      setState((prev) => ({ ...prev, loading: false, saving: '' }));
    } catch (error) {
      setState({ loading: false, error: error.message || 'Failed to load feedback.', saving: '' });
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleDelete = async (id) => {
    setState((prev) => ({ ...prev, saving: id, error: '' }));
    try {
      await dbDeleteFeedback(id);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to delete feedback.', saving: '' }));
    }
  };

  return (
    <AdminShell user={user} title="Feedback" subtitle="Client comments collected from the website.">
      <div className="dashboard__panel">
        {state.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
        <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Client Feedback</h3>
        <div className="search-bar">
          <input
            className="form-input"
            placeholder="Search by name, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {state.loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading feedback...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-light)' }}>No feedback found.</div>
          ) : rows.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid var(--color-border-light)',
                borderRadius: '14px',
                padding: '1rem',
                background: 'var(--color-surface-alt)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div>
                  <strong style={{ display: 'block' }}>{item.fullName}</strong>
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>{item.email}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>{String(item.createdAt || '').slice(0, 16)}</span>
                </div>
              </div>
              <p style={{ margin: '0 0 1rem 0', lineHeight: 1.7 }}>{item.message}</p>
              <button
                className="btn btn--sm btn--outline"
                style={{ color: '#b91c1c', borderColor: '#b91c1c' }}
                onClick={() => handleDelete(item.id)}
                disabled={state.saving === item.id}
              >
                Delete Feedback
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
