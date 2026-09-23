import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          Batal
        </button>
        <button type="button" onClick={onConfirm} className="btn-danger">
          Ya, Hapus
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;