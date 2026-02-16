import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  variant = 'warning',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <div
            className="p-3 rounded-full"
            style={{
              backgroundColor: variant === 'danger' ? 'var(--color-error-100)' : 'var(--color-warning-100)',
            }}
          >
            <AlertTriangle
              size={32}
              style={{
                color: variant === 'danger' ? 'var(--color-error-600)' : 'var(--color-warning-600)',
              }}
            />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h2>

        <p className="text-base mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} className="min-w-[100px]">
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className="min-w-[100px]"
            style={{
              backgroundColor: variant === 'danger' ? 'var(--color-error-600)' : 'var(--color-primary-600)',
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
