import React from 'react';

const Modal = ({ title, onClose, children }) => {
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
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {children}
      </div>
    </div>
  );
};

export default Modal;
