import React, { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext'; // Import the hook
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// --- Helper Functions ---
const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    value = 0;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatPercentage = (value) => {
  if (typeof value !== 'number') {
    value = 0;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return value > 0 ? `+${formatted}` : formatted;
};

const RenderGainLoss = ({ value, formatter = (val) => val }) => {
  const colorClass =
    value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500';
  return <span className={colorClass}>{formatter(value)}</span>;
};

/**
 * A simple card component for displaying a single statistic.
 * Updated to handle XIRR values.
 */
const StatCard = ({ title, value, gainLoss, gainLossPercent, isXIRR = false }) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-sm font-medium uppercase text-gray-500">{title}</h3>
      
      {isXIRR ? (
        <p className="mt-1 text-3xl font-semibold text-gray-900">
          <RenderGainLoss value={value} formatter={formatPercentage} />
        </p>
      ) : (
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      )}

      {gainLoss != null && (
        <p className="mt-1 text-sm">
          <RenderGainLoss value={gainLoss} formatter={formatCurrency} />
          <span className="ml-2">
            (<RenderGainLoss value={gainLossPercent} formatter={formatPercentage} />)
          </span>
        </p>
      )}
    </div>
  );
};

// --- Pie Chart Component ---
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

/**
 * Renders the main dashboard page with summary statistics.
 */
const DashboardPage = () => {
  // Get all data from our new PortfolioContext
  const {
    isLoading,
    aggregatedPositions,
    portfolioStats,
    xirrValues,
  } = usePortfolio();

  // Transform data for the pie chart, grouping small slices
  const pieChartData = useMemo(() => {
    const { totalValue } = portfolioStats;
    if (totalValue === 0) return [];

    const threshold = 0.02; // Slices smaller than 2% will be grouped
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

    // Add the "Other" slice if it has value
    if (otherValue > 0) {
      mainData.push({
        name: 'Other',
        value: otherValue,
      });
    }

    // Sort by value, largest first
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

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Grid for Stat Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Portfolio Value"
          value={formatCurrency(portfolioStats.totalValue)}
          gainLoss={portfolioStats.totalGainLoss}
          gainLossPercent={portfolioStats.totalGainLossPercent}
        />
        <StatCard
          title="Portfolio XIRR"
          value={xirrValues.portfolio}
          isXIRR={true}
        />
        <StatCard
          title="Buy & Hold SPY XIRR"
          value={xirrValues.spy}
          isXIRR={true}
        />
        <StatCard
          title="Buy & Hold GLD XIRR"
          value={xirrValues.gld}
          isXIRR={true}
        />
      </div>

      {/* Chart */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900">Composition</h2>
        <PortfolioPieChart
          data={pieChartData}
          totalValue={portfolioStats.totalValue}
        />
      </div>
    </div>
  );
};

export default DashboardPage;

