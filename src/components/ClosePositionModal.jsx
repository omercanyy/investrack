import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

const ClosePositionModal = ({ isOpen, onClose, onConfirm, lot }) => {
  const [exitQuantity, setExitQuantity] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (lot) {
      setExitQuantity(lot.amount);
      const today = new Date().toISOString().split('T')[0];
      setExitDate(today);
    } else {
      setExitQuantity('');
      setExitPrice('');
      setExitDate('');
      setError('');
    }
  }, [lot, isOpen]);

  if (!isOpen || !lot) return null;

  const handleSubmit = () => {
    const qty = parseFloat(exitQuantity);
    const price = parseFloat(exitPrice);

    if (!qty || !price || !exitDate) {
      setError('Please fill out all fields.');
      return;
    }
    if (qty > lot.amount) {
      setError(`Quantity cannot be more than the ${lot.amount} in this lot.`);
      return;
    }
    if (qty <= 0 || price <= 0) {
      setError('Quantity and Price must be positive numbers.');
      return;
    }

    onConfirm({
      ...lot,
      exitQuantity: qty,
      exitPrice: price,
      exitDate: exitDate,
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Close Position: {lot.ticker}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">
            You are selling from the lot purchased on {lot.date} for $
            {lot.fillPrice}.
          </p>

          <div>
            <label
              htmlFor="exitQuantity"
              className="block text-sm font-medium text-gray-700"
            >
              Quantity to Sell (Max: {lot.amount})
            </label>
            <input
              type="number"
              id="exitQuantity"
              value={exitQuantity}
              onChange={(e) => setExitQuantity(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="exitPrice"
              className="block text-sm font-medium text-gray-700"
            >
              Exit Price
            </label>
            <input
              type="number"
              id="exitPrice"
              step="0.01"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="exitDate"
              className="block text-sm font-medium text-gray-700"
            >
              Exit Date
            </label>
            <input
              type="date"
              id="exitDate"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClosePositionModal;

