import React from 'react';
import {
  DashboardIcon,
  PositionsIcon,
  MenuIcon,
  CloseIcon,
} from './Icons';

/**
 * Renders the main application layout, including Sidebar, TopBar, and MainContent.
 */
export const AppLayout = ({
  children,
  user,
  handleLogout,
  activePage,
  setActivePage,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 1. Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* 2. Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* TopBar */}
        <TopBar
          user={user}
          handleLogout={handleLogout}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

/**
 * Renders the responsive sidebar navigation.
 */
const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, activePage, setActivePage }) => {
  
  const handleLinkClick = (page) => {
    setActivePage(page);
    setIsSidebarOpen(false); // Close mobile sidebar on navigation
  };
  
  return (
    <>
      {/* Mobile Sidebar Backdrop (visible when open) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Content */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-900 text-gray-200 shadow-lg transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 lg:justify-center">
          <h2 className="text-2xl font-bold text-white">InvestTrack</h2>
          <button
            className="text-gray-400 hover:text-white lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="mt-4">
          <SidebarLink
            icon={<DashboardIcon />}
            name="Dashboard"
            href="dashboard"
            isActive={activePage === 'dashboard'}
            onClick={() => handleLinkClick('dashboard')}
          />
          <SidebarLink
            icon={<PositionsIcon />}
            name="Current"
            href="positions"
            isActive={activePage === 'positions'}
            onClick={() => handleLinkClick('positions')}
          />
          <SidebarLink
            icon={<PositionsIcon />}
            name="Closed"
            href="closed"
            isActive={activePage === 'closed'}
            onClick={() => handleLinkClick('closed')}
          />
        </nav>
      </div>
    </>
  );
};

/**
 * Renders a single navigation link in the sidebar.
 */
const SidebarLink = ({ icon, name, href, isActive, onClick }) => {
  const activeClass = isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
  
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center space-x-3 px-4 py-3 ${activeClass}`}
    >
      {icon}
      <span>{name}</span>
    </a>
  );
};

/**
 * Renders the top bar, including the mobile menu button and user profile.
 */
const TopBar = ({ user, handleLogout, setIsSidebarOpen }) => {
  return (
    <header className="flex h-16 w-full items-center justify-between bg-white px-4 shadow-md md:px-8">
      {/* Mobile Menu Button */}
      <button
        className="text-gray-500 hover:text-gray-700 lg:hidden"
        onClick={() => setIsSidebarOpen(true)}
      >
        <MenuIcon />
      </button>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* User Profile / Login */}
      <div className="flex items-center">
        {user ? (
          <div className="flex items-center space-x-3">
            <img
              src={user.photoURL || 'https://placehold.co/40x40/E2E8F0/718096?text=U'}
              alt="User"
              className="h-10 w-10 rounded-full"
            />
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {user.displayName}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Log Out
            </button>
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-500">
            Not logged in
          </span>
        )}
      </div>
    </header>
  );
};

