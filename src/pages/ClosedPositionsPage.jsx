import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

// --- Helper Functions ---

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = 0;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatPercentage = (value) => {
  if (typeof value !== 'number') {
    value = 0;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return value > 0 ? `+${formatted}` : formatted;
};

const RenderGainLoss = ({ value, formatter = (val) => val }) => {
  const colorClass =
    value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500';
  return <span className={colorClass}>{formatter(value)}</span>;
};

/**
 * Renders the page for viewing closed positions.
 */
const ClosedPositionsPage = ({ user }) => {
  const [closedPositions, setClosedPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Effect 1: Listen to Firestore for closed position changes
  useEffect(() => {
    if (!user) {
      setClosedPositions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const closedCollectionPath = collection(
      db,
      'users',
      user.uid,
      'closed_positions'
    );
    // Sort by exit date, newest first
    const q = query(closedCollectionPath);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const positionsData = [];
        querySnapshot.forEach((doc) => {
          positionsData.push({ id: doc.id, ...doc.data() });
        });
        // Sort in code, as Firestore orderBy() can be complex to set up
        positionsData.sort((a, b) => new Date(b.exitDate) - new Date(a.exitDate));
        setClosedPositions(positionsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching closed positions:', error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Effect 2: Calculate total gain/loss
  const totalPnl = useMemo(() => {
    return closedPositions.reduce((total, pos) => {
      const costBasis = pos.amount * pos.fillPrice;
      const proceeds = pos.amount * pos.exitPrice;
      return total + (proceeds - costBasis);
    }, 0);
  }, [closedPositions]);


  if (!user) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h2 className="text-xl font-semibold text-gray-700">
          Please log in to see your closed positions.
        </h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col items-stretch justify-between sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900">Closed Positions</h1>
        <div className="mt-2 rounded-lg bg-white p-4 shadow sm:mt-0">
          <h3 className="text-sm font-medium uppercase text-gray-500">
            Total Realized PnL
          </h3>
          <div className="mt-1 text-2xl font-semibold">
            <RenderGainLoss value={totalPnl} formatter={formatCurrency} />
          </div>
        </div>
      </div>
      
      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="hidden md:table-row">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Entry Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Entry Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Exit Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Exit Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain ($)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain (%)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {closedPositions.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                  You have no closed positions.
                </td>
              </tr>
            )}
            {closedPositions.map((pos) => {
              const costBasis = pos.amount * pos.fillPrice;
              const proceeds = pos.amount * pos.exitPrice;
              const gainLoss = proceeds - costBasis;
              const gainLossPercent = costBasis === 0 ? 0 : gainLoss / costBasis;

              return (
                <tr key={pos.id} className="block hover:bg-gray-50 md:table-row">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 md:table-cell">
                    {pos.ticker}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {pos.amount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {pos.date}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {formatCurrency(pos.fillPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {pos.exitDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
                    {formatCurrency(pos.exitPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm md:table-cell">
                    <RenderGainLoss value={gainLoss} formatter={formatCurrency} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm md:table-cell">
                    <RenderGainLoss value={gainLossPercent} formatter={formatPercentage} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClosedPositionsPage;

