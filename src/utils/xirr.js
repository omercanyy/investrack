import { xirr } from '@webcarrot/xirr';

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

function findPriceInHistory(history, date) {
  if (!history || history.length === 0) return null;
  
  const targetTime = new Date(date).setHours(0, 0, 0, 0);

  let closestCandle = null;
  for (const candle of history) {
    const candleTime = new Date(candle.datetime).setHours(0, 0, 0, 0);
    if (candleTime <= targetTime) {
      closestCandle = candle;
    } else {
      break;
    }
  }
  return closestCandle ? closestCandle.close : null;
}

async function simulateBenchmark(
  positions,
  closedPositions,
  benchmarkCurrentPrice,
  benchmarkHistory
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

  for (const buy of allBuys) {
    const benchmarkPriceOnDate = findPriceInHistory(benchmarkHistory, buy.date);

    if (!benchmarkPriceOnDate) {
      continue;
    }

    const sharesBought = buy.cost / benchmarkPriceOnDate;
    totalSharesOwned += sharesBought;

    simulatedTransactions.push({
      amount: -buy.cost,
      date: new Date(buy.date),
    });
  }

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
  gldPrice,
  spyHistory,
  gldHistory,
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
      spyPrice,
      spyHistory
    );
    const spyResult = spyTxs.length > 1 ? await xirr(spyTxs) : 0;

    const gldTxs = await simulateBenchmark(
      positions,
      closedPositions,
      gldPrice,
      gldHistory
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
