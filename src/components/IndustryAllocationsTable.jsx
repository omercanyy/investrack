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

const IndustryAllocationsTable = ({ positions, totalValue, cash }) => {
  const byIndustry = positions.reduce((acc, pos) => {
    const industry = pos.industry || 'Unassigned';
    if (!acc[industry]) {
      acc[industry] = 0;
    }
    acc[industry] += pos.currentValue;
    return acc;
  }, {});

  const tableData = Object.entries(byIndustry).map(([industry, value]) => ({
    industry,
    value,
  }));

  tableData.push({ industry: 'Cash', value: cash });

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
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tableData.map(({ industry, value }) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IndustryAllocationsTable;
