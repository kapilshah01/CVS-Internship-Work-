import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { serviceCatalogService } from '../services/serviceCatalogService';

const emptyForm = { title: '', description: '', icon: '', sortOrder: 0, active: true };

export default function Services({ user }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [state, setState] = useState({ loading: true, error: '', saving: false });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      setRows(await serviceCatalogService.getAll());
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load services.' }));
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (state.saving) return;

    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      if (editingId) {
        await serviceCatalogService.update(editingId, form);
      } else {
        await serviceCatalogService.create(form);
      }
      setForm(emptyForm);
      setEditingId('');
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to save service.', saving: false }));
      return;
    }
    setState((prev) => ({ ...prev, saving: false }));
  };

  const remove = async (id) => {
    setState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await serviceCatalogService.delete(id);
      await load();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || 'Failed to delete service.', saving: false }));
    }
  };

  return (
    <AdminShell user={user} title="Services" subtitle="Manage the service catalog shown across the business.">
      <div className="dashboard__panel" style={{ marginBottom: '1rem' }}>
        {state.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{state.error}</div>}
        <form className="invoice-form" onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <input className="form-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. 🛂" />
          </div>
          <div className="form-group form-group--full">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Sort Order</label>
            <input className="form-input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Active</label>
            <select className="form-select" value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="form-group form-group--full">
            <button type="submit" className="btn btn--primary" disabled={state.saving}>
              {editingId ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
      <div className="dashboard__panel">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Icon</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading services...</td></tr>
              ) : rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.icon || '-'}</td>
                  <td>{item.sort_order}</td>
                  <td>{item.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn--sm btn--outline" onClick={() => { setEditingId(item.id); setForm({ title: item.title, description: item.description, icon: item.icon || '', sortOrder: item.sort_order, active: item.active }); }}>
                        Edit
                      </button>
                      <button className="btn btn--sm btn--outline" style={{ color: '#b91c1c', borderColor: '#b91c1c' }} onClick={() => remove(item.id)}>
                        Delete
                      </button>
                    </div>
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
