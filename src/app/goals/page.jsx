'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function GoalsDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    thrustArea: '', title: '', description: '', uom: 'Numeric', target: '', weightage: ''
  });

  useEffect(() => {
    if (user?.id) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    try {
      const res = await fetch(`/api/goals?userId=${user.id}&role=${user.role}`);
      const data = await res.json();
      setGoals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ownerId: user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setShowModal(false);
      setFormData({ thrustArea: '', title: '', description: '', uom: 'Numeric', target: '', weightage: '' });
      fetchGoals();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      fetchGoals();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitGoals = async () => {
    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeightage !== 100) {
      alert(`Total weightage must be exactly 100%. Currently it is ${totalWeightage}%.`);
      return;
    }
    
    // Submit all draft/returned goals
    const draftGoals = goals.filter(g => g.status === 'DRAFT' || g.status === 'RETURNED');
    for (const g of draftGoals) {
      await fetch(`/api/goals/${g.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBMIT', userId: user.id })
      });
    }
    fetchGoals();
  };

  if (!user || user.role !== 'EMPLOYEE') return <div>Access Denied. Employees only.</div>;

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const canAddMore = goals.length < 8 && totalWeightage < 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>My Goals</h1>
          <p>Total Weightage: <strong style={{ color: totalWeightage === 100 ? 'var(--success)' : 'var(--warning)' }}>{totalWeightage}%</strong> / 100%</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {canAddMore && (
            <button className="btn btn-secondary" onClick={() => setShowModal(true)}>+ Add Goal</button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleSubmitGoals}
            disabled={totalWeightage !== 100 || !goals.some(g => g.status === 'DRAFT' || g.status === 'RETURNED')}
          >
            Submit for Approval
          </button>
        </div>
      </div>

      {loading ? <p>Loading goals...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {goals.map(goal => (
            <div key={goal.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3>{goal.title}</h3>
                  <span className={`badge badge-${goal.status.toLowerCase()}`}>{goal.status}</span>
                  {goal.isShared && <span className="badge badge-pending">Shared Goal</span>}
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{goal.thrustArea} • Target: {goal.target} {goal.uom}</p>
                {goal.description && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{goal.description}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{goal.weightage}%</span>
                {goal.status !== 'APPROVED' && goal.status !== 'PENDING' && !goal.isShared && (
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(goal.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
          {goals.length === 0 && <p>No goals created yet. Click "Add Goal" to get started.</p>}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '500px', background: 'rgba(15,23,42,0.95)' }}>
            <h2>Create New Goal</h2>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <input required placeholder="Thrust Area" value={formData.thrustArea} onChange={e => setFormData({...formData, thrustArea: e.target.value})} />
              <input required placeholder="Goal Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} style={{ flex: 1 }}>
                  <option>Numeric</option>
                  <option>%</option>
                  <option>Timeline</option>
                  <option>Zero-based</option>
                </select>
                <input required type="number" step="0.1" placeholder="Target" value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} style={{ flex: 1 }} />
              </div>
              <input required type="number" min="10" max="100" placeholder="Weightage % (min 10)" value={formData.weightage} onChange={e => setFormData({...formData, weightage: e.target.value})} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
