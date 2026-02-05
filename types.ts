export type Suit = '♥' | '♦' | '♠' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface PlayerState {
  id: 'player' | 'computer';
  name: string;
  hand: Card[];
  books: Rank[];
}

export interface GameState {
  deck: Card[];
  player: PlayerState;
  computer: PlayerState;
  turn: 'player' | 'computer';
  status: 'lobby' | 'playing' | 'gameover';
  lastActionMessage: string;
  winner: 'player' | 'computer' | 'tie' | null;
  playerKnownRanks: Rank[]; // Ranks the computer knows the player has
}

export interface ComputerMove {
  rankToAsk: Rank;
  chatMessage: string;
}
