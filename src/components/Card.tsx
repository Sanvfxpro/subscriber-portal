import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, style }) => {
  return (
    <div
      className={`rounded-lg border shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''
        } ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderColor: 'var(--color-border-primary)',
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
