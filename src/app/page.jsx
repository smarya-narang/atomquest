import React from 'react';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #4F46E5, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Welcome to AtomQuest
      </h1>
      <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem auto', color: 'var(--text-secondary)' }}>
        The next-generation portal for in-house Goal Setting, Tracking, and Performance Alignment.
      </p>
      <div className="glass-card" style={{ maxWidth: '800px', padding: '2rem' }}>
        <h2>Hackathon Demo Instructions</h2>
        <p>Use the <strong>"View as"</strong> dropdown in the top right corner to instantly switch between the three primary personas:</p>
        <ul style={{ textAlign: 'left', display: 'inline-block', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <li><strong>Employee:</strong> Create goals, assign weightages, submit for approval, and log quarterly check-ins.</li>
          <li><strong>Manager:</strong> Review team goals, modify weightages, approve/return goals, and add check-in comments.</li>
          <li><strong>Admin:</strong> View organizational progress, export CSV reports, and track the system audit trail.</li>
        </ul>
      </div>
    </div>
  );
}
