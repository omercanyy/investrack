const API_KEY = import.meta.env.VITE_EODHD_API_KEY;
const API_URL = 'https://eodhd.com/api';
const MAX_RETRIES = 3;

const fetchWithRetry = async (url, retryCount = 0) => {
  try {
    const response = await fetch(url);

    if ([429, 503, 504].includes(response.status) && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.warn(`API Error: Status ${response.status}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retryCount + 1);
    }

    return response;

  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.warn(`Network Error: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retryCount + 1);
    }
    throw new Error(`Failed to fetch after ${MAX_RETRIES} attempts: ${error.message}`);
  }
};


export const fetchCurrentPrices = async (tickers) => {
  if (!tickers || tickers.length === 0) return {};

  const pricePromises = tickers.map((ticker) => {
    const url = `${API_URL}/real-time/${ticker}?api_token=${API_KEY}&fmt=json`;
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

export const fetchHistoricalPrice = async (ticker, date) => {
  const cacheKey = `${ticker}-${date}`;
  
  const cachedPrice = localStorage.getItem(cacheKey);
  if (cachedPrice) {
    return parseFloat(cachedPrice);
  }

  try {
    const url = `${API_URL}/eod/${ticker}?api_token=${API_KEY}&fmt=json&from=${date}&to=${date}`;
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      throw new Error(`Historical API request failed for ${ticker} on ${date}`);
    }
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].close) {
      const price = data[0].close;
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

