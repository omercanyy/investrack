import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PositionsPage from './pages/PositionsPage';
import ClosedPositionsPage from './pages/ClosedPositionsPage';
import SchwabCallbackPage from './pages/SchwabCallbackPage';

function App() {
  const { user, isLoading, handleLogin, handleLogout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  // Handle Schwab callback route
  if (window.location.pathname === '/auth/schwab/callback') {
    return <SchwabCallbackPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'positions':
        return <PositionsPage />;
      case 'closed':
        return <ClosedPositionsPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <h2 className="text-2xl font-semibold">Loading...</h2>
      </div>
    );
  }

  return (
    <AppLayout
      user={user}
      handleLogout={handleLogout}
      activePage={activePage}
      setActivePage={setActivePage}
    >
      {user ? renderPage() : <LoginPage handleLogin={handleLogin} />}
    </AppLayout>
  );
}

const LoginPage = ({ handleLogin }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg bg-white p-6 text-center shadow">
      <h1 className="text-3xl font-bold text-gray-900">Welcome to InvestTrack</h1>
      <p className="mt-2 text-gray-600">
        Please sign in to manage your portfolio.
      </p>
      <button
        onClick={handleLogin}
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-lg font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default App;
