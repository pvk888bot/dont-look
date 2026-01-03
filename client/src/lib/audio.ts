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
    answers: ["dog", "bark", "barking", "hound"],
    url: "/assets/sounds/Sounds/dog-barking-406629.mp3",
    placeholderName: "Dog Barking",
  },
  {
    id: 2,
    answers: ["typing", "typewriter", "keyboard", "someone typing"],
    url: "/assets/sounds/Sounds/mechanical-keyboard-typing-sound-effect-hd-379363.mp3",
    placeholderName: "Someone Typing",
  },
  {
    id: 3,
    answers: ["subway", "train", "metro", "underground"],
    url: "/assets/sounds/Sounds/subway-train-enters-station-67317.mp3",
    placeholderName: "Subway Train",
  },
  {
    id: 4,
    answers: ["dripping", "water", "drip", "leak"],
    url: "/assets/sounds/Sounds/dripping-water-one-minute-269871.mp3",
    placeholderName: "Dripping Water",
  },
  {
    id: 5,
    answers: ["radio", "static", "noise", "interference"],
    url: "/assets/sounds/Sounds/radio-static-323621.mp3",
    placeholderName: "Radio Static",
  },
  {
    id: 6,
    answers: ["printer", "printing", "startup", "office"],
    url: "/assets/sounds/Sounds/printer-startup-32060.mp3",
    placeholderName: "Printer Start-up",
  },
  {
    id: 7,
    answers: ["washer", "washing machine", "laundry", "spinning", "dishwasher"],
    url: "/assets/sounds/Sounds/running-dishwasher-71542.mp3",
    placeholderName: "Running Washer",
  },
  {
    id: 8,
    answers: ["jet", "plane", "airplane", "flight"],
    url: "/assets/sounds/Sounds/jetplane-289993.mp3",
    placeholderName: "Jet Plane",
  },
];

let audioCtx: AudioContext | null = null;

export const playSound = async (level: SoundLevel): Promise<void> => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const response = await fetch(level.url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start(0);

  return new Promise((resolve) => {
    source.onended = () => resolve();
  });
};
