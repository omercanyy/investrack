import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
} from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';

// Retrieve the API key from environment variables
const API_KEY = import.meta.env.VITE_EODHD_API_KEY;
const API_URL = 'https://eodhd.com/api/real-time';

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

// --- StrategySelector Component ---
const StrategySelector = ({ user, ticker, currentStrategy }) => {
  const [strategy, setStrategy] = useState(currentStrategy);

  // Update local state if the prop changes
  useEffect(() => {
    setStrategy(currentStrategy);
  }, [currentStrategy]);

  const handleChange = async (e) => {
    const newStrategy = e.target.value;
    setStrategy(newStrategy);

    if (!user || !ticker) return;

    // Save/Update the strategy in the new collection
    const docPath = doc(db, 'users', user.uid, 'strategies', ticker);
    try {
      // Use 'Long' as default if nothing is selected
      await setDoc(docPath, { strategy: newStrategy || 'Long' });
    } catch (err) {
      console.error('Failed to save strategy: ', err);
    }
  };

  return (
    <select
      value={strategy}
      onChange={handleChange}
      className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      <option value="">Select...</option>
      <option value="Long">Long</option>
      <option value="Momentum">Momentum</option>
      <option value="RSU">RSU</option>
      <option value="Commodity">Commodity</option>
    </select>
  );
};

