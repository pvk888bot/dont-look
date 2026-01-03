// Audio definitions and synth generator
// This structure makes it easy to replace 'synth' with 'url' later

export type SoundLevel = {
  id: number;
  answers: string[]; // Allowed answers (synonyms)
  synth: {
    type: "sine" | "square" | "sawtooth" | "triangle" | "noise";
    freq: number; // Base frequency or seed
    duration: number; // Duration in seconds
    pattern?: "steady" | "pulse" | "slide";
  };
  placeholderName: string; // For debugging/demo purposes
};

export const LEVELS: SoundLevel[] = [
  {
    id: 1,
    answers: ["beep", "tone", "sine", "computer"],
    synth: { type: "sine", freq: 440, duration: 1.5, pattern: "steady" },
    placeholderName: "Simple Beep",
  },
  {
    id: 2,
    answers: ["alarm", "alert", "warning", "siren"],
    synth: { type: "square", freq: 600, duration: 2, pattern: "pulse" },
    placeholderName: "Alarm Pulse",
  },
  {
    id: 3,
    answers: ["wind", "air", "breeze", "whoosh"],
    synth: { type: "noise", freq: 0, duration: 3, pattern: "steady" },
    placeholderName: "White Noise (Wind)",
  },
  {
    id: 4,
    answers: ["phone", "ringing", "telephone", "call"],
    synth: { type: "triangle", freq: 800, duration: 2.5, pattern: "pulse" },
    placeholderName: "Old Phone",
  },
  {
    id: 5,
    answers: ["ufo", "alien", "sci-fi", "spaceship"],
    synth: { type: "sawtooth", freq: 200, duration: 3, pattern: "slide" },
    placeholderName: "Sci-Fi Slide",
  },
  {
    id: 6,
    answers: ["morse", "code", "telegraph", "dots"],
    synth: { type: "sine", freq: 700, duration: 4, pattern: "pulse" },
    placeholderName: "Morse Codeish",
  },
  {
    id: 7,
    answers: ["glitch", "error", "static", "bug"],
    synth: { type: "sawtooth", freq: 100, duration: 1, pattern: "steady" }, // Low grit
    placeholderName: "Digital Glitch",
  },
  {
    id: 8,
    answers: ["silence", "nothing", "void", "quiet"],
    synth: { type: "sine", freq: 0, duration: 2, pattern: "steady" }, // Literally nothing? Or maybe near silent?
    // Let's make it a very high freq barely audible or low rumble for "void"
    // Actually, let's do a low rumble
    placeholderName: "The Void",
  },
];

// Simple Audio Context Synth
let audioCtx: AudioContext | null = null;

export const playSound = async (level: SoundLevel): Promise<void> => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  // Resume context if suspended (browser policy)
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const { type, freq, duration, pattern } = level.synth;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === "noise") {
    // Generate white noise buffer
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.connect(gainNode);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    noise.start(now);
    
    return new Promise((resolve) => {
      setTimeout(resolve, duration * 1000);
    });
  } else {
    osc.type = type;
    
    if (pattern === "steady") {
        if (freq === 0 && type === "sine") {
            // Special case for rumble
             osc.frequency.setValueAtTime(50, now);
        } else {
             osc.frequency.setValueAtTime(freq, now);
        }
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else if (pattern === "pulse") {
        osc.frequency.setValueAtTime(freq, now);
        // pulsing gain
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.setValueAtTime(0, now + 0.2);
        gainNode.gain.setValueAtTime(0.5, now + 0.4);
        gainNode.gain.setValueAtTime(0, now + 0.6);
        gainNode.gain.setValueAtTime(0.5, now + 0.8);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
    } else if (pattern === "slide") {
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 4, now + duration);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
    }

    osc.start(now);
    osc.stop(now + duration);

    return new Promise((resolve) => {
      setTimeout(resolve, duration * 1000);
    });
  }
};
