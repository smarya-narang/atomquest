'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function AdminReportsDashboard() {
  const { user, allUsers } = useAuth();
  const [goals, setGoals] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [goalsRes, logsRes] = await Promise.all([
        fetch('/api/goals?role=ADMIN'),
        fetch('/api/audit-logs')
      ]);
      const goalsData = await goalsRes.json();
      setGoals(goalsData);
      
      const logsData = await logsRes.json();
      setAuditLogs(logsData);
      
      // Fetch checkins for all approved goals for Q1 as default demo
      const approved = goalsData.filter(g => g.status === 'APPROVED');
      const ciPromises = approved.map(g => fetch(`/api/check-ins?goalId=${g.id}&quarter=Q1`).then(r => r.json()));
      const ciData = await Promise.all(ciPromises);
      const flatCheckIns = ciData.flat();
      setCheckIns(flatCheckIns);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    // Generate CSV data: Employee Name, Goal Title, Quarter, Planned Target, Actual Achievement, Status
    const header = ['Employee Name', 'Goal Title', 'Thrust Area', 'Planned Target', 'Actual Achievement', 'Quarter', 'Status'];
    const rows = checkIns.map(ci => {
      const g = ci.goal;
      return [
        `"${g.owner.name}"`,
        `"${g.title}"`,
        `"${g.thrustArea}"`,
        `${g.target} ${g.uom}`,
        `${ci.actualAchievement} ${g.uom}`,
        ci.quarter,
        ci.status
      ].join(',');
    });
    
    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'goal_achievements.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || user.role !== 'ADMIN') return <div>Access Denied. Admins only.</div>;

  // Completion stats
  const totalEmployees = allUsers.filter(u => u.role === 'EMPLOYEE').length;
  const employeesWithApprovedGoals = new Set(goals.filter(g => g.status === 'APPROVED').map(g => g.ownerId)).size;
  const completionRate = totalEmployees ? Math.round((employeesWithApprovedGoals / totalEmployees) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Admin & Governance Reports</h1>
        <button className="btn btn-primary" onClick={exportCSV}>Download Achievement CSV</button>
      </div>

      {loading ? <p>Loading data...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Goal Approval Rate</h3>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '0.5rem' }}>{completionRate}%</span>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{employeesWithApprovedGoals} of {totalEmployees} employees have approved goals.</p>
            </div>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Goals Tracked</h3>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.5rem' }}>{goals.length}</span>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Across the organization.</p>
            </div>
          </div>

          <div className="glass-card">
            <h2 style={{ marginBottom: '1rem' }}>Audit Trail</h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Action</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Entity</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>User ID</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}><span className="badge badge-draft">{log.action}</span></td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{log.entityType} ({log.entityId.slice(0, 8)}...)</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{log.userId.slice(0, 8)}...</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
