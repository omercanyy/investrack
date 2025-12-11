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
import StrategyIndustryMatrix from '../components/StrategyIndustryMatrix';


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
    realizedGainPercent,
    weightedBeta,
    weightedAbsoluteBeta,
    betaCategory,
    absoluteBetaCategory,
    betaDistribution,
    availableCash,
    priceData,
    matchedTradeStats,
    strategies,
    industries,
    closedPositions,
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
  const isAlphaPositive = matchedTradeStats.totalAlphaDollars > 0;

  const getXirrColor = (portfolio, spy, gld) => {
    const values = [
      { name: 'portfolio', value: portfolio },
      { name: 'spy', value: spy },
      { name: 'gld', value: gld },
    ];
    values.sort((a, b) => b.value - a.value);
    const portfolioRank = values.findIndex((v) => v.name === 'portfolio');
    if (portfolioRank === 0) return 'text-green-500';
    if (portfolioRank === 2) return 'text-red-500';
    return 'text-yellow-500';
  };

  const xirrColor = getXirrColor(xirrValues.portfolio, xirrValues.spy, xirrValues.gld);

  const getAccountAbbreviation = (accountName) => {
    if (!accountName) return '';
    return accountName.split(' ').map(word => word.charAt(0)).join('').replace('k','');
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Portfolio Value"
          primaryValue={formatCurrency(portfolioStats.totalValue)}
        >
          <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{formatCurrency(portfolioStats.totalGainLoss)} (
            {isPositive ? '+' : ''}
            {(portfolioStats.totalGainLossPercent * 100).toFixed(2)}%)
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
        >
          <p
            className={`text-sm ${
              realizedGain >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            ({realizedGain >= 0 ? '+' : ''}
            {(realizedGainPercent * 100).toFixed(2)}%)
          </p>
        </StatCard>
        <StatCard
          title="Available Cash"
          primaryValue={formatCurrency(totalCash)}
        >
          <div className="text-xs text-gray-500 mt-1">
            {Object.entries(availableCash).map(([account, cash], index) => (
              <span key={account}>
                {getAccountAbbreviation(ACCOUNT_TYPES[account] || `Acc: ${account}`)}: {formatCurrency(cash)}
                {index < Object.keys(availableCash).length - 1 && ' | '}
              </span>
            ))}
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
        <StatCard
          title="Portfolio XIRR (annualized)"
          primaryValue={`${(xirrValues.portfolio * 100).toFixed(2)}%`}
          primaryValueColor={xirrColor}
        >
          <div className="text-xs text-gray-500 mt-1">
            <p>S&P 500: {(xirrValues.spy * 100).toFixed(2)}% | Gold: {(xirrValues.gld * 100).toFixed(2)}%</p>
          </div>
        </StatCard>
        <StatCard
          title="Alpha vs SPY (PME)"
          primaryValue={`${isAlphaPositive ? '+' : '-'}${formatCurrency(Math.abs(matchedTradeStats.totalAlphaDollars))}`}
          primaryValueColor={isAlphaPositive ? 'text-green-500' : 'text-red-500'}
        >
          <p className={`text-sm ${isAlphaPositive ? 'text-green-500' : 'text-red-500'}`}>
            ({isAlphaPositive ? '+' : ''}{(matchedTradeStats.totalAlphaPercent * 100).toFixed(2)}%)
          </p>
        </StatCard>
      </div>

      <div className="mt-6">
        <CollapsibleCard title="Industry x Strategy" startOpen={true}>
          <StrategyIndustryMatrix
            positions={positions}
            closedPositions={closedPositions}
            strategiesData={strategies}
            industriesData={industries}
            priceData={priceData}
          />
        </CollapsibleCard>
      </div>

      <div className="mt-6">
        <CollapsibleCard title="Current Lots" startOpen={false}>
          <PositionsPage />
        </CollapsibleCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <CollapsibleCard title="Current Allocations by Account">
          <AccountAllocationsTable
            positions={positions}
            totalValue={portfolioStats.totalValue - totalCash}
            cashByAccount={availableCash}
            accountNames={ACCOUNT_TYPES}
            priceData={priceData}
          />
        </CollapsibleCard>
        <CollapsibleCard title="Current Allocations by Strategy">
          <StrategyAllocationsTable
            positions={aggregatedPositions}
            totalValue={portfolioStats.totalValue - totalCash}
          />
        </CollapsibleCard>
        <CollapsibleCard title="Current Allocations by Industry">
          <IndustryAllocationsTable
            positions={aggregatedPositions}
            totalValue={portfolioStats.totalValue - totalCash}
          />
        </CollapsibleCard>
      </div>
      <div className="mt-6">
        <CollapsibleCard title="Current Allocations by Ticker">
          <AllocationsTable
            positions={aggregatedPositions}
            totalValue={portfolioStats.totalValue - totalCash}
          />
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