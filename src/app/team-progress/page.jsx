'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function TeamProgressDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [checkIns, setCheckIns] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeQuarter, setActiveQuarter] = useState('Q1'); // Demo purpose
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user, activeQuarter]);

  const fetchData = async () => {
    try {
      const goalsRes = await fetch(`/api/goals?userId=${user.id}&role=${user.role}`);
      const goalsData = await goalsRes.json();
      
      // Managers only see APPROVED goals for check-ins
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

  const saveComment = async (goalId) => {
    try {
      await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          quarter: activeQuarter,
          managerComment: commentText
        })
      });
      setEditingComment(null);
      fetchData(); // reload
    } catch (e) {
      console.error('Failed to save comment', e);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Team Progress Check-ins</h1>
        
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

      {loading ? <p>Loading team progress...</p> : Object.keys(groupedGoals).length === 0 ? <p>No approved goals found for your team.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(groupedGoals).map(([empName, empGoals]) => {
            return (
              <div key={empName} className="glass-card">
                <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>{empName}</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {empGoals.map(goal => {
                    const currentCheckIn = checkIns[goal.id];
                    const actual = currentCheckIn?.actualAchievement || 0;
                    const status = currentCheckIn?.status || 'Not Started';
                    const progressPct = goal.target > 0 ? Math.min(100, Math.round((actual / goal.target) * 100)) : 0;
                    
                    return (
                      <div key={goal.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{goal.title}</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              Target: {goal.target} {goal.uom} | Planned Weightage: {goal.weightage}%
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{progressPct}%</span>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Progress Score</p>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Actual Achievement</span>
                            <span style={{ fontSize: '1rem', fontWeight: '500' }}>{actual} {goal.uom}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Status</span>
                            <span className={`badge ${status === 'Completed' ? 'badge-approved' : status === 'On Track' ? 'badge-pending' : 'badge-draft'}`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        <div>
                          {editingComment === goal.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <textarea 
                                value={commentText} 
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Enter check-in comment..."
                                rows={3}
                                style={{ width: '100%' }}
                              />
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setEditingComment(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={() => saveComment(goal.id)}>Save Comment</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Manager Comment:</span>
                                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => { setEditingComment(goal.id); setCommentText(currentCheckIn?.managerComment || ''); }}>
                                  {currentCheckIn?.managerComment ? 'Edit' : 'Add Comment'}
                                </button>
                              </div>
                              {currentCheckIn?.managerComment ? (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'rgba(15,23,42,0.5)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                  {currentCheckIn.managerComment}
                                </p>
                              ) : (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No comment added for this quarter.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
