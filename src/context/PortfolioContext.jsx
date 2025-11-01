import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { fetchCurrentPrices } from '../utils/api';
import { calculateAllXIRR } from '../utils/xirr';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  return useContext(PortfolioContext);
};

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();

  // Raw data from Firestore
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [strategies, setStrategies] = useState({});
  const [priceData, setPriceData] = useState({});
  const [xirrValues, setXirrValues] = useState({ portfolio: 0, spy: 0, gld: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Effect 1: Listen to Firestore for position changes
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

  // Effect 2: Listen to Firestore for closed position changes
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

  // Effect 3: Listen to Firestore for strategy changes
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

  // Effect 4: Fetch prices when positions change, and poll every 5 mins
  useEffect(() => {
    if (!positions || positions.length === 0) {
      setPriceData({});
      return;
    }

    // Get a unique set of tickers
    const uniqueTickers = [
      ...new Set(positions.map((p) => `${p.ticker}.US`)),
    ];
    
    // Always fetch SPY and GLD for XIRR benchmarks
    if (!uniqueTickers.includes('SPY.US')) uniqueTickers.push('SPY.US');
    if (!uniqueTickers.includes('GLD.US')) uniqueTickers.push('GLD.US');

    const fetchAllPrices = async () => {
      try {
        const newPriceData = await fetchCurrentPrices(uniqueTickers);
        setPriceData(newPriceData);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchAllPrices(); // Fetch immediately on load
    const intervalId = setInterval(fetchAllPrices, 300000); // 5 mins
    return () => clearInterval(intervalId);
  }, [positions]);

  // Effect 5: Process and aggregate data
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
        };
      }
      const group = groups[pos.ticker];
      group.lots.push(pos);
      group.totalAmount += pos.amount;
      group.totalCostBasis += pos.amount * pos.fillPrice;
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
      group.lots.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    // Return as a sorted array
    return Object.values(groups).sort((a, b) =>
      a.ticker.localeCompare(b.ticker)
    );
  }, [positions, priceData, strategies]);

  // Effect 6: Calculate total portfolio value
  const portfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalCostBasis = 0;
    aggregatedPositions.forEach((pos) => {
      totalValue += pos.currentValue;
      totalCostBasis += pos.totalCostBasis;
    });
    const totalGainLoss = totalValue - totalCostBasis;
    const totalGainLossPercent =
      totalCostBasis === 0 ? 0 : totalGainLoss / totalCostBasis;
    return { totalValue, totalCostBasis, totalGainLoss, totalGainLossPercent };
  }, [aggregatedPositions]);

  // Effect 7: Calculate XIRR
  useEffect(() => {
    if (
      !user ||
      (positions.length === 0 && closedPositions.length === 0) ||
      !priceData.SPY ||
      !priceData.GLD
    ) {
      return; // Not ready to calculate
    }

    const runXirr = async () => {
      // DEBUGGING: Log raw inputs
      // console.log('--- XIRR INPUT: positions ---', JSON.parse(JSON.stringify(positions)));
      // console.log('--- XIRR INPUT: closedPositions ---', JSON.parse(JSON.stringify(closedPositions)));

      const rates = await calculateAllXIRR(
        positions,
        closedPositions,
        portfolioStats.totalValue,
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

  // This 'value' object is the source of the bug.
  // The 'xirrData' property was missing.
  const value = {
    positions,
    closedPositions,
    strategies,
    priceData,
    aggregatedPositions,
    portfolioStats,
    xirrValues, // It is now included here.
    isLoading,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

