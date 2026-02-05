import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, GameState, Rank } from './types';
import { createDeck, checkForBooks } from './constants';
import CardComponent from './components/CardComponent';
import Button from './components/Button';
import { getComputerMove } from './utils/computerPlayer';
import * as SFX from './utils/soundEffects';

const INITIAL_HAND_SIZE = 5; 

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    player: { id: 'player', name: 'You', hand: [], books: [] },
    computer: { id: 'computer', name: 'Computer', hand: [], books: [] },
    turn: 'player',
    status: 'lobby',
    lastActionMessage: "Welcome to Go Fish!",
    winner: null,
    playerKnownRanks: [],
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [computerChat, setComputerChat] = useState<string>("Hi! Let's play cards!");
  
  // Visual effect state
  const [visualEffect, setVisualEffect] = useState<{ type: 'fish' | 'match' | 'win', text: string } | null>(null);

  // Ref to track previous turn for speech triggers
  const prevTurnRef = useRef<GameState['turn']>('player');

  const triggerVisualEffect = (type: 'fish' | 'match' | 'win', text: string) => {
    setVisualEffect({ type, text });
    setTimeout(() => setVisualEffect(null), 2000);
  };

  const startGame = () => {
    SFX.playCardFlip(); // Init audio context on user gesture
    const newDeck = createDeck();
    const playerHand = newDeck.splice(0, INITIAL_HAND_SIZE);
    const computerHand = newDeck.splice(0, INITIAL_HAND_SIZE);

    const pCheck = checkForBooks(playerHand);
    const cCheck = checkForBooks(computerHand);

    setGameState({
      deck: newDeck,
      player: { 
        id: 'player', 
        name: 'You', 
        hand: pCheck.newHand.sort((a, b) => a.rank.localeCompare(b.rank)), 
        books: pCheck.newBooks 
      },
      computer: { 
        id: 'computer', 
        name: 'Computer', 
        hand: cCheck.newHand, 
        books: cCheck.newBooks 
      },
      turn: 'player',
      status: 'playing',
      lastActionMessage: "Game Started! Tap a card to ask.",
      winner: null,
      playerKnownRanks: [],
    });
    
    prevTurnRef.current = 'player';
    const startMsg = "Good luck! You go first.";
    setComputerChat(startMsg);
    SFX.speakText(startMsg);
  };

  // Helper: Draw card
  const drawCard = (currentDeck: Card[], hand: Card[]): { card: Card | null, newDeck: Card[], newHand: Card[] } => {
    if (currentDeck.length === 0) return { card: null, newDeck: currentDeck, newHand: hand };
    const [card, ...rest] = currentDeck;
    return { card, newDeck: rest, newHand: [...hand, card] };
  };

  // Turn Change Announcement Effect
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    // If turn switched from Computer -> Player
    if (prevTurnRef.current === 'computer' && gameState.turn === 'player') {
      const phrases = [
        "Ok, your turn!",
        "Over to you!",
        "Your turn now!",
        "Oh well, your turn!",
        "You're up!"
      ];
      // Small delay so it doesn't overlap with "Go Fish" or other sounds immediately
      setTimeout(() => {
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        SFX.speakText(phrase);
      }, 500);
    }
    
    prevTurnRef.current = gameState.turn;
  }, [gameState.turn, gameState.status]);

  // Check Game Over
  useEffect(() => {
    if (gameState.status === 'playing') {
      const isDeckEmpty = gameState.deck.length === 0;
      const isPlayerEmpty = gameState.player.hand.length === 0;
      const isComputerEmpty = gameState.computer.hand.length === 0;

      if (isDeckEmpty || isPlayerEmpty || isComputerEmpty) {
        let winner: 'player' | 'computer' | 'tie' = 'tie';
        if (gameState.player.books.length > gameState.computer.books.length) winner = 'player';
        else if (gameState.computer.books.length > gameState.player.books.length) winner = 'computer';

        setGameState(prev => ({ ...prev, status: 'gameover', winner }));
        
        if (winner === 'player') {
            SFX.playWin();
            triggerVisualEffect('win', 'You Won!');
            const msg = "Wow! You are really good!";
            setComputerChat(msg + " 🎉");
            SFX.speakText(msg);
        } else if (winner === 'computer') {
            const msg = "I won this time! Good game!";
            setComputerChat(msg + " 🤖");
            SFX.speakText(msg);
        } else {
            const msg = "It's a tie! We both did great!";
            setComputerChat(msg);
            SFX.speakText(msg);
        }
      }
    }
  }, [gameState.deck.length, gameState.player.hand.length, gameState.computer.hand.length, gameState.status]);

  // Execute Turn Logic (The "Action" Phase)
  const executeTurn = useCallback((asker: 'player' | 'computer', rankRequested: Rank) => {
    setGameState(prev => {
      const isPlayerTurn = asker === 'player';
      const askerState = isPlayerTurn ? prev.player : prev.computer;
      const defenderState = isPlayerTurn ? prev.computer : prev.player;
      
      const matchingCards = defenderState.hand.filter(c => c.rank === rankRequested);
      const hasMatch = matchingCards.length > 0;
      
      let nextDeck = [...prev.deck];
      let nextAskerHand = [...askerState.hand];
      let nextDefenderHand = defenderState.hand.filter(c => c.rank !== rankRequested);
      let message = "";
      let goAgain = false;

      // Update Player Known Ranks Memory
      let nextKnownRanks = [...prev.playerKnownRanks];
      
      if (hasMatch) {
        // MATCH LOGIC
        nextAskerHand = [...nextAskerHand, ...matchingCards];
        message = isPlayerTurn 
          ? `You got ${matchingCards.length} ${rankRequested}s!`
          : `Computer took your ${rankRequested}s.`;
        
        if (isPlayerTurn) {
             triggerVisualEffect('match', 'Got it!'); 
        } else {
             // Computer took cards, player no longer has this rank
             nextKnownRanks = nextKnownRanks.filter(r => r !== rankRequested);
        }
        goAgain = true;

      } else {
        // GO FISH LOGIC
        message = isPlayerTurn ? "You fished..." : "Computer fished...";

        const drawResult = drawCard(nextDeck, nextAskerHand);
        nextDeck = drawResult.newDeck;
        nextAskerHand = drawResult.newHand;
        
        const drawnCard = drawResult.card;
        
        if (drawnCard) {
          if (drawnCard.rank === rankRequested) {
             message += ` and found the ${drawnCard.rank}! Go again!`;
             goAgain = true;
             if (!isPlayerTurn) {
               const msg = "Lucky! I found it!";
               setComputerChat(msg);
               SFX.speakText(msg);
             }
             SFX.playMatch(); // Bonus sound for lucky draw
          } else {
             message += isPlayerTurn ? ` You drew a ${drawnCard.rank}.` : " It drew a card.";
             SFX.playDraw();
          }
        } else {
          message += " Deck is empty.";
        }
      }

      // BOOK CHECK
      const askerBookCheck = checkForBooks(nextAskerHand);
      nextAskerHand = askerBookCheck.newHand;
      const nextAskerBooks = [...askerState.books, ...askerBookCheck.newBooks];

      // If books were made, remove those ranks from memory (since cards are gone from hand)
      if (askerBookCheck.newBooks.length > 0) {
        nextKnownRanks = nextKnownRanks.filter(r => !askerBookCheck.newBooks.includes(r));
        message += ` ${isPlayerTurn ? 'You' : 'Computer'} made a book of ${askerBookCheck.newBooks.join(', ')}s!`;
        if (isPlayerTurn) {
            triggerVisualEffect('win', 'Book Made!');
            SFX.playWin();
        }
      }

      const nextTurn = goAgain ? asker : (asker === 'player' ? 'computer' : 'player');
      
      // SORTING
      nextAskerHand.sort((a, b) => a.rank.localeCompare(b.rank));
      nextDefenderHand.sort((a, b) => a.rank.localeCompare(b.rank));

      return {
        ...prev,
        deck: nextDeck,
        turn: nextTurn,
        playerKnownRanks: nextKnownRanks,
        lastActionMessage: message,
        player: isPlayerTurn 
          ? { ...askerState, hand: nextAskerHand, books: nextAskerBooks }
          : { ...defenderState, hand: nextDefenderHand },
        computer: isPlayerTurn 
          ? { ...defenderState, hand: nextDefenderHand }
          : { ...askerState, hand: nextAskerHand, books: nextAskerBooks }
      };
    });
  }, []);


  // --- PLAYER TURN ORCHESTRATION ---
  const handlePlayerAsk = async (rank: Rank) => {
    if (gameState.turn !== 'player' || isProcessing) return;
    setIsProcessing(true);
    
    // Phase 1: Ask
    SFX.playCardFlip();
    
    // Add to known ranks (using Set to ensure uniqueness, then back to array)
    setGameState(prev => ({
        ...prev, 
        playerKnownRanks: Array.from(new Set([...prev.playerKnownRanks, rank])),
        lastActionMessage: `You ask: "Do you have any ${rank}s?"`
    }));
    await wait(1500);

    // Phase 2: Response check
    const hasMatch = gameState.computer.hand.some(c => c.rank === rank);
    
    if (hasMatch) {
        const msg = "Yes! I have that card.";
        setComputerChat(msg);
        SFX.speakText(msg);
        setGameState(prev => ({...prev, lastActionMessage: `Computer says: "Yes, here you go!"`}));
        SFX.playMatch();
    } else {
        const msg = "Nope! Go Fish!";
        setComputerChat(msg + " 🎣");
        SFX.speakText(msg);
        setGameState(prev => ({...prev, lastActionMessage: `Computer says: "Go Fish!"`}));
        triggerVisualEffect('fish', 'Go Fish!');
        SFX.playGoFish();
    }
    await wait(2000); 

    // Phase 3: Action
    executeTurn('player', rank);
    
    // Phase 4: Cool down
    await wait(2000);
    setIsProcessing(false);
  };


  // --- COMPUTER TURN ORCHESTRATION ---
  useEffect(() => {
    const runComputerTurn = async () => {
      if (gameState.turn === 'computer' && gameState.status === 'playing' && !isProcessing) {
        setIsProcessing(true);

        // Phase 1: Thinking
        await wait(1500);
        
        // Use smart AI with memory
        const move = await getComputerMove(gameState.computer.hand, gameState.playerKnownRanks);
        
        // Phase 2: Ask
        setComputerChat(move.chatMessage);
        SFX.speakText(move.chatMessage);

        SFX.playCardFlip();
        setGameState(prev => ({...prev, lastActionMessage: `Computer asks: "Do you have any ${move.rankToAsk}s?"`}));
        await wait(2000);

        // Phase 3: Response Check
        const hasMatch = gameState.player.hand.some(c => c.rank === move.rankToAsk);
        if (hasMatch) {
             setGameState(prev => ({...prev, lastActionMessage: `You say: "Yes, I do."`}));
             SFX.playMatch();
        } else {
             setGameState(prev => ({...prev, lastActionMessage: `You say: "Go Fish!"`}));
             SFX.playGoFish();
             triggerVisualEffect('fish', 'Go Fish!');
        }
        await wait(2000);

        // Phase 4: Action
        executeTurn('computer', move.rankToAsk);

        // Phase 5: Cool down
        await wait(2000);
        setIsProcessing(false);
      }
    };

    runComputerTurn();
  }, [gameState.turn, gameState.status, isProcessing, gameState.computer.hand, gameState.playerKnownRanks, executeTurn]);

  if (gameState.status === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-8 bg-blue-50">
        <h1 className="text-6xl font-bold text-sea-blue drop-shadow-md">Go Fish!</h1>
        <div className="text-xl text-dark-blue max-w-md">
           Play a fun card game against the Computer. Collect 4 cards of the same number to make a book!
        </div>
        <div className="p-8 bg-white rounded-2xl shadow-xl rotate-3">
             <span className="text-8xl">🃏</span>
        </div>
        <Button onClick={startGame} className="text-2xl px-10 py-4 animate-bounce">
          Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto p-2 sm:p-4 overflow-hidden relative">
      
      {/* Visual Effect Overlay */}
      {visualEffect && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 p-8 rounded-3xl shadow-2xl transform scale-150 animate-pulse border-4 border-sea-blue">
            <h2 className="text-4xl font-bold text-coral-red">{visualEffect.text}</h2>
            <div className="text-6xl text-center mt-2">
                {visualEffect.type === 'fish' && '🎣'}
                {visualEffect.type === 'match' && '✨'}
                {visualEffect.type === 'win' && '🏆'}
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <header className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-4">
        <div className="flex flex-col">
           <span className="text-sm text-gray-500 font-bold">DECK</span>
           <span className="text-2xl text-sea-blue font-bold">{gameState.deck.length} 🃏</span>
        </div>
        <div className="text-center flex-1 mx-4">
             <p className="text-sm text-dark-blue font-medium mt-1 bg-yellow-100 py-2 px-4 rounded-full inline-block shadow-sm">
                {gameState.lastActionMessage}
            </p>
        </div>
        <div className="flex flex-col text-right">
           <Button variant="outline" onClick={() => window.location.reload()} className="text-xs px-3 py-1">Restart</Button>
        </div>
      </header>

      {/* Computer Area */}
      <div className={`flex-1 flex flex-col items-center justify-center relative rounded-3xl border-4 transition-all duration-500 p-4 mb-4
            ${gameState.turn === 'computer' 
                ? 'border-sea-blue bg-blue-100 shadow-lg scale-[1.02] z-10' 
                : 'border-gray-200 bg-gray-100 opacity-40 grayscale scale-95 z-0'
            }`}>
        
        {/* Active Badge */}
        {gameState.turn === 'computer' && (
             <div className="absolute -top-3 right-1/2 translate-x-1/2 bg-sea-blue text-white px-4 py-1 rounded-full text-sm font-bold shadow-md animate-pulse">
                 COMPUTER'S TURN
             </div>
        )}

        {/* Computer Avatar & Chat */}
        <div className="absolute top-2 left-4 flex items-start gap-3 z-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-white transition-colors duration-300 ${gameState.turn === 'computer' ? 'bg-sea-blue' : 'bg-gray-400'}`}>
                🤖
            </div>
            <div className={`bg-white p-3 rounded-2xl rounded-tl-none shadow-md max-w-[200px] sm:max-w-xs border border-gray-100 transition-all ${gameState.turn !== 'computer' ? 'hidden sm:block opacity-50' : 'opacity-100'}`}>
                <p className="text-dark-blue font-medium text-sm sm:text-base">{computerChat}</p>
            </div>
        </div>

        {/* Computer Books */}
        <div className="absolute top-2 right-4 flex flex-col items-end">
            <span className="text-xs font-bold text-gray-500 mb-1">BOOKS</span>
            <div className="flex -space-x-4">
                {gameState.computer.books.map((rank, i) => (
                    <div key={i} className="w-10 h-14 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center text-xs font-bold transform hover:scale-110 transition-transform">
                        {rank}
                    </div>
                ))}
                {gameState.computer.books.length === 0 && <div className="text-gray-400 text-xs italic">None yet</div>}
            </div>
        </div>

        {/* Computer Hand (Backs) */}
        <div className="mt-12 flex -space-x-8 sm:-space-x-4 overflow-visible px-8 py-4">
            {gameState.computer.hand.map((_, index) => (
                <div key={index} className="transform transition-transform duration-300" style={{ zIndex: index }}>
                    <CardComponent size="sm" /> 
                </div>
            ))}
             {gameState.computer.hand.length === 0 && (
                <div className="text-gray-400 italic">No cards left</div>
            )}
        </div>
        <p className="text-gray-500 text-xs mt-2 font-bold">{gameState.computer.hand.length} Cards</p>
      </div>

      {/* Game Over Screen Overlay */}
      {gameState.status === 'gameover' && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md mx-4 animate-bounce-in">
                  <h2 className="text-5xl mb-4">
                      {gameState.winner === 'player' ? '🎉 You Won!' : gameState.winner === 'computer' ? '🤖 Computer Won!' : '🤝 It\'s a Tie!'}
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                      {gameState.winner === 'player' ? 'Great job! You are a Go Fish master!' : 'Better luck next time!'}
                  </p>
                  <div className="flex justify-center gap-8 mb-8">
                      <div className="text-center">
                          <div className="text-4xl font-bold text-sea-blue">{gameState.player.books.length}</div>
                          <div className="text-xs uppercase font-bold text-gray-400">Your Books</div>
                      </div>
                      <div className="text-center">
                          <div className="text-4xl font-bold text-coral-red">{gameState.computer.books.length}</div>
                          <div className="text-xs uppercase font-bold text-gray-400">Computer Books</div>
                      </div>
                  </div>
                  <Button onClick={startGame} className="w-full">Play Again</Button>
              </div>
          </div>
      )}

      {/* Player Area */}
      <div className={`flex-1 flex flex-col justify-end relative rounded-3xl border-4 transition-all duration-500 p-4 
            ${gameState.turn === 'player' 
                ? 'border-coral-red bg-yellow-100 shadow-lg scale-[1.02] z-10' 
                : 'border-gray-200 bg-gray-100 opacity-40 grayscale scale-95 z-0'
            }`}>
         
         {/* Active Badge */}
         {gameState.turn === 'player' && (
             <div className="absolute -top-3 right-1/2 translate-x-1/2 bg-coral-red text-white px-4 py-1 rounded-full text-sm font-bold shadow-md animate-bounce">
                 YOUR TURN
             </div>
        )}

         {/* Player Books */}
         <div className="absolute top-2 left-4 flex flex-col items-start">
            <span className="text-xs font-bold text-gray-500 mb-1">YOUR BOOKS</span>
            <div className="flex -space-x-4">
                {gameState.player.books.map((rank, i) => (
                    <div key={i} className="w-10 h-14 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center text-xs font-bold text-sea-blue transform hover:scale-110 transition-transform">
                        {rank}
                    </div>
                ))}
                 {gameState.player.books.length === 0 && <div className="text-gray-400 text-xs italic">None yet</div>}
            </div>
        </div>

        <div className="text-center mb-2">
            {gameState.turn === 'player' ? (
                <p className="text-coral-red font-bold animate-pulse text-lg">Tap a card to ask Computer!</p>
            ) : (
                <p className="text-gray-500 font-bold">Waiting for Computer...</p>
            )}
        </div>

        {/* Player Hand */}
        <div className="flex justify-center -space-x-6 sm:-space-x-2 overflow-x-auto pb-4 px-2 min-h-[160px]">
            {gameState.player.hand.map((card, index) => {
                return (
                    <div key={card.id} className="transform transition-transform hover:-translate-y-4" style={{ zIndex: index }}>
                        <CardComponent 
                            card={card} 
                            onClick={() => handlePlayerAsk(card.rank)}
                            disabled={gameState.turn !== 'player' || isProcessing}
                            isSelected={false}
                        />
                    </div>
                );
            })}
             {gameState.player.hand.length === 0 && (
                <div className="text-gray-400 italic self-center">No cards left</div>
            )}
        </div>
      </div>
      
    </div>
  );
};

export default App;