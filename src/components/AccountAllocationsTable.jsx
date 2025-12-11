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

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const AccountAllocationsTable = ({
  positions,
  totalValue,
  cashByAccount,
  accountNames,
  priceData,
}) => {
  const accountNameToId = Object.entries(accountNames).reduce((acc, [id, name]) => {
    acc[name.toUpperCase()] = id;
    return acc;
  }, {});

  const byAccount = positions.reduce((acc, pos) => {
    let accountKey = pos.account || 'Unassigned';
    if (isNaN(accountKey)) {
      const upperCaseAccount = accountKey.toUpperCase();
      accountKey = accountNameToId[upperCaseAccount] || toTitleCase(accountKey);
    }

    if (!acc[accountKey]) {
      acc[accountKey] = { value: 0, cost: 0 };
    }
    const currentPrice = priceData[pos.ticker] || 0;
    acc[accountKey].value += pos.amount * currentPrice;
    acc[accountKey].cost += pos.amount * pos.fillPrice;
    return acc;
  }, {});

  // Add cash to each account's total
  Object.entries(cashByAccount).forEach(([account, cash]) => {
    if (!byAccount[account]) {
      byAccount[account] = { value: 0, cost: 0 };
    }
    byAccount[account].value += cash;
    byAccount[account].cost += cash;
  });

  const tableData = Object.entries(byAccount).map(([account, data]) => {
    const gain = data.value - data.cost;
    const gainPercent = data.cost === 0 ? 0 : gain / data.cost;
    return {
      account: accountNames[account] || account,
      value: data.value,
      gain,
      gainPercent,
    };
  });

  tableData.sort((a, b) => b.value - a.value);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account
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
          {tableData.map(({ account, value, gain, gainPercent }) => (
            <tr key={account}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {account}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(value)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) : 0}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {gainPercent === 0 && gain === 0 ? '-' : (
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

export default AccountAllocationsTable;