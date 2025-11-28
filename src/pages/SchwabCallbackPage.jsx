import React, { useEffect } from 'react';

const SchwabCallbackPage = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      console.log('Schwab authorization code:', code);
      // Next step would be to send this code to the backend
      // to exchange it for an access token.
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Authenticating with Schwab...
        </h1>
        <p className="mt-2 text-gray-600">
          Please wait while we connect your account. You can close this window shortly.
        </p>
      </div>
    </div>
  );
};

export default SchwabCallbackPage;
