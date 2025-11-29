import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

const functions = getFunctions(app);
const refreshSchwabToken = httpsCallable(functions, 'refreshSchwabToken');

let accessToken = null;

const getAccessToken = async () => {
  if (accessToken) {
    return accessToken;
  }

  try {
    const result = await refreshSchwabToken();
    accessToken = result.data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Error refreshing Schwab token:', error);
    throw new Error('Failed to refresh Schwab token.');
  }
};

const schwabApi = async (endpoint, options = {}) => {
  const token = await getAccessToken();

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`https://api.schwabapi.com${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Access token expired, refresh and retry
    accessToken = null; // Force re-fetch of token
    const newToken = await getAccessToken();
    const newHeaders = {
      ...options.headers,
      Authorization: `Bearer ${newToken}`,
    };
    const newResponse = await fetch(`https://api.schwabapi.com${endpoint}`, {
      ...options,
      headers: newHeaders,
    });
    return newResponse.json();
  }

  return response.json();
};

export const fetchCurrentPrices = async (tickers) => {
  const symbols = tickers.join(',');
  console.log('Fetching current prices for tickers:', symbols);
  const endpoint = `/marketdata/v1/quotes?symbols=${symbols}`;
  const response = await schwabApi(endpoint);

  const priceData = {};
  for (const ticker in response) {
    priceData[ticker] = response[ticker].quote.lastPrice;
  }

  return priceData;
};

export default schwabApi;
