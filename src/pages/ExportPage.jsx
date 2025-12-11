import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { ACCOUNT_TYPES } from '../constants/accounts';

const ExportPage = () => {
  const { exportableData, generateExportableData } = usePortfolio();

  const generateCsvContent = () => {
    const headers = [
      'Ticker', 'Amount', 'Fill Price', 'Entry Date', 'Exit Price', 'Exit Date', 'Account', 'Status', 'SPY on Entry', 'SPY on Exit'
    ];
    
    const rows = exportableData.map(pos => [
      pos.ticker,
      pos.amount,
      pos.fillPrice,
      pos.date,
      pos.exitPrice,
      pos.exitDate,
      ACCOUNT_TYPES[pos.account] || pos.account,
      pos.isOpen ? 'Open' : 'Closed',
      pos.spyOnEntry,
      pos.spyOnExit,
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  };

  const handleDownload = () => {
    const csvContent = generateCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'positions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Export Data</h1>
        <div>
          <button
            onClick={generateExportableData}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 mr-2"
          >
            Regenerate
          </button>
          <button
            onClick={handleDownload}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
          >
            Download CSV
          </button>
        </div>
      </div>
      <div className="prose max-w-none">
        <p>
          This data combines both your open and closed positions into a single CSV format. 
          For open positions, the <code>Exit Price</code> is the current market price and the <code>Exit Date</code> is today's date.
          The <code>SPY on Entry</code> and <code>SPY on Exit</code> columns are provided for debugging and analysis purposes.
        </p>
      </div>
      <textarea
        readOnly
        value={generateCsvContent()}
        className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm mt-4"
      />
    </div>
  );
};

export default ExportPage;
