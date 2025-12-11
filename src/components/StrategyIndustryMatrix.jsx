import React from 'react';

const formatPercentage = (value) => {
  if (typeof value !== 'number' || value === 0) {
    return '-';
  }
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return value > 0 ? `+${formatted}` : formatted;
};

const RenderGainLoss = ({ value }) => {
  if (value === 0) {
    return <span className="text-gray-500">-</span>;
  }
  const colorClass =
    value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500';
  return <span className={colorClass}>{formatPercentage(value)}</span>;
};

const StrategyIndustryMatrix = ({ matrix, strategies, industries }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Strategy
            </th>
            {industries.map(industry => (
              <th key={industry} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {industry}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {strategies.map(strategy => (
            <tr key={strategy}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {strategy}
              </td>
              {industries.map(industry => (
                <td key={industry} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <RenderGainLoss value={matrix[strategy]?.[industry] || 0} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StrategyIndustryMatrix;

