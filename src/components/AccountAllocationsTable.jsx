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
      acc[accountKey] = 0;
    }
    const currentPrice = priceData[pos.ticker] || 0;
    acc[accountKey] += pos.amount * currentPrice;
    return acc;
  }, {});

  // Add cash to each account's total
  Object.entries(cashByAccount).forEach(([account, cash]) => {
    if (!byAccount[account]) {
      byAccount[account] = 0;
    }
    byAccount[account] += cash;
  });

  const tableData = Object.entries(byAccount).map(([account, value]) => ({
    account: accountNames[account] || account,
    value,
  }));

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
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tableData.map(({ account, value }) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountAllocationsTable;