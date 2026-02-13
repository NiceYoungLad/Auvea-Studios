'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import AuthCard from './AuthCard';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [configError, setConfigError] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    try {
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data }) => {
        setHasSession(!!data.session);
        setReady(true);
      });
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setHasSession(!!session);
        setReady(true);
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (err: any) {
      setConfigError(err.message || 'Supabase is not configured.');
      setReady(true);
      return () => {};
    }
  }, []);

  if (!ready) {
    return <div className="app-loading">Loading workspace...</div>;
  }

  if (configError) {
    return (
      <div className="auth-card">
        <h1>Configuration required</h1>
        <p className="app-muted">{configError}</p>
        <p className="app-muted">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
          Environment Variables, then redeploy.
        </p>
      </div>
    );
  }

  if (!hasSession) {
    return <AuthCard />;
  }

  const navLinks = [
    { href: '/app', label: 'Overview' },
    { href: '/app/companies', label: 'Companies' },
    { href: '/app/jobs', label: 'Jobs' },
    { href: '/app/applications', label: 'Applications' },
    { href: '/app/questions', label: 'Questions' },
    { href: '/app/profile', label: 'Profile' },
  ];

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">AUVEA</div>
        <nav className="app-nav">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/app' ? pathname === '/app' : pathname?.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={isActive ? 'active' : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          className="app-button secondary"
          type="button"
          onClick={() => {
            try {
              getSupabaseClient().auth.signOut();
            } catch (err: any) {
              setConfigError(err.message || 'Supabase is not configured.');
            }
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="app-content">{children}</main>
    </div>
  );
}
