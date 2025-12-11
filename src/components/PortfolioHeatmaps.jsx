import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import _ from 'lodash';

const PortfolioHeatmaps = ({ positions = [], closedPositions = [], strategies = {}, industries = {}, priceData = {} }) => {
  const allTrades = useMemo(() => {
    const openTrades = (positions || []).map(p => {
      if (!p.amount || !p.ticker || !p.fillPrice) return null;
      
      const strategy = strategies[p.ticker]?.strategy || 'Unassigned';
      const industry = industries[p.ticker]?.industry || 'Unassigned';
      const currentPrice = priceData[p.ticker] || 0;
      
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
          currentPrice: p.exitPrice,
          fillPrice: p.fillPrice,
          costBasis: p.amount * p.fillPrice,
          amount: p.amount,
      };
    }).filter(Boolean);

    const combinedTrades = [...openTrades, ...closedTrades];
    return combinedTrades.filter(trade => trade.strategy !== 'Unassigned' && trade.industry !== 'Unassigned');
  }, [positions, closedPositions, strategies, industries, priceData]);

  const { skillPlot, impactPlot } = useMemo(() => {
    if (allTrades.length === 0) {
      return { skillPlot: null, impactPlot: null };
    }

    const totalPortfolioCostBasis = _.sumBy(allTrades, 'costBasis');
    const groupedByStrategyAndIndustry = _.groupBy(allTrades, d => `${d.strategy}_${d.industry}`);

    const processedData = _.map(groupedByStrategyAndIndustry, (trades, key) => {
      const [strategy, industry] = key.split('_');
      
      const avgROI = _.meanBy(trades, t => t.fillPrice !== 0 ? (t.currentPrice - t.fillPrice) / t.fillPrice : 0);
      const totalProfitDollars = _.sumBy(trades, t => t.amount * (t.currentPrice - t.fillPrice));
      const contribution = totalPortfolioCostBasis > 0 ? totalProfitDollars / totalPortfolioCostBasis : 0;
      const totalInvested = _.sumBy(trades, 'costBasis');
      
      return { strategy, industry, avgROI, contribution, netProfit: totalProfitDollars, totalInvested, tradeCount: trades.length };
    });

    const uniqueStrategies = _.uniq(processedData.map(d => d.strategy));
    const uniqueIndustries = _.uniq(processedData.map(d => d.industry));

    const createPlotData = (dataKey, metricName) => {
      const z = uniqueStrategies.map(strategy => 
        uniqueIndustries.map(industry => {
          const cell = processedData.find(d => d.strategy === strategy && d.industry === industry);
          return cell ? cell[dataKey] * 100 : 0;
        })
      );

      const customdata = uniqueStrategies.map(strategy =>
        uniqueIndustries.map(industry => {
          const cell = processedData.find(d => d.strategy === strategy && d.industry === industry);
          return {
            netProfit: cell?.netProfit || 0,
            totalInvested: cell?.totalInvested || 0,
            tradeCount: cell?.tradeCount || 0,
            metric: `${metricName}: ${(cell ? cell[dataKey] * 100 : 0).toFixed(2)}%`
          };
        })
      );
      
      const allZValues = z.flat().filter(v => v !== null);
      const min = Math.min(...allZValues);
      const max = Math.max(...allZValues);

      let colorscale;
      if (min >= 0) {
        colorscale = [[0, '#dcfce7'], [1, '#15803d']]; // All positive
      } else if (max <= 0) {
        colorscale = [[0, '#fee2e2'], [1, '#b91c1c']]; // All negative
      } else {
        const zeroPoint = -min / (max - min);
        colorscale = [
            [0, '#b91c1c'],
            [zeroPoint * 0.5, '#ef4444'],
            [zeroPoint, '#f3f4f6'],
            [zeroPoint + (1 - zeroPoint) * 0.5, '#a7f3d0'],
            [1, '#15803d']
        ];
      }

      return {
        x: uniqueIndustries,
        y: uniqueStrategies,
        z,
        customdata,
        type: 'heatmap',
        colorscale,
        hovertemplate: `
          <b>%{y} / %{x}</b><br><br>
          Net Profit: %{customdata.netProfit:$,.2f}<br>
          Total Invested: %{customdata.totalInvested:$,.2f}<br>
          Trade Count: %{customdata.tradeCount}<br>
          %{customdata.metric}
          <extra></extra>
        `.trim(),
        texttemplate: '%{z:.2f}%',
        textfont: {
            color: '#000000'
        },
        colorbar: { tickformat: '.2f', title: '%' }
      };
    };

    return {
      skillPlot: createPlotData('avgROI', 'Avg. ROI'),
      impactPlot: createPlotData('contribution', 'Impact'),
    };
  }, [allTrades]);
  
  const layout = (title) => ({
    title,
    autosize: true,
    xaxis: { automargin: true },
    yaxis: { automargin: true },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      {skillPlot && (
        <Plot
          data={[skillPlot]}
          layout={layout("Strategy Efficiency (Avg ROI %)")}
          useResizeHandler={true}
          className="w-full h-full"
        />
      )}
      {impactPlot && (
        <Plot
          data={[impactPlot]}
          layout={layout("Portfolio Contribution (Weighted %)")}
          useResizeHandler={true}
          className="w-full h-full"
        />
      )}
    </div>
  );
};

export default PortfolioHeatmaps;