import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({
  isOpen,
  onClose
}) => {
  // Auto-close the modal after 3 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center relative z-10">
        <div className="flex flex-col items-center">
          <CheckCircle size={48} className="text-blue-600 mb-4" />
          
          <h3 className="text-xl font-bold mb-2">Your transaction is complete</h3>
          
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};