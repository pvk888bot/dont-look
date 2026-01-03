// Audio definitions and synth generator

export type SoundLevel = {
  id: number;
  answers: string[];
  url: string;
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
    answers: ["dog", "bark", "barking", "hound", "animal"],
    url: "/assets/sounds/Sounds/dog-barking-406629.mp3",
    placeholderName: "Dog Barking",
    synthParams: { baseFreq: 400, type: "sawtooth", modFreq: 50, modType: "sine", modDepth: 100, noiseAmount: 0.3, filterFreq: 1500 }
  },
  {
    id: 2,
    answers: ["typing", "typewriter", "keyboard", "writing", "keys"],
    url: "/assets/sounds/Sounds/mechanical-keyboard-typing-sound-effect-hd-379363.mp3",
    placeholderName: "Someone Typing",
    synthParams: { baseFreq: 1200, type: "square", modFreq: 12, modType: "square", modDepth: 500, noiseAmount: 0.5, filterFreq: 4000 }
  },
  {
    id: 3,
    answers: ["subway", "train", "metro", "underground", "transit", "station"],
    url: "/assets/sounds/Sounds/subway-train-enters-station-67317.mp3",
    placeholderName: "Subway Train",
    synthParams: { baseFreq: 80, type: "sawtooth", modFreq: 0.5, modType: "sine", modDepth: 20, noiseAmount: 0.6, filterFreq: 300 }
  },
  {
    id: 4,
    answers: ["dripping", "water", "drip", "leak", "sink"],
    url: "/assets/sounds/Sounds/dripping-water-one-minute-269871.mp3",
    placeholderName: "Dripping Water",
    synthParams: { baseFreq: 2500, type: "sine", modFreq: 2, modType: "sine", modDepth: 2000, noiseAmount: 0.1, filterFreq: 3000, filterQ: 20 }
  },
  {
    id: 5,
    answers: ["radio", "static", "noise", "interference", "signal", "tuning"],
    url: "/assets/sounds/Sounds/radio-static-323621.mp3",
    placeholderName: "Radio Static",
    synthParams: { baseFreq: 0, type: "sine", modFreq: 0, modType: "sine", modDepth: 0, noiseAmount: 0.9, filterFreq: 1200, filterQ: 0.5 }
  },
  {
    id: 6,
    answers: ["printer", "printing", "inkjet", "scanner", "office machine"],
    url: "/assets/sounds/Sounds/printer-startup-32060.mp3",
    placeholderName: "Printer Start-up",
    synthParams: { baseFreq: 600, type: "square", modFreq: 8, modType: "sawtooth", modDepth: 300, noiseAmount: 0.4, filterFreq: 2500 }
  },
  {
    id: 7,
    answers: ["washer", "washing machine", "laundry", "spinning", "dishwasher", "cycle"],
    url: "/assets/sounds/Sounds/running-dishwasher-71542.mp3",
    placeholderName: "Running Washer",
    synthParams: { baseFreq: 150, type: "sine", modFreq: 60, modType: "sine", modDepth: 50, noiseAmount: 0.5, filterFreq: 800 }
  },
  {
    id: 8,
    answers: ["jet", "plane", "airplane", "aircraft", "takeoff", "engine"],
    url: "/assets/sounds/Sounds/jetplane-289993.mp3",
    placeholderName: "Jet Plane",
    synthParams: { baseFreq: 100, type: "sawtooth", modFreq: 0.1, modType: "sine", modDepth: 50, noiseAmount: 0.8, filterFreq: 2000, glide: 500 }
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

  // Load the real sound file
  const response = await fetch(level.url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const { baseFreq, type, modFreq, modType, modDepth, noiseAmount, glide, filterFreq, filterQ } = level.synthParams;
  const now = audioCtx.currentTime;
  const duration = Math.max(2, 5 - (level.id * 0.4));
  
  // Master Gain with Fade Out
  const masterGain = audioCtx.createGain();
  const volume = Math.max(0.05, 0.4 - (level.id * 0.04));
  masterGain.gain.setValueAtTime(volume, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  masterGain.connect(audioCtx.destination);
  currentNodes.push(masterGain);

  // Filter for both synth and sample
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq || 20000, now);
  filter.Q.setValueAtTime(filterQ || 1, now);
  filter.connect(masterGain);
  currentNodes.push(filter);

  // Play the real sample at a lower volume to "obscure" it
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  const sampleGain = audioCtx.createGain();
  sampleGain.gain.setValueAtTime(0.15, now); // More obscured than before
  source.connect(sampleGain);
  sampleGain.connect(filter);
  source.start(now);
  currentSource = source;
  currentNodes.push(source, sampleGain);

  // Layer in the synth "abstractness"
  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(baseFreq || 440, now);
  if (glide) {
    osc.frequency.exponentialRampToValueAtTime(glide, now + duration);
  }

  const mod = audioCtx.createOscillator();
  const modGain = audioCtx.createGain();
  mod.type = modType;
  mod.frequency.setValueAtTime(modFreq, now);
  modGain.gain.setValueAtTime(modDepth, now);
  
  mod.connect(modGain);
  modGain.connect(osc.frequency);
  osc.connect(filter);
  
  osc.start(now);
  mod.start(now);
  osc.stop(now + duration);
  mod.stop(now + duration);
  currentNodes.push(osc, mod, modGain);

  // Extra Noise Layer
  if (noiseAmount > 0) {
    const noiseBufferSize = audioCtx.sampleRate * duration;
    const noiseBuffer = audioCtx.createBuffer(1, noiseBufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(noiseAmount * 0.5, now);
    noise.connect(noiseGain);
    noiseGain.connect(filter);
    noise.start(now);
    currentNodes.push(noise, noiseGain);
  }

  return new Promise((resolve) => {
    source.onended = () => {
      stopSound();
      resolve();
    };
  });
};