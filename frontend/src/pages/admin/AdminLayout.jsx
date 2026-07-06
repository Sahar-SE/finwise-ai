import { NavLink, Outlet } from 'react-router-dom';
import { Activity, MessageSquareText, Search, Users } from 'lucide-react';

const linkCls = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-[var(--mint)]/10 text-[var(--mint)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`;

export default function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-10 sm:px-6">
      <aside className="w-56 shrink-0">
        <h2 className="mb-4 font-display text-lg font-semibold text-[var(--text)]">Admin</h2>
        <nav className="flex flex-col gap-1">
          <NavLink to="/admin/seo" className={linkCls}><Search size={16} /> SEO manager</NavLink>
          <NavLink to="/admin/surveys" className={linkCls}><MessageSquareText size={16} /> Survey moderation</NavLink>
          <NavLink to="/admin/traffic" className={linkCls}><Activity size={16} /> Traffic dashboard</NavLink>
          <NavLink to="/admin/users" className={linkCls}><Users size={16} /> Users</NavLink>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
