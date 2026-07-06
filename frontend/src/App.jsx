import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import { ProtectedRoute, AdminRoute } from './components/RouteGuards';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Predictions from './pages/Predictions';
import Feedback from './pages/Feedback';

import AdminLayout from './pages/admin/AdminLayout';
import SeoManager from './pages/admin/SeoManager';
import SurveyModeration from './pages/admin/SurveyModeration';
import TrafficDashboard from './pages/admin/TrafficDashboard';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-[var(--bg)]">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feedback" element={<Feedback />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/predictions" element={<Predictions />} />
            </Route>

            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="seo" replace />} />
                <Route path="seo" element={<SeoManager />} />
                <Route path="surveys" element={<SurveyModeration />} />
                <Route path="traffic" element={<TrafficDashboard />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-[var(--text)]">404</h1>
      <p className="mt-2 text-[var(--text-muted)]">This page doesn't exist.</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-muted)]">
      FinWise-AI · AI-powered market intelligence · Not financial advice
    </footer>
  );
}
