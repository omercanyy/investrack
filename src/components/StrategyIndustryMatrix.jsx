import React from 'react';
import PortfolioHeatmaps from './PortfolioHeatmaps';

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

const StrategyIndustryMatrix = ({ positions, closedPositions, strategiesData, industriesData, priceData }) => {
  return (
    <div className="overflow-x-auto">
      <PortfolioHeatmaps 
        positions={positions} 
        closedPositions={closedPositions}
        strategies={strategiesData}
        industries={industriesData}
        priceData={priceData}
      />
    </div>
  );
};

export default StrategyIndustryMatrix;
