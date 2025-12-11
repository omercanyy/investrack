import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ACCOUNT_TYPES } from '../constants/accounts';
import { usePortfolio } from '../context/PortfolioContext';

const AddLotForm = () => {
  const { user } = useAuth();
  const { strategyDefinitions, industryDefinitions } = usePortfolio();

  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState('');
  const [fillPrice, setFillPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState('');
  const [strategy, setStrategy] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = ticker && amount && fillPrice && date && account;

  const resetForm = () => {
    setTicker('');
    setAmount('');
    setFillPrice('');
    setDate(new Date().toISOString().slice(0, 10));
    setAccount('');
    setStrategy('');
    setIndustry('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please fill out all required fields.');
      return;
    }
    if (!user) {
      setError('You must be logged in.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const positionsCollectionPath = collection(db, 'users', user.uid, 'positions');
      await addDoc(positionsCollectionPath, {
        ticker: ticker.toUpperCase(),
        amount: parseFloat(amount),
        fillPrice: parseFloat(fillPrice),
        date: date,
        account: account,
        createdAt: serverTimestamp(),
      });

      if (strategy) {
        const strategyDocPath = doc(db, 'users', user.uid, 'strategies', ticker.toUpperCase());
        await setDoc(strategyDocPath, { strategy: strategy });
      }
      if (industry) {
        const industryDocPath = doc(db, 'users', user.uid, 'industries', ticker.toUpperCase());
        await setDoc(industryDocPath, { industry: industry });
      }

      resetForm();
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Failed to save lot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
        <div className="md:col-span-1">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Entry Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-700">Ticker</label>
          <input id="ticker" type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Ticker" />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="fillPrice" className="block text-sm font-medium text-gray-700">Price</label>
          <input id="fillPrice" type="number" step="0.01" value={fillPrice} onChange={(e) => setFillPrice(e.target.value)} className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Price" />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
          <input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Amount" />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="strategy" className="block text-sm font-medium text-gray-700">Strategy</label>
          <select id="strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">Unassigned</option>
            {strategyDefinitions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
        </div>
        <div className="md:col-span-1">
          <label htmlFor="account" className="block text-sm font-medium text-gray-700">Account</label>
          <select id="account" value={account} onChange={(e) => setAccount(e.target.value)} className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">Select Account</option>
            {Object.entries(ACCOUNT_TYPES).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
          </select>
        </div>
        <div className="md:col-span-1">
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700">Industry</label>
          <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">Unassigned</option>
            {industryDefinitions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
        </div>
        <div className="md:col-span-1">
          <button type="submit" disabled={!isFormValid || isSubmitting} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300">
            {isSubmitting ? 'Adding...' : 'Add Lot'}
          </button>
        </div>
        {error && <p className="col-span-full mt-1 text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
};

export default AddLotForm;
