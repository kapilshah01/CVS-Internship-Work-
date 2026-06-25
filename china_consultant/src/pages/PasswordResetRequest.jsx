import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dbRequestPasswordReset, isSupabaseConfigured } from '../utils/db';

export default function PasswordResetRequest({
  role = 'employee',
  loginPath = '/employee/login',
  registerPath = '/register',
  title = 'Reset Password',
  subtitle = 'Enter your work email and we will send you a reset link.',
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ loading: false, error: '', success: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (state.loading) return;

    setState({ loading: true, error: '', success: '' });
    const result = await dbRequestPasswordReset(email, role);

    if (!result.success) {
      setState({ loading: false, error: result.message, success: '' });
      return;
    }

    setState({ loading: false, error: '', success: result.message });
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

        {!isSupabaseConfigured && (
          <div className="form-error" style={{ marginBottom: '1rem' }}>
            Supabase keys are missing. Add them to `.env` before using password reset.
          </div>
        )}

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
            <label className="form-label" htmlFor="reset-email">Work Email</label>
            <input
              className="form-input"
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={state.loading || !isSupabaseConfigured}
            />
          </div>
          <button
            type="submit"
            className={`btn btn--primary btn--lg ${state.loading ? 'btn--loading' : ''}`}
            style={{ width: '100%' }}
            disabled={state.loading || !isSupabaseConfigured}
          >
            {state.loading ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-card__footer">
          Need account access instead? <Link to={registerPath}>Register here</Link>
        </div>
      </div>
    </div>
  );
}
