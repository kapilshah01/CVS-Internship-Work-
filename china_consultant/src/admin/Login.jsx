import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dbLoginUser, isSupabaseConfigured } from '../utils/db';

export default function AdminLogin({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [state, setState] = useState({ loading: false, error: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (state.loading) return;

    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const result = await dbLoginUser(form.email, form.password, 'admin');
      if (!result.success) {
        setState((prev) => ({ ...prev, loading: false, error: result.message }));
        return;
      }
      onLogin?.(result.user);
      navigate('/admin/dashboard');
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Login failed.' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: false, error: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to="/"
            style={{
              color: 'var(--color-text-light)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            ← Back to website
          </Link>
        </div>

        <div className="auth-card__header">
          <div className="auth-card__logo">
            <span className="navbar__logo-icon">CV</span>
            China Visa Service
          </div>
          <h1 className="auth-card__title">Admin Login</h1>
          <p className="auth-card__subtitle">Access live records, approvals, and operations.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="form-error" style={{ marginBottom: '1rem' }}>
            Supabase keys are missing. Add them to `.env` before using admin login.
          </div>
        )}

        {state.error && (
          <div className="form-error" style={{ marginBottom: '1rem' }}>
            {state.error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-login-email">Email</label>
            <input className="form-input" id="admin-login-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-login-password">Password</label>
            <input className="form-input" id="admin-login-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className={`btn btn--primary btn--lg ${state.loading ? 'btn--loading' : ''}`} style={{ width: '100%' }} disabled={state.loading || !isSupabaseConfigured}>
            {state.loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '1.25rem', padding: '0.9rem', borderRadius: '10px',
          background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)',
          fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.55'
        }}>
          <strong style={{ color: 'var(--color-text)' }}>Admin Access</strong>
          <div style={{ marginTop: '0.45rem' }}>Use `/admin/register` for new admin setup.</div>
          <div>Admin registration requires the administrator access code and email verification.</div>
          <div>After verification, sign in here to manage employees, clients, appointments, invoices, and services.</div>
        </div>

        <div className="auth-card__footer">
          <Link to="/admin/forgot-password">Forgot password?</Link>
          <br />
          Need a new admin account? <Link to="/admin/register">Register admin</Link>
          <br />
          Need employee access? <Link to="/employee/login">Open employee login</Link>
        </div>
      </div>
    </div>
  );
}
