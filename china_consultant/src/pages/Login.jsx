import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COMPANY } from '../data/siteData';

import {
  dbLoginUser,
} from '../utils/db';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      const res = await dbLoginUser(form.email, form.password, 'employee');
      if (!res.success) {
        setError(res.message);
        return;
      }

      const user = res.user;
      if (onLogin) onLogin(user);
      navigate('/employee/dashboard');
    } finally {
      setIsSubmitting(false);
    }
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
            {COMPANY.shortName}
          </div>
          <h1 className="auth-card__title">Employee Login</h1>
          <p className="auth-card__subtitle">Sign in to access appointments, inquiries, and invoice tools.</p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '0.875rem',
            border: '1px solid rgba(239,68,68,0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              className="form-input"
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              className="form-input"
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className={`btn btn--primary btn--lg ${isSubmitting ? 'btn--loading' : ''}`}
            style={{ width: '100%' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner" aria-hidden="true"></span>
                Signing In...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '1.25rem', padding: '0.75rem', borderRadius: '8px',
          background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)',
          fontSize: '0.75rem', color: 'var(--color-text-light)', lineHeight: '1.4'
        }}>
          <strong>Staff-only access:</strong> visitors submit forms from the public website. Only approved employee accounts can sign in here.
        </div>

        <div className="auth-card__footer">
          <Link to="/employee/forgot-password">Forgot password?</Link>
          <br />
          Need a staff account?{' '}
          <Link to="/register">Register here</Link>
          <br />
          Need administrator access?{' '}
          <Link to="/admin/login">Open admin login</Link>
        </div>
      </div>
    </div>
  );
}
