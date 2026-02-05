import { Rank, Suit, Card } from './types';

export const SUITS: Suit[] = ['♥', '♦', '♠', '♣'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  RANKS.forEach((rank) => {
    SUITS.forEach((suit) => {
      deck.push({
        id: `${rank}-${suit}`,
        rank,
        suit,
      });
    });
  });
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Helper to check for books (4 of a kind)
export const checkForBooks = (hand: Card[]): { newHand: Card[]; newBooks: Rank[] } => {
  const rankCounts: Record<string, number> = {};
  hand.forEach((card) => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  const booksFound: Rank[] = [];
  Object.entries(rankCounts).forEach(([rank, count]) => {
    if (count === 4) {
      booksFound.push(rank as Rank);
    }
  });

  if (booksFound.length === 0) {
    return { newHand: hand, newBooks: [] };
  }

  const newHand = hand.filter((card) => !booksFound.includes(card.rank));
  return { newHand, newBooks: booksFound };
};

export const getCardColor = (suit: Suit): string => {
  return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-slate-800';
};
