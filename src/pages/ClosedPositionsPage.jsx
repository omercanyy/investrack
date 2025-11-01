import React, { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import AdminTools from '../components/AdminTools';

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


const ClosedPositionsPage = () => {
  const { isLoading, closedPositions } = usePortfolio();

  const processedPositions = useMemo(() => {
    return closedPositions
      .map((pos) => {
        const costBasis = pos.amount * pos.fillPrice;
        const proceeds = pos.amount * pos.exitPrice;
        const gainLoss = proceeds - costBasis;
        const gainLossPercent = costBasis === 0 ? 0 : gainLoss / costBasis;
        return {
          ...pos,
          costBasis,
          proceeds,
          gainLoss,
          gainLossPercent,
        };
      })
      .sort((a, b) => new Date(b.exitDate) - new Date(a.exitDate));
  }, [closedPositions]);

  if (isLoading && processedPositions.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Closed Positions</h1>
        <AdminTools collectionName="closed_positions" title="Closed Positions" />
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Closed Positions</h1>
      
      <AdminTools collectionName="closed_positions" title="Closed Positions" />

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                Exit Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fill Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Exit Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cost Basis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Proceeds
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
            {processedPositions.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
                  No closed positions yet.
                </td>
              </tr>
            ) : (
              processedPositions.map((pos) => (
                <tr key={pos.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {pos.ticker}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {pos.amount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {pos.date}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {pos.exitDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(pos.fillPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(pos.exitPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(pos.costBasis)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(pos.proceeds)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <RenderGainLoss
                      value={pos.gainLoss}
                      formatter={formatCurrency}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <RenderGainLoss
                      value={pos.gainLossPercent}
                      formatter={formatPercentage}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClosedPositionsPage;