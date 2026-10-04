import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LineChart,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Zap,
  BrainCircuit,
  Users,
  Clock,
  BookOpen,
  Newspaper,
  MessageSquare
} from 'lucide-react';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-[var(--mint)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dropdown states
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const aiToolsTimeout = useRef(null);
  const insightsTimeout = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setAiToolsOpen(false);
    setInsightsOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  // Active state checkers for parent dropdown triggers
  const isAiToolsActive = [
    '/predictions',
    '/stress-test',
    '/rag',
    '/persona-advisor',
    '/time-machine',
  ].includes(location.pathname);

  const isInsightsActive = [
    '/trade-journal',
    '/newsletter',
    '/feedback',
  ].includes(location.pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--text)]">
          <LineChart size={22} className="text-[var(--mint)]" />
          FinWise<span className="text-[var(--mint)]">-AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          {user && <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>}
          {user && <NavLink to="/portfolio" className={navLinkClass}>Portfolio</NavLink>}

          {/* AI Tools Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => {
              clearTimeout(aiToolsTimeout.current);
              setAiToolsOpen(true);
            }}
            onMouseLeave={() => {
              aiToolsTimeout.current = setTimeout(() => setAiToolsOpen(false), 150);
            }}
          >
            <button
              onClick={() => setAiToolsOpen(!aiToolsOpen)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isAiToolsActive || aiToolsOpen
                  ? 'text-[var(--mint)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Sparkles size={14} className="text-[var(--mint)]" />
              <span>AI Tools</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${aiToolsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {aiToolsOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                {user && (
                  <NavLink
                    to="/predictions"
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    <Sparkles size={18} className="mt-0.5 text-[var(--mint)] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--text)]">AI Predictions</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Multi-horizon indicator & Monte Carlo forecasts</div>
                    </div>
                  </NavLink>
                )}
                {user && (
                  <NavLink
                    to="/stress-test"
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    <Zap size={18} className="mt-0.5 text-[var(--coral)] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--text)]">Macro Stress Test</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Shock simulation & hedging strategy generator</div>
                    </div>
                  </NavLink>
                )}
                <NavLink
                  to="/rag"
                  className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-alt)]"
                >
                  <BrainCircuit size={18} className="mt-0.5 text-[var(--azure)] shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--text)]">Market Intel (RAG)</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Hybrid retrieval Q&A with inline citations</div>
                  </div>
                </NavLink>
                {user && (
                  <NavLink
                    to="/persona-advisor"
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    <Users size={18} className="mt-0.5 text-[var(--gold)] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--text)]">Legendary Investor Advisor</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Advice in Buffett, Soros & Dalio's voice</div>
                    </div>
                  </NavLink>
                )}
                {user && (
                  <NavLink
                    to="/time-machine"
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    <Clock size={18} className="mt-0.5 text-[var(--mint)] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--text)]">Portfolio Time Machine</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Simulate entries at historical market crashes</div>
                    </div>
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Insights Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => {
              clearTimeout(insightsTimeout.current);
              setInsightsOpen(true);
            }}
            onMouseLeave={() => {
              insightsTimeout.current = setTimeout(() => setInsightsOpen(false), 150);
            }}
          >
            <button
              onClick={() => setInsightsOpen(!insightsOpen)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isInsightsActive || insightsOpen
                  ? 'text-[var(--mint)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <BookOpen size={14} className="text-[var(--azure)]" />
              <span>Insights & Digest</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${insightsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {insightsOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                {user && (
                  <NavLink
                    to="/trade-journal"
                    className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-alt)]"
                  >
                    <BookOpen size={18} className="mt-0.5 text-[var(--mint)] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--text)]">Trade Journal</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Behavioral finance & FOMO pattern coaching</div>
                    </div>
                  </NavLink>
                )}
                <NavLink
                  to="/newsletter"
                  className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-alt)]"
                >
                  <Newspaper size={18} className="mt-0.5 text-[var(--gold)] shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--text)] font-sans">AI Newsletter Digest</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Curated intelligence & market shifts</div>
                  </div>
                </NavLink>
                <NavLink
                  to="/feedback"
                  className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface-alt)]"
                >
                  <MessageSquare size={18} className="mt-0.5 text-[var(--azure)] shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[var(--text)] font-sans">Platform Feedback</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Share suggestions & user surveys</div>
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {user?.role === 'admin' && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 lg:flex">
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

        {/* Mobile Hamburger Button */}
        <button className="lg:hidden text-[var(--text)]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[var(--border)] px-4 py-4 lg:hidden bg-[var(--surface)] max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>Home</NavLink>
            {user && <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMobileOpen(false)}>Dashboard</NavLink>}
            {user && <NavLink to="/portfolio" className={navLinkClass} onClick={() => setMobileOpen(false)}>Portfolio</NavLink>}

            {/* AI Tools Mobile Section */}
            <div className="border-t border-[var(--border)] pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mint)] mb-2 flex items-center gap-1">
                <Sparkles size={12} /> AI Tools
              </div>
              <div className="flex flex-col gap-2 pl-2">
                {user && <NavLink to="/predictions" className={navLinkClass} onClick={() => setMobileOpen(false)}>AI Predictions</NavLink>}
                {user && <NavLink to="/stress-test" className={navLinkClass} onClick={() => setMobileOpen(false)}>Macro Stress Test</NavLink>}
                <NavLink to="/rag" className={navLinkClass} onClick={() => setMobileOpen(false)}>Market Intel (RAG)</NavLink>
                {user && <NavLink to="/persona-advisor" className={navLinkClass} onClick={() => setMobileOpen(false)}>Legendary Investor Advisor</NavLink>}
                {user && <NavLink to="/time-machine" className={navLinkClass} onClick={() => setMobileOpen(false)}>Portfolio Time Machine</NavLink>}
              </div>
            </div>

            {/* Insights Mobile Section */}
            <div className="border-t border-[var(--border)] pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--azure)] mb-2 flex items-center gap-1">
                <BookOpen size={12} /> Insights & Digest
              </div>
              <div className="flex flex-col gap-2 pl-2">
                {user && <NavLink to="/trade-journal" className={navLinkClass} onClick={() => setMobileOpen(false)}>Trade Journal</NavLink>}
                <NavLink to="/newsletter" className={navLinkClass} onClick={() => setMobileOpen(false)}>AI Newsletter Digest</NavLink>
                <NavLink to="/feedback" className={navLinkClass} onClick={() => setMobileOpen(false)}>Platform Feedback</NavLink>
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="border-t border-[var(--border)] pt-3">
                <NavLink to="/admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>Admin Panel</NavLink>
              </div>
            )}

            <div className="border-t border-[var(--border)] pt-3">
              {user ? (
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[var(--coral)]">
                  <LogOut size={16} /> Log out ({user.username})
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" className="text-sm text-[var(--text-muted)]" onClick={() => setMobileOpen(false)}>Log in</Link>
                  <Link to="/register" className="text-sm font-semibold text-[var(--mint)]" onClick={() => setMobileOpen(false)}>Get started</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
