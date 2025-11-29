import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { processCSVString } from '../utils/csvParser';
import schwabApi from '../utils/schwabApi';

const PasteModal = ({
  collectionName,
  title,
  onClose,
  onSubmit,
}) => {
  const [pasteData, setPasteData] = useState('');

  const handleSubmit = () => {
    onSubmit(pasteData);
  };

  const placeholder =
    collectionName === 'positions'
      ? 'Date, Ticker, Fill Price, Quantity\n2025-10-30, GOOG, 150.00, 10'
      : 'Entry Date, Ticker, Fill Price, Quantity, Exit Price, Exit Date\n2025-10-30, MSFT, 300.00, 5, 310.00, 2025-10-31';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 font-bold text-gray-400 hover:text-gray-600"
        >
          X
        </button>
        <h3 className="text-lg font-medium text-gray-900">
          Bulk Paste Data for {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Paste your comma-separated data below. The first row should be the
          header (e.g., `Date, Ticker,...`).
        </p>
        <textarea
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
          placeholder={placeholder}
          className="mt-4 h-64 w-full rounded-md border border-gray-300 p-2 font-mono text-sm"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Submit Data
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminTools = ({ collectionName, title }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingBetas, setIsLoadingBetas] = useState(false);
  const [betaMessage, setBetaMessage] = useState('');

  const handlePasteSubmit = async (csvString) => {
    if (!csvString || !user) {
      setIsModalOpen(false);
      return;
    }

    setIsModalOpen(false);
    setIsLoading(true);
    setMessage('Parsing pasted data...');
    try {
      const dataToUpload = await processCSVString(csvString, collectionName);
      if (dataToUpload.length === 0) {
        throw new Error('No valid data rows were found. Check your headers.');
      }
      
      setMessage(`Uploading ${dataToUpload.length} ${title}...`);

      const batch = writeBatch(db);
      const ref = collection(db, 'users', user.uid, collectionName);
      dataToUpload.forEach((item) => {
        const docRef = doc(ref);
        batch.set(docRef, item);
      });

      await batch.commit();
      setMessage(`Success! Uploaded ${dataToUpload.length} ${title}.`);
    } catch (error) {
      console.error(`Error uploading ${collectionName}:`, error);
      setMessage(`Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleClearAll = async () => {
    if (
      !window.confirm(
        `ARE YOU SURE? This will permanently delete ALL ${title}.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    setMessage(`Clearing all ${title}...`);
    try {
      const ref = collection(db, 'users', user.uid, collectionName);
      const snapshot = await getDocs(ref);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setMessage(`All ${title} have been cleared.`);
    } catch (error) {
      console.error(`Error clearing ${collectionName}:`, error);
      setMessage(`Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleCalculateBetas = async () => {
    if (!user) return;

    setIsLoadingBetas(true);
    setBetaMessage('Starting beta calculation process...');

    try {
      // 1. Get unique tickers from positions
      setBetaMessage('Fetching all tickers from your portfolio...');
      const positionsRef = collection(db, 'users', user.uid, 'positions');
      const positionsSnap = await getDocs(positionsRef);
      const tickers = [...new Set(positionsSnap.docs.map(d => d.data().ticker))];
      setBetaMessage(`Found ${tickers.length} unique tickers.`);

      // 2. Fetch fundamental data from Schwab API
      const symbols = tickers.join(',');
      const endpoint = `/marketdata/v1/quotes?symbols=${symbols}&fields=fundamental`;
      const response = await schwabApi(endpoint);

      // 3. Loop and save each ticker's beta
      const batch = writeBatch(db);
      let processedCount = 0;
      for (const ticker in response) {
        const fundamentalData = response[ticker].fundamental;
        if (fundamentalData && fundamentalData.beta) {
          const betaDocRef = doc(db, 'betas', ticker);
          batch.set(betaDocRef, {
            beta: fundamentalData.beta,
            lastCalculated: serverTimestamp(),
          });
          processedCount++;
        }
      }
      await batch.commit();
      setBetaMessage(`Successfully updated beta for ${processedCount} tickers.`);

    } catch (error) {
      console.error('Error calculating betas:', error);
      setBetaMessage(`Error: ${error.message}`);
    }

    setIsLoadingBetas(false);
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Bulk Paste Data
          </button>
          <button
            onClick={handleClearAll}
            disabled={isLoading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear All {title}
          </button>
          {collectionName === 'positions' && (
            <button
              onClick={handleCalculateBetas}
              disabled={isLoadingBetas}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Calculate & Cache All Betas
            </button>
          )}
        </div>
        {message && (
          <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>
        )}
        {betaMessage && (
          <p className="mt-3 text-sm font-medium text-gray-700">{betaMessage}</p>
        )}
      </div>

      {isModalOpen && (
        <PasteModal
          collectionName={collectionName}
          title={title}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handlePasteSubmit}
        />
      )}
    </>
  );
};

export default AdminTools;