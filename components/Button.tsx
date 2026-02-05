import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = ''
}) => {
  const variants = {
    primary: 'bg-coral-red text-white hover:bg-red-500 shadow-coral-red/30',
    secondary: 'bg-sand-yellow text-dark-blue hover:bg-yellow-300 shadow-sand-yellow/30',
    outline: 'border-2 border-dark-blue text-dark-blue hover:bg-dark-blue hover:text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all 
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
