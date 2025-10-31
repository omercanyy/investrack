import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { AppLayout } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PositionsPage from './pages/PositionsPage';
import ClosedPositionsPage from './pages/ClosedPositionsPage'; // Import new page

function App() {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  /**
   * Effect to listen for auth changes and set up user document.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          // Create new user document
          await setDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
          });
        }
        setUser(user);
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoadingAuth(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Handles Google Sign-In popup.
   */
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // The onAuthStateChanged listener will handle the user state update
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  /**
   * Handles Sign-Out.
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle the user state update
    } catch (error) {
      console.error('Error during sign-out:', error);
    }
  };

  /**
   * Simple router to render the active page.
   */
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage user={user} />;
      case 'positions':
        return <PositionsPage user={user} />;
      case 'closed':
        return <ClosedPositionsPage user={user} />; // Add new case
      default:
        return <DashboardPage user={user} />;
    }
  };
  
  // Show a global loading spinner while checking auth
  if (isLoadingAuth) {
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
      {user ? (
        renderPage()
      ) : (
        <LoginPage handleLogin={handleLogin} />
      )}
    </AppLayout>
  );
}

/**
 * A simple login page component for unauthenticated users.
 */
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

