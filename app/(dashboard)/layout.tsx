'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { UserProvider } from '@/lib/context/UserContext';
import { ToastProvider } from '@/lib/context/ToastContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sb_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <UserProvider>
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
          <Sidebar />
          <main className="md:ml-64 min-h-screen pt-20 md:pt-8 pb-8 px-4 md:px-8">
            <div className="max-w-[1440px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </UserProvider>
    </ToastProvider>
  );
}