// --- AddPositionRow Component ---
const AddPositionRow = ({ user }) => {
  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState('');
  const [fillPrice, setFillPrice] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = ticker && amount && fillPrice && date;

  const resetForm = () => {
    setTicker('');
    setAmount('');
    setFillPrice('');
    setDate('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please fill out all fields.');
      return;
    }
    if (!user) {
      setError('You must be logged in.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const positionsCollectionPath = collection(
        db,
        'users',
        user.uid,
        'positions'
      );
      await addDoc(positionsCollectionPath, {
        ticker: ticker.toUpperCase(),
        amount: parseFloat(amount),
        fillPrice: parseFloat(fillPrice),
        date: date,
        createdAt: serverTimestamp(),
      });
      resetForm();
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Failed to save.');
      setIsSubmitting(false);
    }
  };

  // This single row will be styled to stack on mobile
  return (
    <tr className="block bg-gray-50 align-top md:table-row">
      {/* Spacer */}
      <td className="hidden px-3 py-3 md:table-cell"></td>
      {/* Ticker Input */}
      <td className="block whitespace-nowrap px-3 py-2 md:table-cell md:py-3">
        <label htmlFor="ticker" className="text-xs font-medium text-gray-500 md:hidden">Ticker</label>
        <input
          id="ticker"
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Ticker"
        />
      </td>
      {/* Amount Input */}
      <td className="block whitespace-nowrap px-3 py-2 md:table-cell md:py-3">
        <label htmlFor="amount" className="text-xs font-medium text-gray-500 md:hidden">Amount</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Amount"
        />
      </td>
      {/* Fill Price Input */}
      <td className="block whitespace-nowrap px-3 py-2 md:table-cell md:py-3">
        <label htmlFor="fillPrice" className="text-xs font-medium text-gray-500 md:hidden">Fill Price</label>
        <input
          id="fillPrice"
          type="number"
          step="0.01"
          value={fillPrice}
          onChange={(e) => setFillPrice(e.target.value)}
          className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Price"
        />
      </td>
      {/* Date Input */}
      <td className="block whitespace-nowrap px-3 py-2 md:table-cell md:py-3">
        <label htmlFor="date" className="text-xs font-medium text-gray-500 md:hidden">Date</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </td>
      {/* Spacers */}
      <td className="hidden px-3 py-3 md:table-cell"></td>
      <td className="hidden px-3 py-3 md:table-cell"></td>
      <td className="hidden px-3 py-3 md:table-cell"></td>
      {/* Error & Submit */}
      <td className="block whitespace-nowrap px-3 py-2 text-left md:table-cell md:py-3" colSpan="2">
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {/* Submit Button (Visible on Mobile) */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 md:hidden"
        >
          {isSubmitting ? 'Adding...' : 'Add Position'}
        </button>
        {/* Submit Button (Visible on Desktop) */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 md:inline-flex"
        >
          {isSubmitting ? (
            <span className="text-xs">...</span>
          ) : (
            <PlusIcon />
          )}
        </button>
      </td>
    </tr>
  );
};

// --- PositionsPage Component ---

const PositionsPage = ({ user }) => {
  // Raw data from Firestore
  const [positions, setPositions] = useState([]);
  const [strategies, setStrategies] = useState({});
  // Live prices from API
  const [priceData, setPriceData] = useState({});
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [expandedTickers, setExpandedTickers] = useState([]);

  // State for the confirmation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState(null);

  // Effect 1: Listen to Firestore for position changes
  useEffect(() => {
    if (!user) {
      setPositions([]);
      setIsLoadingDb(false);
      return;
    }

    setIsLoadingDb(true);
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
        setIsLoadingDb(false);
      },
      (error) => {
        console.error('Error fetching positions:', error);
        setIsLoadingDb(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Effect 2: Listen to Firestore for strategy changes
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

  // Effect 3: Fetch prices when positions change, and poll every 5 mins
  useEffect(() => {
    if (!positions || positions.length === 0) {
      setPriceData({});
      return;
    }

    // Get a unique set of tickers
    const uniqueTickers = [
      ...new Set(positions.map((p) => `${p.ticker}.US`)),
    ];

    const fetchPrices = async () => {
      if (uniqueTickers.length === 0) return;

      // This endpoint requires one call per ticker. We run them in parallel.
      const pricePromises = uniqueTickers.map((ticker) => {
        const url = `${API_URL}/${ticker}?api_token=${API_KEY}&fmt=json`;
        return fetch(url).then((res) => {
          if (!res.ok) {
            throw new Error(
              `API request failed for ${ticker}: ${res.statusText}`
            );
          }
          return res.json();
        });
      });

      try {
        const results = await Promise.all(pricePromises);

        const newPriceData = {};
        results.forEach((item) => {
          // Defensive Guard: Check if item and its properties exist
          if (item && item.code && typeof item.close !== 'undefined') {
            newPriceData[item.code.replace('.US', '')] = item.close;
          } else {
            console.warn('Received malformed price data item:', item);
          }
        });
        setPriceData(newPriceData);
      } catch (error) {
        console.error('Error fetching prices in parallel:', error);
      }
    };

    fetchPrices(); // Fetch immediately on load
    const intervalId = setInterval(fetchPrices, 300000); // 5 mins
    return () => clearInterval(intervalId);
  }, [positions]);

  // Effect 4: Process and aggregate data
  const aggregatedPositions = useMemo(() => {
    const groups = {};

    positions.forEach((pos) => {
      if (!groups[pos.ticker]) {
        groups[pos.ticker] = {
          lots: [],
          totalAmount: 0,
          totalCostBasis: 0,
          strategy: strategies[pos.ticker] || '', // Default to empty
          oldestEntryDate: pos.date,
        };
      }

      const group = groups[pos.ticker];
      group.lots.push(pos);
      group.totalAmount += pos.amount;
      group.totalCostBasis += pos.amount * pos.fillPrice;

      // Find the oldest date
      if (new Date(pos.date) < new Date(group.oldestEntryDate)) {
        group.oldestEntryDate = pos.date;
      }
    });

    // Calculate final metrics for each group
    Object.keys(groups).forEach((ticker) => {
      const group = groups[ticker];
      const currentPrice = priceData[ticker] || 0;

      group.weightedAvgPrice = group.totalCostBasis / group.totalAmount;
      group.currentValue = group.totalAmount * currentPrice;
      group.gainLoss = group.currentValue - group.totalCostBasis;
      group.gainLossPercent =
        group.totalCostBasis === 0
          ? 0
          : group.gainLoss / group.totalCostBasis;

      // Sort lots by date (newest first) for display
      group.lots.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return groups;
  }, [positions, priceData, strategies]);

  /**
   * Toggles the expansion state for a given ticker.
   */
  const toggleTickerExpansion = (ticker) => {
    setExpandedTickers((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker]
    );
  };
  
  const expandAll = () => {
    setExpandedTickers(Object.keys(aggregatedPositions));
  };
  
  const collapseAll = () => {
    setExpandedTickers([]);
  };

  /**
   * Opens the confirmation modal to delete a lot.
   */
  const handleDeleteClick = (lotId) => {
    setSelectedLotId(lotId);
    setIsModalOpen(true);
  };

  /**
   * Closes the confirmation modal.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLotId(null);
  };

  /**
   * Confirms and executes the deletion of the selected lot.
   */
  const handleConfirmDelete = async () => {
    if (!selectedLotId || !user) return;

    try {
      const docPath = doc(
        db,
        'users',
        user.uid,
        'positions',
        selectedLotId
      );
      await deleteDoc(docPath);
    } catch (error) {
      console.error('Error deleting document: ', error);
    } finally {
      handleCloseModal();
    }
  };

  // --- Render Logic ---

  if (!user) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h2 className="text-xl font-semibold text-gray-700">
          Please log in to see your positions.
        </h2>
      </div>
    );
  }

  if (isLoadingDb && positions.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
      </div>
    );
  }

  /**
   * Renders the main table body with aggregated rows and expandable lots.
   */
  const renderTableBody = () => {
    const tickers = Object.keys(aggregatedPositions);

    if (tickers.length === 0) {
      return (
        <tr>
          <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
            No positions added yet. Use the row below to add one.
          </td>
        </tr>
      );
    }

    return tickers.map((ticker) => {
      const group = aggregatedPositions[ticker];
      const isExpanded = expandedTickers.includes(ticker);
      const currentPrice = priceData[ticker] || 0;

      return (
        <React.Fragment key={ticker}>
          {/* Aggregated Row */}
          <tr className="block bg-white hover:bg-gray-50 md:table-row">
            <td className="whitespace-nowrap px-4 py-3 md:table-cell">
              <button
                onClick={() => toggleTickerExpansion(ticker)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </button>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 md:table-cell">
              {ticker}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
              {group.totalAmount}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
              <StrategySelector
                user={user}
                ticker={ticker}
                currentStrategy={group.strategy}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
              {group.oldestEntryDate}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 md:table-cell">
              {formatCurrency(group.currentValue)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
              {formatCurrency(group.totalCostBasis)}
            </td>
            <td className="whitespace-nowLabe-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
              {formatCurrency(currentPrice)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm md:table-cell">
              <RenderGainLoss
                value={group.gainLoss}
                formatter={formatCurrency}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm md:table-cell">
              <RenderGainLoss
                value={group.gainLossPercent}
                formatter={formatPercentage}
              />
            </td>
          </tr>

          {/* Expanded Lots (if expanded) */}
          {isExpanded &&
            group.lots.map((lot) => {
              const lotCostBasis = lot.amount * lot.fillPrice;
              const lotCurrentValue = lot.amount * currentPrice;
              const lotGainLoss = lotCurrentValue - lotCostBasis;
              const lotGainLossPercent =
                lotCostBasis === 0 ? 0 : lotGainLoss / lotCostBasis;

              return (
                <tr key={lot.id} className="block bg-gray-50 md:table-row">
                  <td className="whitespace-nowrap px-4 py-2 text-center md:table-cell">
                    <button
                      onClick={() => handleDeleteClick(lot.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs font-medium text-gray-700 md:table-cell">
                    -
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500 md:table-cell">
                    {lot.amount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500 md:table-cell">
                    {formatCurrency(lot.fillPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500 md:table-cell">
                    {lot.date}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500 md:table-cell">
                    {formatCurrency(lotCurrentValue)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500 md:table-cell">
                    {formatCurrency(lotCostBasis)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500 md:table-cell">
                    {formatCurrency(currentPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs md:table-cell">
                    <RenderGainLoss
                      value={lotGainLoss}
                      formatter={formatCurrency}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs md:table-cell">
                    <RenderGainLoss
                      value={lotGainLossPercent}
                      formatter={formatPercentage}
                    />
                  </td>
                </tr>
              );
            })}
        </React.Fragment>
      );
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-col items-stretch justify-between sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900">Current Positions</h1>
        {/* Expand/Collapse Buttons */}
        <div className="mt-2 flex space-x-2 sm:mt-0">
          <button
            onClick={expandAll}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="hidden md:table-row">
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Strategy / Fill Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                First Entry / Entry Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cost Basis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain ($)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain (%)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {renderTableBody()}
            <AddPositionRow user={user} />
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Deleting */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Position"
        message="Are you sure you want to delete this position lot? This action cannot be undone."
      />
    </div>
  );
};

export default PositionsPage;

