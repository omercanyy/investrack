import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  BanknotesIcon,
  ArrowPathIcon,
} from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';
import ClosePositionModal from '../components/ClosePositionModal';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import AdminTools from '../components/AdminTools';
import { ACCOUNT_TYPES } from '../constants/accounts';
import { getBetaCategoryClasses } from '../utils/betaCalculator';


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

const StrategySelector = ({ user, ticker, currentStrategy, strategyDefinitions }) => {
  const [strategy, setStrategy] = useState(currentStrategy);

  useEffect(() => {
    setStrategy(currentStrategy);
  }, [currentStrategy]);

  const allOptions = useMemo(() => {
    const options = new Set(strategyDefinitions);
    if (currentStrategy && !options.has(currentStrategy)) {
      options.add(currentStrategy);
    }
    return Array.from(options);
  }, [strategyDefinitions, currentStrategy]);

  const handleChange = async (e) => {
    const newStrategy = e.target.value;
    setStrategy(newStrategy);
    if (!user || !ticker) return;
    const docPath = doc(db, 'users', user.uid, 'strategies', ticker);
    try {
      if (newStrategy) {
        await setDoc(docPath, { strategy: newStrategy });
      } else {
        await deleteDoc(docPath);
      }
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
      <option value="">Unassigned</option>
      {allOptions.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
};

const IndustrySelector = ({ user, ticker, currentIndustry, industryDefinitions }) => {
  const [industry, setIndustry] = useState(currentIndustry);

  useEffect(() => {
    setIndustry(currentIndustry);
  }, [currentIndustry]);

  const allOptions = useMemo(() => {
    const options = new Set(industryDefinitions);
    if (currentIndustry && !options.has(currentIndustry)) {
      options.add(currentIndustry);
    }
    return Array.from(options);
  }, [industryDefinitions, currentIndustry]);

  const handleChange = async (e) => {
    const newIndustry = e.target.value;
    setIndustry(newIndustry);
    if (!user || !ticker) return;
    const docPath = doc(db, 'users', user.uid, 'industries', ticker);
    try {
      if (newIndustry) {
        await setDoc(docPath, { industry: newIndustry });
      } else {
        await deleteDoc(docPath);
      }
    } catch (err) {
      console.error('Failed to save industry: ', err);
    }
  };

  return (
    <select
      value={industry}
      onChange={handleChange}
      className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      <option value="">Unassigned</option>
      {allOptions.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
};

const AddPositionRow = ({ user }) => {
  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState('');
  const [fillPrice, setFillPrice] = useState('');
  const [date, setDate] = useState('');
  const [account, setAccount] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = ticker && amount && fillPrice && date && account;

  const resetForm = () => {
    setTicker('');
    setAmount('');
    setFillPrice('');
    setDate('');
    setAccount('');
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
        account: account,
        createdAt: serverTimestamp(),
      });
      resetForm();
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Failed to save.');
      setIsSubmitting(false);
    }
  };

  return (
    <tr className="bg-gray-50 align-top">
      {/* 1. Icon Column */}
      <td className="px-3 py-3"></td>
      {/* 2. Ticker Column */}
      <td className="whitespace-nowrap px-3 py-2">
        <input
          id="ticker"
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Ticker"
        />
      </td>
      {/* 3. Gain ($) Column */}
      <td className="px-3 py-3"></td>
      {/* 4. Gain (%) Column */}
      <td className="px-3 py-3"></td>
      {/* 5. Amount Column */}
      <td className="whitespace-nowrap px-3 py-2">
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Amount"
        />
      </td>
      {/* 6. Current / Fill Price Column */}
      <td className="whitespace-nowrap px-3 py-2">
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
      {/* 7. Current Value Column */}
      <td className="px-3 py-3"></td>
      {/* 8. Cost Basis Column */}
      <td className="px-3 py-3"></td>
      {/* 9. Strategy / Account Column */}
      <td className="whitespace-nowrap px-3 py-2">
        <select
          id="account"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select Account</option>
          {Object.entries(ACCOUNT_TYPES).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </td>
      {/* 10. Industry Column */}
      <td className="px-3 py-3"></td>
      {/* 11. First Entry / Entry Date Column */}
      <td className="whitespace-nowrap px-3 py-2 text-left">
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 inline-flex"
          >
            {isSubmitting ? <span className="text-xs">...</span> : <PlusIcon />}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
};

const PositionsPage = () => {
  const { user } = useAuth();
  const {
    isLoading,
    aggregatedPositions,
    refreshMarketData,
    isSchwabConnected,
    strategyDefinitions,
    industryDefinitions,
  } = usePortfolio();

  const [expandedTickers, setExpandedTickers] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  
  const handleRefresh = () => {
    if (isSchwabConnected) {
      refreshMarketData();
    }
  };

  const toggleTickerExpansion = (ticker) => {
    setExpandedTickers((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker]
    );
  };

  const expandAll = () => {
    setExpandedTickers(aggregatedPositions.map((p) => p.ticker));
  };

  const collapseAll = () => {
    setExpandedTickers([]);
  };

  const handleDeleteClick = (lot) => {
    setSelectedLot(lot);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedLot(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLot || !user) return;
    try {
      const docPath = doc(db, 'users', user.uid, 'positions', selectedLot.id);
      await deleteDoc(docPath);
    } catch (error) {
      console.error('Error deleting document: ', error);
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleClosePositionClick = (lot) => {
    setSelectedLot(lot);
    setIsCloseModalOpen(true);
  };

  const handleCloseClosePositionModal = () => {
    setIsCloseModalOpen(false);
    setSelectedLot(null);
  };

  const handleConfirmClosePosition = async (closedLotData) => {
    if (!closedLotData || !user) return;
    const { exitQuantity, exitPrice, exitDate, ...originalLot } = closedLotData;
    try {
      const closedPositionsPath = collection(db, 'users', user.uid, 'closed_positions');
      await addDoc(closedPositionsPath, {
        ticker: originalLot.ticker,
        amount: exitQuantity,
        fillPrice: originalLot.fillPrice,
        date: originalLot.date,
        exitPrice: exitPrice,
        exitDate: exitDate,
        account: originalLot.account,
        closedAt: serverTimestamp(),
      });
      const originalLotRef = doc(db, 'users', user.uid, 'positions', originalLot.id);
      if (exitQuantity < originalLot.amount) {
        const newAmount = originalLot.amount - exitQuantity;
        await updateDoc(originalLotRef, {
          amount: newAmount,
        });
      } else {
        await deleteDoc(originalLotRef);
      }
    } catch (error) {
      console.error('Error closing position: ', error);
    } finally {
      handleCloseClosePositionModal();
    }
  };

  if (!user) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h2 className="text-xl font-semibold text-gray-700">
          Please log in to see your positions.
        </h2>
      </div>
    );
  }

  if (isLoading && aggregatedPositions.length === 0) {
    return (
      <div>
        <AdminTools collectionName="positions" title="Positions" />
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  const renderTableBody = () => {
    if (aggregatedPositions.length === 0) {
      return (
        <tr>
          <td colSpan="11" className="px-4 py-4 text-center text-gray-500">
            No positions added yet. Use the row below to add one.
          </td>
        </tr>
      );
    }

    return aggregatedPositions.map((group) => {
      const ticker = group.ticker;
      const isExpanded = expandedTickers.includes(ticker);
      const currentPrice = group.currentValue / group.totalAmount || 0;

      return (
        <React.Fragment key={ticker}>
          {/* Aggregated Row */}
          <tr className="bg-white hover:bg-gray-50">
            <td className="whitespace-nowrap px-4 py-3">
              <button
                onClick={() => toggleTickerExpansion(ticker)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </button>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
              {ticker}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm">
              <RenderGainLoss
                value={group.gainLoss}
                formatter={formatCurrency}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm">
              <RenderGainLoss
                value={group.gainLossPercent}
                formatter={formatPercentage}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
              {group.totalAmount}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
              {formatCurrency(currentPrice)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
              {formatCurrency(group.currentValue)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
              {formatCurrency(group.totalCostBasis)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
              <StrategySelector
                user={user}
                ticker={ticker}
                currentStrategy={group.strategy}
                strategyDefinitions={strategyDefinitions}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
              <IndustrySelector
                user={user}
                ticker={ticker}
                currentIndustry={group.industry}
                industryDefinitions={industryDefinitions}
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
              {group.oldestEntryDate}
            </td>
          </tr>

          {/* Expanded Lot Rows */}
          {isExpanded &&
            group.lots.map((lot) => {
              const lotCostBasis = lot.amount * lot.fillPrice;
              const lotCurrentValue = lot.amount * currentPrice;
              const lotGainLoss = lotCurrentValue - lotCostBasis;
              const lotGainLossPercent =
                lotCostBasis === 0 ? 0 : lotGainLoss / lotCostBasis;

              return (
                <tr key={lot.id} className="bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2 text-center"></td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs font-medium text-gray-700">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleClosePositionClick(lot)}
                        title="Sell/Close Position"
                        className="text-green-600 hover:text-green-800"
                      >
                        <BanknotesIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(lot)}
                        title="Delete Lot"
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs">
                    <RenderGainLoss
                      value={lotGainLoss}
                      formatter={formatCurrency}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs">
                    <RenderGainLoss
                      value={lotGainLossPercent}
                      formatter={formatPercentage}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {lot.amount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {formatCurrency(lot.fillPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {formatCurrency(lotCurrentValue)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {formatCurrency(lotCostBasis)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {ACCOUNT_TYPES[lot.account] || lot.account}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {group.industry}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                    {lot.date}
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

      
      <AdminTools
        collectionName="positions"
        title="Positions"
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        isSchwabConnected={isSchwabConnected}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain ($)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain (%)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Amount
              </th>
              <th style={{whiteSpace: 'pre-wrap'}} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {'Current/Fill\nPrice'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cost Basis
              </th>
              <th style={{whiteSpace: 'pre-wrap'}} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {'Strategy/\nAccount'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Industry
              </th>
              <th style={{whiteSpace: 'pre-wrap'}} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {'First/\nEntry'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {renderTableBody()}
            <AddPositionRow user={user} />
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Position"
        message="Are you sure you want to delete this position lot? This action cannot be undone."
      />
      
      <ClosePositionModal
        isOpen={isCloseModalOpen}
        onClose={handleCloseClosePositionModal}
        onConfirm={handleConfirmClosePosition}
        lot={selectedLot}
      />
    </div>
  );
};

export default PositionsPage;