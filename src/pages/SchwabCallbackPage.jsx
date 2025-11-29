import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase'; // Assuming your firebase app instance is exported from here

const SchwabCallbackPage = () => {
  const [message, setMessage] = useState('Authenticating with Schwab...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // This is the production flow or the second leg of the local flow.
      setMessage('Connecting your account...');
      const functions = getFunctions(app);
      const connectSchwab = httpsCallable(functions, 'connectSchwab');

      connectSchwab({ code })
        .then((result) => {
          setMessage('Successfully connected! You can now close this window.');
          console.log('Connection successful:', result);
        })
        .catch((error) => {
          setMessage(`Connection failed: ${error.message}`);
          console.error('Error connecting Schwab account:', error);
        });
    } else {
      setMessage('No authorization code found.');
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {message}
        </h1>
        <p className="mt-2 text-gray-600">
          Please wait while we process your request.
        </p>
      </div>
    </div>
  );
};

export default SchwabCallbackPage;
