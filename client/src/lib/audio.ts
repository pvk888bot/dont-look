// Audio definitions and synth generator
// This structure makes it easy to replace 'synth' with 'url' later

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
    answers: ["typing", "typewriter", "keyboard", "writing", "keys"],
    url: "/assets/sounds/Sounds/mechanical-keyboard-typing-sound-effect-hd-379363.mp3",
    placeholderName: "Someone Typing",
  },
  {
    id: 3,
    answers: ["water", "drip", "dripping", "leak", "sink"],
    url: "/assets/sounds/Sounds/dripping-water-one-minute-269871.mp3",
    placeholderName: "Dripping Water",
  },
  {
    id: 4,
    answers: ["printer", "printing", "inkjet", "scanner", "office machine"],
    url: "/assets/sounds/Sounds/printer-startup-32060.mp3",
    placeholderName: "Printer Start-up",
  },
  {
    id: 5,
    answers: ["washer", "washing machine", "laundry", "spinning", "dishwasher", "cycle"],
    url: "/assets/sounds/Sounds/running-dishwasher-71542.mp3",
    placeholderName: "Running Washer",
  },
  {
    id: 6,
    answers: ["train", "subway", "metro", "underground", "transit", "station"],
    url: "/assets/sounds/Sounds/subway-train-enters-station-67317.mp3",
    placeholderName: "Subway Train",
  },
  {
    id: 7,
    answers: ["jet", "plane", "airplane", "aircraft", "takeoff", "engine"],
    url: "/assets/sounds/Sounds/jetplane-289993.mp3",
    placeholderName: "Jet Plane",
  },
  {
    id: 8,
    answers: ["static", "radio", "noise", "interference", "signal", "tuning"],
    url: "/assets/sounds/Sounds/radio-static-323621.mp3",
    placeholderName: "Radio Static",
  },
];

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const stopSound = () => {
  if (currentSource) {
    currentSource.stop();
    currentSource = null;
  }
};

export const playSound = async (level: SoundLevel): Promise<void> => {
  stopSound(); // Stop any currently playing sound

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const response = await fetch(level.url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Volume control - gets quieter as level increases
  const volume = Math.max(0.05, 0.5 - (level.id * 0.05));
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  currentSource = source;
  source.start(0);

  // Duration control - gets shorter as level increases
  const maxDuration = Math.max(2000, 5000 - (level.id * 400));
  const timer = setTimeout(() => {
    if (currentSource === source) {
      stopSound();
    }
  }, maxDuration);

  return new Promise((resolve) => {
    source.onended = () => {
      clearTimeout(timer);
      if (currentSource === source) currentSource = null;
      resolve();
    };
  });
};
