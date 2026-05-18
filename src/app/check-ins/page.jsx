'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function CheckInsDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [checkIns, setCheckIns] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeQuarter, setActiveQuarter] = useState('Q1'); // Demo purpose

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user, activeQuarter]);

  const fetchData = async () => {
    try {
      const goalsRes = await fetch(`/api/goals?userId=${user.id}&role=EMPLOYEE`);
      const goalsData = await goalsRes.json();
      
      // Only approved goals can be checked in
      const approvedGoals = goalsData.filter(g => g.status === 'APPROVED');
      setGoals(approvedGoals);

      const checkInPromises = approvedGoals.map(g => 
        fetch(`/api/check-ins?goalId=${g.id}&quarter=${activeQuarter}`).then(res => res.json())
      );
      
      const checkInsResults = await Promise.all(checkInPromises);
      
      const newCheckIns = {};
      checkInsResults.forEach((arr, index) => {
        if (arr.length > 0) {
          newCheckIns[approvedGoals[index].id] = arr[0];
        }
      });
      setCheckIns(newCheckIns);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (goalId, field, value) => {
    // Optimistic update
    setCheckIns(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value
      }
    }));

    try {
      await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          quarter: activeQuarter,
          [field]: value
        })
      });
    } catch (e) {
      console.error('Failed to save check-in', e);
    }
  };

  if (!user || user.role !== 'EMPLOYEE') return <div>Access Denied. Employees only.</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Quarterly Check-ins</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(15,23,42,0.6)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Select Quarter (Demo):</span>
          <select 
            value={activeQuarter} 
            onChange={e => setActiveQuarter(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
          >
            <option value="Q1">Q1 (Apr-Jun)</option>
            <option value="Q2">Q2 (Jul-Sep)</option>
            <option value="Q3">Q3 (Oct-Dec)</option>
            <option value="Q4">Q4 (Jan-Mar)</option>
          </select>
        </div>
      </div>

      {loading ? <p>Loading goals...</p> : goals.length === 0 ? <p>You have no approved goals for check-in.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {goals.map(goal => {
            const currentCheckIn = checkIns[goal.id] || { actualAchievement: 0, status: 'Not Started', managerComment: '' };
            const progressPct = goal.target > 0 ? Math.min(100, Math.round((currentCheckIn.actualAchievement / goal.target) * 100)) : 0;
            
            return (
              <div key={goal.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{goal.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Target: {goal.target} {goal.uom} | Weightage: {goal.weightage}%
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{progressPct}%</span>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Progress Score</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Actual Achievement ({goal.uom})</label>
                    <input 
                      type="number" 
                      style={{ width: '100%' }}
                      value={currentCheckIn.actualAchievement || ''} 
                      onChange={e => handleUpdate(goal.id, 'actualAchievement', e.target.value)} 
                      placeholder="Enter actual value"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Status</label>
                    <select 
                      style={{ width: '100%' }}
                      value={currentCheckIn.status}
                      onChange={e => handleUpdate(goal.id, 'status', e.target.value)}
                    >
                      <option>Not Started</option>
                      <option>On Track</option>
                      <option>Completed</option>
                    </select>
                  </div>
                </div>
                
                {currentCheckIn.managerComment && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '0.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>Manager Comment ({activeQuarter}):</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>{currentCheckIn.managerComment}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
