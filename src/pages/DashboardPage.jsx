import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { getBetaCategoryClasses } from '../utils/betaCalculator';
import StatCard from '../components/StatCard';
import AllocationsTable from '../components/AllocationsTable';
import CollapsibleCard from '../components/CollapsibleCard';
import StrategyAllocationsTable from '../components/StrategyAllocationsTable';
import AccountAllocationsTable from '../components/AccountAllocationsTable';
import IndustryAllocationsTable from '../components/IndustryAllocationsTable';
import PositionsPage from './PositionsPage';
import ClosedPositionsPage from './ClosedPositionsPage';


import { ACCOUNT_TYPES } from '../constants/accounts';

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = 0;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const DashboardPage = () => {
  const {
    isLoading,
    positions,
    aggregatedPositions,
    portfolioStats,
    xirrValues,
    realizedGain,
    weightedBeta,
    weightedAbsoluteBeta,
    betaCategory,
    absoluteBetaCategory,
    betaDistribution,
    availableCash,
    priceData,
  } = usePortfolio();

  const totalCash = Object.values(availableCash).reduce((sum, cash) => sum + cash, 0);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
      </div>
    );
  }

  const isPositive = portfolioStats.totalGainLoss > 0;

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Portfolio Value"
          primaryValue={formatCurrency(portfolioStats.totalValue)}
        >
          <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{formatCurrency(portfolioStats.totalGainLoss)}
          </p>
        </StatCard>
        <StatCard
          title="Realized Gain"
          primaryValue={`${realizedGain >= 0 ? '+' : '-'}${formatCurrency(
            Math.abs(realizedGain)
          )}`}
          primaryValueColor={
            realizedGain >= 0 ? 'text-green-500' : 'text-red-500'
          }
        />
        <StatCard
          title="Available Cash"
          primaryValue={formatCurrency(totalCash)}
        >
          <div className="text-xs text-gray-500 mt-1">
            {Object.entries(availableCash).map(([account, cash]) => (
              <div key={account} className="flex justify-between">
                <span>{ACCOUNT_TYPES[account] || `Acc: ${account}`}</span>
                <span>{formatCurrency(cash)}</span>
              </div>
            ))}
          </div>
        </StatCard>
        <StatCard
          title="Portfolio XIRR (annualized)"
          primaryValue={`${(xirrValues.portfolio * 100).toFixed(2)}%`}
          primaryValueColor={xirrValues.portfolio > 0 ? "text-green-500" : "text-red-500"}
        >
          <div className="text-xs text-gray-500 mt-1">
            <p>S&P 500: {(xirrValues.spy * 100).toFixed(2)}% | Gold: {(xirrValues.gld * 100).toFixed(2)}%</p>
          </div>
        </StatCard>
        <StatCard
          title="Weighted Average Portfolio Beta"
          primaryValue={
            <div className="flex items-center gap-x-2">
              <span>{weightedBeta.toFixed(2)}</span>
              <span
                className={`px-2 py-1 text-sm font-medium rounded-full ${getBetaCategoryClasses(betaCategory).badge}`}
              >
                {betaCategory}
              </span>
            </div>
          }
        >
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-x-2">
            <p>Absolute: {weightedAbsoluteBeta.toFixed(2)}</p>
            <div
              className={`w-3 h-3 rounded-full ${getBetaCategoryClasses(absoluteBetaCategory).badge}`}
            ></div>
          </div>
        </StatCard>
      </div>

      <div className="mt-6">
        <CollapsibleCard title="Current Positions" startOpen={false}>
          <PositionsPage />
        </CollapsibleCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <CollapsibleCard title="Allocations by Account">
          <AccountAllocationsTable
            positions={positions}
            totalValue={portfolioStats.totalValue}
            cashByAccount={availableCash}
            accountNames={ACCOUNT_TYPES}
            priceData={priceData}
          />
        </CollapsibleCard>
        <CollapsibleCard title="Allocations by Strategy">
          <StrategyAllocationsTable
            positions={aggregatedPositions}
            totalValue={portfolioStats.totalValue}
            cash={totalCash}
          />
        </CollapsibleCard>
        <CollapsibleCard title="Allocations by Industry">
          <IndustryAllocationsTable
            positions={aggregatedPositions}
            totalValue={portfolioStats.totalValue}
            cash={totalCash}
          />
        </CollapsibleCard>
      </div>
      <div className="mt-6">
        <CollapsibleCard title="Allocations by Ticker">
          <AllocationsTable
            positions={aggregatedPositions}
            totalValue={portfolioStats.totalValue}
            cash={totalCash}
          />
        </CollapsibleCard>
      </div>
      <div className="mt-6">
        <CollapsibleCard title="Risk Analysis">
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aggregatedPositions.map((pos) => (
                  <tr key={pos.ticker}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pos.ticker}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pos.beta !== null ? pos.beta.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getBetaCategoryClasses(pos.betaCategory).badge
                        }`}
                      >
                        {pos.betaCategory}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleCard>
      </div>
      <div className="mt-6">
        <CollapsibleCard title="Closed Positions">
          <ClosedPositionsPage />
        </CollapsibleCard>
      </div>
    </div>
  );
};

export default DashboardPage;