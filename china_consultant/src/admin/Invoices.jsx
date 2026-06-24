import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { dbDeleteInvoice, dbGetInvoices, dbUpdateInvoiceStatus } from '../utils/db';
import { formatCurrency } from '../utils/invoice';

export default function Invoices({ user }) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: '', saving: '' });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      setRows(await dbGetInvoices({ search }));
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load invoices.' }));
    }
  };

  useEffect(() => { load(); }, [search]);

  const updateStatus = async (id, status) => {
    setState((prev) => ({ ...prev, saving: id }));
    try {
      await dbUpdateInvoiceStatus(id, status);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to update invoice.', saving: '' }));
    }
  };

  const remove = async (id) => {
    setState((prev) => ({ ...prev, saving: id }));
    try {
      await dbDeleteInvoice(id);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to delete invoice.', saving: '' }));
    }
  };

  return (
    <AdminShell user={user} title="Invoices" subtitle="Track generated invoices and payment progress.">
      <div className="dashboard__panel">
        {state.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
        <div className="search-bar">
          <input className="form-input" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Country</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading invoices...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</td></tr>
              ) : rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.client}</td>
                  <td>{item.country}</td>
                  <td>{formatCurrency(item.total ?? item.amount, item.currency)}</td>
                  <td>
                    <select className="form-select" value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)} disabled={state.saving === item.id}>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
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
