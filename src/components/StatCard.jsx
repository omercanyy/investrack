import React from 'react';

const StatCard = ({ label, value, type }) => {
  let formattedValue = value;

  if (type === 'currency') {
    formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (type === 'percentage') {
    formattedValue = (value * 100).toFixed(2) + '%';
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-700">{label}</h3>
      <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
    </div>
  );
};

export default StatCard;
