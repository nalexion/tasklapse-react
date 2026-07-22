import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { user, isGuest, loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (user || isGuest) {
    return <Dashboard />;
  }

  return <AuthScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

