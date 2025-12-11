import React, { useMemo, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import AdminTools from '../components/AdminTools';
import { TrashIcon } from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

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
  const { isLoading, closedPositions } = usePortfolio();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const processedPositions = useMemo(() => {
    return closedPositions
      .map((pos) => {
        const costBasis = pos.amount * pos.fillPrice;
        const proceeds = pos.amount * pos.exitPrice;
        const gainLoss = proceeds - costBasis;
        const gainLossPercent = costBasis === 0 ? 0 : gainLoss / costBasis;
        return {
          ...pos,
          costBasis,
          proceeds,
          gainLoss,
          gainLossPercent,
        };
      })
      .sort((a, b) => new Date(b.exitDate) - new Date(a.exitDate));
  }, [closedPositions]);

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
                Account
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
                Gain ($)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Gain (%)
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
                    {pos.account}
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
                      formatter={formatCurrency}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <RenderGainLoss
                      value={pos.gainLossPercent}
                      formatter={formatPercentage}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
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
    </div>
  );
};

export default ClosedPositionsPage;
