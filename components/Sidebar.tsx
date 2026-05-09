'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';
import { api } from '@/lib/api-client';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Projects', href: '/projects', icon: '📁' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await api.post('/api/auth/logout', {});
    localStorage.removeItem('sb_token');
    showToast('Logged out successfully', 'success');
    router.push('/login');
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isActive = (href: string) => pathname?.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-container-low backdrop-blur-xl bg-opacity-80 py-6 px-4">
      {/* Logo */}
      <div className="mb-10 px-2">
        <span className="text-xl font-bold text-primary-fixed-dim flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>dataset</span>
          TASKMANAGER
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  active
                    ? 'bg-primary-container/20 text-primary font-bold border-r-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 font-medium'
                }
              `}
            >
              <span className="material-symbols-outlined">{item.href === '/dashboard' ? 'dashboard' : 'assignment'}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="mt-auto border-t border-outline-variant/20 pt-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center bg-surface-container text-white font-bold shrink-0">
            {getInitials(user?.full_name ?? null)}
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="text-xs text-on-surface font-bold truncate">{user?.full_name || 'Loading...'}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{user?.email || ''}</p>
          </div>
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
            title="Logout"
          >
            {loggingOut ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <span className="material-symbols-outlined">logout</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] shadow-lg"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64
          border-r border-white/5 shadow-2xl
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
