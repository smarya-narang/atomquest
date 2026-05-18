'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Navigation() {
  const { user, allUsers, switchUser, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <header className="top-nav"><div className="brand">AtomQuest</div></header>;

  return (
    <header className="top-nav">
      <div className="brand">AtomQuest</div>
      
      <nav className="nav-links">
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          Home
        </Link>
        {user?.role === 'EMPLOYEE' && (
          <>
            <Link href="/goals" className={`nav-link ${pathname.startsWith('/goals') ? 'active' : ''}`}>
              My Goals
            </Link>
            <Link href="/check-ins" className={`nav-link ${pathname.startsWith('/check-ins') ? 'active' : ''}`}>
              My Check-ins
            </Link>
          </>
        )}
        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
          <>
            <Link href="/approvals" className={`nav-link ${pathname.startsWith('/approvals') ? 'active' : ''}`}>
              Approvals
            </Link>
            <Link href="/team-progress" className={`nav-link ${pathname.startsWith('/team-progress') ? 'active' : ''}`}>
              Team Progress
            </Link>
          </>
        )}
        {user?.role === 'ADMIN' && (
          <>
            <Link href="/admin/reports" className={`nav-link ${pathname === '/admin/reports' ? 'active' : ''}`}>
              Admin & Reports
            </Link>
            <Link href="/admin/analytics" className={`nav-link ${pathname === '/admin/analytics' ? 'active' : ''}`}>
              Analytics
            </Link>
          </>
        )}
      </nav>

      <div className="auth-switcher">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View as:</span>
        <select 
          className="auth-select"
          value={user?.id || ''} 
          onChange={(e) => switchUser(e.target.value)}
        >
          {allUsers.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
