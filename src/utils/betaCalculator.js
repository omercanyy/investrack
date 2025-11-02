
export const getCategoricBeta = (beta) => {
  /*
    -1.2    0    1.2   2.5
  | H  |  M  |  L  |  M  |  H  |
  */
  if (beta <= -1.2 || beta >= 2.5) {
    return 'HIGH';
  } else if (beta >= 1.2 || beta < 0) {
    return 'MEDIUM';
  } else if (beta >= 0 && beta < 1.2) {
    return 'LOW';
  } else {
    return 'UNKNOWN';
  }
};

export const getBetaCategoryColor = (betaCategory) => {
  if (betaCategory === "LOW") {
    return "#b7e1cd"; // light green
  } else if (betaCategory === "MEDIUM") {
    return "#fff2cc"; // light yellow
  } else if (betaCategory === "HIGH") {
    return "#f4c7c3"; // light red
  }
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
