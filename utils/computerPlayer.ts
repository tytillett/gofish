import { Card, Rank, ComputerMove } from '../types';

// Logic for Computer Turn
export const getComputerMove = async (
  computerHand: Card[],
  playerKnownRanks: Rank[]
): Promise<ComputerMove> => {
  
  // 1. Analyze Hand
  const rankCounts: Record<string, number> = {};
  computerHand.forEach((card) => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  const distinctRanks = Object.keys(rankCounts) as Rank[];

  // Edge case: No cards (should be handled by game loop, but safety check)
  if (distinctRanks.length === 0) {
    return { 
      rankToAsk: 'A', // Placeholder
      chatMessage: "I'm all out of cards!" 
    };
  }

  // 2. Smart AI Strategy
  // Score each rank based on:
  // - Do we know the player has it? (Huge bonus, guaranteed extra turn)
  // - How many do we have? (More is better, closer to book)
  
  const scoredRanks = distinctRanks.map(rank => {
    let score = 0;
    
    // Base score: more cards = higher chance of book
    score += rankCounts[rank] * 10;
    
    // Memory bonus: we know player has this!
    if (playerKnownRanks.includes(rank)) {
      score += 100;
    }

    // Random noise to keep it from being perfectly predictable
    score += Math.random() * 5;

    return { rank, score };
  });

  // Sort descending by score
  scoredRanks.sort((a, b) => b.score - a.score);

  const selectedRank = scoredRanks[0].rank;
  const isSmartMove = playerKnownRanks.includes(selectedRank);

  // 3. Generate Friendly Message
  let messages = [
    `Do you have any ${selectedRank}s?`,
    `I need some ${selectedRank}s, please!`,
    `I'm fishing for ${selectedRank}s!`,
    `Got any ${selectedRank}s for me?`,
    `Are there any ${selectedRank}s in your hand?`,
    `Hmm... do you have a ${selectedRank}?`
  ];

  // Special messages if the computer is "smart"
  if (isSmartMove) {
    messages = [
      `I know you have a ${selectedRank}! Hand it over!`,
      `I remember you asking for a ${selectedRank}...`,
      `You can't hide that ${selectedRank} from me!`,
      `I think you have a ${selectedRank} for me.`,
    ];
  }
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return {
    rankToAsk: selectedRank,
    chatMessage: randomMessage,
  };
};
