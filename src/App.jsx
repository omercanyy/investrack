import React, { useState, useEffect } from 'react';
// Import Firebase services
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Import our new components
import { Layout } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PositionsPage from './pages/PositionsPage';

/**
 * Main App Component
 * This component now ONLY manages top-level state
 * (auth, page routing, sidebar) and renders the layout.
 */
function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null); // Auth state
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Loading state
  const [activePage, setActivePage] = useState('dashboard');

  // Story [2.5]: Listen for auth changes
  useEffect(() => {
    // This is the auth "listener". It fires once on load, and
    // again any time the user logs in or out.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false); // Auth check is complete
    });

    // Cleanup function to remove the listener
    return () => unsubscribe();
  }, []); // Empty array means this effect runs only once on mount

  // If auth is still loading, show a blank page or a spinner
  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <h1 className="text-3xl text-white">Loading...</h1>
      </div>
    );
  }

  // Handler for navigation clicks, passed down to Layout
  const handleNavClick = (page) => {
    setActivePage(page);
    setIsSidebarOpen(false); // Close mobile menu on nav
  };

  return (
    <Layout
      user={user}
      activePage={activePage}
      onNavClick={handleNavClick}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
    >
      {/* Conditionally render the active page component */}
      {activePage === 'dashboard' && <DashboardPage />}
      {activePage === 'positions' && <PositionsPage user={user} />}
    </Layout>
  );
}

export default App;

