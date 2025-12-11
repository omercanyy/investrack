import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import _ from 'lodash';

const PortfolioHeatmaps = ({ positions = [], closedPositions = [], strategies = {}, industries = {}, priceData = {} }) => {
  const allTrades = useMemo(() => {
    const openTrades = (positions || []).map(p => {
      if (!p.amount || !p.ticker || !p.fillPrice) return null;
      
      const strategy = strategies[p.ticker]?.strategy || 'Unassigned';
      const industry = industries[p.ticker]?.industry || 'Unassigned';
      const currentPrice = priceData[p.ticker] || 0;
      
      // Skip if we don't have a current price, as we can't calculate returns.
      if (currentPrice === 0) return null;

      return {
          ...p,
          strategy,
          industry,
          currentPrice,
          fillPrice: p.fillPrice,
          costBasis: p.amount * p.fillPrice,
          amount: p.amount,
      };
    }).filter(Boolean);

    const closedTrades = (closedPositions || []).map(p => {
      if (!p.amount || !p.ticker || !p.fillPrice || !p.exitPrice) return null;
      const strategy = strategies[p.ticker]?.strategy || 'Unassigned';
      const industry = industries[p.ticker]?.industry || 'Unassigned';
      
      return {
          ...p,
          strategy,
          industry,
          currentPrice: p.exitPrice, // For closed positions, the "current" price is the exit price
          fillPrice: p.fillPrice,
          costBasis: p.amount * p.fillPrice,
          amount: p.amount,
      };
    }).filter(Boolean);

    return [...openTrades, ...closedTrades];
  }, [positions, closedPositions, strategies, industries, priceData]);

  const { skillData, impactData } = useMemo(() => {
    if (allTrades.length === 0) {
      return { skillData: [], impactData: [] };
    }

    const totalPortfolioCostBasis = _.sumBy(allTrades, 'costBasis');
    
    const groupedByStrategyAndIndustry = _.groupBy(allTrades, d => `${d.strategy}_${d.industry}`);

    const processedData = _.map(groupedByStrategyAndIndustry, (trades, key) => {
      const [strategy, industry] = key.split('_');
      
      const avgROI = _.meanBy(trades, t => t.fillPrice !== 0 ? (t.currentPrice - t.fillPrice) / t.fillPrice : 0);
      
      const totalProfitDollars = _.sumBy(trades, t => t.amount * (t.currentPrice - t.fillPrice));
      const contribution = totalPortfolioCostBasis > 0 ? totalProfitDollars / totalPortfolioCostBasis : 0;
      
      return { strategy, industry, avgROI, contribution };
    });

    const strategies = _.uniq(processedData.map(d => d.strategy));
    const industries = _.uniq(processedData.map(d => d.industry));

    const skillData = strategies.map(strategy => ({
      name: strategy,
      data: industries.map(industry => {
        const cell = processedData.find(d => d.strategy === strategy && d.industry === industry);
        return {
          x: industry,
          y: cell ? cell.avgROI * 100 : 0,
        };
      }),
    }));

    const impactData = strategies.map(strategy => ({
      name: strategy,
      data: industries.map(industry => {
        const cell = processedData.find(d => d.strategy === strategy && d.industry === industry);
        return {
          x: industry,
          y: cell ? cell.contribution * 100 : 0,
        };
      }),
    }));

    return { skillData, impactData };
  }, [allTrades]);

  const heatmapOptions = (title, yAxisFormatter) => ({
    chart: {
      type: 'heatmap',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 0,
        useFillColorAsStroke: true,
        colorScale: {
          ranges: [
            {
              from: -10000,
              to: -0.001,
              name: 'Negative',
              color: '#ef4444',
            },
            {
              from: 0,
              to: 0,
              name: 'Neutral',
              color: '#f3f4f6',
            },
            {
              from: 0.001,
              to: 10000,
              name: 'Positive',
              color: '#22c55e',
            },
          ],
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#000000']
      },
      formatter: (val) => yAxisFormatter(val),
    },
    stroke: {
      width: 1,
    },
    title: {
      text: title,
      align: 'center',
    },
    yaxis: {
      labels: {
        formatter: (val) => val,
      }
    },
    tooltip: {
      y: {
        formatter: (val) => yAxisFormatter(val),
      }
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <div>
        <Chart
          options={heatmapOptions("Strategy Efficiency (Avg ROI %)", (val) => `${val.toFixed(2)}%`)}
          series={skillData}
          type="heatmap"
          height={500}
        />
      </div>
      <div>
        <Chart
          options={heatmapOptions("Portfolio Contribution (Weighted %)", (val) => `${val.toFixed(2)}% of portfolio`)}
          series={impactData}
          type="heatmap"
          height={500}
        />
      </div>
    </div>
  );
};

export default PortfolioHeatmaps;
