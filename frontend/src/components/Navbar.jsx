import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LineChart, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLink = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-[var(--mint)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--text)]">
          <LineChart size={22} className="text-[var(--mint)]" />
          FinWise<span className="text-[var(--mint)]">-AI</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLink}>Home</NavLink>
          {user && <NavLink to="/dashboard" className={navLink}>Dashboard</NavLink>}
          {user && <NavLink to="/portfolio" className={navLink}>Portfolio</NavLink>}
          {user && <NavLink to="/predictions" className={navLink}>Predictions</NavLink>}
          <NavLink to="/feedback" className={navLink}>Feedback</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin" className={navLink}>Admin</NavLink>}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:border-[var(--coral)] hover:text-[var(--coral)] transition-colors"
            >
              <LogOut size={14} /> {user.username}
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Log in</Link>
              <Link to="/register" className="rounded-md bg-[var(--mint)] px-3 py-1.5 text-sm font-medium text-[#05130D] hover:opacity-90 transition-opacity">
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-[var(--text)]" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--border)] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLink to="/" end className={navLink} onClick={() => setOpen(false)}>Home</NavLink>
            {user && <NavLink to="/dashboard" className={navLink} onClick={() => setOpen(false)}>Dashboard</NavLink>}
            {user && <NavLink to="/portfolio" className={navLink} onClick={() => setOpen(false)}>Portfolio</NavLink>}
            {user && <NavLink to="/predictions" className={navLink} onClick={() => setOpen(false)}>Predictions</NavLink>}
            <NavLink to="/feedback" className={navLink} onClick={() => setOpen(false)}>Feedback</NavLink>
            {user?.role === 'admin' && <NavLink to="/admin" className={navLink} onClick={() => setOpen(false)}>Admin</NavLink>}
            {user ? (
              <button onClick={handleLogout} className="text-left text-sm text-[var(--coral)]">Log out</button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-[var(--text-muted)]" onClick={() => setOpen(false)}>Log in</Link>
                <Link to="/register" className="text-sm text-[var(--mint)]" onClick={() => setOpen(false)}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
