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
  TrashIcon,
  BanknotesIcon,
  ArrowPathIcon,
  EditIcon,
} from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';
import ClosePositionModal from '../components/ClosePositionModal';
import EditPositionModal from '../components/EditPositionModal';
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

const PositionsPage = () => {
  const { user } = useAuth();
  const {
    isLoading,
    positions, // Use raw positions for lot-level view
    priceData,
    refreshMarketData,
    isSchwabConnected,
    strategies, // Get strategies
    strategyDefinitions,
    industries, // Get industries
    industryDefinitions,
  } = usePortfolio();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const handleRefresh = () => {
    if (isSchwabConnected) {
      refreshMarketData();
    }
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

  const handleEditClick = (lot) => {
    setSelectedLot(lot);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedLot(null);
  };

  const handleConfirmEdit = async (editedLot) => {
    if (!editedLot || !user) return;
    try {
      const docPath = doc(db, 'users', user.uid, 'positions', editedLot.id);
      await updateDoc(docPath, {
        ticker: editedLot.ticker,
        amount: editedLot.amount,
        fillPrice: editedLot.fillPrice,
        date: editedLot.date,
        account: editedLot.account,
      });
    } catch (error) {
      console.error('Error updating document: ', error);
    } finally {
      handleCloseEditModal();
    }
  };

  if (!user) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow">
        <h2 className="text-xl font-semibold text-gray-700">
          Please log in to see your lots.
        </h2>
      </div>
    );
  }

  if (isLoading && positions.length === 0) {
    return (
      <div>
        <AdminTools collectionName="positions" title="Current Lots" />
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  const renderTableBody = () => {
    if (positions.length === 0) {
      return (
        <tr>
          <td colSpan="11" className="px-4 py-4 text-center text-gray-500">
            No lots added yet. Use the row below to add one.
          </td>
        </tr>
      );
    }

    const sortedPositions = [...positions].sort((a, b) => a.ticker.localeCompare(b.ticker));

    return sortedPositions.map((lot) => {
      const currentPrice = priceData[lot.ticker] || 0;
      const lotCostBasis = lot.amount * lot.fillPrice;
      const lotCurrentValue = lot.amount * currentPrice;
      const lotGainLoss = lotCurrentValue - lotCostBasis;
      const lotGainLossPercent =
        lotCostBasis === 0 ? 0 : lotGainLoss / lotCostBasis;

      const strategy = strategies[lot.ticker]?.strategy || '';
      const industry = industries[lot.ticker]?.industry || '';

      return (
        <tr key={lot.id} className="bg-white hover:bg-gray-50">
          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
            {lot.ticker}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm">
            <RenderGainLoss
              value={lotGainLoss}
              formatter={(value) => 
                `${formatCurrency(value)} (${formatPercentage(lotGainLossPercent)})`
              }
            />
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
            {lot.amount}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
            {formatCurrency(lot.fillPrice)}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
            {formatCurrency(lotCurrentValue)}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
            {formatCurrency(lotCostBasis)}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
            <StrategySelector
              user={user}
              ticker={lot.ticker}
              currentStrategy={strategy}
              strategyDefinitions={strategyDefinitions}
            />
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
            {ACCOUNT_TYPES[lot.account] || lot.account}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
            <IndustrySelector
                user={user}
                ticker={lot.ticker}
                currentIndustry={industry}
                industryDefinitions={industryDefinitions}
              />
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
            {lot.date}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
            <div className="flex items-center">
              <div className="mr-2">
                <button
                  onClick={() => handleEditClick(lot)}
                  title="Edit Lot"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <EditIcon />
                </button>
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
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div>
      <AdminTools
        collectionName="positions"
        title="Current Lots"
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        isSchwabConnected={isSchwabConnected}
      />

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fill Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cost Basis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Strategy
              </th>
               <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Account
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Industry
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Entry Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {renderTableBody()}
            {/* <AddPositionRow user={user} /> */}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Lot"
        message="Are you sure you want to delete this lot? This action cannot be undone."
      />
      
      <ClosePositionModal
        isOpen={isCloseModalOpen}
        onClose={handleCloseClosePositionModal}
        onConfirm={handleConfirmClosePosition}
        lot={selectedLot}
      />

      <EditPositionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onConfirm={handleConfirmEdit}
        lot={selectedLot}
      />
    </div>
  );
};

export default PositionsPage;