import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][passwordStrength] || '';
  const strengthColor = ['', '#e74c3c', '#e67e22', '#f1c40f', '#27ae60', '#1da681'][passwordStrength] || '';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = await register(form.name.trim(), form.email.trim(), form.password);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-mark">
            <Wallet size={22} />
          </div>
          <span className="auth-brand-name">
            expense<span className="brand-accent">pro</span>
          </span>
        </div>

        <div className="auth-hero">
          <h1 className="auth-title">
            Start your journey to<br />
            <span>financial clarity.</span>
          </h1>
          <p className="auth-desc">
            Join thousands who already use Expense Tracker Pro to build better money habits — one transaction at a time.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <CheckCircle size={15} color="#24a985" />
              Free forever, no credit card needed
            </div>
            <div className="auth-feature">
              <CheckCircle size={15} color="#24a985" />
              Your data is encrypted and private
            </div>
            <div className="auth-feature">
              <CheckCircle size={15} color="#24a985" />
              Works on all devices
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          © 2026 Expense Tracker Pro
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create your account</h2>
            <p>Get started — it only takes a minute</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              Full name
              <input
                id="register-name"
                type="text"
                className="auth-input"
                placeholder="Vikram Salian"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
                required
              />
            </label>

            <label className="auth-label">
              Email address
              <input
                id="register-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                required
              />
            </label>

            <label className="auth-label">
              Password
              <div className="password-wrap">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {form.password && (
                <div className="strength-bar">
                  <div className="strength-track">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="strength-segment"
                        style={{ background: n <= passwordStrength ? strengthColor : '#eaecf2' }}
                      />
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </label>

            <label className="auth-label">
              Confirm password
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
                required
              />
            </label>

            <button
              id="register-submit"
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
