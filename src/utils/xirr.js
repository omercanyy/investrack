import { xirr } from '@webcarrot/xirr';
import { fetchHistoricalPrice } from './api';

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
      'SPY.US',
      spyPrice
    );
    const spyResult = spyTxs.length > 1 ? await xirr(spyTxs) : 0;

    const gldTxs = await simulateBenchmark(
      positions,
      closedPositions,
      'GLD.US',
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
