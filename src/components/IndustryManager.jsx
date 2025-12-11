import React, { useState, useMemo, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, writeBatch, doc, setDoc } from 'firebase/firestore';
import Modal from './Modal';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

const IndustryManager = ({ onClose }) => {
  const { industries, industryDefinitions: initialIndustryDefinitions } = usePortfolio();
  const { user } = useAuth();
  const [newIndustry, setNewIndustry] = useState('');
  const [editableIndustries, setEditableIndustries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const allIndustries = new Set(Object.values(industries).map(s => s.industry));
    if (initialIndustryDefinitions && initialIndustryDefinitions.length > 0) {
      initialIndustryDefinitions.forEach(s => allIndustries.add(s));
      // Respect the saved order
      setEditableIndustries(Array.from(new Set([...initialIndustryDefinitions, ...Array.from(allIndustries)])));
    } else {
      setEditableIndustries(Array.from(allIndustries));
    }
  }, [industries, initialIndustryDefinitions]);

  const handleAddIndustry = () => {
    if (!newIndustry.trim() || editableIndustries.includes(newIndustry.trim())) {
      setNewIndustry('');
      return;
    }
    setEditableIndustries([...editableIndustries, newIndustry.trim()]);
    setNewIndustry('');
  };

  const handleRemoveIndustry = (industryToRemove) => {
    setEditableIndustries(editableIndustries.filter(s => s !== industryToRemove));
  };
  
  const moveIndustry = (index, direction) => {
    const newIndustries = [...editableIndustries];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newIndustries.length) return;
    const [movedItem] = newIndustries.splice(index, 1);
    newIndustries.splice(newIndex, 0, movedItem);
    setEditableIndustries(newIndustries);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const originalIndustriesFromDefs = initialIndustryDefinitions || [];
    const originalIndustriesFromPositions = Object.values(industries).map(s => s.industry);
    const originalIndustries = new Set([...originalIndustriesFromDefs, ...originalIndustriesFromPositions]);

    const removedIndustries = [...originalIndustries].filter(s => !editableIndustries.includes(s));
    
    const batch = writeBatch(db);

    if (removedIndustries.length > 0) {
      const tickersToUnassign = Object.entries(industries)
        .filter(([, s]) => removedIndustries.includes(s.industry))
        .map(([ticker]) => ticker);

      tickersToUnassign.forEach(ticker => {
        const industryRef = doc(db, 'users', user.uid, 'industries', ticker);
        batch.delete(industryRef);
      });
    }

    const industryDefinitionsRef = doc(db, 'users', user.uid, 'app-settings', 'industries');
    batch.set(industryDefinitionsRef, { definitions: editableIndustries });

    try {
      await batch.commit();
      onClose();
    } catch (error) {
      console.error('Error saving industries: ', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title="Manage Industries" onClose={onClose}>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Add New Industry</h4>
        <div className="flex">
          <input
            type="text"
            value={newIndustry}
            onChange={(e) => setNewIndustry(e.target.value)}
            className="border p-2 rounded-l-md flex-grow"
            placeholder="Enter new industry name"
          />
          <button
            onClick={handleAddIndustry}
            className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Existing Industries</h4>
        <ul className="space-y-2 h-64 overflow-y-auto">
          {editableIndustries.map((industry, index) => (
            <li key={industry} className="flex justify-between items-center p-2 border rounded-md">
              <span className="flex-grow">{industry}</span>
              <div className="flex items-center">
                <button
                  onClick={() => moveIndustry(index, 'up')}
                  disabled={index === 0}
                  className="p-1 disabled:opacity-25"
                >
                  <ArrowUpIcon />
                </button>
                <button
                  onClick={() => moveIndustry(index, 'down')}
                  disabled={index === editableIndustries.length - 1}
                  className="p-1 disabled:opacity-25"
                >
                  <ArrowDownIcon />
                </button>
                <button
                  onClick={() => handleRemoveIndustry(industry)}
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

export default IndustryManager;
