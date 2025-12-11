import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { processTSVString } from '../utils/tsvParser';
import { CloudArrowDownIcon } from './Icons';
import Modal from './Modal';
import StrategyManager from './StrategyManager';

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
      ? 'Entry Date\tQuantity\tEntry\tAsset\tAccount\tStrategy\n2025-10-30\t10\t150.00\tGOOG\tROBINHOOD\tLONG'
      : 'Entry Date\tQuantity\tEntry\tAsset\tExit Value\tExit\tExit Date\tAccount\tStrategy';

  return (
    <Modal title={`Bulk Paste Data for ${title}`} onClose={onClose}>
        <p className="mt-2 text-sm text-gray-600">
          Paste your tab-separated data below. The first row should be the
          header (e.g., `Date\tTicker\t...`).
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
    </Modal>
  );
};

const AdminTools = ({
  collectionName,
  title,
  onRefresh,
  isRefreshing,
  isSchwabConnected,
  onExpandAll,
  onCollapseAll,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);

  const handlePasteSubmit = async (tsvString) => {
    if (!tsvString || !user) {
      setIsModalOpen(false);
      return;
    }

    setIsModalOpen(false);
    setIsLoading(true);
    setMessage('Parsing pasted data...');
    try {
      const { positions, strategies } = await processTSVString(
        tsvString,
        collectionName
      );
      const dataToUpload = positions;
      if (dataToUpload.length === 0) {
        throw new Error('No valid data rows were found. Check your headers.');
      }
      
      setMessage(`Uploading ${dataToUpload.length} ${title} and ${strategies.length} strategies...`);

      const batch = writeBatch(db);
      const ref = collection(db, 'users', user.uid, collectionName);
      dataToUpload.forEach((item) => {
        const docRef = doc(ref);
        batch.set(docRef, item);
      });

      if (strategies.length > 0) {
        const strategiesRef = collection(db, 'users', user.uid, 'strategies');
        strategies.forEach((item) => {
          const docRef = doc(strategiesRef, item.ticker);
          batch.set(docRef, { strategy: item.strategy });
        });
      }

      await batch.commit();
      setMessage(`Success! Uploaded ${dataToUpload.length} ${title} and ${strategies.length} strategies.`);
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
  
  return (
    <>
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={!isSchwabConnected || isRefreshing}
                className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloudArrowDownIcon
                  className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span className="ml-2">{isRefreshing ? 'Refreshing...' : 'Refresh Prices'}</span>
              </button>
            )}
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
            <button
              onClick={() => setIsStrategyModalOpen(true)}
              disabled={isLoading}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit Strategies
            </button>
          </div>
          {(onExpandAll || onCollapseAll) && (
            <div className="ml-auto flex space-x-2">
              {onExpandAll && (
                <button
                  onClick={onExpandAll}
                  className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Expand All
                </button>
              )}
              {onCollapseAll && (
                <button
                  onClick={onCollapseAll}
                  className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Collapse All
                </button>
              )}
            </div>
          )}
        </div>
        {message && (
          <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>
        )}
      </div>

      {isStrategyModalOpen && (
        <StrategyManager onClose={() => setIsStrategyModalOpen(false)} />
      )}

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