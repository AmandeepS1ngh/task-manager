import { ToastProvider } from '@/lib/context/ToastContext';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </ToastProvider>
  );
}
