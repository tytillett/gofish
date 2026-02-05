import React from 'react';
import { Card as CardType } from '../types';
import { getCardColor } from '../constants';

interface CardProps {
  card?: CardType; // If undefined, it's a card back
  onClick?: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CardComponent: React.FC<CardProps> = ({ card, onClick, disabled, isSelected, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-16 text-xs',
    md: 'w-20 h-28 text-base sm:w-24 sm:h-36 sm:text-xl',
    lg: 'w-32 h-48 text-2xl',
  };

  const baseClasses = `
    relative rounded-xl border-2 shadow-md transition-all duration-300 transform
    flex flex-col items-center justify-center select-none
    ${sizeClasses[size]}
  `;

  const stateClasses = disabled
    ? 'cursor-not-allowed opacity-80'
    : 'cursor-pointer hover:-translate-y-2 hover:shadow-lg active:scale-95';
    
  const selectedClasses = isSelected ? 'ring-4 ring-sea-blue -translate-y-4 shadow-xl' : 'border-gray-200';

  if (!card) {
    // Card Back
    return (
      <div className={`${baseClasses} bg-sea-blue border-white`}>
        <div className="w-full h-full bg-opacity-20 bg-white rounded-lg m-1 flex items-center justify-center">
             <span className="text-white text-opacity-50 text-2xl">🐟</span>
        </div>
      </div>
    );
  }

  // Card Front
  const colorClass = getCardColor(card.suit);

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`${baseClasses} bg-white ${selectedClasses} ${stateClasses} ${colorClass}`}
    >
      <div className="absolute top-1 left-2 font-bold">{card.rank}</div>
      <div className="text-3xl sm:text-4xl">{card.suit}</div>
      <div className="absolute bottom-1 right-2 font-bold rotate-180">{card.rank}</div>
    </div>
  );
};

export default CardComponent;
