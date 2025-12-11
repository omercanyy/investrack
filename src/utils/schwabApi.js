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

  const fetchOptions = { ...options, headers };

  const response = await fetch(
    `https://api.schwabapi.com${endpoint}`,
    fetchOptions
  );

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
  const endpoint = `/marketdata/v1/quotes?symbols=${symbols}&fields=quote,extended`;
  // Pass cache option to ensure we get real-time data
  const response = await schwabApi(endpoint, { cache: 'no-cache' });

  const priceData = {};
  for (const ticker in response) {
    if (response[ticker] && response[ticker].quote) {
      const quote = response[ticker].quote;
      const extended = response[ticker].extended;

      if (extended && extended.extendedHours) {
        priceData[ticker] = extended.lastPrice || quote.lastPrice || quote.lastPriceInDouble;
      } else {
        priceData[ticker] = quote.lastPrice || quote.lastPriceInDouble;
      }
    }
  }

  return priceData;
};

export const fetchBetaValues = async (tickers) => {
  const symbols = tickers.join(',');
  console.log('Fetching beta values for tickers:', symbols);
  const endpoint = `/marketdata/v1/instruments?symbol=${symbols}&projection=fundamental`;
  // Use default cache behavior for beta values
  const response = await schwabApi(endpoint, { cache: 'default' });

  const betaData = {};
  if (response.instruments) {
    response.instruments.forEach((instrument) => {
      if (instrument.fundamental) {
        betaData[instrument.symbol] = instrument.fundamental.beta;
      }
    });
  }
  return betaData;
};

export const fetchAvailableCash = async () => {
  const endpoint = '/trader/v1/accounts';
  const response = await schwabApi(endpoint, { cache: 'no-cache' });
  const cashByAccount = {};
  if (response && Array.isArray(response)) {
    response.forEach(account => {
      if (account.securitiesAccount && account.securitiesAccount.currentBalances && account.securitiesAccount.accountNumber) {
        cashByAccount[account.securitiesAccount.accountNumber] = account.securitiesAccount.currentBalances.cashAvailableForTrading || 0;
      }
    });
  }
  return cashByAccount;
};

export const fetchHistoricalPrices = async (ticker, date) => {
  const endDate = new Date(date).getTime();
  const startDate = new Date(date);
  startDate.setFullYear(startDate.getFullYear() - 20);
  const endpoint = `/marketdata/v1/pricehistory?symbol=${ticker}&periodType=year&period=20&frequencyType=daily&frequency=1&endDate=${endDate}&startDate=${startDate.getTime()}`;
  // Use default cache for historical data
  return await schwabApi(endpoint, { cache: 'default' });
};
