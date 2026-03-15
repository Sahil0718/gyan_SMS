import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white w-full max-w-md border border-stone-800 shadow-2xl p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl font-serif italic">{title}</h2>
            </div>
            <p className="text-stone-600 mb-8">{message}</p>
            <div className="flex gap-3">
              <button 
                onClick={onConfirm}
                className="flex-1 bg-red-600 text-white py-3 font-medium hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
              <button 
                onClick={onCancel}
                className="flex-1 border border-stone-200 py-3 font-medium hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
