import React, { useState } from 'react';

const CollapsibleCard = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <details open={isOpen} onToggle={(e) => setIsOpen(e.target.open)}>
        <summary className="cursor-pointer text-xl font-semibold text-gray-900 mb-4">
          {title}
        </summary>
        {children}
      </details>
    </div>
  );
};

export default CollapsibleCard;
