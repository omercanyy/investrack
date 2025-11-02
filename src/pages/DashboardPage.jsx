import React, { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getBetaCategoryClasses } from '../utils/betaCalculator';
import StatCard from '../components/StatCard';

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = 0;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#E36397',
  '#F4A261',
  '#2A9D8F',
];

const CustomTooltip = ({ active, payload, totalValue }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percent = (data.value / totalValue) * 100;
    return (
      <div className="rounded-lg border bg-white p-3 shadow-sm">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-700">{formatCurrency(data.value)}</p>
        <p className="text-sm text-gray-500">{percent.toFixed(2)}%</p>
      </div>
    );
  }
  return null;
};

const PortfolioPieChart = ({ data, totalValue }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No position data to display.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label={false}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip totalValue={totalValue} />}
            wrapperStyle={{ zIndex: 10 }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ paddingLeft: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const RiskPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No risk data to display.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBetaCategoryClasses(entry.name).chart}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip totalValue={data.reduce((acc, cur) => acc + cur.value, 0)} />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const DashboardPage = () => {
  const {
    isLoading,
    aggregatedPositions,
    portfolioStats,
    xirrValues,
    realizedGain,
    weightedBeta,
    weightedAbsoluteBeta,
    betaCategory,
    absoluteBetaCategory,
    betaDistribution,
  } = usePortfolio();

  const pieChartData = useMemo(() => {
    const { totalValue } = portfolioStats;
    if (totalValue === 0) return [];

    const threshold = 0.02;
    let otherValue = 0;
    const mainData = [];

    aggregatedPositions.forEach((pos) => {
      const percent = pos.currentValue / totalValue;
      if (percent < threshold) {
        otherValue += pos.currentValue;
      } else {
        mainData.push({
          name: pos.ticker,
          value: pos.currentValue,
        });
      }
    });

    if (otherValue > 0) {
      mainData.push({
        name: 'Other',
        value: otherValue,
      });
    }

    mainData.sort((a, b) => b.value - a.value);

    return mainData;
  }, [aggregatedPositions, portfolioStats]);

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
            {isPositive ? '+' : '-'}${Math.abs(portfolioStats.totalGainLoss).toFixed(2)} ({portfolioStats.totalGainLossPercent.toFixed(2)}%)
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Portfolio Composition
          </h2>
          <PortfolioPieChart
            data={pieChartData}
            totalValue={portfolioStats.totalValue}
          />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Risk Analysis
          </h2>
          <RiskPieChart data={betaDistribution} />
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
              Show Details
            </summary>
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
          </details>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

