
export const getCategoricBeta = (beta) => {
  if (beta < 0.8) return 'LOW';
  if (beta >= 0.8 && beta <= 1.2) return 'MEDIUM';
  if (beta > 1.2) return 'HIGH';
  return 'N/A';
};

const calculateReturns = (prices) => {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
  }
  return returns;
};

export const calculateBeta = (tickerPrices, marketPrices) => {
  const tickerReturns = calculateReturns(tickerPrices);
  const marketReturns = calculateReturns(marketPrices);

  if (tickerReturns.length < 2 || marketReturns.length < 2) {
    return 1.0; // Not enough data
  }

  const n = Math.min(tickerReturns.length, marketReturns.length);
  const assetReturns = tickerReturns.slice(-n);
  const benchmarkReturns = marketReturns.slice(-n);

  const sumAsset = assetReturns.reduce((acc, ret) => acc + ret, 0);
  const sumBenchmark = benchmarkReturns.reduce((acc, ret) => acc + ret, 0);
  const meanAsset = sumAsset / n;
  const meanBenchmark = sumBenchmark / n;

  let covariance = 0;
  let variance = 0;

  for (let i = 0; i < n; i++) {
    covariance += (assetReturns[i] - meanAsset) * (benchmarkReturns[i] - meanBenchmark);
    variance += Math.pow(benchmarkReturns[i] - meanBenchmark, 2);
  }

  covariance /= (n - 1);
  variance /= (n - 1);

  if (variance === 0) {
    return 1.0; // Avoid division by zero, default to 1
  }

  const beta = covariance / variance;
  return beta;
};
