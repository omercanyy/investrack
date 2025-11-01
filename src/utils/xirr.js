import xirr from 'xirr';
import { fetchHistoricalPrice } from './api';

/**
 * Prepares the transaction list for the XIRR calculation.
 * @param {Array} positions - All current positions
 * @param {Array} closedPositions - All closed positions
 * @param {number} totalCurrentValue - The total current market value of all holdings
 * @returns {Array} - A list of transactions formatted for the xirr library
 */
function prepareTransactions(positions, closedPositions, totalCurrentValue) {
  const transactions = [];

  // 1. Add all "buys" (negative cash flow)
  positions.forEach((pos) => {
    transactions.push({
      amount: -1 * pos.amount * pos.fillPrice, // Cash out
      date: new Date(pos.date),
    });
  });

  // 2. Add all "sells" (positive cash flow)
  closedPositions.forEach((pos) => {
    transactions.push({
      amount: pos.amount * pos.exitPrice, // Cash in
      date: new Date(pos.exitDate),
    });
    // Also add the original "buy" for this closed position
    transactions.push({
      amount: -1 * pos.amount * pos.fillPrice, // Cash out
      date: new Date(pos.date),
    });
  });

  // 3. Add today's total value as a final "sell"
  if (totalCurrentValue > 0) {
    transactions.push({
      amount: totalCurrentValue, // Cash in (if we sold everything today)
      date: new Date(),
    });
  }

  return transactions;
}

/**
 * Simulates a "Buy & Hold" strategy for a benchmark ticker (e.g., SPY).
 * @param {Array} positions - All current positions
 * @param {Array} closedPositions - All closed positions
 * @param {string} benchmarkTicker - e.g., 'SPY.US'
 * @param {number} benchmarkCurrentPrice - The current price of the benchmark
 * @returns {Array} - A list of simulated transactions
 */
async function simulateBenchmark(
  positions,
  closedPositions,
  benchmarkTicker,
  benchmarkCurrentPrice
) {
  // For a true "Buy and Hold" simulation, we only care about the cash outflows (buys).
  // We take the initial buy-in from all positions, both open and closed.
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

  // Use Promise.all to fetch all historical prices in parallel
  const pricePromises = allBuys.map(async (buy) => {
    // Get the benchmark's price on the day of the buy
    const benchmarkPriceOnDate = await fetchHistoricalPrice(
      benchmarkTicker,
      buy.date
    );
    if (benchmarkPriceOnDate === 0) return; // Skip if no price data

    // Calculate how many shares of the benchmark could have been bought
    const sharesBought = buy.cost / benchmarkPriceOnDate;
    totalSharesOwned += sharesBought;

    // Add the cash outflow to our transaction list
    simulatedTransactions.push({
      amount: -buy.cost, // Cash out
      date: new Date(buy.date),
    });
  });

  await Promise.all(pricePromises);

  // Add the final "sell" of all shares owned at today's price
  if (totalSharesOwned > 0 && benchmarkCurrentPrice > 0) {
    simulatedTransactions.push({
      amount: totalSharesOwned * benchmarkCurrentPrice,
      date: new Date(),
    });
  }

  return simulatedTransactions;
}

/**
 * Calculates XIRR for the portfolio and benchmarks.
 */
export const calculateAllXIRR = async (
  positions,
  closedPositions,
  totalCurrentValue,
  spyPrice,
  gldPrice
) => {
  try {
    // 1. Calculate Portfolio XIRR
    const portfolioTxs = prepareTransactions(
      positions,
      closedPositions,
      totalCurrentValue
    );
    const portfolioXIRR = portfolioTxs.length > 1 ? xirr(portfolioTxs) : 0;

    // 2. Simulate and Calculate SPY XIRR
    const spyTxs = await simulateBenchmark(
      positions,
      closedPositions,
      'SPY.US',
      spyPrice
    );
    const spyXIRR = spyTxs.length > 1 ? xirr(spyTxs) : 0;

    // 3. Simulate and Calculate GLD XIRR
    const gldTxs = await simulateBenchmark(
      positions,
      closedPositions,
      'GLD.US',
      gldPrice
    );
    const gldXIRR = gldTxs.length > 1 ? xirr(gldTxs) : 0;

    return {
      portfolio: portfolioXIRR.rate || 0,
      spy: spyXIRR.rate || 0,
      gld: gldXIRR.rate || 0,
    };
  } catch (error) {
    console.error('Error calculating XIRR:', error);
    return { portfolio: 0, spy: 0, gld: 0 };
  }
};
