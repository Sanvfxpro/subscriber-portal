import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-[var(--color-bg-brand)] text-[var(--color-text-on-brand)] border-transparent hover:bg-[var(--color-bg-brand-hover)] active:bg-[var(--color-bg-brand-active)] focus:ring-[var(--color-border-focus)] disabled:bg-[var(--color-interactive-disabled)] disabled:cursor-not-allowed',
    secondary: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] active:bg-[var(--color-neutral-200)] focus:ring-[var(--color-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-[var(--color-error-500)] text-white border-transparent hover:bg-[var(--color-error-600)] active:bg-[var(--color-error-700)] focus:ring-[var(--color-error-500)] disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-tertiary)] focus:ring-[var(--color-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
