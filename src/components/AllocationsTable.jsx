import React from 'react';

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = 0;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const AllocationsTable = ({ positions, totalValue, cash }) => {
  const sortedPositions = [...positions].sort((a, b) => b.currentValue - a.currentValue);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ticker
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Allocation
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedPositions.map((pos) => (
            <tr key={pos.ticker}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {pos.ticker}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(pos.currentValue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {((pos.currentValue / totalValue) * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              CASH
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatCurrency(cash)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {((cash / totalValue) * 100).toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AllocationsTable;
