import React, { useState, useEffect } from 'react';
// Import Firebase services
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// --- Icons ---
// Using SVG paths for clean, fast-loading icons instead of image files.

const DashboardIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1V10a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 001 1h2a1 1 0 001-1V10a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 001 1h3m-6 0a1 1 0 001-1V10a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 001 1h2a1 1 0 001-1V10"
    />
  </svg>
);

const PositionsIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48">
    <path
      fill="#4285F4"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.06 6.25C12.97 13.98 18.25 9.5 24 9.5z"
    ></path>
    <path
      fill="#34A853"
      d="M46.94 24.5c0-1.57-.14-3.09-.41-4.54H24v8.51h12.9C36.4 32.62 33.1 36 29.2 36c-5.73 0-10.37-4.64-10.37-10.37s4.64-10.37 10.37-10.37c3.2 0 5.48 1.38 6.74 2.59l6.22-6.22C38.03 5.61 32.75 3 26.8 3c-8.84 0-16.14 7.2-16.14 16.14s7.3 16.14 16.14 16.14c7.61 0 13.76-5.48 15.3-12.7h-15.3v-8.51H46.94z"
    ></path>
    <path
      fill="#FBBC05"
      d="M10.62 28.59c-.6-1.82-.94-3.75-.94-5.76s.34-3.94.94-5.76L2.56 10.82C.9 14.25 0 18.27 0 22.83s.9 8.58 2.56 12.01l8.06-6.25z"
    ></path>
    <path
      fill="#EA4335"
      d="M24 48c6.47 0 11.94-2.12 15.9-5.61l-7.01-5.46c-2.13 1.43-4.84 2.29-7.89 2.29-5.73 0-10.37-4.64-10.37-10.37s4.64-10.37 10.37-10.37c3.2 0 5.48 1.38 6.74 2.59l6.22-6.22C38.03 5.61 32.75 3 26.8 3c-8.84 0-16.14 7.2-16.14 16.14s7.3 16.14 16.14 16.14c7.61 0 13.76-5.48 15.3-12.7h-15.3v-8.51H46.94c.27 1.46.41 2.98.41 4.54C47.35 38.08 40.06 48 24 48z"
    ></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

// --- Components ---

/**
 * Renders a single navigation link in the sidebar.
 */
function NavLink({ icon, text }) {
  return (
    <a
      href="#"
      className="flex items-center rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
    >
      {icon}
      <span className="ml-3 flex-1 whitespace-nowrap">{text}</span>
    </a>
  );
}

/**
 * Renders the main sidebar navigation.
 * Now responsive: hidden on mobile, visible on desktop.
 */
function Sidebar({ isSidebarOpen, closeSidebar }) {
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
              <NavLink icon={<DashboardIcon />} text="Dashboard" />
            </li>
            <li>
              <NavLink icon={<PositionsIcon />} text="Positions" />
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}

/**
 * Renders the Login/Logout buttons and user info.
 * This is where all the auth logic happens.
 */
function AuthControls({ user }) {
  // Story [2.3]: Handle Google Login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth listener (in App) will handle the user state update
    } catch (error) {
      console.error('Error during sign in:', error);
    }
  };

  // Story [2.4]: Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Auth listener (in App) will handle the user state update
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Story [2.2] & [2.4]: Conditional rendering
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
function MainContent({ user, onMenuClick }) {
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
          Dashboard
        </div>

        {/* Auth controls */}
        <div className="flex items-center">
          <AuthControls user={user} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="overflow-y-auto bg-gray-100 p-4 md:p-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Main Content Area
        </h1>
        <p className="text-gray-700">
          This is where the dashboards, tables, and content will go.
        </p>
        {user ? (
          <p className="mt-4 text-green-700">
            You are logged in as {user.email}.
          </p>
        ) : (
          <p className="mt-4 text-red-700">
            Please log in to see your data.
          </p>
        )}
      </main>
    </div>
  );
}

/**
 * Main App Component
 * This component now manages auth state and sidebar visibility.
 */
function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null); // Auth state
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Loading state

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

  return (
    <div className="flex h-screen w-full bg-gray-800">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
      />
      <MainContent user={user} onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
}

export default App;
