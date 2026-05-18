'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function ApprovalsDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editWeightage, setEditWeightage] = useState('');

  useEffect(() => {
    if (user?.id) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    try {
      const res = await fetch(`/api/goals?userId=${user.id}&role=${user.role}`);
      const data = await res.json();
      // Only show PENDING or APPROVED goals for manager to review (or return)
      setGoals(data.filter(g => g.status === 'PENDING' || g.status === 'APPROVED'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id })
      });
      fetchGoals();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateWeightage = async (id) => {
    try {
      await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_WEIGHTAGE', weightage: editWeightage, userId: user.id })
      });
      setEditingId(null);
      fetchGoals();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) return <div>Access Denied.</div>;

  // Group goals by employee
  const groupedGoals = goals.reduce((acc, goal) => {
    const empName = goal.owner.name;
    if (!acc[empName]) acc[empName] = [];
    acc[empName].push(goal);
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Team Goal Approvals</h1>
      
      {loading ? <p>Loading team goals...</p> : Object.keys(groupedGoals).length === 0 ? <p>No goals pending approval.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(groupedGoals).map(([empName, empGoals]) => {
            const totalWeightage = empGoals.reduce((sum, g) => sum + g.weightage, 0);
            return (
              <div key={empName} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h2>{empName}</h2>
                  <span className="badge badge-draft">Total Weightage: {totalWeightage}%</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {empGoals.map(goal => (
                    <div key={goal.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <h4 style={{ margin: 0 }}>{goal.title}</h4>
                          <span className={`badge badge-${goal.status.toLowerCase()}`}>{goal.status}</span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>{goal.thrustArea} • Target: {goal.target} {goal.uom}</p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {editingId === goal.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                              type="number" 
                              value={editWeightage} 
                              onChange={e => setEditWeightage(e.target.value)}
                              style={{ width: '80px', padding: '0.25rem 0.5rem' }} 
                            />
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleUpdateWeightage(goal.id)}>Save</button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 'bold' }}>{goal.weightage}%</span>
                            {goal.status === 'PENDING' && (
                              <button style={{ color: 'var(--text-secondary)' }} onClick={() => { setEditingId(goal.id); setEditWeightage(goal.weightage); }}>✎</button>
                            )}
                          </div>
                        )}
                        
                        {goal.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => handleAction(goal.id, 'APPROVE')}>Approve</button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => handleAction(goal.id, 'RETURN')}>Return</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
