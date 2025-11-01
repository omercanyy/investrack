import React, { useState, useEffect } from 'react';
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
} from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';
import ClosePositionModal from '../components/ClosePositionModal';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import AdminTools from '../components/AdminTools';

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

const StrategySelector = ({ user, ticker, currentStrategy }) => {
  const [strategy, setStrategy] = useState(currentStrategy);

  useEffect(() => {
    setStrategy(currentStrategy);
  }, [currentStrategy]);

  const handleChange = async (e) => {
    const newStrategy = e.target.value;
    setStrategy(newStrategy);
    if (!user || !ticker) return;
    const docPath = doc(db, 'users', user.uid, 'strategies', ticker);
    try {
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

  return (
    <tr className="block bg-gray-50 align-top md:table-row">
      <td className="hidden px-3 py-3 md:table-cell"></td>
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
      <td className="hidden px-3 py-3 md:table-cell"></td>
      <td className="hidden px-3 py-3 md:table-cell"></td>
      <td className="hidden px-3 py-3 md:table-cell"></td>
      <td className="block whitespace-nowrap px-3 py-2 text-left md:table-cell md:py-3" colSpan="2">
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 md:hidden"
        >
          {isSubmitting ? 'Adding...' : 'Add Position'}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 md:inline-flex"
        >
          {isSubmitting ? <span className="text-xs">...</span> : <PlusIcon />}
        </button>
      </td>
    </tr>
  );
};

const PositionsPage = () => {
  const { user } = useAuth();
  const { isLoading, aggregatedPositions } = usePortfolio();

  const [expandedTickers, setExpandedTickers] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

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
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Current Positions</h1>
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
          <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
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
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 md:table-cell">
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
      
      <AdminTools collectionName="positions" title="Positions" />

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
              <th className="px-4 py-3 text-left text-xs font-module uppercase tracking-wider text-gray-500">
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