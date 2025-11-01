// API Configuration
const API_KEY = import.meta.env.VITE_EODHD_API_KEY;
const API_URL = 'https://eodhd.com/api';
const MAX_RETRIES = 3;

/**
 * A wrapper for the native fetch function that includes exponential backoff retries.
 * @param {string} url - The URL to fetch.
 * @param {number} [retryCount=0] - The current retry attempt.
 * @returns {Promise<Response>}
 */
const fetchWithRetry = async (url, retryCount = 0) => {
  try {
    const response = await fetch(url);

    // Check for specific server errors that are worth retrying
    if ([429, 503, 504].includes(response.status) && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.warn(`API Error: Status ${response.status}. Retrying in ${delay}ms...`);
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      // Recursively call with an incremented retry count
      return fetchWithRetry(url, retryCount + 1);
    }

    // For other errors (like 404) or success, return the response immediately
    return response;

  } catch (error) {
    // Handle network errors (e.g., DNS resolution failure)
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.warn(`Network Error: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retryCount + 1);
    }
    // After max retries, throw the error
    throw new Error(`Failed to fetch after ${MAX_RETRIES} attempts: ${error.message}`);
  }
};


/**
 * Fetches the current real-time (delayed) prices for a list of tickers.
 * @param {string[]} tickers - e.g., ['TQQQ.US', 'GOOG.US']
 * @returns {Object} - e.g., { "TQQQ": 58.50, "GOOG": 180.20 }
 */
export const fetchCurrentPrices = async (tickers) => {
  if (!tickers || tickers.length === 0) return {};

  const pricePromises = tickers.map((ticker) => {
    const url = `${API_URL}/real-time/${ticker}?api_token=${API_KEY}&fmt=json`;
    // Use the new retry wrapper
    return fetchWithRetry(url).then((res) => {
      if (!res.ok) {
        throw new Error(`API request failed for ${ticker}: ${res.statusText}`);
      }
      return res.json();
    });
  });

  try {
    const results = await Promise.all(pricePromises);
    const newPriceData = {};
    results.forEach((item) => {
      if (item && item.code && typeof item.close !== 'undefined') {
        newPriceData[item.code.replace('.US', '')] = item.close;
      } else {
        console.warn('Received malformed price data item:', item);
      }
    });
    return newPriceData;
  } catch (error) {
    console.error('Error fetching prices in parallel:', error);
    return {};
  }
};

/**
 * Fetches the end-of-day historical price for a ticker on a specific date.
 * Uses localStorage for caching to avoid repeated API calls.
 * @param {string} ticker - e.g., 'SPY.US'
 * @param {string} date - e.g., '2023-10-30'
 * @returns {number} - The closing price
 */
export const fetchHistoricalPrice = async (ticker, date) => {
  const cacheKey = `${ticker}-${date}`;
  
  // 1. Check cache first
  const cachedPrice = localStorage.getItem(cacheKey);
  if (cachedPrice) {
    return parseFloat(cachedPrice);
  }

  // 2. If not in cache, fetch from API
  try {
    const url = `${API_URL}/eod/${ticker}?api_token=${API_KEY}&fmt=json&from=${date}&to=${date}`;
    // Use the new retry wrapper
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      throw new Error(`Historical API request failed for ${ticker} on ${date}`);
    }
    const data = await response.json();
    
    // The API returns an array, even for one day
    if (data && data.length > 0 && data[0].close) {
      const price = data[0].close;
      // 3. Save to cache
      localStorage.setItem(cacheKey, price);
      return price;
    } else {
      console.warn(`No historical data found for ${ticker} on ${date}`);
      return 0;
    }
  } catch (error) {
    console.error(error);
    return 0;
  }
};

