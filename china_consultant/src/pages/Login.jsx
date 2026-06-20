import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COMPANY } from '../data/siteData';

import {
  dbLoginUser,
  dbRequestAdminPasswordReset,
  dbConfirmAdminPasswordReset,
} from '../utils/db';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetForm, setResetForm] = useState({
    email: '',
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetStatus, setResetStatus] = useState({ error: '', success: '', demoCode: '', requested: false });
  const [isResetting, setIsResetting] = useState(false);

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
      const res = await dbLoginUser(form.email, form.password, form.role);
      if (!res.success) {
        setError(res.message);
        return;
      }

      const user = res.user;
      if (onLogin) onLogin(user);

      switch (user.role) {
        case 'employee': navigate('/employee-dashboard'); break;
        case 'admin': navigate('/admin-dashboard'); break;
        default: navigate('/customer-dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResetModal = () => {
    setResetForm({
      email: form.role === 'admin' ? form.email : '',
      phone: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    });
    setResetStatus({ error: '', success: '', demoCode: '', requested: false });
    setShowResetModal(true);
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setResetStatus({ error: '', success: '', demoCode: '', requested: false });

    if (!resetForm.email || !resetForm.phone) {
      setResetStatus({ error: 'Please enter administrator email and phone number.', success: '', demoCode: '', requested: false });
      return;
    }

    setIsResetting(true);
    try {
      const result = await dbRequestAdminPasswordReset(resetForm.email, resetForm.phone);
      if (!result.success) {
        setResetStatus({ error: result.message, success: '', demoCode: '', requested: false });
        return;
      }

      setResetStatus({
        error: '',
        success: `Verification code sent to ${result.maskedPhone}.`,
        demoCode: result.demoCode,
        requested: true,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setResetStatus((prev) => ({ ...prev, error: '', success: prev.success }));

    if (!resetForm.code || !resetForm.newPassword || !resetForm.confirmPassword) {
      setResetStatus((prev) => ({ ...prev, error: 'Please fill in the verification code and new password.' }));
      return;
    }
    if (resetForm.newPassword.length < 6) {
      setResetStatus((prev) => ({ ...prev, error: 'Password must be at least 6 characters.' }));
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetStatus((prev) => ({ ...prev, error: 'Passwords do not match.' }));
      return;
    }

    setIsResetting(true);
    try {
      const result = await dbConfirmAdminPasswordReset(
        resetForm.email,
        resetForm.code,
        resetForm.newPassword
      );
      if (!result.success) {
        setResetStatus((prev) => ({ ...prev, error: result.message }));
        return;
      }

      setResetStatus((prev) => ({
        ...prev,
        error: '',
        success: 'Administrator password reset successfully. You can sign in now.',
      }));
      setResetForm((prev) => ({
        ...prev,
        code: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo">
            <span className="navbar__logo-icon">CV</span>
            {COMPANY.shortName}
          </div>
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Sign in to access your account</p>
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

          <div className="form-group">
            <label className="form-label" htmlFor="login-role">Login As</label>
            <select
              className="form-select"
              id="login-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={isSubmitting}
            >
              <option value="customer">Customer</option>
              <option value="employee">Employee</option>
              <option value="admin">Administrator</option>
            </select>
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

        {form.role === 'admin' && (
          <div style={{ marginTop: '0.85rem', textAlign: 'right' }}>
            <button
              type="button"
              onClick={openResetModal}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Forgot admin password?
            </button>
          </div>
        )}

        <div style={{
          marginTop: '1.25rem', padding: '0.75rem', borderRadius: '8px',
          background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)',
          fontSize: '0.75rem', color: 'var(--color-text-light)', lineHeight: '1.4'
        }}>
          <strong>Demo Accounts (Password: <code>admin123</code> / <code>employee123</code> / <code>customer123</code>):</strong>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', listStyleType: 'disc' }}>
            <li>Admin: <code>admin@cvs.com</code></li>
            <li>Employee: <code>employee@cvs.com</code></li>
            <li>Customer: <code>customer@cvs.com</code></li>
          </ul>
        </div>

        <div className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register">Create Account</Link>
        </div>
      </div>

      {showResetModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowResetModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)',
              width: '100%',
              maxWidth: '520px',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--color-border)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowResetModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: 'var(--color-text-light)',
              }}
            >
              X
            </button>

            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Reset Administrator Password</h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Verify the registered phone number first, then confirm the verification code to set a new password.
            </p>

            {resetStatus.error && (
              <div style={{
                padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '0.875rem',
                border: '1px solid rgba(239,68,68,0.2)'
              }}>
                {resetStatus.error}
              </div>
            )}

            {resetStatus.success && (
              <div style={{
                padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px',
                background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.875rem',
                border: '1px solid rgba(16,185,129,0.2)'
              }}>
                {resetStatus.success}
                {resetStatus.demoCode && (
                  <div style={{ marginTop: '0.4rem', color: '#0F766E', fontWeight: 600 }}>
                    Demo verification code: {resetStatus.demoCode}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={resetStatus.requested ? handleConfirmReset : handleRequestResetCode}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Administrator Email</label>
                <input
                  className="form-input"
                  id="reset-email"
                  type="email"
                  value={resetForm.email}
                  onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                  disabled={isResetting || resetStatus.requested}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-phone">Registered Phone Number</label>
                <input
                  className="form-input"
                  id="reset-phone"
                  type="tel"
                  value={resetForm.phone}
                  onChange={(e) => setResetForm({ ...resetForm, phone: e.target.value })}
                  disabled={isResetting || resetStatus.requested}
                  required
                />
              </div>

              {resetStatus.requested && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-code">Verification Code</label>
                    <input
                      className="form-input"
                      id="reset-code"
                      type="text"
                      value={resetForm.code}
                      onChange={(e) => setResetForm({ ...resetForm, code: e.target.value })}
                      disabled={isResetting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-new-password">New Password</label>
                    <input
                      className="form-input"
                      id="reset-new-password"
                      type="password"
                      value={resetForm.newPassword}
                      onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                      disabled={isResetting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-confirm-password">Confirm New Password</label>
                    <input
                      className="form-input"
                      id="reset-confirm-password"
                      type="password"
                      value={resetForm.confirmPassword}
                      onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                      disabled={isResetting}
                      required
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                {resetStatus.requested && (
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setResetStatus({ error: '', success: '', demoCode: '', requested: false })}
                  >
                    Start Again
                  </button>
                )}
                <button type="submit" className={`btn btn--primary ${isResetting ? 'btn--loading' : ''}`} disabled={isResetting}>
                  {isResetting ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true"></span>
                      {resetStatus.requested ? 'Resetting...' : 'Verifying...'}
                    </>
                  ) : (
                    resetStatus.requested ? 'Reset Password' : 'Send Verification Code'
                  )}
                </button>
              </div>
            </form>

            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              Employee password reset is restricted and must be completed from the admin panel only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
