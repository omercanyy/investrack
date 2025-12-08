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

const StrategyAllocationsTable = ({ positions, totalValue, cash }) => {
  const byStrategy = positions.reduce((acc, pos) => {
    const strategy = pos.strategy || 'Unassigned';
    if (!acc[strategy]) {
      acc[strategy] = 0;
    }
    acc[strategy] += pos.currentValue;
    return acc;
  }, {});

  const tableData = Object.entries(byStrategy).map(([strategy, value]) => ({
    strategy,
    value,
  }));

  tableData.push({ strategy: 'Cash', value: cash });

  tableData.sort((a, b) => b.value - a.value);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Strategy
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
          {tableData.map(({ strategy, value }) => (
            <tr key={strategy}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {strategy}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(value)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {((value / totalValue) * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StrategyAllocationsTable;
