import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dbUpdatePassword } from '../utils/db';
import { requireSupabase } from '../lib/supabase';

export default function ResetPassword({
  loginPath = '/employee/login',
  title = 'Choose a New Password',
  subtitle = 'Open this page from the reset email, then set a fresh password.',
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [state, setState] = useState({ loading: false, checking: true, error: '', success: '' });

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      try {
        const client = requireSupabase();
        const { data, error } = await client.auth.getSession();

        if (error) throw error;

        if (mounted) {
          setState((prev) => ({
            ...prev,
            checking: false,
            error: data.session ? '' : 'This reset link is invalid or expired. Please request a new one.',
          }));
        }
      } catch (error) {
        if (mounted) {
          setState((prev) => ({
            ...prev,
            checking: false,
            error: error.message || 'Unable to validate the reset link.',
          }));
        }
      }
    };

    checkRecoverySession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (state.loading) return;

    if (form.password.length < 6) {
      setState((prev) => ({ ...prev, error: 'Password must be at least 6 characters.', success: '' }));
      return;
    }

    if (form.password !== form.confirm) {
      setState((prev) => ({ ...prev, error: 'Passwords do not match.', success: '' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: '', success: '' }));
    const result = await dbUpdatePassword(form.password);

    if (!result.success) {
      setState((prev) => ({ ...prev, loading: false, error: result.message, success: '' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: false, error: '', success: result.message }));
    window.setTimeout(() => navigate(loginPath), 1500);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to={loginPath}
            style={{
              color: 'var(--color-text-light)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            Back to sign in
          </Link>
        </div>

        <div className="auth-card__header">
          <div className="auth-card__logo">
            <span className="navbar__logo-icon">CV</span>
            China Visa Service
          </div>
          <h1 className="auth-card__title">{title}</h1>
          <p className="auth-card__subtitle">{subtitle}</p>
        </div>

        {state.error && (
          <div className="form-error" style={{ marginBottom: '1rem' }}>
            {state.error}
          </div>
        )}

        {state.success && (
          <div style={{
            padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px',
            background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.875rem',
            border: '1px solid rgba(16,185,129,0.2)'
          }}>
            {state.success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">New Password</label>
            <input
              className="form-input"
              id="new-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              disabled={state.loading || state.checking || Boolean(state.success)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
            <input
              className="form-input"
              id="confirm-password"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
              disabled={state.loading || state.checking || Boolean(state.success)}
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn--primary btn--lg ${state.loading ? 'btn--loading' : ''}`}
            style={{ width: '100%' }}
            disabled={state.loading || state.checking || Boolean(state.success)}
          >
            {state.checking ? 'Checking reset link...' : state.loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
