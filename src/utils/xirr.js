import { xirr } from '@webcarrot/xirr';
import schwabApi from './schwabApi';

function prepareTransactions(positions, closedPositions, totalCurrentValue) {
  const transactions = [];

  positions.forEach((pos) => {
    transactions.push({
      amount: -1 * pos.amount * pos.fillPrice,
      date: new Date(pos.date),
    });
  });

  closedPositions.forEach((pos) => {
    transactions.push({
      amount: pos.amount * pos.exitPrice,
      date: new Date(pos.exitDate),
    });
    transactions.push({
      amount: -1 * pos.amount * pos.fillPrice,
      date: new Date(pos.date),
    });
  });

  if (totalCurrentValue > 0) {
    transactions.push({
      amount: totalCurrentValue,
      date: new Date(),
    });
  }

  return transactions;
}

async function fetchHistoricalPrice(ticker, date) {
  const endDate = new Date(date).getTime();
  const startDate = new Date(date);
  startDate.setFullYear(startDate.getFullYear() - 20);
  const endpoint = `/marketdata/v1/pricehistory?symbol=${ticker}&periodType=year&period=20&frequencyType=daily&frequency=1&endDate=${endDate}&startDate=${startDate.getTime()}`;

  try {
    const response = await schwabApi(endpoint);
    const candles = response.candles;
    if (!candles || candles.length === 0) {
      return 0;
    }

    // Find the candle for the specific date
    const targetDate = new Date(date);
    const targetTimestamp = targetDate.getTime();
    const candle = candles.find(c => {
      const candleDate = new Date(c.datetime);
      return candleDate.getFullYear() === targetDate.getFullYear() &&
             candleDate.getMonth() === targetDate.getMonth() &&
             candleDate.getDate() === targetDate.getDate();
    });

    return candle ? candle.close : 0;
  } catch (error) {
    console.error(`Error fetching historical price for ${ticker}:`, error);
    return 0;
  }
}

async function simulateBenchmark(
  positions,
  closedPositions,
  benchmarkTicker,
  benchmarkCurrentPrice
) {
  const allBuys = [
    ...positions.map((p) => ({
      cost: p.amount * p.fillPrice,
      date: p.date,
    })),
    ...closedPositions.map((p) => ({
      cost: p.amount * p.fillPrice,
      date: p.date,
    })),
  ];

  let totalSharesOwned = 0;
  const simulatedTransactions = [];

  const pricePromises = allBuys.map(async (buy) => {
    const benchmarkPriceOnDate = await fetchHistoricalPrice(
      benchmarkTicker,
      buy.date
    );
    if (benchmarkPriceOnDate === 0) return;

    const sharesBought = buy.cost / benchmarkPriceOnDate;
    totalSharesOwned += sharesBought;

    simulatedTransactions.push({
      amount: -buy.cost,
      date: new Date(buy.date),
    });
  });

  await Promise.all(pricePromises);

  if (totalSharesOwned > 0 && benchmarkCurrentPrice > 0) {
    simulatedTransactions.push({
      amount: totalSharesOwned * benchmarkCurrentPrice,
      date: new Date(),
    });
  }

  return simulatedTransactions;
}

export const calculateAllXIRR = async (
  positions,
  closedPositions,
  totalCurrentValue,
  spyPrice,
  gldPrice
) => {
  try {
    const portfolioTxs = prepareTransactions(
      positions,
      closedPositions,
      totalCurrentValue
    );
    const portfolioResult = portfolioTxs.length > 1 ? await xirr(portfolioTxs) : 0;

    const spyTxs = await simulateBenchmark(
      positions,
      closedPositions,
      'SPY',
      spyPrice
    );
    const spyResult = spyTxs.length > 1 ? await xirr(spyTxs) : 0;

    const gldTxs = await simulateBenchmark(
      positions,
      closedPositions,
      'GLD',
      gldPrice
    );
    const gldResult = gldTxs.length > 1 ? await xirr(gldTxs) : 0;

    return {
      portfolio: portfolioResult,
      spy: spyResult,
      gld: gldResult,
    };
  } catch (error) {
    console.error("Error calculating XIRR with '@webcarrot/xirr':", error);
    return { portfolio: 0, spy: 0, gld: 0 };
  }
};
