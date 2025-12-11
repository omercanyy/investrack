import React from 'react';
import {
  DashboardIcon,
  PositionsIcon,
  MenuIcon,
  CloseIcon,
} from './Icons';

export const AppLayout = ({
  children,
  user,
  handleLogout,
  activePage,
  setActivePage,
  isSchwabConnected,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          user={user}
          handleLogout={handleLogout}
          setIsSidebarOpen={setIsSidebarOpen}
          isSchwabConnected={isSchwabConnected}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, activePage, setActivePage }) => {
  
  const handleLinkClick = (page) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };
  
  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

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
          <SidebarLink
            icon={<PositionsIcon />}
            name="Export"
            href="export"
            isActive={activePage === 'export'}
            onClick={() => handleLinkClick('export')}
          />
        </nav>
      </div>
    </>
  );
};

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

const TopBar = ({ user, handleLogout, setIsSidebarOpen, isSchwabConnected }) => {
  const handleConnectToSchwab = () => {
    const clientId = import.meta.env.VITE_SCHWAB_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_SCHWAB_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error("Schwab client ID or redirect URI is not configured in .env file.");
      alert("Schwab integration is not configured. Please contact support.");
      return;
    }

    const schwabAuthUrl = `https://api.schwabapi.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;

    // Open in a new tab
    window.open(schwabAuthUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="flex h-16 w-full items-center justify-between bg-white px-4 shadow-md md:px-8">
      <button
        className="text-gray-500 hover:text-gray-700 lg:hidden"
        onClick={() => setIsSidebarOpen(true)}
      >
        <MenuIcon />
      </button>

      <div className="flex-1"></div>

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
              onClick={handleConnectToSchwab}
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Connect to Schwab
            </button>
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
