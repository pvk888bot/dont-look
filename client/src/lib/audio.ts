// Audio definitions and synth generator
// This structure makes it easy to replace 'synth' with 'url' later

// Complex Synth Generator - No external assets needed
export type SoundLevel = {
  id: number;
  answers: string[];
  placeholderName: string;
  synthParams: {
    baseFreq: number;
    type: OscillatorType;
    modFreq: number;
    modType: OscillatorType;
    modDepth: number;
    noiseAmount: number;
    glide?: number;
    filterFreq?: number;
    filterQ?: number;
  };
};

export const LEVELS: SoundLevel[] = [
  {
    id: 1,
    answers: ["hum", "drone", "electric", "motor", "vibration"],
    placeholderName: "Electric Hum",
    synthParams: { baseFreq: 60, type: "sawtooth", modFreq: 0.5, modType: "sine", modDepth: 5, noiseAmount: 0.1, filterFreq: 400 }
  },
  {
    id: 2,
    answers: ["chirp", "bird", "signal", "digital", "ping"],
    placeholderName: "Digital Chirp",
    synthParams: { baseFreq: 1200, type: "sine", modFreq: 20, modType: "square", modDepth: 100, noiseAmount: 0, glide: 2000 }
  },
  {
    id: 3,
    answers: ["underwater", "bubbles", "submerged", "sonar", "depth"],
    placeholderName: "Sonar Depth",
    synthParams: { baseFreq: 800, type: "sine", modFreq: 0.2, modType: "sine", modDepth: 50, noiseAmount: 0.2, filterFreq: 600, filterQ: 10 }
  },
  {
    id: 4,
    answers: ["machine", "clank", "industrial", "rhythm", "factory"],
    placeholderName: "Industrial Rhythm",
    synthParams: { baseFreq: 100, type: "square", modFreq: 4, modType: "square", modDepth: 50, noiseAmount: 0.3, filterFreq: 1000 }
  },
  {
    id: 5,
    answers: ["wind", "storm", "gale", "void", "howl"],
    placeholderName: "Arctic Wind",
    synthParams: { baseFreq: 0, type: "sine", modFreq: 0.1, modType: "sine", modDepth: 0, noiseAmount: 0.8, filterFreq: 800, filterQ: 1 }
  },
  {
    id: 6,
    answers: ["insect", "buzz", "swarm", "fly", "hive"],
    placeholderName: "Swarm",
    synthParams: { baseFreq: 400, type: "sawtooth", modFreq: 50, modType: "sawtooth", modDepth: 200, noiseAmount: 0.2, filterFreq: 2000 }
  },
  {
    id: 7,
    answers: ["crystal", "shimmer", "resonance", "glass", "echo"],
    placeholderName: "Resonant Crystal",
    synthParams: { baseFreq: 2500, type: "sine", modFreq: 15, modType: "sine", modDepth: 1000, noiseAmount: 0.05, filterFreq: 3000, filterQ: 20 }
  },
  {
    id: 8,
    answers: ["black hole", "gravity", "singularity", "collapse", "crush"],
    placeholderName: "The Singularity",
    synthParams: { baseFreq: 40, type: "sawtooth", modFreq: 0.01, modType: "sine", modDepth: 10, noiseAmount: 0.5, filterFreq: 100, glide: 10 }
  }
];

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentNodes: AudioNode[] = [];

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

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const { baseFreq, type, modFreq, modType, modDepth, noiseAmount, glide, filterFreq, filterQ } = level.synthParams;
  const now = audioCtx.currentTime;
  
  // Master Gain with Fade Out
  const masterGain = audioCtx.createGain();
  const volume = Math.max(0.05, 0.4 - (level.id * 0.04));
  masterGain.gain.setValueAtTime(volume, now);
  
  const duration = Math.max(2, 5 - (level.id * 0.4));
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  masterGain.connect(audioCtx.destination);
  currentNodes.push(masterGain);

  // Main Oscillator
  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(baseFreq || 440, now);
  if (glide) {
    osc.frequency.exponentialRampToValueAtTime(glide, now + duration);
  }

  // FM Modulation
  const mod = audioCtx.createOscillator();
  const modGain = audioCtx.createGain();
  mod.type = modType;
  mod.frequency.setValueAtTime(modFreq, now);
  modGain.gain.setValueAtTime(modDepth, now);
  
  mod.connect(modGain);
  modGain.connect(osc.frequency);
  currentNodes.push(mod, modGain);

  // Filter
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq || 20000, now);
  filter.Q.setValueAtTime(filterQ || 1, now);
  
  osc.connect(filter);
  currentNodes.push(osc, filter);

  // Noise Generator
  if (noiseAmount > 0) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(noiseAmount, now);
    noise.connect(noiseGain);
    noiseGain.connect(filter);
    noise.start(now);
    currentNodes.push(noise, noiseGain);
  }

  filter.connect(masterGain);
  
  osc.start(now);
  osc.stop(now + duration);

  return new Promise((resolve) => {
    osc.onended = () => {
      stopSound();
      resolve();
    };
  });
};
