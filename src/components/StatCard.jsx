import React from 'react';

const StatCard = ({ title, icon, primaryValue, primaryValueColor, children }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex-1">
      <div className="flex items-center text-gray-500">
        {icon && <div className="mr-2">{icon}</div>}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="mt-2">
        <p className={`text-2xl font-bold ${primaryValueColor || 'text-gray-800'}`}>
          {primaryValue}
        </p>
        {children}
      </div>
    </div>
  );
};

export default StatCard;
