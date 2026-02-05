// Simple synthesizer for game sound effects
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  
  gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
};

export const playCardFlip = () => {
  // Soft pop/click
  playTone(400, 'sine', 0.1, 0, 0.05);
};

export const playMatch = () => {
  // Happy major chord (C E G)
  const now = 0;
  playTone(523.25, 'sine', 0.3, now, 0.1);    // C5
  playTone(659.25, 'sine', 0.3, now + 0.1, 0.1); // E5
  playTone(783.99, 'sine', 0.5, now + 0.2, 0.1); // G5
};

export const playGoFish = () => {
  // Slide down / Bubble sound
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

export const playDraw = () => {
  // Quick sweep
  playTone(800, 'triangle', 0.1, 0, 0.05);
};

export const playWin = () => {
  // Fanfare
  [523.25, 523.25, 523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const timing = i < 3 ? i * 0.15 : 0.45 + (i-3) * 0.2; // Triplets then melody
      playTone(freq, 'square', 0.2, timing, 0.05);
  });
};

export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  
  // Basic emoji stripping to prevent "smiling face with sunglasses" being read out
  const cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

  window.speechSynthesis.cancel(); // Stop any current speech
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.pitch = 1.1; // Slightly higher pitch for a "younger/friendly" vibe
  utterance.rate = 0.9;  // Slightly slower
  utterance.volume = 1.0;
  
  // Try to find a good English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Female')) && v.lang.startsWith('en')
  );
  if (preferredVoice) utterance.voice = preferredVoice;

  window.speechSynthesis.speak(utterance);
};