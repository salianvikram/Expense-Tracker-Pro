import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    const result = await login(form.email.trim(), form.password);
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
            Take control of your<br />
            <span>financial future.</span>
          </h1>
          <p className="auth-desc">
            Track every rupee. Understand your spending. Build the savings habit you've always wanted.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="feature-dot green" />
              Real-time expense tracking
            </div>
            <div className="auth-feature">
              <span className="feature-dot purple" />
              Smart spending analytics
            </div>
            <div className="auth-feature">
              <span className="feature-dot orange" />
              Secure &amp; private — your data only
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
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              Email address
              <input
                id="login-email"
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
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
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
            </label>

            <button
              id="login-submit"
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
