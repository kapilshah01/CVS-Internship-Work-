import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COMPANY } from '../data/siteData';

import { dbRegisterUser, dbResendVerificationEmail } from '../utils/db';

export default function Register({ initialRole = 'employee' }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '', role: initialRole, employeeCode: '', adminCode: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setSuccess('');

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.role === 'employee' && !form.employeeCode.trim()) {
      setError('Employee registration requires an office access code.');
      return;
    }
    if (form.role === 'admin' && !form.adminCode.trim()) {
      setError('Administrator registration requires an office access code.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 550));
      const res = await dbRegisterUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        employeeCode: form.employeeCode,
        adminCode: form.adminCode,
      });

      if (!res.success) {
        setError(res.message);
        return;
      }

      setSuccess(
        res.message ||
        `${form.role === 'admin' ? 'Administrator' : 'Employee'} registration successful. Please continue after verification.`
      );
      const nextRole = form.role;
      const nextEmail = form.email;
      setForm({ name: '', email: nextEmail, phone: '', password: '', confirm: '', role: nextRole, employeeCode: '', adminCode: '' });
      window.setTimeout(() => {
        navigate(nextRole === 'admin' ? '/admin/login' : '/employee/login');
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (isResending) return;
    setError('');
    setSuccess('');

    if (!form.email.trim()) {
      setError('Enter the email address used for registration to resend verification.');
      return;
    }

    setIsResending(true);
    try {
      const result = await dbResendVerificationEmail(form.email);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess(result.message);
    } finally {
      setIsResending(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

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
          <h1 className="auth-card__title">{form.role === 'admin' ? 'Admin Registration' : 'Staff Registration'}</h1>
          <p className="auth-card__subtitle">
            {form.role === 'admin'
              ? 'Create an admin account using the administrator access code.'
              : 'Create an employee or admin account with an office access code.'}
          </p>
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

        {success && (
          <div style={{
            padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px',
            background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.875rem',
            border: '1px solid rgba(16,185,129,0.2)'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name *</label>
            <input className="form-input" id="reg-name" type="text" placeholder="Enter your full name" value={form.name} onChange={update('name')} disabled={isSubmitting} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address *</label>
            <input className="form-input" id="reg-email" type="email" placeholder="Enter your email" value={form.email} onChange={update('email')} disabled={isSubmitting} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">Phone Number *</label>
            <input className="form-input" id="reg-phone" type="tel" placeholder="Enter your phone number" value={form.phone} onChange={update('phone')} disabled={isSubmitting} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">Register As</label>
            <select className="form-select" id="reg-role" value={form.role} onChange={update('role')} disabled={isSubmitting}>
              <option value="employee">Employee</option>
              <option value="admin">Administrator</option>
            </select>
            <p style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
              Public visitors do not register. Only office staff accounts can be created here.
            </p>
          </div>

          {(form.role === 'employee' || form.role === 'admin') && (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-access-code">
                {form.role === 'admin' ? 'Administrator Access Code *' : 'Employee Access Code *'}
              </label>
              <div className="password-field">
                <input
                  className="form-input password-field__input"
                  id="reg-access-code"
                  type={showAccessCode ? 'text' : 'password'}
                  placeholder={`Enter office-issued ${form.role} code`}
                  value={form.role === 'admin' ? form.adminCode : form.employeeCode}
                  onChange={update(form.role === 'admin' ? 'adminCode' : 'employeeCode')}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className={`password-field__toggle ${showAccessCode ? 'password-field__toggle--active' : ''}`}
                  onClick={() => setShowAccessCode((prev) => !prev)}
                  aria-label={showAccessCode ? 'Hide access code' : 'Show access code'}
                  title={showAccessCode ? 'Hide access code' : 'Show access code'}
                >
                  {showAccessCode ? '🙈' : '👁'}
                </button>
              </div>
              <p style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                {form.role === 'admin'
                  ? 'Administrator access is restricted, protected by the administrator access code, and requires approval from an active admin.'
                  : 'Employee access is protected by the employee access code and becomes available after email verification.'}
              </p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password *</label>
            <input className="form-input" id="reg-password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={update('password')} disabled={isSubmitting} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password *</label>
            <input className="form-input" id="reg-confirm" type="password" placeholder="Re-enter password" value={form.confirm} onChange={update('confirm')} disabled={isSubmitting} required />
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
                Creating Account...
              </>
            ) : 'Create Account'}
          </button>
        </form>

        {form.role === 'admin' && (
          <div style={{
            marginTop: '1.25rem', padding: '0.9rem', borderRadius: '10px',
            background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)',
            fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.55'
          }}>
            <strong style={{ color: 'var(--color-text)' }}>Admin Setup Notes</strong>
            <div style={{ marginTop: '0.45rem' }}>Administrator registration is meant for trusted office owners or managers.</div>
            <div>You must enter the correct administrator access code, then verify your email from the inbox message.</div>
            <div>After verification, an existing active admin must approve your account before you can use `/admin/login`.</div>
          </div>
        )}

        <div className="auth-card__footer">
          Already have an account?{' '}
          <Link to={form.role === 'admin' ? '/admin/login' : '/employee/login'}>Sign In</Link>
          <br />
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            style={{
              marginTop: '0.6rem',
              border: 'none',
              background: 'none',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {isResending ? 'Sending verification...' : 'Resend verification email'}
          </button>
        </div>
      </div>
    </div>
  );
}
