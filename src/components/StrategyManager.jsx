import React, { useState, useMemo, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, writeBatch, doc, setDoc } from 'firebase/firestore';
import Modal from './Modal';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

const StrategyManager = ({ onClose }) => {
  const { strategies, strategyDefinitions: initialStrategyDefinitions } = usePortfolio();
  const { user } = useAuth();
  const [newStrategy, setNewStrategy] = useState('');
  const [editableStrategies, setEditableStrategies] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const allStrategies = new Set(Object.values(strategies).map(s => s.strategy));
    if (initialStrategyDefinitions && initialStrategyDefinitions.length > 0) {
      initialStrategyDefinitions.forEach(s => allStrategies.add(s));
      // Respect the saved order
      setEditableStrategies(Array.from(new Set([...initialStrategyDefinitions, ...Array.from(allStrategies)])));
    } else {
      setEditableStrategies(Array.from(allStrategies));
    }
  }, [strategies, initialStrategyDefinitions]);

  const handleAddStrategy = () => {
    if (!newStrategy.trim() || editableStrategies.includes(newStrategy.trim())) {
      setNewStrategy('');
      return;
    }
    setEditableStrategies([...editableStrategies, newStrategy.trim()]);
    setNewStrategy('');
  };

  const handleRemoveStrategy = (strategyToRemove) => {
    setEditableStrategies(editableStrategies.filter(s => s !== strategyToRemove));
  };
  
  const moveStrategy = (index, direction) => {
    const newStrategies = [...editableStrategies];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newStrategies.length) return;
    const [movedItem] = newStrategies.splice(index, 1);
    newStrategies.splice(newIndex, 0, movedItem);
    setEditableStrategies(newStrategies);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const originalStrategiesFromDefs = initialStrategyDefinitions || [];
    const originalStrategiesFromPositions = Object.values(strategies).map(s => s.strategy);
    const originalStrategies = new Set([...originalStrategiesFromDefs, ...originalStrategiesFromPositions]);

    const removedStrategies = [...originalStrategies].filter(s => !editableStrategies.includes(s));
    
    const batch = writeBatch(db);

    if (removedStrategies.length > 0) {
      const tickersToUnassign = Object.entries(strategies)
        .filter(([, s]) => removedStrategies.includes(s.strategy))
        .map(([ticker]) => ticker);

      tickersToUnassign.forEach(ticker => {
        const strategyRef = doc(db, 'users', user.uid, 'strategies', ticker);
        batch.delete(strategyRef);
      });
    }

    const strategyDefinitionsRef = doc(db, 'users', user.uid, 'app-settings', 'strategies');
    batch.set(strategyDefinitionsRef, { definitions: editableStrategies });

    try {
      await batch.commit();
      onClose();
    } catch (error) {
      console.error('Error saving strategies: ', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title="Manage Strategies" onClose={onClose}>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Add New Strategy</h4>
        <div className="flex">
          <input
            type="text"
            value={newStrategy}
            onChange={(e) => setNewStrategy(e.target.value)}
            className="border p-2 rounded-l-md flex-grow"
            placeholder="Enter new strategy name"
          />
          <button
            onClick={handleAddStrategy}
            className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Existing Strategies</h4>
        <ul className="space-y-2 h-64 overflow-y-auto">
          {editableStrategies.map((strategy, index) => (
            <li key={strategy} className="flex justify-between items-center p-2 border rounded-md">
              <span className="flex-grow">{strategy}</span>
              <div className="flex items-center">
                <button
                  onClick={() => moveStrategy(index, 'up')}
                  disabled={index === 0}
                  className="p-1 disabled:opacity-25"
                >
                  <ArrowUpIcon />
                </button>
                <button
                  onClick={() => moveStrategy(index, 'down')}
                  disabled={index === editableStrategies.length - 1}
                  className="p-1 disabled:opacity-25"
                >
                  <ArrowDownIcon />
                </button>
                <button
                  onClick={() => handleRemoveStrategy(strategy)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 ml-2"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          type="button"
          className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          type="button"
          className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  );
};

export default StrategyManager;