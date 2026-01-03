// Audio definitions and system for "Cognitive Confidence Decay"

export type SoundLevel = {
  id: number;
  answers: string[];
  url: string;
  placeholderName: string;
};

export const LEVELS: SoundLevel[] = [
  {
    id: 1,
    answers: ["dog", "bark", "barking", "hound", "animal"],
    url: "/assets/sounds/Sounds/dog-barking-406629.mp3",
    placeholderName: "Dog Barking",
  },
  {
    id: 2,
    answers: ["typing", "typewriter", "keyboard", "keys", "writing"],
    url: "/assets/sounds/Sounds/mechanical-keyboard-typing-sound-effect-hd-379363.mp3",
    placeholderName: "Keyboard Typing",
  },
  {
    id: 3,
    answers: ["water", "drip", "dripping", "leak", "sink", "tap"],
    url: "/assets/sounds/Sounds/dripping-water-one-minute-269871.mp3",
    placeholderName: "Dripping Water",
  },
  {
    id: 4,
    answers: ["printer", "printing", "startup", "office", "inkjet"],
    url: "/assets/sounds/Sounds/printer-startup-32060.mp3",
    placeholderName: "Printer Startup",
  },
  {
    id: 5,
    answers: ["static", "radio", "noise", "interference", "tuning"],
    url: "/assets/sounds/Sounds/radio-static-323621.mp3",
    placeholderName: "Radio Static",
  },
  {
    id: 6,
    answers: ["subway", "train", "metro", "underground", "transit"],
    url: "/assets/sounds/Sounds/subway-train-enters-station-67317.mp3",
    placeholderName: "Subway Arrival",
  },
  {
    id: 7,
    answers: ["washer", "washing machine", "dishwasher", "laundry", "cycle"],
    url: "/assets/sounds/Sounds/running-dishwasher-71542.mp3",
    placeholderName: "Institutional Machine",
  },
  {
    id: 8,
    answers: ["jet", "plane", "airplane", "engine", "flight", "takeoff"],
    url: "/assets/sounds/Sounds/jetplane-289993.mp3",
    placeholderName: "The Singularity",
  },
];

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentNodes: AudioNode[] = [];

// Export audioCtx for Game.tsx to resume on interaction
export const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const stopSound = () => {
  if (currentSource) {
    try { currentSource.stop(); } catch(e) {}
    currentSource = null;
  }
  currentNodes.forEach(node => {
    try { node.disconnect(); } catch(e) {}
  });
  currentNodes = [];
};

export const playSound = async (level: SoundLevel): Promise<void> => {
  stopSound();

  const ctx = getAudioCtx();
  
  // Resume context if suspended (browser policy)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const response = await fetch(level.url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const now = ctx.currentTime;
  
  // Dynamic difficulty scaling based on Level (1-8)
  const volume = Math.max(0.1, 0.5 - (level.id * 0.05));
  const duration = Math.max(2, 6 - (level.id * 0.5));

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  masterGain.connect(ctx.destination);
  currentNodes.push(masterGain);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  const filterFreq = Math.max(400, 20000 - (level.id * 2400));
  filter.frequency.setValueAtTime(filterFreq, now);
  filter.connect(masterGain);
  currentNodes.push(filter);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(filter);
  
  currentSource = source;
  source.start(now);

  return new Promise((resolve) => {
    source.onended = () => {
      stopSound();
      resolve();
    };
    // Force stop after duration if not ended
    setTimeout(() => {
        if (currentSource === source) stopSound();
    }, duration * 1000);
  });
};
