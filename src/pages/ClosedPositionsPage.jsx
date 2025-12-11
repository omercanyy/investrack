import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import AdminTools from '../components/AdminTools';
import { TrashIcon, EditIcon } from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';
import EditClosedPositionModal from '../components/EditClosedPositionModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ACCOUNT_TYPES } from '../constants/accounts';

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


const ClosedPositionsPage = () => {
  const { user } = useAuth();
  const { isLoading, closedPositions, strategies, industries } = usePortfolio();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const processedPositions = useMemo(() => {
    return closedPositions
      .map((pos) => {
        const costBasis = pos.amount * pos.fillPrice;
        const proceeds = pos.amount * pos.exitPrice;
        const gainLoss = proceeds - costBasis;
        const gainLossPercent = costBasis === 0 ? 0 : gainLoss / costBasis;
        const strategy = strategies[pos.ticker]?.strategy || '';
        const industry = industries[pos.ticker]?.industry || '';
        return {
          ...pos,
          costBasis,
          proceeds,
          gainLoss,
          gainLossPercent,
          strategy,
          industry,
        };
      })
      .sort((a, b) => new Date(b.exitDate) - new Date(a.exitDate));
  }, [closedPositions, strategies, industries]);

  const handleDeleteClick = (pos) => {
    setSelectedPosition(pos);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedPosition(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPosition || !user) return;
    try {
      const docPath = doc(db, 'users', user.uid, 'closed_positions', selectedPosition.id);
      await deleteDoc(docPath);
    } catch (error) {
      console.error('Error deleting document: ', error);
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleEditClick = (pos) => {
    setSelectedPosition(pos);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPosition(null);
  };

  const handleConfirmEdit = async (editedLot) => {
    if (!editedLot || !user) return;
    try {
      const { id, ticker, amount, fillPrice, date, exitPrice, exitDate, strategy, industry } = editedLot;
      const docPath = doc(db, 'users', user.uid, 'closed_positions', id);
      await updateDoc(docPath, {
        ticker,
        amount,
        fillPrice,
        date,
        exitPrice,
        exitDate,
      });

      if (strategy) {
        const strategyDocPath = doc(db, 'users', user.uid, 'strategies', ticker);
        await setDoc(strategyDocPath, { strategy });
      }

      if (industry) {
        const industryDocPath = doc(db, 'users', user.uid, 'industries', ticker);
        await setDoc(industryDocPath, { industry });
      }

    } catch (error) {
      console.error('Error updating document: ', error);
    } finally {
      handleCloseEditModal();
    }
  };

  if (isLoading && processedPositions.length === 0) {
    return (
      <div>
        <AdminTools collectionName="closed_positions" title="Closed Positions" />
        <div className="rounded-lg bg-white p-6 text-center shadow">
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      
      <AdminTools collectionName="closed_positions" title="Closed Positions" />

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Entry Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Exit Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fill Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Exit Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cost Basis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Proceeds
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Strategy
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Industry
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedPositions.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-4 py-4 text-center text-gray-500">
                  No closed positions yet.
                </td>
              </tr>
            ) : (
              processedPositions.map((pos) => (
                <tr key={pos.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {pos.ticker}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {pos.amount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {pos.date}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {pos.exitDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(pos.fillPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(pos.exitPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(pos.costBasis)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(pos.proceeds)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <RenderGainLoss
                      value={pos.gainLoss}
                      formatter={(value) => 
                        `${formatCurrency(value)} (${formatPercentage(pos.gainLossPercent)})`
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{pos.strategy}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{pos.industry}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      onClick={() => handleEditClick(pos)}
                      title="Edit Closed Position"
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(pos)}
                      title="Delete Closed Position"
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Closed Position"
        message="Are you sure you want to delete this closed position? This action cannot be undone."
      />
      <EditClosedPositionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onConfirm={handleConfirmEdit}
        lot={selectedPosition}
      />
    </div>
  );
};

export default ClosedPositionsPage;