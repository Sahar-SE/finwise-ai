import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Create your account</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Start tracking crypto, gold, and equities in minutes.</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="rounded-md border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-3 py-2 text-sm text-[var(--coral)]">{error}</div>}
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Username</span>
            <input
              required minLength={2} maxLength={50} value={username} onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]"
              placeholder="jane_trader"
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Email</span>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]"
              placeholder="you@example.com"
            />
          </label>
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Password</span>
            <input
              type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]"
              placeholder="At least 8 characters"
            />
          </label>
          <button
            type="submit" disabled={busy}
            className="mt-2 rounded-md bg-[var(--mint)] px-4 py-2.5 font-medium text-[#05130D] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
        Already have an account? <Link to="/login" className="text-[var(--mint)]">Log in</Link>
      </p>
    </div>
  );
}
