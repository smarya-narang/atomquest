'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        setAllUsers(data);
        
        // Default to Employee if available
        const defaultUser = data.find(u => u.role === 'EMPLOYEE') || data[0];
        setUser(defaultUser);
      } catch (e) {
        console.error('Failed to load users for mock auth', e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const switchUser = (userId) => {
    const selected = allUsers.find(u => u.id === userId);
    if (selected) setUser(selected);
  };

  return (
    <AuthContext.Provider value={{ user, allUsers, switchUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
