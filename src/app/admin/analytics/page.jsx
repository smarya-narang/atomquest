'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [goalsRes, usersRes] = await Promise.all([
        fetch('/api/goals?role=ADMIN'),
        fetch('/api/users')
      ]);
      const goalsData = await goalsRes.json();
      setGoals(goalsData);
      
      const approved = goalsData.filter(g => g.status === 'APPROVED');
      
      // Fetch checkins for all quarters to do QoQ
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      let allCheckIns = [];
      
      for (const q of quarters) {
        const promises = approved.map(g => fetch(`/api/check-ins?goalId=${g.id}&quarter=${q}`).then(r => r.json()));
        const data = await Promise.all(promises);
        allCheckIns = [...allCheckIns, ...data.flat()];
      }
      
      setCheckIns(allCheckIns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return <div>Access Denied. Admins only.</div>;

  if (loading) return <div>Loading Analytics...</div>;

  // --- Aggregation Logic ---

  // 1. Goal Distribution by Thrust Area
  const thrustAreaCounts = goals.reduce((acc, g) => {
    acc[g.thrustArea] = (acc[g.thrustArea] || 0) + 1;
    return acc;
  }, {});

  const thrustAreaData = {
    labels: Object.keys(thrustAreaCounts),
    datasets: [{
      label: 'Number of Goals',
      data: Object.values(thrustAreaCounts),
      backgroundColor: 'rgba(79, 70, 229, 0.6)',
      borderColor: 'rgba(79, 70, 229, 1)',
      borderWidth: 1,
    }],
  };

  // 2. Goal Status Distribution
  const statusCounts = goals.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      label: 'Goal Status',
      data: Object.values(statusCounts),
      backgroundColor: [
        'rgba(16, 185, 129, 0.6)', // APPROVED - Green
        'rgba(245, 158, 11, 0.6)', // PENDING - Yellow
        'rgba(100, 116, 139, 0.6)', // DRAFT - Gray
        'rgba(239, 68, 68, 0.6)',  // RETURNED - Red
      ],
      borderWidth: 1,
    }],
  };

  // 3. Quarter-on-Quarter (QoQ) Achievement Trends
  // Calculate average progress score per quarter
  const qoqProgress = { Q1: [], Q2: [], Q3: [], Q4: [] };
  
  checkIns.forEach(ci => {
    const goal = ci.goal;
    const progress = goal.target > 0 ? (ci.actualAchievement / goal.target) * 100 : 0;
    if (qoqProgress[ci.quarter]) {
      qoqProgress[ci.quarter].push(Math.min(100, progress));
    }
  });

  const qoqAverages = Object.keys(qoqProgress).map(q => {
    const scores = qoqProgress[q];
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  });

  const qoqData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Avg Completion %',
      data: qoqAverages,
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#fff' } },
    },
    scales: {
      y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'right', labels: { color: '#fff' } } }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Analytics & Insights</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Goal Distribution by Thrust Area</h3>
          <Bar data={thrustAreaData} options={chartOptions} />
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Goal Status Overview</h3>
          <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            <Doughnut data={statusData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Quarter-on-Quarter (QoQ) Achievement Trends</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Average completion percentage across all organization goals per quarter.</p>
        <div style={{ height: '300px' }}>
          <Bar data={qoqData} options={{ ...chartOptions, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}
