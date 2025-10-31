import React from 'react';
import {
  DashboardIcon,
  PositionsIcon,
  MenuIcon,
  CloseIcon,
  GoogleIcon,
} from './Icons';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

/**
 * Renders a single navigation link in the sidebar.
 */
function NavLink({ icon, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
    >
      {icon}
      <span className="ml-3 flex-1 whitespace-nowrap text-left">{text}</span>
    </button>
  );
}

/**
 * Renders the main sidebar navigation.
 */
function Sidebar({ isSidebarOpen, closeSidebar, onNavClick, activePage }) {
  const getLinkClasses = (page) => {
    return activePage === page
      ? 'bg-gray-700 text-white' // Active state
      : 'text-gray-400 hover:bg-gray-700 hover:text-white'; // Inactive state
  };

  return (
    <>
      {/* Overlay for mobile (when sidebar is open) */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-full w-64 bg-gray-800 transition-transform md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
          <div className="mb-5 flex items-center justify-between p-2">
            <a href="#" className="flex items-center">
              <span className="self-center text-xl font-semibold text-white">
                InvestTrack
              </span>
            </a>
            {/* Mobile close button */}
            <button onClick={closeSidebar} className="text-gray-400 md:hidden">
              <CloseIcon />
            </button>
          </div>
          <ul className="space-y-2 font-medium">
            <li>
              <NavLink
                icon={<DashboardIcon />}
                text="Dashboard"
                onClick={() => onNavClick('dashboard')}
              />
            </li>
            <li>
              <NavLink
                icon={<PositionsIcon />}
                text="Positions"
                onClick={() => onNavClick('positions')}
              />
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}

/**
 * Renders the Login/Logout buttons and user info.
 */
function AuthControls({ user }) {
  // Handle Google Login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth listener (in App) will handle the user state update
    } catch (error) {
      console.error('Error during sign in:', error);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Auth listener (in App) will handle the user state update
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Conditional rendering
  if (user) {
    // User is logged in
    return (
      <div className="flex items-center space-x-3">
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="h-8 w-8 rounded-full"
        />
        <span className="hidden text-sm font-medium text-white sm:block">
          {user.displayName}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-500"
        >
          Log Out
        </button>
      </div>
    );
  }

  // User is not logged in
  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-gray-100"
    >
      <GoogleIcon />
      Sign in with Google
    </button>
  );
}

/**
 * Renders the top bar and the main content area.
 */
function MainContent({ user, onMenuClick, activePage, children }) {
  // Helper function to get the title for the top bar
  const getPageTitle = () => {
    if (activePage === 'dashboard') return 'Dashboard';
    if (activePage === 'positions') return 'Positions';
    return 'Overview';
  };

  return (
    <div className="flex-1">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-gray-800 px-4 shadow-md">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="text-gray-400 hover:text-white md:hidden"
        >
          <MenuIcon />
        </button>

        {/* This is a spacer on mobile, or a title on desktop */}
        <div className="hidden text-xl font-semibold text-white md:block">
          {getPageTitle()}
        </div>

        {/* Auth controls */}
        <div className="flex items-center">
          <AuthControls user={user} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="overflow-y-auto bg-gray-100 p-4 md:p-8">
        {/* Conditionally render the active page */}
        {children}
      </main>
    </div>
  );
}

/**
 * Main Layout Component
 * This groups all our layout pieces together.
 */
export function Layout({
  user,
  activePage,
  onNavClick,
  isSidebarOpen,
  setIsSidebarOpen,
  children,
}) {
  return (
    <div className="flex h-screen w-full bg-gray-800">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
        onNavClick={onNavClick}
        activePage={activePage}
      />
      <MainContent
        user={user}
        onMenuClick={() => setIsSidebarOpen(true)}
        activePage={activePage}
      >
        {children}
      </MainContent>
    </div>
  );
}

