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

const formatGain = (gain, gainPercent) => {
  const gainFormatted = formatCurrency(gain);
  const percentFormatted = `${(gainPercent * 100).toFixed(2)}%`;
  return `${gainFormatted} (${percentFormatted})`;
};

const RenderGainLoss = ({ value, formatter = (val) => val }) => {
  const colorClass =
    value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500';
  return <span className={colorClass}>{formatter(value)}</span>;
};

const IndustryAllocationsTable = ({ positions, totalValue, cash }) => {
  const byIndustry = positions.reduce((acc, pos) => {
    const industry = pos.industry || 'Unassigned';
    if (!acc[industry]) {
      acc[industry] = { value: 0, cost: 0 };
    }
    acc[industry].value += pos.currentValue;
    acc[industry].cost += pos.totalCostBasis;
    return acc;
  }, {});

  const tableData = Object.entries(byIndustry).map(([industry, data]) => {
    const gain = data.value - data.cost;
    const gainPercent = data.cost === 0 ? 0 : gain / data.cost;
    return {
      industry,
      value: data.value,
      gain,
      gainPercent,
    };
  });

  tableData.push({ industry: 'Cash', value: cash, gain: 0, gainPercent: 0 });

  tableData.sort((a, b) => b.value - a.value);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Industry
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Allocation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gain
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tableData.map(({ industry, value, gain, gainPercent }) => (
            <tr key={industry}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {industry}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(value)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {((value / totalValue) * 100).toFixed(2)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {industry === 'Cash' ? '-' : (
                  <RenderGainLoss
                    value={gain}
                    formatter={() => formatGain(gain, gainPercent)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IndustryAllocationsTable;
