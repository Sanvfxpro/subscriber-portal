import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-[var(--color-border-error)] focus:ring-[var(--color-error-500)]'
            : 'border-[var(--color-border-primary)] focus:ring-[var(--color-border-focus)]'
        } ${className}`}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
        }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-error)' }}>
          {error}
        </p>
      )}
    </div>
  );
};
