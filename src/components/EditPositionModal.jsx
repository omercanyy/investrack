import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ACCOUNT_TYPES } from '../constants/accounts';

const EditPositionModal = ({ isOpen, onClose, onConfirm, lot }) => {
  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState('');
  const [fillPrice, setFillPrice] = useState('');
  const [date, setDate] = useState('');
  const [account, setAccount] = useState('');

  useEffect(() => {
    if (lot) {
      setTicker(lot.ticker);
      setAmount(lot.amount);
      setFillPrice(lot.fillPrice);
      setDate(lot.date);
      setAccount(lot.account);
    }
  }, [lot]);

  const handleConfirm = () => {
    onConfirm({
      ...lot,
      ticker,
      amount: parseFloat(amount),
      fillPrice: parseFloat(fillPrice),
      date,
      account,
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Lot">
      <div className="space-y-4">
        <div>
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-700">
            Ticker
          </label>
          <input
            type="text"
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="fillPrice" className="block text-sm font-medium text-gray-700">
            Fill Price
          </label>
          <input
            type="number"
            id="fillPrice"
            value={fillPrice}
            onChange={(e) => setFillPrice(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Entry Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700">
            Account
          </label>
          <select
            id="account"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select Account</option>
            {Object.entries(ACCOUNT_TYPES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save
        </button>
      </div>
    </Modal>
  );
};

export default EditPositionModal;
