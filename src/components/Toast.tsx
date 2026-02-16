import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    onClose: (id: string) => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    message,
    onClose,
    duration = 3000,
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <AlertCircle size={20} className="text-red-500" />,
        info: <Info size={20} className="text-blue-500" />,
    };

    const borderColors = {
        success: 'border-green-200',
        error: 'border-red-200',
        info: 'border-blue-200',
    };

    const bgColors = {
        success: 'bg-green-50',
        error: 'bg-red-50',
        info: 'bg-blue-50',
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all animate-in slide-in-from-bottom-5 ${bgColors[type]} ${borderColors[type]}`}
            role="alert"
        >
            {icons[type]}
            <p className="text-sm font-medium text-gray-800">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {children}
        </div>
    );
};
