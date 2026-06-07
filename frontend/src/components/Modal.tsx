'use client';

import { ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  children: ReactNode;
  submitText?: string;
  submitVariant?: 'primary' | 'secondary' | 'danger' | 'success';
  isLoading?: boolean;
}

export default function Modal({
  isOpen,
  title,
  onClose,
  onSubmit,
  children,
  submitText = 'Save',
  submitVariant = 'primary',
  isLoading = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {onSubmit && (
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
                Cancel
              </Button>
              <Button
                variant={submitVariant}
                onClick={onSubmit}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M12 2a10 10 0 010 20" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  submitText
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
