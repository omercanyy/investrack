import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
} from 'firebase/firestore';
import {
  fetchCurrentPrices,
  fetchBetaValues,
  fetchAvailableCash,
} from '../utils/schwabApi';
import { calculateAllXIRR } from '../utils/xirr';
import { getCategoricBeta } from '../utils/betaCalculator';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  return useContext(PortfolioContext);
};

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [strategies, setStrategies] = useState({});
  const [priceData, setPriceData] = useState({});
  const [betas, setBetas] = useState({});
  const [availableCash, setAvailableCash] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [realizedGain, setRealizedGain] = useState(0);
  const [xirrValues, setXirrValues] = useState({
    portfolio: 0,
    spy: 0,
    gld: 0,
  });
  const [weightedBeta, setWeightedBeta] = useState(0);
  const [weightedAbsoluteBeta, setWeightedAbsoluteBeta] = useState(0);
  const [betaCategory, setBetaCategory] = useState('N/A');

  const [absoluteBetaCategory, setAbsoluteBetaCategory] = useState('N/A');
  const [isSchwabConnected, setIsSchwabConnected] = useState(false);

  const refreshMarketData = useCallback(async () => {
    if (!isSchwabConnected) {
      setPriceData({});
      setBetas({});
      setAvailableCash(0);
      return;
    }

    setIsLoading(true);
    try {
      const cash = await fetchAvailableCash();
      setAvailableCash(cash);
    } catch (error) {
      console.error('Error fetching available cash:', error);
      setAvailableCash(0);
    }

    if (positions.length === 0) {
      setPriceData({});
      setBetas({});
      setIsLoading(false);
      return;
    }

    const uniqueTickers = [...new Set(positions.map((p) => p.ticker))];
    if (!uniqueTickers.includes('SPY')) uniqueTickers.push('SPY');
    if (!uniqueTickers.includes('GLD')) uniqueTickers.push('GLD');

    try {
      const results = await Promise.allSettled([
        fetchCurrentPrices(uniqueTickers),
        fetchBetaValues(uniqueTickers),
      ]);

      if (results[0].status === 'fulfilled') {
        setPriceData(results[0].value);
      } else {
        console.error('Error fetching prices:', results[0].reason);
        setPriceData({});
      }

      if (results[1].status === 'fulfilled') {
        const fetchedBetas = results[1].value;
        const hardcodedBetas = {
          AAOI: 3.25,
          APLD: 7.10,
          BE: 3.00,
          CRDO: 2.63,
          GLXY: 3.99,
          GOOG: 1.07,
          INOD: 2.39,
          IREN: 4.24,
          META: 1.27,
          NOK: 0.47,
          NVDA: 2.28,
          OKLO: 0.75,
          TMC: 1.83,
          ALAB: 2.05,
          CORZ: 2.81,
          CRWV: 1.5,
          FBTC: 1.9,
          GEV: 1.4,
          QLD: 2.34,
          RDDT: 2.26,
        };

        const finalBetas = { ...fetchedBetas };
        uniqueTickers.forEach(ticker => {
          if (!finalBetas[ticker] || finalBetas[ticker] === 0) {
            if (hardcodedBetas[ticker]) {
              finalBetas[ticker] = hardcodedBetas[ticker];
            }
          }
        });
        setBetas(finalBetas);
      } else {
        console.error('Error fetching betas:', results[1].reason);
        setBetas({});
      }
    } catch (error) {
      console.error('Error refreshing market data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSchwabConnected, positions]);

  useEffect(() => {
    if (!user) {
      setIsSchwabConnected(false);
      return;
    }
    const statusDocPath = doc(db, 'users', user.uid, 'status', 'schwab');
    const unsubscribe = onSnapshot(statusDocPath, (snapshot) => {
      setIsSchwabConnected(snapshot.exists() && snapshot.data().connected);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPositions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const positionsCollectionPath = collection(
      db,
      'users',
      user.uid,
      'positions'
    );
    const q = query(positionsCollectionPath);
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const positionsData = [];
        querySnapshot.forEach((doc) => {
          positionsData.push({ id: doc.id, ...doc.data() });
        });
        setPositions(positionsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching positions:', error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setClosedPositions([]);
      return;
    }
    const closedPath = collection(db, 'users', user.uid, 'closed_positions');
    const unsubscribe = onSnapshot(closedPath, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setClosedPositions(data);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!closedPositions || closedPositions.length === 0) {
      setRealizedGain(0);
      return;
    }

    const totalGain = closedPositions.reduce((acc, pos) => {
      const gain = (pos.exitPrice - pos.fillPrice) * pos.amount;
      return acc + gain;
    }, 0);

    setRealizedGain(totalGain);
  }, [closedPositions]);

  useEffect(() => {
    if (!user) {
      setStrategies({});
      return;
    }
    const strategiesPath = collection(db, 'users', user.uid, 'strategies');
    const unsubscribe = onSnapshot(strategiesPath, (snapshot) => {
      const stratData = {};
      snapshot.forEach((doc) => {
        stratData[doc.id] = doc.data().strategy;
      });
      setStrategies(stratData);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    refreshMarketData();
    const intervalId = setInterval(refreshMarketData, 300000);
    return () => clearInterval(intervalId);
  }, [refreshMarketData]);

  const aggregatedPositions = useMemo(() => {
    const groups = {};
    positions.forEach((pos) => {
      if (!groups[pos.ticker]) {
        groups[pos.ticker] = {
          ticker: pos.ticker,
          lots: [],
          totalAmount: 0,
          totalCostBasis: 0,
          strategy: strategies[pos.ticker] || '',
          oldestEntryDate: pos.date,
          accounts: [],
        };
      }
      const group = groups[pos.ticker];
      group.lots.push(pos);
      group.totalAmount += pos.amount;
      group.totalCostBasis += pos.amount * pos.fillPrice;
      if (pos.account && !group.accounts.includes(pos.account)) {
        group.accounts.push(pos.account);
      }
      if (new Date(pos.date) < new Date(group.oldestEntryDate)) {
        group.oldestEntryDate = pos.date;
      }
    });

    Object.keys(groups).forEach((ticker) => {
      const group = groups[ticker];
      const currentPrice = priceData[ticker] || 0;
      group.currentValue = group.totalAmount * currentPrice;
      group.gainLoss = group.currentValue - group.totalCostBasis;
      group.gainLossPercent =
        group.totalCostBasis === 0
          ? 0
          : group.gainLoss / group.totalCostBasis;
      group.weightedAvgFillPrice =
        group.totalAmount === 0 ? 0 : group.totalCostBasis / group.totalAmount;
      group.lots.sort((a, b) => new Date(b.date) - new Date(a.date));
      group.beta = betas[ticker] || null;
      group.betaCategory = getCategoricBeta(group.beta);
    });

    return Object.values(groups).sort((a, b) =>
      a.ticker.localeCompare(b.ticker)
    );
  }, [positions, priceData, strategies, betas]);

  const betaDistribution = useMemo(() => {
    const distribution = {
      LOW: { name: 'LOW', value: 0 },
      MEDIUM: { name: 'MEDIUM', value: 0 },
      HIGH: { name: 'HIGH', value: 0 },
    };

    aggregatedPositions.forEach((pos) => {
      if (pos.betaCategory && distribution[pos.betaCategory]) {
        distribution[pos.betaCategory].value += pos.currentValue;
      }
    });

    return Object.values(distribution);
  }, [aggregatedPositions]);

  const portfolioStats = useMemo(() => {
    const stats = aggregatedPositions.reduce(
      (acc, pos) => {
        acc.totalValue += pos.currentValue || 0;
        acc.totalCostBasis += pos.totalCostBasis || 0;
        acc.totalGainLoss += pos.gainLoss || 0;
        return acc;
      },
      { totalValue: 0, totalCostBasis: 0, totalGainLoss: 0 }
    );

    stats.totalValue += availableCash;

    const totalGainLossPercent =
      stats.totalCostBasis === 0
        ? 0
        : stats.totalGainLoss / stats.totalCostBasis;

    return { ...stats, totalGainLossPercent };
  }, [aggregatedPositions, availableCash]);

  useEffect(() => {
    if (
      !user ||
      (positions.length === 0 && closedPositions.length === 0) ||
      !priceData.SPY ||
      !priceData.GLD
    ) {
      return;
    }

    const runXirr = async () => {
      const portfolioValueForXirr = portfolioStats.totalValue - availableCash;
      console.log('Calculating XIRR with:', {
        portfolioValueForXirr,
        spyPrice: priceData.SPY,
        gldPrice: priceData.GLD,
      });
      const rates = await calculateAllXIRR(
        positions,
        closedPositions,
        portfolioValueForXirr,
        priceData.SPY,
        priceData.GLD
      );
      setXirrValues(rates);
    };

    runXirr();
  }, [
    user,
    positions,
    closedPositions,
    portfolioStats.totalValue,
    priceData.SPY,
    priceData.GLD,
  ]);

  useEffect(() => {
    if (aggregatedPositions.length === 0 || Object.keys(betas).length === 0) {
      setWeightedBeta(0);
      setWeightedAbsoluteBeta(0);
      setBetaCategory('N/A');
      return;
    }

    let totalBetaWeight = 0;
    let totalAbsBetaWeight = 0;

    aggregatedPositions.forEach((pos) => {
      const beta = betas[pos.ticker] || 1.0; // Default to 1.0 if beta not found
      const weight = pos.currentValue / portfolioStats.totalValue;
      totalBetaWeight += beta * weight;
      totalAbsBetaWeight += Math.abs(beta) * weight;
    });

    setWeightedBeta(totalBetaWeight);
    setWeightedAbsoluteBeta(totalAbsBetaWeight);
    setBetaCategory(getCategoricBeta(totalBetaWeight));
    setAbsoluteBetaCategory(getCategoricBeta(totalAbsBetaWeight));
  }, [aggregatedPositions, portfolioStats.totalValue, betas]);

  const value = {
    positions,
    closedPositions,
    strategies,
    priceData,
    aggregatedPositions,
    portfolioStats,
    xirrValues,
    realizedGain,
    isLoading,
    weightedBeta,
    weightedAbsoluteBeta,
    betaCategory,
    absoluteBetaCategory,
    betaDistribution,
    isSchwabConnected,
    refreshMarketData,
    availableCash,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
